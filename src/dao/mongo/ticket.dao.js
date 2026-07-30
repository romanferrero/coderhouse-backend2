import mongoose from 'mongoose';
import { Ticket } from '../../models/Ticket.js';
import { isDbConnected } from '../../config/db.js';
import { ACTIVE_TICKET_STATUS } from '../../config/ticketStatus.js';

// datos del evento que viajan dentro de "mis tickets". es la lista que pide la
// consigna: lo justo para que el usuario reconozca a que se anoto.
const EVENT_FIELDS = 'title date location';

// datos del inscripto que ve el organizer en el listado de su evento. sin password
// (ademas de que el modelo lo guarda hasheado) y sin el resto del perfil.
const USER_FIELDS = 'first_name last_name email';

// el error de clave duplicada de mongo. lo tira el indice unico parcial de
// (user, event) cuando dos inscripciones identicas entran a la vez.
const DUPLICATE_KEY = 11000;

const dbUnavailable = () => {
    const err = new Error('Base de datos no disponible');
    err.status = 503;
    return err;
};

class TicketDAO {
    // inscribirse necesita persistir si o si: sin base no hay nada que hacer, asi
    // que se avisa con un 503 en lugar de dejar la request en buffer.
    async create(ticketData) {
        if (!isDbConnected()) throw dbUnavailable();

        try {
            const ticket = await Ticket.create(ticketData);
            // el usuario tambien se popula aca (y solo aca): el service necesita su
            // nombre y su email para mandar la confirmacion. es el propio inscripto,
            // no datos de terceros.
            await ticket.populate([
                { path: 'event', select: EVENT_FIELDS },
                { path: 'user', select: USER_FIELDS }
            ]);

            return ticket.toObject();
        } catch (error) {
            // el indice unico se disparo: la validacion del service perdio la
            // carrera contra otra request. se traduce al mismo 409 que devuelve el
            // chequeo previo, asi el cliente ve un error de negocio y no un 500.
            if (error.code === DUPLICATE_KEY) {
                const err = new Error('Ya tenes una inscripcion activa para este evento');
                err.status = 409;
                throw err;
            }

            throw error;
        }
    }

    async getById(id) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) return null;

        return Ticket.findById(id).populate('event', EVENT_FIELDS).lean();
    }

    // tickets del usuario autenticado, con el evento poblado. incluye los
    // cancelados: son parte de su historial.
    async getByUser(userId) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(userId)) return [];

        return Ticket.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('event', EVENT_FIELDS)
            .lean();
    }

    // inscriptos a un evento, para el organizer dueño o el admin.
    async getByEvent(eventId) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(eventId)) return [];

        return Ticket.find({ event: eventId })
            .sort({ createdAt: -1 })
            .populate('user', USER_FIELDS)
            .lean();
    }

    // cupo ocupado de un evento: la SUMA de quantity de los tickets activos, no la
    // cantidad de documentos (un ticket puede reservar varios lugares).
    //
    // los cancelled quedan afuera del match, por eso cancelar libera el cupo solo:
    // no hay que devolverle lugares al evento a mano.
    async countActiveByEvent(eventId) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(eventId)) return 0;

        const [result] = await Ticket.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(String(eventId)), status: { $in: ACTIVE_TICKET_STATUS } } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        // sin inscripciones el aggregate no devuelve ningun grupo: eso son 0 lugares.
        return result?.total ?? 0;
    }

    // busca la inscripcion activa de un usuario en un evento. la usa el service
    // para cortar los duplicados antes de intentar el insert.
    async findActiveByUserAndEvent(userId, eventId) {
        if (!isDbConnected()) return null;
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) return null;

        return Ticket.findOne({
            user: userId,
            event: eventId,
            status: { $in: ACTIVE_TICKET_STATUS }
        }).lean();
    }

    async update(id, data) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) return null;

        return Ticket.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('event', EVENT_FIELDS)
            .lean();
    }

    // a proposito no hay delete: cancelar una inscripcion es pasarla a status
    // 'cancelled', nunca borrarla (se pierde el historial y la trazabilidad del
    // cupo). el borrado fisico no existe en esta capa.
}

export const ticketDAO = new TicketDAO();

export default ticketDAO;

import { ticketsRepository } from '../repositories/tickets.repository.js';
import { eventsService } from './events.service.js';
import { mailService } from './mail.service.js';
import { TicketDTO } from '../dto/ticket.dto.js';
import { httpError } from '../utils/httpError.js';
import { generateReservationCode } from '../utils/reservationCode.js';
import { ROLES } from '../config/roles.js';
import { EVENT_STATUS } from '../config/eventStatus.js';
import { TICKET_STATUS } from '../config/ticketStatus.js';

// si no se manda cantidad, se reserva un lugar.
const DEFAULT_QUANTITY = 1;

// los lugares son enteros y al menos uno: no existe media inscripcion ni una
// inscripcion de 0 lugares.
const parseQuantity = (value) => {
    if (value === undefined || value === null || value === '') return DEFAULT_QUANTITY;

    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw httpError(400, 'La cantidad debe ser un numero entero mayor a 0');
    }

    return quantity;
};

// Capa de negocio de las inscripciones. Habla con el repository (nunca con el DAO
// ni con los modelos) y aca viven TODAS las reglas: estado del evento, fecha,
// cantidad, cupos disponibles, duplicados, propiedad del ticket, reglas de
// cancelacion y el aviso por email. Los controllers y las rutas no validan nada.
//
// Todo lo que sale hacia el controller pasa por TicketDTO.
class TicketsService {
    constructor(repository) {
        this.repository = repository;
    }

    // --- inscripcion --------------------------------------------------------

    // inscribe al usuario autenticado a un evento. el orden de las validaciones no
    // es casual: primero lo que no toca la base (existencia y estado del evento),
    // despues lo que si (duplicado y cupo), y recien al final se crea el ticket.
    async enroll(eventId, data = {}, requester) {
        // si el evento no existe (o el id no es un ObjectId valido) esto ya tira el
        // 404 del events.service: la regla vive en un solo lugar. se pide la entidad
        // completa (no el DTO) porque las reglas de abajo necesitan capacity y
        // status, que son datos del dominio, no de la respuesta.
        const event = await eventsService.findEventOrFail(eventId);

        this.assertEventIsOpen(event);

        const quantity = parseQuantity(data.quantity);

        // una sola inscripcion activa por usuario y evento. si quiere mas lugares,
        // cancela y se anota de nuevo con la cantidad correcta.
        const existing = await this.repository.findActiveEnrollment(requester.id, event._id);
        if (existing) {
            throw httpError(409, 'Ya tenes una inscripcion activa para este evento');
        }

        await this.assertHasCapacity(event, quantity);

        const ticket = await this.repository.createTicket({
            user: requester.id,
            event: event._id,
            quantity,
            status: TICKET_STATUS.CONFIRMED,
            reservationCode: generateReservationCode()
        });

        // el mail va despues de persistir y nunca tira: si el smtp esta caido, la
        // inscripcion ya esta hecha y no se pierde por un problema de notificacion.
        await this.notifyEnrollment(ticket, event, requester);

        return TicketDTO.from(ticket);
    }

    // avisa por email al inscripto. el nombre y el mail salen del usuario poblado
    // en el ticket; si por lo que sea no vinieron, se cae al dato de la sesion.
    async notifyEnrollment(ticket, event, requester) {
        const user = ticket.user ?? {};
        const to = user.email ?? requester.email;
        if (!to) return;

        await mailService.sendTicketConfirmation({
            to,
            name: user.first_name ?? to,
            event,
            ticket
        });
    }

    // --- consultas ----------------------------------------------------------

    // tickets del usuario autenticado, con el evento poblado (title, date,
    // location). el id sale de la sesion, nunca de la url: asi nadie puede pedir
    // los tickets de otro cambiando un parametro.
    async getMyTickets(requester) {
        return TicketDTO.fromMany(await this.repository.findByUser(requester.id));
    }

    // inscriptos a un evento. lo ve el admin (cualquier evento) o el organizer
    // dueño del evento: la regla de propiedad se reusa del events.service, que ya
    // decide quien puede gestionar que (404 si no existe, 403 si es ajeno).
    async getEventTickets(eventId, requester) {
        const event = await eventsService.findEventOrFail(eventId);
        eventsService.assertCanManage(event, requester);

        return TicketDTO.fromMany(await this.repository.findByEvent(event._id));
    }

    // --- cancelacion --------------------------------------------------------

    // cancela una inscripcion: cambia el estado y sella cancelledAt. NO borra el
    // documento, asi queda el historial. como el calculo de cupo solo suma tickets
    // activos, el lugar se libera solo con este cambio de estado.
    async cancelTicket(ticketId, requester) {
        const ticket = await this.findTicketOrFail(ticketId);
        this.assertCanManageTicket(ticket, requester);

        // cancelled es terminal: no se cancela dos veces ni se revive.
        if (ticket.status === TICKET_STATUS.CANCELLED) {
            throw httpError(409, 'La inscripcion ya estaba cancelada');
        }

        // el "como" de la cancelacion (status + cancelledAt, sin borrar nada) vive
        // en el repository; el "si se puede" es esta decision de negocio.
        return TicketDTO.from(await this.repository.cancelTicket(ticket._id));
    }

    // busca la inscripcion como entidad de dominio, para poder decidir sobre ella
    // (dueño, estado). el 404 sale de aca y no del controller: es una regla del
    // dominio ("esa inscripcion no existe").
    async findTicketOrFail(id) {
        const ticket = await this.repository.findById(id);
        if (!ticket) {
            throw httpError(404, 'Inscripcion no encontrada');
        }

        return ticket;
    }

    // --- reglas reutilizables -----------------------------------------------

    // a que eventos se puede uno anotar. el orden importa: primero se avisa el
    // motivo puntual (cancelado / finalizado) y recien despues el generico, asi el
    // mensaje explica que paso en vez de un "no esta publicado" sin contexto.
    assertEventIsOpen(event) {
        if (event.status === EVENT_STATUS.CANCELLED) {
            throw httpError(409, 'El evento fue cancelado: no admite inscripciones');
        }

        if (event.status === EVENT_STATUS.FINISHED) {
            throw httpError(409, 'El evento ya finalizo: no admite inscripciones');
        }

        // un evento en draft todavia no es publico: no deberia recibir inscriptos.
        if (event.status !== EVENT_STATUS.PUBLISHED) {
            throw httpError(409, 'El evento no esta publicado: no admite inscripciones');
        }

        // puede seguir en published pero con la fecha ya cumplida (nadie lo paso a
        // finished todavia). igual esta cerrado.
        if (new Date(event.date).getTime() <= Date.now()) {
            throw httpError(409, 'El evento ya ocurrio: no admite inscripciones');
        }
    }

    // control de cupos. los lugares ocupados son la SUMA de quantity de los tickets
    // activos: los cancelled no cuentan, por eso una cancelacion libera el cupo sin
    // tocar nada mas. el mensaje incluye cuantos lugares quedan para que el cliente
    // pueda reintentar con una cantidad que entre.
    async assertHasCapacity(event, quantity) {
        const taken = await this.repository.countActiveTickets(event._id);
        const available = event.capacity - taken;

        if (available <= 0) {
            throw httpError(409, 'El evento no tiene cupos disponibles');
        }

        if (quantity > available) {
            throw httpError(409, `Cupos insuficientes: quedan ${available} lugares y pediste ${quantity}`);
        }
    }

    // quien puede tocar una inscripcion: su dueño o el admin. cualquier otro caso
    // es un 403 sobre ese ticket puntual (no un 404, que ya se descarto antes).
    assertCanManageTicket(ticket, requester) {
        if (requester.role === ROLES.ADMIN) return;

        // sin populate el user viene como ObjectId, con populate como objeto:
        // sacamos el id de los dos casos antes de comparar.
        const ownerId = String(ticket.user?._id ?? ticket.user);
        if (ownerId === String(requester.id)) return;

        throw httpError(403, 'No podes gestionar una inscripcion que no te pertenece');
    }
}

export const ticketsService = new TicketsService(ticketsRepository);

export default ticketsService;

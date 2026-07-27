import mongoose from 'mongoose';
import { Event } from '../../models/Event.js';
import { isDbConnected } from '../../config/db.js';

// datos del organizador que se devuelven junto al evento. el password nunca esta
// en la lista (ademas de que el modelo lo guarda hasheado).
const ORGANIZER_FIELDS = 'first_name last_name email role';

// escapa los caracteres especiales de una regex asi un '.' o un '*' que escriba
// el usuario se busca literal y no se interpreta como patron.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// traduce los filtros que ya valido el service a una query de mongo. aca no se
// valida nada: llega todo limpio y tipado.
const buildQuery = ({ status, category, location, dateFrom, dateTo } = {}) => {
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    // la ubicacion matchea parcial e ignorando mayusculas: 'palermo' encuentra
    // 'Parque Palermo'.
    if (location) query.location = { $regex: escapeRegex(location), $options: 'i' };

    if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = dateFrom;
        if (dateTo) query.date.$lte = dateTo;
    }

    return query;
};

class EventDAO {
    // sin conexion se devuelve una pagina vacia en lugar de consultar: mongoose
    // dejaria la query en buffer hasta agotar el timeout y la request colgaria.
    async getPaginated({ filter, sort, page, limit }) {
        if (!isDbConnected()) return { docs: [], total: 0 };

        const query = buildQuery(filter);

        // el count va en paralelo con la pagina: son dos consultas independientes,
        // no tiene sentido pagarlas en serie.
        const [docs, total] = await Promise.all([
            Event.find(query)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('organizer', ORGANIZER_FIELDS)
                .lean(),
            Event.countDocuments(query)
        ]);

        return { docs, total };
    }

    // un id con formato invalido directamente no existe: cortamos antes para que
    // findById no tire un CastError que terminaria en 500 en vez del 404 que toca.
    async getById(id) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) return null;

        return Event.findById(id).populate('organizer', ORGANIZER_FIELDS).lean();
    }

    // Crear necesita persistir si o si: sin base no hay nada que hacer, asi que
    // se avisa con un 503 en lugar de dejar la request en buffer.
    async create(eventData) {
        if (!isDbConnected()) {
            const err = new Error('Base de datos no disponible');
            err.status = 503;
            throw err;
        }

        const event = await Event.create(eventData);
        // populamos el organizador para que la respuesta del POST tenga la misma
        // forma que la del GET.
        await event.populate('organizer', ORGANIZER_FIELDS);

        return event.toObject();
    }

    // runValidators para que al actualizar tambien se respeten las reglas del
    // schema (ej: capacity >= 1). new: true devuelve el documento ya actualizado.
    async update(id, data) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) return null;

        return Event.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('organizer', ORGANIZER_FIELDS)
            .lean();
    }

    // a proposito no hay delete: cancelar un evento es pasarlo a status
    // 'cancelled', nunca borrarlo de la base (se pierde el historial y las
    // inscripciones que cuelgan de el).
}

export const eventDAO = new EventDAO();

export default eventDAO;

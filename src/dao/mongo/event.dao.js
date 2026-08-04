import mongoose from 'mongoose';
import { Event } from '../../models/Event.js';
import { isDbConnected } from '../../config/db.js';
import { httpError } from '../../utils/httpError.js';

// datos del organizador que se traen junto al evento. el password nunca esta en la
// lista, y ademas el EventDTO vuelve a filtrar del otro lado: el select ahorra
// datos en la red, el DTO garantiza que no salgan por la api.
const ORGANIZER_FIELDS = 'first_name last_name email role';

// escapa los caracteres especiales de una regex asi un '.' o un '*' que escriba
// el usuario se busca literal y no se interpreta como patron.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// traduce los filtros de dominio que ya valido el service a una query de mongo.
// aca no se valida nada: llega todo limpio y tipado. los operadores de mongo
// ($regex, $gte, $lte) viven de este lado y no se filtran hacia el repository.
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

// Acceso a datos de eventos. Solo persistencia: buscar, contar, crear y actualizar.
// Quien decide cuantos documentos saltear o que significa "una pagina" es el
// repository, que compone find + count.
class EventDAO {
    // sin conexion se devuelve una lista vacia en lugar de consultar: mongoose
    // dejaria la query en buffer hasta agotar el timeout y la request colgaria.
    async find({ filter, sort, skip = 0, limit } = {}) {
        if (!isDbConnected()) return [];

        return Event.find(buildQuery(filter))
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('organizer', ORGANIZER_FIELDS)
            .lean();
    }

    async count(filter) {
        if (!isDbConnected()) return 0;

        return Event.countDocuments(buildQuery(filter));
    }

    // un id con formato invalido directamente no existe: cortamos antes para que
    // findById no tire un CastError que terminaria en 500 en vez del 404 que toca.
    async findById(id) {
        if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) return null;

        return Event.findById(id).populate('organizer', ORGANIZER_FIELDS).lean();
    }

    // Crear necesita persistir si o si: sin base no hay nada que hacer, asi que
    // se avisa con un 503 en lugar de dejar la request en buffer.
    async create(eventData) {
        if (!isDbConnected()) throw httpError(503, 'Base de datos no disponible');

        const event = await Event.create(eventData);
        // populamos el organizador para que la respuesta del POST tenga la misma
        // forma que la del GET.
        await event.populate('organizer', ORGANIZER_FIELDS);

        return event.toObject();
    }

    // runValidators para que al actualizar tambien se respeten las reglas del
    // schema (ej: capacity >= 1). new: true devuelve el documento ya actualizado.
    async updateById(id, data) {
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

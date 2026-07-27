import { Event } from '../../models/Event.js';
import { isDbConnected } from '../../config/db.js';

class EventDAO {
    // Sin conexion se devuelve la lista vacia en lugar de consultar: mongoose
    // dejaria la query en buffer hasta agotar el timeout y la request colgaria.
    async getAll() {
        if (!isDbConnected()) return [];

        return Event.find().lean();
    }

    async getById(id) {
        if (!isDbConnected()) return null;

        return Event.findById(id).lean();
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
        return event.toObject();
    }

    // runValidators para que al actualizar tambien se respeten las reglas del
    // schema (ej: capacity >= 1). new: true devuelve el documento ya actualizado.
    async update(id, data) {
        if (!isDbConnected()) return null;

        return Event.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
    }

    async deleteById(id) {
        if (!isDbConnected()) return null;

        return Event.findByIdAndDelete(id).lean();
    }
}

export const eventDAO = new EventDAO();

export default eventDAO;

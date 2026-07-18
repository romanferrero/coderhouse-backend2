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
}

export const eventDAO = new EventDAO();

export default eventDAO;

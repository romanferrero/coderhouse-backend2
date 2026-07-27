import { eventDAO } from '../dao/mongo/event.dao.js';

// Aisla al service de la fuente de datos: si el DAO cambia de mongo a otra
// persistencia, solo se toca esta capa.
class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    // no hay un getAll() a proposito: el listado siempre pasa por paginacion.
    async getPaginated(options) {
        return this.dao.getPaginated(options);
    }

    async getById(id) {
        return this.dao.getById(id);
    }

    async create(eventData) {
        return this.dao.create(eventData);
    }

    async update(id, data) {
        return this.dao.update(id, data);
    }
}

export const eventsRepository = new EventsRepository(eventDAO);

export default eventsRepository;

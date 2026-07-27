import { eventDAO } from '../dao/mongo/event.dao.js';

// Aisla al service de la fuente de datos: si el DAO cambia de mongo a otra
// persistencia, solo se toca esta capa.
class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getAll() {
        return this.dao.getAll();
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

    async delete(id) {
        return this.dao.deleteById(id);
    }
}

export const eventsRepository = new EventsRepository(eventDAO);

export default eventsRepository;

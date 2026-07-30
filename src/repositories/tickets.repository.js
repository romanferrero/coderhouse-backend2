import { ticketDAO } from '../dao/mongo/ticket.dao.js';

// Aisla al service de la fuente de datos: si el DAO cambia de mongo a otra
// persistencia, solo se toca esta capa.
class TicketsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async create(ticketData) {
        return this.dao.create(ticketData);
    }

    async getById(id) {
        return this.dao.getById(id);
    }

    async getByUser(userId) {
        return this.dao.getByUser(userId);
    }

    async getByEvent(eventId) {
        return this.dao.getByEvent(eventId);
    }

    // lugares ya ocupados de un evento (solo tickets activos).
    async countActiveByEvent(eventId) {
        return this.dao.countActiveByEvent(eventId);
    }

    async findActiveByUserAndEvent(userId, eventId) {
        return this.dao.findActiveByUserAndEvent(userId, eventId);
    }

    async update(id, data) {
        return this.dao.update(id, data);
    }
}

export const ticketsRepository = new TicketsRepository(ticketDAO);

export default ticketsRepository;

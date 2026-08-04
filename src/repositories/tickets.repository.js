import { ticketDAO } from '../dao/mongo/ticket.dao.js';
import { TICKET_STATUS } from '../config/ticketStatus.js';

// Capa intermedia entre el service y el DAO. Los nombres son los del dominio
// ("cuantos lugares hay tomados", "cancelame esta inscripcion") y el DAO se queda
// con el como. No importa modelos de mongoose.
class TicketsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async createTicket(ticketData) {
        return this.dao.create(ticketData);
    }

    async findById(id) {
        return this.dao.findById(id);
    }

    // historial completo de un inscripto, cancelados incluidos.
    async findByUser(userId) {
        return this.dao.findByUser(userId);
    }

    async findByEvent(eventId) {
        return this.dao.findByEvent(eventId);
    }

    // lugares ya ocupados de un evento. son los de los tickets ACTIVOS: que un
    // cancelado no cuente es justamente lo que hace que cancelar libere el cupo.
    async countActiveTickets(eventId) {
        return this.dao.countActiveQuantityByEvent(eventId);
    }

    // la inscripcion activa de un usuario en un evento, o null. la usa el service
    // para cortar los duplicados.
    async findActiveEnrollment(userId, eventId) {
        return this.dao.findActiveByUserAndEvent(userId, eventId);
    }

    // cancelar es un cambio de estado con su sello de fecha, no un borrado: el
    // documento queda en la base y sigue apareciendo en el historial. si se puede o
    // no cancelar (dueño, estado terminal) lo decide el service.
    async cancelTicket(id) {
        return this.dao.updateById(id, {
            status: TICKET_STATUS.CANCELLED,
            cancelledAt: new Date()
        });
    }
}

export const ticketsRepository = new TicketsRepository(ticketDAO);

export default ticketsRepository;

import { UserRefDTO } from './user.dto.js';
import { EventRefDTO } from './event.dto.js';

// inscripcion tal como la ve el cliente. las dos referencias (usuario y evento)
// pasan por su propio DTO: si vinieron pobladas se filtran campo por campo —el
// password del inscripto no sale nunca— y si no, queda el id.
export class TicketDTO {
    constructor(ticket) {
        this._id = String(ticket._id);
        this.user = UserRefDTO.from(ticket.user);
        this.event = EventRefDTO.from(ticket.event);
        this.quantity = ticket.quantity;
        this.status = ticket.status;
        this.reservationCode = ticket.reservationCode;
        this.cancelledAt = ticket.cancelledAt;
        this.createdAt = ticket.createdAt;
        this.updatedAt = ticket.updatedAt;
    }

    static from(ticket) {
        return ticket ? new TicketDTO(ticket) : null;
    }

    static fromMany(tickets = []) {
        return tickets.map((ticket) => new TicketDTO(ticket));
    }
}

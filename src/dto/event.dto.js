import { UserRefDTO } from './user.dto.js';

// evento tal como lo ve el cliente. es una whitelist: los campos internos del
// documento (__v y cualquier cosa que se sume al schema a futuro) quedan afuera
// salvo que se agreguen aca a proposito.
export class EventDTO {
    constructor(event) {
        this._id = String(event._id);
        this.title = event.title;
        this.description = event.description;
        this.category = event.category;
        this.date = event.date;
        this.location = event.location;
        this.capacity = event.capacity;
        this.price = event.price;
        this.status = event.status;
        // el organizador es un usuario: pasa por su propio DTO, asi el populate
        // nunca arrastra el password ni el resto del perfil.
        this.organizer = UserRefDTO.from(event.organizer, { withRole: true });
        this.createdAt = event.createdAt;
        this.updatedAt = event.updatedAt;
    }

    static from(event) {
        return event ? new EventDTO(event) : null;
    }

    static fromMany(events = []) {
        return events.map((event) => new EventDTO(event));
    }
}

// evento embebido dentro de un ticket: lo justo para que el inscripto reconozca a
// que se anoto (titulo, cuando y donde). nada de capacidad, precio ni organizador.
export class EventRefDTO {
    constructor(event) {
        this._id = String(event._id);
        this.title = event.title;
        this.date = event.date;
        this.location = event.location;
    }

    static from(event) {
        if (!event) return null;
        // igual que con el usuario: sin populate queda la referencia pelada.
        if (event.title === undefined) return String(event);

        return new EventRefDTO(event);
    }
}

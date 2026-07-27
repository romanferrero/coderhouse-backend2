import { eventsRepository } from '../repositories/events.repository.js';
import { httpError } from '../utils/httpError.js';
import { ROLES } from '../config/roles.js';

// campos minimos que necesita un evento para crearse. la validacion fina (tipos,
// capacity >= 1) la refuerza el schema; aca cortamos temprano con un 400 claro
// en vez de dejar que reviente mongoose con un 500.
const REQUIRED_FIELDS = ['title', 'description', 'discipline', 'venue', 'date', 'capacity'];

// Capa de negocio. Ademas de delegar en el repository, aca vive el chequeo de
// propiedad de los eventos (quien puede modificar/cancelar que).
class EventsService {
    constructor(repository) {
        this.repository = repository;
    }

    async getEvents() {
        return this.repository.getAll();
    }

    async getEventById(id) {
        return this.repository.getById(id);
    }

    // crea el evento y lo deja asociado al organizer que lo publico (requester).
    // el rol ya lo filtro el middleware authorize; aca solo validamos los datos
    // y fijamos el dueño.
    async createEvent(data = {}, requester) {
        const missing = REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === '');
        if (missing.length > 0) {
            throw httpError(400, `Faltan campos obligatorios: ${missing.join(', ')}`);
        }

        return this.repository.create({
            title: data.title,
            description: data.description,
            discipline: data.discipline,
            venue: data.venue,
            date: data.date,
            capacity: data.capacity,
            organizer: requester.id
        });
    }

    // modifica un evento existente respetando la propiedad: el organizer solo
    // toca lo suyo, el admin cualquiera. si no existe es 404, si no le pertenece
    // es 403 (no un 500 generico).
    async updateEvent(id, data = {}, requester) {
        const event = await this.repository.getById(id);
        if (!event) {
            throw httpError(404, 'Evento no encontrado');
        }

        this.assertCanManage(event, requester);

        return this.repository.update(id, data);
    }

    // cancela (elimina) un evento con la misma regla de propiedad que el update.
    async deleteEvent(id, requester) {
        const event = await this.repository.getById(id);
        if (!event) {
            throw httpError(404, 'Evento no encontrado');
        }

        this.assertCanManage(event, requester);

        return this.repository.delete(id);
    }

    // regla de propiedad reutilizada por update y delete. el admin gestiona
    // cualquier evento; el organizer, solo los que creo el. cualquier otro caso
    // es un 403 sobre ese recurso puntual.
    assertCanManage(event, requester) {
        if (requester.role === ROLES.ADMIN) return;

        const ownerId = String(event.organizer);
        if (requester.role === ROLES.ORGANIZER && ownerId === String(requester.id)) return;

        throw httpError(403, 'No podes gestionar un evento que no te pertenece');
    }
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;

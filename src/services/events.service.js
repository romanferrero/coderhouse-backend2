import { eventsRepository } from '../repositories/events.repository.js';

// Capa de negocio. Hoy delega en el repository; aca van a vivir las reglas de
// inscripcion y control de cupos de las proximas entregas.
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
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;

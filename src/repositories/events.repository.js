import { eventDAO } from '../dao/mongo/event.dao.js';
import { EVENT_STATUS } from '../config/eventStatus.js';

// Capa intermedia entre el service y el DAO. Expone operaciones del dominio
// (paginar el catalogo, cambiar el estado, cancelar) y compone con el DAO las que
// necesitan mas de una consulta. No importa modelos de mongoose.
class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    // no hay un findAll() a proposito: el listado siempre pasa por paginacion.
    //
    // aca se traduce "pagina N" a un skip y se arma el sobre con el total. el count
    // va en paralelo con la pagina: son dos consultas independientes, no tiene
    // sentido pagarlas en serie.
    async findPaginated({ filter, sort, page, limit }) {
        const [docs, total] = await Promise.all([
            this.dao.find({ filter, sort, skip: (page - 1) * limit, limit }),
            this.dao.count(filter)
        ]);

        return { docs, total };
    }

    async findById(id) {
        return this.dao.findById(id);
    }

    async createEvent(eventData) {
        return this.dao.create(eventData);
    }

    async updateEvent(id, changes) {
        return this.dao.updateById(id, changes);
    }

    // el estado tiene su propia operacion porque es un cambio con sentido propio en
    // el dominio, distinto de editar los datos del evento. que transiciones son
    // validas lo decide el service.
    async changeStatus(id, status) {
        return this.dao.updateById(id, { status });
    }

    // cancelar no borra: es pasar el evento a 'cancelled'. el DAO ni siquiera
    // expone un delete.
    async cancelEvent(id) {
        return this.changeStatus(id, EVENT_STATUS.CANCELLED);
    }
}

export const eventsRepository = new EventsRepository(eventDAO);

export default eventsRepository;

import { eventsRepository } from '../repositories/events.repository.js';
import { EventDTO } from '../dto/event.dto.js';
import { httpError } from '../utils/httpError.js';
import { ROLES } from '../config/roles.js';
import { EVENT_STATUS, EVENT_STATUS_VALUES } from '../config/eventStatus.js';

// campos minimos que necesita un evento para crearse. 'organizer' no esta en la
// lista a proposito: sale de la sesion, nunca del body. 'price' tampoco, porque
// si no viene el evento es gratis.
const REQUIRED_FIELDS = ['title', 'description', 'category', 'date', 'location', 'capacity'];

// al crear solo tiene sentido arrancar en borrador o publicado: nadie crea un
// evento que ya esta cancelado o finalizado.
const CREATABLE_STATUS = [EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED];

// campos por los que se puede ordenar el listado. es una whitelist para que nadie
// ordene por un campo interno ni cuelgue operadores raros en el sort.
const SORTABLE_FIELDS = ['date', 'price', 'capacity', 'title', 'createdAt'];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
// techo duro: sin esto un ?limit=999999 se lleva la coleccion entera de una.
const MAX_LIMIT = 100;

// --- validadores de campo -------------------------------------------------
// devuelven el valor ya normalizado o cortan con un 400 explicando que esta mal.

const parseText = (value, field) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw httpError(400, `El campo ${field} debe ser un texto no vacio`);
    }

    return value.trim();
};

const parseDate = (value, field) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw httpError(400, `El campo ${field} no es una fecha valida`);
    }

    return date;
};

// un evento se organiza para adelante: ni al crear ni al reprogramar se acepta
// una fecha que ya paso.
const parseFutureDate = (value) => {
    const date = parseDate(value, 'date');
    if (date.getTime() <= Date.now()) {
        throw httpError(400, 'La fecha del evento no puede ser pasada');
    }

    return date;
};

// la capacidad son butacas: entero y al menos una.
const parseCapacity = (value) => {
    const capacity = Number(value);
    if (!Number.isInteger(capacity) || capacity <= 0) {
        throw httpError(400, 'La capacidad debe ser un numero entero mayor a 0');
    }

    return capacity;
};

const parsePrice = (value) => {
    const price = Number(value);
    if (!Number.isFinite(price)) {
        throw httpError(400, 'El precio debe ser un numero');
    }
    if (price < 0) {
        throw httpError(400, 'El precio no puede ser negativo');
    }

    return price;
};

// allowed se acota al crear (solo draft/published); en el resto valen los cuatro.
const parseStatus = (value, allowed = EVENT_STATUS_VALUES) => {
    if (typeof value !== 'string' || !allowed.includes(value)) {
        throw httpError(400, `El estado debe ser uno de: ${allowed.join(', ')}`);
    }

    return value;
};

// un solo lugar con el parser de cada campo, reutilizado al crear y al editar,
// asi las reglas no se duplican ni se desincronizan entre los dos flujos.
const FIELD_PARSERS = {
    title: (value) => parseText(value, 'title'),
    description: (value) => parseText(value, 'description'),
    category: (value) => parseText(value, 'category').toLowerCase(),
    location: (value) => parseText(value, 'location'),
    date: parseFutureDate,
    capacity: parseCapacity,
    price: parsePrice
};

// --- armado del listado ---------------------------------------------------

const parsePositiveInt = (value, field, fallback) => {
    if (value === undefined || value === '') return fallback;

    const num = Number(value);
    if (!Number.isInteger(num) || num < 1) {
        throw httpError(400, `El campo ${field} debe ser un numero entero mayor a 0`);
    }

    return num;
};

// acepta sort=date (ascendente) y sort=-date (descendente), la misma convencion
// que usa mongoose.
const parseSort = (value) => {
    if (value === undefined || value === '') return { date: 1 };

    const descending = value.startsWith('-');
    const field = descending ? value.slice(1) : value;

    if (!SORTABLE_FIELDS.includes(field)) {
        throw httpError(400, `Solo se puede ordenar por: ${SORTABLE_FIELDS.join(', ')}`);
    }

    return { [field]: descending ? -1 : 1 };
};

// pasa la query string a filtros/orden/paginacion ya validados. si algo viene mal
// se corta con 400 antes de tocar la base, y el DAO recibe datos confiables.
const buildListOptions = (query = {}) => {
    const filter = {};

    if (query.status !== undefined) filter.status = parseStatus(query.status);
    if (query.category !== undefined) filter.category = parseText(query.category, 'category').toLowerCase();
    if (query.location !== undefined) filter.location = parseText(query.location, 'location');
    if (query.dateFrom !== undefined) filter.dateFrom = parseDate(query.dateFrom, 'dateFrom');
    if (query.dateTo !== undefined) filter.dateTo = parseDate(query.dateTo, 'dateTo');

    // un rango al reves siempre devolveria vacio: mejor avisar que esta mal armado.
    if (filter.dateFrom && filter.dateTo && filter.dateFrom > filter.dateTo) {
        throw httpError(400, 'dateFrom no puede ser posterior a dateTo');
    }

    return {
        filter,
        sort: parseSort(query.sort),
        page: parsePositiveInt(query.page, 'page', DEFAULT_PAGE),
        limit: Math.min(parsePositiveInt(query.limit, 'limit', DEFAULT_LIMIT), MAX_LIMIT)
    };
};

// Capa de negocio. Habla siempre con el repository (nunca con el DAO ni con los
// modelos) y aca viven todas las reglas del dominio: fechas, estados validos,
// capacidad, precio y el chequeo de propiedad de los eventos (quien puede
// modificar/cancelar que). Los controllers y las rutas no validan nada de esto.
//
// Todo lo que sale hacia el controller pasa por EventDTO: la api no devuelve
// documentos crudos de la base.
class EventsService {
    constructor(repository) {
        this.repository = repository;
    }

    // listado publico con filtros, orden y paginacion. devuelve el sobre completo
    // (data + metadata) asi el controller no calcula nada.
    async getEvents(query = {}) {
        const { filter, sort, page, limit } = buildListOptions(query);
        const { docs, total } = await this.repository.findPaginated({ filter, sort, page, limit });

        return {
            data: EventDTO.fromMany(docs),
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        };
    }

    // busca el evento como entidad de dominio: con todos sus campos, para que las
    // reglas (propiedad, transiciones, cupo) trabajen sobre el dato completo. es de
    // uso interno del dominio —lo reusan update, changeStatus y tickets.service—,
    // no se devuelve nunca tal cual por la api.
    //
    // el 404 sale de aca y no del controller: es una regla del dominio ("ese
    // evento no existe").
    async findEventOrFail(id) {
        const event = await this.repository.findById(id);
        if (!event) {
            throw httpError(404, 'Evento no encontrado');
        }

        return event;
    }

    // la version que si sale por la api: la misma busqueda, envuelta en el DTO.
    async getEventById(id) {
        return EventDTO.from(await this.findEventOrFail(id));
    }

    // crea el evento y lo deja asociado al organizer que lo publico (requester).
    // el rol ya lo filtro el middleware authorize; aca validamos los datos y
    // fijamos el dueño.
    async createEvent(data = {}, requester) {
        const missing = REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
        if (missing.length > 0) {
            throw httpError(400, `Faltan campos obligatorios: ${missing.join(', ')}`);
        }

        // el dueño sale de la sesion: si el body trae un organizer, se ignora
        // (armamos el payload campo por campo, nunca con un spread del body).
        const payload = { organizer: requester.id };

        for (const [field, parse] of Object.entries(FIELD_PARSERS)) {
            if (data[field] !== undefined) payload[field] = parse(data[field]);
        }

        if (data.status !== undefined) {
            payload.status = parseStatus(data.status, CREATABLE_STATUS);
        }

        return EventDTO.from(await this.repository.createEvent(payload));
    }

    // modifica un evento existente respetando la propiedad: el organizer solo
    // toca lo suyo, el admin cualquiera. si no existe es 404, si no le pertenece
    // es 403 (no un 500 generico).
    async updateEvent(id, data = {}, requester) {
        const event = await this.findEventOrFail(id);
        this.assertCanManage(event, requester);

        // un evento cancelado queda congelado: no se edita ni se revive por PUT.
        if (event.status === EVENT_STATUS.CANCELLED) {
            throw httpError(409, 'Un evento cancelado no puede modificarse');
        }

        // estos dos no se tocan por aca, y avisamos en vez de ignorarlos calladitos.
        if (data.status !== undefined) {
            throw httpError(400, 'Para cambiar el estado usa PATCH /api/events/:eid/status');
        }
        if (data.organizer !== undefined) {
            throw httpError(400, 'El organizador de un evento no se puede reasignar');
        }

        const changes = {};
        for (const [field, parse] of Object.entries(FIELD_PARSERS)) {
            if (data[field] !== undefined) changes[field] = parse(data[field]);
        }

        if (Object.keys(changes).length === 0) {
            throw httpError(400, 'No hay campos para actualizar');
        }

        return EventDTO.from(await this.repository.updateEvent(id, changes));
    }

    // unico camino para tocar el status: publicar, finalizar o cancelar. mismas
    // reglas de propiedad que el update.
    async changeStatus(id, status, requester) {
        const event = await this.findEventOrFail(id);
        this.assertCanManage(event, requester);

        const nextStatus = parseStatus(status);
        this.assertStatusChange(event, nextStatus);

        return EventDTO.from(await this.repository.changeStatus(id, nextStatus));
    }

    // el DELETE de la api entra por aca: cancelar es un cambio de estado, no se
    // borra nada de la base.
    async cancelEvent(id, requester) {
        return this.changeStatus(id, EVENT_STATUS.CANCELLED, requester);
    }

    // reglas de transicion de estado. cancelled es terminal, y publicar exige que
    // el evento no haya terminado ni tenga la fecha cumplida.
    assertStatusChange(event, nextStatus) {
        if (event.status === EVENT_STATUS.CANCELLED) {
            throw httpError(409, 'Un evento cancelado no puede cambiar de estado');
        }

        if (event.status === nextStatus) {
            throw httpError(409, `El evento ya esta en estado ${nextStatus}`);
        }

        if (nextStatus === EVENT_STATUS.PUBLISHED) {
            if (event.status === EVENT_STATUS.FINISHED) {
                throw httpError(409, 'Un evento finalizado no puede publicarse');
            }
            if (new Date(event.date).getTime() <= Date.now()) {
                throw httpError(409, 'No se puede publicar un evento con fecha pasada');
            }
        }
    }

    // regla de propiedad reutilizada por update y changeStatus. el admin gestiona
    // cualquier evento; el organizer, solo los que creo el. cualquier otro caso
    // es un 403 sobre ese recurso puntual.
    assertCanManage(event, requester) {
        if (requester.role === ROLES.ADMIN) return;

        // con populate el organizer viene como objeto, sin populate como ObjectId:
        // sacamos el id de los dos casos antes de comparar.
        const ownerId = String(event.organizer?._id ?? event.organizer);
        if (requester.role === ROLES.ORGANIZER && ownerId === String(requester.id)) return;

        throw httpError(403, 'No podes gestionar un evento que no te pertenece');
    }
}

export const eventsService = new EventsService(eventsRepository);

export default eventsService;

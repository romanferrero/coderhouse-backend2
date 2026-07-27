import { eventsService } from '../services/events.service.js';
import { success, paginated } from '../utils/apiResponse.js';

// Solo traduce HTTP <-> service: no consulta la base ni aplica reglas de negocio.
// los filtros llegan crudos en req.query y el service se encarga de validarlos.
export const getEvents = async (req, res) => {
    const page = await eventsService.getEvents(req.query);

    res.json(paginated(page));
};

// si el evento no existe, el service tira 404 y lo arma el errorHandler.
export const getEventById = async (req, res) => {
    const event = await eventsService.getEventById(req.params.eid);

    res.json(success(event));
};

// req.user lo dejo la estrategia 'current'; el service lo usa como dueño del
// evento. el rol ya lo valido authorize antes de llegar aca.
export const createEvent = async (req, res) => {
    const event = await eventsService.createEvent(req.body, req.user);

    res.status(201).json(success(event));
};

export const updateEvent = async (req, res) => {
    const event = await eventsService.updateEvent(req.params.eid, req.body, req.user);

    res.json(success(event));
};

// PATCH /:eid/status: publicar, finalizar o cancelar. las transiciones validas
// las decide el service.
export const updateEventStatus = async (req, res) => {
    const { status } = req.body ?? {};
    const event = await eventsService.changeStatus(req.params.eid, status, req.user);

    res.json(success(event));
};

// el DELETE no borra el evento: lo pasa a cancelled y devuelve como quedo.
export const cancelEvent = async (req, res) => {
    const event = await eventsService.cancelEvent(req.params.eid, req.user);

    res.json(success(event));
};

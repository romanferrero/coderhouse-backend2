import { eventsService } from '../services/events.service.js';
import { success, error } from '../utils/apiResponse.js';

// Solo traduce HTTP <-> service: no consulta la base ni aplica reglas de negocio.
export const getEvents = async (req, res) => {
    const events = await eventsService.getEvents();

    res.json(success(events));
};

export const getEventById = async (req, res) => {
    const event = await eventsService.getEventById(req.params.eid);

    if (!event) {
        return res.status(404).json(error('Evento no encontrado'));
    }

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

export const deleteEvent = async (req, res) => {
    await eventsService.deleteEvent(req.params.eid, req.user);

    res.json(success({ id: req.params.eid, deleted: true }));
};

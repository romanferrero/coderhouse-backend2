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

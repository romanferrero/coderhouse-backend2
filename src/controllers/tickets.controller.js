import { ticketsService } from '../services/tickets.service.js';
import { success } from '../utils/apiResponse.js';

// Solo traduce HTTP <-> service: no consulta la base ni aplica reglas de negocio.
// el cupo, los estados validos y los duplicados los decide el tickets.service.

// POST /api/events/:eid/tickets — inscribirse (cualquier usuario autenticado).
// req.user lo dejo la estrategia 'current' y es el dueño de la inscripcion: el
// usuario sale de la sesion, nunca del body.
export const createTicket = async (req, res) => {
    const ticket = await ticketsService.enroll(req.params.eid, req.body, req.user);

    res.status(201).json(success(ticket));
};

// GET /api/tickets/my-tickets — solo los del usuario autenticado.
export const getMyTickets = async (req, res) => {
    const tickets = await ticketsService.getMyTickets(req.user);

    res.json(success(tickets));
};

// GET /api/events/:eid/tickets — inscriptos de un evento (dueño del evento o admin).
export const getEventTickets = async (req, res) => {
    const tickets = await ticketsService.getEventTickets(req.params.eid, req.user);

    res.json(success(tickets));
};

// PATCH /api/tickets/:tid/cancel — no borra el ticket: lo pasa a cancelled y
// devuelve como quedo.
export const cancelTicket = async (req, res) => {
    const ticket = await ticketsService.cancelTicket(req.params.tid, req.user);

    res.json(success(ticket));
};

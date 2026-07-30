import { Router } from 'express';
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// las inscripciones que cuelgan de un evento (crear y listar) viven en
// events.router.js, porque su url es /api/events/:eid/tickets. aca quedan las que
// arrancan desde el ticket en si.

// mis inscripciones. no lleva authorize: cualquier rol autenticado ve las propias,
// y el id sale de la sesion (nunca de la url), asi nadie pide las de otro.
router.get('/my-tickets',
    authenticate('current'),
    asyncHandler(getMyTickets)
);

// cancelar. tampoco lleva authorize por rol: el permiso no depende del rol sino de
// la propiedad del ticket (dueño o admin), y eso lo resuelve el service, que es
// quien puede leer el dato para decidir.
router.patch('/:tid/cancel',
    authenticate('current'),
    asyncHandler(cancelTicket)
);

export default router;

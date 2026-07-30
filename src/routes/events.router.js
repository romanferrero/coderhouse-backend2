import { Router } from 'express';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    updateEventStatus,
    cancelEvent
} from '../controllers/events.controller.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// consultar eventos: publico, cualquiera puede ver el catalogo. los filtros,
// la paginacion y el orden viajan en la query string.
router.get('/', asyncHandler(getEvents));
router.get('/:eid', asyncHandler(getEventById));

// crear/modificar/cancelar: primero authenticate valida la sesion (401 si no hay)
// y despues authorize valida el rol (403 si es user). el chequeo de propiedad
// (organizer solo lo suyo) y las reglas de negocio las hace el service.
router.post('/',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(createEvent)
);

router.put('/:eid',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(updateEvent)
);

// cambio de estado explicito (draft/published/cancelled/finished).
router.patch('/:eid/status',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(updateEventStatus)
);

// atajo para cancelar. no elimina nada: es un PATCH a status=cancelled.
router.delete('/:eid',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(cancelEvent)
);

// --- inscripciones de un evento ------------------------------------------
// viven aca y no en tickets.router.js porque cuelgan de la url del evento. el
// resto de las rutas de tickets (mis tickets, cancelar) estan en tickets.router.js.

// inscribirse: alcanza con estar autenticado, sin importar el rol. no lleva
// authorize porque no hay rol que sobre: un organizer o un admin tambien pueden
// anotarse a un evento. el cupo, el estado del evento y los duplicados los valida
// el tickets.service.
router.post('/:eid/tickets',
    authenticate('current'),
    asyncHandler(createTicket)
);

// ver los inscriptos: rol organizer o admin (403 para un user comun) y, ademas, el
// chequeo de propiedad que hace el service (un organizer solo ve los inscriptos de
// sus propios eventos; el admin, los de cualquiera).
router.get('/:eid/tickets',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(getEventTickets)
);

export default router;

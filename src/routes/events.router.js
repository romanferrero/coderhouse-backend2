import { Router } from 'express';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    updateEventStatus,
    cancelEvent
} from '../controllers/events.controller.js';
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

export default router;

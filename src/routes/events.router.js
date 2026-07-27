import { Router } from 'express';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/events.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// consultar eventos: publico, cualquiera puede ver los publicados.
router.get('/', asyncHandler(getEvents));
router.get('/:eid', asyncHandler(getEventById));

// crear/modificar/cancelar: primero authenticate valida la sesion (401 si no hay)
// y despues authorize valida el rol (403 si es user). el chequeo de propiedad
// (organizer solo lo suyo) lo hace el service.
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

router.delete('/:eid',
    authenticate('current'),
    authorize(ROLES.ORGANIZER, ROLES.ADMIN),
    asyncHandler(deleteEvent)
);

export default router;

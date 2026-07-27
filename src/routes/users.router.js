import { Router } from 'express';
import { getUsers } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// ruta administrativa: ver todos los usuarios es solo para admin. authenticate
// valida la sesion (401) y authorize valida el rol (403 para user y organizer).
router.get('/',
    authenticate('current'),
    authorize(ROLES.ADMIN),
    asyncHandler(getUsers)
);

export default router;

import { Router } from 'express';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
// /current va protegida: auth chequea la cookie antes de entrar al handler.
router.get('/current', auth, current);
router.post('/logout', logout);

export default router;

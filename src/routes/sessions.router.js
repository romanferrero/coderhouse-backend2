import { Router } from 'express';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

// cada ruta delega la autenticacion en su estrategia de passport y el controller
// solo arma la respuesta. el mensaje/status de falla lo fija la ruta para no
// exponer los textos internos de passport y mantener el contrato de siempre.
router.post('/register', authenticate('register', { failStatus: 400, failMessage: 'Faltan campos obligatorios' }), register);
router.post('/login', authenticate('login', { failMessage: 'Credenciales invalidas' }), login);
// /current va protegida: la estrategia valida el jwt de la cookie antes del handler.
router.get('/current', authenticate('current'), current);
router.post('/logout', logout);

export default router;

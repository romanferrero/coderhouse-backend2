import { sessionsService } from '../services/sessions.service.js';
import { signToken } from '../utils/jwt.js';
import { config } from '../config/env.config.js';
import { success, message } from '../utils/apiResponse.js';

// la cookie donde viaja el jwt de la sesion.
const COOKIE_NAME = 'currentUser';

// los atributos que identifican la cookie. tienen que coincidir para poder
// borrarla despues. httpOnly asi el js del navegador no la lee (esquiva xss),
// sameSite 'lax' para que no viaje en requests cross-site, y secure solo en
// prod porque en dev andamos sobre http.
const cookieBaseOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production'
};

// al setearla le sumamos cuanto vive: 1h, igual que la expiracion del jwt.
const cookieOptions = { ...cookieBaseOptions, maxAge: 3600000 };

// solo traduce http <-> service: la validacion, normalizacion y el hash de la
// contrasena viven en el service. los errores se van al errorHandler.
export const register = async (req, res) => {
    const user = await sessionsService.register(req.body);

    res.status(201).json(success(user));
};

// deja que el service valide, firma un jwt con lo minimo y lo mete en la cookie
// httpOnly. el token nunca sale en el body.
export const login = async (req, res) => {
    const user = await sessionsService.login(req.body);

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.status(200).json(message('Login correcto'));
};

// el middleware auth ya verifico el jwt y dejo el payload en req.user, que trae
// solo { id, email, role } (nada de password).
export const current = (req, res) => {
    const { id, email, role } = req.user;

    res.status(200).json(success({ id, email, role }));
};

// borra la cookie con las mismas opciones con las que se seteo, asi el navegador
// la reconoce y la saca.
export const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, cookieBaseOptions);
    res.status(200).json(message('Sesion cerrada'));
};

import { signToken } from '../utils/jwt.js';
import { config } from '../config/env.config.js';
import { SessionUserDTO } from '../dto/user.dto.js';
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

// la estrategia 'register' ya valido, normalizo, hasheo y persistio: dejo en
// req.user el UserDTO que devolvio el service (sin password) y aca solo se responde.
export const register = (req, res) => {
    res.status(201).json(success(req.user));
};

// la estrategia 'login' ya valido las credenciales y dejo el usuario publico en
// req.user. el jwt lo genera el controller (no la estrategia): firma lo minimo y
// lo mete en la cookie httpOnly. el token nunca sale en el body.
export const login = (req, res) => {
    const user = req.user;

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.status(200).json(message('Login correcto'));
};

// la estrategia 'current' ya verifico el jwt y dejo el payload en req.user. el
// payload no sale de la base sino del token, asi que no hay service que consultar:
// el DTO se aplica aca, que es el borde de la respuesta. igual el password no
// existe en el token, pero el recorte queda explicito en un solo lugar.
export const current = (req, res) => {
    res.status(200).json(success(SessionUserDTO.from(req.user)));
};

// borra la cookie con las mismas opciones con las que se seteo, asi el navegador
// la reconoce y la saca.
export const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, cookieBaseOptions);
    res.status(200).json(message('Sesion cerrada'));
};

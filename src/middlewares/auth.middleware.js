import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/apiResponse.js';

// la cookie donde guardamos el jwt de la sesion.
const COOKIE_NAME = 'currentUser';

// cuida las rutas privadas: agarra la cookie, verifica el jwt y mete el payload
// en req.user. si no hay cookie o el token esta roto/vencido devuelve un 401 con
// mensaje generico, sin dar pistas de que fallo.
export const auth = (req, res, next) => {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
        return res.status(401).json(error('No autenticado'));
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch {
        return res.status(401).json(error('No autenticado'));
    }
};

export default auth;

import { httpError } from '../utils/httpError.js';

// middleware de autorizacion por roles. recibe los roles permitidos y devuelve
// el middleware que compara contra req.user.role. es reutilizable: cada ruta
// decide que roles acepta, ej: authorize(ROLES.ORGANIZER, ROLES.ADMIN).
//
// siempre corre despues del middleware de autenticacion (authenticate('current')),
// que ya dejo el usuario en req.user. la diferencia de errores es clave:
//   - sin req.user  -> no hay sesion valida: 401 (no deberia pasar si va detras
//                      de authenticate, pero lo cubrimos por las dudas)
//   - rol no permitido -> hay sesion pero sin permiso: 403
export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return next(httpError(401, 'No autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
        return next(httpError(403, 'No tenes permisos para realizar esta accion'));
    }

    return next();
};

export default authorize;

import passport from 'passport';

// envuelve passport.authenticate con un callback propio para no usar sesiones y
// para traducir cada resultado al contrato de la api:
//   - err          -> lo pasa al errorHandler, que respeta su status (400/409/503)
//   - sin usuario  -> falla de auth: responde failStatus + failMessage propios,
//                     sin filtrar los mensajes internos de passport (en ingles)
//   - con usuario  -> lo deja en req.user y sigue al controller
//
// las rutas quedan limpias: solo hacen authenticate('register'|'login'|'current').
export const authenticate = (strategy, { failStatus = 401, failMessage = 'No autenticado' } = {}) =>
    (req, res, next) => {
        passport.authenticate(strategy, { session: false }, (err, user) => {
            if (err) return next(err);

            if (!user) {
                const failure = new Error(failMessage);
                failure.status = failStatus;
                return next(failure);
            }

            req.user = user;
            return next();
        })(req, res, next);
    };

export default authenticate;

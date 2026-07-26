import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { sessionsService } from '../services/sessions.service.js';
import { config } from './env.config.js';

// la cookie httpOnly donde viaja el jwt de la sesion. la estrategia 'current'
// lo saca de aca en vez de leerlo de un header Authorization.
const COOKIE_NAME = 'currentUser';

// extractor a medida para passport-jwt: agarra el token de la cookie. si no hay
// cookie devuelve null y la estrategia falla sola con un 401.
const cookieExtractor = (req) => req?.cookies?.[COOKIE_NAME] ?? null;

// centraliza las estrategias de auth. app.js solo llama a esta funcion y a
// passport.initialize(): no conoce el detalle de cada estrategia. para sumar
// providers externos (google, github, etc.) alcanza con agregar un passport.use
// aca, sin tocar app.js.
export const initializePassport = () => {
    // registro: la validacion, normalizacion, unicidad, bcrypt y rol por defecto
    // viven en el service, que la estrategia orquesta. passReqToCallback porque
    // el registro necesita first_name y last_name, que no son los campos que
    // maneja passport-local (email/password).
    passport.use('register', new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        async (req, _email, _password, done) => {
            try {
                const user = await sessionsService.register(req.body);
                return done(null, user);
            } catch (err) {
                // errores de negocio (400 formato, 409 duplicado, 503 sin base):
                // viajan como error para que el errorHandler respete su status.
                return done(err);
            }
        }
    ));

    // login: valida credenciales contra bcrypt dentro del service. no genera el
    // jwt (eso es tarea del controller). credenciales que no matchean son una
    // falla de auth, no un error del server, y siempre con el mismo mensaje
    // generico para no filtrar que emails existen.
    passport.use('login', new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await sessionsService.login({ email, password });
                return done(null, user);
            } catch (err) {
                // algo inesperado (ej: 503 sin base) se propaga como error real;
                // lo demas es simplemente credencial invalida.
                if (err.status && err.status !== 401) return done(err);
                return done(null, false, { message: 'Credenciales invalidas' });
            }
        }
    ));

    // current: lee el jwt de la cookie httpOnly y lo valida. deja el payload
    // ({ id, email, role, ... }) en req.user. token ausente o manipulado hace
    // fallar la estrategia y el middleware responde 401.
    passport.use('current', new JwtStrategy(
        {
            jwtFromRequest: cookieExtractor,
            secretOrKey: config.jwtSecret
        },
        (payload, done) => done(null, payload)
    ));
};

export default initializePassport;

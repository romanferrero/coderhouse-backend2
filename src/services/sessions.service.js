import { usersRepository } from '../repositories/users.repository.js';
import { hashPassword, isValidPassword } from '../utils/hash.js';

// Formato de email razonable: algo@algo.algo sin espacios. No pretende cubrir
// el RFC completo, solo descartar entradas evidentemente invalidas.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Crea un Error con status HTTP para que el errorHandler global arme la
// respuesta { status: 'error', message } con el codigo correspondiente.
const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

// Capa de negocio de autenticacion. Aca viven las reglas de registro; login,
// JWT y current se suman en las proximas entregas.
class SessionsService {
    constructor(repository) {
        this.repository = repository;
    }

    async register({ first_name, last_name, email, password } = {}) {
        if (!first_name || !last_name || !email || !password) {
            throw httpError(400, 'Faltan campos obligatorios');
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            throw httpError(400, 'El email no tiene un formato valido');
        }

        if (String(password).length < MIN_PASSWORD_LENGTH) {
            throw httpError(400, `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
        }

        const existing = await this.repository.getByEmail(normalizedEmail);
        if (existing) {
            throw httpError(409, 'El email ya esta registrado');
        }

        const hashedPassword = await hashPassword(password);

        // El rol no se toma del body: se omite a proposito para que quede en
        // el default 'user' del modelo y no pueda escalarse desde el registro.
        const created = await this.repository.create({
            first_name: String(first_name).trim(),
            last_name: String(last_name).trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return this.toPublicUser(created);
    }

    // valida las credenciales y, si estan bien, devuelve el usuario publico (sin
    // password). si algo no cierra tira siempre el mismo 401 generico: no avisa
    // si el email no existe o si la contrasena esta mal, asi no filtramos que
    // emails hay registrados.
    async login({ email, password } = {}) {
        if (!email || !password) {
            throw httpError(401, 'Credenciales invalidas');
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await this.repository.getByEmail(normalizedEmail);
        if (!user) {
            throw httpError(401, 'Credenciales invalidas');
        }

        const passwordMatches = await isValidPassword(password, user.password);
        if (!passwordMatches) {
            throw httpError(401, 'Credenciales invalidas');
        }

        return this.toPublicUser(user);
    }

    // Nunca expone el password (ni hasheado) y renombra _id -> id.
    toPublicUser(user) {
        return {
            id: user._id.toString(),
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
        };
    }
}

export const sessionsService = new SessionsService(usersRepository);

export default sessionsService;

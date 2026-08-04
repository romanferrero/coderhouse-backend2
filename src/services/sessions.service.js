import { usersRepository } from '../repositories/users.repository.js';
import { UserDTO } from '../dto/user.dto.js';
import { hashPassword, isValidPassword } from '../utils/hash.js';
import { httpError } from '../utils/httpError.js';

// Formato de email razonable: algo@algo.algo sin espacios. No pretende cubrir
// el RFC completo, solo descartar entradas evidentemente invalidas.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// capa de negocio de auth. aca viven las reglas de registro y la validacion de
// credenciales del login. las estrategias de passport orquestan estos metodos
// (ver config/passport.config.js); el jwt lo firma el controller.
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

        const existing = await this.repository.findByEmail(normalizedEmail);
        if (existing) {
            throw httpError(409, 'El email ya esta registrado');
        }

        const hashedPassword = await hashPassword(password);

        // El rol no se toma del body: se omite a proposito para que quede en
        // el default 'user' del modelo y no pueda escalarse desde el registro.
        const created = await this.repository.createUser({
            first_name: String(first_name).trim(),
            last_name: String(last_name).trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return UserDTO.from(created);
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

        // el repository devuelve el documento completo porque el hash hace falta
        // para comparar; lo que sale del service ya pasa por el DTO.
        const user = await this.repository.findByEmail(normalizedEmail);
        if (!user) {
            throw httpError(401, 'Credenciales invalidas');
        }

        const passwordMatches = await isValidPassword(password, user.password);
        if (!passwordMatches) {
            throw httpError(401, 'Credenciales invalidas');
        }

        return UserDTO.from(user);
    }
}

export const sessionsService = new SessionsService(usersRepository);

export default sessionsService;

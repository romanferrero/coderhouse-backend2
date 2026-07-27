import { usersRepository } from '../repositories/users.repository.js';

// capa de negocio de usuarios. hoy solo lista usuarios (para la ruta admin), sin
// exponer nunca el password.
class UsersService {
    constructor(repository) {
        this.repository = repository;
    }

    async getUsers() {
        const users = await this.repository.getAll();
        return users.map((user) => this.toPublicUser(user));
    }

    // renombra _id -> id y descarta el password (ni hasheado se devuelve).
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

export const usersService = new UsersService(usersRepository);

export default usersService;

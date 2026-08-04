import { usersRepository } from '../repositories/users.repository.js';
import { UserDTO } from '../dto/user.dto.js';

// capa de negocio de usuarios. hoy solo lista usuarios (para la ruta admin). el
// recorte de campos ya no se arma a mano aca: lo hace el UserDTO, que es el mismo
// que usa el registro, asi las dos rutas no pueden desincronizarse.
class UsersService {
    constructor(repository) {
        this.repository = repository;
    }

    async getUsers() {
        const users = await this.repository.findAll();
        return UserDTO.fromMany(users);
    }
}

export const usersService = new UsersService(usersRepository);

export default usersService;

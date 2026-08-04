import { userDAO } from '../dao/mongo/user.dao.js';

// Capa intermedia entre el service y el DAO. Habla el idioma del dominio
// ("buscame el usuario de este email") y traduce eso al filtro que entiende el DAO.
// No importa modelos de mongoose: si mañana la persistencia deja de ser mongo,
// solo se cambia el DAO que se le inyecta al constructor y esta capa queda igual.
class UsersRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async findAll() {
        return this.dao.find();
    }

    async findByEmail(email) {
        return this.dao.findOne({ email });
    }

    async createUser(userData) {
        return this.dao.create(userData);
    }
}

export const usersRepository = new UsersRepository(userDAO);

export default usersRepository;

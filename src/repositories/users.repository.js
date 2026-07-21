import { userDAO } from '../dao/mongo/user.dao.js';

// Aisla al service de la fuente de datos: si el DAO cambia de mongo a otra
// persistencia, solo se toca esta capa.
class UsersRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getByEmail(email) {
        return this.dao.getByEmail(email);
    }

    async create(userData) {
        return this.dao.create(userData);
    }
}

export const usersRepository = new UsersRepository(userDAO);

export default usersRepository;

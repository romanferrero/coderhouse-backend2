import { User } from '../../models/User.js';
import { isDbConnected } from '../../config/db.js';

class UserDAO {
    // Sin conexion devuelve lista vacia en vez de dejar la query en buffer.
    async getAll() {
        if (!isDbConnected()) return [];

        return User.find().lean();
    }

    // Devuelve null sin conexion: mongoose dejaria la query en buffer hasta
    // agotar el timeout y la request colgaria.
    async getByEmail(email) {
        if (!isDbConnected()) return null;

        return User.findOne({ email }).lean();
    }

    // El registro necesita persistir si o si: sin base no hay nada que hacer,
    // asi que se avisa con un 503 en lugar de dejar la request en buffer.
    async create(userData) {
        if (!isDbConnected()) {
            const err = new Error('Base de datos no disponible');
            err.status = 503;
            throw err;
        }

        const user = await User.create(userData);
        return user.toObject();
    }
}

export const userDAO = new UserDAO();

export default userDAO;

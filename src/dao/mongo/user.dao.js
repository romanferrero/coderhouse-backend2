import { User } from '../../models/User.js';
import { isDbConnected } from '../../config/db.js';
import { httpError } from '../../utils/httpError.js';

// Acceso a datos de usuarios. Junto al resto de los DAO es el UNICO lugar del
// proyecto que importa un modelo de mongoose: repositories, services y controllers
// no lo ven nunca. Los metodos son de persistencia pura (find/findOne/create), sin
// una sola regla de negocio: quien traduce "buscar por email" a un filtro es el
// repository.
class UserDAO {
    // Sin conexion devuelve lista vacia en vez de dejar la query en buffer.
    async find(filter = {}) {
        if (!isDbConnected()) return [];

        return User.find(filter).lean();
    }

    // Devuelve null sin conexion: mongoose dejaria la query en buffer hasta
    // agotar el timeout y la request colgaria.
    async findOne(filter = {}) {
        if (!isDbConnected()) return null;

        return User.findOne(filter).lean();
    }

    // El registro necesita persistir si o si: sin base no hay nada que hacer,
    // asi que se avisa con un 503 en lugar de dejar la request en buffer.
    async create(userData) {
        if (!isDbConnected()) throw httpError(503, 'Base de datos no disponible');

        const user = await User.create(userData);
        return user.toObject();
    }
}

export const userDAO = new UserDAO();

export default userDAO;

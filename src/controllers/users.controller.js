import { usersService } from '../services/users.service.js';
import { success } from '../utils/apiResponse.js';

// lista todos los usuarios. es ruta administrativa: authenticate + authorize(admin)
// ya filtraron el acceso antes de llegar aca.
export const getUsers = async (req, res) => {
    const users = await usersService.getUsers();

    res.json(success(users));
};

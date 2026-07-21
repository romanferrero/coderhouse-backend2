import { sessionsService } from '../services/sessions.service.js';
import { success, error } from '../utils/apiResponse.js';

// Stubs sin logica de auth: la consigna pide dejar la estructura preparada.
// login/current/logout y la emision de JWT se implementan en la proxima entrega.
const NOT_IMPLEMENTED = 'No implementado. Se completa en la proxima entrega.';

// Solo traduce HTTP <-> service: la validacion, normalizacion y el hash de la
// contrasena viven en el service. Los errores se propagan al errorHandler.
export const register = async (req, res) => {
    const user = await sessionsService.register(req.body);

    res.status(201).json(success(user));
};

export const login = (req, res) => {
    res.status(501).json(error(NOT_IMPLEMENTED));
};

export const current = (req, res) => {
    res.status(501).json(error(NOT_IMPLEMENTED));
};

export const logout = (req, res) => {
    res.status(501).json(error(NOT_IMPLEMENTED));
};

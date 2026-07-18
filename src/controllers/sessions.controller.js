import { error } from '../utils/apiResponse.js';

// Stubs sin logica de auth: la consigna pide dejar la estructura preparada.
// register/login y la emision de JWT se implementan en la proxima entrega.
const NOT_IMPLEMENTED = 'No implementado. Se completa en la proxima entrega.';

export const register = (req, res) => {
    res.status(501).json(error(NOT_IMPLEMENTED));
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

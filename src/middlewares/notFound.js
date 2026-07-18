import { error } from '../utils/apiResponse.js';

export const notFound = (req, res) => {
    res.status(404).json(error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

export default notFound;

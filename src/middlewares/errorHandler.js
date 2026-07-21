import { config } from '../config/env.config.js';
import { error } from '../utils/apiResponse.js';

// Los 4 parametros son obligatorios: asi Express lo reconoce como error handler.
export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;

    // Los 4xx son errores esperables del cliente (validacion, email duplicado):
    // no ensucian el log. Solo los 5xx se registran como fallas del servidor.
    if (status >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl} -> ${err.message}`);
        if (config.nodeEnv === 'development') {
            console.error(err.stack);
        }
    }

    res.status(status).json(error(err.message || 'Error interno del servidor'));
};

export default errorHandler;

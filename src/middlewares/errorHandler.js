import { config } from '../config/env.config.js';
import { error } from '../utils/apiResponse.js';
import { httpError } from '../utils/httpError.js';

// el error de clave duplicada de mongo (indice unique).
const DUPLICATE_KEY = 11000;

// Traduce los errores que llegan sin status a un codigo http con sentido. Los
// services ya tiran httpError con su codigo (400/401/403/404/409/503); esto cubre
// lo que puede escaparse desde mongoose y evita que un dato mal formado termine en
// un 500 que no le corresponde.
const withHttpStatus = (err) => {
    if (err.status) return err;

    // un id con formato invalido no es una falla del servidor: es un dato malo.
    if (err.name === 'CastError') {
        return httpError(400, `El valor de ${err.path} no es valido`);
    }

    // validaciones del schema (ej: quantity < 1) que no atajo el service.
    if (err.name === 'ValidationError') {
        const detail = Object.values(err.errors ?? {}).map((e) => e.message).join(', ');
        return httpError(400, detail || 'Datos invalidos');
    }

    // choque contra un indice unique: es un conflicto, no un error interno.
    if (err.code === DUPLICATE_KEY) {
        return httpError(409, 'Ya existe un registro con esos datos');
    }

    return err;
};

// Manejo centralizado de errores: TODA respuesta de error de la api sale de aca,
// siempre con el mismo formato { status: 'error', message }. Los 4 parametros son
// obligatorios, asi Express lo reconoce como error handler.
export const errorHandler = (err, req, res, next) => {
    const failure = withHttpStatus(err);
    const status = failure.status || 500;

    // Los 4xx son errores esperables del cliente (validacion, email duplicado, sin
    // permisos): no ensucian el log. Solo los 5xx se registran como fallas del
    // servidor.
    if (status >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl} -> ${failure.message}`);
        if (config.nodeEnv === 'development') {
            console.error(failure.stack);
        }
    }

    // si el error se creo a proposito (httpError con su status) el mensaje esta
    // pensado para el cliente y sale tal cual, sea un 400 o el 503 de base caida.
    // lo que no tiene status es una falla inesperada: su mensaje interno queda solo
    // en el log y afuera va uno generico, para no filtrar detalles de implementacion.
    const message = failure.status ? failure.message : 'Error interno del servidor';

    res.status(status).json(error(message));
};

export default errorHandler;

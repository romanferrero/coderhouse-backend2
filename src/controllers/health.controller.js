import { isDbConnected } from '../config/db.js';

// Respuesta con el formato exacto que pide la consigna, por eso no usa el
// helper success(): este endpoint no devuelve payload.
export const getHealth = (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor activo',
        db: isDbConnected() ? 'conectada' : 'desconectada'
    });
};

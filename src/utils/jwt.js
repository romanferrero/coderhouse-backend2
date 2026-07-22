import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

// aca firmamos y verificamos los jwt, todo en un solo lugar. el secreto y la
// expiracion salen de las env, nunca hardcodeados.

// firma el payload minimo (id, email, role) y devuelve el token. cuanto dura lo
// decide JWT_EXPIRES_IN.
export const signToken = (payload) =>
    jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

// verifica el token y devuelve el payload. si esta vencido o roto tira error, y
// el que llama ve como lo maneja (casi siempre un 401).
export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

export default { signToken, verifyToken };

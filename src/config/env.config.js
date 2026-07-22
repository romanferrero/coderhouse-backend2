import dotenv from 'dotenv';

dotenv.config();

// Unico punto del proyecto que lee process.env.
export const config = {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    // cuanto dura el jwt, en el formato de jsonwebtoken (ej: '1h', '30m').
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};

export default config;

import mongoose from 'mongoose';
import { config } from './env.config.js';

export const connectDB = async () => {
    if (!config.mongoUrl) {
        throw new Error('MONGO_URL no esta definida');
    }

    await mongoose.connect(config.mongoUrl);
    return mongoose.connection;
};

// 1 = connected. Los DAO lo consultan para no lanzar queries sin conexion:
// mongoose las dejaria en buffer hasta agotar el timeout en lugar de fallar rapido.
export const isDbConnected = () => mongoose.connection.readyState === 1;

export const disconnectDB = async () => {
    await mongoose.disconnect();
};

import app from './app.js';
import { config } from './config/env.config.js';
import { connectDB } from './config/db.js';

// La base es opcional en esta etapa: si no hay MONGO_URL o la conexion falla,
// se avisa y el servidor levanta igual para que los endpoints sigan respondiendo.
const startDB = async () => {
    if (!config.mongoUrl) {
        console.warn('MONGO_URL no esta definida: el servidor levanta sin base de datos');
        return;
    }

    try {
        await connectDB();
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.warn(`No se pudo conectar a MongoDB: ${error.message}`);
    }
};

await startDB();

app.listen(config.port, () => {
    console.log(`Servidor escuchando en puerto ${config.port} [${config.nodeEnv}]`);
});

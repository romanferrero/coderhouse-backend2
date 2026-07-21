import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    // trim + lowercase como red de seguridad: la normalizacion principal
    // ocurre en el service, esto evita duplicados si algun flujo la omite.
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    // organizer publica eventos; admin gestiona todo. El registro publico
    // no puede setear el rol: siempre queda en 'user' por defecto.
    role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' }
}, { timestamps: true });

export const User = mongoose.model(userCollection, userSchema);

export default User;

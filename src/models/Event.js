import mongoose from 'mongoose';
import { EVENT_STATUS, EVENT_STATUS_VALUES } from '../config/eventStatus.js';

const eventCollection = 'events';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    // la categoria se guarda en minusculas asi filtrar por ?category=running
    // funciona sin importar como la escribio el organizer.
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    date: { type: Date, required: true, index: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: [1, 'La capacidad debe ser mayor a 0'] },
    // eventos gratis son la norma, asi que price arranca en 0. nunca negativo.
    price: { type: Number, required: true, default: 0, min: [0, 'El precio no puede ser negativo'] },
    // el evento nace como borrador: publicarlo es una accion aparte (PATCH status).
    status: { type: String, enum: EVENT_STATUS_VALUES, default: EVENT_STATUS.DRAFT, index: true },
    // dueño del evento: el organizer que lo creo. va como referencia al usuario
    // (ObjectId), no como objeto embebido, asi no duplicamos datos que pueden
    // cambiar. lo usamos para el chequeo de propiedad (un organizer solo modifica
    // lo suyo; el admin, cualquiera).
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true }
}, { timestamps: true });

export const Event = mongoose.model(eventCollection, eventSchema);

export default Event;

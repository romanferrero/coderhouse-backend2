import mongoose from 'mongoose';

const eventCollection = 'events';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    discipline: { type: String, required: true, index: true },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    // dueño del evento: el organizer que lo creo. lo usamos para el chequeo de
    // propiedad (un organizer solo modifica lo suyo; el admin, cualquiera).
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    status: { type: Boolean, default: true }
}, { timestamps: true });

export const Event = mongoose.model(eventCollection, eventSchema);

export default Event;

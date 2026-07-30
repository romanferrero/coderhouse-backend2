import mongoose from 'mongoose';
import { TICKET_STATUS, TICKET_STATUS_VALUES, ACTIVE_TICKET_STATUS } from '../config/ticketStatus.js';

const ticketCollection = 'tickets';

const ticketSchema = new mongoose.Schema({
    // las dos puntas de la inscripcion van como referencia (ObjectId), nunca como
    // objeto embebido: si el usuario cambia el email o el evento la fecha, el
    // ticket no queda con una copia vieja. al leer se resuelven con populate.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'events', required: true, index: true },
    // cuantos lugares reserva este ticket. es lo que se suma para calcular el cupo
    // ocupado, por eso tiene que ser entero y al menos 1.
    quantity: { type: Number, required: true, default: 1, min: [1, 'La cantidad debe ser mayor a 0'] },
    // la inscripcion nace confirmada; pending queda para un flujo de pago futuro.
    status: { type: String, enum: TICKET_STATUS_VALUES, default: TICKET_STATUS.CONFIRMED, index: true },
    // codigo que el usuario presenta en la puerta. se genera en el service y es
    // unico en toda la coleccion.
    reservationCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    // se completa recien al cancelar: mientras el ticket este activo queda null.
    // asi el documento guarda el historial en vez de borrarse.
    cancelledAt: { type: Date, default: null }
}, { timestamps: true });

// una sola inscripcion activa por usuario y evento. el service ya lo chequea
// antes de crear, pero entre el chequeo y el insert hay una ventana: si entran dos
// requests iguales a la vez, las dos pasan la validacion. este indice unico es la
// red de seguridad que hace que la segunda falle en la base (E11000).
//
// es parcial a proposito: solo aplica a los tickets activos, asi un usuario que
// cancelo puede volver a inscribirse (el ticket cancelado queda fuera del indice).
ticketSchema.index(
    { user: 1, event: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ACTIVE_TICKET_STATUS } }
    }
);

// el listado de "mis tickets" siempre ordena por fecha de creacion descendente.
ticketSchema.index({ user: 1, createdAt: -1 });

export const Ticket = mongoose.model(ticketCollection, ticketSchema);

export default Ticket;

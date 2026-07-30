// unico lugar donde viven los estados posibles de un ticket. igual que con los
// roles y los estados de evento, el modelo y el service importan estas constantes
// en vez de escribir 'confirmed'/'cancelled' a mano y que se escape un typo.
//
// el ciclo es: pending (reservado, falta pagar) -> confirmed, y cancelled corta
// la cadena en cualquier momento (es terminal, de ahi no se vuelve).
export const TICKET_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled'
};

// lista de valores validos, la usa el enum del modelo y las validaciones.
export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUS);

// estados que ocupan cupo. un ticket cancelado NO cuenta: por eso cancelar libera
// el lugar automaticamente, sin tener que tocar la capacidad del evento.
// esta lista es la definicion de "ticket activo" para todo el proyecto: la usan el
// calculo de cupos, el chequeo de inscripcion duplicada y el indice unico.
export const ACTIVE_TICKET_STATUS = [TICKET_STATUS.PENDING, TICKET_STATUS.CONFIRMED];

export default TICKET_STATUS;

// unico lugar donde viven los estados posibles de un evento. igual que con los
// roles, el modelo y el service importan estas constantes en vez de escribir
// 'published'/'cancelled' a mano y que se escape un typo.
//
// el ciclo de vida es: draft -> published -> finished, y cancelled corta la
// cadena en cualquier momento (es terminal, de ahi no se vuelve).
export const EVENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    CANCELLED: 'cancelled',
    FINISHED: 'finished'
};

// lista de valores validos, la usa el enum del modelo y las validaciones.
export const EVENT_STATUS_VALUES = Object.values(EVENT_STATUS);

export default EVENT_STATUS;

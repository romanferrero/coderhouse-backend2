export const success = (payload) => ({ status: 'success', payload });

// exito sin payload, solo un mensajito de confirmacion (login, logout).
export const message = (text) => ({ status: 'success', message: text });

// respuesta de un listado paginado: la pagina en 'data' mas la metadata que
// necesita el cliente para saber donde esta parado.
export const paginated = ({ data, page, limit, total, totalPages }) => ({
    status: 'success',
    data,
    page,
    limit,
    total,
    totalPages
});

export const error = (message) => ({ status: 'error', message });

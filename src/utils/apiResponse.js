export const success = (payload) => ({ status: 'success', payload });

// exito sin payload, solo un mensajito de confirmacion (login, logout).
export const message = (text) => ({ status: 'success', message: text });

export const error = (message) => ({ status: 'error', message });

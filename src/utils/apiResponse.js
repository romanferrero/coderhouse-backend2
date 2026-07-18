export const success = (payload) => ({ status: 'success', payload });

export const error = (message) => ({ status: 'error', message });

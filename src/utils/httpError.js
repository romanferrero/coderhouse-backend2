// crea un Error con status http para que el errorHandler global arme la respuesta
// { status: 'error', message } con el codigo correspondiente. lo usan los services
// y middlewares para no repetir este mismo patron en cada lado.
export const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

export default httpError;

// Envuelve un handler async para que sus rechazos lleguen al error handler global.
// Sin esto, Express 4 no captura promesas rechazadas y la request queda colgada.
export const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;

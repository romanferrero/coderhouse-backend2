// unico lugar donde viven los nombres de los roles. las rutas y middlewares
// importan estas constantes en vez de escribir 'organizer'/'admin' a mano, asi
// no quedan roles hardcodeados desperdigados por el codigo.
export const ROLES = {
    USER: 'user',
    ORGANIZER: 'organizer',
    ADMIN: 'admin'
};

// lista de valores validos, util para el enum del modelo o validaciones.
export const ROLE_VALUES = Object.values(ROLES);

export default ROLES;

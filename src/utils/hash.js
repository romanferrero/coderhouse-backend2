import bcrypt from 'bcrypt';

// Costo del hash: mas alto = mas seguro pero mas lento. 10 es el estandar.
const SALT_ROUNDS = 10;

// Genera el hash de una contrasena en texto plano. Reutilizable desde el
// registro y desde cualquier flujo que necesite persistir credenciales.
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

// Compara una contrasena en texto plano contra su hash. Se usa en el login
// de la proxima entrega.
export const isValidPassword = (password, hash) => bcrypt.compare(password, hash);

export default { hashPassword, isValidPassword };

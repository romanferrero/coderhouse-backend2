import { randomBytes } from 'crypto';

// alfabeto sin caracteres ambiguos (0/O, 1/I/L): el codigo se dicta por telefono o
// se copia a mano en la puerta del evento, y confundir un cero con una O es facil.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;
const PREFIX = 'TCK';

// codigo publico del ticket, del estilo TCK-A3F9K2MZQ7.
//
// va con randomBytes y no con Math.random porque es el dato que identifica la
// inscripcion de cara al usuario: con un generador predecible cualquiera podria
// adivinar codigos ajenos.
export const generateReservationCode = () => {
    const bytes = randomBytes(CODE_LENGTH);

    let code = '';
    for (const byte of bytes) {
        code += ALPHABET[byte % ALPHABET.length];
    }

    return `${PREFIX}-${code}`;
};

export default generateReservationCode;

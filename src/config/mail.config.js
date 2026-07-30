import nodemailer from 'nodemailer';
import { config, isMailConfigured } from './env.config.js';

// el transporter se crea una sola vez y se reusa: nodemailer mantiene un pool de
// conexiones smtp, armar uno por cada mail seria abrir y cerrar la conexion cada vez.
let transporter = null;

// devuelve el transporter, creandolo la primera vez. si faltan credenciales
// devuelve null y el mail.service se da cuenta de que no puede enviar.
//
// las credenciales salen siempre de env.config (o sea, de variables de entorno):
// no hay ni un host ni un password escrito en el codigo.
export const getTransporter = () => {
    if (!isMailConfigured()) return null;
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        // el 465 es smtp sobre tls implicito (secure); el resto (587, 25) arranca
        // en claro y sube a tls con STARTTLS.
        secure: config.mail.port === 465,
        auth: {
            user: config.mail.user,
            pass: config.mail.pass
        }
    });

    return transporter;
};

export default getTransporter;

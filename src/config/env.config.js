import dotenv from 'dotenv';

dotenv.config();

// Unico punto del proyecto que lee process.env.
export const config = {
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MONGO_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    // cuanto dura el jwt, en el formato de jsonwebtoken (ej: '1h', '30m').
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    // credenciales del servidor de mail. nunca van hardcodeadas: si falta alguna,
    // el transporter no se crea y el envio se saltea (la inscripcion igual se hace).
    mail: {
        host: process.env.MAIL_HOST || '',
        port: Number(process.env.MAIL_PORT) || 587,
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
        // remitente que ve el destinatario. si no viene, se usa el usuario smtp.
        from: process.env.MAIL_FROM || process.env.MAIL_USER || ''
    }
};

// sin host/user/pass no hay forma de mandar mails: se chequea en un solo lugar
// para que el mailer sepa si puede armar el transporter o tiene que saltear.
export const isMailConfigured = () => Boolean(config.mail.host && config.mail.user && config.mail.pass);

export default config;

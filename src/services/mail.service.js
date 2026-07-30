import { getTransporter } from '../config/mail.config.js';
import { config, isMailConfigured } from '../config/env.config.js';

// formatea la fecha del evento en algo legible para el mail. si por lo que sea no
// es una fecha valida, se devuelve 'a confirmar' antes que un 'Invalid Date'.
const formatDate = (date) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'a confirmar';

    return parsed.toLocaleString('es-AR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
};

// version texto plano del mail, para los clientes que no renderizan html.
const buildText = ({ name, event, ticket }) => [
    `Hola ${name},`,
    '',
    `Tu inscripcion a "${event.title}" quedo confirmada.`,
    '',
    `Codigo de reserva: ${ticket.reservationCode}`,
    `Lugares reservados: ${ticket.quantity}`,
    `Fecha: ${formatDate(event.date)}`,
    `Lugar: ${event.location}`,
    '',
    'Presenta el codigo de reserva el dia del evento.',
    '',
    'Plataforma de Eventos Deportivos'
].join('\n');

const buildHtml = ({ name, event, ticket }) => `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #222; line-height: 1.5;">
        <h2 style="margin-bottom: 4px;">Inscripcion confirmada</h2>
        <p>Hola <strong>${name}</strong>, tu inscripcion a <strong>${event.title}</strong> quedo confirmada.</p>
        <table cellpadding="6" style="border-collapse: collapse; margin: 16px 0;">
            <tr><td><strong>Codigo de reserva</strong></td><td>${ticket.reservationCode}</td></tr>
            <tr><td><strong>Lugares reservados</strong></td><td>${ticket.quantity}</td></tr>
            <tr><td><strong>Fecha</strong></td><td>${formatDate(event.date)}</td></tr>
            <tr><td><strong>Lugar</strong></td><td>${event.location}</td></tr>
        </table>
        <p>Presenta el codigo de reserva el dia del evento.</p>
        <p style="color: #777; font-size: 12px;">Plataforma de Eventos Deportivos</p>
    </div>
`;

// Envio de notificaciones por email. Es un servicio aparte a proposito: el service
// de tickets no sabe nada de smtp ni de nodemailer, solo pide "avisale a este mail".
class MailService {
    // mail de confirmacion de inscripcion.
    //
    // devuelve true/false en lugar de tirar: que el servidor de mail este caido no
    // puede tumbar una inscripcion que ya se guardo bien en la base. si falla, se
    // loguea y la request sigue su curso con un 201 normal.
    async sendTicketConfirmation({ to, name, event, ticket }) {
        if (!isMailConfigured()) {
            console.warn('[mail] MAIL_HOST/MAIL_USER/MAIL_PASS sin configurar: no se envia el mail de confirmacion');
            return false;
        }

        try {
            const transporter = getTransporter();

            await transporter.sendMail({
                from: config.mail.from,
                to,
                subject: `Inscripcion confirmada: ${event.title}`,
                text: buildText({ name, event, ticket }),
                html: buildHtml({ name, event, ticket })
            });

            return true;
        } catch (error) {
            console.error('[mail] No se pudo enviar el mail de confirmacion:', error.message);
            return false;
        }
    }
}

export const mailService = new MailService();

export default mailService;

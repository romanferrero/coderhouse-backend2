import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import apiRouter from './routes/index.router.js';
import { initializePassport } from './config/passport.config.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// pasa las cookies que llegan a req.cookies (lo usa la estrategia 'current').
app.use(cookieParser());

// registra las estrategias (viven en passport.config.js) y engancha passport al
// pipeline. sin sesiones: cada request se autentica con el jwt de la cookie.
initializePassport();
app.use(passport.initialize());

app.use('/api', apiRouter);

// Siempre al final: primero el 404, despues el manejo de errores.
app.use(notFound);
app.use(errorHandler);

export default app;

import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.router.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// pasa las cookies que llegan a req.cookies (lo usa el middleware auth).
app.use(cookieParser());

app.use('/api', apiRouter);

// Siempre al final: primero el 404, despues el manejo de errores.
app.use(notFound);
app.use(errorHandler);

export default app;

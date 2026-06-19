import express from 'express';

import { errorHandler } from './middlewares/errorHandler.js';
import { generateRouter } from './routes/generate.js';
import { healthRouter } from './routes/health.route.js';

export const app = express();

app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', generateRouter);

app.use(errorHandler);

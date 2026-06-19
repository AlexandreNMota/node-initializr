import express from 'express';

import { healthRouter } from './routes/health.route.js';
import { generateRouter } from './routes/generate.js';
export const app = express();

app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', generateRouter);

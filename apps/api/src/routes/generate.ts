import { Router } from 'express';

import { generateProject } from '../engine/index.js';
import { validate } from '../engine/validator.js';

export const generateRouter = Router();

generateRouter.post('/generate', async (request, response, next) => {
  const validation = validate(request.body);

  if (!validation.success) {
    response.status(400).json({
      error: validation.error,
    });
    return;
  }

  try {
    const zipBuffer = await generateProject(validation.data);

    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${validation.data.name}.zip"`);
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(zipBuffer);
  } catch (error) {
    next(error);
  }
});

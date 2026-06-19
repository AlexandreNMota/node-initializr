import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../app.ts';

describe('GET /api/health', () => {
  it('deve retornar 200', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
  });

  it('deve retornar status ok', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body).toEqual({ status: 'ok' });
  });
});

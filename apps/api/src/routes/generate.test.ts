import { Buffer } from 'node:buffer';

import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateProject } from '../engine/index.js';
import { app } from '../app.js';

vi.mock('../engine/index.js', () => ({
  generateProject: vi.fn().mockResolvedValue(Buffer.from('fake-zip-content')),
}));

const validPayload = {
  name: 'meu-projeto',
  packageManager: 'pnpm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'postgresql',
  orm: 'prisma',
  auth: 'jwt',
  messaging: 'none',
  dependencies: ['docker', 'swagger'],
};

function parseBinaryResponse(
  response: request.Response,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  response.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });

  response.on('error', (error: Error) => {
    callback(error, Buffer.alloc(0));
  });
}

describe('POST /api/generate - sucesso', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 200 para payload valido', async () => {
    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.status).toBe(200);
  });

  it('deve retornar Content-Type application/zip', async () => {
    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.headers['content-type']).toContain('application/zip');
  });

  it('deve retornar Content-Disposition com o nome do projeto', async () => {
    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.headers['content-disposition']).toContain('meu-projeto.zip');
  });

  it('deve retornar Cache-Control no-store', async () => {
    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('deve retornar corpo binario nao vazio', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send(validPayload)
      .buffer(true)
      .parse(parseBinaryResponse);

    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('POST /api/generate - campos invalidos', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 400 quando name esta ausente', async () => {
    const payload = { ...validPayload };
    delete (payload as Partial<typeof validPayload>).name;

    const response = await request(app).post('/api/generate').send(payload);

    expect(response.status).toBe(400);
  });

  it('deve retornar 400 quando name tem caracteres invalidos', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ ...validPayload, name: 'Projeto Invalido!' });

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe('name');
  });

  it('deve retornar 400 quando framework e desconhecido', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ ...validPayload, framework: 'koa' });

    expect(response.status).toBe(400);
    expect(response.body.error.field).toBe('framework');
  });

  it('deve retornar envelope de erro padronizado', async () => {
    const payload = { ...validPayload };
    delete (payload as Partial<typeof validPayload>).name;

    const response = await request(app).post('/api/generate').send(payload);

    expect(response.body).toMatchObject({
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });

  it('nao deve chamar generateProject quando payload e invalido', async () => {
    const payload = { ...validPayload };
    delete (payload as Partial<typeof validPayload>).name;

    await request(app).post('/api/generate').send(payload);

    expect(generateProject).not.toHaveBeenCalled();
  });
});

describe('POST /api/generate - combinacoes invalidas', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 400 e INVALID_COMBINATION para ORM sem banco', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ ...validPayload, database: 'none', orm: 'prisma' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_COMBINATION');
  });

  it('deve retornar 400 para bullmq sem redis', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ ...validPayload, messaging: 'bullmq', dependencies: [] });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_COMBINATION');
  });

  it('deve retornar 400 para mongoose com postgresql', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ ...validPayload, database: 'postgresql', orm: 'mongoose' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_COMBINATION');
  });
});

describe('POST /api/generate - erros internos', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 500 quando o motor lanca excecao', async () => {
    vi.mocked(generateProject).mockRejectedValueOnce(new Error('Template not found'));

    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('GENERATION_FAILED');
  });

  it('nao deve expor stack trace no body', async () => {
    vi.mocked(generateProject).mockRejectedValueOnce(new Error('Internal error'));

    const response = await request(app).post('/api/generate').send(validPayload);

    expect(response.body.error.message).not.toContain('at ');
    expect(response.body).not.toHaveProperty('stack');
  });
});

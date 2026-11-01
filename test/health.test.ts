import assert from 'node:assert/strict';
import test from 'node:test';

process.env.ACCESS_TOKEN_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:1/student_housing';

const { createFastifyApplication } = await import('../src/app.js');
const fastifyApplication = await createFastifyApplication();

test('health endpoint suite', async (suite) => {
  await suite.test('liveness responds successfully without requiring database availability', async () => {
    const response = await fastifyApplication.inject({ method: 'GET', url: '/api/v1/health/live' });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, 'ok');
  });

  await suite.test('readiness returns unavailable when PostgreSQL cannot be reached', async () => {
    const response = await fastifyApplication.inject({ method: 'GET', url: '/api/v1/health/ready' });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().status, 'unavailable');
    assert.equal(response.json().dependencies.postgresDatabase, 'unavailable');
  });

  await fastifyApplication.close();
});

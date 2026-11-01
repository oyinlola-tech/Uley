import assert from 'node:assert/strict';
import test from 'node:test';

process.env.ACCESS_TOKEN_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:1/student_housing';

const { createFastifyApplication } = await import('../src/app.js');
const { hashAccountPassword, verifyAccountPassword } = await import('../src/utils/password.js');
const { createSignedAccessToken, verifySignedAccessToken } = await import('../src/utils/accessToken.js');
const { UserRole } = await import('../src/enums/userRole.enum.js');
const fastifyApplication = await createFastifyApplication();

test('authentication endpoints reject invalid or unauthenticated requests', async (suite) => {
  await suite.test('student registration validates required account data', async () => {
    const response = await fastifyApplication.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { emailAddress: 'not-an-email', fullName: 'A', password: 'short' },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_FAILED');
  });

  await suite.test('password login validates email and password input', async () => {
    const response = await fastifyApplication.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { emailAddress: 'not-an-email', password: '' },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_FAILED');
  });

  await suite.test('current-account endpoint requires a bearer access token', async () => {
    const response = await fastifyApplication.inject({ method: 'GET', url: '/api/v1/auth/me' });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, 'UNAUTHORIZED');
  });

  await suite.test('refresh endpoint rejects a missing refresh token', async () => {
    const response = await fastifyApplication.inject({ method: 'POST', url: '/api/v1/auth/refresh' });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, 'UNAUTHORIZED');
  });

  await fastifyApplication.close();
});

test('password and access token security helpers', async (suite) => {
  await suite.test('password hashes verify only the original password', async () => {
    const passwordHash = await hashAccountPassword('correct horse battery staple');
    assert.equal(await verifyAccountPassword('correct horse battery staple', passwordHash), true);
    assert.equal(await verifyAccountPassword('incorrect password', passwordHash), false);
  });

  await suite.test('access tokens carry the user and session identifiers', () => {
    const accessToken = createSignedAccessToken('user-123', 'session-456', UserRole.STUDENT);
    const accessTokenClaims = verifySignedAccessToken(accessToken);
    assert.equal(accessTokenClaims.sub, 'user-123');
    assert.equal(accessTokenClaims.sid, 'session-456');
    assert.equal(accessTokenClaims.role, UserRole.STUDENT);
  });
});

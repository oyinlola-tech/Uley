import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const authIntegrationDatabaseUrl = process.env.AUTH_TEST_DATABASE_URL;
process.env.DATABASE_URL = authIntegrationDatabaseUrl ?? 'postgresql://postgres:postgres@127.0.0.1:1/student_housing';
process.env.ACCESS_TOKEN_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';

const { createFastifyApplication } = await import('../src/app.js');
const { prismaDatabaseClient } = await import('../src/database/prisma.database.js');

function readCookieValue(setCookieHeader: string | string[] | undefined, cookieName: string): string {
  const setCookieHeaders = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ''];
  const matchingCookieHeader = setCookieHeaders.find((cookieHeader) => cookieHeader.startsWith(`${cookieName}=`));
  assert.ok(matchingCookieHeader, `Expected response to set the ${cookieName} cookie`);
  return matchingCookieHeader.split(';', 1)[0]!.slice(cookieName.length + 1);
}

test('complete account and session lifecycle', { skip: !authIntegrationDatabaseUrl }, async (suite) => {
  const fastifyApplication = await createFastifyApplication();
  const uniqueEmailAddress = `auth-integration-${randomUUID()}@example.com`;
  const initialPlainTextPassword = 'student-accommodation-integration-password';
  const changedPlainTextPassword = 'student-accommodation-new-integration-password';

  try {
    await suite.test('browser login, account lookup, refresh rotation, and logout revoke access', async () => {
      const browserLoginResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { emailAddress: uniqueEmailAddress, password: initialPlainTextPassword },
      });
      assert.equal(browserLoginResponse.statusCode, 200);
      assert.equal(browserLoginResponse.json().authenticatedUser.emailAddress, uniqueEmailAddress);
      assert.equal('refreshToken' in browserLoginResponse.json(), false);
      const initialBrowserRefreshCookie = readCookieValue(
        browserLoginResponse.headers['set-cookie'],
        'uley_refresh_token',
      );
      assert.match(browserLoginResponse.headers['set-cookie'] as string, /HttpOnly/i);
      assert.match(browserLoginResponse.headers['cache-control'] as string, /no-store/i);

      const currentAccountResponse = await fastifyApplication.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${browserLoginResponse.json().accessToken}` },
      });
      assert.equal(currentAccountResponse.statusCode, 200);
      assert.equal(currentAccountResponse.json().authenticatedUser.emailAddress, uniqueEmailAddress);

      const browserRefreshResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: `uley_refresh_token=${initialBrowserRefreshCookie}` },
      });
      assert.equal(browserRefreshResponse.statusCode, 200);
      assert.equal('refreshToken' in browserRefreshResponse.json(), false);
      const rotatedBrowserRefreshCookie = readCookieValue(
        browserRefreshResponse.headers['set-cookie'],
        'uley_refresh_token',
      );
      assert.notEqual(rotatedBrowserRefreshCookie, initialBrowserRefreshCookie);

      const replayedBrowserRefreshResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: `uley_refresh_token=${initialBrowserRefreshCookie}` },
      });
      assert.equal(replayedBrowserRefreshResponse.statusCode, 401);

      const previousAccessTokenResponse = await fastifyApplication.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${browserLoginResponse.json().accessToken}` },
      });
      assert.equal(previousAccessTokenResponse.statusCode, 401);

      const browserLogoutResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { authorization: `Bearer ${browserRefreshResponse.json().accessToken}` },
      });
      assert.equal(browserLogoutResponse.statusCode, 200);
      const accessAfterLogoutResponse = await fastifyApplication.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${browserRefreshResponse.json().accessToken}` },
      });
      assert.equal(accessAfterLogoutResponse.statusCode, 401);
    });

    await suite.test('native login, logout-all, and password changes revoke existing sessions', async () => {
      const nativeLoginResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          emailAddress: uniqueEmailAddress,
          password: initialPlainTextPassword,
          clientType: 'native',
        },
      });
      assert.equal(nativeLoginResponse.statusCode, 200);
      assert.equal(typeof nativeLoginResponse.json().refreshToken, 'string');

      const nativeRefreshResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          clientType: 'native',
          refreshToken: nativeLoginResponse.json().refreshToken,
        },
      });
      assert.equal(nativeRefreshResponse.statusCode, 200);
      assert.notEqual(nativeRefreshResponse.json().refreshToken, nativeLoginResponse.json().refreshToken);

      const logoutAllResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/logout-all',
        headers: { authorization: `Bearer ${nativeRefreshResponse.json().accessToken}` },
      });
      assert.equal(logoutAllResponse.statusCode, 200);
      const accessAfterLogoutAllResponse = await fastifyApplication.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${nativeRefreshResponse.json().accessToken}` },
      });
      assert.equal(accessAfterLogoutAllResponse.statusCode, 401);

      const loginBeforePasswordChangeResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          emailAddress: uniqueEmailAddress,
          password: initialPlainTextPassword,
          clientType: 'native',
        },
      });
      const passwordChangeResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        headers: { authorization: `Bearer ${loginBeforePasswordChangeResponse.json().accessToken}` },
        payload: { currentPassword: initialPlainTextPassword, newPassword: changedPlainTextPassword },
      });
      assert.equal(passwordChangeResponse.statusCode, 200);

      const accessAfterPasswordChangeResponse = await fastifyApplication.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${loginBeforePasswordChangeResponse.json().accessToken}` },
      });
      assert.equal(accessAfterPasswordChangeResponse.statusCode, 401);

      const loginUsingOldPasswordResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { emailAddress: uniqueEmailAddress, password: initialPlainTextPassword },
      });
      assert.equal(loginUsingOldPasswordResponse.statusCode, 401);

      const loginUsingNewPasswordResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { emailAddress: uniqueEmailAddress, password: changedPlainTextPassword },
      });
      assert.equal(loginUsingNewPasswordResponse.statusCode, 200);
    });
  } finally {
    await prismaDatabaseClient.user.deleteMany({
      where: { email: uniqueEmailAddress },
    });
    await fastifyApplication.close();
    await prismaDatabaseClient.$disconnect();
  }
});

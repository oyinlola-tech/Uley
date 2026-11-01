import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const authIntegrationDatabaseUrl = process.env.AUTH_TEST_DATABASE_URL;
process.env.DATABASE_URL = authIntegrationDatabaseUrl ?? 'postgresql://postgres:postgres@127.0.0.1:1/student_housing';
process.env.ACCESS_TOKEN_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';

const { createFastifyApplication } = await import('../src/app.js');
const { prismaDatabaseClient } = await import('../src/database/prisma.database.js');

test('student and landlord registration', { skip: !authIntegrationDatabaseUrl }, async (suite) => {
  const fastifyApplication = await createFastifyApplication();
  const uniqueStudentEmailAddress = `auth-registration-${randomUUID()}@example.com`;
  const uniqueLandlordEmailAddress = `landlord-registration-${randomUUID()}@example.com`;
  const registrationPassword = 'student-accommodation-integration-password';

  try {
    await suite.test('creates each public role and rejects duplicate email addresses', async () => {
      const studentRegistrationResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          emailAddress: uniqueStudentEmailAddress,
          fullName: 'Integration Student',
          password: registrationPassword,
        },
      });
      assert.equal(studentRegistrationResponse.statusCode, 201);
      assert.equal(studentRegistrationResponse.json().authenticatedUser.userRole, 'STUDENT');
      assert.equal('passwordHash' in studentRegistrationResponse.json().authenticatedUser, false);

      const landlordRegistrationResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/register/landlord',
        payload: {
          emailAddress: uniqueLandlordEmailAddress,
          fullName: 'Integration Landlord',
          password: registrationPassword,
        },
      });
      assert.equal(landlordRegistrationResponse.statusCode, 201);
      assert.equal(landlordRegistrationResponse.json().authenticatedUser.userRole, 'LANDLORD');

      const duplicateRegistrationResponse = await fastifyApplication.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          emailAddress: uniqueStudentEmailAddress,
          fullName: 'Duplicate Student',
          password: registrationPassword,
        },
      });
      assert.equal(duplicateRegistrationResponse.statusCode, 409);
    });
  } finally {
    await prismaDatabaseClient.user.deleteMany({
      where: { email: { in: [uniqueStudentEmailAddress, uniqueLandlordEmailAddress] } },
    });
    await fastifyApplication.close();
    await prismaDatabaseClient.$disconnect();
  }
});

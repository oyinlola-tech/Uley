import 'dotenv/config';
import { NodeEnvironment } from '../enums/nodeEnvironment.enum.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';
import { APPLICATION_DEFAULTS } from '../constants/applicationDefault.constant.js';
import { MediaStorageBackend } from '../enums/mediaStorageBackend.enum.js';

function getRequiredEnvironmentVariable(environmentVariableName: string): string {
  const environmentVariableValue = process.env[environmentVariableName]?.trim();
  if (!environmentVariableValue) {
    throw new Error(ERROR_MESSAGES.missingEnvironmentVariable(environmentVariableName));
  }
  return environmentVariableValue;
}

function getPositiveIntegerEnvironmentVariable(environmentVariableName: string, fallbackValue: number): number {
  const rawEnvironmentVariableValue = process.env[environmentVariableName];
  if (!rawEnvironmentVariableValue) return fallbackValue;
  const parsedEnvironmentVariableValue = Number(rawEnvironmentVariableValue);
  if (!Number.isInteger(parsedEnvironmentVariableValue) || parsedEnvironmentVariableValue <= 0) {
    throw new Error(ERROR_MESSAGES.positiveIntegerRequired(environmentVariableName));
  }
  return parsedEnvironmentVariableValue;
}

const configuredNodeEnvironment = process.env.NODE_ENV ?? NodeEnvironment.DEVELOPMENT;
if (!Object.values(NodeEnvironment).includes(configuredNodeEnvironment as NodeEnvironment)) {
  throw new Error(ERROR_MESSAGES.invalidNodeEnvironment);
}
const configuredMediaStorageBackend = process.env.MEDIA_STORAGE_BACKEND?.trim() || MediaStorageBackend.LOCAL;
if (!Object.values(MediaStorageBackend).includes(configuredMediaStorageBackend as MediaStorageBackend)) {
  throw new Error(ERROR_MESSAGES.invalidMediaStorageBackend);
}

const configuredAccessTokenSecret = getRequiredEnvironmentVariable('ACCESS_TOKEN_SECRET');
if (configuredAccessTokenSecret.length < AUTH_SECURITY_CONSTANTS.accessTokenMinimumSecretLength) {
  throw new Error(ERROR_MESSAGES.accessTokenSecretTooShort(AUTH_SECURITY_CONSTANTS.accessTokenMinimumSecretLength));
}

export const applicationEnvironment = {
  nodeEnvironment: configuredNodeEnvironment as NodeEnvironment,
  host: process.env.HOST ?? '0.0.0.0',
  port: getPositiveIntegerEnvironmentVariable('PORT', APPLICATION_DEFAULTS.apiPort),
  databaseUrl: getRequiredEnvironmentVariable('DATABASE_URL'),
  accessTokenSecret: configuredAccessTokenSecret,
  accessTokenLifetimeInSeconds: getPositiveIntegerEnvironmentVariable('ACCESS_TOKEN_LIFETIME_SECONDS', APPLICATION_DEFAULTS.accessTokenLifetimeInSeconds),
  refreshTokenLifetimeInDays: getPositiveIntegerEnvironmentVariable('REFRESH_TOKEN_LIFETIME_DAYS', APPLICATION_DEFAULTS.refreshTokenLifetimeInDays),
  smtpHost: process.env.SMTP_HOST?.trim() ?? '',
  smtpPort: getPositiveIntegerEnvironmentVariable('SMTP_PORT', APPLICATION_DEFAULTS.smtpPort),
  smtpUsername: process.env.SMTP_USERNAME?.trim() ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFromAddress: process.env.SMTP_FROM_ADDRESS?.trim() ?? '',
  mediaServiceUrl: process.env.MEDIA_SERVICE_URL?.trim() ?? '',
  mediaServiceApiKey: process.env.MEDIA_SERVICE_API_KEY?.trim() ?? '',
  mediaStorageBackend: configuredMediaStorageBackend as MediaStorageBackend,
  expoPushAccessToken: process.env.EXPO_PUSH_ACCESS_TOKEN?.trim() ?? '',
  mediaUploadTemporaryDirectory: process.env.MEDIA_UPLOAD_TEMP_DIRECTORY?.trim() || '.data/media-uploads',
  bachsApiKey: process.env.BACHS_API_KEY?.trim() ?? '',
  bachsWebhookSecret: process.env.BACHS_WEBHOOK_SECRET?.trim() ?? '',
  bachsApiBaseUrl: process.env.BACHS_API_BASE_URL?.trim() || (configuredNodeEnvironment === NodeEnvironment.PRODUCTION ? 'https://api.bachs.io/v1' : 'https://sandbox-api.bachs.io/v1'),
  webAppBaseUrl: process.env.WEB_APP_BASE_URL?.trim() ?? '',
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;

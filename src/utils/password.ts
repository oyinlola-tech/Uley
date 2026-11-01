import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';

const { passwordHashKeyLengthInBytes, passwordHashWorkFactor, passwordHashBlockSize, passwordHashParallelization } = AUTH_SECURITY_CONSTANTS;

function deriveScryptPasswordKey(plainTextPassword: string, passwordSalt: Buffer, outputLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      plainTextPassword,
      passwordSalt,
      outputLength,
      { N: passwordHashWorkFactor, r: passwordHashBlockSize, p: passwordHashParallelization },
      (derivationError, derivedPasswordKey) => {
        if (derivationError) reject(derivationError);
        else resolve(derivedPasswordKey as Buffer);
      },
    );
  });
}

export async function hashAccountPassword(plainTextPassword: string): Promise<string> {
  const randomPasswordSalt = randomBytes(AUTH_SECURITY_CONSTANTS.passwordHashSaltLengthInBytes);
  const derivedPasswordKey = await deriveScryptPasswordKey(
    plainTextPassword,
    randomPasswordSalt,
    passwordHashKeyLengthInBytes,
  );
  return `scrypt$${passwordHashWorkFactor}$${passwordHashBlockSize}$${passwordHashParallelization}$${randomPasswordSalt.toString('base64url')}$${derivedPasswordKey.toString('base64url')}`;
}

export async function verifyAccountPassword(
  plainTextPassword: string,
  storedPasswordHash: string,
): Promise<boolean> {
  const [algorithmName, workFactor, blockSize, parallelization, saltText, keyText] = storedPasswordHash.split('$');
  if (algorithmName !== 'scrypt' || workFactor !== String(passwordHashWorkFactor)
    || blockSize !== String(passwordHashBlockSize) || parallelization !== String(passwordHashParallelization)
    || !saltText || !keyText) {
    return false;
  }

  const storedPasswordSalt = Buffer.from(saltText, 'base64url');
  const storedDerivedPasswordKey = Buffer.from(keyText, 'base64url');
  if (storedPasswordSalt.length !== AUTH_SECURITY_CONSTANTS.passwordHashSaltLengthInBytes || storedDerivedPasswordKey.length !== passwordHashKeyLengthInBytes) {
    return false;
  }

  const derivedPasswordKey = await deriveScryptPasswordKey(
    plainTextPassword,
    storedPasswordSalt,
    storedDerivedPasswordKey.length,
  );
  return timingSafeEqual(storedDerivedPasswordKey, derivedPasswordKey);
}

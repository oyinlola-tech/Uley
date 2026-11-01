import { z } from 'zod';
import { PushDevicePlatform } from '@prisma/client';

export const registerPushDeviceSchema = z.object({
  expoPushToken: z.string().trim().min(20).max(255).regex(/^(Expo|Exponent)PushToken\[[^\]]+\]$/),
  platform: z.nativeEnum(PushDevicePlatform),
}).strict();

export const removePushDeviceSchema = z.object({
  expoPushToken: z.string().trim().min(20).max(255).regex(/^(Expo|Exponent)PushToken\[[^\]]+\]$/),
}).strict();

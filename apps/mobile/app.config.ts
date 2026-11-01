import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  return {
    ...config,
    name: config.name ?? 'Uley',
    slug: config.slug ?? 'uley',
    version: config.version ?? '1.0.0',
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
  };
};

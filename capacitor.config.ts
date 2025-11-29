import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app',
  appName: 'SakaJuntos',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;

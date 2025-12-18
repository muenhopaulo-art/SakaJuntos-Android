import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app',
  appName: 'SakaJuntos',
  webDir: 'out',
  server: {
    url: 'https://studio--sakajuntos-2-55995544-7207a.us-central1.hosted.app/',
    cleartext: false,
    errorPath: 'offline.html',
    // Adicione esta linha para permitir o carregamento do offline.html local
    androidScheme: 'https' 
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidScaleType: "CENTER_CROP",
      splashResourceName: "splash",
      showSpinner: false,
    }
  }
};

export default config;

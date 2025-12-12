import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app',
  appName: 'SakaJuntos',
  webDir: 'out',
  server: {
    url: 'https://studio--sakajuntos-webbtext-6802-b1659.us-central1.hosted.app/', 
    cleartext: false 
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // >> CONFIGURAÇÃO DO SPLASH SCREEN ADICIONADA AQUI <<
    SplashScreen: {
      launchShowDuration: 3000,         // Exibe o splash por 3 segundos
      launchAutoHide: true,             // Oculta automaticamente
      backgroundColor: "#ffffffff",     // Cor de fundo (Branco)
      androidScaleType: "CENTER_CROP",  // Como a imagem se ajusta
      splashResourceName: "splash",     // Assume que a imagem se chama 'splash.png'
      showSpinner: true,                // Exibe o spinner de carregamento
    }
  }
};

export default config;
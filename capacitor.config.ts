import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app',
  appName: 'SakaJuntos',
  webDir: 'out',
  server: {
    url: 'https://studio--sakajuntos-2-55995544-7207a.us-central1.hosted.app/',
    cleartext: false,
    // >> NOVA LINHA: Redireciona para a página local quando sem internet <<
    errorPath: 'offline.html'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // >> CONFIGURAÇÃO DO SPLASH SCREEN (Mantida) <<
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

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app', // O ID do seu pacote
  appName: 'SakaJuntos', // Baseado no nome do seu projeto
  webDir: 'out', // Baseado na pasta de destino do seu build web
  server: {
    androidScheme: 'https',
    // Não é necessário declarar o domínio aqui se o seu app está a ser carregado via file:// 
    // ou se o proxy não for estritamente necessário para a API.
  },
  plugins: {
    // Configuração para manter o login do Firebase ativo
    // A persistência agora é tratada diretamente no código do firebase.ts
    // usando o @capacitor/preferences, então a configuração aqui não é mais necessária.
    
    // O plugin de geolocalização não precisa de configuração aqui, mas o
    // de Notificações, sim:
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
    // Outros plugins, como o SplashScreen, ficariam aqui se precisassem de ajustes.
  }
};

export default config;

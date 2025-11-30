
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakajuntos.app', // Baseado no seu appId
  appName: 'SakaJuntos', // Baseado no nome do seu projeto
  webDir: 'out', // Baseado na pasta de destino do seu build web
  server: {
    androidScheme: 'https',
    // Não é necessário declarar o domínio aqui se o seu app está a ser carregado via file:// 
    // ou se o proxy não for estritamente necessário para a API.
  },
  plugins: {
    // 🔑 CORREÇÃO CRÍTICA PARA O LOGIN PERSISTENTE
    // Isso garante que o cache e os tokens de sessão sejam salvos no disco
    // e não sejam limpos a cada abertura do aplicativo.
    CapacitorHttp: { 
      androidStorageType: 'disk'
    },
    // O plugin de geolocalização não precisa de configuração aqui, mas o
    // de Notificações, sim:
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
    // Outros plugins, como o SplashScreen, ficariam aqui se precisassem de ajustes.
  }
};

export default config;

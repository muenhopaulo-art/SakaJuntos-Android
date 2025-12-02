
# Guia de Configuração Nativa Android (Capacitor)

Este guia contém os passos manuais e **obrigatórios** que você precisa de seguir no Android Studio e na consola Firebase para que todas as funcionalidades nativas da sua aplicação funcionem corretamente.

## Pré-requisitos

Antes de seguir este guia, certifique-se de que já executou os seguintes comandos no terminal do seu projeto:

1.  `npm install` (para instalar todas as dependências)
2.  `npm run build:mobile` (para criar a versão web da sua app)
3.  `npx cap add android` (para criar a pasta `android` do projeto)
4.  `npx cap sync android` (para sincronizar o seu código web com o projeto nativo)

## Passo 1: Configurar Notificações Push com Firebase

As notificações push no Android requerem o Firebase Cloud Messaging (FCM).

### 1.1. Obter o Ficheiro `google-services.json`

1.  **Vá para a Consola Firebase:** [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Selecione o seu Projeto:** Escolha o projeto Firebase que está a usar para esta aplicação (o ID do projeto é `scio-cesta`).
3.  **Adicionar uma Aplicação Android:**
    *   Na página principal do projeto, clique no ícone do Android (🤖) para "Adicionar aplicação".
    *   **Nome do pacote Android:** É **CRUCIAL** que este valor seja exatamente o mesmo que o `appId` no seu ficheiro `capacitor.config.ts`. Para este projeto, o valor é: `com.sakajuntos.app`.
    *   **Nome da aplicação (opcional):** SakaJuntos.
    *   **Certificado de assinatura de depuração SHA-1 (opcional):** Pode deixar este campo em branco por agora.
4.  **Registar a aplicação:** Clique no botão "Registar aplicação".
5.  **Transferir o ficheiro de configuração:** Na secção seguinte, clique em **"Transferir google-services.json"**. Guarde este ficheiro.
6.  **Pode ignorar os passos seguintes** na consola Firebase (clique em "Seguinte" e depois "Continuar para a consola").

### 1.2. Adicionar o Ficheiro ao Android Studio

1.  **Abra o seu Projeto no Android Studio:**
    *   Abra o Android Studio.
    *   Escolha "Open" ou "Open an Existing Project".
    *   Navegue até à pasta do seu projeto e selecione a subpasta `android`.

2.  **Mude para a Visão "Project":**
    *   No lado esquerdo do Android Studio, onde vê a estrutura de ficheiros, mude a vista de "Android" para **"Project"**. Isto permite-lhe ver a estrutura de pastas real.

3.  **Copie o Ficheiro:**
    *   Localize o ficheiro `google-services.json` que transferiu.
    *   Arraste e largue-o para dentro da pasta `android/app/`.

    A estrutura final deve ser:
    ```
    android
    └── app
        ├── src
        ├── build.gradle
        └── google-services.json  <-- O ficheiro deve estar aqui
    ```

## Passo 2: Sincronizar e Compilar

Depois de adicionar o ficheiro `google-services.json`:

1.  **Sincronize o projeto:** No Android Studio, deve aparecer uma barra no topo a dizer "Gradle files have changed...". Clique em **"Sync Now"**.
2.  **Compile a Aplicação:** Vá ao menu "Build" > "Make Project".
3.  **Execute a Aplicação:** Execute a aplicação no seu emulador ou dispositivo físico.

A partir deste momento, as notificações push deverão funcionar corretamente na sua aplicação Android.

    
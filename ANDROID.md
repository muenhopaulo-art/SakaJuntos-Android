# Como Gerar a Aplicação Android (APK)

Este guia explica como compilar a sua aplicação web progressiva (PWA) num ficheiro de aplicação Android (`.apk`) que pode ser publicado na Google Play Store.

O processo utiliza a ferramenta **Bubblewrap** da Google, que transforma o seu PWA numa **Trusted Web Activity (TWA)**.

## Pré-requisitos

Para seguir estes passos, você precisa de ter o seguinte software instalado no seu computador:

1.  **Node.js**: Se você está a correr este projeto, provavelmente já o tem.
2.  **Java Development Kit (JDK)**: Versão 11 ou mais recente. Você pode descarregá-lo [aqui](https://www.oracle.com/java/technologies/downloads/).
3.  **Android Studio (Recomendado)**: Embora não seja estritamente necessário para a compilação, você vai precisar dele para gerir o SDK do Android e criar a chave de assinatura da sua aplicação. Pode descarregá-lo [aqui](https://developer.android.com/studio).

---

## Passo 1: Inicializar o Projeto Android

Este passo só precisa de ser feito **uma vez**. Ele vai criar os ficheiros de configuração do projeto Android com base no `manifest.json` do seu site.

Abra o terminal na raiz do seu projeto e execute o seguinte comando:

```bash
npm run twa:init
```

A ferramenta irá fazer-lhe uma série de perguntas para configurar a aplicação (nome, domínio, cores, etc.). Para a maioria delas, pode simplesmente pressionar **Enter** para aceitar os valores padrão.

**As perguntas mais importantes são:**

*   **Domain of the PWA**: `firebasestudio-app.web.app` (Este é o domínio onde a sua app está alojada)
*   **Signing key creation**: Quando perguntar sobre a chave de assinatura, siga as instruções. **Guarde bem a palavra-passe que escolher!** Você irá precisar dela para todas as futuras atualizações da sua app.

Após este passo, você terá uma nova pasta `android` no seu projeto.

---

## Passo 2: Compilar (Build) a Aplicação

Este é o passo que você irá repetir sempre que quiser gerar um novo `.apk` (por exemplo, após fazer atualizações importantes na sua PWA).

No terminal, execute o comando:

```bash
npm run twa:build
```

A ferramenta irá usar a configuração do passo anterior e compilar a sua aplicação. Se for a primeira vez, pode demorar um pouco, pois irá descarregar as ferramentas necessárias do Android SDK.

Ao final do processo, você encontrará os seguintes ficheiros importantes:

*   `app-release.apk`: Este é o ficheiro da sua aplicação, pronto para ser testado num dispositivo Android ou enviado para a Google Play Store.
*   `assetlinks.json`: Um ficheiro crucial que você precisará de alojar no seu site para provar que você é o dono do domínio.

---

## Passo 3: Publicar o `assetlinks.json`

Para que a sua aplicação TWA funcione corretamente (em tela cheia, sem a barra do browser), você precisa de alojar o ficheiro `assetlinks.json` no seu site.

1.  **Encontre o ficheiro:** Ele estará na raiz do seu projeto após o `twa:build`.
2.  **Faça o upload:** Coloque este ficheiro dentro da pasta `public` do seu projeto Next.js, numa nova pasta chamada `.well-known`. O caminho final deve ser: `public/.well-known/assetlinks.json`.
3.  **Faça o deploy:** Faça o deploy do seu site para que o ficheiro esteja acessível publicamente no endereço `https://firebasestudio-app.web.app/.well-known/assetlinks.json`.

Depois disto, a sua aplicação `.apk` está pronta para ser distribuída!
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase'; 


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Converte de forma segura vários formatos de timestamp para milissegundos.
 * Lida com instâncias de Timestamp, objetos {seconds, nanoseconds}, e números.
 */
function safeTimestampToMillis(timestamp: any): number | undefined {
    if (!timestamp) {
        return undefined;
    }
    if (timestamp instanceof Timestamp) {
        return timestamp.toMillis();
    }
    if (typeof timestamp === 'object' && typeof timestamp.seconds === 'number') {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toMillis();
    }
    if (typeof timestamp === 'number') {
        return timestamp;
    }
    return undefined;
}

/**
 * Função Universal: Converte um documento ou uma lista de documentos do Firestore
 * para objetos simples (plain objects), convertendo todos os timestamps para números.
 * @param data O documento (objeto) ou a lista de documentos (array) do Firestore.
 * @returns Os dados com todos os timestamps convertidos para milissegundos.
 */
export function firestoreDocToPlainObject(data: any): any {
    if (!data) return data;

    // Se for um array, aplica a função a cada item
    if (Array.isArray(data)) {
        return data.map(item => firestoreDocToPlainObject(item));
    }
    
    // Se for um objeto Timestamp, converte-o
    if (data instanceof Timestamp || (typeof data.seconds === 'number' && typeof data.nanoseconds === 'number')) {
        return safeTimestampToMillis(data);
    }
    
    // Se não for um objeto, retorna como está (ex: string, número)
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    // Processa cada chave do objeto
    const plainObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Chama a função recursivamente para cada valor
            plainObject[key] = firestoreDocToPlainObject(data[key]);
        }
    }

    return plainObject;
}


/**
 * Faz o upload de uma imagem (string Base64) para o Firebase Storage e retorna o URL de download.
 * Inclui timeouts e tratamento de erro específico do Firebase.
 * @param path - O caminho no Storage onde o ficheiro será guardado.
 * @param base64String - O ficheiro a ser carregado como uma string data URI Base64.
 * @param fileName - O nome do ficheiro a ser criado no Storage.
 * @returns O URL público da imagem carregada.
 */
export async function uploadImageAndGetURL(
  path: string,
  base64String: string,
  fileName: string
): Promise<string> {
  const storage = getStorage(app);
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  try {
    console.log(`📤 Iniciando upload para: ${path}/${fileName}`);
    
    const uploadPromise = uploadString(storageRef, base64String, 'data_url');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_UPLOAD')), 15000)
    );
    
    await Promise.race([uploadPromise, timeoutPromise]);
    
    const downloadURLPromise = getDownloadURL(storageRef);
    const downloadTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_DOWNLOAD_URL')), 10000)
    );
    
    const downloadURL = await Promise.race([downloadURLPromise, downloadTimeoutPromise]);
    
    console.log(`✅ Upload concluído: ${downloadURL}`);
    return downloadURL as string;
    
  } catch (error: any) {
    console.error("❌ Erro no upload da imagem:", error);
    
    let errorMessage = "Não foi possível carregar a imagem.";
    
    if (error?.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = "Não tem permissão para publicar fotos. Verifique as regras do Firebase Storage.";
          break;
        case 'storage/canceled':
          errorMessage = "Upload cancelado.";
          break;
        case 'storage/unknown':
          errorMessage = "Erro desconhecido no armazenamento.";
          break;
        case 'storage/quota-exceeded':
          errorMessage = "Quota de armazenamento excedida.";
          break;
        case 'storage/unauthenticated':
          errorMessage = "Utilizador não autenticado. Faça login novamente.";
          break;
        default:
          errorMessage = `Erro do Firebase: ${error.code}`;
      }
    } else if (error?.message) {
      if (error.message === 'TIMEOUT_UPLOAD') {
        errorMessage = "Timeout no upload da imagem. A sua ligação pode estar lenta ou a imagem é muito grande.";
      } else if (error.message === 'TIMEOUT_DOWNLOAD_URL') {
        errorMessage = "Timeout ao obter URL da imagem após o upload.";
      } else {
        errorMessage = error.message;
      }
    }
    
    console.error(`🔒 Erro específico: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

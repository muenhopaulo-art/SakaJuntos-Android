import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
 * Faz o upload de um ficheiro binário para o Firebase Storage.
 * @param path - O caminho no Storage.
 * @param file - O objeto File direto do input (NÃO Base64).
 * @param fileName - O nome do ficheiro.
 */
export async function uploadImageAndGetURL(
  path: string,
  file: File | Blob, // ACEITA FILE OU BLOB
  fileName: string
): Promise<string> {
  const storage = getStorage(app);
  storage.maxOperationRetryTime = 20000; // Aumenta o tempo de retry para redes lentas
  
  const storageRef = ref(storage, `${path}/${fileName}`);
    
  try {
    console.log(`📤 Iniciando upload binário para: ${path}/${fileName}`);
        
    // USA uploadBytes, que é mais rápido e estável
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Bytes transferidos:', snapshot.bytesTransferred);

    const downloadURL = await getDownloadURL(storageRef);
        
    console.log(`✅ Upload concluído: ${downloadURL}`);
    return downloadURL;
      
  } catch (error: any) {
    console.error("❌ Erro no upload da imagem:", error);
    
    let errorMessage = "Não foi possível carregar a imagem.";
    
    if (error?.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = "Não tem permissão para publicar fotos. Verifique as regras do Firebase Storage.";
          break;
        case 'storage/unauthenticated':
          errorMessage = "Utilizador não autenticado. Faça login novamente.";
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
        default:
          errorMessage = `Erro do Firebase: ${error.code}`;
      }
    }
    
    throw new Error(errorMessage);
  }
}

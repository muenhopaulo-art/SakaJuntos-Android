import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';


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

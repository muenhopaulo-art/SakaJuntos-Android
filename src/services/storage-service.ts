
'use server';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path where the file should be stored in the bucket.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // 'file' comes from the browser, needs to be converted to a buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const snapshot = await uploadBytes(storageRef, buffer, {
        contentType: file.type,
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Falha no upload do ficheiro.");
  }
}

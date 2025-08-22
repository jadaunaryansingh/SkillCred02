import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  UploadTaskSnapshot
} from "firebase/storage";
import { storage, analytics } from "./firebase";
import { logEvent } from "firebase/analytics";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  downloadURL: string;
  fullPath: string;
  timeCreated: string;
  updated: string;
  md5Hash?: string;
}

export class FirebaseStorageService {
  // User Avatar Services
  static async uploadAvatar(
    uid: string, 
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Avatar must be an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Avatar file size must be less than 5MB');
      }

      const avatarRef = ref(storage, `avatars/${uid}/${file.name}`);
      
      if (onProgress) {
        const uploadTask = uploadBytesResumable(avatarRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress({
                progress,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                state: snapshot.state as any
              });
            },
            (error) => {
              console.error('Avatar upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              if (analytics) {
                logEvent(analytics, 'avatar_uploaded', { 
                  uid,
                  fileSize: file.size,
                  fileType: file.type
                });
              }
              
              resolve(downloadURL);
            }
          );
        });
      } else {
        const snapshot = await uploadBytes(avatarRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        if (analytics) {
          logEvent(analytics, 'avatar_uploaded', { 
            uid,
            fileSize: file.size,
            fileType: file.type
          });
        }
        
        return downloadURL;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  static async deleteAvatar(uid: string, fileName: string): Promise<void> {
    try {
      const avatarRef = ref(storage, `avatars/${uid}/${fileName}`);
      await deleteObject(avatarRef);
      
      if (analytics) {
        logEvent(analytics, 'avatar_deleted', { uid, fileName });
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }

  // Document/File Analysis Services
  static async uploadAnalysisFile(
    uid: string, 
    file: File,
    analysisId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Validate file types for analysis
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported for analysis');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = ref(storage, `analysis-files/${uid}/${analysisId}/${fileName}`);
      
      if (onProgress) {
        const uploadTask = uploadBytesResumable(fileRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress({
                progress,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                state: snapshot.state as any
              });
            },
            (error) => {
              console.error('File upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              if (analytics) {
                logEvent(analytics, 'analysis_file_uploaded', { 
                  uid,
                  analysisId,
                  fileSize: file.size,
                  fileType: file.type
                });
              }
              
              resolve(downloadURL);
            }
          );
        });
      } else {
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        if (analytics) {
          logEvent(analytics, 'analysis_file_uploaded', { 
            uid,
            analysisId,
            fileSize: file.size,
            fileType: file.type
          });
        }
        
        return downloadURL;
      }
    } catch (error) {
      console.error('Error uploading analysis file:', error);
      throw error;
    }
  }

  // Batch Upload Services
  static async uploadBatchFiles(
    uid: string,
    files: FileList,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    try {
      const uploadPromises: Promise<string>[] = [];
      const batchId = `batch_${Date.now()}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const promise = this.uploadAnalysisFile(
          uid, 
          file, 
          batchId,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        );
        uploadPromises.push(promise);
      }

      const downloadURLs = await Promise.all(uploadPromises);
      
      if (analytics) {
        logEvent(analytics, 'batch_files_uploaded', { 
          uid,
          batchId,
          fileCount: files.length
        });
      }
      
      return downloadURLs;
    } catch (error) {
      console.error('Error uploading batch files:', error);
      throw error;
    }
  }

  // File Management Services
  static async getUserFiles(uid: string): Promise<FileMetadata[]> {
    try {
      const userFilesRef = ref(storage, `analysis-files/${uid}`);
      const result = await listAll(userFilesRef);
      
      const fileMetadataPromises = result.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);
          
          return {
            name: metadata.name,
            size: metadata.size || 0,
            type: metadata.contentType || 'unknown',
            downloadURL,
            fullPath: metadata.fullPath,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            md5Hash: metadata.md5Hash
          } as FileMetadata;
        } catch (itemError) {
          console.warn('Error getting metadata for file:', itemError);
          // Return a basic file object if metadata fails
          return {
            name: itemRef.name,
            size: 0,
            type: 'unknown',
            downloadURL: '',
            fullPath: itemRef.fullPath,
            timeCreated: new Date().toISOString(),
            updated: new Date().toISOString(),
            md5Hash: ''
          } as FileMetadata;
        }
      });

      return await Promise.all(fileMetadataPromises);
    } catch (error) {
      console.error('Error getting user files:', error);
      
      // If it's a permission error, return empty array
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('Storage permission denied, returning empty file list');
        return [];
      }
      
      // For other errors, return empty array
      return [];
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      
      if (analytics) {
        logEvent(analytics, 'file_deleted', { filePath });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  static async getFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const fileRef = ref(storage, filePath);
      const metadata = await getMetadata(fileRef);
      const downloadURL = await getDownloadURL(fileRef);
      
      return {
        name: metadata.name,
        size: metadata.size || 0,
        type: metadata.contentType || 'unknown',
        downloadURL,
        fullPath: metadata.fullPath,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        md5Hash: metadata.md5Hash
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // File Processing Utilities
  static async processUploadedFile(downloadURL: string): Promise<string> {
    try {
      // Download the file and extract text
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      
      // Convert blob to buffer for processing
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // This would integrate with your existing file processing logic
      // For now, return the download URL
      return downloadURL;
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      throw error;
    }
  }

  // Storage Quota and Usage
  static async getStorageUsage(uid: string): Promise<{ usedBytes: number; fileCount: number }> {
    try {
      const files = await this.getUserFiles(uid);
      const usedBytes = files.reduce((total, file) => total + file.size, 0);
      
      return {
        usedBytes,
        fileCount: files.length
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      
      // If it's a permission error, return default values
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('Storage permission denied, using default values');
        return { usedBytes: 0, fileCount: 0 };
      }
      
      // For other errors, return default values
      return { usedBytes: 0, fileCount: 0 };
    }
  }

  // Cleanup old files
  static async cleanupOldFiles(uid: string, daysOld = 30): Promise<number> {
    try {
      const files = await this.getUserFiles(uid);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const filesToDelete = files.filter(file => 
        new Date(file.timeCreated) < cutoffDate
      );
      
      const deletePromises = filesToDelete.map(file => 
        this.deleteFile(file.fullPath)
      );
      
      await Promise.all(deletePromises);
      
      if (analytics) {
        logEvent(analytics, 'old_files_cleaned', { 
          uid,
          deletedCount: filesToDelete.length
        });
      }
      
      return filesToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }
}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.startsWith('text/')) return '📝';
  if (fileType.includes('word')) return '📄';
  return '📁';
};

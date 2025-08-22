import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db, analytics } from "./firebase";
import { logEvent } from "firebase/analytics";

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
  lastActive: any;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
    autoTranslate: boolean;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt?: any;
    features: string[];
  };
  stats: {
    totalAnalyses: number;
    textAnalyses: number;
    fileAnalyses: number;
    urlAnalyses: number;
    batchAnalyses: number;
  };
}

// Sentiment Analysis Record Interface
export interface SentimentRecord {
  id?: string;
  uid: string;
  type: 'text' | 'file' | 'url' | 'batch';
  inputText: string;
  originalText?: string;
  translatedText?: string;
  detectedLanguage: {
    language: string;
    confidence: number;
    iso639_1: string;
  };
  sentimentScores: Array<{
    label: string;
    score: number;
  }>;
  primarySentiment: {
    label: string;
    confidence: number;
  };
  summary: string;
  processingTimeMs: number;
  metadata: {
    fileType?: string;
    fileName?: string;
    url?: string;
    batchSize?: number;
  };
  createdAt: any;
  tags: string[];
  favorite: boolean;
}

// Analytics Event Interface
export interface AnalyticsEvent {
  id?: string;
  uid: string;
  event: string;
  category: string;
  data: any;
  timestamp: any;
  sessionId: string;
}

// Collections
const USERS_COLLECTION = 'users';
const SENTIMENTS_COLLECTION = 'sentiments';
const ANALYTICS_COLLECTION = 'analytics';

// User Profile Services
export class UserProfileService {
  static async createProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const defaultProfile: UserProfile = {
        uid,
        email: userData.email || '',
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
          autoTranslate: true,
        },
        subscription: {
          plan: 'free',
          features: ['basic_sentiment', 'language_detection', 'translation']
        },
        stats: {
          totalAnalyses: 0,
          textAnalyses: 0,
          fileAnalyses: 0,
          urlAnalyses: 0,
          batchAnalyses: 0,
        },
        ...userData
      };

      await updateDoc(userRef, defaultProfile);
      
      if (analytics) {
        logEvent(analytics, 'user_profile_created', { uid });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        ...updates,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async updateStats(uid: string, analysisType: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const updates: any = {
        'stats.totalAnalyses': increment(1),
        lastActive: serverTimestamp()
      };

      switch (analysisType) {
        case 'text':
          updates['stats.textAnalyses'] = increment(1);
          break;
        case 'file':
          updates['stats.fileAnalyses'] = increment(1);
          break;
        case 'url':
          updates['stats.urlAnalyses'] = increment(1);
          break;
        case 'batch':
          updates['stats.batchAnalyses'] = increment(1);
          break;
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  static subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  }
}

// Sentiment Analysis Services
export class SentimentService {
  static async saveSentimentRecord(record: Omit<SentimentRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const sentimentRecord: Omit<SentimentRecord, 'id'> = {
        ...record,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, SENTIMENTS_COLLECTION), sentimentRecord);
      
      // Update user stats
      try {
        await UserProfileService.updateStats(record.uid, record.type);
      } catch (statsError) {
        console.warn('Failed to update user stats:', statsError);
        // Continue execution even if stats update fails
      }
      
      if (analytics) {
        try {
          logEvent(analytics, 'sentiment_analysis_saved', { 
            type: record.type,
            sentiment: record.primarySentiment.label
          });
        } catch (analyticsError) {
          console.warn('Failed to log analytics event:', analyticsError);
          // Continue execution even if analytics fails
        }
      }

      return docRef.id;
    } catch (error: any) {
      console.error('Error saving sentiment record to Firebase:', error);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || 
          error.message?.includes('Missing or insufficient permissions') ||
          error.message?.includes('permission')) {
        
        console.log('Firebase permission denied, using localStorage fallback');
        
        // Fallback to localStorage
        try {
          const fallbackId = this.saveToLocalStorage(record);
          console.log('Successfully saved to localStorage with ID:', fallbackId);
          return fallbackId;
        } catch (fallbackError) {
          console.error('Fallback to localStorage also failed:', fallbackError);
          throw new Error('Unable to save sentiment record. Please check your Firebase permissions or try again later.');
        }
      }
      
      throw error;
    }
  }

  // Fallback method to save sentiment records to localStorage
  private static saveToLocalStorage(record: Omit<SentimentRecord, 'id' | 'createdAt'>): string {
    try {
      const fallbackRecord = {
        ...record,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      const key = `sentiment_${fallbackRecord.id}`;
      localStorage.setItem(key, JSON.stringify(fallbackRecord));
      
      // Also store in a list for easy retrieval
      const existingList = localStorage.getItem('sentiment_records_list') || '[]';
      const recordsList = JSON.parse(existingList);
      recordsList.push({
        id: fallbackRecord.id,
        uid: fallbackRecord.uid,
        type: fallbackRecord.type,
        createdAt: fallbackRecord.createdAt,
        primarySentiment: fallbackRecord.primarySentiment
      });
      localStorage.setItem('sentiment_records_list', JSON.stringify(recordsList));
      
      return fallbackRecord.id;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save sentiment record locally');
    }
  }

  // Method to retrieve sentiment records from localStorage fallback
  static async getLocalSentimentRecords(uid: string): Promise<SentimentRecord[]> {
    try {
      const recordsList = localStorage.getItem('sentiment_records_list') || '[]';
      const recordsIds = JSON.parse(recordsList);
      
      const localRecords: SentimentRecord[] = [];
      
      for (const recordInfo of recordsIds) {
        if (recordInfo.uid === uid) {
          const recordData = localStorage.getItem(`sentiment_${recordInfo.id}`);
          if (recordData) {
            localRecords.push(JSON.parse(recordData));
          }
        }
      }
      
      return localRecords.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error retrieving local sentiment records:', error);
      return [];
    }
  }

  // Method to sync local records to Firebase when permissions are restored
  static async syncLocalRecordsToFirebase(uid: string): Promise<void> {
    try {
      const localRecords = await this.getLocalSentimentRecords(uid);
      
      for (const record of localRecords) {
        if (record.id?.startsWith('local_')) {
          try {
            // Remove the local ID and createdAt for Firebase
            const { id, createdAt, ...recordForFirebase } = record;
            await this.saveSentimentRecord(recordForFirebase);
            
            // Remove from localStorage after successful sync
            localStorage.removeItem(`sentiment_${id}`);
            
            // Remove from list
            const recordsList = localStorage.getItem('sentiment_records_list') || '[]';
            const recordsIds = JSON.parse(recordsList);
            const updatedList = recordsIds.filter((r: any) => r.id !== id);
            localStorage.setItem('sentiment_records_list', JSON.stringify(updatedList));
            
            console.log(`Successfully synced local record ${id} to Firebase`);
          } catch (syncError) {
            console.warn(`Failed to sync local record ${record.id}:`, syncError);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing local records to Firebase:', error);
    }
  }

  // Method to check if Firebase is accessible and permissions are working
  static async checkFirebaseAccess(): Promise<{ accessible: boolean; error?: string }> {
    try {
      // Try to create a test document
      const testDoc = {
        uid: 'test',
        type: 'text' as const,
        inputText: 'test',
        originalText: 'test',
        detectedLanguage: {
          language: 'en',
          confidence: 1,
          iso639_1: 'en'
        },
        sentimentScores: [{
          label: 'neutral',
          score: 1
        }],
        primarySentiment: {
          label: 'neutral',
          confidence: 1
        },
        summary: 'test',
        processingTimeMs: 0,
        metadata: {},
        tags: [],
        favorite: false
      };

      const docRef = await addDoc(collection(db, SENTIMENTS_COLLECTION), testDoc);
      
      // If successful, delete the test document
      await deleteDoc(docRef);
      
      return { accessible: true };
    } catch (error: any) {
      console.log('Firebase access check failed:', error);
      return { 
        accessible: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }

  // Method to attempt to restore Firebase access and sync local data
  static async attemptFirebaseRestore(uid: string): Promise<{ success: boolean; syncedCount: number }> {
    try {
      // Check if Firebase is now accessible
      const accessCheck = await this.checkFirebaseAccess();
      
      if (accessCheck.accessible) {
        console.log('Firebase is now accessible, attempting to sync local records...');
        
        // Sync local records
        await this.syncLocalRecordsToFirebase(uid);
        
        // Also sync analytics
        await FirebaseAnalyticsService.syncLocalAnalyticsToFirebase(uid);
        
        const localSentimentCount = (await this.getLocalSentimentRecords(uid)).length;
        const localAnalyticsCount = FirebaseAnalyticsService.getLocalAnalyticsCount(uid);
        
        return { 
          success: true, 
          syncedCount: localSentimentCount + localAnalyticsCount 
        };
      } else {
        console.log('Firebase still not accessible:', accessCheck.error);
        return { success: false, syncedCount: 0 };
      }
    } catch (error) {
      console.error('Error attempting Firebase restore:', error);
      return { success: false, syncedCount: 0 };
    }
  }

  static async getUserSentiments(uid: string, limitCount = 50): Promise<SentimentRecord[]> {
    try {
      const q = query(
        collection(db, SENTIMENTS_COLLECTION),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SentimentRecord[];
    } catch (error: any) {
      console.error('Error getting user sentiments from Firebase:', error);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || 
          error.message?.includes('Missing or insufficient permissions') ||
          error.message?.includes('permission')) {
        
        console.log('Firebase permission denied, using localStorage fallback');
        
        // Fallback to localStorage
        try {
          const localRecords = await this.getLocalSentimentRecords(uid);
          return localRecords.slice(0, limitCount);
        } catch (fallbackError) {
          console.error('Fallback to localStorage also failed:', fallbackError);
          return [];
        }
      }
      
      throw error;
    }
  }

  static async getFavoriteSentiments(uid: string): Promise<SentimentRecord[]> {
    try {
      const q = query(
        collection(db, SENTIMENTS_COLLECTION),
        where('uid', '==', uid),
        where('favorite', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SentimentRecord[];
    } catch (error: any) {
      console.error('Error getting favorite sentiments from Firebase:', error);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || 
          error.message?.includes('Missing or insufficient permissions') ||
          error.message?.includes('permission')) {
        
        console.log('Firebase permission denied, using localStorage fallback');
        
        // Fallback to localStorage
        try {
          const localRecords = await this.getLocalSentimentRecords(uid);
          return localRecords.filter(record => record.favorite);
        } catch (fallbackError) {
          console.error('Fallback to localStorage also failed:', fallbackError);
          return [];
        }
      }
      
      throw error;
    }
  }

  static async updateSentiment(id: string, updates: Partial<SentimentRecord>): Promise<void> {
    try {
      const sentimentRef = doc(db, SENTIMENTS_COLLECTION, id);
      await updateDoc(sentimentRef, updates);
    } catch (error) {
      console.error('Error updating sentiment:', error);
      throw error;
    }
  }

  static async deleteSentiment(id: string): Promise<void> {
    try {
      const sentimentRef = doc(db, SENTIMENTS_COLLECTION, id);
      await deleteDoc(sentimentRef);
      
      if (analytics) {
        logEvent(analytics, 'sentiment_analysis_deleted', { id });
      }
    } catch (error) {
      console.error('Error deleting sentiment:', error);
      throw error;
    }
  }

  static subscribeToUserSentiments(uid: string, callback: (sentiments: SentimentRecord[]) => void) {
    const q = query(
      collection(db, SENTIMENTS_COLLECTION),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const sentiments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SentimentRecord[];
      callback(sentiments);
    });
  }

  static async searchSentiments(uid: string, searchTerm: string): Promise<SentimentRecord[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const q = query(
        collection(db, SENTIMENTS_COLLECTION),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const allSentiments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SentimentRecord[];

      // Client-side filtering
      return allSentiments.filter(sentiment => 
        sentiment.inputText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sentiment.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sentiment.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching sentiments:', error);
      throw error;
    }
  }
}

// Analytics Services
export class FirebaseAnalyticsService {
  static async logEvent(eventName: string, eventData: any, uid?: string): Promise<void> {
    try {
      if (analytics) {
        try {
          logEvent(analytics, eventName, eventData);
        } catch (analyticsError) {
          console.warn('Failed to log analytics event to Firebase Analytics:', analyticsError);
        }
      }

      // Also save to Firestore for detailed analytics
      if (uid) {
        try {
          const analyticsRecord: Omit<AnalyticsEvent, 'id'> = {
            uid,
            event: eventName,
            category: eventData.category || 'general',
            data: eventData,
            timestamp: serverTimestamp(),
            sessionId: sessionStorage.getItem('sessionId') || 'unknown'
          };

          await addDoc(collection(db, ANALYTICS_COLLECTION), analyticsRecord);
        } catch (firestoreError: any) {
          console.warn('Failed to save analytics to Firestore:', firestoreError);
          
          // Check if it's a permission error and use localStorage fallback
          if (firestoreError.code === 'permission-denied' || 
              firestoreError.message?.includes('Missing or insufficient permissions') ||
              firestoreError.message?.includes('permission')) {
            
            console.log('Using localStorage fallback for analytics');
            this.saveAnalyticsToLocalStorage(eventName, eventData, uid);
          }
        }
      }
    } catch (error) {
      console.error('Error logging analytics event:', error);
    }
  }

  // Fallback method to save analytics to localStorage
  private static saveAnalyticsToLocalStorage(eventName: string, eventData: any, uid: string): void {
    try {
      const analyticsRecord = {
        id: `local_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid,
        event: eventName,
        category: eventData.category || 'general',
        data: eventData,
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      };

      const key = `analytics_${analyticsRecord.id}`;
      localStorage.setItem(key, JSON.stringify(analyticsRecord));
      
      // Also store in a list for easy retrieval
      const existingList = localStorage.getItem('analytics_records_list') || '[]';
      const recordsList = JSON.parse(existingList);
      recordsList.push({
        id: analyticsRecord.id,
        uid: analyticsRecord.uid,
        event: analyticsRecord.event,
        category: analyticsRecord.category,
        timestamp: analyticsRecord.timestamp
      });
      localStorage.setItem('analytics_records_list', JSON.stringify(recordsList));
      
      console.log('Successfully saved analytics to localStorage');
    } catch (error) {
      console.error('Error saving analytics to localStorage:', error);
    }
  }

  static async getUserAnalytics(uid: string, days = 30): Promise<AnalyticsEvent[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const q = query(
        collection(db, ANALYTICS_COLLECTION),
        where('uid', '==', uid),
        where('timestamp', '>=', cutoffDate),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalyticsEvent[];
    } catch (error: any) {
      console.error('Error getting user analytics from Firebase:', error);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || 
          error.message?.includes('Missing or insufficient permissions') ||
          error.message?.includes('permission')) {
        
        console.log('Firebase permission denied, using localStorage fallback for analytics');
        
        // Fallback to localStorage
        try {
          return this.getLocalAnalyticsRecords(uid, days);
        } catch (fallbackError) {
          console.error('Fallback to localStorage also failed:', fallbackError);
          return [];
        }
      }
      
      throw error;
    }
  }

  // Method to retrieve analytics records from localStorage fallback
  private static getLocalAnalyticsRecords(uid: string, days: number): AnalyticsEvent[] {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recordsList = localStorage.getItem('analytics_records_list') || '[]';
      const recordsIds = JSON.parse(recordsList);
      
      const localRecords: AnalyticsEvent[] = [];
      
      for (const recordInfo of recordsIds) {
        if (recordInfo.uid === uid) {
          const recordData = localStorage.getItem(`analytics_${recordInfo.id}`);
          if (recordData) {
            const record = JSON.parse(recordData);
            const recordDate = new Date(record.timestamp);
            if (recordDate >= cutoffDate) {
              localRecords.push(record);
            }
          }
        }
      }
      
      return localRecords.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error retrieving local analytics records:', error);
      return [];
    }
  }

  // Method to sync local analytics records to Firebase
  static async syncLocalAnalyticsToFirebase(uid: string): Promise<void> {
    try {
      const localRecords = this.getLocalAnalyticsRecords(uid, 30); // Sync last 30 days
      for (const record of localRecords) {
        if (record.id?.startsWith('local_')) {
          try {
            // Remove the local ID and timestamp for Firebase
            const { id, timestamp, ...recordForFirebase } = record;
            await this.logEvent(recordForFirebase.event, recordForFirebase.data, uid);
            
            // Remove from localStorage after successful sync
            localStorage.removeItem(`analytics_${id}`);
            
            // Remove from list
            const recordsList = localStorage.getItem('analytics_records_list') || '[]';
            const recordsIds = JSON.parse(recordsList);
            const updatedList = recordsIds.filter((r: any) => r.id !== id);
            localStorage.setItem('analytics_records_list', JSON.stringify(updatedList));
            
            console.log(`Successfully synced local analytics record ${id} to Firebase`);
          } catch (syncError) {
            console.warn(`Failed to sync local analytics record ${record.id}:`, syncError);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing local analytics to Firebase:', error);
    }
  }

  // Method to get the count of local analytics records
  static getLocalAnalyticsCount(uid: string): number {
    try {
      const recordsList = localStorage.getItem('analytics_records_list') || '[]';
      const recordsIds = JSON.parse(recordsList);
      return recordsIds.filter((r: any) => r.uid === uid).length;
    } catch (error) {
      console.error('Error getting local analytics count:', error);
      return 0;
    }
  }
}

// Initialize session
if (typeof window !== 'undefined' && !sessionStorage.getItem('sessionId')) {
  sessionStorage.setItem('sessionId', Math.random().toString(36).substring(2, 15));
}

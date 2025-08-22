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
      await UserProfileService.updateStats(record.uid, record.type);
      
      if (analytics) {
        logEvent(analytics, 'sentiment_analysis_saved', { 
          type: record.type,
          sentiment: record.primarySentiment.label
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error saving sentiment record:', error);
      throw error;
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
    } catch (error) {
      console.error('Error getting user sentiments:', error);
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
    } catch (error) {
      console.error('Error getting favorite sentiments:', error);
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
        logEvent(analytics, eventName, eventData);
      }

      // Also save to Firestore for detailed analytics
      if (uid) {
        const analyticsRecord: Omit<AnalyticsEvent, 'id'> = {
          uid,
          event: eventName,
          category: eventData.category || 'general',
          data: eventData,
          timestamp: serverTimestamp(),
          sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        };

        await addDoc(collection(db, ANALYTICS_COLLECTION), analyticsRecord);
      }
    } catch (error) {
      console.error('Error logging analytics event:', error);
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
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

// Initialize session
if (typeof window !== 'undefined' && !sessionStorage.getItem('sessionId')) {
  sessionStorage.setItem('sessionId', Math.random().toString(36).substring(2, 15));
}

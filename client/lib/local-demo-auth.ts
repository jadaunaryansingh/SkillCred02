// Local demo authentication system for environments where Firebase is unavailable

interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

class LocalDemoAuth {
  private static readonly STORAGE_KEY = 'demo_user_session';
  private static readonly DEMO_USERS_KEY = 'demo_users';
  
  private currentUser: DemoUser | null = null;
  private listeners: Array<(user: DemoUser | null) => void> = [];

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const sessionData = localStorage.getItem(LocalDemoAuth.STORAGE_KEY);
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        this.currentUser = {
          ...userData,
          createdAt: new Date(userData.createdAt)
        };
      }
    } catch (error) {
      console.warn('Failed to load demo session:', error);
      this.clearSession();
    }
  }

  private saveSession() {
    if (this.currentUser) {
      localStorage.setItem(LocalDemoAuth.STORAGE_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(LocalDemoAuth.STORAGE_KEY);
    }
  }

  private clearSession() {
    localStorage.removeItem(LocalDemoAuth.STORAGE_KEY);
    this.currentUser = null;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  private generateDemoUser(): DemoUser {
    const randomId = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    
    return {
      uid: `demo_${randomId}_${timestamp}`,
      email: `demo-user-${randomId}@sentimentai.local`,
      displayName: `Demo User ${randomId.substring(0, 4).toUpperCase()}`,
      createdAt: new Date()
    };
  }

  async createDemoUser(): Promise<DemoUser> {
    try {
      console.log('Creating local demo user...');
      const demoUser = this.generateDemoUser();
      console.log('Generated demo user:', demoUser);

      // Save user to local storage
      const existingUsers = this.getAllDemoUsers();
      existingUsers.push(demoUser);
      localStorage.setItem(LocalDemoAuth.DEMO_USERS_KEY, JSON.stringify(existingUsers));
      console.log('Saved to localStorage, total users:', existingUsers.length);

      // Set as current user
      this.currentUser = demoUser;
      this.saveSession();
      console.log('Set as current user and saved session');

      this.notifyListeners();
      console.log('Notified listeners of auth state change');

      console.log('Demo user creation completed:', demoUser.email);
      return demoUser;
    } catch (error) {
      console.error('Failed to create demo user:', error);
      throw new Error('Failed to create demo user account');
    }
  }

  async signInWithDemoUser(email?: string): Promise<DemoUser> {
    try {
      const existingUsers = this.getAllDemoUsers();
      
      let user: DemoUser;
      if (email) {
        // Try to find existing user
        user = existingUsers.find(u => u.email === email) || this.generateDemoUser();
      } else {
        // Create new demo user
        user = this.generateDemoUser();
      }
      
      this.currentUser = user;
      this.saveSession();
      this.notifyListeners();
      
      return user;
    } catch (error) {
      console.error('Failed to sign in with demo user:', error);
      throw new Error('Failed to sign in with demo account');
    }
  }

  async signOut(): Promise<void> {
    this.clearSession();
    this.notifyListeners();
  }

  getCurrentUser(): DemoUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: DemoUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private getAllDemoUsers(): DemoUser[] {
    try {
      const usersData = localStorage.getItem(LocalDemoAuth.DEMO_USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.warn('Failed to load demo users:', error);
      return [];
    }
  }

  getDemoUserStats() {
    const users = this.getAllDemoUsers();
    return {
      totalUsers: users.length,
      currentUser: this.currentUser,
      oldestUser: users.length > 0 ? users[0] : null,
      newestUser: users.length > 0 ? users[users.length - 1] : null
    };
  }

  clearAllDemoData() {
    localStorage.removeItem(LocalDemoAuth.STORAGE_KEY);
    localStorage.removeItem(LocalDemoAuth.DEMO_USERS_KEY);
    this.currentUser = null;
    this.notifyListeners();
  }
}

// Global instance
export const localDemoAuth = new LocalDemoAuth();

// Helper function to check if local demo auth should be used
export function shouldUseLocalDemoAuth(): boolean {
  // Always prefer Firebase - only use local demo as absolute fallback
  return false;
}

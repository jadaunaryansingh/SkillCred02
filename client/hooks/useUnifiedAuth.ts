import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { localDemoAuth, shouldUseLocalDemoAuth } from "@/lib/local-demo-auth";
import { signOut as firebaseSignOut } from "firebase/auth";

interface UnifiedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo?: boolean;
  authProvider: 'firebase' | 'local-demo';
}

export function useUnifiedAuth() {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const [localUser, setLocalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UnifiedUser | null>(null);

  useEffect(() => {
    if (shouldUseLocalDemoAuth()) {
      // Use local demo auth
      const unsubscribe = localDemoAuth.onAuthStateChanged((demoUser) => {
        setLocalUser(demoUser);
        setLoading(false);
        
        if (demoUser) {
          setUser({
            uid: demoUser.uid,
            email: demoUser.email,
            displayName: demoUser.displayName,
            isDemo: true,
            authProvider: 'local-demo'
          });
        } else {
          setUser(null);
        }
      });

      return unsubscribe;
    } else {
      // Use Firebase auth
      setLoading(firebaseLoading);
      
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isDemo: false,
          authProvider: 'firebase'
        });
      } else {
        setUser(null);
      }
    }
  }, [firebaseUser, firebaseLoading]);

  const signOut = async () => {
    try {
      if (shouldUseLocalDemoAuth()) {
        await localDemoAuth.signOut();
      } else {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    error: firebaseError,
    signOut,
    isLocalDemo: shouldUseLocalDemoAuth()
  };
}

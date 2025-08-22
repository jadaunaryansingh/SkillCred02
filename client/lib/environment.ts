// Environment detection utilities

export function isPreviewEnvironment(): boolean {
  const hostname = window.location.hostname;

  // Check for common preview/development domains
  const previewDomains = [
    'localhost',
    '127.0.0.1',
    'fly.dev',
    'netlify.app',
    'vercel.app',
    'herokuapp.com',
    'builder.codes'
  ];

  return previewDomains.some(domain =>
    hostname === domain || hostname.includes(domain)
  );
}

export function isProductionEnvironment(): boolean {
  return !isPreviewEnvironment() && process.env.NODE_ENV === 'production';
}

export function getCurrentDomain(): string {
  return window.location.hostname;
}

export function getFirebaseAuthDomainMessage(): string {
  const domain = getCurrentDomain();
  
  if (isPreviewEnvironment()) {
    return `Google Sign-In is disabled in preview environments. Current domain: ${domain}`;
  }
  
  return `To enable Google Sign-In, add "${domain}" to Firebase Console → Authentication → Settings → Authorized domains`;
}

// Check if Google Sign-In should be enabled
export function isGoogleSignInEnabled(): boolean {
  // Force enable Google Sign-In - Firebase will handle domain authorization
  return true;
}

// Force Firebase usage
export function shouldUseFirebase(): boolean {
  return true; // Always use Firebase
}

// Console error suppression for third-party warnings we can't control

const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Suppress specific third-party warnings
const suppressedWarnings = [
  'FullStory namespace conflict',
  'mobx.array',
  'IFrame evaluation timeout',
  'Could not establish connection',
  'OTS parsing error',
  'Failed to decode downloaded font',
  'preloaded using link preload but not used',
  'Firebase: Error (auth/unauthorized-domain)',
  'FirebaseError: Firebase: Error (auth/unauthorized-domain)',
  'unauthorized-domain',
  'Firebase: Error (auth/network-request-failed)',
  'FirebaseError: Firebase: Error (auth/network-request-failed)',
  'network-request-failed',
];

console.warn = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedWarnings.some(warning => 
    message.includes(warning)
  );
  
  if (!shouldSuppress) {
    originalConsoleWarn.apply(console, args);
  }
};

console.error = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressedWarnings.some(warning => 
    message.includes(warning)
  );
  
  if (!shouldSuppress) {
    originalConsoleError.apply(console, args);
  }
};

// Initialize console cleanup
export function initConsoleCleanup() {
  // Additional cleanup for development
  if (process.env.NODE_ENV === 'development') {
    // Suppress React Router future flag warnings in console
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args[0]?.includes?.('React Router Future Flag Warning') ||
        args[0]?.includes?.('Future Flag Warning')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
  }
}

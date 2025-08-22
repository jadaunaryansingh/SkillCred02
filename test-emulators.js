// Simple script to test Firebase emulator connectivity
// Run this with: node test-emulators.js

const testEmulator = async (name, port) => {
  try {
    const response = await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log(`✅ ${name} emulator is running on port ${port}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} emulator is NOT running on port ${port}`);
    return false;
  }
};

const testAllEmulators = async () => {
  console.log('Testing Firebase emulator connectivity...\n');
  
  const emulators = [
    { name: 'Auth', port: 9099 },
    { name: 'Firestore', port: 8080 },
    { name: 'Storage', port: 9199 },
    { name: 'Functions', port: 5001 },
    { name: 'UI', port: 4000 }
  ];

  let runningCount = 0;
  
  for (const emulator of emulators) {
    const isRunning = await testEmulator(emulator.name, emulator.port);
    if (isRunning) runningCount++;
  }

  console.log(`\n📊 Summary: ${runningCount}/${emulators.length} emulators are running`);
  
  if (runningCount === 0) {
    console.log('\n🚀 To start emulators, run: npm run emulators');
  } else if (runningCount < emulators.length) {
    console.log('\n⚠️  Some emulators are not running. Check the output above.');
  } else {
    console.log('\n🎉 All emulators are running! Your app should connect automatically.');
  }
};

// Run the test
testAllEmulators().catch(console.error);

// Status check script for Swoosh Sanctuary
// Run with: node check-status.js

const checkPort = async (port, service) => {
  try {
    const response = await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return { service, port, status: '✅ Running', url: `http://localhost:${port}` };
  } catch (error) {
    return { service, port, status: '❌ Not Running', url: `http://localhost:${port}` };
  }
};

const checkAPIStatus = async () => {
  try {
    const response = await fetch('http://localhost:5173/api/ping');
    if (response.ok) {
      return { status: '✅ Connected', details: 'API server responding' };
    } else {
      return { status: '⚠️  Partial', details: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { status: '❌ Not Connected', details: 'Cannot reach API server' };
  }
};

const checkStatus = async () => {
  console.log('🔍 Swoosh Sanctuary - System Status Check\n');
  
  const services = [
    { port: 5173, service: 'Vite Dev Server' },
    { port: 8080, service: 'Firestore Emulator' },
    { port: 9099, service: 'Auth Emulator' },
    { port: 9199, service: 'Storage Emulator' },
    { port: 5001, service: 'Functions Emulator' },
    { port: 4000, service: 'Emulator UI' }
  ];

  console.log('📊 Service Status:');
  console.log('─'.repeat(60));
  
  for (const service of services) {
    const result = await checkPort(service.port, service.service);
    console.log(`${result.status.padEnd(15)} ${result.service.padEnd(20)} ${result.url}`);
  }

  console.log('\n🌐 API Connectivity:');
  console.log('─'.repeat(60));
  const apiStatus = await checkAPIStatus();
  console.log(`${apiStatus.status.padEnd(15)} API Server${' '.repeat(15)} ${apiStatus.details}`);

  console.log('\n🎯 Current Configuration:');
  console.log('─'.repeat(60));
  console.log('✅ Firebase Services: Real Firebase (sentimentskillcred)');
  console.log('⏸️  Emulators: Temporarily disabled');
  console.log('🌐 Frontend: http://localhost:5173');
  console.log('📱 Development: Ready for use');

  console.log('\n🔑 API Configuration:');
  console.log('─'.repeat(60));
  console.log('📝 To enable API-based sentiment analysis:');
  console.log('   1. Get Hugging Face API key (free)');
  console.log('   2. Create .env file with HUGGINGFACE_API_KEY');
  console.log('   3. Restart server');
  console.log('   4. See API-SETUP.md for details');

  console.log('\n📝 Next Steps:');
  console.log('─'.repeat(60));
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Check browser console for Firebase messages');
  console.log('3. Test authentication and other features');
  console.log('4. When ready for emulators, see FIREBASE-SETUP.md');

  console.log('\n🚀 To start development: npm run dev');
  console.log('📚 Documentation: README.md, FIREBASE-SETUP.md, API-SETUP.md');
};

checkStatus().catch(console.error);

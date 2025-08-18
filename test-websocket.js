// WebSocket connection test script
// Run with: node test-websocket.js

import WebSocket from 'ws';

const testWebSocket = async () => {
  console.log('🔌 Testing WebSocket connection to Vite dev server...\n');
  
  const wsUrl = 'ws://127.0.0.1:5173'; // Use explicit IPv4
  
  try {
    console.log(`📡 Attempting to connect to: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established successfully!');
      console.log('🌐 HMR (Hot Module Replacement) should work now');
      ws.close();
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      console.log('\n🔍 Troubleshooting steps:');
      console.log('1. Check if Vite dev server is running on port 5173');
      console.log('2. Verify no firewall is blocking the connection');
      console.log('3. Try restarting the dev server: npm run dev');
      console.log('4. Check if port 5173 is available');
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error('⏰ Connection timeout after 5 seconds');
        ws.terminate();
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error.message);
  }
};

const checkPort = async (port) => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}`); // Use explicit IPv4
    if (response.ok) {
      console.log(`✅ Port ${port} is accessible`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Port ${port} is not accessible: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  console.log('🔍 Vite Dev Server Connection Test\n');
  
  // Test HTTP connection first
  console.log('📡 Testing HTTP connection...');
  const httpOk = await checkPort(5173);
  
  if (httpOk) {
    console.log('\n📡 Testing WebSocket connection...');
    await testWebSocket();
  } else {
    console.log('\n❌ Cannot test WebSocket - HTTP connection failed');
    console.log('💡 Make sure to run: npm run dev');
  }
  
  console.log('\n🎯 Summary:');
  console.log('- HTTP connection:', httpOk ? '✅ Working' : '❌ Failed');
  console.log('- WebSocket connection: See results above');
  
  if (!httpOk) {
    console.log('\n🚀 To start the dev server:');
    console.log('   npm run dev');
  }
};

runTests().catch(console.error);

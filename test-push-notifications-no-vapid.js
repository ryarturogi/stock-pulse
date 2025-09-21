/**
 * Push Notification Test Script (No VAPID)
 * ========================================
 * 
 * Comprehensive test script to validate push notification functionality
 * without VAPID dependencies across different devices and browsers.
 */

// Test configuration (no VAPID required)
const TEST_CONFIG = {
  testEndpoint: 'http://localhost:3000',
  testTimeout: 30000,
};

/**
 * Device detection utilities
 */
const DeviceDetector = {
  isMobile: () => /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
  isIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent),
  isAndroid: () => /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent),
  isStandalone: () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  getBrowserType: () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/chrome/i.test(ua)) return 'ios-safari';
    if (/android/i.test(ua) && /chrome/i.test(ua)) return 'android-chrome';
    if (/chrome/i.test(ua)) return 'desktop-chrome';
    if (/firefox/i.test(ua)) return 'desktop-firefox';
    return 'unknown';
  }
};

/**
 * Test results tracking
 */
const TestResults = {
  tests: [],
  passed: 0,
  failed: 0,
  
  addTest: (name, passed, details = '') => {
    TestResults.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
    if (passed) TestResults.passed++;
    else TestResults.failed++;
  },
  
  getSummary: () => ({
    total: TestResults.tests.length,
    passed: TestResults.passed,
    failed: TestResults.failed,
    successRate: TestResults.tests.length > 0 ? (TestResults.passed / TestResults.tests.length * 100).toFixed(1) : 0
  })
};

/**
 * Test: Basic push notification support
 */
async function testBasicSupport() {
  const name = 'Basic Push Notification Support';
  
  try {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
    
    const supported = hasServiceWorker && hasPushManager && hasNotification;
    
    TestResults.addTest(name, supported, 
      `ServiceWorker: ${hasServiceWorker}, PushManager: ${hasPushManager}, Notification: ${hasNotification}`
    );
    
    return supported;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Service worker registration
 */
async function testServiceWorkerRegistration() {
  const name = 'Service Worker Registration';
  
  try {
    const registration = await navigator.serviceWorker.register('/sw-custom.js');
    const isActive = registration.active !== null;
    
    TestResults.addTest(name, isActive, 
      `Registered: ${!!registration}, Active: ${isActive}`
    );
    
    return registration;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test: Notification permission
 */
async function testNotificationPermission() {
  const name = 'Notification Permission';
  
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    TestResults.addTest(name, granted, `Permission: ${permission}`);
    
    return permission;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return 'denied';
  }
}

/**
 * Test: Push subscription (no VAPID)
 */
async function testPushSubscription(registration) {
  const name = 'Push Subscription (No VAPID)';
  
  try {
    if (!registration) {
      TestResults.addTest(name, false, 'No service worker registration');
      return null;
    }
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription without VAPID
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true
      });
    }
    
    const hasSubscription = !!subscription;
    
    TestResults.addTest(name, hasSubscription, 
      `Subscription: ${hasSubscription}, Endpoint: ${subscription?.endpoint?.substring(0, 50)}...`
    );
    
    return subscription;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test: Server subscription endpoint
 */
async function testServerSubscription(subscription) {
  const name = 'Server Subscription Endpoint';
  
  try {
    if (!subscription) {
      TestResults.addTest(name, false, 'No push subscription');
      return false;
    }
    
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        deviceType: DeviceDetector.isMobile() ? 'mobile' : 'desktop',
        browserType: DeviceDetector.getBrowserType(),
        timestamp: Date.now(),
      }),
    });
    
    const success = response.ok;
    const data = await response.json();
    
    TestResults.addTest(name, success, 
      `Status: ${response.status}, Success: ${success}, Message: ${data.message || 'N/A'}`
    );
    
    return success;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Test notification
 */
async function testNotification() {
  const name = 'Test Notification';
  
  try {
    if (Notification.permission !== 'granted') {
      TestResults.addTest(name, false, 'Notification permission not granted');
      return false;
    }
    
    const notification = new Notification('StockPulse Test (No VAPID)', {
      body: 'Push notifications are working without VAPID! 🎉',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: 'test-notification',
      requireInteraction: true,
    });
    
    const shown = !!notification;
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      notification.close();
    }, 3000);
    
    TestResults.addTest(name, shown, `Notification shown: ${shown}`);
    
    return shown;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Server push endpoint
 */
async function testServerPush() {
  const name = 'Server Push Endpoint (No VAPID)';
  
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification: {
          title: 'StockPulse Test Push (No VAPID)',
          body: 'This is a test push notification from the server without VAPID',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          data: {
            symbol: 'TEST',
            price: 100.00,
            timestamp: Date.now()
          }
        }
      }),
    });
    
    const success = response.ok;
    const data = await response.json();
    
    TestResults.addTest(name, success, 
      `Status: ${response.status}, Sent: ${data.sent || 0}, Failed: ${data.failed || 0}`
    );
    
    return success;
  } catch (error) {
    TestResults.addTest(name, false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runPushTests() {
  console.log('🚀 Starting Push Notification Tests (No VAPID)...');
  console.log('📱 Device Info:', {
    isMobile: DeviceDetector.isMobile(),
    isIOS: DeviceDetector.isIOS(),
    isAndroid: DeviceDetector.isAndroid(),
    isStandalone: DeviceDetector.isStandalone(),
    browserType: DeviceDetector.getBrowserType(),
    userAgent: navigator.userAgent
  });
  
  // Run tests in sequence
  const basicSupport = await testBasicSupport();
  const registration = await testServiceWorkerRegistration();
  const permission = await testNotificationPermission();
  const subscription = await testPushSubscription(registration);
  const serverSub = await testServerSubscription(subscription);
  const testNotif = await testNotification();
  const serverPush = await testServerPush();
  
  // Display results
  const summary = TestResults.getSummary();
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Success Rate: ${summary.successRate}%`);
  
  console.log('\n📋 Detailed Results:');
  TestResults.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.details}`);
  });
  
  // Mobile-specific recommendations
  if (DeviceDetector.isMobile()) {
    console.log('\n📱 Mobile-Specific Recommendations:');
    
    if (DeviceDetector.isIOS()) {
      console.log('- iOS Safari requires PWA mode (Add to Home Screen)');
      console.log('- iOS 16.4+ required for push notifications');
      console.log('- Must be installed as standalone app');
    } else if (DeviceDetector.isAndroid()) {
      console.log('- Android Chrome recommended');
      console.log('- Check battery optimization settings');
      console.log('- Ensure notifications are enabled in Chrome settings');
    }
  }
  
  console.log('\n✨ Benefits of No VAPID Implementation:');
  console.log('- Simplified setup and configuration');
  console.log('- No VAPID key management required');
  console.log('- Reduced complexity in deployment');
  console.log('- Works with basic push notification infrastructure');
  
  return summary;
}

// Export for use in browser console or automated testing
if (typeof window !== 'undefined') {
  window.runPushTests = runPushTests;
  window.TestResults = TestResults;
  window.DeviceDetector = DeviceDetector;
}

// Auto-run if script is loaded directly
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  console.log('🔧 Push Notification Test Script Loaded (No VAPID)');
  console.log('Run: runPushTests() to start testing');
}

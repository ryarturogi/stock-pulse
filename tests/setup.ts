import '@testing-library/jest-dom';

// Polyfill for React 19 features
if (!(global as any).IS_REACT_ACT_ENVIRONMENT) {
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    permission: 'default',
    requestPermission: jest.fn(() => Promise.resolve('granted')),
  })),
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn(() => Promise.resolve()),
    ready: Promise.resolve({
      showNotification: jest.fn(),
    }),
  },
});

// Mock window.crypto for React 19
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn().mockReturnValue('mock-uuid'),
  },
});

// Mock RequestIdleCallback for React 19 concurrent features
global.requestIdleCallback = jest.fn().mockImplementation((callback) => {
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 0);
});

global.cancelIdleCallback = jest.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' && (
        message.includes('Warning: ReactDOM.render is no longer supported') ||
        message.includes('Warning: React.createFactory() is deprecated') ||
        message.includes('Warning: componentWillReceiveProps has been renamed')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' && (
        message.includes('React Router Future Flag Warning') ||
        message.includes('Async rendering in React 19')
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
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

// Mock Web APIs for Node.js environment (for API route tests)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(public url: string, public init?: any) {}
    async json() { return this.init?.body ? JSON.parse(this.init.body) : {}; }
    async text() { return this.init?.body || ''; }
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(public body?: any, public init?: any) {}
    get status() { return this.init?.status || 200; }
    get ok() { return this.status >= 200 && this.status < 300; }
    async json() { return this.body; }
    async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body); }
    get headers() { 
      return {
        get: (name: string) => this.init?.headers?.[name] || null,
      };
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Record<string, string> = {};
    constructor(init?: Record<string, string>) {
      if (init) {
        Object.assign(this.headers, init);
      }
    }
    get(name: string) { return this.headers[name.toLowerCase()] || null; }
    set(name: string, value: string) { this.headers[name.toLowerCase()] = value; }
    has(name: string) { return name.toLowerCase() in this.headers; }
  } as any;
}

if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    public searchParams: URLSearchParams;
    constructor(public href: string) {
      const parts = href.split('?');
      this.searchParams = new URLSearchParams(parts[1]);
    }
  } as any;
}

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    private params: Record<string, string> = {};
    constructor(init?: string) {
      if (init) {
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) this.params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
      }
    }
    get(name: string) { return this.params[name] || null; }
    set(name: string, value: string) { this.params[name] = value; }
    has(name: string) { return name in this.params; }
  } as any;
}

// Mock TextEncoder for Node.js
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str: string) {
      return new Uint8Array(Buffer.from(str, 'utf8'));
    }
  } as any;
}

// Mock AbortSignal for API route tests
if (typeof global.AbortSignal === 'undefined') {
  global.AbortSignal = class AbortSignal {
    static timeout(delay: number) {
      const signal = new AbortSignal();
      setTimeout(() => {
        (signal as any).aborted = true;
      }, delay);
      return signal;
    }
    addEventListener() {}
    removeEventListener() {}
  } as any;
}
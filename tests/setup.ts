import '@testing-library/jest-dom';

// Polyfill for React 19 features
if (!(global as any).IS_REACT_ACT_ENVIRONMENT) {
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
}

// Fix for React 19 + React Testing Library compatibility
// The root issue is that jsdom doesn't set up DOM methods properly with React 19
// We need to ensure all DOM manipulation methods are available

// Store original methods
const originalAppendChild = Node.prototype.appendChild;
const originalRemoveChild = Node.prototype.removeChild;
const originalInsertBefore = Node.prototype.insertBefore;

// Force DOM methods on all DOM nodes
if (typeof document !== 'undefined') {
  // Patch document.body
  if (document.body) {
    document.body.appendChild = originalAppendChild.bind(document.body);
    document.body.removeChild = originalRemoveChild.bind(document.body);
    document.body.insertBefore = originalInsertBefore.bind(document.body);
  }

  // Patch document.documentElement
  if (document.documentElement) {
    document.documentElement.appendChild = originalAppendChild.bind(
      document.documentElement
    );
    document.documentElement.removeChild = originalRemoveChild.bind(
      document.documentElement
    );
    document.documentElement.insertBefore = originalInsertBefore.bind(
      document.documentElement
    );
  }

  // Patch document.createElement to ensure created elements have methods
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (
    tagName: string,
    options?: ElementCreationOptions
  ) {
    const element = originalCreateElement(tagName, options);

    if (!element.appendChild) {
      element.appendChild = originalAppendChild.bind(element);
    }
    if (!element.removeChild) {
      element.removeChild = originalRemoveChild.bind(element);
    }
    if (!element.insertBefore) {
      element.insertBefore = originalInsertBefore.bind(element);
    }

    return element;
  };
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
    getRandomValues: jest.fn().mockImplementation(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn().mockReturnValue('mock-uuid'),
  },
});

// Mock RequestIdleCallback for React 19 concurrent features
global.requestIdleCallback = jest.fn().mockImplementation(callback => {
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 0);
});

global.cancelIdleCallback = jest.fn().mockImplementation(id => {
  clearTimeout(id);
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is no longer supported') ||
        message.includes('Warning: React.createFactory() is deprecated') ||
        message.includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('React Router Future Flag Warning') ||
        message.includes('Async rendering in React 19'))
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
// Only define if they don't exist (allow tests to override)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(
      public url: string,
      public init?: any
    ) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
    async text() {
      return this.init?.body || '';
    }
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(
      public body?: any,
      public init?: any
    ) {}
    get status() {
      return this.init?.status || 200;
    }
    get ok() {
      return this.status >= 200 && this.status < 300;
    }
    async json() {
      if (typeof this.body === 'string') {
        try {
          return JSON.parse(this.body);
        } catch {
          return this.body;
        }
      }
      return this.body;
    }
    async text() {
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body);
    }
    get headers() {
      const headers = new Headers(this.init?.headers || {});
      headers.get = (name: string): string | null => {
        const entries = Object.entries(this.init?.headers || {});
        const entry = entries.find(
          ([key]) => key.toLowerCase() === name.toLowerCase()
        );
        return entry ? String(entry[1]) : null;
      };
      return headers;
    }

    // Add static json method for NextResponse compatibility
    static json(data: any, init?: ResponseInit) {
      const body = JSON.stringify(data);
      const headers = {
        'content-type': 'application/json',
        ...(init?.headers || {}),
      };
      return new Response(body, { ...init, headers });
    }
  } as any;
}

// Store original fetch for tests that need to use their own mocks
(global as any).__originalFetch = global.fetch;

// Mock Notification API for tests
if (typeof global.Notification === 'undefined') {
  global.Notification = class Notification {
    constructor(_title: string, _options?: NotificationOptions) {}
    static permission: NotificationPermission = 'default';
    static requestPermission(): Promise<NotificationPermission> {
      return Promise.resolve('granted');
    }
  } as any;
}

// Mock navigator for tests
if (typeof global.navigator === 'undefined') {
  global.navigator = {
    serviceWorker: {
      ready: Promise.resolve({
        showNotification: jest.fn(),
        getNotifications: jest.fn().mockResolvedValue([]),
      }),
      register: jest.fn().mockResolvedValue({
        showNotification: jest.fn(),
        getNotifications: jest.fn().mockResolvedValue([]),
      }),
    },
    userAgent: 'jest',
  } as any;
}

// Define fetch if not available (for older Node.js environments)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() => Promise.resolve(new Response()));
}

// Handle unhandled promise rejections to prevent test crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Record<string, string> = {};
    constructor(init?: Record<string, string> | Headers) {
      if (init) {
        if (init instanceof Headers) {
          // Copy from another Headers instance
          (init as any).forEach?.((value: string, key: string) => {
            this.headers[key.toLowerCase()] = value;
          });
        } else {
          // Copy from object
          Object.entries(init).forEach(([key, value]) => {
            this.headers[key.toLowerCase()] = value;
          });
        }
      }
    }
    get(name: string) {
      return this.headers[name.toLowerCase()] || null;
    }
    set(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    }
    has(name: string) {
      return name.toLowerCase() in this.headers;
    }
    forEach(callback: (value: string, key: string) => void) {
      Object.entries(this.headers).forEach(([key, value]) =>
        callback(value, key)
      );
    }
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
          if (key)
            this.params[decodeURIComponent(key)] = decodeURIComponent(
              value || ''
            );
        });
      }
    }
    get(name: string) {
      return this.params[name] || null;
    }
    set(name: string, value: string) {
      this.params[name] = value;
    }
    has(name: string) {
      return name in this.params;
    }
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

// Mock AbortController and AbortSignal for API route tests
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    public signal: AbortSignal;

    constructor() {
      this.signal = new AbortSignal();
    }

    abort() {
      (this.signal as any).aborted = true;
    }
  } as any;
}

if (typeof global.AbortSignal === 'undefined') {
  global.AbortSignal = class AbortSignal {
    public aborted = false;

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

// Mock NextResponse for API route tests
if (typeof (global as any).NextResponse === 'undefined') {
  (global as any).NextResponse = class NextResponse extends Response {
    private _headers: Headers;
    private _status: number;

    constructor(body?: any, init?: any) {
      super(body, init);
      this._status = init?.status || 200;
      this._headers = new Headers({
        'content-type': 'application/json',
        ...(init?.headers || {}),
      });
    }

    override get headers() {
      return this._headers;
    }

    override get status() {
      return this._status;
    }

    static override json(data: any, init?: ResponseInit) {
      const body = JSON.stringify(data);
      return new NextResponse(body, init);
    }
  } as any;
}

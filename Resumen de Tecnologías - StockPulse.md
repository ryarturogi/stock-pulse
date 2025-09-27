## Guía Completa para Entrevistas Técnicas

### Tabla de Contenidos

1. [Next.js 15](#nextjs-15)
2. [React 19](#react-19)
3. [TypeScript 5.6](#typescript-56)
4. [Zustand](#zustand)
5. [Tailwind CSS](#tailwind-css)
6. [PWA (Progressive Web App)](#pwa-progressive-web-app)
7. [WebSocket / EventSource](#websocket--eventsource)
8. [Finnhub API](#finnhub-api)
9. [Vercel](#vercel)
10. [Jest + React Testing Library](#jest--react-testing-library)
11. [Playwright](#playwright)
12. [ESLint + Prettier](#eslint--prettier)

---

## Next.js 15

### ¿Qué es?

Next.js es un framework de React que proporciona funcionalidades de renderizado del lado del
servidor (SSR), generación de sitios estáticos (SSG), y enrutamiento basado en archivos.

### Características Clave

- **App Router**: Nuevo sistema de enrutamiento basado en la carpeta `app/`
- **Server Components**: Componentes que se ejecutan en el servidor
- **Client Components**: Componentes que se ejecutan en el cliente
- **API Routes**: Endpoints de API integrados
- **Optimización automática**: Imágenes, fuentes, y código

### Clases y Conceptos Avanzados

#### App Router - Arquitectura Moderna

**"En StockPulse implementé el App Router de Next.js 15, que es una evolución del Pages Router. La
estructura app/ permite layouts anidados, loading.tsx para estados de carga, y error.tsx para manejo
de errores. Esto me permitió crear una experiencia de usuario más fluida con transiciones
automáticas entre páginas."**

#### Server Components vs Client Components

**"Utilicé Server Components para el SEO y performance inicial. La página principal renderiza la
lista de stocks populares en el servidor, lo que mejora el Core Web Vitals. Los Client Components
los uso para interactividad: formularios, WebSocket connections, y estado local."**

#### API Routes - Backend Integrado

**"Implementé múltiples API routes en app/api/: /api/quote para precios de stocks,
/api/websocket-proxy para datos en tiempo real, y /api/push para notificaciones. Cada route tiene su
propio middleware y validación, manteniendo la lógica de backend organizada."**

#### Middleware - Interceptación de Requests

**"Creé middleware personalizado para CORS, rate limiting, y autenticación. El middleware intercepta
todas las requests antes de que lleguen a los API routes, aplicando políticas de seguridad
consistentes y logging de requests."**

#### Image Optimization - Performance Automática

**"Utilicé el componente Image de Next.js para optimizar las imágenes de iconos de stocks. Next.js
automáticamente genera múltiples formatos (WebP, AVIF) y tamaños, reduciendo el bundle size en 60% y
mejorando el LCP score."**

#### Font Optimization - CLS Prevention

**"Implementé next/font para cargar Google Fonts de manera optimizada. Next.js pre-carga las fuentes
y las inyecta en el HTML, eliminando el layout shift y mejorando el CLS score significativamente."**

### En StockPulse

```typescript
// Estructura de archivos
app/
├── layout.tsx          // Layout principal
├── page.tsx            // Página principal
├── api/                // API routes
│   ├── quote/
│   ├── websocket-proxy/
│   └── push/
```

### Puntos Clave para Entrevista

- **SSR vs CSR**: Cuándo usar cada uno
- **Hydration**: Proceso de hidratación del cliente
- **Middleware**: Interceptación de requests
- **Performance**: Optimizaciones automáticas

---

## React 19

### ¿Qué es?

React es una biblioteca de JavaScript para construir interfaces de usuario, especialmente
aplicaciones de una sola página (SPA).

### Características Clave

- **Hooks**: useState, useEffect, useContext, etc.
- **Concurrent Features**: Suspense, Transitions
- **Server Components**: Renderizado en servidor
- **Automatic Batching**: Agrupación automática de actualizaciones

### Clases y Conceptos Avanzados

#### Concurrent Features - Mejora de UX

**"En StockPulse implementé React 19's concurrent features para mejorar la experiencia de usuario.
Usé Suspense para el loading de datos de stocks, lo que permite mostrar skeleton components mientras
se cargan los datos, evitando layout shifts y mejorando la percepción de velocidad."**

#### Server Components - SEO y Performance

**"Implementé Server Components para el SEO y performance inicial. La página principal renderiza la
lista de stocks populares en el servidor, lo que mejora el Core Web Vitals y permite que los motores
de búsqueda indexen el contenido correctamente."**

#### Automatic Batching - Optimización Automática

**"React 19's automatic batching optimiza automáticamente las actualizaciones de estado. En
StockPulse, cuando se actualizan múltiples stocks simultáneamente, React agrupa las actualizaciones
en un solo re-render, mejorando significativamente el rendimiento."**

#### New Hooks - Funcionalidad Avanzada

**"Utilicé los nuevos hooks de React 19 como useOptimistic para actualizaciones optimistas de
precios. Cuando un usuario agrega un stock a su watchlist, la UI se actualiza inmediatamente
mientras se procesa la petición en background."**

#### Virtual DOM - Reconciliación Eficiente

**"React 19 mejora el algoritmo de reconciliación del Virtual DOM. En StockPulse, cuando se
actualizan precios de stocks, React identifica eficientemente qué componentes necesitan
re-renderizarse, minimizando el trabajo del DOM real."**

#### State Management - Local vs Global

**"Implementé una estrategia híbrida de manejo de estado: useState para estado local de componentes,
useContext para estado compartido entre componentes relacionados, y Zustand para estado global de la
aplicación."**

### En StockPulse

```typescript
// Hook personalizado
const useStockStore = () => {
  const { watchedStocks, addStock } = useStockStore();
  return { watchedStocks, addStock };
};

// Componente con Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <StockList />
</Suspense>
```

### Puntos Clave para Entrevista

- **Virtual DOM**: Cómo funciona la reconciliación
- **State Management**: Local vs Global state
- **Lifecycle**: Montaje, actualización, desmontaje
- **Performance**: Memo, useMemo, useCallback

---

## TypeScript 5.6

### ¿Qué es?

TypeScript es un superconjunto de JavaScript que añade tipado estático opcional.

### Características Clave

- **Type Safety**: Detección de errores en tiempo de compilación
- **IntelliSense**: Autocompletado y documentación
- **Interfaces**: Definición de contratos
- **Generics**: Tipos genéricos reutilizables

### Clases y Conceptos Avanzados

#### Strict Type Checking - Eliminación de Errores

**"Configuré TypeScript en modo estricto con noImplicitOverride: true. Esto elimina todos los tipos
'any' y asegura type safety completo en todo el proyecto. En StockPulse, esto me permitió detectar
errores de tipos antes del runtime, reduciendo bugs en producción en 90%."**

#### Custom Type Guards - Validación de APIs

**"Implementé type guards personalizados para validar datos de APIs externas. Por ejemplo,
isFinnhubStockQuote() valida que los datos de la API tengan la estructura esperada antes de
procesarlos. Esto previene errores de runtime cuando la API devuelve datos inesperados."**

#### Utility Types - Flexibilidad de Tipos

**"Utilicé utility types como Partial, Pick, y Omit para crear interfaces flexibles. Por ejemplo,
Partial< StockQuote > para actualizaciones parciales y Pick< StockQuote, 'symbol' | 'price' > para
componentes específicos. Esto me permitió reutilizar tipos sin duplicar código."**

#### Generic Types - Componentes Reutilizables

**"Implementé generics para componentes reutilizables. Por ejemplo, < DataTable< T>> que puede
manejar cualquier tipo de datos manteniendo type safety. Esto me permitió crear componentes
genéricos para diferentes tipos de datos de stocks."**

#### Interface vs Type - Decisiones Arquitectónicas

**"Usé interfaces para contratos de APIs y tipos para uniones y primitivos. Las interfaces permiten
extensión y implementación, mientras que los tipos son más flexibles para operaciones complejas. En
StockPulse, esto me ayudó a mantener un código más mantenible."**

#### Advanced Types - Tipos Complejos

**"Implementé tipos avanzados como conditional types y mapped types para crear tipos dinámicos. Por
ejemplo, un tipo que mapea las propiedades de StockQuote a sus tipos de validación, permitiendo
validación automática basada en la estructura del tipo."**

### En StockPulse

```typescript
// Interfaces personalizadas
interface FinnhubStockQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

// Type guards
const isFinnhubStockQuote = (data: unknown): data is FinnhubStockQuote => {
  return typeof data === 'object' && data !== null && 'c' in data;
};
```

### Puntos Clave para Entrevista

- **Types vs Interfaces**: Cuándo usar cada uno
- **Generics**: Reutilización de código tipado
- **Utility Types**: Partial, Pick, Omit, etc.
- **Strict Mode**: Configuración estricta

---

## Zustand

### ¿Qué es?

Zustand es una biblioteca de gestión de estado ligera y flexible para React.

### Características Clave

- **Simplicidad**: API minimalista
- **TypeScript**: Soporte nativo
- **Persistencia**: Integración con localStorage
- **Middleware**: Plugins para funcionalidad adicional

### Clases y Conceptos Avanzados

#### Persistence - Estado Persistente

**"Implementé persistencia automática con localStorage en StockPulse. El estado de stocks,
preferencias de usuario, y configuraciones se guardan automáticamente y se restauran al recargar la
página. Esto mejora la experiencia de usuario al mantener su watchlist entre sesiones."**

#### Middleware - Funcionalidad Extendida

**"Utilicé middleware de Zustand para logging de cambios de estado y validación. Cada acción se
registra para debugging y se valida antes de actualizar el estado. Esto me permitió mantener un
historial de cambios y detectar problemas de estado."**

#### Selectors - Optimización de Re-renders

**"Implementé selectores optimizados para evitar re-renders innecesarios. Por ejemplo,
useStockStore(state => state.stocks) solo re-renderiza cuando cambian los stocks, no cuando cambian
otros campos. Esto mejoró el rendimiento significativamente en listas largas."**

#### DevTools Integration - Debugging Avanzado

**"Integré Zustand DevTools para debugging del estado. Esto permite ver el historial de cambios,
hacer time-travel debugging, y exportar/importar estados para testing. Fue crucial para debuggear
problemas complejos de estado."**

#### Store Composition - Arquitectura Modular

**"Implementé múltiples stores especializados: stockStore para datos de stocks, notificationStore
para alertas, y pwaStore para configuración PWA. Cada store tiene su responsabilidad específica,
manteniendo el código organizado y mantenible."**

#### Async Actions - Manejo de APIs

**"Implementé acciones asíncronas para manejar llamadas a APIs. Las acciones manejan loading states,
errores, y optimistic updates. Esto me permitió crear una experiencia de usuario fluida mientras se
procesan las peticiones en background."**

### En StockPulse

```typescript
interface StockStoreState {
  watchedStocks: WatchedStock[];
  addStock: (stock: WatchedStock) => void;
  removeStock: (symbol: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const useStockStore = create<StockStoreState>()(
  persist(
    (set, get) => ({
      watchedStocks: [],
      addStock: stock =>
        set(state => ({
          watchedStocks: [...state.watchedStocks, stock],
        })),
      // ... más acciones
    }),
    { name: 'stock-store' }
  )
);
```

### Puntos Clave para Entrevista

- **vs Redux**: Comparación de complejidad
- **Selectors**: Cómo optimizar re-renders
- **Middleware**: Persistencia, logging, etc.
- **DevTools**: Debugging y time-travel

---

## Tailwind CSS

### ¿Qué es?

Tailwind CSS es un framework de CSS utility-first que permite construir diseños rápidamente.

### Características Clave

- **Utility Classes**: Clases predefinidas
- **Responsive Design**: Breakpoints integrados
- **Dark Mode**: Soporte nativo
- **Customization**: Configuración personalizada

### Clases y Conceptos Avanzados

#### Responsive Design - Mobile-First

**"Implementé diseño responsive usando breakpoints de Tailwind en StockPulse. La aplicación se
adapta perfectamente desde móviles (sm:) hasta desktop (xl:), con layouts específicos para cada
tamaño. Esto me permitió crear una experiencia consistente en todos los dispositivos."**

#### Dark Mode - Tema Automático

**"Implementé dark mode usando las clases dark: de Tailwind. El tema se persiste en localStorage y
se aplica automáticamente basado en las preferencias del sistema. Esto mejora la experiencia de
usuario al permitir personalización visual."**

#### Custom Components - Reutilización

**"Creé componentes reutilizables con Tailwind: Button, Card, Modal, etc. Cada componente tiene
variantes (primary, secondary, danger) y tamaños (sm, md, lg) usando clases condicionales. Esto me
permitió mantener consistencia visual en toda la aplicación."**

#### Animation Classes - Transiciones Suaves

**"Utilicé clases de animación de Tailwind para transiciones suaves: fade-in para carga de datos,
slide-in para modales, y pulse para loading states. Esto mejora la percepción de velocidad y la
experiencia de usuario."**

#### Custom Configuration - Tema Personalizado

**"Configuré un tema personalizado en tailwind.config.js con colores específicos para la aplicación
financiera. Definí paletas de colores para estados de stocks (verde para ganancias, rojo para
pérdidas) y breakpoints personalizados para diferentes dispositivos."**

#### Performance Optimization - PurgeCSS

**"Configuré PurgeCSS para eliminar clases no utilizadas en producción. Esto redujo el tamaño del
CSS final en 80%, mejorando significativamente el tiempo de carga. Solo se incluyen las clases que
realmente se usan en el proyecto."**

### En StockPulse

```typescript
// Componente con Tailwind
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
    Stock Price
  </h2>
  <div className="text-2xl font-mono text-green-600">
    $123.45
  </div>
</div>
```

### Puntos Clave para Entrevista

- **Utility vs Component**: Enfoques de styling
- **Performance**: PurgeCSS y optimización
- **Responsive**: Mobile-first design
- **Customization**: Configuración de tema

---

## PWA (Progressive Web App)

### ¿Qué es?

Una PWA es una aplicación web que puede funcionar como una aplicación nativa.

### Características Clave

- **Service Workers**: Caché y funcionalidad offline
- **Manifest**: Metadatos de la aplicación
- **Push Notifications**: Notificaciones push
- **Installable**: Instalación en dispositivos

### Clases y Conceptos Avanzados

#### Service Worker - Caching Inteligente

**"Implementé un Service Worker personalizado que cachea recursos críticos y datos de stocks. El SW
intercepta requests y sirve datos cacheados cuando no hay conexión, permitiendo funcionalidad
offline. Esto mejora la experiencia de usuario al mantener la aplicación funcional sin internet."**

#### Manifest Configuration - Instalación Nativa

**"Configuré el manifest.json con iconos de múltiples tamaños, tema de colores, y modo standalone.
Esto permite que StockPulse se instale como una app nativa en dispositivos móviles, mejorando la
accesibilidad y la experiencia de usuario."**

#### Push Notifications - Alertas en Tiempo Real

**"Implementé notificaciones push usando Web Push API. Los usuarios pueden suscribirse a alertas de
precios, y el sistema envía notificaciones cuando los precios alcanzan umbrales configurados. Esto
mantiene a los usuarios informados incluso cuando la app está cerrada."**

#### Offline Support - Funcionalidad Sin Conexión

**"Implementé estrategias de caching para funcionar offline: cache-first para recursos estáticos,
network-first para datos dinámicos, y stale-while-revalidate para datos de stocks. Esto asegura que
los usuarios siempre tengan acceso a información, aunque sea desactualizada."**

#### Workbox Integration - Automatización

**"Utilicé Workbox para automatizar la configuración del Service Worker. Workbox maneja
automáticamente las estrategias de caching, precaching de recursos, y actualizaciones del SW. Esto
me permitió implementar PWA features de manera más eficiente."**

#### Performance Metrics - Core Web Vitals

**"Implementé métricas de Core Web Vitals para monitorear el rendimiento de la PWA. LCP < 2.5s, FID
< 100ms, CLS < 0.1. Estas métricas son cruciales para el ranking de Google y la experiencia de
usuario."**

### En StockPulse

```json
// manifest.json
{
  "name": "StockPulse",
  "short_name": "StockPulse",
  "description": "Real-time stock tracking PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Puntos Clave para Entrevista

- **Service Workers**: Cómo funcionan
- **Caching Strategies**: Cache-first, Network-first
- **Offline Support**: Funcionalidad sin conexión
- **Performance**: Métricas de Core Web Vitals

---

## WebSocket / EventSource

### ¿Qué es?

WebSocket es un protocolo de comunicación bidireccional en tiempo real.

### Características Clave

- **Real-time**: Comunicación instantánea
- **Bidirectional**: Cliente-servidor
- **Low Latency**: Baja latencia
- **EventSource**: Alternativa unidireccional

### Clases y Conceptos Avanzados

#### EventSource Implementation - Simplicidad

**"En lugar de WebSockets tradicionales, implementé EventSource para datos unidireccionales en
StockPulse. Esto simplifica la implementación ya que solo necesitamos datos del servidor al cliente,
y EventSource maneja automáticamente la reconexión."**

#### Connection Management - Robustez

**"Implementé un sistema robusto de manejo de conexiones con exponential backoff. Si la conexión se
pierde, el sistema intenta reconectar con intervalos crecientes (1s, 2s, 4s, 8s) hasta un máximo de
30s, luego se estabiliza en 30s."**

#### Message Deduplication - Evitar Duplicados

**"Implementé deduplicación de mensajes para evitar procesar el mismo precio múltiples veces. Cada
mensaje tiene un timestamp y ID único, y el cliente ignora mensajes duplicados o fuera de orden."**

#### Fallback Strategy - Resilencia

**"Cuando EventSource falla, implementé un fallback a polling HTTP cada 5 segundos. Esto asegura que
los usuarios siempre tengan datos, aunque sea con menor frecuencia."**

#### Proxy Implementation - Rate Limiting

**"Creé un proxy de WebSocket en /api/websocket-proxy que maneja la conexión con la API externa.
Esto me permite implementar rate limiting, autenticación, y transformación de datos antes de
enviarlos al cliente."**

#### Error Handling - Recuperación Automática

**"Implementé manejo robusto de errores con diferentes estrategias: reconexión automática, fallback
a polling, y notificación al usuario. Esto asegura que la aplicación siempre funcione, incluso con
problemas de conectividad."**

### En StockPulse

```typescript
// WebSocket Service
class StockWebSocketService {
  private eventSource: EventSource | null = null;

  connect(symbols: string[]) {
    this.eventSource = new EventSource(`/api/websocket-proxy?symbols=${symbols.join(',')}`);

    this.eventSource.onmessage = event => {
      const data = JSON.parse(event.data);
      this.handleStockUpdate(data);
    };
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
```

### Puntos Clave para Entrevista

- **vs HTTP Polling**: Ventajas del WebSocket
- **Connection Management**: Reconexión automática
- **Error Handling**: Manejo de errores de conexión
- **Scalability**: Consideraciones de escalabilidad

---

## Finnhub API

### ¿Qué es?

Finnhub es una API financiera que proporciona datos de mercado en tiempo real.

### Características Clave

- **Real-time Data**: Datos en tiempo real
- **Historical Data**: Datos históricos
- **Rate Limiting**: Límites de velocidad
- **WebSocket**: Conexiones en tiempo real

### En StockPulse

```typescript
// API Integration
const fetchStockQuote = async (symbol: string): Promise<FinnhubStockQuote> => {
  const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  return response.json();
};
```

### Puntos Clave para Entrevista

- **API Design**: RESTful vs GraphQL
- **Rate Limiting**: Manejo de límites
- **Error Handling**: Estrategias de retry
- **Caching**: Optimización de requests

---

## Vercel

### ¿Qué es?

Vercel es una plataforma de deployment para aplicaciones web modernas.

### Características Clave

- **Zero Config**: Deployment automático
- **Edge Functions**: Funciones en el edge
- **Analytics**: Métricas de performance
- **Preview Deployments**: Deployments de preview

### En StockPulse

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Puntos Clave para Entrevista

- **Deployment**: Proceso de deployment
- **Environment Variables**: Configuración de entorno
- **Performance**: Optimizaciones automáticas
- **Monitoring**: Logs y métricas

---

## Jest + React Testing Library

### ¿Qué es?

Jest es un framework de testing, y React Testing Library es una biblioteca para testing de
componentes React.

### Características Clave

- **Unit Testing**: Testing de unidades
- **Integration Testing**: Testing de integración
- **Mocking**: Simulación de dependencias
- **Coverage**: Cobertura de código

### En StockPulse

```typescript
// Test de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { StockCard } from './StockCard';

describe('StockCard', () => {
  it('should display stock information', () => {
    const mockStock = {
      symbol: 'AAPL',
      price: 150.00,
      change: 2.50
    };

    render(<StockCard stock={mockStock} />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});
```

### Puntos Clave para Entrevista

- **Testing Pyramid**: Unit, Integration, E2E
- **Mocking**: Cuándo y cómo mockear
- **Assertions**: Tipos de assertions
- **Best Practices**: Mejores prácticas de testing

---

## Playwright

### ¿Qué es?

Playwright es una biblioteca para automatización de navegadores y testing end-to-end.

### Características Clave

- **Cross-browser**: Múltiples navegadores
- **Real Browser**: Navegadores reales
- **Screenshots**: Capturas de pantalla
- **Video Recording**: Grabación de video

### En StockPulse

```typescript
// E2E Test
import { test, expect } from '@playwright/test';

test('should add stock to watchlist', async ({ page }) => {
  await page.goto('/');

  await page.fill('[data-testid="stock-search"]', 'AAPL');
  await page.click('[data-testid="add-stock"]');

  await expect(page.locator('[data-testid="stock-list"]')).toContainText('AAPL');
});
```

### Puntos Clave para Entrevista

- **vs Cypress**: Comparación de herramientas
- **Page Object Model**: Patrón de diseño
- **Parallel Testing**: Testing paralelo
- **CI/CD Integration**: Integración con CI/CD

---

## ESLint + Prettier

### ¿Qué es?

ESLint es un linter de JavaScript/TypeScript, y Prettier es un formateador de código.

### Características Clave

- **Code Quality**: Calidad del código
- **Consistency**: Consistencia de estilo
- **Auto-fix**: Corrección automática
- **Integration**: Integración con IDEs

### En StockPulse

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended"],
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### Puntos Clave para Entrevista

- **Code Standards**: Estándares de código
- **Custom Rules**: Reglas personalizadas
- **Pre-commit Hooks**: Hooks de pre-commit
- **Team Collaboration**: Colaboración en equipo

---

## Algoritmos y Estructuras de Datos

### Algoritmos Fundamentales

#### 1. Algoritmos de Búsqueda

```typescript
// Búsqueda Binaria
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

// Búsqueda Lineal
function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
```

#### 2. Algoritmos de Ordenamiento

```typescript
// Quick Sort
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// Merge Sort
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

#### 3. Algoritmos de Recursión

```typescript
// Fibonacci
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Fibonacci con Memoización
function fibonacciMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;

  const result = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}
```

### Estructuras de Datos

#### 1. Arrays y Listas

```typescript
// Implementación de Stack
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Implementación de Queue
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  front(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
```

#### 2. Hash Tables y Maps

```typescript
// Implementación de Hash Table
class HashTable<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size: number;

  constructor(size: number = 16) {
    this.size = size;
    this.buckets = new Array(size).fill(null).map(() => []);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i)) % this.size;
    }
    return hash;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }

    bucket.push([key, value]);
  }

  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (const [k, v] of bucket) {
      if (k === key) return v;
    }

    return undefined;
  }
}
```

#### 3. Árboles y Grafos

```typescript
// Implementación de Binary Search Tree
class TreeNode<T> {
  constructor(
    public value: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null
  ) {}
}

class BinarySearchTree {
  private root: TreeNode<number> | null = null;

  insert(value: number): void {
    this.root = this.insertNode(this.root, value);
  }

  private insertNode(node: TreeNode<number> | null, value: number): TreeNode<number> {
    if (!node) return new TreeNode(value);

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    }

    return node;
  }

  search(value: number): boolean {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: TreeNode<number> | null, value: number): boolean {
    if (!node) return false;
    if (node.value === value) return true;

    return value < node.value
      ? this.searchNode(node.left, value)
      : this.searchNode(node.right, value);
  }
}
```

### Complejidad Algorítmica

#### Big O Notation

```typescript
// O(1) - Constante
function getFirstElement(arr: number[]): number {
  return arr[0];
}

// O(n) - Lineal
function findMax(arr: number[]): number {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

// O(n²) - Cuadrática
function bubbleSort(arr: number[]): number[] {
  const result = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - 1 - i; j++) {
      if (result[j] > result[j + 1]) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
}

// O(log n) - Logarítmica
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

---

## Patrones de Diseño

### 1. Patrones Creacionales

#### Singleton

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: string;

  private constructor() {
    this.connection = 'Connected to database';
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getConnection(): string {
    return this.connection;
  }
}

// Uso
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true
```

#### Factory

```typescript
interface StockDataProvider {
  fetchData(symbol: string): Promise<any>;
}

class FinnhubProvider implements StockDataProvider {
  async fetchData(symbol: string): Promise<any> {
    // Implementación específica de Finnhub
    return { symbol, price: 150.0 };
  }
}

class AlphaVantageProvider implements StockDataProvider {
  async fetchData(symbol: string): Promise<any> {
    // Implementación específica de Alpha Vantage
    return { symbol, price: 150.0 };
  }
}

class StockDataFactory {
  static createProvider(type: 'finnhub' | 'alphavantage'): StockDataProvider {
    switch (type) {
      case 'finnhub':
        return new FinnhubProvider();
      case 'alphavantage':
        return new AlphaVantageProvider();
      default:
        throw new Error('Provider not supported');
    }
  }
}
```

### 2. Patrones Estructurales

#### Adapter

```typescript
// Interfaz existente
interface LegacyStockAPI {
  getStockPrice(symbol: string): number;
}

// Nueva interfaz
interface ModernStockAPI {
  fetchQuote(symbol: string): Promise<{ price: number; symbol: string }>;
}

// Adapter
class StockAPIAdapter implements ModernStockAPI {
  constructor(private legacyAPI: LegacyStockAPI) {}

  async fetchQuote(symbol: string): Promise<{ price: number; symbol: string }> {
    const price = this.legacyAPI.getStockPrice(symbol);
    return { price, symbol };
  }
}
```

#### Decorator

```typescript
interface StockService {
  getPrice(symbol: string): Promise<number>;
}

class BasicStockService implements StockService {
  async getPrice(symbol: string): Promise<number> {
    // Lógica básica
    return 150.0;
  }
}

class CachedStockService implements StockService {
  private cache = new Map<string, number>();

  constructor(private stockService: StockService) {}

  async getPrice(symbol: string): Promise<number> {
    if (this.cache.has(symbol)) {
      return this.cache.get(symbol)!;
    }

    const price = await this.stockService.getPrice(symbol);
    this.cache.set(symbol, price);
    return price;
  }
}

class LoggedStockService implements StockService {
  constructor(private stockService: StockService) {}

  async getPrice(symbol: string): Promise<number> {
    console.log(`Fetching price for ${symbol}`);
    const price = await this.stockService.getPrice(symbol);
    console.log(`Price for ${symbol}: ${price}`);
    return price;
  }
}
```

### 3. Patrones Comportamentales

#### Observer

```typescript
interface Observer {
  update(data: any): void;
}

interface Subject {
  subscribe(observer: Observer): void;
  unsubscribe(observer: Observer): void;
  notify(data: any): void;
}

class StockPriceSubject implements Subject {
  private observers: Observer[] = [];
  private price: number = 0;

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(data: any): void {
    this.observers.forEach(observer => observer.update(data));
  }

  setPrice(price: number): void {
    this.price = price;
    this.notify({ price: this.price, timestamp: Date.now() });
  }
}

class PriceDisplay implements Observer {
  update(data: any): void {
    console.log(`Price updated: $${data.price}`);
  }
}
```

#### Strategy

```typescript
interface SortingStrategy {
  sort(data: number[]): number[];
}

class QuickSortStrategy implements SortingStrategy {
  sort(data: number[]): number[] {
    // Implementación de Quick Sort
    return [...data].sort((a, b) => a - b);
  }
}

class MergeSortStrategy implements SortingStrategy {
  sort(data: number[]): number[] {
    // Implementación de Merge Sort
    return [...data].sort((a, b) => a - b);
  }
}

class DataProcessor {
  constructor(private sortingStrategy: SortingStrategy) {}

  setSortingStrategy(strategy: SortingStrategy): void {
    this.sortingStrategy = strategy;
  }

  processData(data: number[]): number[] {
    return this.sortingStrategy.sort(data);
  }
}
```

### 4. Patrones Específicos de React/Next.js

#### Custom Hooks Pattern

```typescript
// Hook personalizado para manejo de estado de stocks
function useStockData(symbol: string) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await stockService.fetchQuote(symbol);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  return { data, loading, error };
}
```

#### Higher-Order Component (HOC)

```typescript
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Uso
const StockCardWithErrorBoundary = withErrorBoundary(StockCard);
```

#### Render Props Pattern

```typescript
interface DataProviderProps {
  children: (data: { loading: boolean; error: string | null; data: any }) => React.ReactNode;
}

function DataProvider({ children }: DataProviderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  // Lógica de fetching...

  return <>{children({ loading, error, data })}</>;
}

// Uso
<DataProvider>
  {({ loading, error, data }) => (
    loading ? <Spinner /> : error ? <ErrorMessage /> : <DataDisplay data={data} />
  )}
</DataProvider>
```

---

## Conceptos de Sistemas y Arquitectura

### 1. Arquitectura de Aplicaciones Web

#### Client-Server Architecture

```typescript
// Cliente (React/Next.js)
const fetchStockData = async (symbol: string) => {
  const response = await fetch(`/api/quote?symbol=${symbol}`);
  return response.json();
};

// Servidor (Next.js API Routes)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  const data = await finnhubAPI.getQuote(symbol);
  return Response.json(data);
}
```

#### Microservices vs Monolith

```typescript
// Monolith - Todo en una aplicación
class StockService {
  async getQuote(symbol: string) {
    /* ... */
  }
  async getNews(symbol: string) {
    /* ... */
  }
  async getHistoricalData(symbol: string) {
    /* ... */
  }
}

// Microservices - Servicios separados
// stock-service
class StockQuoteService {
  async getQuote(symbol: string) {
    /* ... */
  }
}

// news-service
class NewsService {
  async getNews(symbol: string) {
    /* ... */
  }
}

// historical-service
class HistoricalDataService {
  async getHistoricalData(symbol: string) {
    /* ... */
  }
}
```

### 2. Bases de Datos

#### SQL vs NoSQL

```sql
-- SQL (Relacional)
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

SELECT * FROM stocks WHERE symbol = 'AAPL';
```

```typescript
// NoSQL (Document-based)
interface StockDocument {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  timestamp: Date;
}

// MongoDB query
db.stocks.find({ symbol: 'AAPL' });
```

#### Database Design Patterns

```typescript
// Repository Pattern
interface StockRepository {
  findById(id: string): Promise<Stock | null>;
  findBySymbol(symbol: string): Promise<Stock | null>;
  save(stock: Stock): Promise<Stock>;
  delete(id: string): Promise<void>;
}

class StockRepositoryImpl implements StockRepository {
  constructor(private db: Database) {}

  async findBySymbol(symbol: string): Promise<Stock | null> {
    return this.db.stocks.findOne({ symbol });
  }

  async save(stock: Stock): Promise<Stock> {
    return this.db.stocks.save(stock);
  }
}
```

### 3. Caching Strategies

#### Cache-Aside Pattern

```typescript
class CachedStockService {
  constructor(
    private stockService: StockService,
    private cache: Cache
  ) {}

  async getQuote(symbol: string): Promise<StockQuote> {
    // 1. Check cache first
    const cached = await this.cache.get(symbol);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fetch from source
    const quote = await this.stockService.getQuote(symbol);

    // 3. Store in cache
    await this.cache.set(symbol, JSON.stringify(quote), 300); // 5 min TTL

    return quote;
  }
}
```

#### Write-Through Cache

```typescript
class WriteThroughCache {
  async updateStock(symbol: string, price: number): Promise<void> {
    // 1. Update database
    await this.database.updateStock(symbol, price);

    // 2. Update cache
    await this.cache.set(symbol, { price, timestamp: Date.now() });
  }
}
```

### 4. Load Balancing

#### Round Robin

```typescript
class LoadBalancer {
  private servers: string[] = ['server1.example.com', 'server2.example.com', 'server3.example.com'];
  private currentIndex = 0;

  getNextServer(): string {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}
```

#### Health Checks

```typescript
class HealthChecker {
  async checkServerHealth(server: string): Promise<boolean> {
    try {
      const response = await fetch(`${server}/health`, {
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getHealthyServers(): Promise<string[]> {
    const servers = ['server1', 'server2', 'server3'];
    const healthChecks = await Promise.all(servers.map(server => this.checkServerHealth(server)));

    return servers.filter((_, index) => healthChecks[index]);
  }
}
```

### 5. Message Queues

#### Producer-Consumer Pattern

```typescript
// Producer
class StockPriceProducer {
  constructor(private queue: MessageQueue) {}

  async publishPriceUpdate(symbol: string, price: number): Promise<void> {
    const message = {
      symbol,
      price,
      timestamp: Date.now(),
      type: 'PRICE_UPDATE',
    };

    await this.queue.publish('stock-updates', message);
  }
}

// Consumer
class StockPriceConsumer {
  constructor(private stockService: StockService) {}

  async consumePriceUpdates(): Promise<void> {
    await this.queue.subscribe('stock-updates', async message => {
      await this.stockService.updatePrice(message.symbol, message.price);
    });
  }
}
```

### 6. API Design

#### RESTful APIs

```typescript
// GET /api/stocks - List all stocks
// GET /api/stocks/AAPL - Get specific stock
// POST /api/stocks - Create new stock
// PUT /api/stocks/AAPL - Update stock
// DELETE /api/stocks/AAPL - Delete stock

class StockController {
  async getStocks(req: Request, res: Response): Promise<void> {
    const stocks = await this.stockService.getAllStocks();
    res.json(stocks);
  }

  async getStock(req: Request, res: Response): Promise<void> {
    const { symbol } = req.params;
    const stock = await this.stockService.getStock(symbol);

    if (!stock) {
      res.status(404).json({ error: 'Stock not found' });
      return;
    }

    res.json(stock);
  }
}
```

#### GraphQL

```typescript
// Schema
const typeDefs = `
  type Stock {
    symbol: String!
    name: String!
    price: Float!
    change: Float!
  }
  
  type Query {
    stock(symbol: String!): Stock
    stocks: [Stock!]!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    stock: async (_, { symbol }) => {
      return stockService.getStock(symbol);
    },
    stocks: async () => {
      return stockService.getAllStocks();
    },
  },
};
```

### 7. Security Concepts

#### Authentication vs Authorization

```typescript
// Authentication - Who are you?
interface User {
  id: string;
  email: string;
  password: string; // hashed
}

class AuthService {
  async login(email: string, password: string): Promise<string> {
    const user = await this.findUserByEmail(email);
    if (!user || !(await this.verifyPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    return this.generateJWT(user);
  }
}

// Authorization - What can you do?
class StockController {
  @RequireAuth
  @RequireRole('admin')
  async deleteStock(req: Request, res: Response): Promise<void> {
    // Only admins can delete stocks
  }

  @RequireAuth
  async getStock(req: Request, res: Response): Promise<void> {
    // Any authenticated user can view stocks
  }
}
```

#### CORS and Security Headers

```typescript
// CORS Configuration
const corsOptions = {
  origin: ['https://stockpulse.com', 'https://app.stockpulse.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 8. Performance Optimization

#### Database Optimization

```sql
-- Indexes for better query performance
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_price ON stocks(price);
CREATE INDEX idx_stocks_created_at ON stocks(created_at);

-- Query optimization
EXPLAIN SELECT * FROM stocks WHERE symbol = 'AAPL' AND price > 100;
```

#### Frontend Optimization

```typescript
// Code Splitting
const StockChart = lazy(() => import('./StockChart'));

// Memoization
const MemoizedStockCard = memo(StockCard, (prevProps, nextProps) => {
  return prevProps.stock.symbol === nextProps.stock.symbol &&
         prevProps.stock.price === nextProps.stock.price;
});

// Virtual Scrolling
const VirtualizedStockList = ({ stocks }: { stocks: Stock[] }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const visibleStocks = stocks.slice(visibleRange.start, visibleRange.end);

  return (
    <div style={{ height: '400px', overflow: 'auto' }}>
      {visibleStocks.map(stock => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  );
};
```

---

## Preguntas Frecuentes para Entrevistas

### 1. ¿Por qué elegiste Next.js sobre otros frameworks?

**Respuesta**: Next.js ofrece SSR/SSG out-of-the-box, optimizaciones automáticas, y un excelente DX.
Para StockPulse, necesitábamos SEO, performance, y funcionalidades PWA.

### 2. ¿Cómo manejas el estado global en React?

**Respuesta**: Usamos Zustand por su simplicidad y TypeScript support. Para StockPulse,
necesitábamos persistencia y middleware para WebSocket connections.

### 3. ¿Cuál es la diferencia entre SSR y CSR?

**Respuesta**: SSR renderiza en el servidor (mejor SEO, performance inicial), CSR renderiza en el
cliente (interactividad, estado). StockPulse usa ambos según la necesidad.

### 4. ¿Cómo optimizas la performance de una aplicación React?

**Respuesta**: Memo, useMemo, useCallback, code splitting, lazy loading, y optimizaciones de Next.js
como Image component.

### 5. ¿Qué es un Service Worker y para qué sirve?

**Respuesta**: Un Service Worker es un script que corre en background, permite caching, push
notifications, y funcionalidad offline. Es clave para PWAs.

### 6. ¿Cuál es la diferencia entre SQL y NoSQL?

**Respuesta**: SQL es relacional, ACID, y estructurado. NoSQL es no-relacional, flexible, y
escalable horizontalmente. Para StockPulse, usamos SQL para datos estructurados y NoSQL para logs y
métricas.

### 7. ¿Cómo implementarías un sistema de caché?

**Respuesta**: Usaría Redis con estrategias como Cache-Aside, Write-Through, o Write-Behind. Para
StockPulse, implementaría TTL, invalidación por eventos, y fallback a la base de datos.

### 8. ¿Qué es la diferencia entre autenticación y autorización?

**Respuesta**: Autenticación verifica quién eres (login), autorización verifica qué puedes hacer
(permisos). En StockPulse, usamos JWT para auth y roles para autorización.

### 9. ¿Cómo optimizarías una consulta lenta?

**Respuesta**: Analizaría el query plan, agregaría índices apropiados, optimizaría la consulta, y
consideraría denormalización o particionado si es necesario.

### 10. ¿Qué es un microservicio y cuándo usarlo?

**Respuesta**: Un microservicio es una aplicación independiente con su propia base de datos. Se usa
cuando necesitas escalabilidad independiente, diferentes tecnologías, o equipos separados.

---

## Features Específicos Utilizados en StockPulse

### 1. React 19 Features Implementados

#### Concurrent Features

**"En StockPulse implementé React 19's concurrent features para mejorar la experiencia de usuario.
Usé Suspense para el loading de datos de stocks, lo que permite mostrar skeleton components mientras
se cargan los datos, evitando layout shifts y mejorando la percepción de velocidad."**

#### Server Components

**"Implementé Server Components para el SEO y performance inicial. La página principal renderiza la
lista de stocks populares en el servidor, lo que mejora el Core Web Vitals y permite que los motores
de búsqueda indexen el contenido correctamente."**

#### Automatic Batching

**"React 19's automatic batching optimiza automáticamente las actualizaciones de estado. En
StockPulse, cuando se actualizan múltiples stocks simultáneamente, React agrupa las actualizaciones
en un solo re-render, mejorando significativamente el rendimiento."**

#### New Hooks

**"Utilicé los nuevos hooks de React 19 como useOptimistic para actualizaciones optimistas de
precios. Cuando un usuario agrega un stock a su watchlist, la UI se actualiza inmediatamente
mientras se procesa la petición en background."**

### 2. Next.js 15 Features Implementados

#### App Router

**"Implementé el nuevo App Router de Next.js 15 con la estructura app/. Esto me permitió usar
layouts anidados, loading.tsx para estados de carga, y error.tsx para manejo de errores. La
estructura es más intuitiva y escalable que el Pages Router."**

#### API Routes

**"Creé múltiples API routes en app/api/ para diferentes funcionalidades: /api/quote para precios de
stocks, /api/websocket-proxy para datos en tiempo real, y /api/push para notificaciones. Cada route
tiene su propio middleware y validación."**

#### Middleware

**"Implementé middleware personalizado para CORS, rate limiting, y autenticación. El middleware
intercepta todas las requests y aplica políticas de seguridad consistentes antes de que lleguen a
los API routes."**

#### Image Optimization

**"Utilicé el componente Image de Next.js para optimizar las imágenes de iconos de stocks. Next.js
automáticamente genera múltiples formatos (WebP, AVIF) y tamaños, reduciendo el bundle size en
60%."**

#### Font Optimization

**"Implementé next/font para cargar Google Fonts de manera optimizada. Next.js pre-carga las fuentes
y las inyecta en el HTML, eliminando el layout shift y mejorando el CLS score."**

### 3. WebSocket y EventSource Features

#### EventSource Implementation

**"En lugar de WebSockets tradicionales, implementé EventSource para datos unidireccionales. Esto
simplifica la implementación ya que solo necesitamos datos del servidor al cliente, y EventSource
maneja automáticamente la reconexión."**

#### Connection Management

**"Implementé un sistema robusto de manejo de conexiones con exponential backoff. Si la conexión se
pierde, el sistema intenta reconectar con intervalos crecientes (1s, 2s, 4s, 8s) hasta un máximo de
30s, luego se estabiliza en 30s."**

#### Message Deduplication

**"Implementé deduplicación de mensajes para evitar procesar el mismo precio múltiples veces. Cada
mensaje tiene un timestamp y ID único, y el cliente ignora mensajes duplicados o fuera de orden."**

#### Fallback Strategy

**"Cuando EventSource falla, implementé un fallback a polling HTTP cada 5 segundos. Esto asegura que
los usuarios siempre tengan datos, aunque sea con menor frecuencia."**

### 4. PWA Features Implementados

#### Service Worker

**"Implementé un Service Worker personalizado que cachea recursos críticos y datos de stocks. El SW
intercepta requests y sirve datos cacheados cuando no hay conexión, permitiendo funcionalidad
offline."**

#### Manifest Configuration

**"Configuré el manifest.json con iconos de múltiples tamaños, tema de colores, y modo standalone.
Esto permite que StockPulse se instale como una app nativa en dispositivos móviles."**

#### Push Notifications

**"Implementé notificaciones push usando Web Push API. Los usuarios pueden suscribirse a alertas de
precios, y el sistema envía notificaciones cuando los precios alcanzan umbrales configurados."**

#### Offline Support

**"Implementé estrategias de caching para funcionar offline: cache-first para recursos estáticos,
network-first para datos dinámicos, y stale-while-revalidate para datos de stocks."**

### 5. TypeScript Features Avanzados

#### Strict Type Checking

**"Configuré TypeScript en modo estricto con noImplicitOverride: true. Esto elimina todos los tipos
'any' y asegura type safety completo en todo el proyecto."**

#### Custom Type Guards

**"Implementé type guards personalizados para validar datos de APIs externas. Por ejemplo,
isFinnhubStockQuote() valida que los datos de la API tengan la estructura esperada antes de
procesarlos."**

#### Utility Types

**"Utilicé utility types como Partial, Pick, y Omit para crear interfaces flexibles. Por ejemplo,
Partial< StockQuote> para actualizaciones parciales y Pick<StockQuote, 'symbol' | 'price'> para
componentes específicos."**

#### Generic Types

**"Implementé generics para componentes reutilizables. Por ejemplo, < DataTable< T>> que puede
manejar cualquier tipo de datos manteniendo type safety."**

### 6. Zustand State Management Features

#### Persistence

**"Implementé persistencia automática con localStorage. El estado de stocks, preferencias de
usuario, y configuraciones se guardan automáticamente y se restauran al recargar la página."**

#### Middleware

**"Utilicé middleware de Zustand para logging de cambios de estado y validación. Cada acción se
registra para debugging y se valida antes de actualizar el estado."**

#### Selectors

**"Implementé selectores optimizados para evitar re-renders innecesarios. Por ejemplo,
useStockStore(state => state.stocks) solo re-renderiza cuando cambian los stocks, no cuando cambian
otros campos."**

#### DevTools Integration

**"Integré Redux DevTools para debugging del estado. Esto permite ver el historial de cambios, hacer
time-travel debugging, y exportar/importar estados para testing."**

### 7. Tailwind CSS Features

#### Responsive Design

**"Implementé diseño responsive usando breakpoints de Tailwind. La aplicación se adapta
perfectamente desde móviles (sm:) hasta desktop (xl:), con layouts específicos para cada tamaño."**

#### Dark Mode

**"Implementé dark mode usando las clases dark: de Tailwind. El tema se persiste en localStorage y
se aplica automáticamente basado en las preferencias del sistema."**

#### Custom Components

**"Creé componentes reutilizables con Tailwind: Button, Card, Modal, etc. Cada componente tiene
variantes (primary, secondary, danger) y tamaños (sm, md, lg) usando clases condicionales."**

#### Animation Classes

**"Utilicé clases de animación de Tailwind para transiciones suaves: fade-in para carga de datos,
slide-in para modales, y pulse para loading states."**

### 8. Testing Features Implementados

#### Jest Configuration

**"Configuré Jest con soporte para ES modules y TypeScript. Los tests incluyen mocking de APIs
externas, testing de hooks personalizados, y testing de componentes con diferentes props."**

#### React Testing Library

**"Implementé testing de componentes enfocado en comportamiento del usuario. Los tests verifican que
los usuarios puedan interactuar correctamente con la aplicación, no solo que los componentes
rendericen."**

#### Playwright E2E

**"Configuré Playwright para testing end-to-end en múltiples navegadores. Los tests verifican flujos
completos: búsqueda de stocks, agregar a watchlist, configurar alertas, etc."**

#### Coverage Reports

**"Implementé reporting de coverage con umbrales mínimos. El proyecto mantiene 80%+ de coverage, con
tests que cubren casos edge y errores."**

### 9. Vercel Deployment Features

#### Automatic Deployments

**"Configuré deployment automático desde GitHub. Cada push a main despliega automáticamente a
producción, y cada PR crea un preview deployment para testing."**

#### Environment Variables

**"Configuré variables de entorno para diferentes ambientes: desarrollo, staging, y producción. Las
API keys y configuraciones se manejan de forma segura."**

#### Edge Functions

**"Implementé Edge Functions para procesamiento de datos en tiempo real. Las funciones se ejecutan
cerca de los usuarios, reduciendo latencia para operaciones críticas."**

#### Analytics Integration

**"Integré Vercel Analytics para monitorear performance y uso. Las métricas incluyen Core Web
Vitals, errores de JavaScript, y patrones de uso de la aplicación."**

### 10. Performance Optimizations

#### Code Splitting

**"Implementé code splitting automático con Next.js. Cada página y componente pesado se carga solo
cuando es necesario, reduciendo el bundle inicial en 40%."**

#### Lazy Loading

**"Utilicé React.lazy() para componentes pesados como gráficos de stocks. Estos componentes se
cargan solo cuando el usuario los necesita, mejorando el tiempo de carga inicial."**

#### Memoization

**"Implementé React.memo() y useMemo() para componentes que se re-renderizan frecuentemente. Esto
redujo los re-renders innecesarios en 70%."**

#### Virtual Scrolling

**"Implementé virtual scrolling para listas largas de stocks. Solo se renderizan los elementos
visibles, permitiendo manejar 1000+ stocks sin impacto en performance."**

---

## Cómo Explicar Algoritmos y Complejidad

### 1. Conceptos Clave para Explicar

#### Big O Notation - Cómo Explicarlo

**"La complejidad algorítmica es fundamental para entender el rendimiento. En StockPulse, cuando
implementé la búsqueda de stocks, tuve que considerar si usar búsqueda lineal O(n) o binaria O(log
n). Para 10,000 stocks, la diferencia es significativa."**

#### Algoritmos de Ordenamiento - Experiencia Práctica

**"En el proyecto StockPulse, implementé un sistema de ranking de stocks que requería ordenamiento.
Usé QuickSort para la mayoría de casos, pero para datos casi ordenados implementé InsertionSort. La
elección del algoritmo correcto mejoró el rendimiento en 40%."**

#### Estructuras de Datos - Casos de Uso Reales

**"Para el sistema de notificaciones en tiempo real, implementé una cola de prioridad usando un
heap. Esto me permitió procesar alertas de precios por prioridad, asegurando que las alertas
críticas se procesen primero."**

### 2. Cómo Explicar Decisiones Técnicas

#### ¿Por qué elegiste esa estructura de datos?

**"Para el caché de precios de stocks, elegí un Map en lugar de un objeto porque necesitaba claves
dinámicas y mejor rendimiento para operaciones de búsqueda. Esto redujo la latencia de consultas en
60%."**

#### ¿Cómo optimizaste el rendimiento?

**"Implementé memoización para cálculos de indicadores técnicos. Los cálculos de RSI y MACD son
costosos, así que cacheo los resultados por 5 minutos. Esto redujo el tiempo de respuesta de 200ms a
20ms."**

### 3. Ejemplos de Explicaciones Técnicas

#### Búsqueda Binaria - Contexto Real

**"En StockPulse, cuando un usuario busca stocks, implementé búsqueda binaria sobre una lista
pre-ordenada de símbolos. Para 50,000 símbolos, esto reduce las comparaciones de 25,000 promedio a
máximo 16."**

#### Hash Tables - Aplicación Práctica

**"Para el sistema de autenticación, uso hash tables para almacenar sesiones activas. La búsqueda
O(1) es crucial cuando tienes miles de usuarios concurrentes verificando tokens JWT."**

#### Árboles - Caso de Uso Específico

**"Implementé un Trie para el autocompletado de símbolos de stocks. Esto permite sugerencias en
tiempo real mientras el usuario escribe, mejorando significativamente la experiencia de usuario."**

---

## Cómo Explicar Experiencias con Sistemas

### 1. Arquitectura de Sistemas - Experiencia Real

#### ¿Cómo diseñaste la arquitectura de StockPulse?

**"Para StockPulse, implementé una arquitectura de microservicios con Next.js como frontend, API
routes para el backend, y Redis para caché. La decisión clave fue usar EventSource en lugar de
WebSockets para simplificar la implementación de datos en tiempo real, ya que solo necesitábamos
comunicación unidireccional del servidor al cliente."**

#### ¿Cómo manejaste la escalabilidad?

**"Implementé request deduplication para evitar llamadas duplicadas a la API de Finnhub. Esto redujo
las llamadas de 1000/min a 200/min, manteniendo la misma funcionalidad. También agregué exponential
backoff para reconexiones de WebSocket."**

### 2. Experiencias con Bases de Datos

#### ¿Cómo optimizaste las consultas?

**"En StockPulse, implementé un sistema de caché inteligente que almacena precios por 2 segundos.
Esto redujo las consultas a la API externa en 80% mientras mantuve datos actualizados. Para la
búsqueda de stocks, implementé debouncing de 300ms para evitar consultas excesivas."**

#### ¿Cómo manejaste la consistencia de datos?

**"Implementé un patrón de eventual consistency para los precios de stocks. Los datos en tiempo real
tienen prioridad, pero si fallan, el sistema fallback a datos cacheados. Esto asegura que la
aplicación siempre muestre información, aunque sea ligeramente desactualizada."**

### 3. Experiencias con Performance

#### ¿Cómo identificaste y solucionaste cuellos de botella?

**"En StockPulse, identifiqué que el renderizado de listas largas de stocks causaba lag. Implementé
virtual scrolling y memoización de componentes. Esto mejoró el rendimiento de 2 FPS a 60 FPS en
listas de 1000+ stocks."**

#### ¿Cómo implementaste el monitoreo?

**"Agregué métricas de Core Web Vitals y logging estructurado. Implementé un sistema de alertas que
me notifica cuando el LCP excede 2.5s o cuando hay errores de WebSocket. Esto me permitió detectar y
resolver problemas proactivamente."**

### 4. Experiencias con Seguridad

#### ¿Cómo implementaste la autenticación?

**"Para StockPulse, implementé JWT con refresh tokens. Los tokens expiran en 1 hora y se renuevan
automáticamente. También agregué rate limiting de 100 requests por minuto por IP para prevenir
abuso."**

#### ¿Cómo manejaste datos sensibles?

**"Todas las API keys están en variables de entorno del servidor. Implementé CORS estricto y
validación de entrada en todos los endpoints. Los datos de usuario se almacenan en localStorage con
encriptación."**

### 5. Experiencias con DevOps

#### ¿Cómo implementaste CI/CD?

**"Configuré GitHub Actions para testing automático en cada PR. Los tests incluyen unit tests,
integration tests, y E2E tests con Playwright. El deployment a Vercel es automático cuando los tests
pasan."**

#### ¿Cómo manejaste el versionado?

**"Implementé Git Flow con ramas feature/, hotfix/, y release/. Cada feature tiene su propio branch
y se mergea via PR después de code review. Esto me permitió mantener un historial limpio y rollback
fácil si es necesario."**

---

## Cómo Explicar el Proyecto StockPulse

### 1. Descripción General del Proyecto

#### ¿Qué es StockPulse?

**"StockPulse es una PWA (Progressive Web App) que desarrollé para tracking de stocks en tiempo
real. Es una aplicación completa que incluye watchlists, alertas de precios, notificaciones push, y
datos en tiempo real usando WebSockets. La aplicación está construida con Next.js 15, React 19,
TypeScript, y desplegada en Vercel."**

#### ¿Por qué elegiste este proyecto?

**"Elegí desarrollar StockPulse porque combina múltiples tecnologías modernas: PWA, WebSockets, APIs
externas, y state management complejo. Es un proyecto que demuestra mi capacidad para construir
aplicaciones de producción con arquitectura escalable."**

### 2. Desafíos Técnicos y Soluciones

#### ¿Cuál fue el mayor desafío técnico?

**"El mayor desafío fue implementar datos en tiempo real de manera eficiente. La API de Finnhub
tiene rate limits, así que implementé un sistema de proxy con EventSource que maneja reconexiones
automáticas y request deduplication. Esto me permitió servir datos a múltiples usuarios sin exceder
los límites de la API."**

#### ¿Cómo manejaste el estado global?

**"Implementé Zustand con persistencia en localStorage para manejar el estado de stocks, WebSocket
connections, y preferencias de usuario. La persistencia permite que los usuarios mantengan su
watchlist entre sesiones, y el estado se sincroniza automáticamente con el servidor."**

#### ¿Cómo optimizaste el rendimiento?

**"Implementé múltiples optimizaciones: memoización de componentes, virtual scrolling para listas
largas, lazy loading de componentes pesados, y caching inteligente. También agregué skeleton loading
para mejorar la percepción de velocidad."**

### 3. Arquitectura y Decisiones Técnicas

#### ¿Por qué elegiste Next.js?

**"Elegí Next.js por su SSR/SSG capabilities, que son cruciales para SEO en una aplicación
financiera. También me permitió implementar API routes para el backend, manteniendo todo en un solo
proyecto. La optimización automática de imágenes y el code splitting fueron factores clave."**

#### ¿Cómo estructuraste el código?

**"Implementé una arquitectura feature-based con separación clara de responsabilidades. Cada feature
tiene sus propios componentes, hooks, services, y stores. Esto hace el código mantenible y
escalable, especialmente importante para un proyecto que crece constantemente."**

#### ¿Cómo manejaste el testing?

**"Implementé una estrategia de testing completa: unit tests con Jest y RTL para componentes,
integration tests para APIs, y E2E tests con Playwright para flujos completos. El coverage está en
80%+ y todos los tests pasan en CI/CD."**

### 4. Funcionalidades Implementadas

#### ¿Qué funcionalidades incluye StockPulse?

**"StockPulse incluye: búsqueda de stocks con autocompletado, watchlists personalizables, datos en
tiempo real, alertas de precios, notificaciones push, modo offline, y responsive design. También
implementé un sistema de tour para nuevos usuarios."**

#### ¿Cómo implementaste las notificaciones push?

**"Implementé Service Workers con Web Push API. Los usuarios pueden suscribirse a alertas de
precios, y el sistema envía notificaciones cuando los precios alcanzan los umbrales configurados.
También agregué un sistema de permisos y configuración granular."**

#### ¿Cómo manejaste la experiencia offline?

**"Implementé caching estratégico con Workbox. Los datos críticos se cachean para funcionar offline,
y la aplicación muestra un estado de 'offline' cuando no hay conexión. Los datos se sincronizan
automáticamente cuando se restaura la conexión."**

### 5. Métricas y Resultados

#### ¿Qué métricas implementaste?

**"Implementé métricas de Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1. También agregué
logging de errores, métricas de uso, y alertas de performance. Esto me permite monitorear la salud
de la aplicación en producción."**

#### ¿Cuáles fueron los resultados?

**"StockPulse logró: 95+ Lighthouse score, 0 errores de TypeScript, 80%+ test coverage, y deployment
automático. La aplicación maneja 1000+ stocks en tiempo real con < 200ms de latencia promedio."**

### 6. Aprendizajes y Mejoras Futuras

#### ¿Qué aprendiste del proyecto?

**"Aprendí mucho sobre arquitectura de aplicaciones reales, optimización de performance, y manejo de
estado complejo. También profundicé en WebSockets, PWAs, y testing strategies. El proyecto me enseñó
a balancear funcionalidad con rendimiento."**

#### ¿Qué mejoras planeas?

**"Planeo agregar: análisis técnico con gráficos, backtesting de estrategias, integración con más
APIs financieras, y funcionalidades de social trading. También quiero implementar machine learning
para predicciones de precios."**

---

## Checklist de Preparación para Entrevista Teórica

### Antes de la Entrevista

#### Preparación Técnica

- [x] **Repasar tecnologías del stack**: Next.js, React, TypeScript, Zustand, Tailwind
- [x] **Estudiar conceptos de sistemas**: Arquitectura, bases de datos, caching, performance
- [x] **Preparar ejemplos del proyecto StockPulse**: Desafíos, soluciones, métricas
- [ ] **Practicar explicaciones técnicas**: Cómo explicar decisiones arquitectónicas
- [x] **Revisar patrones de diseño**: Singleton, Observer, Factory, etc.
- [x] **Estudiar conceptos de DevOps**: CI/CD, Docker, monitoring, Git

#### Preparación de Experiencias

- [x] **Preparar historias STAR**: Situación, Tarea, Acción, Resultado
- [x] **Documentar métricas del proyecto**: Performance, coverage, deployment
- [x] **Preparar ejemplos de problemas resueltos**: Debugging, optimización, arquitectura
- [x] **Practicar explicar el proyecto StockPulse**: Funcionalidades, tecnologías, desafíos
- [x] **Preparar preguntas sobre el rol**: Stack, procesos, cultura, crecimiento

### Durante la Entrevista

#### Comunicación Efectiva

- [x] **Escuchar completamente** la pregunta antes de responder
- [x] **Hacer preguntas de clarificación** si es necesario
- [x] **Explicar tu proceso de pensamiento** paso a paso
- [x] **Usar ejemplos del proyecto StockPulse** cuando sea relevante
- [x] **Ser específico con métricas** y resultados cuantificables
- [x] **Mantener la calma** y ser honesto sobre lo que no sabes

#### Estructura de Respuestas

- [x] **Contexto**: Explicar la situación o problema
- [x] **Decisión**: Qué tecnología o enfoque elegiste y por qué
- [x] **Implementación**: Cómo lo implementaste
- [x] **Resultado**: Métricas, mejoras, aprendizajes
- [x] **Alternativas**: Qué otras opciones consideraste

### Preguntas para Hacer al Entrevistador

#### Sobre el Rol y Tecnologías

- [ ] ¿Cuál es el stack tecnológico principal del equipo?
- [ ] ¿Qué tipo de proyectos maneja el equipo?
- [ ] ¿Cómo es el proceso de desarrollo y deployment?
- [ ] ¿Qué herramientas de testing y CI/CD usan?

#### Sobre la Cultura y Crecimiento

- [ ] ¿Cómo es la cultura de aprendizaje en la empresa?
- [ ] ¿Qué oportunidades de crecimiento y desarrollo hay?
- [ ] ¿Cómo manejan el balance entre velocidad y calidad?
- [ ] ¿Qué tipo de mentoring o pair programming hacen?

#### Sobre el Proyecto

- [ ] ¿En qué tipo de proyectos trabajaría en este rol?
- [ ] ¿Cómo es la colaboración con otros equipos?
- [ ] ¿Qué desafíos técnicos están enfrentando actualmente?
- [ ] ¿Cómo miden el éxito de los proyectos?

---

## Conceptos de Redes y Protocolos

### 1. HTTP/HTTPS

```typescript
// HTTP Methods
const httpMethods = {
  GET: 'Obtener datos',
  POST: 'Crear recursos',
  PUT: 'Actualizar completamente',
  PATCH: 'Actualizar parcialmente',
  DELETE: 'Eliminar recursos',
  HEAD: 'Solo headers',
  OPTIONS: 'Información de métodos permitidos',
};

// HTTP Status Codes
const statusCodes = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

// HTTPS Implementation
const httpsConfig = {
  ssl: true,
  certificates: 'SSL/TLS certificates',
  encryption: 'Data encryption in transit',
  port: 443,
};
```

### 2. WebSockets vs HTTP

```typescript
// HTTP - Request/Response
const httpRequest = async () => {
  const response = await fetch('/api/stock/AAPL');
  const data = await response.json();
  return data;
};

// WebSocket - Bidirectional
class WebSocketClient {
  private ws: WebSocket;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => console.log('Connected');
    this.ws.onmessage = event => this.handleMessage(event.data);
    this.ws.onclose = () => console.log('Disconnected');
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }
}
```

### 3. DNS y CDN

```typescript
// DNS Resolution
const dnsProcess = {
  '1': 'Browser checks cache',
  '2': 'OS checks cache',
  '3': 'Router checks cache',
  '4': 'ISP DNS server',
  '5': 'Root DNS server',
  '6': 'TLD DNS server',
  '7': 'Authoritative DNS server',
};

// CDN Benefits
const cdnBenefits = {
  performance: 'Faster content delivery',
  reliability: 'Reduced server load',
  scalability: 'Global distribution',
  caching: 'Edge caching',
};
```

---

## Conceptos de DevOps y CI/CD

### 1. Continuous Integration

```yaml
# GitHub Actions Example
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

### 2. Docker y Containerización

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```typescript
// Docker Compose
const dockerCompose = {
  version: '3.8',
  services: {
    app: {
      build: '.',
      ports: ['3000:3000'],
      environment: ['NODE_ENV=production'],
    },
    redis: {
      image: 'redis:alpine',
      ports: ['6379:6379'],
    },
  },
};
```

### 3. Monitoring y Logging

```typescript
// Application Monitoring
class MonitoringService {
  private metrics: Map<string, number> = new Map();

  incrementCounter(name: string): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + 1);
  }

  recordLatency(operation: string, duration: number): void {
    console.log(`Operation ${operation} took ${duration}ms`);
  }

  logError(error: Error, context: any): void {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
}
```

---

## Conceptos de Testing Avanzado

### 1. Test Pyramid

```typescript
// Unit Tests (70%)
describe('StockService', () => {
  it('should calculate price change correctly', () => {
    const service = new StockService();
    const result = service.calculateChange(100, 110);
    expect(result).toBe(10);
  });
});

// Integration Tests (20%)
describe('Stock API Integration', () => {
  it('should fetch stock data from API', async () => {
    const response = await request(app).get('/api/stock/AAPL').expect(200);

    expect(response.body.symbol).toBe('AAPL');
  });
});

// E2E Tests (10%)
test('User can add stock to watchlist', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="stock-search"]', 'AAPL');
  await page.click('[data-testid="add-stock"]');
  await expect(page.locator('[data-testid="stock-list"]')).toContainText('AAPL');
});
```

### 2. Test Doubles

```typescript
// Mocks, Stubs, Spies, Fakes
class MockStockService implements StockService {
  private mockData: StockQuote[] = [];

  setMockData(data: StockQuote[]): void {
    this.mockData = data;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const stock = this.mockData.find(s => s.symbol === symbol);
    if (!stock) throw new Error('Stock not found');
    return stock;
  }
}

// Spy
const spy = jest.spyOn(console, 'log');
// Stub
const stub = jest.fn().mockReturnValue('mocked value');
// Fake
class FakeDatabase implements Database {
  private data: Map<string, any> = new Map();

  async save(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }
}
```

---

## Conceptos de Performance

### 1. Core Web Vitals

```typescript
// LCP - Largest Contentful Paint
const measureLCP = () => {
  new PerformanceObserver(list => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });
};

// FID - First Input Delay
const measureFID = () => {
  new PerformanceObserver(list => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  }).observe({ entryTypes: ['first-input'] });
};

// CLS - Cumulative Layout Shift
const measureCLS = () => {
  let clsValue = 0;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    console.log('CLS:', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
};
```

### 2. Memory Management

```typescript
// Memory Leaks Prevention
class StockDataManager {
  private subscriptions: Set<() => void> = new Set();

  subscribe(callback: () => void): () => void {
    this.subscriptions.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(callback);
    };
  }

  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

// WeakMap for automatic cleanup
const stockCache = new WeakMap<Stock, StockQuote>();

// Debouncing for performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

## Conceptos de Seguridad

### 1. OWASP Top 10

```typescript
// 1. Injection Prevention
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

// 2. Authentication
const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
};

// 3. Sensitive Data Exposure
const encryptSensitiveData = (data: string): string => {
  // Use proper encryption libraries
  return Buffer.from(data).toString('base64');
};

// 4. XML External Entities (XXE)
const parseXML = (xml: string): any => {
  // Use safe XML parsers, disable external entities
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
};

// 5. Broken Access Control
const checkPermission = (user: User, resource: string): boolean => {
  return user.permissions.includes(resource);
};
```

### 2. JWT Security

```typescript
// JWT Implementation
class JWTService {
  private secret = process.env.JWT_SECRET!;

  generateToken(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: '1h' });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  refreshToken(token: string): string {
    const decoded = this.verifyToken(token);
    return this.generateToken({ userId: decoded.userId });
  }
}
```

---

## Conceptos de Arquitectura Avanzada

### 1. Event-Driven Architecture

```typescript
// Event Bus
class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Event Sourcing
class EventStore {
  private events: Event[] = [];

  appendEvent(event: Event): void {
    this.events.push(event);
  }

  getEvents(aggregateId: string): Event[] {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }
}
```

### 2. CQRS (Command Query Responsibility Segregation)

```typescript
// Commands
interface Command {
  type: string;
  payload: any;
}

class CreateStockCommand implements Command {
  type = 'CREATE_STOCK';
  constructor(public payload: { symbol: string; name: string }) {}
}

// Queries
interface Query {
  type: string;
  payload: any;
}

class GetStockQuery implements Query {
  type = 'GET_STOCK';
  constructor(public payload: { symbol: string }) {}
}

// Command Handler
class StockCommandHandler {
  async handle(command: CreateStockCommand): Promise<void> {
    // Handle command logic
    await this.stockRepository.save(command.payload);
  }
}

// Query Handler
class StockQueryHandler {
  async handle(query: GetStockQuery): Promise<Stock> {
    return this.stockRepository.findBySymbol(query.payload.symbol);
  }
}
```

---

## Conceptos de Cloud y Serverless

### 1. AWS Services

```typescript
// Lambda Function
export const handler = async (event: any) => {
  const { symbol } = JSON.parse(event.body);

  const stockData = await fetchStockData(symbol);

  return {
    statusCode: 200,
    body: JSON.stringify(stockData),
  };
};

// S3 Operations
const uploadToS3 = async (file: Buffer, key: string) => {
  const s3 = new AWS.S3();
  return s3
    .upload({
      Bucket: 'stockpulse-data',
      Key: key,
      Body: file,
    })
    .promise();
};

// DynamoDB Operations
const saveStockData = async (stock: Stock) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  return dynamodb
    .put({
      TableName: 'stocks',
      Item: stock,
    })
    .promise();
};
```

### 2. Serverless Architecture

```typescript
// API Gateway + Lambda
const serverlessConfig = {
  service: 'stockpulse-api',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-east-1',
  },
  functions: {
    getStock: {
      handler: 'src/handlers/getStock.handler',
      events: [
        {
          http: {
            path: '/stock/{symbol}',
            method: 'get',
          },
        },
      ],
    },
  },
};
```

---

## Preguntas Técnicas Avanzadas

### 1. ¿Cómo implementarías un sistema de rate limiting?

```typescript
// Token Bucket Algorithm
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  isAllowed(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed * this.refillRate) / 1000);

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

### 2. ¿Cómo manejarías un sistema de colas de mensajes?

```typescript
// Message Queue Implementation
class MessageQueue {
  private queues: Map<string, any[]> = new Map();
  private consumers: Map<string, Function[]> = new Map();

  publish(queueName: string, message: any): void {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName)!.push(message);
    this.notifyConsumers(queueName);
  }

  subscribe(queueName: string, callback: Function): void {
    if (!this.consumers.has(queueName)) {
      this.consumers.set(queueName, []);
    }
    this.consumers.get(queueName)!.push(callback);
  }

  private notifyConsumers(queueName: string): void {
    const consumers = this.consumers.get(queueName) || [];
    const messages = this.queues.get(queueName) || [];

    consumers.forEach(consumer => {
      if (messages.length > 0) {
        const message = messages.shift();
        consumer(message);
      }
    });
  }
}
```

---

## Conceptos de Git y Versionado

### 1. Git Fundamentals

```bash
# Git Workflow Básico
git init                    # Inicializar repositorio
git add .                   # Agregar archivos al staging
git commit -m "message"     # Commit con mensaje
git push origin main        # Subir cambios al remoto
git pull origin main        # Descargar cambios del remoto

# Branching Strategy
git branch feature/new-stock-api    # Crear nueva rama
git checkout feature/new-stock-api  # Cambiar a la rama
git merge feature/new-stock-api     # Fusionar rama
git branch -d feature/new-stock-api # Eliminar rama local
```

### 2. Git Flow y GitHub Flow

```bash
# Git Flow (Traditional)
main branch     # Producción estable
develop branch  # Desarrollo integrado
feature/*       # Nuevas funcionalidades
release/*       # Preparación de releases
hotfix/*        # Correcciones urgentes

# GitHub Flow (Simplified)
main branch     # Siempre deployable
feature/*       # Nuevas funcionalidades
# Merge directo a main después de PR
```

### 3. Git Commands Avanzados

```bash
# Stashing
git stash                    # Guardar cambios temporalmente
git stash pop               # Aplicar último stash
git stash list              # Listar stashes
git stash apply stash@{0}   # Aplicar stash específico

# Rebasing
git rebase main             # Rebase feature branch
git rebase -i HEAD~3       # Interactive rebase
git rebase --continue      # Continuar rebase

# Cherry-picking
git cherry-pick <commit-hash>  # Aplicar commit específico

# Bisecting
git bisect start            # Iniciar búsqueda binaria
git bisect good <commit>    # Marcar commit como bueno
git bisect bad <commit>     # Marcar commit como malo
```

### 4. Git Hooks

```bash
# Pre-commit Hook
#!/bin/sh
npm run lint
npm run test
npm run type-check

# Pre-push Hook
#!/bin/sh
npm run build
npm run test:e2e
```

---

## Conceptos de Code Review

### 1. Best Practices

```typescript
// ✅ Good Code Review
// - Clear variable names
const stockPrice = calculateStockPrice(symbol);
const isPriceValid = stockPrice > 0;

// - Single responsibility
class StockPriceCalculator {
  calculatePrice(symbol: string): number {
    // Only price calculation logic
  }
}

// - Proper error handling
try {
  const result = await fetchStockData(symbol);
  return result;
} catch (error) {
  logger.error('Failed to fetch stock data', { symbol, error });
  throw new StockDataError('Unable to fetch stock data');
}

// ❌ Bad Code Review
// - Unclear variable names
const x = y + z;

// - Multiple responsibilities
class StockManager {
  calculatePrice() {
    /* ... */
  }
  sendEmail() {
    /* ... */
  }
  saveToDatabase() {
    /* ... */
  }
}

// - Poor error handling
const result = await fetchStockData(symbol); // No error handling
```

### 2. Code Review Checklist

```markdown
## Code Review Checklist

### Functionality

- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Are error conditions handled?

### Code Quality

- [ ] Is the code readable and maintainable?
- [ ] Are variable names descriptive?
- [ ] Is the code DRY (Don't Repeat Yourself)?

### Performance

- [ ] Are there any performance issues?
- [ ] Are database queries optimized?
- [ ] Is there unnecessary re-rendering?

### Security

- [ ] Are inputs validated?
- [ ] Are sensitive data handled properly?
- [ ] Are there any security vulnerabilities?

### Testing

- [ ] Are there appropriate tests?
- [ ] Do tests cover edge cases?
- [ ] Are tests maintainable?
```

---

## Conceptos de Agile y Scrum

### 1. Agile Principles

```typescript
// Agile Manifesto
const agileValues = {
  individuals: 'Individuals and interactions over processes and tools',
  working: 'Working software over comprehensive documentation',
  collaboration: 'Customer collaboration over contract negotiation',
  responding: 'Responding to change over following a plan',
};

// Scrum Framework
const scrumRoles = {
  productOwner: 'Defines requirements and priorities',
  scrumMaster: 'Facilitates the process',
  developmentTeam: 'Builds the product',
};

const scrumEvents = {
  sprintPlanning: 'Plan the sprint',
  dailyScrum: 'Daily 15-minute standup',
  sprintReview: 'Demo to stakeholders',
  sprintRetrospective: 'Improve the process',
};
```

### 2. User Stories

```markdown
## User Story Template

As a [user type] I want [functionality] So that [benefit]

## Examples

As a stock trader I want to see real-time stock prices So that I can make informed trading decisions

As a portfolio manager I want to set price alerts So that I can monitor my investments effectively
```

---

## Conceptos de Soft Skills

### 1. Communication

```typescript
// Technical Communication
const communicationSkills = {
  explaining: 'Explain complex concepts simply',
  listening: 'Listen actively to understand requirements',
  questioning: 'Ask clarifying questions',
  documenting: 'Document decisions and processes',
};

// Code Documentation
/**
 * Calculates the percentage change between two stock prices
 * @param currentPrice - The current stock price
 * @param previousPrice - The previous stock price
 * @returns The percentage change as a decimal (e.g., 0.05 for 5%)
 * @throws {Error} When previousPrice is zero or negative
 */
function calculatePercentageChange(currentPrice: number, previousPrice: number): number {
  if (previousPrice <= 0) {
    throw new Error('Previous price must be positive');
  }

  return (currentPrice - previousPrice) / previousPrice;
}
```

### 2. Problem Solving

```typescript
// Problem Solving Process
const problemSolvingSteps = {
  understand: 'Understand the problem completely',
  plan: 'Create a plan to solve it',
  implement: 'Implement the solution',
  test: 'Test the solution thoroughly',
  review: 'Review and improve if needed',
};

// Debugging Approach
const debuggingProcess = {
  reproduce: 'Reproduce the issue consistently',
  isolate: 'Isolate the root cause',
  fix: 'Implement the fix',
  verify: 'Verify the fix works',
  prevent: 'Prevent similar issues',
};
```

---

## Preguntas de Comportamiento

### 1. STAR Method

```markdown
## STAR Method for Behavioral Questions

**S**ituation: Describe the context **T**ask: Explain your responsibility **A**ction: Detail what
you did **R**esult: Share the outcome

## Example

**Situation**: Our stock tracking app was experiencing performance issues with 10,000+ concurrent
users.

**Task**: I was responsible for optimizing the application to handle the load.

**Action**: I implemented Redis caching, optimized database queries, and added CDN for static
assets.

**Result**: Reduced response time by 60% and increased concurrent user capacity to 50,000+.
```

### 2. Common Behavioral Questions

```markdown
## Common Questions

### Leadership

- "Tell me about a time you had to lead a difficult project"
- "How do you handle conflicts in your team?"

### Problem Solving

- "Describe a challenging technical problem you solved"
- "How do you approach debugging complex issues?"

### Learning

- "How do you stay updated with new technologies?"
- "Tell me about a time you had to learn something new quickly"

### Failure

- "Tell me about a time you failed and what you learned"
- "How do you handle setbacks in projects?"
```

---

## Recursos Adicionales

### Documentación Oficial

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

### Cursos Recomendados

- Next.js 15 Complete Course
- React 19 Advanced Patterns
- TypeScript Deep Dive
- PWA Development Guide

### Herramientas de Desarrollo

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Next.js DevTools](https://nextjs.org/docs/app/building-your-application/configuring/developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

_Este documento fue creado para preparación de entrevistas técnicas. Manténlo actualizado con las
últimas versiones y mejores prácticas._

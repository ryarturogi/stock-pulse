## 1. Resumen del Proyecto

**Concepto:**

StockPulse es una plataforma de seguimiento de acciones en tiempo real construida como si ya fuera
un proyecto empresarial en producción. Utiliza Next.js, React y TypeScript modernos con buenas
prácticas.

**Cómo explicarlo:**

“Este proyecto se llama StockPulse. Es una plataforma de seguimiento de acciones en tiempo real
construida con una arquitectura de nivel empresarial. La base de código tiene más de 15,000 líneas
de TypeScript estricto, y está totalmente lista para producción, desplegada en Vercel.”

**Por qué importa:**

Demuestra que no solo haces proyectos de juguete: sabes diseñar y escalar un sistema como lo haría
una empresa real.

---

## 2. Arquitectura (Basada en Features)

**Concepto:**

En lugar de agrupar el código por “tipo” (componentes, utils, etc.), se agrupa por features/dominios
(acciones, notificaciones, etc.). Esto hace que el proyecto sea escalable.

- `core/` → sistema global (middleware, utils, constantes, 500+ tipos TS)
- `features/` → módulos de negocio independientes (`stocks/`, `notifications/`)
- `shared/` → hooks reutilizables y componentes UI

**Cómo explicarlo:**

“Usé una arquitectura basada en features. Por ejemplo, todo lo relacionado con acciones — APIs,
estado, UI — vive dentro de `features/stocks`. Esto aísla cada feature, evita dependencias enredadas
y permite que varios ingenieros trabajen en paralelo sin conflictos.”

**Por qué importa:**

Demuestra escalabilidad y modularidad, muy valoradas a nivel senior.

---

## 3. ¿Por qué Next.js 15?

**Concepto:**

Next.js 15 ofrece optimizaciones modernas:

- App Router (mejores layouts + streaming)
- React Compiler (rendimiento automático)
- Turbopack (builds 10x más rápidas)
- Server Components (render híbrido, mejor SEO)
- Edge Runtime (funciones más cerca de los usuarios)

**Cómo explicarlo:**

“Elegí Next.js 15 por sus optimizaciones listas para producción como App Router y React Compiler.
Turbopack hace que las builds sean 10x más rápidas, y los Server Components ayudan con SEO y
rendimiento.”

**Por qué importa:**

Demuestra que eliges frameworks basados en beneficios medibles, no en moda.

---

## 4. Manejo de Estado (Zustand)

**Concepto:**

Zustand es un gestor de estado global ligero pero poderoso.

- Solo 2.6KB vs Redux Toolkit (21KB)
- Persistencia selectiva (`watchedStocks`, `refreshInterval`)
- Patrones avanzados: Optimistic UI, deduplicación de requests, reconciliación de estado

**Cómo explicarlo:**

“Elegí Zustand porque es minimalista y rinde muy bien. Por ejemplo, cuando un usuario sigue una
acción, la UI se actualiza de manera optimista y revierte si la request falla. También persisto solo
el estado crítico en `localStorage`, manteniendo el resto efímero.”

**Por qué importa:**

Demuestra que equilibras rendimiento, simplicidad y escalabilidad.

---

## 5. Configuración Empresarial de TypeScript

**Concepto:**

TypeScript estricto con utilidades avanzadas para consistencia.

- `"strict": true`, `"noImplicitReturns": true`, `"noImplicitOverride": true`
- Utilidades personalizadas: `DeepPartial<T>`, `AsyncState<T>`
- Validación en runtime con type guards

**Cómo explicarlo:**

“Implementé TypeScript estricto, eliminando sorpresas en runtime. También creé utilidades como
`AsyncState<T>` para estandarizar los estados de carga/error asíncronos en toda la app.”

**Por qué importa:**

Muestra disciplina y mantenibilidad a largo plazo.

---

## 6. Optimizaciones de Rendimiento

**Concepto:**

Optimizado para Lighthouse 95+ y build/runtime rápidos.

- Bundle < 200KB gzipped
- API calls < 500ms
- Hot reload < 1s
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

**Cómo explicarlo:**

“Apunté a 95+ en Lighthouse en todas las métricas. Con Turbopack y code splitting, el bundle
principal está bajo 200KB. Las APIs responden en menos de 500ms, y el hot reload siempre es menor a
un segundo.”

**Por qué importa:**

Demuestras impacto medible en la experiencia del usuario.

---

## 7. Consistencia en Tiempo Real

**Concepto:**

Estrategia híbrida para fiabilidad:

1. Proxy SSE WebSocket (principal)
2. Polling cada 30s (fallback)
3. Reconexión con backoff exponencial
4. Throttling de actualizaciones (500ms)

**Cómo explicarlo:**

“Usé un enfoque híbrido para tiempo real: conexión SSE para actualizaciones instantáneas, pero
fallback a polling cada 30s si falla. Las actualizaciones están limitadas a 500ms para evitar
renders innecesarios.”

**Por qué importa:**

Demuestra resiliencia y enfoque en la experiencia del usuario.

---

## 8. Pirámide de Tests

**Concepto:**

Estrategia balanceada con 150+ test cases.

- Unit (Jest + RTL, 85%+ líneas, 90%+ funciones)
- Integración (API + stores)
- E2E (Playwright en 5 navegadores)
- Umbral: 80% global

**Cómo explicarlo:**

“Implementé una pirámide de tests completa: unitarios para lógica, de integración para API y estado,
y Playwright para flujos críticos en Chrome, Safari, Firefox y móvil.”

**Por qué importa:**

Los candidatos senior deben demostrar disciplina en testing.

---

## 9. Seguridad

**Concepto:**

Enfoque server-first + headers estrictos.

- API keys solo en servidor
- Middleware centralizado para CORS, validación, rate limiting
- Headers: CSP, X-Frame-Options, X-Content-Type-Options
- Rate limiting en memoria (Redis planeado para escalar)

**Cómo explicarlo:**

“Todos los secretos están solo en el servidor. Aplico headers de seguridad y rate limiting en
middleware, con Redis en el roadmap para escalado distribuido.”

**Por qué importa:**

Demuestra conciencia de seguridad real en producción.

---

## 10. Despliegue & CI/CD

**Concepto:**

Pipeline automatizado con GitHub Actions → Vercel.

- Corre type check, lint, unit y E2E tests antes de deploy
- Endpoint `/api/health` para monitoreo
- Deploy < 5 min, uptime 99.9%

**Cómo explicarlo:**

“El despliegue es automatizado. Nada pasa a producción si no superan los checks de tipo, lint y
tests. Vercel garantiza deploys bajo 5 minutos y uptime de 99.9%.”

**Por qué importa:**

Muestra conciencia profesional de DevOps.

---

## 11. Métricas de Éxito

**Concepto:**

Prueba cuantificable de calidad.

- Calidad: 85%+ cobertura, 0 errores TS
- Rendimiento: Lighthouse 95+, Bundle < 200KB
- Arquitectura: 15k LOC, features modulares
- Despliegue: < 5min, 99.9% uptime

**Cómo explicarlo:**

“El éxito no lo mido solo en features, sino en métricas: cobertura 85%+, Lighthouse 95+, bundle <
200KB y casi uptime perfecto.”

**Por qué importa:**

Los gerentes valoran ingeniería basada en métricas.

---

## 12. Roadmap

**Concepto:**

Ruta de escalado futuro.

- Migrar a RSC + Micro-frontends
- Agregar GraphQL
- Redis para cache distribuido + rate limiting
- OpenTelemetry para observabilidad

**Cómo explicarlo:**

“El roadmap incluye GraphQL para queries eficientes, Redis para cache distribuido, y OpenTelemetry
para observabilidad total. Esto prepara el sistema para escalar más allá del MVP.”

**Por qué importa:**

Demuestra visión de futuro.

---

## 🎯 Estrategia de Entrevista

1. Empieza amplio → luego entra en detalles (proyecto → arquitectura → implementación).
2. Cita métricas constantemente (200KB bundle, 500ms API, 85% cobertura).
3. Responde siempre en formato: **Problema → Solución → Beneficio**.
4. Cierra con roadmap → demuestra visión a largo plazo.

---

## 🏗️ Arquitectura Actual del Proyecto

src/ ├── core/ # Módulos centrales del sistema │ ├── types/ # Definiciones de tipos TS │ ├──
middleware/ # Middleware de API │ ├── services/ # Servicios principales │ ├── utils/ # Utilidades
compartidas │ └── constants/ # Configuración centralizada ├── features/ # Módulos basados en
features │ ├── stocks/ # Funcionalidad de seguimiento de acciones │ │ ├── components/ # Componentes
UI específicos │ │ ├── hooks/ # Hooks personalizados │ │ ├── services/ # Servicios API de acciones │
│ ├── stores/ # Stores de Zustand │ │ └── integration/ # Tests de integración │ ├── notifications/ #
Sistema de notificaciones │ │ ├── components/ # UI de notificaciones │ │ ├── services/ # Integración
service worker │ │ └── stores/ # Estado de notificaciones │ └── pwa/ # Features de PWA └── shared/ #
Componentes y hooks reutilizables ├── components/ └── hooks/

---

## 🧪 Estrategia de Testing Actual

**Tests implementados:**

- **Unit tests:** 26+ archivos (Jest + RTL)
- **Integración:** APIs y stores
- **E2E:** Playwright cross-browser
- **Cobertura:** mínimo 80% global

**Categorías principales:**

src/features/stocks/components/.test.tsx src/features/stocks/stores/.test.ts
src/features/notifications/services/.test.ts src/shared/components/.test.tsx tests/e2e/\*.spec.ts

---

## 🚀 Métricas de Rendimiento Actual

**Dependencias principales:**

- Next.js 15.0.3 con React 19.0.0
- TypeScript 5.6.3 con configuración estricta
- Zustand 5.0.1 para estado
- TailwindCSS 3.4.14 para estilos
- Jest 29.7.0 + Playwright 1.48.2 para tests

**Scripts de desarrollo:**

pnpm run dev # Servidor de desarrollo pnpm run build # Build de producción pnpm run type-check #
Validación TS pnpm run lint # Linter pnpm run test:coverage # Reporte de cobertura pnpm run
test:e2e # Tests end-to-end

---

## 🔒 Implementación de Seguridad

**Rutas API con middleware:**

- `/api/health` - health check
- `/api/quote` - obtener precios
- `/api/websocket-proxy` - proxy en tiempo real
- `/api/push/*` - endpoints de notificaciones

**Características de seguridad:**

- API keys solo en server-side
- Configuración CORS
- Validación/sanitización de input
- Rate limiting
- Headers de seguridad

---

## 📊 Features Actuales

**Core:**

- ✅ Seguimiento en tiempo real de precios
- ✅ Notificaciones push
- ✅ Soporte PWA
- ✅ Responsive (mobile-first)
- ✅ Dark mode
- ✅ Infinite scroll para selección
- ✅ Alertas de precio
- ✅ Buscador
- ✅ Gráficas con Recharts

**Técnicos:**

- ✅ WebSockets + polling fallback
- ✅ Service Worker offline
- ✅ Persistencia local
- ✅ Error boundaries
- ✅ Loading states + Optimistic UI
- ✅ API responses tipadas

---

## 🎓 Puntos Clave para la Entrevista

### Decisión de Arquitectura:

“Elegí arquitectura basada en features en vez de MVC tradicional porque escala mejor con tamaño de
equipo y complejidad de features.”

### Estrategia de Rendimiento:

“Optimizé Core Web Vitals con optimizaciones automáticas de Next.js 15, code splitting y
memoization. El bundle se mantiene <200KB.”

### Filosofía de Testing:

“Usé pirámide de tests: unit para lógica, integración para API, y E2E para flujos críticos. Balance
entre confianza y velocidad.”

### Elección de Estado:

“Elegí Zustand sobre Redux: mismas capacidades, 90% menos boilerplate, mejor integración con TS, y
2.6KB vs 21KB.”

### Estrategia en Tiempo Real:

“Sistema híbrido: WebSocket para instantáneo + polling fallback. Fiabilidad en cualquier red, pero
tiempo real siempre que sea posible.”

---

## 🚀 Consideraciones Futuras de Escalabilidad

**Deuda técnica:**

- Migrar a React Server Components
- Implementar GraphQL
- Redis para cache distribuido
- Error tracking completo
- Internacionalización

**Roadmap de escalabilidad:**

- Micro-frontends
- Base de datos para cuentas de usuario
- Analíticas avanzadas
- Multi-tenant
- Versionado de API

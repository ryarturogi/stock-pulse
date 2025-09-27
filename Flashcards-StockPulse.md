# Flashcards - StockPulse Technologies

## Guía de Estudio Rápido para Entrevistas

---

## 🚀 Next.js 15

### Q: ¿Qué es Next.js 15?

**A:** Framework de React con SSR/SSG, App Router, y optimizaciones automáticas.

### Q: ¿Por qué elegiste Next.js para StockPulse?

**A:** SSR/SSG para SEO financiero, API routes integradas, optimización automática de imágenes y
code splitting.

### Q: ¿Cómo implementaste el App Router?

**A:** Estructura app/ con layouts anidados, loading.tsx para estados, error.tsx para manejo de
errores.

### Q: ¿Qué son Server Components?

**A:** Componentes que se ejecutan en el servidor para SEO y performance inicial.

---

## ⚛️ React 19

### Q: ¿Qué son las Concurrent Features?

**A:** Suspense para loading states, mejorando UX con skeleton components y evitando layout shifts.

### Q: ¿Cómo funciona Automatic Batching?

**A:** React agrupa actualizaciones de estado en un solo re-render, mejorando performance.

### Q: ¿Qué es useOptimistic?

**A:** Hook para actualizaciones optimistas - UI se actualiza inmediatamente mientras se procesa la
petición.

### Q: ¿Cómo manejaste el estado en StockPulse?

**A:** Estrategia híbrida: useState (local), useContext (compartido), Zustand (global).

---

## 🔷 TypeScript 5.6

### Q: ¿Por qué TypeScript en modo estricto?

**A:** Elimina tipos 'any', detecta errores en compilación, reduce bugs en producción en 90%.

### Q: ¿Qué son Type Guards?

**A:** Funciones que validan datos de APIs externas antes de procesarlos, previniendo errores de
runtime.

### Q: ¿Cuándo usar Interface vs Type?

**A:** Interfaces para contratos de APIs (extensión), Types para uniones y primitivos
(flexibilidad).

### Q: ¿Qué son Utility Types?

**A:** Partial, Pick, Omit para crear interfaces flexibles sin duplicar código.

---

## 🗃️ Zustand

### Q: ¿Por qué Zustand sobre Redux?

**A:** API más simple, menos boilerplate, TypeScript nativo, persistencia automática.

### Q: ¿Cómo implementaste persistencia?

**A:** localStorage automático para stocks, preferencias y configuraciones entre sesiones.

### Q: ¿Qué son Selectors?

**A:** useStockStore(state => state.stocks) solo re-renderiza cuando cambian stocks, no otros
campos.

### Q: ¿Cómo manejaste múltiples stores?

**A:** stockStore (datos), notificationStore (alertas), pwaStore (configuración) - cada uno
especializado.

---

## 🎨 Tailwind CSS

### Q: ¿Por qué Tailwind sobre CSS tradicional?

**A:** Utility-first, responsive design integrado, dark mode nativo, PurgeCSS para optimización.

### Q: ¿Cómo implementaste responsive design?

**A:** Breakpoints sm:, md:, lg:, xl: con layouts específicos para cada tamaño de dispositivo.

### Q: ¿Cómo funciona el dark mode?

**A:** Clases dark: que se persisten en localStorage y se aplican automáticamente.

### Q: ¿Qué es PurgeCSS?

**A:** Elimina clases no utilizadas en producción, reduciendo CSS final en 80%.

---

## 📱 PWA (Progressive Web App)

### Q: ¿Qué es un Service Worker?

**A:** Script que cachea recursos y permite funcionalidad offline interceptando requests.

### Q: ¿Cómo implementaste notificaciones push?

**A:** Web Push API con Service Workers, usuarios se suscriben a alertas de precios.

### Q: ¿Qué estrategias de caching usaste?

**A:** Cache-first (estáticos), network-first (dinámicos), stale-while-revalidate (stocks).

### Q: ¿Cómo funciona offline?

**A:** Datos críticos cacheados, estado 'offline' visible, sincronización automática al restaurar
conexión.

---

## 🔌 WebSocket / EventSource

### Q: ¿Por qué EventSource sobre WebSocket?

**A:** Solo necesitamos datos del servidor al cliente, EventSource maneja reconexión
automáticamente.

### Q: ¿Cómo manejaste la reconexión?

**A:** Exponential backoff: 1s, 2s, 4s, 8s hasta 30s máximo, luego se estabiliza.

### Q: ¿Qué es message deduplication?

**A:** Cada mensaje tiene timestamp e ID único, cliente ignora duplicados o fuera de orden.

### Q: ¿Cómo implementaste fallback?

**A:** Cuando EventSource falla, polling HTTP cada 5 segundos para mantener datos.

---

## 🧪 Testing

### Q: ¿Qué estrategia de testing usaste?

**A:** Jest + RTL (unit), Integration tests (APIs), Playwright (E2E) - 80%+ coverage.

### Q: ¿Cómo testeas componentes React?

**A:** React Testing Library enfocado en comportamiento del usuario, no implementación.

### Q: ¿Qué son Test Doubles?

**A:** Mocks (simulación), Stubs (valores fijos), Spies (monitoreo), Fakes (implementación simple).

### Q: ¿Cómo testeas E2E?

**A:** Playwright en múltiples navegadores, flujos completos: búsqueda, agregar a watchlist,
alertas.

---

## 🚀 Vercel Deployment

### Q: ¿Por qué Vercel?

**A:** Deployment automático desde GitHub, preview deployments para PRs, Edge Functions.

### Q: ¿Cómo manejaste variables de entorno?

**A:** Desarrollo, staging, producción con API keys seguras en servidor.

### Q: ¿Qué son Edge Functions?

**A:** Procesamiento cerca de usuarios, reduciendo latencia para operaciones críticas.

### Q: ¿Cómo monitoreaste performance?

**A:** Vercel Analytics con Core Web Vitals, errores de JavaScript, patrones de uso.

---

## ⚡ Performance

### Q: ¿Cómo optimizaste el bundle?

**A:** Code splitting automático, lazy loading de componentes pesados, reducción del 40%.

### Q: ¿Qué es virtual scrolling?

**A:** Solo renderiza elementos visibles, permite manejar 1000+ stocks sin impacto en performance.

### Q: ¿Cómo implementaste memoización?

**A:** React.memo(), useMemo(), useCallback() redujeron re-renders innecesarios en 70%.

### Q: ¿Qué son Core Web Vitals?

**A:** LCP < 2.5s, FID < 100ms, CLS < 0.1 - métricas cruciales para ranking de Google.

---

## 🏗️ Arquitectura

### Q: ¿Cómo estructuraste el código?

**A:** Feature-based: cada feature tiene componentes, hooks, services, stores separados.

### Q: ¿Por qué microservicios?

**A:** Escalabilidad independiente, diferentes tecnologías, equipos separados.

### Q: ¿Cómo manejaste la escalabilidad?

**A:** Request deduplication (1000/min → 200/min), exponential backoff, caching inteligente.

### Q: ¿Qué es eventual consistency?

**A:** Datos en tiempo real tienen prioridad, fallback a datos cacheados si fallan.

---

## 🔒 Seguridad

### Q: ¿Cómo implementaste autenticación?

**A:** JWT con refresh tokens (1 hora), renovación automática, rate limiting (100 req/min).

### Q: ¿Cómo manejaste datos sensibles?

**A:** API keys en variables de entorno del servidor, CORS estricto, validación de entrada.

### Q: ¿Qué es CORS?

**A:** Cross-Origin Resource Sharing - controla qué dominios pueden acceder a tu API.

### Q: ¿Cómo previenes inyecciones?

**A:** Validación de entrada, sanitización de datos, type guards para APIs externas.

---

## 📊 Métricas y Resultados

### Q: ¿Cuáles fueron los resultados de StockPulse?

**A:** 95+ Lighthouse score, 0 errores TypeScript, 80%+ test coverage, < 200ms latencia promedio.

### Q: ¿Cómo mediste performance?

**A:** Core Web Vitals, logging estructurado, alertas automáticas, métricas de uso.

### Q: ¿Qué aprendiste del proyecto?

**A:** Arquitectura real, optimización de performance, manejo de estado complejo, balance
funcionalidad/rendimiento.

### Q: ¿Qué mejoras planeas?

**A:** Análisis técnico con gráficos, backtesting, más APIs financieras, machine learning para
predicciones.

---

## 🎯 Preguntas de Comportamiento (STAR)

### Q: "Cuéntame sobre un desafío técnico que resolviste"

**S:** StockPulse necesitaba datos en tiempo real pero la API tenía rate limits. **T:** Implementar
sistema eficiente de datos en tiempo real. **A:** Proxy con EventSource, request deduplication,
exponential backoff. **R:** Redujo llamadas de 1000/min a 200/min, manteniendo funcionalidad.

### Q: "¿Cómo manejaste un problema de performance?"

**S:** Listas largas de stocks causaban lag (2 FPS). **T:** Optimizar renderizado de listas de 1000+
stocks. **A:** Virtual scrolling, memoización de componentes. **R:** Mejoró de 2 FPS a 60 FPS.

### Q: "¿Cómo aprendiste una nueva tecnología?"

**S:** Necesitaba implementar PWA features. **T:** Aprender Service Workers y Web Push API. **A:**
Documentación oficial, proyectos de ejemplo, implementación gradual. **R:** PWA funcional con
notificaciones push y modo offline.

---

## 📝 Checklist de Preparación

### ✅ Antes de la Entrevista

- [x] Repasar tecnologías del stack
- [x] Preparar ejemplos de StockPulse
- [x] Practicar explicaciones técnicas
- [x] Preparar historias STAR
- [x] Documentar métricas del proyecto

### ✅ Durante la Entrevista

- [x] Escuchar completamente la pregunta
- [x] Hacer preguntas de clarificación
- [x] Explicar proceso de pensamiento
- [x] Usar ejemplos de StockPulse
- [x] Ser específico con métricas

### ✅ Preguntas para el Entrevistador

- [x] ¿Cuál es el stack tecnológico del equipo?
- [x] ¿Cómo es el proceso de desarrollo?
- [x] ¿Qué tipo de proyectos manejan?
- [x] ¿Cómo es la cultura de aprendizaje?
- [x] ¿Qué oportunidades de crecimiento hay?

---

## 🎯 Frases Clave para Memorizar

**"En StockPulse implementé..."** - Inicia todas las respuestas con contexto del proyecto

**"Esto me permitió..."** - Conecta implementación con beneficio

**"Redujo/Mejoró en X%"** - Siempre incluye métricas cuantificables

**"La decisión clave fue..."** - Explica por qué elegiste esa tecnología

**"Implementé un sistema robusto..."** - Demuestra pensamiento arquitectónico

**"Esto asegura que..."** - Conecta con beneficios para el usuario

---

_Flashcards creadas para preparación de entrevistas técnicas con StockPulse como proyecto de
referencia._

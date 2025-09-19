# StockPulse

Enterprise-grade Next.js 15 + React 19 + TypeScript stock market tracking application with comprehensive TypeScript utilities, Vercel deployment, and PWA capabilities.

## 📊 Project Status

🏗️ **Infrastructure Complete** - Enterprise-grade scaffolding with all configurations and deployment setup
📦 **TypeScript Utilities** - Comprehensive type system for enhanced developer experience  
🚀 **Deployment Ready** - Full Vercel integration with automated CI/CD pipeline
🧪 **Testing Framework** - Complete testing setup with Jest and Playwright
📖 **Documentation** - Comprehensive guides and development templates

**Next Phase**: Business logic implementation (stock APIs, UI components, state management)

## 🚀 Features

- **Next.js 15 + React 19** - Latest framework features with React Compiler optimizations
- **Enterprise TypeScript Utils** - Comprehensive utility types for type safety and consistency
- **Vercel Deployment Ready** - Complete deployment configuration with cron jobs
- **Progressive Web App** - Offline functionality with push notifications
- **API-First Architecture** - Type-safe API routes with comprehensive error handling
- **Real-time Stock Tracking** - Live market data and price updates (infrastructure ready)
- **Security-First** - Environment variable security audit and proper secret management
- **Developer Experience** - Cursor IDE and Claude Code rules for enhanced productivity

## 🛠️ Tech Stack

### Core Framework
- **Framework**: Next.js 15 (App Router) with React Compiler & Turbopack
- **UI Library**: React 19 with Concurrent Features
- **Language**: TypeScript 5.6 (Strict Mode)
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **State Management**: Zustand 5.0

### Development & Testing
- **Testing**: Jest + React Testing Library 16 + Playwright
- **Linting**: ESLint 9 (Flat Config) + Prettier 3.3
- **Git Hooks**: Husky + lint-staged
- **Package Manager**: pnpm 8+

### Deployment & Infrastructure
- **Hosting**: Vercel with Edge Functions and built-in CI/CD
- **PWA**: next-pwa with Service Worker and Push Notifications
- **Automation**: Vercel Git integration with automatic deployments
- **Monitoring**: Health checks and error tracking ready

### TypeScript Architecture
- **Utility Types**: Comprehensive type utilities in `/types/utils.ts`
- **Type Safety**: Runtime type guards and validation
- **API Types**: Consistent `ApiResponse<T>` and `ApiError` patterns
- **Component Types**: Standardized props with utility types

## 📋 Prerequisites

- Node.js >= 20.0.0 (required for Next.js 15)
- pnpm >= 8.0.0

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-pulse
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys and configuration
   ```

4. **Generate VAPID keys for push notifications**
   ```bash
   pnpm run generate-vapid
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting
- `pnpm run type-check` - Run TypeScript type checking
- `pnpm run test` - Run unit tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Run tests with coverage
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run test:e2e:ui` - Run E2E tests with UI
- `pnpm run test:e2e:debug` - Debug E2E tests
- `pnpm run build:analyze` - Build with bundle analyzer
- `pnpm run deploy:vercel` - Deploy to Vercel production
- `pnpm run deploy:preview` - Deploy to Vercel preview
- `pnpm run vercel:env` - Pull environment variables from Vercel

## 🔧 Configuration

### Environment Variables

Create environment files for different stages. See `.env.example` for all available variables.

#### Development (`.env.local`)
```env
# =============================================================================
# StockPulse Environment Configuration
# =============================================================================

# 🌐 PUBLIC VARIABLES (Client-side accessible)
NEXT_PUBLIC_APP_NAME=StockPulse
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_FEATURE_PORTFOLIO=true
NEXT_PUBLIC_FEATURE_ALERTS=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# 🔒 PRIVATE VARIABLES (Server-side only)
# Stock API Keys
FINNHUB_API_KEY=your_finnhub_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Security
JWT_SECRET=your_jwt_secret_32chars_minimum
ENCRYPTION_KEY=your_encryption_key_32chars_minimum
CRON_SECRET=your_cron_secret_for_vercel_jobs

# Push Notifications  
VAPID_PRIVATE_KEY=your_vapid_private_key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Production
Use Vercel environment variables or `.env.production` for production deployment.

⚠️ **Security Note**: Never commit secrets to git. Use Vercel's environment variable management.

### API Keys

You'll need API keys from:

1. **Finnhub** - [Get API Key](https://finnhub.io/)
2. **Alpha Vantage** - [Get API Key](https://www.alphavantage.co/)

## 🏗️ Project Structure

```
stock-pulse/
├── app/                           # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   ├── health/              # Health check endpoint
│   │   └── cron/                # Vercel cron jobs
│   ├── layout.tsx               # Root layout with React 19
│   ├── page.tsx                 # Home page
│   ├── loading.tsx              # Global loading UI
│   ├── error.tsx                # Global error UI
│   └── globals.css              # Global Tailwind styles
├── components/                   # Reusable UI components
│   ├── ui/                      # shadcn/ui base components
│   └── shared/                  # Custom shared components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
├── services/                    # API services and external integrations
├── stores/                      # Zustand state management
├── types/                       # TypeScript utilities and definitions
│   ├── index.ts                # Central type exports
│   └── utils.ts                # Comprehensive utility types
├── utils/                       # Utility functions
├── public/                      # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (next-pwa)
│   └── icons/                  # App icons
├── scripts/                     # Build and deployment scripts
│   ├── generate-vapid.js       # VAPID key generator
│   ├── setup-vercel-env.sh     # Environment setup script
│   └── deploy-vercel.sh        # Deployment script
├── docs/                        # Comprehensive documentation
│   ├── ARCHITECTURE.md         # System architecture
│   ├── VERCEL-DEPLOYMENT.md    # Deployment guide
│   └── TEST-REVIEW.md          # Testing strategy
├── claude.rules/               # Claude Code development prompts
│   ├── create-component.prompt  # Component creation template
│   ├── create-api-route.prompt  # API route template
│   ├── create-page.prompt       # Page creation template
│   └── bootstrap-dev-env.prompt # Environment setup
├── tests/                      # Test files and configurations
├── vercel.json                 # Vercel deployment configuration
├── .cursorrules               # Cursor IDE configuration
└── tailwind.config.js         # Tailwind CSS configuration
```

## 🔧 TypeScript Utilities

This project includes comprehensive TypeScript utilities for enhanced type safety and developer experience:

### Core Utility Types
```typescript
import { 
  ApiResponse, 
  AsyncState, 
  ComponentProps, 
  DeepPartial,
  isDefined 
} from '@/types';

// API responses
const response: ApiResponse<UserData> = await fetchUser();

// Component props with utilities
interface ButtonProps extends ComponentProps, Disableable, Sizeable {
  variant: 'primary' | 'secondary';
}

// Async state management
const [userState, setUserState] = useState<AsyncState<User>>({
  loading: true,
  data: undefined,
  error: undefined
});

// Runtime type checking
if (isDefined(data) && isString(data.name)) {
  // Type-safe operations
}
```

### Available Utility Categories
- **Basic Types**: `DeepPartial`, `RequiredBy`, `PartialBy`, `OptionalExcept`
- **API Types**: `ApiResponse`, `ApiError`, `PaginatedResponse`, `HttpMethod`
- **Component Types**: `ComponentProps`, `WithClassName`, `Disableable`, `Loadable`
- **State Types**: `AsyncState`, `FormState`, `ValidationResult`
- **Type Guards**: `isDefined`, `isString`, `isNumber`, `isBoolean`, `isObject`

## 🧪 Testing

### Unit Tests
```bash
pnpm run test                # Run all unit tests
pnpm run test:watch         # Run tests in watch mode
pnpm run test:coverage      # Run tests with coverage report
```

### End-to-End Tests
```bash
pnpm run test:e2e           # Run E2E tests
pnpm run test:e2e:ui        # Run E2E tests with UI
pnpm run test:e2e:debug     # Debug E2E tests
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

#### Automated Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel

# Set up environment variables
./scripts/setup-vercel-env.sh

# Deploy to production
pnpm run deploy:vercel
```

#### Manual Environment Setup
```bash
# Add production environment variables
vercel env add FINNHUB_API_KEY production
vercel env add ALPHA_VANTAGE_API_KEY production
vercel env add JWT_SECRET production
vercel env add CRON_SECRET production

# Pull environment variables locally
vercel env pull .env.local
```

### Production Build
```bash
pnpm run build             # Build for production
pnpm run start             # Start production server locally
```

### Vercel Deployment Features
- **Git Integration** - Automatic deployments on every push to main
- **Preview Deployments** - Every PR gets a unique preview URL with full functionality
- **Cron Jobs** - Automated stock price updates every 5 minutes via Vercel Cron
- **Edge Functions** - Global performance optimization and fast response times
- **Built-in Analytics** - Performance monitoring and Core Web Vitals tracking
- **Health Monitoring** - `/api/health` endpoint for uptime monitoring

See [Vercel Deployment Guide](./docs/VERCEL-DEPLOYMENT.md) for detailed instructions.

## 📱 PWA Features

- **Offline Support** - Works without internet connection
- **Push Notifications** - Real-time price alerts
- **App-like Experience** - Install on mobile/desktop
- **Background Sync** - Sync data when connection is restored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Use TypeScript Utils** - Always import from `@/types` instead of creating custom types
- **Follow Strict Typing** - Use utility types for consistent API responses and component props
- **Write Comprehensive Tests** - Unit tests for components, integration tests for API routes
- **Use Conventional Commits** - Follow conventional commit message format
- **Pre-commit Checks** - Linting, formatting, and type checking run automatically
- **Update Documentation** - Keep README and docs in sync with changes

## 🧑‍💻 Developer Experience

### IDE Configuration
- **Cursor IDE Rules** - Pre-configured `.cursorrules` for optimal development
- **Claude Code Prompts** - Standardized templates in `claude.rules/` directory
- **TypeScript IntelliSense** - Enhanced auto-completion with utility types
- **Import Organization** - Automatic import sorting with `@/types` prioritization

### Code Generation Templates
```bash
# Available Claude Code prompts:
claude.rules/create-component.prompt    # React component with TypeScript utils
claude.rules/create-api-route.prompt    # Next.js API route with type safety  
claude.rules/create-page.prompt         # Next.js page with proper metadata
claude.rules/bootstrap-dev-env.prompt   # Full project setup template
```

### Development Workflow
1. **Type-First Development** - Define types before implementation
2. **Component-Driven** - Build reusable components with utility types
3. **API-First** - Design API contracts with consistent response types
4. **Test-Driven** - Write tests using TypeScript utilities for type safety

## 📝 Code Quality

- **TypeScript 5.6** - Strict mode with comprehensive utility types
- **ESLint 9** - Flat config with Next.js and TypeScript rules
- **Prettier 3.3** - Consistent code formatting
- **Husky + lint-staged** - Pre-commit hooks for quality gates
- **Jest + RTL** - Unit testing with TypeScript support
- **Playwright** - E2E testing with type-safe page objects
- **Vercel Security** - Built-in security scanning and dependency updates

## 🔒 Security

- Input validation and sanitization
- API rate limiting
- Secure headers configured
- Environment variable protection
- Regular dependency updates

## 📊 Performance

- Next.js optimizations (SSR, ISR, Image optimization)
- Code splitting and lazy loading
- Bundle analysis and optimization
- Lighthouse performance monitoring
- Core Web Vitals tracking

## 📖 Documentation

### Core Documentation
- [📐 Architecture Guide](./docs/ARCHITECTURE.md) - System design and technical decisions
- [🧪 Testing Strategy](./docs/TEST-REVIEW.md) - Comprehensive testing approach
- [🚀 Vercel Deployment](./docs/VERCEL-DEPLOYMENT.md) - Complete deployment guide with automation

### Development Resources
- [🔧 TypeScript Utilities](./types/utils.ts) - Comprehensive utility types documentation
- [🎯 Component Templates](./claude.rules/) - Standardized development prompts
- [⚙️ IDE Configuration](./.cursorrules) - Cursor IDE optimization rules

### API Documentation
- [🏥 Health Check](./app/api/health/route.ts) - Application health monitoring
- [⏰ Cron Jobs](./app/api/cron/) - Automated background tasks
- API documentation will be generated with business logic implementation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/your-username/stock-pulse/issues)
- [Documentation](./docs/)
- [Contributing Guide](CONTRIBUTING.md)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Finnhub and Alpha Vantage for market data APIs
- The open-source community for the excellent libraries
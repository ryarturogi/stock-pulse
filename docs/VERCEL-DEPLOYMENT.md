# Vercel Deployment Guide for StockPulse

This guide covers the complete deployment process for StockPulse on Vercel, including environment setup, domain configuration, and monitoring.

## 🚀 Quick Start

### 1. Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed globally
- Vercel account
- GitHub repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Initial Deployment

```bash
# Clone and setup project
git clone <your-repo-url>
cd stock-pulse
pnpm install

# Deploy to Vercel
vercel

# Follow the prompts:
# ? Set up and deploy "~/Projects/stock-pulse"? [Y/n] y
# ? Which scope do you want to deploy to? Your Username
# ? Link to existing project? [y/N] n
# ? What's your project's name? stock-pulse
# ? In which directory is your code located? ./
```

## 🌍 Environment Configuration

### Automated Setup (Recommended)

Use our provided script to set up all environment variables:

```bash
# Make script executable
chmod +x scripts/setup-vercel-env.sh

# Run environment setup
./scripts/setup-vercel-env.sh
```

### Manual Setup

#### Required Environment Variables

**🔒 Private Variables (Server-side only)**

```bash
# Stock API Keys
vercel env add FINNHUB_API_KEY production
vercel env add ALPHA_VANTAGE_API_KEY production

# Security
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add CRON_SECRET production

# Push Notifications
vercel env add VAPID_PRIVATE_KEY production

# Optional: Database
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
```

**🌐 Public Variables (Client-side)**

These are set in your codebase and deployed automatically:
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION` 
- `NEXT_PUBLIC_FEATURE_*`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### Environment Management

```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Add new environment variable
vercel env add VARIABLE_NAME production

# Remove environment variable
vercel env rm VARIABLE_NAME production
```

## 🏗️ Project Configuration

### Vercel Configuration (`vercel.json`)

Our project includes a comprehensive `vercel.json` with:

- **Build Settings**: Optimized for Next.js 15
- **Cron Jobs**: Automated stock price updates
- **Security Headers**: Production-ready security
- **Cache Control**: Optimized caching strategy
- **Redirects & Rewrites**: SEO-friendly URLs

### Key Features Configured

#### 🕐 Cron Jobs
- **Stock Price Updates**: Every 5 minutes
- **Cache Cleanup**: Every 6 hours  
- **Price Alerts**: Every minute

#### 🔒 Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricted camera/microphone access

#### ⚡ Performance Optimizations
- Static asset caching (1 year)
- Service Worker caching
- Compression enabled
- Edge regions configured

## 🚦 Deployment Workflow

### Automated Deployment (Vercel Git Integration)

Vercel's built-in CI/CD automatically handles:

1. **Pull Requests**: Deploy to unique preview URL with full functionality
2. **Main Branch**: Deploy to production with zero-downtime
3. **Quality Gates**: Automatic build optimization and error detection
4. **Performance**: Built-in Core Web Vitals monitoring and optimization

#### Setup Git Integration

1. **Connect Repository**: Link your Git repository in Vercel dashboard
2. **Configure Build Settings**: Next.js detected automatically
3. **Set Branch Protection**: Configure which branches trigger deployments

No additional CI/CD setup required - Vercel handles everything!

### Manual Deployment

#### Preview Deployment
```bash
# Deploy to preview URL
vercel

# Or use our script
./scripts/deploy-vercel.sh preview
```

#### Production Deployment
```bash
# Deploy to production
vercel --prod

# Or use our script  
./scripts/deploy-vercel.sh production
```

## 🌐 Domain Configuration

### Custom Domain Setup

1. **Add Domain in Vercel Dashboard**
   - Go to Project Settings > Domains
   - Add your custom domain (e.g., `stockpulse.com`)

2. **Configure DNS**
   ```
   # Add these DNS records:
   A     @     76.76.19.61
   CNAME www   stockpulse.vercel.app
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Supports wildcard certificates

### Environment-Specific Domains

```bash
# Production
https://stockpulse.com

# Staging  
https://staging.stockpulse.com

# Preview (automatic)
https://stock-pulse-git-feature-branch.vercel.app
```

## 📊 Monitoring & Analytics

### Built-in Monitoring

Vercel provides:
- **Performance Analytics**: Core Web Vitals
- **Function Logs**: Serverless function monitoring
- **Error Tracking**: Runtime error detection
- **Traffic Analytics**: Request patterns

### Custom Monitoring

Our health check endpoint:
```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "responseTime": "45ms",
  "checks": {
    "memory": {...},
    "externalApis": {...}
  }
}
```

### Error Tracking

Configure Sentry for advanced error tracking:

```bash
# Add Sentry environment variables
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_AUTH_TOKEN production
```

## 🔧 Development Workflow

### Local Development

```bash
# Start development server
pnpm run dev

# Pull environment variables from Vercel
pnpm run vercel:env

# Test production build locally
pnpm run build
pnpm run start

# Run quality checks (automatically runs on Vercel)
pnpm run lint
pnpm run type-check
pnpm run test
```

### Vercel Git Integration Workflow

1. **Feature Development**: Work on feature branch locally
2. **Push to Branch**: Creates automatic preview deployment
3. **Pull Request**: Review with live preview URL
4. **Merge to Main**: Automatic production deployment
5. **Monitor**: Use Vercel dashboard for performance tracking

### Preview Deployments

Every git push automatically creates preview deployment:
- Unique URL for each commit/branch
- Full production environment
- Perfect for testing and stakeholder review
- No manual deployment needed

```bash
# View all deployments
vercel ls

# Manual preview deployment (optional)
pnpm run deploy:preview
```

### Rollback Strategy

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url> --scope=<team>
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Test build locally
pnpm run build

# Check environment variables
vercel env ls
```

#### Environment Variable Issues
```bash
# Verify variables are set
vercel env ls production

# Pull latest variables
vercel env pull .env.local

# Check variable format (no quotes needed)
```

#### Function Timeouts
```bash
# Check function duration in vercel.json:
"functions": {
  "app/api/**/*.ts": {
    "maxDuration": 30
  }
}
```

#### Cron Job Failures
```bash
# Check cron logs
vercel logs --filter="cron"

# Verify CRON_SECRET is set
vercel env ls | grep CRON_SECRET

# Test cron endpoint manually
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/update-stock-prices
```

### Performance Issues

#### Slow Cold Starts
- Use Vercel Pro for faster cold starts
- Implement proper caching strategies
- Optimize bundle size

#### API Rate Limits
- Implement Redis caching
- Use API request batching
- Set up proper rate limiting

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] API keys tested and working
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Cron jobs configured
- [ ] Health checks working

### Post-Deployment
- [ ] Production URL accessible
- [ ] Health endpoint responding
- [ ] Cron jobs executing
- [ ] Error tracking working
- [ ] Performance monitoring active
- [ ] Custom domain working

### Security Review
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] CORS origins configured
- [ ] Security headers active
- [ ] Rate limiting in place

## 🎯 Best Practices

### Environment Management
- Use different secrets for each environment
- Rotate secrets regularly
- Never commit secrets to git
- Use Vercel's secret management

### Performance
- Optimize images with Next.js Image component
- Implement proper caching strategies
- Use edge functions for global performance
- Monitor Core Web Vitals

### Security
- Keep dependencies updated
- Use Vercel's security headers
- Implement proper authentication
- Monitor for vulnerabilities

### Monitoring
- Set up health checks
- Monitor function performance
- Track user analytics
- Set up error alerting

This comprehensive guide ensures your StockPulse application is properly deployed and monitored on Vercel with enterprise-grade reliability and performance.
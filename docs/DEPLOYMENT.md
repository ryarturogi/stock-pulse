# StockPulse Deployment Guide

This guide covers deploying StockPulse to various hosting platforms with proper environment variable
management.

## 🌍 Environment Overview

### Environment Files Structure

```
├── .env.example          # ✅ Template with example values (COMMIT)
├── .env.production       # ✅ Production template (COMMIT)
├── .env.staging          # ✅ Staging template (COMMIT)
├── .env                  # ❌ Local development secrets (DO NOT COMMIT)
├── .env.production.local # ❌ Actual production secrets (DO NOT COMMIT)
└── .env.staging.local    # ❌ Actual staging secrets (DO NOT COMMIT)
```

### Environment Variable Types

#### 🌐 **Public Variables** (`NEXT_PUBLIC_*`)

- Exposed to browser bundle
- Safe for client-side usage
- Examples: feature flags, app metadata, analytics IDs

#### 🔒 **Private Variables** (no prefix)

- Server-side only
- Never exposed to browser
- Examples: API keys, database URLs, secrets

## 🚀 Platform-Specific Deployment

### Vercel Deployment

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy with Environment Variables**

   ```bash
   # Production deployment
   vercel --prod

   # Set environment variables
   vercel env add FINNHUB_API_KEY production
   vercel env add JWT_SECRET production
   ```

3. **Vercel Dashboard Configuration**
   - Go to your project settings
   - Add environment variables from `.env.production`
   - Set appropriate environments (Production/Preview/Development)

### Netlify Deployment

1. **Build Settings**

   ```toml
   # netlify.toml
   [build]
     command = "pnpm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "20"
     PNPM_VERSION = "8"
   ```

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add variables from `.env.production`
   - Use scoped deployments for staging

### Railway Deployment

1. **Railway CLI Setup**

   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Environment Configuration**
   ```bash
   # Set production variables
   railway variables set FINNHUB_API_KEY=your_key_here
   railway variables set DATABASE_URL=your_db_url_here
   ```

### AWS (Lambda/Serverless)

1. **Serverless Framework Configuration**

   ```yaml
   # serverless.yml
   service: stockpulse

   provider:
     name: aws
     runtime: nodejs20.x
     environment:
       NODE_ENV: production
       FINNHUB_API_KEY: ${env:FINNHUB_API_KEY}
   ```

2. **Deploy with Secrets**
   ```bash
   export FINNHUB_API_KEY=your_key_here
   serverless deploy --stage production
   ```

### Docker Deployment

1. **Dockerfile Configuration**

   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Docker Compose with Secrets**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     stockpulse:
       build: .
       ports:
         - '3000:3000'
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production.local
   ```

## 🔐 Security Best Practices

### Secret Management

1. **Never Commit Secrets**

   ```bash
   # ❌ WRONG - commits secrets to git
   git add .env

   # ✅ CORRECT - only commit templates
   git add .env.example .env.production .env.staging
   ```

2. **Use Platform Secret Managers**

   ```bash
   # Vercel
   vercel env add SECRET_NAME production

   # Railway
   railway variables set SECRET_NAME=value

   # AWS Systems Manager
   aws ssm put-parameter --name "/stockpulse/prod/SECRET_NAME" --value "secret_value" --type "SecureString"
   ```

3. **Environment-Specific Secrets**
   ```bash
   # Different secrets per environment
   development: jwt_secret_dev_123
   staging:     jwt_secret_staging_456
   production:  jwt_secret_prod_789
   ```

### API Key Security

1. **Rotate Keys Regularly**
   - Set calendar reminders for quarterly rotation
   - Update all environments when rotating
   - Test after rotation

2. **Rate Limiting**

   ```typescript
   // Rate limit API calls to prevent abuse
   const rateLimiter = new RateLimiter({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   ```

3. **Monitor API Usage**
   - Set up alerts for unusual API usage
   - Monitor for API key leaks in logs
   - Use API key restrictions when available

## 📊 Environment Configuration

### Development (.env)

```bash
# Copy template and add your development keys
cp .env.example .env
# Edit .env with your development API keys
```

### Staging (.env.staging.local)

```bash
# Copy staging template and add real staging keys
cp .env.staging .env.staging.local
# Edit .env.staging.local with your staging API keys
```

### Production (.env.production.local)

```bash
# Copy production template and add real production keys
cp .env.production .env.production.local
# Edit .env.production.local with your production API keys
```

## 🚨 Emergency Procedures

### API Key Compromise

1. **Immediate Actions**

   ```bash
   # 1. Revoke compromised key immediately
   # 2. Generate new key
   # 3. Update all environments
   # 4. Deploy immediately
   # 5. Monitor for abuse
   ```

2. **Incident Response**
   - Document the incident
   - Review access logs
   - Audit other secrets
   - Update security procedures

### Database Breach

1. **Immediate Response**
   ```bash
   # 1. Change database passwords
   # 2. Update connection strings
   # 3. Review database access logs
   # 4. Audit user data
   # 5. Notify users if required
   ```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] API keys tested and working
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] CDN configured
- [ ] Monitoring tools setup
- [ ] Backup systems verified

### Post-Deployment

- [ ] Health checks passing
- [ ] Error tracking working
- [ ] Performance monitoring active
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] Push notifications working
- [ ] PWA functionality tested

### Monitoring Setup

1. **Error Tracking**

   ```typescript
   // Sentry configuration
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

2. **Performance Monitoring**

   ```typescript
   // New Relic or DataDog setup
   const performanceMonitoring = {
     apiKey: process.env.MONITORING_API_KEY,
     environment: process.env.NODE_ENV,
   };
   ```

3. **Uptime Monitoring**
   - Configure health check endpoints
   - Set up alerting for downtime
   - Monitor API response times

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm run test

      - name: Build application
        run: pnpm run build
        env:
          NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}

      - name: Deploy to production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel --prod --token $VERCEL_TOKEN
```

This comprehensive deployment guide ensures secure, scalable deployment across multiple platforms
while maintaining proper secret management.

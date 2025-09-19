#!/bin/bash

# =============================================================================
# Vercel Deployment Script for StockPulse
# =============================================================================
# This script handles the complete deployment process to Vercel
# Usage: ./scripts/deploy-vercel.sh [production|preview]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to preview deployment
DEPLOYMENT_TYPE="${1:-preview}"

echo -e "${BLUE}🚀 Starting StockPulse deployment to Vercel...${NC}"
echo -e "${BLUE}📦 Deployment type: ${DEPLOYMENT_TYPE}${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g vercel${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Make sure you're in the project root.${NC}"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Vercel...${NC}"
    vercel login
fi

# Pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if environment variables are set
echo -e "${BLUE}📋 Checking environment variables...${NC}"
if [ "$DEPLOYMENT_TYPE" = "production" ]; then
    # Check production environment variables
    if ! vercel env ls production | grep -q "FINNHUB_API_KEY"; then
        echo -e "${YELLOW}⚠️  Production environment variables may not be set${NC}"
        echo -e "${YELLOW}💡 Set them with: vercel env add FINNHUB_API_KEY production${NC}"
    fi
fi

# Run linting
echo -e "${BLUE}🔧 Running linter...${NC}"
if ! pnpm run lint; then
    echo -e "${RED}❌ Linting failed. Please fix errors before deploying.${NC}"
    exit 1
fi

# Run type checking
echo -e "${BLUE}🔍 Running type check...${NC}"
if ! pnpm run type-check; then
    echo -e "${RED}❌ Type checking failed. Please fix errors before deploying.${NC}"
    exit 1
fi

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
if ! pnpm run test; then
    echo -e "${RED}❌ Tests failed. Please fix failing tests before deploying.${NC}"
    exit 1
fi

# Build the application
echo -e "${BLUE}🏗️  Building application...${NC}"
if ! pnpm run build; then
    echo -e "${RED}❌ Build failed. Please fix build errors before deploying.${NC}"
    exit 1
fi

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
if [ "$DEPLOYMENT_TYPE" = "production" ]; then
    echo -e "${YELLOW}⚠️  Deploying to PRODUCTION${NC}"
    echo -e "${YELLOW}📝 This will update the live site at your production domain${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚫 Deployment cancelled${NC}"
        exit 0
    fi
    
    # Production deployment
    if vercel --prod --yes; then
        echo -e "${GREEN}✅ Production deployment successful!${NC}"
        echo -e "${GREEN}🌐 Your app is live at your production domain${NC}"
    else
        echo -e "${RED}❌ Production deployment failed${NC}"
        exit 1
    fi
else
    # Preview deployment
    if DEPLOYMENT_URL=$(vercel --yes 2>&1 | grep -o 'https://[^[:space:]]*\.vercel\.app'); then
        echo -e "${GREEN}✅ Preview deployment successful!${NC}"
        echo -e "${GREEN}🌐 Preview URL: ${DEPLOYMENT_URL}${NC}"
        
        # Copy URL to clipboard if available
        if command -v pbcopy &> /dev/null; then
            echo "$DEPLOYMENT_URL" | pbcopy
            echo -e "${GREEN}📋 URL copied to clipboard${NC}"
        elif command -v xclip &> /dev/null; then
            echo "$DEPLOYMENT_URL" | xclip -selection clipboard
            echo -e "${GREEN}📋 URL copied to clipboard${NC}"
        fi
    else
        echo -e "${RED}❌ Preview deployment failed${NC}"
        exit 1
    fi
fi

# Post-deployment checks
echo -e "${BLUE}🔍 Running post-deployment checks...${NC}"

# Wait a moment for deployment to be ready
sleep 5

# Check health endpoint (adjust URL based on deployment type)
if [ "$DEPLOYMENT_TYPE" = "production" ]; then
    HEALTH_URL="https://your-production-domain.com/api/health"
else
    HEALTH_URL="${DEPLOYMENT_URL}/api/health"
fi

echo -e "${BLUE}🏥 Checking health endpoint: ${HEALTH_URL}${NC}"
if curl -sf "$HEALTH_URL" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed or endpoint not ready yet${NC}"
fi

# Success message
echo -e "${GREEN}🎉 StockPulse deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Deployment Summary:${NC}"
echo -e "${GREEN}  • Type: ${DEPLOYMENT_TYPE}${NC}"
echo -e "${GREEN}  • Next.js: $(cat package.json | grep '"next"' | cut -d'"' -f4)${NC}"
echo -e "${GREEN}  • React: $(cat package.json | grep '"react"' | cut -d'"' -f4)${NC}"
if [ "$DEPLOYMENT_TYPE" = "preview" ]; then
    echo -e "${GREEN}  • URL: ${DEPLOYMENT_URL}${NC}"
fi

echo -e "${BLUE}🔗 Useful commands:${NC}"
echo -e "${BLUE}  • View deployments: vercel ls${NC}"
echo -e "${BLUE}  • View logs: vercel logs${NC}"
echo -e "${BLUE}  • View domains: vercel domains${NC}"
echo -e "${BLUE}  • Environment variables: vercel env${NC}"

echo -e "${GREEN}✨ Happy deploying!${NC}"
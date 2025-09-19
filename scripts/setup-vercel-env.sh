#!/bin/bash

# =============================================================================
# Vercel Environment Variables Setup Script
# =============================================================================
# This script helps set up environment variables in Vercel for all environments
# Usage: ./scripts/setup-vercel-env.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up Vercel environment variables for StockPulse...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo -e "${YELLOW}💡 Install with: npm install -g vercel${NC}"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Vercel...${NC}"
    vercel login
fi

echo -e "${BLUE}📝 This script will help you set up environment variables for:${NC}"
echo -e "${BLUE}  • Development environment${NC}"
echo -e "${BLUE}  • Preview environment${NC}"
echo -e "${BLUE}  • Production environment${NC}"
echo ""

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local environment=$2
    local description=$3
    local is_secret=$4
    
    echo -e "${BLUE}Setting ${var_name} for ${environment}...${NC}"
    echo -e "${YELLOW}${description}${NC}"
    
    if [ "$is_secret" = "true" ]; then
        echo -e "${RED}⚠️  This is a secret value. It will not be displayed.${NC}"
        read -s -p "Enter value for ${var_name}: " var_value
        echo ""
    else
        read -p "Enter value for ${var_name}: " var_value
    fi
    
    if [ -n "$var_value" ]; then
        echo "$var_value" | vercel env add "$var_name" "$environment"
        echo -e "${GREEN}✅ ${var_name} set for ${environment}${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping ${var_name} (empty value)${NC}"
    fi
    echo ""
}

# Set up each environment
setup_environment() {
    local env=$1
    echo -e "${BLUE}🌍 Setting up ${env} environment...${NC}"
    echo ""
    
    # Stock API Keys (Private)
    set_env_var "FINNHUB_API_KEY" "$env" "Your Finnhub API key from https://finnhub.io/" true
    set_env_var "ALPHA_VANTAGE_API_KEY" "$env" "Your Alpha Vantage API key from https://www.alphavantage.co/" true
    
    # Application Configuration (Private)
    set_env_var "API_BASE_URL" "$env" "Your API base URL (e.g., https://api.stockpulse.com)" false
    set_env_var "INTERNAL_API_SECRET" "$env" "A secret for internal API authentication" true
    
    # Security Settings (Private)
    set_env_var "JWT_SECRET" "$env" "A strong JWT secret (minimum 32 characters)" true
    set_env_var "ENCRYPTION_KEY" "$env" "A strong encryption key (minimum 32 characters)" true
    set_env_var "COOKIE_SECRET" "$env" "A secret for cookie signing" true
    
    # CORS Configuration (Private)
    if [ "$env" = "production" ]; then
        set_env_var "CORS_ORIGIN" "$env" "Production CORS origins (e.g., https://stockpulse.com,https://www.stockpulse.com)" false
    else
        set_env_var "CORS_ORIGIN" "$env" "CORS origins for $env (e.g., https://$env.stockpulse.com)" false
    fi
    
    # Push Notifications (Private)
    set_env_var "VAPID_PRIVATE_KEY" "$env" "VAPID private key for push notifications" true
    
    # Database (Private) - if using
    read -p "Do you want to set up database configuration? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        set_env_var "DATABASE_URL" "$env" "Database connection URL" true
        set_env_var "REDIS_URL" "$env" "Redis connection URL (optional)" false
    fi
    
    # Email Configuration (Private) - if using
    read -p "Do you want to set up email configuration? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        set_env_var "SMTP_HOST" "$env" "SMTP host (e.g., smtp.gmail.com)" false
        set_env_var "SMTP_PORT" "$env" "SMTP port (e.g., 587)" false
        set_env_var "SMTP_USER" "$env" "SMTP username" false
        set_env_var "SMTP_PASS" "$env" "SMTP password" true
        set_env_var "FROM_EMAIL" "$env" "From email address (e.g., noreply@stockpulse.com)" false
    fi
    
    # Monitoring (Private) - if using
    read -p "Do you want to set up monitoring configuration? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        set_env_var "SENTRY_AUTH_TOKEN" "$env" "Sentry auth token for error tracking" true
        set_env_var "DATADOG_API_KEY" "$env" "DataDog API key for monitoring" true
    fi
    
    # Cron Secret (Private)
    set_env_var "CRON_SECRET" "$env" "A secret for authenticating cron job requests" true
    
    echo -e "${GREEN}✅ ${env} environment setup complete!${NC}"
    echo ""
}

# Main setup flow
echo -e "${YELLOW}🚀 Let's set up your environment variables!${NC}"
echo ""

# Development Environment
read -p "Set up Development environment? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_environment "development"
fi

# Preview Environment
read -p "Set up Preview environment? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_environment "preview"
fi

# Production Environment
read -p "Set up Production environment? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}⚠️  You are setting up PRODUCTION environment variables${NC}"
    echo -e "${RED}🔒 Make sure to use strong, unique secrets for production${NC}"
    read -p "Continue with production setup? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_environment "production"
    fi
fi

echo -e "${GREEN}🎉 Environment variables setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}  1. Verify environment variables: vercel env ls${NC}"
echo -e "${BLUE}  2. Pull environment variables locally: vercel env pull .env.local${NC}"
echo -e "${BLUE}  3. Deploy your application: vercel --prod${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "${YELLOW}  • You can add more variables later with: vercel env add VAR_NAME environment${NC}"
echo -e "${YELLOW}  • You can edit variables in the Vercel dashboard${NC}"
echo -e "${YELLOW}  • Remember to rotate secrets regularly${NC}"
echo ""
echo -e "${GREEN}✨ Happy deploying!${NC}"
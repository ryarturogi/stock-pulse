# WebSocket Refactoring Documentation

## Overview

This document outlines the comprehensive refactoring of the WebSocket connection management system to address persistent rate limiting issues with the Finnhub API. The refactoring implements industry best practices and follows Finnhub's recommended patterns.

## Issues Addressed

### Previous Problems
1. **Rapid reconnection attempts** causing 429 rate limit errors
2. **Circuit breaker not working properly** - connections still attempted when open
3. **Insufficient rate limiting** - basic cooldowns not effective
4. **Poor connection state management** - multiple simultaneous connections
5. **Lack of proper subscription management** - over-subscription to symbols

### Root Causes
- No proper rate limiting algorithm (token bucket)
- Inadequate connection state management
- Missing subscription tracking
- Poor error handling and recovery
- Lack of proper resource cleanup

## Refactoring Components

### 1. Token Bucket Rate Limiter (`src/core/utils/rateLimiter.ts`)

**Purpose**: Implements a proper token bucket algorithm for rate limiting WebSocket connections.

**Key Features**:
- **Token Bucket Algorithm**: Allows burst connections up to capacity, then regulates flow
- **Configurable Parameters**: Different configs for development, production, and emergency
- **Time-based Refilling**: Tokens refill at a steady rate over time
- **Cooldown Management**: Tracks and enforces cooldown periods

**Configuration**:
```typescript
PRODUCTION: {
  capacity: 3,           // Allow burst of 3 connections
  refillRate: 0.1,       // 1 token every 10 seconds
  windowMs: 60000        // 1 minute window
}

DEVELOPMENT: {
  capacity: 5,           // Allow burst of 5 connections
  refillRate: 0.2,       // 1 token every 5 seconds
  windowMs: 30000        // 30 second window
}
```

### 2. WebSocket Connection Manager (`src/core/utils/websocketManager.ts`)

**Purpose**: Centralized WebSocket connection management with proper state handling.

**Key Features**:
- **State Machine**: Proper connection state management (disconnected, connecting, connected, reconnecting, error)
- **Subscription Management**: Track and manage symbol subscriptions
- **Automatic Reconnection**: Exponential backoff with configurable limits
- **Ping/Pong Handling**: Keep-alive mechanism to maintain connections
- **Message Routing**: Centralized message handling with multiple subscribers
- **Resource Cleanup**: Proper cleanup of timeouts and intervals

**Connection States**:
- `disconnected`: No active connection
- `connecting`: Attempting to connect
- `connected`: Successfully connected and operational
- `reconnecting`: Attempting to reconnect after failure
- `error`: Connection failed, in error state

### 3. Enhanced WebSocket Proxy (`app/api/websocket-proxy/route.ts`)

**Purpose**: Server-side WebSocket proxy with improved rate limiting and error handling.

**Improvements**:
- **Token Bucket Integration**: Uses the new rate limiter instead of simple counters
- **Better Error Responses**: JSON error responses with detailed information
- **Circuit Breaker Integration**: Works with the rate limiter for comprehensive protection
- **Proper Cleanup**: Enhanced cleanup logic to prevent resource leaks

### 4. Updated Stock Store (`src/features/stocks/stores/stockStore.ts`)

**Purpose**: Integration with the new WebSocket manager for better connection handling.

**Changes**:
- **WebSocket Manager Integration**: Uses the new connection manager
- **Enhanced Rate Limiting**: 30-second minimum intervals, 2-minute error cooldowns
- **Better State Management**: Proper tracking of connection attempts and states
- **Improved Error Handling**: Better error recovery and fallback mechanisms

## Best Practices Implemented

### 1. Rate Limiting Strategy
- **Token Bucket Algorithm**: Industry standard for burst handling
- **Environment-specific Configs**: Different limits for dev/prod
- **Global Rate Limiting**: Prevents system-wide overload
- **Per-connection Limits**: Individual connection management

### 2. Connection Management
- **State Machine Pattern**: Clear connection states and transitions
- **Exponential Backoff**: Progressive delays for reconnection attempts
- **Circuit Breaker**: Prevents cascading failures
- **Resource Cleanup**: Proper cleanup of timeouts and intervals

### 3. Subscription Management
- **Subscription Tracking**: Monitor active subscriptions
- **Automatic Resubscription**: Re-subscribe after reconnection
- **Over-subscription Prevention**: Avoid duplicate subscriptions
- **Symbol Management**: Proper add/remove of symbols

### 4. Error Handling
- **Graceful Degradation**: Fallback to API mode when WebSocket fails
- **Comprehensive Logging**: Detailed logging for debugging
- **User Feedback**: Clear error messages and status indicators
- **Recovery Mechanisms**: Automatic recovery with proper delays

## Configuration

### Rate Limiting Configuration
```typescript
// Production (Conservative)
{
  capacity: 3,           // Max 3 burst connections
  refillRate: 0.1,       // 1 token every 10 seconds
  windowMs: 60000        // 1 minute window
}

// Development (More Lenient)
{
  capacity: 5,           // Max 5 burst connections
  refillRate: 0.2,       // 1 token every 5 seconds
  windowMs: 30000        // 30 second window
}
```

### Connection Configuration
```typescript
{
  maxReconnectAttempts: 3,     // Max 3 reconnection attempts
  reconnectDelayMs: 30000,     // Start with 30s delay
  maxReconnectDelayMs: 300000, // Max 5 minute delay
  pingIntervalMs: 30000,       // Ping every 30 seconds
  pongTimeoutMs: 10000         // 10 second pong timeout
}
```

## Expected Behavior

### Connection Flow
1. **Rate Limit Check**: Token bucket allows/denies connection
2. **Connection Attempt**: WebSocket connection with timeout
3. **State Management**: Proper state transitions
4. **Subscription**: Subscribe to requested symbols
5. **Keep-alive**: Ping/pong mechanism
6. **Error Handling**: Graceful error recovery

### Rate Limiting Flow
1. **Token Check**: Check if tokens available
2. **Connection**: Consume token and attempt connection
3. **Success**: Reset rate limiter on success
4. **Failure**: Apply cooldown and circuit breaker
5. **Recovery**: Gradual recovery with exponential backoff

### Error Recovery
1. **Error Detection**: Detect connection errors
2. **State Update**: Update connection state
3. **Cooldown**: Apply appropriate cooldown
4. **Fallback**: Switch to API mode
5. **Recovery**: Attempt reconnection after cooldown

## Monitoring and Debugging

### Logging
- **Connection Events**: All connection state changes
- **Rate Limiting**: Token consumption and refilling
- **Subscription Events**: Symbol subscription/unsubscription
- **Error Details**: Comprehensive error information
- **Performance Metrics**: Connection timing and success rates

### Metrics to Monitor
- **Connection Success Rate**: Percentage of successful connections
- **Rate Limit Violations**: Frequency of rate limit hits
- **Reconnection Attempts**: Number of reconnection attempts
- **Subscription Count**: Number of active subscriptions
- **Error Frequency**: Rate of connection errors

## Testing

### Unit Tests
- **Rate Limiter Tests**: Token bucket algorithm validation
- **Connection Manager Tests**: State machine and subscription management
- **Error Handling Tests**: Error recovery and fallback mechanisms

### Integration Tests
- **WebSocket Proxy Tests**: End-to-end connection testing
- **Rate Limiting Tests**: Rate limit enforcement validation
- **Subscription Tests**: Symbol subscription management

### Load Tests
- **Connection Load**: Multiple simultaneous connections
- **Rate Limit Load**: Rate limit enforcement under load
- **Subscription Load**: Large number of symbol subscriptions

## Migration Guide

### Breaking Changes
- **WebSocket Manager**: New connection management interface
- **Rate Limiting**: New rate limiting configuration
- **Error Handling**: Updated error response format
- **State Management**: Enhanced connection state tracking

### Migration Steps
1. **Update Imports**: Import new utilities
2. **Configuration**: Update rate limiting configuration
3. **Error Handling**: Update error handling code
4. **Testing**: Update tests for new interfaces
5. **Monitoring**: Update monitoring and logging

## Future Improvements

### Planned Enhancements
1. **Metrics Dashboard**: Real-time connection metrics
2. **Dynamic Rate Limiting**: Adjust limits based on API response
3. **Connection Pooling**: Multiple connection management
4. **Health Checks**: Automated connection health monitoring
5. **Performance Optimization**: Further performance improvements

### Monitoring Enhancements
1. **Real-time Metrics**: Live connection statistics
2. **Alerting**: Automated alerts for connection issues
3. **Performance Tracking**: Connection performance metrics
4. **Error Analysis**: Detailed error analysis and reporting

## Conclusion

This refactoring addresses the persistent WebSocket connection issues by implementing industry best practices and proper rate limiting algorithms. The new system provides:

- **Reliable Connections**: Proper state management and error recovery
- **Rate Limit Compliance**: Token bucket algorithm for burst handling
- **Better Performance**: Optimized connection management
- **Enhanced Monitoring**: Comprehensive logging and metrics
- **Maintainable Code**: Clean architecture and proper separation of concerns

The system now follows Finnhub's recommended patterns and should provide stable, reliable WebSocket connections without rate limiting issues.

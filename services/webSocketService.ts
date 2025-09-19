/**
 * WebSocket Service for Real-time Stock Data
 * ==========================================
 * 
 * Enhanced WebSocket service for managing real-time stock data connections
 * following the React Developer test requirements with Finnhub integration.
 */

import type {
  WebSocketStatus,
  WebSocketMessage,
  FinnhubStockQuote
} from '@/types';
import { 
  WEBSOCKET_CONFIG,
  isTradeData
} from '@/types';

/**
 * WebSocket service class for managing real-time stock data
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private connection: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private subscribedSymbols: Set<string> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS;
  private reconnectInterval: number = WEBSOCKET_CONFIG.RECONNECT_INTERVAL;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private statusHandlers: Map<string, (status: WebSocketStatus) => void> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket
   */
  public async connect(): Promise<void> {
    if (this.connection?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.setStatus('connecting');

    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!apiKey) {
        throw new Error('Finnhub API key not configured');
      }

      const wsUrl = `wss://ws.finnhub.io?token=${apiKey}`;
      this.connection = new WebSocket(wsUrl);

      this.connection.onopen = this.handleOpen.bind(this);
      this.connection.onmessage = this.handleMessage.bind(this);
      this.connection.onclose = this.handleClose.bind(this);
      this.connection.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to stock symbol
   */
  public subscribe(symbol: string): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe to', symbol);
      return;
    }

    if (this.subscribedSymbols.has(symbol)) {
      console.log('Already subscribed to', symbol);
      return;
    }

    if (this.subscribedSymbols.size >= WEBSOCKET_CONFIG.SUBSCRIPTION_LIMIT) {
      console.warn('Maximum subscription limit reached');
      return;
    }

    const message: WebSocketMessage = {
      type: 'subscribe',
      symbol: symbol.toUpperCase(),
    };

    this.connection.send(JSON.stringify(message));
    this.subscribedSymbols.add(symbol.toUpperCase());
    
    console.log('Subscribed to', symbol);
  }

  /**
   * Unsubscribe from stock symbol
   */
  public unsubscribe(symbol: string): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot unsubscribe from', symbol);
      return;
    }

    if (!this.subscribedSymbols.has(symbol)) {
      console.log('Not subscribed to', symbol);
      return;
    }

    const message: WebSocketMessage = {
      type: 'unsubscribe',
      symbol: symbol.toUpperCase(),
    };

    this.connection.send(JSON.stringify(message));
    this.subscribedSymbols.delete(symbol.toUpperCase());
    
    console.log('Unsubscribed from', symbol);
  }

  /**
   * Get current connection status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Get subscribed symbols
   */
  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  /**
   * Add message handler
   */
  public onMessage(handlerId: string, handler: (data: any) => void): void {
    this.messageHandlers.set(handlerId, handler);
  }

  /**
   * Remove message handler
   */
  public offMessage(handlerId: string): void {
    this.messageHandlers.delete(handlerId);
  }

  /**
   * Add status change handler
   */
  public onStatusChange(handlerId: string, handler: (status: WebSocketStatus) => void): void {
    this.statusHandlers.set(handlerId, handler);
  }

  /**
   * Remove status change handler
   */
  public offStatusChange(handlerId: string): void {
    this.statusHandlers.delete(handlerId);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected to Finnhub');
    this.setStatus('connected');
    this.reconnectAttempts = 0;

    // Start ping interval
    this.startPingInterval();

    // Re-subscribe to all symbols
    this.subscribedSymbols.forEach(symbol => {
      this.subscribe(symbol);
    });
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      switch (data.type) {
        case 'trade':
          this.handleTradeMessage(data);
          break;
        case 'ping':
          this.handlePingMessage();
          break;
        case 'pong':
          // Pong received, connection is alive
          break;
        default:
          console.log('Unknown message type:', data.type);
      }

      // Notify all message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });

    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.setStatus('disconnected');
    this.connection = null;

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Attempt to reconnect if we have subscriptions
    if (this.subscribedSymbols.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.setStatus('error');
  }

  /**
   * Handle trade message
   */
  private handleTradeMessage(data: any): void {
    if (!data.data || !Array.isArray(data.data)) {
      return;
    }

    data.data.forEach((trade: any) => {
      if (isTradeData(trade)) {
        // Convert trade data to stock quote format
        const quote: FinnhubStockQuote = {
          symbol: trade.s,
          current: trade.p,
          change: 0, // Will be calculated by the store
          percentChange: 0, // Will be calculated by the store
          high: 0, // Not available in trade data
          low: 0, // Not available in trade data
          open: 0, // Not available in trade data
          previousClose: 0, // Not available in trade data
          timestamp: trade.t,
        };

        // Notify handlers with the quote
        this.messageHandlers.forEach(handler => {
          try {
            handler({ type: 'quote', data: quote });
          } catch (error) {
            console.error('Error in trade message handler:', error);
          }
        });
      }
    });
  }

  /**
   * Handle ping message
   */
  private handlePingMessage(): void {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({ type: 'pong' }));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify({ type: 'ping' }));
      }
    }, WEBSOCKET_CONFIG.PING_INTERVAL);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.setStatus('error');
        }
      });
    }, this.reconnectInterval);
  }

  /**
   * Set connection status and notify handlers
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    
    // Notify all status handlers
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.statusHandlers.clear();
    this.subscribedSymbols.clear();
  }
}

/**
 * Export singleton instance
 */
// Lazy-loaded service to prevent SSR issues
export const getWebSocketService = () => WebSocketService.getInstance();


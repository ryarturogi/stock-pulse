'use client';

import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Moon, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Plus 
} from 'lucide-react';

const availableStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' }
];

interface WatchedStock {
  symbol: string;
  name: string;
  alertPrice: number;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  isLoading?: boolean;
}

export default function HomePage() {
  const [selectedStock, setSelectedStock] = useState('');
  const [priceAlert, setPriceAlert] = useState('');
  const [watchedStocks, setWatchedStocks] = useState<WatchedStock[]>([]);

  const handleAddStock = () => {
    if (selectedStock && priceAlert) {
      const stock = availableStocks.find(s => s.symbol === selectedStock);
      if (stock && !watchedStocks.find(w => w.symbol === selectedStock)) {
        const newStock: WatchedStock = {
          symbol: stock.symbol,
          name: stock.name,
          alertPrice: parseFloat(priceAlert),
          isLoading: true
        };
        setWatchedStocks([...watchedStocks, newStock]);
        setSelectedStock('');
        setPriceAlert('');
        
        // TODO: Fetch initial stock data from Finnhub API
        fetchStockData(stock.symbol);
      }
    }
  };

  const fetchStockData = async (symbol: string) => {
    try {
      const response = await fetch(`/api/quote?symbol=${symbol}`);
      const data = await response.json();
      
      if (data.error) {
        console.error(`Error fetching data for ${symbol}:`, data.error);
        return;
      }
      
      // Update the stock with real data
      setWatchedStocks(prev => prev.map(stock => 
        stock.symbol === symbol 
          ? {
              ...stock,
              currentPrice: data.current,
              change: data.change,
              changePercent: data.percentChange,
              isLoading: false
            }
          : stock
      ));
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      // Mark as failed to load
      setWatchedStocks(prev => prev.map(stock => 
        stock.symbol === symbol 
          ? { ...stock, isLoading: false }
          : stock
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar - Stock Form */}
        <div className="w-80 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <span className="font-semibold text-lg">Stock Tracker</span>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Add Stock to Watch</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Stock
                  </label>
                  <select
                    value={selectedStock}
                    onChange={(e) => setSelectedStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a stock...</option>
                    {availableStocks.map((stock) => (
                      <option key={stock.symbol} value={stock.symbol}>
                        {stock.symbol} - {stock.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Alert ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter alert price"
                    value={priceAlert}
                    onChange={(e) => setPriceAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddStock}
                  disabled={!selectedStock || !priceAlert}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Watchlist</span>
                </button>
              </div>

              {watchedStocks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">My Watchlist</h3>
                  <div className="space-y-2">
                    {watchedStocks.map((stock) => (
                      <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            stock.symbol === 'AAPL' ? 'bg-gray-800' : 
                            stock.symbol === 'GOOGL' ? 'bg-blue-600' :
                            stock.symbol === 'MSFT' ? 'bg-green-600' :
                            stock.symbol === 'AMZN' ? 'bg-orange-500' :
                            stock.symbol === 'TSLA' ? 'bg-red-600' : 'bg-purple-600'
                          }`}>
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stock.symbol}</p>
                            <p className="text-xs text-gray-500">Alert: ${stock.alertPrice}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Menu className="text-gray-500 w-5 h-5" />
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search or type command..." 
                    className="w-96 pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">⌘ K</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Moon className="text-gray-500 w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-6">
            {/* Top Stock Cards */}
            {watchedStocks.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm text-center mb-8">
                <TrendingUp className="text-gray-400 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No stocks being watched</h3>
                <p className="text-gray-500">Add a stock from the sidebar to get started with real-time tracking</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {watchedStocks.map((stock) => {
                  const isAboveAlert = stock.currentPrice && stock.currentPrice >= stock.alertPrice;
                  const isBelowAlert = stock.currentPrice && stock.currentPrice < stock.alertPrice;
                  
                  return (
                    <div 
                      key={stock.symbol} 
                      className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${
                        stock.isLoading ? 'border-gray-300' :
                        isAboveAlert ? 'border-green-500' :
                        isBelowAlert ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            stock.symbol === 'AAPL' ? 'bg-gray-800' : 
                            stock.symbol === 'GOOGL' ? 'bg-blue-600' :
                            stock.symbol === 'MSFT' ? 'bg-green-600' :
                            stock.symbol === 'AMZN' ? 'bg-orange-500' :
                            stock.symbol === 'TSLA' ? 'bg-red-600' : 'bg-purple-600'
                          }`}>
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{stock.symbol}</p>
                            <p className="text-sm text-gray-500">{stock.name.split(' ')[0]}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold">
                          {stock.isLoading ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : stock.currentPrice ? (
                            `$${stock.currentPrice.toFixed(2)}`
                          ) : (
                            <span className="text-gray-400">---.--</span>
                          )}
                        </p>
                        <p className={`text-sm flex items-center ${
                          stock.changePercent === undefined ? 'text-gray-500' :
                          stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.changePercent !== undefined ? (
                            <>
                              <span className="mr-1">{stock.changePercent >= 0 ? '▲' : '▼'}</span>
                              {Math.abs(stock.changePercent).toFixed(2)}%
                            </>
                          ) : (
                            '--.--%'
                          )}
                        </p>
                        <div className="text-xs">
                          <span className="text-gray-500">Alert: ${stock.alertPrice}</span>
                          {stock.currentPrice && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              isAboveAlert ? 'bg-green-100 text-green-800' :
                              isBelowAlert ? 'bg-red-100 text-red-800' : ''
                            }`}>
                              {isAboveAlert ? 'Above Alert' : isBelowAlert ? 'Below Alert' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Portfolio Performance Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Portfolio Performance</h3>
                <div className="flex space-x-4">
                  <button className="text-blue-600 border-b-2 border-blue-600 pb-1">Real-time</button>
                  <button className="text-gray-500">Daily</button>
                  <button className="text-gray-500">Weekly</button>
                </div>
              </div>
              
              {watchedStocks.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Add stocks to your watchlist to see the price chart</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-6">
                    Live price tracking for: {watchedStocks.map(s => s.symbol).join(', ')}
                  </p>
                  
                  <div className="h-64 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>Real-time chart will appear here</p>
                      <p className="text-sm mt-2">Connecting to WebSocket...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
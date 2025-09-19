import React from 'react';

/**
 * Home page component for StockPulse application
 * 
 * This is a placeholder component that will be replaced with
 * actual stock tracking functionality
 */
export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 mb-6'>
            Welcome to StockPulse
          </h1>
          
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            Your enterprise-grade stock market tracking application.
            Real-time data, portfolio management, and market insights.
          </p>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mt-12'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='text-3xl mb-4'>📈</div>
              <h3 className='text-lg font-semibold mb-2'>Real-time Tracking</h3>
              <p className='text-gray-600'>
                Monitor stock prices and market movements in real-time
              </p>
            </div>
            
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='text-3xl mb-4'>💼</div>
              <h3 className='text-lg font-semibold mb-2'>Portfolio Management</h3>
              <p className='text-gray-600'>
                Manage your investment portfolio with advanced analytics
              </p>
            </div>
            
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='text-3xl mb-4'>🔔</div>
              <h3 className='text-lg font-semibold mb-2'>Smart Alerts</h3>
              <p className='text-gray-600'>
                Get notified about important market events and price changes
              </p>
            </div>
          </div>
          
          <div className='mt-12'>
            <button className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors'>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
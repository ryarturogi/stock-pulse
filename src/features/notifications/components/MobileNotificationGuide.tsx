/**
 * Mobile Notification Guide Component
 * ==================================
 *
 * Provides guidance for mobile users on how to enable push notifications
 * with device-specific instructions for iOS and Android.
 */

'use client';

import { useState, useEffect } from 'react';

import type { ComponentProps } from '@/core/types';

type MobileNotificationGuideProps = ComponentProps<{
  onClose?: () => void;
  showTestButton?: boolean;
}>;

/**
 * Mobile notification guide with device-specific instructions
 */
export function MobileNotificationGuide({
  className = '',
  onClose,
  showTestButton = true,
}: MobileNotificationGuideProps) {
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isStandalone: boolean;
    browserType: string;
  }>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    browserType: 'unknown',
  });

  useEffect(() => {
    // Detect device and browser information
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
    const isIOS =
      /iphone|ipad|ipod/i.test(userAgent) &&
      /safari/i.test(userAgent) &&
      !/chrome/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent) && /chrome/i.test(userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    let browserType = 'unknown';
    if (isIOS) browserType = 'iOS Safari';
    else if (isAndroid) browserType = 'Android Chrome';
    else if (/chrome/i.test(userAgent)) browserType = 'Chrome';
    else if (/firefox/i.test(userAgent)) browserType = 'Firefox';
    else if (/safari/i.test(userAgent)) browserType = 'Safari';

    setDeviceInfo({
      isMobile,
      isIOS,
      isAndroid,
      isStandalone,
      browserType,
    });
  }, []);

  const handleTestNotification = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('StockPulse Test', {
          body: 'Mobile push notifications are working! 📱',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          tag: 'test-notification',
          requireInteraction: true,
        });
      } else {
        alert('Push notifications are not supported on this device.');
      }
    } catch (error) {
      console.error('Failed to show test notification:', error);
      alert(
        'Failed to show test notification. Please check your browser settings.'
      );
    }
  };

  const getInstructions = () => {
    if (deviceInfo.isIOS) {
      return {
        title: 'iOS Safari Push Notifications',
        steps: [
          'Add StockPulse to your Home Screen (tap Share → Add to Home Screen)',
          'Open StockPulse from your Home Screen (not Safari)',
          'Tap "Allow" when prompted for notification permissions',
          'If notifications are blocked, go to Settings → Notifications → StockPulse → Allow Notifications',
        ],
        note: 'iOS 16.4+ required. Must be installed as PWA (Home Screen app).',
      };
    } else if (deviceInfo.isAndroid) {
      return {
        title: 'Android Chrome Push Notifications',
        steps: [
          'Tap "Allow" when prompted for notification permissions',
          'If blocked, tap the lock icon in the address bar → Notifications → Allow',
          'Go to Chrome Settings → Site Settings → Notifications → Allow',
          'Ensure StockPulse is not in battery optimization (Settings → Apps → StockPulse → Battery)',
        ],
        note: 'Android 5.0+ required. Chrome browser recommended.',
      };
    } else {
      return {
        title: 'Desktop Push Notifications',
        steps: [
          'Click "Allow" when prompted for notification permissions',
          'If blocked, click the notification icon in the address bar → Allow',
          'Check browser settings to ensure notifications are enabled for this site',
        ],
        note: 'Most modern browsers support push notifications.',
      };
    }
  };

  const instructions = getInstructions();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
    >
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          📱 Mobile Notifications
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            aria-label='Close'
          >
            ✕
          </button>
        )}
      </div>

      <div className='mb-4'>
        <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
          {instructions.title}
        </h4>
        <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
          {instructions.note}
        </p>

        <div className='space-y-2'>
          {instructions.steps.map((step, index) => (
            <div key={index} className='flex items-start'>
              <span className='flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5'>
                {index + 1}
              </span>
              <p className='text-sm text-gray-700 dark:text-gray-300'>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
        <div className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
          <strong>Device Info:</strong> {deviceInfo.browserType}
          {deviceInfo.isMobile && ' (Mobile)'}
          {deviceInfo.isStandalone && ' (PWA Mode)'}
        </div>

        {showTestButton && (
          <button
            onClick={handleTestNotification}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors'
          >
            Test Notification
          </button>
        )}
      </div>
    </div>
  );
}

export default MobileNotificationGuide;

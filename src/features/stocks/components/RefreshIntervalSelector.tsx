/**
 * Refresh Interval Selector Component
 * ===================================
 *
 * Component for selecting the refresh interval for live data updates.
 * Allows users to choose between different refresh rates.
 */

'use client';

import { Clock } from 'lucide-react';
import React from 'react';

import { RefreshInterval, REFRESH_INTERVALS } from '@/core/types';

export interface RefreshIntervalSelectorProps {
  currentInterval: RefreshInterval;
  onIntervalChange: (interval: RefreshInterval) => void;
  className?: string;
}

/**
 * Refresh Interval Selector Component
 *
 * Displays a dropdown to select the refresh interval for live data updates.
 * Shows the current interval and allows changing it.
 */
export const RefreshIntervalSelector: React.FC<RefreshIntervalSelectorProps> = ({
  currentInterval,
  onIntervalChange,
  className = '',
}) => {
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = e.target.value as RefreshInterval;
    onIntervalChange(newInterval);
  };

  const currentConfig = REFRESH_INTERVALS.find(config => config.value === currentInterval);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <label htmlFor="refresh-interval" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Refresh:
      </label>
      <select
        id="refresh-interval"
        value={currentInterval}
        onChange={handleIntervalChange}
        className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
      >
        {REFRESH_INTERVALS.map(config => (
          <option key={config.value} value={config.value}>
            {config.label}
          </option>
        ))}
      </select>
      {currentConfig && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({currentConfig.label})
        </span>
      )}
    </div>
  );
};

export default RefreshIntervalSelector;

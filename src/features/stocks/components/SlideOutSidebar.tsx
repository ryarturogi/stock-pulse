/**
 * Slide Out Sidebar Component
 * ==========================
 *
 * Responsive sidebar that slides out on mobile/tablet and is fixed on desktop.
 * Includes overlay and smooth animations.
 */

'use client';

import React, { useEffect } from 'react';

import { X } from 'lucide-react';

interface SlideOutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  'data-tour'?: string;
}

/**
 * Slide Out Sidebar Component
 *
 * Provides a responsive sidebar that:
 * - Slides out from the left on mobile/tablet
 * - Is fixed on desktop (lg breakpoint and up)
 * - Includes overlay and smooth animations
 * - Handles escape key and click outside to close
 */
export const SlideOutSidebar: React.FC<SlideOutSidebarProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  ...props
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay - only visible on mobile/tablet */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={onClose}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          role='button'
          tabIndex={0}
          aria-label='Close sidebar'
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative lg:translate-x-0
          top-0 left-0 h-full w-80 max-w-[85vw]
          bg-white dark:bg-gray-800 shadow-xl lg:shadow-sm
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
        {...props}
      >
        {/* Close button - only visible on mobile/tablet */}
        <div className='flex justify-end p-4 lg:hidden'>
          <button
            onClick={onClose}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            aria-label='Close sidebar'
            data-tour='close-sidebar'
          >
            <X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
          </button>
        </div>

        {/* Sidebar content */}
        <div className='h-full overflow-y-auto'>{children}</div>
      </div>
    </>
  );
};

export default SlideOutSidebar;

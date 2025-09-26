'use client';

import { useEffect, useRef } from 'react';

export interface TourStep {
  element: string;
  intro: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left-aligned' | 'bottom-middle-aligned' | 'bottom-right-aligned';
  highlightClass?: string;
  tooltipClass?: string;
}

export const useTour = () => {
  const tourRef = useRef<any>(null);

  useEffect(() => {
    // CSS is already imported in layout.tsx
    
    return () => {
      if (tourRef.current) {
        tourRef.current.exit();
      }
    };
  }, []);

  const startTour = async (steps?: TourStep[]) => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.warn('Tour cannot start on server side');
      return;
    }

    if (tourRef.current) {
      tourRef.current.exit();
    }

    try {
      // Dynamically import intro.js only on client side to avoid SSR issues
      const { default: introJs } = await import('intro.js');
      
      // Prevent intro.js from loading CSS files dynamically since we import them in layout
      if (typeof window !== 'undefined') {
        // Override the CSS loading to prevent MIME type errors
        const originalLoadCSS = (window as any).introJs?.loadCSS;
        if (originalLoadCSS) {
          (window as any).introJs.loadCSS = () => {}; // Disable CSS loading
        }
      }

      if (steps && steps.length > 0) {
        // Configure steps programmatically if provided
        // Check if we're on mobile/tablet for responsive options
        const isMobileOrTablet = window.innerWidth < 1024;
        
        tourRef.current = introJs().setOptions({
          steps: steps.map((step) => ({
            element: step.element,
            intro: step.intro,
            title: step.title || '',
            position: step.position || 'bottom',
            highlightClass: step.highlightClass || '',
            tooltipClass: step.tooltipClass || '',
          })),
          showProgress: true,
          showBullets: false,
          exitOnOverlayClick: false,
          exitOnEsc: true,
          nextLabel: 'Next →',
          prevLabel: '← Back',
          skipLabel: '✕',
          doneLabel: 'Done!',
          hidePrev: false,
          hideNext: false,
          stepNumbersOfLabel: 'of',
          disableInteraction: true,
          scrollToElement: true,
          scrollPadding: isMobileOrTablet ? 60 : 30, // More padding on mobile
          overlayOpacity: isMobileOrTablet ? 0.3 : 0.5, // Less overlay opacity on mobile
          autoPosition: true, // Enable auto positioning for mobile
          positionPrecedence: isMobileOrTablet 
            ? ['bottom', 'top', 'left', 'right'] // Prefer vertical positions on mobile
            : ['bottom', 'top', 'right', 'left'], // Default desktop precedence
        });
      } else {
        // Use data attributes from DOM elements
        const isMobileOrTablet = window.innerWidth < 1024;
        
        tourRef.current = introJs().setOptions({
          showProgress: true,
          showBullets: false,
          exitOnOverlayClick: false,
          exitOnEsc: true,
          nextLabel: 'Next →',
          prevLabel: '← Back',
          skipLabel: '✕',
          doneLabel: 'Done!',
          hidePrev: false,
          hideNext: false,
          stepNumbersOfLabel: 'of',
          disableInteraction: true,
          scrollToElement: true,
          scrollPadding: isMobileOrTablet ? 60 : 30, // More padding on mobile
          overlayOpacity: isMobileOrTablet ? 0.3 : 0.5, // Less overlay opacity on mobile
          autoPosition: true, // Enable auto positioning for mobile
          positionPrecedence: isMobileOrTablet 
            ? ['bottom', 'top', 'left', 'right'] // Prefer vertical positions on mobile
            : ['bottom', 'top', 'right', 'left'], // Default desktop precedence
        });
      }

      // Add event listeners
      tourRef.current.onbeforechange((targetElement: any) => {
        // Check if we're on mobile/tablet (matches responsive hook logic)
        // Mobile/tablet both use mobile tour since they both hide desktop sidebar
        const isMobileOrTablet = window.innerWidth < 1024;
        const isVerySmallScreen = window.innerWidth <= 375;
        
        if (targetElement) {
          const step = targetElement.getAttribute('data-step');
          const overlay = document.querySelector('.introjs-overlay');
          
          if (isMobileOrTablet) {
            // Mobile tour logic - only target mobile-visible elements
            const isMobileMenuStep = targetElement.closest('.lg\\:hidden') && step === '3';
            const isMobileAddStockStep = targetElement.closest('.lg\\:hidden') && step === '2';
            
            if (isMobileMenuStep) {
              // Step 3 on mobile is the mobile menu button
              overlay?.classList.add('mobile-menu-step');
              
              // Check if menu should be opened
              const mobileMenu = document.querySelector('.lg\\:hidden .border-t');
              if (targetElement && !mobileMenu) {
                targetElement.click();
                setTimeout(() => {
                  return true;
                }, 300);
              }
            } else if (isMobileAddStockStep) {
              // Step 2 on mobile is the add stock plus button
              // This will open the drawer
              if (targetElement) {
                targetElement.click();
                setTimeout(() => {
                  return true;
                }, 300);
              }
            } else {
              overlay?.classList.remove('mobile-menu-step');
            }
          } else {
            // Desktop tour logic
            const isInsideSidebar = targetElement.closest('[data-tour="sidebar"]') || 
                                   targetElement.getAttribute('data-intro')?.includes('Stock Search') ||
                                   targetElement.getAttribute('data-intro')?.includes('Alert Price');
            
            // Add/remove sidebar-step class for overlay styling
            if (step === '3' || step === '4' || isInsideSidebar) {
              overlay?.classList.add('sidebar-step');
              
              // Open sidebar for steps that target sidebar elements
              const openButton = document.querySelector('[data-step="2"]') as HTMLElement;
              if (openButton && !document.querySelector('[data-tour="sidebar"]')?.classList.contains('translate-x-0')) {
                openButton.click();
                // Give sidebar time to animate open
                setTimeout(() => {
                  return true;
                }, 350);
              }
            } else {
              overlay?.classList.remove('sidebar-step');
            }
          }
        }
        return true;
      });

      // Handle orientation changes and window resize for mobile
      const handleOrientationChange = () => {
        if (tourRef.current && window.innerWidth < 1024) {
          // Small delay to allow for orientation change to complete
          setTimeout(() => {
            // Force tooltip repositioning
            const activeTooltip = document.querySelector('.introjs-tooltip');
            if (activeTooltip) {
              // Trigger a refresh of the tooltip position
              tourRef.current.refresh();
            }
          }, 300);
        }
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);

      // Clean up event listeners and overlay classes
      tourRef.current.onexit(() => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
        const overlay = document.querySelector('.introjs-overlay');
        overlay?.classList.remove('sidebar-step');
        overlay?.classList.remove('mobile-menu-step');
      });

      tourRef.current.start();
    } catch (error) {
      console.error('Failed to start tour:', error);
    }
  };

  const completeTour = () => {
    if (tourRef.current) {
      tourRef.current.exit();
    }
  };

  return {
    startTour,
    completeTour,
  };
};
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useTour } from '@/contexts/TourContext';
import { useNavigate, useLocation } from 'react-router-dom';

const TourOverlay: React.FC = () => {
  const { isActive, currentTourStep, nextStep, prevStep, endTour, currentStep, steps } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [sidebarOverlayStyle, setSidebarOverlayStyle] = useState<React.CSSProperties>({});

  // Prevent scrolling when tour is active
  useEffect(() => {
    if (!isActive) return;

    // Store original overflow values
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent scroll via wheel, touch, and keyboard
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      // Prevent arrow keys, page up/down, home, end, space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent all forms of scrolling
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventKeyScroll);

    return () => {
      // Restore original overflow values
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Remove event listeners
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventKeyScroll);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !currentTourStep) {
      setTargetElement(null);
      setSidebarElement(null);
      setOverlayStyle({});
      setSidebarOverlayStyle({});
      return;
    }

    // Check if we need to navigate to a different page for this step
    if (currentTourStep.page && location.pathname !== currentTourStep.page) {
      console.log('Navigating to page:', currentTourStep.page);
      navigate(currentTourStep.page);
      return;
    }

    // Only reset if we're targeting a different element or switching pages
    const currentTarget = targetElement?.getAttribute('data-tour') || '';
    const newTarget = currentTourStep.target.replace(/[\[\]"]/g, '').replace('data-tour=', '');
    
    if (currentTarget !== newTarget) {
      console.log('Switching targets from', currentTarget, 'to', newTarget);
      setTargetElement(null);
      setOverlayStyle({});
    }

    // Find the target element with retries and improved timing
    const findTargetElement = async () => {
      console.log('Finding element for step:', currentTourStep.id, 'Target:', currentTourStep.target);
      
      const element = document.querySelector(currentTourStep.target) as HTMLElement;
      console.log('Looking for element:', currentTourStep.target, 'Found:', element);
      
      // Also find sidebar element if specified
      let sidebarElement = null;
      if (currentTourStep.sidebarTarget) {
        sidebarElement = document.querySelector(currentTourStep.sidebarTarget) as HTMLElement;
        console.log('Looking for sidebar element:', currentTourStep.sidebarTarget, 'Found:', sidebarElement);
        setSidebarElement(sidebarElement);
      }
      
      if (element) {
        // Store the element first
        setTargetElement(element);
        
        // Temporarily enable scrolling for tour navigation
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Handle scrolling with proper timing
        if (currentTourStep.customSpotlight === 'from-top') {
          console.log(`Scrolling to top for ${currentTourStep.id}`);
          // Force scroll to absolute top position
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          window.scrollTo({ 
            top: 0, 
            left: 0, 
            behavior: 'smooth' 
          });
          
          // Wait longer for scroll to complete and ensure we're at the very top
          await new Promise(resolve => setTimeout(resolve, 900));
          
          // Double-check we're at the top
          if (window.scrollY > 0) {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          // Scroll element into view for other steps
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          
          // Wait for scroll to complete
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Calculate position with multiple attempts for stability
        const calculatePosition = () => {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          console.log('Calculating position for:', currentTourStep.id, {
            rect,
            scrollTop,
            scrollLeft,
            elementVisible: rect.width > 0 && rect.height > 0
          });
          
          if (rect.width > 0 && rect.height > 0) {
            setOverlayStyle({
              top: rect.top + scrollTop - 8,
              left: rect.left + scrollLeft - 8,
              width: rect.width + 16,
              height: rect.height + 16,
            });
          }
          
          // Calculate sidebar position if sidebar element exists
          if (sidebarElement) {
            const sidebarRect = sidebarElement.getBoundingClientRect();
            if (sidebarRect.width > 0 && sidebarRect.height > 0) {
              setSidebarOverlayStyle({
                top: sidebarRect.top + scrollTop - 8,
                left: sidebarRect.left + scrollLeft - 8,
                width: sidebarRect.width + 16,
                height: sidebarRect.height + 16,
              });
            }
          }
        };
        
        // Calculate position immediately and once more after a brief delay
        calculatePosition();
        setTimeout(calculatePosition, 100);
        
        // Re-disable scrolling after all calculations
        setTimeout(() => {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        }, 100);
        
        return true;
      }
      return false;
    };

    // Try to find the element with increasing delays
    const attemptFind = async (attempt: number = 0): Promise<void> => {
      if (attempt >= 15) {
        console.warn(`Could not find tour target element after ${attempt} attempts: ${currentTourStep.target}`);
        return;
      }
      
      try {
        const found = await findTargetElement();
        if (!found) {
          // Increase delay with each attempt
          const delay = Math.min(200 * (attempt + 1), 1000);
          setTimeout(() => attemptFind(attempt + 1), delay);
        }
      } catch (error) {
        console.error('Error finding target element:', error);
        setTimeout(() => attemptFind(attempt + 1), 300);
      }
    };

    // Start the search with a small delay to allow DOM to settle
    const timer = setTimeout(() => attemptFind(), 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isActive, currentTourStep, navigate, location.pathname]);

  // Update overlay position on scroll/resize with better debouncing
  useEffect(() => {
    if (!targetElement || !isActive || !currentTourStep) return;

    let animationFrameId: number;
    let updateTimeout: number;

    const updatePosition = () => {
      // Cancel any pending updates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      // Debounce rapid updates with improved timing for smoother transitions
      updateTimeout = window.setTimeout(() => {
        animationFrameId = requestAnimationFrame(() => {
          if (!targetElement || !isActive) return;
          
          const rect = targetElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          // Only update if element is visible
          if (rect.width > 0 && rect.height > 0) {
            console.log('Updating overlay position:', {
              step: currentTourStep.id,
              rect,
              scrollTop,
              scrollLeft
            });
            
            setOverlayStyle({
              top: rect.top + scrollTop - 8,
              left: rect.left + scrollLeft - 8,
              width: rect.width + 16,
              height: rect.height + 16,
            });
          }
          
          // Update sidebar position if sidebar element exists
          if (sidebarElement) {
            const sidebarRect = sidebarElement.getBoundingClientRect();
            if (sidebarRect.width > 0 && sidebarRect.height > 0) {
              setSidebarOverlayStyle({
                top: sidebarRect.top + scrollTop - 8,
                left: sidebarRect.left + scrollLeft - 8,
                width: sidebarRect.width + 16,
                height: sidebarRect.height + 16,
              });
            }
          }
        });
      }, 30); // Further reduced debounce time for faster updates
    };

    // Update immediately
    updatePosition();

    // Only listen for events that actually matter for positioning
    window.addEventListener('resize', updatePosition);
    
    // Don't listen for scroll events since we're preventing scrolling
    // and only allowing programmatic scrolling which we handle separately
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [targetElement, sidebarElement, isActive, currentTourStep]);

  const getTooltipPosition = () => {
    if (!targetElement || !currentTourStep) return {};

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const placement = currentTourStep.placement || 'bottom';

    const baseTop = rect.top + scrollTop;
    const baseLeft = rect.left + scrollLeft;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Modal approximate size (adjust as needed)
    const modalWidth = 384; // max-w-sm is roughly 384px
    const modalHeight = 200; // approximate height

    let position: Record<string, any> = {};

    switch (placement) {
      case 'top':
        position = {
          top: baseTop - 20,
          left: baseLeft + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
        break;
      case 'bottom':
        position = {
          top: baseTop + rect.height + 20,
          left: baseLeft + rect.width / 2,
          transform: 'translate(-50%, 0)',
        };
        break;
      case 'left':
        position = {
          top: baseTop + rect.height / 2,
          left: baseLeft - 20,
          transform: 'translate(-100%, -50%)',
        };
        break;
      case 'right':
        position = {
          top: baseTop + rect.height / 2,
          left: baseLeft + rect.width + 20,
          transform: 'translate(0, -50%)',
        };
        break;
      default:
        position = {
          top: baseTop + rect.height + 20,
          left: baseLeft + rect.width / 2,
          transform: 'translate(-50%, 0)',
        };
    }

    // Adjust if modal would be cut off
    const modalLeft = position.left as number;
    const modalTop = position.top as number;
    
    // Check horizontal bounds
    if (modalLeft - modalWidth/2 < 20) {
      // Too far left, shift right
      position.left = 20 + modalWidth/2;
      position.transform = 'translate(-50%, 0)';
      if (placement === 'top') position.transform = 'translate(-50%, -100%)';
      if (placement === 'left' || placement === 'right') position.transform = 'translate(0, -50%)';
    } else if (modalLeft + modalWidth/2 > viewportWidth - 20) {
      // Too far right, shift left
      position.left = viewportWidth - 20 - modalWidth/2;
      position.transform = 'translate(-50%, 0)';
      if (placement === 'top') position.transform = 'translate(-50%, -100%)';
      if (placement === 'left' || placement === 'right') position.transform = 'translate(-100%, -50%)';
    }

    // Check vertical bounds
    if (modalTop < 20) {
      // Too high, move below target
      position.top = baseTop + rect.height + 20;
      if (position.transform?.includes('-100%')) {
        position.transform = position.transform.replace('-100%', '0');
      }
    } else if (modalTop + modalHeight > viewportHeight - 20) {
      // Too low, move above target
      position.top = baseTop - 20;
      if (!position.transform?.includes('-100%')) {
        position.transform = position.transform?.replace('0', '-100%') || 'translate(-50%, -100%)';
      }
    }

    return position;
  };

  if (!isActive || !currentTourStep) return null;

  const createOverlayParts = () => {
    if (!targetElement || !isActive || !currentTourStep) {
      return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 cursor-pointer"
          onClick={endTour}
        />
      );
    }

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Ensure we have valid dimensions
    if (rect.width <= 0 || rect.height <= 0) {
      return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 cursor-pointer"
          onClick={endTour}
        />
      );
    }
    
    const targetTop = rect.top + scrollTop;
    const targetLeft = rect.left + scrollLeft;
    const targetRight = targetLeft + rect.width;
    const targetBottom = targetTop + rect.height;
    
    const padding = 8; // Add some padding around the target
    const adjustedTop = Math.max(0, targetTop - padding);
    const adjustedLeft = Math.max(0, targetLeft - padding);
    const adjustedRight = targetRight + padding;
    const adjustedBottom = targetBottom + padding;

    console.log('Overlay calculations for step:', currentTourStep.id, {
      rect,
      scrollTop,
      scrollLeft,
      targetTop,
      targetLeft,
      targetRight,
      targetBottom,
      adjustedTop,
      adjustedLeft,
      adjustedRight,
      adjustedBottom,
      targetElement: targetElement.tagName,
      targetClass: targetElement.className
    });

    return (
      <>
        {/* Top overlay */}
        <div 
          className="fixed bg-black bg-opacity-60 z-40 cursor-pointer transition-all duration-300 ease-out"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: `${adjustedTop}px`
          }}
          onClick={endTour}
        />
        
        {/* Bottom overlay */}
        <div 
          className="fixed bg-black bg-opacity-60 z-40 cursor-pointer transition-all duration-300 ease-out"
          style={{
            top: `${adjustedBottom}px`,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={endTour}
        />
        
        {/* Left overlay */}
        <div 
          className="fixed bg-black bg-opacity-60 z-40 cursor-pointer transition-all duration-300 ease-out"
          style={{
            top: `${adjustedTop}px`,
            left: 0,
            width: `${adjustedLeft}px`,
            height: `${adjustedBottom - adjustedTop}px`
          }}
          onClick={endTour}
        />
        
        {/* Right overlay */}
        <div 
          className="fixed bg-black bg-opacity-60 z-40 cursor-pointer transition-all duration-300 ease-out"
          style={{
            top: `${adjustedTop}px`,
            left: `${adjustedRight}px`,
            right: 0,
            height: `${adjustedBottom - adjustedTop}px`
          }}
          onClick={endTour}
        />
      </>
    );
  };

  return (
    <>
      {/* Dark overlay parts */}
      {createOverlayParts()}
      
      {/* Highlight border for target element */}
      {targetElement && overlayStyle.width && overlayStyle.height && (
        <div
          className="fixed z-50 border-4 border-[#ff8000] rounded-lg pointer-events-none shadow-lg animate-pulse transition-all duration-300 ease-out"
          style={{
            ...overlayStyle,
            boxShadow: '0 0 0 4px rgba(255, 128, 0, 0.3), 0 0 20px rgba(255, 128, 0, 0.5)'
          }}
        />
      )}
      
      {/* Highlight border for sidebar element */}
      {sidebarElement && sidebarOverlayStyle.width && sidebarOverlayStyle.height && (
        <div
          className="fixed z-50 border-4 border-[#ff8000] rounded-lg pointer-events-none shadow-lg animate-pulse transition-all duration-300 ease-out"
          style={{
            ...sidebarOverlayStyle,
            boxShadow: '0 0 0 4px rgba(255, 128, 0, 0.3), 0 0 20px rgba(255, 128, 0, 0.5)'
          }}
        />
      )}
      
      {/* Tour tooltip */}
      <Card 
        className="fixed z-50 p-6 max-w-sm bg-white shadow-xl border-2 border-[#ff8000]"
        style={getTooltipPosition()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#2a3441] mb-2">
              {currentTourStep.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {currentTourStep.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={endTour}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Back button clicked, current step:', currentStep, 'tour step:', currentTourStep?.id);
                  prevStep();
                }}
                className="text-xs"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={endTour}
              className="text-xs"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Skip
            </Button>
            
            <Button
              size="sm"
              onClick={() => {
                console.log('Next button clicked, current step:', currentStep, 'tour step:', currentTourStep?.id);
                nextStep();
              }}
              className="bg-[#ff8000] hover:bg-[#ff7000] text-white text-xs"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep !== steps.length - 1 && <ArrowRight className="h-3 w-3 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default TourOverlay;

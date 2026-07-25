'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltipContent: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

const Tooltip = ({ 
  tooltipContent, 
  side = 'top', 
  align = 'center', 
  delayDuration = 200, 
  children, 
  ...props 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delayDuration);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className={cn('relative inline-block', props.className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95',
            side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
            side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2'
          )}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export { Tooltip };
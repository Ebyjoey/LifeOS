'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, orientation = 'horizontal', children, ...props }, ref) => {
    const [activeValue, setActiveValue] = React.useState(defaultValue || value || '');
    
    const handleValueChange = (newValue: string) => {
      if (!value) {
        setActiveValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const currentValue = value !== undefined ? value : activeValue;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4',
          orientation === 'vertical' && 'flex-row',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            orientation === 'vertical' && 'flex-col w-10'
          )}
          role="tablist"
          aria-orientation={orientation}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement<TabsListProps>(child) && child.type === TabsList) {
              return React.cloneElement(child, { value: currentValue, onValueChange: handleValueChange, orientation });
            }
            return child;
          })}
        </div>
        <div className="flex-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement<TabsContentProps>(child) && child.type === TabsContent) {
              const isActive = currentValue === child.props.value;
              return React.cloneElement(child, { isActive });
            }
            return child;
          })}
        </div>
      </div>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, value, onValueChange, orientation = 'horizontal', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-1 p-1',
          orientation === 'vertical' && 'flex-col w-full',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<TabsTriggerProps>(child) && child.type === TabsTrigger) {
            const isActive = value === child.props.value;
            return React.cloneElement(child, { isActive, onValueChange });
          }
          return child;
        })}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  isActive?: boolean;
  onValueChange?: (value: string) => void;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, isActive, onValueChange, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  isActive?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, isActive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        !isActive && 'hidden',
        className
      )}
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      {...props}
    >
      {children}
    </div>
  )
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
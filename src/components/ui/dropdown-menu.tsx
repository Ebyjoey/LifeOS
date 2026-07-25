'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<React.ButtonHTMLAttributes<HTMLButtonElement>>(child) && child.type === DropdownMenuTrigger) {
            return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) });
          }
          return child;
        })}
      </button>
      {isOpen && (
        <div
          ref={contentRef}
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          role="menu"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && (child.type === DropdownMenuContent || child.type === DropdownMenuItem || child.type === DropdownMenuSeparator)) {
              return child;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

const DropdownMenuTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props}>{children}</button>
);

const DropdownMenuContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{children}</div>
);

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, destructive, onClick, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        destructive && 'text-destructive focus:text-destructive',
        className
      )}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
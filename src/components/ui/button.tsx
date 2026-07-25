'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2',
      ghost: 'hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2',
      link: 'text-primary underline-offset-4 hover:underline h-10 px-4 py-2',
    } as const;

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    } as const;

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
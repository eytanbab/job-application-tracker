import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-indigo-600 dark:border-indigo-400 px-4 bg-transparent py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-indigo-600 placeholder:text-indigo-300 dark:placeholder:text-indigo-300/30 focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

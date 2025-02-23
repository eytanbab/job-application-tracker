import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex h-40 resize-none w-full rounded-md border border-indigo-600 bg-transparent px-3 py-2 text-base ring-offset-indigo-600 placeholder:text-indigo-300 focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };

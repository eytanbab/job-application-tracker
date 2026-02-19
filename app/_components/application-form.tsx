'use client';

import { z } from 'zod';
import { insertApplicationSchema } from '../db/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { CalendarIcon, Loader2 } from 'lucide-react';

import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { useState, useTransition } from 'react';
import { extractAiApplication } from '../actions/applications';
import { AiData } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createApplicationSchema = insertApplicationSchema.omit({
  userId: true,
  id: true,
});

export type FormValues = z.input<typeof createApplicationSchema>;

const aiFormSchema = z.object({
  url: z.string().url(),
});

type Props = {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

type AiValues = {
  role_name: string;
  company_name: string;
  link: string;
  platform: string;
  status: string;
  description?: string | undefined | null;
  location: string;
  date_applied: Date | string;
  month: string;
  year: string;
  salary?: string | null;
};

export const ApplicationForm = ({
  defaultValues,
  onSubmit,
  onClose,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [aiValues, setAiValues] = useState<AiValues | null>(defaultValues);
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    role_name: z.string().min(2, {
      message: 'Role name must be at least 2 characters.',
    }),
    company_name: z.string().min(2, {
      message: 'Company name must be at least 2 characters.',
    }),
    date_applied: z.string().or(z.date()),
    link: z.string().url(),
    description: z.string().min(2, {
      message: 'Description must be at least 2 characters.',
    }),
    location: z.string().min(2, {
      message: 'Location must be at least 2 characters.',
    }),
    platform: z.string().min(2, {
      message: 'Platform name must be at least 2 characters.',
    }),
    status: z.string().min(2, {
      message: 'Status name must be at least 2 characters.',
    }),
    salary: z.string().nullable().optional(),
  });

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      url: '',
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const onCancel = () => {
    onClose();
    redirect('/applications');
  };

  const handleAiSubmit = async (values: z.infer<typeof aiFormSchema>) => {
    setIsLoading(true);
    try {
      const aiAutoFill: AiData = await extractAiApplication(values.url);
      console.log('aiAutoFill', aiAutoFill);

      if (aiAutoFill.status === 'fail') {
        setAiValues(null);
        return;
      }

      const autoFillValues: FormValues = {
        date_applied: format(Date.now(), 'yyyy-MM-dd'),
        role_name: aiAutoFill.application.role_name,
        company_name: aiAutoFill.application.company_name,
        link: aiAutoFill.application.link,
        platform: aiAutoFill.application.platform,
        status: 'Applied',
        description: aiAutoFill.application.description ?? '',
        location: aiAutoFill.application.location,
        month: '',
        year: '',
        salary: '',
      };

      // update form state so react-hook-form knows about the changes
      Object.entries(autoFillValues).forEach(([key, value]) => {
        form.setValue(key as keyof FormValues, value);
      });

      setAiValues(autoFillValues);
    } catch (error) {
      console.error('Error extracting AI application data:', error);
      setAiValues(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (values: FormValues) => {
    // fix (production): date is selected as the previous day
    const formattedDate = format(values.date_applied, 'yyyy-MM-dd');

    // convert form values to lower case for ignoring duplicates such was Waiting and waiting when fetching from db
    values = {
      ...values,
      date_applied: formattedDate,
      role_name: values.role_name.trim(),
      company_name: values.company_name.trim(),
      link: values.link.toLowerCase().trim(),
      description: values.description,
      location: values.location.trim(),
      platform: values.platform.toLowerCase().trim(),
      status: values.status.toLowerCase().trim(),
      salary: values.salary?.trim() || '',
    };

    startTransition(async () => {
      onSubmit(values);
      onClose();
      redirect('/applications');
    });
  };

  // // for debugging:
  // console.log('Form current values:', form.watch());
  // console.log('Form errors:', form.formState.errors);

  return (
    <div className='w-full flex flex-col gap-2 items-center'>
      <Form {...aiForm}>
        <form
          onSubmit={aiForm.handleSubmit(handleAiSubmit)}
          className='flex flex-col w-full gap-2 max-w-lg'
        >
          <FormField
            control={aiForm.control}
            name='url'
            render={({ field }) => (
              <FormItem className='space-y-0'>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://www.linkedin.com/jobs/view/123456789/'
                    {...field}
                  />
                </FormControl>
                {aiValues === null && (
                  <p className='text-sm font-medium text-destructive'>
                    Failed to extract information from the URL.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={isPending || isLoading}>
            {isLoading ? (
              <Loader2 className='size-8 animate-spin' />
            ) : (
              'Auto-Extract Details'
            )}
          </Button>
        </form>
      </Form>
      {/* Divider */}
      <div className='w-full flex gap-1 items-center justify-center max-w-lg'>
        <div className='h-px w-full bg-border'></div>
        <span>OR</span>
        <div className='h-px w-full bg-border'></div>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className='grid grid-cols-2 w-full gap-3 max-w-lg'
        >
          <FormField
            control={form.control}
            name='role_name'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-2'>
                <FormLabel>Role Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Frontend developer'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='company_name'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-2'>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Apple | Facebook | etc..'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='salary'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-1'>
                <FormLabel>Salary</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g. 30k - 40k'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-1'>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Tel Aviv'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-1'>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Applied'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='platform'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-1'>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Linkedin'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='date_applied'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-2'>
                <FormLabel>Date applied</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'group flex h-10 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 text-muted-foreground group-hover:text-foreground' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      showYearSwitcher={false}
                      selected={new Date(field.value!)}
                      onSelect={field.onChange}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='link'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-2'>
                <FormLabel>Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://www.linkedin.com/jobs/view/123456789/'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='space-y-0 col-span-2'>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Role description'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='mt-4 flex flex-col gap-2 w-full col-span-2'>
            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <Loader2 className='size-8 animate-spin' />
              ) : (
                'Submit'
              )}
            </Button>
            {/* Cancel button */}
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

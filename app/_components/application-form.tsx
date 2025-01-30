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

import { CalendarIcon } from 'lucide-react';

import { redirect } from 'next/navigation';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createApplicationSchema = insertApplicationSchema.omit({
  userId: true,
  id: true,
});

export type FormValues = z.input<typeof createApplicationSchema>;

type Props = {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

export const ApplicationForm = ({
  defaultValues,
  onSubmit,
  onClose,
}: Props) => {
  const formSchema = z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    role_name: z.string().min(2, {
      message: 'Role name must be at least 2 characters.',
    }),
    company_name: z.string().min(2, {
      message: 'Company name must be at least 2 characters.',
    }),
    date_applied: z.date(),
    link: z.string().url(),
    platform: z.string().min(2, {
      message: 'Platform name must be at least 2 characters.',
    }),
    status: z.string().min(2, {
      message: 'Status name must be at least 2 characters.',
    }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  type Field = {
    name:
      | 'role_name'
      | 'company_name'
      | 'date_applied'
      | 'link'
      | 'status'
      | 'platform';
    label: string;
    placeholder: string;
  };

  const fields: Field[] = [
    {
      name: 'role_name',
      label: 'Role Title',
      placeholder: 'Frontend developer',
    },
    {
      name: 'company_name',
      label: 'Company Name',
      placeholder: 'Apple | Facebook | etc..',
    },
    {
      name: 'date_applied',
      label: 'Date Applied',
      placeholder: '2025-01-01',
    },
    {
      name: 'link',
      label: 'Link',
      placeholder: 'https://www.linkedin.com/jobs/view/123456789/',
    },
    {
      name: 'status',
      label: 'Status',
      placeholder: 'Waiting | Interview | Rejected | etc..',
    },
    {
      name: 'platform',
      label: 'Platform',
      placeholder: 'Linkedin | Indeed | Company website | etc..',
    },
  ];

  const handleSubmit = (values: FormValues) => {
    // convert all form values to lower case for ignoring duplicates such was Waiting and waiting when fetching from db
    values = {
      ...values,
      role_name: values.role_name.toLowerCase(),
      company_name: values.company_name.toLowerCase(),
      link: values.link.toLowerCase(),
      platform: values.platform.toLowerCase(),
      status: values.status.toLowerCase(),
    };
    onSubmit(values);
    onClose();
  };

  // for debugging:
  // console.log('Form current values:', form.watch());
  // console.log('Form errors:', form.formState.errors);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col w-full max-w-96 gap-2'
      >
        {fields.map((fld) => (
          <FormField
            key={fld.name}
            control={form.control}
            name={fld.name}
            render={({ field }) =>
              // Render date field
              fld.name === 'date_applied' ? (
                <FormItem className='space-y-0'>
                  <FormLabel>Date applied</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'flex h-10 w-full rounded-md border border-indigo-600 px-4 bg-transparent py-2 text-base font-normal disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-indigo-600 group',
                            !field.value && 'text-indigo-300'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 text-indigo-600 group-hover:text-slate-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-auto p-0 bg-slate-100'
                      align='start'
                    >
                      <Calendar
                        mode='single'
                        selected={new Date(field.value)}
                        onSelect={field.onChange}
                        disabled={(date: Date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                      />
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              ) : (
                // Render other fields
                <FormItem className='space-y-0'>
                  <FormLabel>{fld.label}</FormLabel>
                  <FormControl>
                    <Input placeholder={fld.placeholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }
          />
        ))}

        <div className='mt-4 flex flex-col gap-2 w-full'>
          <Button type='submit'>Submit</Button>
          {/* Cancel button */}
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

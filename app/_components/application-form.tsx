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

import { redirect } from 'next/navigation';
import { formatDate } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createApplicationSchema = insertApplicationSchema.omit({ userId: true });

export type FormValues = z.input<typeof createApplicationSchema>;

type Props = {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
};

export const ApplicationForm = ({ defaultValues, onSubmit }: Props) => {
  // convert date to yyyy-MM-dd before showing the user
  if (defaultValues) {
    const formattedDate = formatDate(
      new Date(defaultValues.date_applied),
      'yyyy-MM-dd'
    );
    defaultValues = { ...defaultValues, date_applied: formattedDate };
  }

  const formSchema = z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    role_name: z.string().min(2, {
      message: 'Role name must be at least 2 characters.',
    }),
    company_name: z.string().min(2, {
      message: 'Company name must be at least 2 characters.',
    }),
    date_applied: z.string().date(),
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
    onSubmit(values);
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
            render={({ field }) => (
              <FormItem className='space-y-0'>
                <FormLabel>{fld.label}</FormLabel>
                <FormControl>
                  <Input placeholder={fld.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className='mt-4 flex flex-col gap-2 w-full'>
          <Button type='submit'>Submit</Button>
          {/* Cancel button */}
          <Button
            type='button'
            variant='outline'
            onClick={() => redirect('/dashboard')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

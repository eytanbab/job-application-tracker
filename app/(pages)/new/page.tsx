'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { create } from '@/app/actions';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  role: z.string().min(2, {
    message: 'Role name must be at least 2 characters.',
  }),
  company: z.string().min(2, {
    message: 'Company name must be at least 2 characters.',
  }),
  date: z.string().date(),
  link: z.string().optional(),
  status: z.string().min(2, {
    message: 'Status must be at least 2 characters.',
  }),
  platform: z.string().min(2, {
    message: 'Platform must be at least 2 characters.',
  }),
});

export type FormSchema = z.infer<typeof formSchema>;

export default function New() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: '',
      company: '',
      date: '',
      link: '',
      status: '',
      platform: '',
    },
  });

  type Field = {
    name: 'role' | 'company' | 'date' | 'link' | 'status' | 'platform';
    label: string;
    placeholder: string;
  };
  const fields: Field[] = [
    { name: 'role', label: 'Role Title', placeholder: 'Frontend developer' },
    {
      name: 'company',
      label: 'Company Name',
      placeholder: 'Apple | Facebook | etc..',
    },
    {
      name: 'date',
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

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    create(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col w-96 gap-2'
      >
        {fields.map((f) => (
          <FormField
            key={Math.random() * 1000}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem className='space-y-0'>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  <Input placeholder={f.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className='mt-4 flex flex-col gap-2 w-full'>
          <Button type='submit'>Submit</Button>
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
}

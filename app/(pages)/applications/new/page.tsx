'use client';

import { z } from 'zod';

import { createApplication } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ApplicationForm } from '@/app/_components/application-form';
import { insertApplicationSchema } from '@/app/db/schema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

export default function NewApplication() {
  const { toast } = useToast();

  // 2. Define a submit handler.
  const onSubmit = async (values: FormValues) => {
    try {
      await createApplication(values);
      toast({
        description: 'Application submitted successfully!',
        variant: 'default',
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast({
        description: 'Failed to submit application.',
        variant: 'destructive',
      });
    }
  };

  const defaultValues = {
    role_name: '',
    company_name: '',
    date_applied: '',
    link: '',
    description: '',
    location: '',
    status: '',
    platform: '',
    month: '',
    year: '',
  };

  return (
    <ApplicationForm
      onClose={() => {}}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    />
  );
}

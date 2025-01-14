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

  return <ApplicationForm onSubmit={onSubmit} />;
}

'use client';

import { useRouter } from 'next/navigation';
import { ApplicationForm } from '@/app/_components/application-form';
import { createApplication } from '@/app/actions';
import { FormValues } from '@/app/_components/application-form'; // You'll need to export this type
import { useToast } from '@/hooks/use-toast';

export function EditApplicationClient({
  application,
}: {
  application: FormValues;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (values: FormValues) => {
    try {
      await createApplication(values);
      toast({
        description: 'Application submitted successfully!',
        variant: 'default',
      });
      router.push('/dashboard');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast({
        description: 'Failed to submit application.',
        variant: 'destructive',
      });
    }
  };

  return <ApplicationForm defaultValues={application} onSubmit={onSubmit} />;
}

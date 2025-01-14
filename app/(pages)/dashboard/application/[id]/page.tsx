import { getApplication } from '@/app/actions';
import { EditApplicationClient } from './_components/edit-application-client';
import { notFound } from 'next/navigation';
import type { FormValues } from '@/app/_components/application-form';

export default async function EditApplication({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);

  if (!application) {
    notFound();
  }
  return <EditApplicationClient application={application as FormValues} />;
}

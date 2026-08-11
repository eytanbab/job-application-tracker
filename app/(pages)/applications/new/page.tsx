import { redirect } from 'next/navigation';

export async function generateMetadata() {
  return {
    title: 'JAT | New Application',
  };
}

export default function NewApplicationPage() {
  redirect('/applications');
}

import NewApplication from './components/new-application';

export async function generateMetadata() {
  return {
    title: 'JAT | New Application',
  };
}

export default function NewApplicationPage() {
  return <NewApplication />;
}

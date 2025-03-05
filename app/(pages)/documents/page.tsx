import { FileUpload } from './components/file-upload';
import { DocumentsList } from './components/documents-list';

export default async function Documents() {
  return (
    <div className='flex flex-col gap-4'>
      <FileUpload />
      <DocumentsList />
    </div>
  );
}

import { getFiles } from '@/app/actions';
import { FileUpload } from './components/file-upload';
import Link from 'next/link';

export default async function Documents() {
  const files = await getFiles();
  console.log(files);

  return (
    <div className='flex flex-col gap-4'>
      <FileUpload />
      <div>
        {!files || files.length === 0 ? (
          <p>No files uploaded.</p>
        ) : (
          files.map((file) => (
            <Link key={file.id} href={file.doc_url}>
              {file.title}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

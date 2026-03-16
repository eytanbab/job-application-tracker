import { getFiles } from '@/app/actions/documents';
import { Document } from './document';

export const DocumentsList = async () => {
  const docs = await getFiles();
  return (
    <div>
      {!docs || docs.length === 0 ? (
        <p>No files uploaded.</p>
      ) : (
        <div className='flex gap-2 flex-wrap justify-start'>
          {docs.map((file) => (
            <Document key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
};

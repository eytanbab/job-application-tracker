import { getFiles } from '@/app/actions';
import { FileUpload } from './components/file-upload';

export default async function Documents() {
  const files = await getFiles();
  console.log(files);
  return (
    <>
      <FileUpload />;
    </>
  );
}

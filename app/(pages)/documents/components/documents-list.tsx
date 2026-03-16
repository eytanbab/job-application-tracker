import { getFiles } from "@/app/actions/documents";
import { Document } from "./document";

export const DocumentsList = async () => {
  const docs = await getFiles();
  if (!docs || docs.length === 0) {
    return <p>No files uploaded.</p>;
  }

  return (
    <div className="flex gap-2 flex-wrap justify-start">
      {docs.map((file) => (
        <Document key={file.id} file={file} />
      ))}
    </div>
  );
};

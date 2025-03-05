'use client';

import { deleteFile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

type Props = {
  file: {
    id: string;
    doc_url: string;
    title: string;
    created_at: Date;
    file_name: string;
  };
};

export const Document = ({ file }: Props) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id);
      toast({
        description: 'successfully deleted document!',
        variant: 'default',
      });
    } catch (err) {
      console.log(err);
      toast({ description: 'failed to delete file!', variant: 'destructive' });
    }
  };
  return (
    <div className='bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 p-4 flex flex-col justify-between items-start gap-2 rounded-sm max-w-96'>
      <div className='flex justify-between w-full'>
        <h1 className='text-xl font-bold truncate'>{file.title}</h1>
        <button
          className='hover:text-rose-600 '
          onClick={() => handleDelete(file.id)}
        >
          <Trash2 size={20} />
        </button>
      </div>
      <Link
        target='_blank'
        key={file.id}
        href={file.doc_url}
        className='truncate w-full'
      >
        {file.file_name}
      </Link>
      <p className='text-sm text-indigo-400'>
        Created at: {format(file.created_at, 'Pp')}
      </p>
    </div>
  );
};

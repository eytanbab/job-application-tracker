'use client';

import { deleteFile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

type Props = {
  file: {
    id: string;
    doc_url: string;
    title: string;
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
    <div className='bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 p-4 flex justify-between items-center rounded-sm'>
      <Link
        target='_blank'
        key={file.id}
        href={file.doc_url}
        className='hover:text'
      >
        {file.title}
      </Link>
      <button
        className='hover:text-rose-600 '
        onClick={() => handleDelete(file.id)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

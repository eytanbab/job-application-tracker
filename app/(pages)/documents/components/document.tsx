'use client';

import { deleteFile } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';

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
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteFile(id);
        toast({
          description: 'successfully deleted document!',
          variant: 'default',
        });
      } catch (err) {
        console.log(err);
        toast({
          description: 'failed to delete file!',
          variant: 'destructive',
        });
      }
    });
  };
  return (
    <div className='max-w-96 rounded-sm border bg-card p-4 text-card-foreground transition-colors hover:bg-accent/40'>
      <div className='flex justify-between w-full'>
        <h1 className='text-xl font-bold truncate'>{file.title}</h1>
        <Dialog>
          <DialogTrigger disabled={isPending}>
            <Trash2 className='size-5 hover:text-destructive' />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                file and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  disabled={isPending}
                  onClick={() => handleDelete(file.id)}
                >
                  Delete
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type='button' variant='ghost'>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Link
        target='_blank'
        key={file.id}
        href={file.doc_url}
        className='truncate w-full'
      >
        {file.file_name}
      </Link>
      <p className='text-sm text-muted-foreground'>
        Created at: {format(file.created_at, 'Pp')}
      </p>
    </div>
  );
};

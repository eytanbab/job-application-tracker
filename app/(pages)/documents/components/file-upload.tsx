'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { createFile, generatePresignedUrl } from '@/app/actions'; // API route for generating signed URL
import { useToast } from '@/hooks/use-toast';

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

// Form validation schema using Zod
const FormSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  file: z
    .custom<File>((val) => val instanceof File, { message: 'File is required' })
    .refine((file) => file.size <= FILE_SIZE_LIMIT, {
      message: 'File size should not exceed 5MB',
    })
    .refine((file) => file.type === 'application/pdf', {
      message: 'Only PDF files are allowed',
    }),
});

export function FileUpload() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const { title, file } = data;

    try {
      // Generate the pre-signed URL
      const { signedUrl, error } = await generatePresignedUrl(
        file.name,
        file.type
      );

      if (error) {
        console.error('Error generating signed URL:', error);
        toast({
          description: 'Failed to upload.',
          variant: 'destructive',
        });
        return;
      }

      // Upload the file to S3 using the pre-signed URL
      if (signedUrl) {
        const res = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (res.ok) {
          const fileUrl = signedUrl.split('?')[0]; // Extract file url
          const fileName = file.name;
          createFile(title, fileUrl, fileName); // Add title, file url and file name to neon db
          toast({
            description: 'File uploaded successfully!',
            variant: 'default',
          });
        } else {
          console.error('Failed to upload file');
          toast({
            description: 'Failed to upload file.',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast({
        description: 'Failed to upload file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='max-w-96 space-y-2'
      >
        {/* Title Input */}
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder='Title' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Input */}
        <FormField
          control={form.control}
          name='file'
          render={({ field: { onChange } }) => (
            <FormItem>
              <FormControl>
                <Input
                  type='file'
                  accept='application/pdf'
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onChange(e.target.files[0]); // Update form state with the selected file
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  );
}

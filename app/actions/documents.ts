'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from '@/app/db';
import { documents } from '@/app/db/schema';
import { and, eq } from 'drizzle-orm';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3-client';

export async function generatePresignedUrl(
  fileName: string,
  contentType: string
) {
  try {
    const { userId } = await auth();
    if (!fileName || !contentType || !userId) {
      throw new Error(
        'Missing required parameters: fileName and contentType and userId'
      );
    }

    // Allowed file types (modify this based on your needs)
    const allowedFileTypes = ['application/pdf'];
    if (!allowedFileTypes.includes(contentType)) {
      throw new Error('Invalid file type');
    }

    // Generate a unique filename for the file in the S3 bucket
    const fileKey = `${userId}/${Date.now().toString()}-${fileName}`;

    const uploadParams = {
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || '', // Get the bucket name from env variable
      Key: fileKey,
      ContentType: contentType,
    };

    if (!uploadParams.Bucket) {
      throw new Error('AWS S3 bucket name is missing in environment variables');
    }

    // Generate the pre-signed URL
    const command = new PutObjectCommand(uploadParams);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expiry time
    });
    return { signedUrl };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return { error: (error as Error).message };
  }
}

export async function createFile(
  title: string,
  doc_url: string,
  file_name: string
) {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .insert(documents)
    .values({ title, doc_url, userId, file_name })
    .returning({ insertedId: documents.id });
  revalidatePath('/documents');
}

export async function getFiles() {
  const { userId } = await auth();
  if (!userId) return;

  return db.select().from(documents).where(eq(documents.userId, userId));
}

export async function deleteFile(id: string) {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .delete(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, id)));

  revalidatePath('/documents');
}

'use server';

import { revalidateTag, unstable_cache } from 'next/cache';

import { db } from '@/app/db';
import { documents } from '@/app/db/schema';
import { and, eq } from 'drizzle-orm';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3-client';
import {
  CACHE_REVALIDATE_SECONDS,
  documentsTag,
} from './_utils/cache-tags';
import { getCurrentUserIdOrThrow } from './_utils/user-context';

export async function generatePresignedUrl(
  fileName: string,
  contentType: string
) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    if (!fileName || !contentType) {
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
    return { fileKey, signedUrl };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return { error: (error as Error).message };
  }
}

export async function createFile(
  title: string,
  doc_url: string,
  file_name: string,
  file_key: string
) {
  const userId = await getCurrentUserIdOrThrow();

  await db
    .insert(documents)
    .values({ title, doc_url, userId, file_name, file_key })
    .returning({ insertedId: documents.id });
  revalidateTag(documentsTag(userId));
}

export async function getFiles() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => db.select().from(documents).where(eq(documents.userId, userId)),
    ['documents', 'list', userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [documentsTag(userId)],
    }
  )();
}

export async function deleteFile(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  try {
    const deletedDocument = await db
      .delete(documents)
      .where(and(eq(documents.userId, userId), eq(documents.id, id)))
      .returning({ file_key: documents.file_key });

    const deleteParams = {
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || '', // Get the bucket name from env variable
      Key: deletedDocument[0].file_key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    console.log('Error', err);
  }

  revalidateTag(documentsTag(userId));
}

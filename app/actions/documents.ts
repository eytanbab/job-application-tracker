"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { db, isMockDb } from "@/app/db";
import { mockStore } from "@/lib/mock-data/mock-store";
import { documents, jobApplications } from "@/app/db/schema";
import { and, desc, eq } from "drizzle-orm";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import {
  CACHE_REVALIDATE_SECONDS,
  documentsTag,
  applicationsTag,
} from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

export async function generatePresignedUrl(
  fileName: string,
  contentType: string,
) {
  try {
    if (!fileName || !contentType) {
      throw new Error(
        "Missing required parameters: fileName and contentType and userId",
      );
    }

    const userId = await getCurrentUserIdOrThrow();

    // Allowed file types (modify this based on your needs)
    const allowedFileTypes = ["application/pdf"];
    if (!allowedFileTypes.includes(contentType)) {
      throw new Error("Invalid file type");
    }

    // Sanitize file name to avoid path traversal and invalid characters
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);

    // Generate a unique filename for the file in the S3 bucket
    const fileKey = `${userId}/${Date.now().toString()}-${sanitizedFileName}`;

    if (isMockDb || !process.env.NEXT_AWS_S3_BUCKET_NAME) {
      return {
        fileKey,
        signedUrl: `https://mock-s3-upload.local/${fileKey}`,
      };
    }

    const uploadParams = {
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || "", // Get the bucket name from env variable
      Key: fileKey,
      ContentType: contentType,
    };

    if (!uploadParams.Bucket) {
      throw new Error("AWS S3 bucket name is missing in environment variables");
    }

    // Generate the pre-signed URL
    const command = new PutObjectCommand(uploadParams);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expiry time
    });
    return { fileKey, signedUrl };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return { error: (error as Error).message };
  }
}

export async function createFile(
  title: string,
  doc_url: string,
  file_name: string,
  file_key: string,
  category: string = "resume",
  file_size?: string,
) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const newDoc = mockStore.createDocument(userId, {
      title,
      doc_url,
      file_name,
      file_key,
      category,
      file_size: file_size || null,
    });
    try {
      revalidateTag(documentsTag(userId), "max");
      revalidatePath("/documents");
    } catch {}
    return { id: newDoc.id };
  }

  const result = await db
    .insert(documents)
    .values({
      title,
      doc_url,
      userId,
      file_name,
      file_key,
      category,
      file_size,
    })
    .returning({ insertedId: documents.id });
  try {
    revalidateTag(documentsTag(userId), "max");
    revalidatePath("/documents");
  } catch {}
  return { id: result[0]?.insertedId };
}

export async function getResumes() {
  const allFiles = await getFiles();
  return allFiles.filter((f) => f.category === "resume");
}

export async function getFiles() {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getDocuments(userId);
  }

  return unstable_cache(
    async () => {
      return db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.created_at));
    },
    ["documents-list", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [documentsTag(userId)],
    },
  )();
}

export async function getDocument(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const doc = mockStore.getDocuments(userId).find((d) => d.id === id);
    return doc || null;
  }

  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, id)))
    .limit(1);

  return result[0] || null;
}

export async function findExistingResume(
  fileName: string,
  fileSize?: string,
) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const resumes = mockStore
      .getDocuments(userId)
      .filter((d) => d.category === "resume");
    const lowerName = fileName.toLowerCase().trim();
    const match = resumes.find(
      (r) =>
        r.file_name.toLowerCase().trim() === lowerName ||
        (fileSize &&
          r.file_size === fileSize &&
          r.file_name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            lowerName.replace(/[^a-z0-9]/g, "")),
    );
    return match || null;
  }

  const allResumes = await getResumes();
  const lowerName = fileName.toLowerCase().trim();
  const match = allResumes.find(
    (r) =>
      r.file_name.toLowerCase().trim() === lowerName ||
      (fileSize &&
        r.file_size === fileSize &&
        r.file_name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          lowerName.replace(/[^a-z0-9]/g, "")),
  );
  return match || null;
}

export async function getDocumentUsage(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getDocumentUsage(userId, id);
  }

  const rows = await db
    .select({
      id: jobApplications.id,
      role_name: jobApplications.role_name,
      company_name: jobApplications.company_name,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.resumeId, id),
      ),
    );

  return {
    count: rows.length,
    applications: rows,
  };
}

export async function deleteFile(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    mockStore.deleteDocument(userId, id);
    try {
      revalidateTag(documentsTag(userId), "max");
      revalidateTag(applicationsTag(userId), "max");
      revalidatePath("/documents");
      revalidatePath("/applications");
      revalidatePath("/analytics/overview");
    } catch {}
    return;
  }

  try {
    const deletedDocument = await db
      .delete(documents)
      .where(and(eq(documents.userId, userId), eq(documents.id, id)))
      .returning({ file_key: documents.file_key });

    if (deletedDocument.length === 0) {
      throw new Error("Document not found");
    }

    const fileKey = deletedDocument[0].file_key;
    if (fileKey && process.env.NEXT_AWS_S3_BUCKET_NAME) {
      try {
        if (fileKey.startsWith(`${userId}/`)) {
          const deleteParams = {
            Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME,
            Key: fileKey,
          };
          await s3Client.send(new DeleteObjectCommand(deleteParams));
        }
      } catch (s3Err) {
        console.warn("Could not delete S3 object (orphaned file):", s3Err);
      }
    }
  } catch (err) {
    console.error("Delete document error:", err);
    throw err;
  } finally {
    try {
      revalidateTag(documentsTag(userId), "max");
      revalidateTag(applicationsTag(userId), "max");
      revalidatePath("/documents");
      revalidatePath("/applications");
      revalidatePath("/analytics/overview");
    } catch {}
  }
}

export async function getViewUrl(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getViewUrl(userId, id);
  }

  try {
    const document = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.id, id)))
      .limit(1);

    if (!document || document.length === 0) {
      throw new Error("Document not found");
    }

    const safeFileName = (document[0].file_name || "resume.pdf")
      .replace(/["\r\n\\]/g, "_")
      .slice(0, 150);

    const getCommand = new (
      await import("@aws-sdk/client-s3")
    ).GetObjectCommand({
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || "",
      Key: document[0].file_key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename="${safeFileName}"`,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600, // 1 hour for inline viewing
    });

    return { url: signedUrl };
  } catch (error) {
    console.error("View URL error:", error);
    return { error: (error as Error).message };
  }
}

export async function getDownloadUrl(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getDownloadUrl(userId, id);
  }

  try {
    const document = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.id, id)))
      .limit(1);

    if (!document || document.length === 0) {
      throw new Error("Document not found");
    }

    const safeFileName = (document[0].file_name || "resume.pdf")
      .replace(/["\r\n\\]/g, "_")
      .slice(0, 150);

    const getCommand = new (
      await import("@aws-sdk/client-s3")
    ).GetObjectCommand({
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || "",
      Key: document[0].file_key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 60,
    });

    return { url: signedUrl };
  } catch (error) {
    console.error("Download error:", error);
    return { error: (error as Error).message };
  }
}

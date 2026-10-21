import { describe, expect, it } from "vitest";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { asciiFileName, contentDisposition } from "../utils";

const ASCII_ONLY = /^[\x20-\x7e]*$/;

describe("asciiFileName", () => {
  it("keeps plain English names", () => {
    expect(asciiFileName("Resume 2026.pdf")).toBe("Resume 2026.pdf");
  });

  it("falls back to 'document' when nothing readable is left", () => {
    expect(asciiFileName("קורות חיים.pdf")).toBe("document.pdf");
  });

  it("replaces non-ASCII parts of mixed names and strips accents", () => {
    expect(asciiFileName("Eytan קורות חיים CV.pdf")).toBe("Eytan _ CV.pdf");
    expect(asciiFileName("Résumé.pdf")).toBe("Resume.pdf");
  });

  it("applies a stricter character set for storage keys", () => {
    expect(asciiFileName("my resume (v2).pdf", /[^a-zA-Z0-9._-]/g, 100)).toBe("my_resume_v2_.pdf");
    expect(asciiFileName("קורות חיים.pdf", /[^a-zA-Z0-9._-]/g, 100)).toBe("document.pdf");
  });
});

describe("contentDisposition", () => {
  it("sends Hebrew names as UTF-8 with an ASCII fallback", () => {
    const value = contentDisposition("inline", "קורות חיים.pdf");
    expect(value).toMatch(ASCII_ONLY);
    expect(value).toBe(
      `inline; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent("קורות חיים.pdf")}`,
    );
  });

  it("escapes quotes, backslashes, newlines and RFC 5987 reserved characters", () => {
    const value = contentDisposition("attachment", 'CV "final"\r\n(it\'s)*.pdf');
    expect(value).toMatch(ASCII_ONLY);
    expect(value).toContain('filename="CV _final_ (it\'s)*.pdf"');
    expect(value).toContain("filename*=UTF-8''CV%20%22final%22%20%28it%27s%29%2A.pdf");
  });

  it("survives presigning: S3 receives the Hebrew name intact", async () => {
    const client = new S3Client({
      region: "us-east-1",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: "bucket",
        Key: "user/1-document.pdf",
        ResponseContentDisposition: contentDisposition("inline", "קורות חיים.pdf"),
      }),
      { expiresIn: 60 },
    );
    const header = new URL(url).searchParams.get("response-content-disposition")!;
    // What S3 sends back as the header: ASCII only, so it is valid ISO-8859-1
    expect(header).toMatch(ASCII_ONLY);
    expect(decodeURIComponent(header.split("UTF-8''")[1])).toBe("קורות חיים.pdf");
  });
});

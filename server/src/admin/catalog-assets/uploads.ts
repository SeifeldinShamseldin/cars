import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const catalogAssetsDir = path.resolve(__dirname, "../../../public/catalog");

type UploadedFile = {
  fileName: string;
  contentType: string;
  content: Buffer;
};

type MultipartFormData = {
  fields: Record<string, string>;
  files: Record<string, UploadedFile[]>;
};

const inferExtension = ({
  fileName,
  contentType,
}: Pick<UploadedFile, "fileName" | "contentType">): string => {
  const rawExtension = path.extname(fileName).toLowerCase();
  if (rawExtension === ".png" || rawExtension === ".jpg" || rawExtension === ".jpeg" || rawExtension === ".webp") {
    return rawExtension;
  }

  if (contentType === "image/png") {
    return ".png";
  }
  if (contentType === "image/webp") {
    return ".webp";
  }
  if (contentType === "image/jpeg") {
    return ".jpg";
  }

  return ".bin";
};

const extractBoundary = (contentTypeHeader: string | undefined): string | null => {
  if (!contentTypeHeader) {
    return null;
  }

  const match = contentTypeHeader.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match?.[1] ?? match?.[2] ?? null;
};

export const parseMultipartFormData = async (
  req: AsyncIterable<Buffer | string>,
  requestUrl: string,
  method: string,
  contentTypeHeader: string | undefined,
): Promise<MultipartFormData> => {
  const boundary = extractBoundary(contentTypeHeader);
  if (!boundary) {
    throw new Error("Missing multipart boundary");
  }

  const fields: Record<string, string> = {};
  const files: Record<string, UploadedFile[]> = {};

  const request = new Request(
    requestUrl,
    {
      method,
      headers: contentTypeHeader ? { "content-type": contentTypeHeader } : undefined,
      body: req as unknown as BodyInit,
      duplex: "half",
    } as RequestInit & { duplex: "half" },
  );

  const formData = await request.formData();

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      fields[key] = value;
      continue;
    }

    const fileName = value.name ? path.basename(value.name) : "";
    if (fileName.length === 0 || value.size === 0) {
      continue;
    }

    files[key] = [
      ...(files[key] ?? []),
      {
        fileName,
        contentType: value.type || "application/octet-stream",
        content: Buffer.from(await value.arrayBuffer()),
      },
    ];
  }

  return { fields, files };
};

export const saveUploadedCatalogImages = (
  uploadedFiles: UploadedFile[],
  prefix: string,
): string[] => {
  if (uploadedFiles.length === 0) {
    return [];
  }

  mkdirSync(catalogAssetsDir, { recursive: true });

  return uploadedFiles.map((file, index) => {
    const extension = inferExtension(file);
    const storedFileName = `${prefix}-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}${extension}`;
    writeFileSync(path.join(catalogAssetsDir, storedFileName), file.content);
    return `/assets/catalog/${storedFileName}`;
  });
};

export const cleanupCatalogImages = (imagePaths: string[]): void => {
  for (const imagePath of imagePaths) {
    if (!imagePath.startsWith("/assets/catalog/")) {
      continue;
    }

    const fileName = path.basename(imagePath);

    try {
      unlinkSync(path.join(catalogAssetsDir, fileName));
    } catch {
      // Best effort only.
    }
  }
};

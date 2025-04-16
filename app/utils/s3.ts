import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.COMMON_AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.COMMON_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.COMMON_AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * S3에 파일을 업로드하고 파일의 URL을 반환합니다.
 * @param file - 업로드할 파일 또는 Blob
 * @param key - S3 저장 경로
 * @param contentType - 파일의 MIME 타입
 * @returns 업로드된 파일의 URL
 * @throws {Error} 파일 업로드 실패 시 에러
 */
export async function uploadToS3(
  file: Blob,
  key: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.COMMON_AWS_S3_BUCKET || "";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `https://${bucket}.s3.${process.env.COMMON_AWS_REGION}.amazonaws.com/${key}`;
}

export async function getSignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const bucket = process.env.COMMON_AWS_S3_BUCKET || "";
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return awsGetSignedUrl(s3Client, command, { expiresIn });
}

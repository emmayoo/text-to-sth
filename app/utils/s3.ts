import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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
  file: File | Blob,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("파일 업로드 중 에러 발생:", error);
    throw new Error("파일 업로드에 실패했습니다.");
  }
}

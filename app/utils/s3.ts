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
 * S3에서 파일을 가져옵니다.
 * @param key - S3 객체 키
 * @returns 파일 버퍼
 */
export async function getFromS3(key: string): Promise<Buffer> {
  try {
    const bucket = process.env.COMMON_AWS_S3_BUCKET || "";
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const arrayBuffer = await response.Body?.transformToByteArray();
    if (!arrayBuffer) {
      throw new Error("파일을 읽을 수 없습니다");
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("S3에서 파일 가져오기 실패:", error);
    throw new Error("S3에서 파일을 가져오는데 실패했습니다");
  }
}

/**
 * S3에 파일을 업로드하고 파일의 URL을 반환합니다.
 * @param file - 업로드할 파일 또는 Blob
 * @param key - S3 저장 경로 (temp/ 폴더 내에 저장됨)
 * @param contentType - 파일의 MIME 타입
 * @returns 업로드된 파일의 URL
 */
export async function uploadToS3(
  file: Blob,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const bucket = process.env.COMMON_AWS_S3_BUCKET || "";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // key가 temp/로 시작하지 않으면 추가
    const s3Key = key.startsWith("temp/") ? key : `temp/${key}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `https://${bucket}.s3.${process.env.COMMON_AWS_REGION}.amazonaws.com/${s3Key}`;
  } catch (error) {
    console.error("파일 업로드 중 에러 발생:", error);
    throw new Error("파일 업로드에 실패했습니다.");
  }
}

/**
 * S3 객체에 대한 서명된 URL을 생성합니다.
 * @param key - S3 객체 키 (temp/ 폴더 내의 경로)
 * @param expiresIn - URL 만료 시간(초), 기본값 1시간
 * @returns 서명된 URL
 */
export async function getSignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const bucket = process.env.COMMON_AWS_S3_BUCKET || "";
    // key가 temp/로 시작하지 않으면 추가
    const s3Key = key.startsWith("temp/") ? key : `temp/${key}`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    return awsGetSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("서명된 URL 생성 중 에러 발생:", error);
    throw new Error("서명된 URL 생성에 실패했습니다.");
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { uploadToS3, getSignedUrl } from "@/app/utils/s3";

interface SaveItem {
  path: string;
  type: "images" | "videos" | "audio";
  name?: string;
  description?: string;
  isExternalUrl?: boolean;
}

interface SavedItem extends SaveItem {
  s3Url: string;
  signedUrl: string;
}

async function downloadFile(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data);
}

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: SaveItem[] };

    if (!items) {
      return NextResponse.json(
        { error: "저장할 항목이 없습니다." },
        { status: 400 }
      );
    }

    // S3에 파일 업로드 및 URL 수집
    const uploadedItems: SavedItem[] = await Promise.all(
      items.map(async (item: SaveItem) => {
        let fileContent: Buffer;
        let fileName: string;

        if (item.isExternalUrl) {
          // 외부 URL인 경우 파일 다운로드
          fileContent = await downloadFile(item.path);
          fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

          // 파일 확장자 결정
          if (item.type === "images") fileName += ".png";
          else if (item.type === "videos") fileName += ".mp4";
          else if (item.type === "audio") fileName += ".mp3";
        } else {
          // 로컬 파일인 경우 기존 로직 사용
          const filePath = path.join(process.cwd(), "public", item.path);
          fileContent = await fs.readFile(filePath);
          fileName = path.basename(item.path);
        }

        const fileBlob = new Blob([fileContent]);

        // 파일 타입 결정
        let contentType = "application/octet-stream";
        if (item.type === "images") contentType = "image/png";
        else if (item.type === "videos") contentType = "video/mp4";
        else if (item.type === "audio") contentType = "audio/mp3";

        // S3에 업로드 (temp 폴더 사용)
        const s3Key = `${item.type}/${fileName}`;
        const s3Url = await uploadToS3(fileBlob, s3Key, contentType);
        const signedUrl = await getSignedUrl(s3Key);

        return {
          ...item,
          s3Url,
          signedUrl,
        };
      })
    );

    // 저장 정보를 JSON 파일로 저장
    const savedItems = {
      timestamp: new Date().toISOString(),
      items: uploadedItems,
    };

    const filename = `saved_${Date.now()}.json`;
    const jsonKey = `temp/saved/${filename}`;

    // JSON 파일을 S3에 업로드
    const jsonBlob = new Blob([JSON.stringify(savedItems, null, 2)]);
    await uploadToS3(jsonBlob, jsonKey, "application/json");

    return NextResponse.json({
      success: true,
      filename,
      items: uploadedItems,
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

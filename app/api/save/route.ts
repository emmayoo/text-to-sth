import { NextResponse } from "next/server";
import { uploadToS3 } from "@/app/utils/s3";

interface SaveItem {
  id: string;
  url: string;
  description: string;
  type: "audio" | "images" | "videos";
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

    // 선택된 항목들의 정보를 저장
    const savedItems = {
      timestamp: new Date().toISOString(),
      items,
    };

    // JSON 파일로 저장하여 S3에 업로드
    const filename = `saved_${Date.now()}.json`;
    const jsonBlob = new Blob([JSON.stringify(savedItems, null, 2)], {
      type: "application/json",
    });

    // temp/saved 폴더에 JSON 파일 저장
    const s3Key = `temp/saved/${filename}`;
    await uploadToS3(jsonBlob, s3Key, "application/json");

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

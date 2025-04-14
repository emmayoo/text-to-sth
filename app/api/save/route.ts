import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function cleanupFiles(extra: "audio" | "images") {
  const imageDir = path.join(process.cwd(), "public", extra);
  try {
    const files = await fs.readdir(imageDir);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(imageDir, file)))
    );
  } catch (error) {
    console.error(`Error cleaning up ${extra} files:`, error);
  }
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items) {
      return NextResponse.json(
        { error: "저장할 항목이 없습니다." },
        { status: 400 }
      );
    }

    // 저장 디렉토리 생성
    const saveDir = path.join(process.cwd(), "public", "saved");
    try {
      await fs.access(saveDir);
    } catch {
      await fs.mkdir(saveDir, { recursive: true });
    }

    // 선택된 항목들의 정보를 저장
    const savedItems = {
      timestamp: new Date().toISOString(),
      items,
    };

    const filename = `saved_${Date.now()}.json`;
    await fs.writeFile(
      path.join(saveDir, filename),
      JSON.stringify(savedItems, null, 2)
    );

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

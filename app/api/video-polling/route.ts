import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

const runwayClient = new RunwayML();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  console.log("taskId", taskId);

  if (!taskId) {
    return NextResponse.json({
      error: "taskId is required",
    });
  }

  try {
    const task = await runwayClient.tasks.retrieve(taskId);
    console.log("Current task status:", task);

    if (task.status === "FAILED") {
      return NextResponse.json({
        id: taskId,
        status: "FAILED",
        url: "",
        description: "RunwayML로 생성 실패",
      });
    }

    if (task.status === "SUCCEEDED") {
      return NextResponse.json({
        id: taskId,
        status: "SUCCEEDED",
        url: task.output?.[0] as string,
        description: "RunwayML로 생성된 비디오",
      });
    }

    // PROCESSING 상태
    return NextResponse.json({
      id: taskId,
      status: "PROCESSING",
      description: "비디오 생성 중...",
    });
  } catch (error) {
    console.error("Error retrieving task status:", error);
    return NextResponse.json(
      {
        error: "비디오 상태 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

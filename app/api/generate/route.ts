import { NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { v2 } from "@google-cloud/translate";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import RunwayML from "@runwayml/sdk";

import { GeneratedItem } from "@/app/types";
import { VOICE_CONFIGS } from "@/app/constants";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const runwayClient = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY });

const translate = new v2.Translate({
  key: process.env.GOOGLE_API_KEY,
});

async function translateText(text: string, targetLang = "en") {
  const [translation] = await translate.translate(text, targetLang);
  console.log("--------------------------------");
  console.log(`Original: ${text}`);
  console.log(`Translated: ${translation}`);
  console.log("--------------------------------");
  return translation;
}

export async function POST(req: Request) {
  const { text, type, voiceIndex, imagePrompt, imageType, imageUrl } =
    await req.json();

  if (!text) {
    return NextResponse.json(
      { error: "텍스트는 필수입니다." },
      { status: 400 }
    );
  }

  if (type === "audio") {
    const { audio, status } = await generateAudio(text, voiceIndex);
    return NextResponse.json(audio, { status });
  }

  if (type === "image") {
    const image = await generateImage(text, imagePrompt);
    return NextResponse.json(image);
  }

  if (type === "video") {
    const video = await generateVideo(text, imageType, imageUrl);
    return NextResponse.json(video);
  }
}

async function generateAudio(
  text: string,
  voiceIndex: number = 0
): Promise<{ audio: GeneratedItem | string; status: number }> {
  let status = 200;
  if (voiceIndex < 0 || voiceIndex >= VOICE_CONFIGS.length) {
    status = 400;
    return { audio: "잘못된 음성 인덱스입니다.", status };
  }

  const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  const credentials = JSON.parse(
    Buffer.from(base64!, "base64").toString("utf8")
  );

  const client = new TextToSpeechClient({ credentials });
  const audioDir = path.join(process.cwd(), "public", "audio");

  // 디렉토리가 없으면 생성
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // 음성 설정 선택
  const config = VOICE_CONFIGS[voiceIndex];

  // 선택된 음성 설정으로 TTS 생성
  const request = {
    input: { text },
    voice: {
      languageCode: config.languageCode,
      name: config.name,
    },
    audioConfig: { audioEncoding: "MP3" as const },
  };

  const [response] = await client.synthesizeSpeech(request);
  const audioId = uuidv4();
  const audioPath = path.join(audioDir, `${audioId}.mp3`);

  await fs.promises.writeFile(audioPath, response.audioContent as Buffer);

  return {
    audio: {
      id: audioId,
      url: `/audio/${audioId}.mp3`,
      description: config.description,
    },
    status,
  };
}

async function generateImage(
  text: string,
  imagePrompt?: string
): Promise<GeneratedItem> {
  return {
    id: "9e5d7e9d-5498-40e4-a8ec-d1728afac076" + Date.now(),
    url: `/images/9e5d7e9d-5498-40e4-a8ec-d1728afac076.png`,
    description: "DALL·E 2로 생성된 이미지",
  };
  // 기본 프롬프트와 사용자 프롬프트 조합
  const finalPrompt = `${text}. ${imagePrompt || ""}`.trim();
  console.log("finalPrompt", finalPrompt);

  const inputs = await translateText(finalPrompt);
  console.log("prompt (generateImage)", inputs);

  const response = await openaiClient.images.generate({
    model: "dall-e-2",
    prompt: inputs,
    n: 1,
    size: "1024x1024",
    response_format: "url", // b64_json
  });

  const imageUrl = response.data[0].url;

  return {
    id: uuidv4(),
    url: imageUrl as string,
    description: "DALL·E 2로 생성된 이미지",
  };
}

async function generateVideo(
  prompt: string,
  imageType: "url" | "base64",
  imageUrl: string
): Promise<GeneratedItem> {
  return {
    id: "1455e3bc-5ef7-4240-911b-d4f390bbed96" + Date.now(),
    url: `/videos/1455e3bc-5ef7-4240-911b-d4f390bbed96.mp4`,
    description: "RunwayML로 생성된 비디오",
  };
  const videoDir = path.join(process.cwd(), "public", "videos");

  // 디렉토리가 없으면 생성
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  try {
    // 1. 비디오 생성 요청
    const imageToVideo = await runwayClient.imageToVideo.create({
      model: "gen4_turbo",
      promptImage: imageUrl,
      promptText: prompt,
    });

    console.log("imageToVideo", imageToVideo);
    const taskId = imageToVideo.id;

    // Poll the task until it's complete
    let task: Awaited<ReturnType<typeof runwayClient.tasks.retrieve>>;
    do {
      // Wait for ten seconds before polling
      await new Promise((resolve) => setTimeout(resolve, 10000));

      task = await runwayClient.tasks.retrieve(taskId);
    } while (!["SUCCEEDED", "FAILED"].includes(task.status));

    console.log("Task complete:", task);

    // {
    //   "id": "d2e3d1f4-1b3c-4b5c-8d46-1c1d7ee86892",
    //   "status": "SUCCEEDED",
    //   "createdAt": "2024-06-27T19:49:32.335Z",
    //   "output": [
    //     "https://dnznrvs05pmza.cloudfront.net/output.mp4?_jwt=..."
    //   ]
    // }
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}

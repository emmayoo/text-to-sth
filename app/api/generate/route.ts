import { NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { v2 } from "@google-cloud/translate";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import RunwayML from "@runwayml/sdk";

import { GeneratedItem } from "@/app/types";
import { VOICE_CONFIGS } from "@/app/constants";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const runwayClient = new RunwayML(); // apiKey: process.env.RUNWAYML_API_SECRET

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
  const {
    text,
    type,
    voiceIndex,
    imagePrompt,
    videoPrompt,
    imageType,
    imageUrl,
  } = await req.json();

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
    const video = await generateVideo(text, imageType, imageUrl, videoPrompt);
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

  // production 환경에서는 /tmp 디렉토리 사용
  const isProduction = process.env.NODE_ENV === "production";
  const audioDir = isProduction
    ? "/tmp/audio"
    : path.join(process.cwd(), "public", "audio");

  try {
    await fs.access(audioDir);
  } catch {
    await fs.mkdir(audioDir, { recursive: true });
  }

  const config = VOICE_CONFIGS[voiceIndex];

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

  await fs.writeFile(audioPath, response.audioContent as Buffer);

  // production 환경에서는 파일을 public 디렉토리로 복사
  if (isProduction) {
    const publicDir = path.join(process.cwd(), "public", "audio");
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }
    await fs.copyFile(audioPath, path.join(publicDir, `${audioId}.mp3`));
  }

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
  const inputs = await translateText(`${text}. ${imagePrompt || ""}`);
  console.log("prompt (generateImage)", inputs);

  const response = await openaiClient.images.generate({
    model: "dall-e-3",
    prompt: inputs,
    n: 1,
    size: "1024x1024",
    response_format: "url", // b64_json
  });
  console.log("response", response);

  const imageUrl = response.data[0].url;

  return {
    id: uuidv4(),
    url: imageUrl as string,
    description: "DALL·E 2로 생성된 이미지",
  };
}

async function generateVideo(
  text: string,
  imageType: "url" | "base64",
  imageUrl: string,
  videoPrompt: string
): Promise<GeneratedItem> {
  const translated = await translateText(`${text}. ${videoPrompt}`);
  console.log(imageType, imageUrl);

  const imageToVideo = await runwayClient.imageToVideo.create({
    model: "gen3a_turbo",
    promptImage: imageUrl,
    promptText: translated,
    ratio: "1280:768",
    duration: 5,
  });

  console.log("imageToVideo", imageToVideo);

  const taskId = imageToVideo.id;

  // Poll the task until it's complete
  let task: Awaited<ReturnType<typeof runwayClient.tasks.retrieve>>;
  do {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    task = await runwayClient.tasks.retrieve(taskId);
  } while (!["SUCCEEDED", "FAILED"].includes(task.status));

  console.log("Task complete:", task);

  if (task.status === "FAILED") {
    return {
      id: taskId,
      url: "",
      description: "RunwayML로 생성 실패",
    };
  }

  return {
    id: taskId,
    url: task.output?.[0] as string,
    description: "RunwayML로 생성된 비디오",
  };
}

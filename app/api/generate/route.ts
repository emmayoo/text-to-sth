import { NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { v2 } from "@google-cloud/translate";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

import { GeneratedItem } from "@/app/types";
import { VOICE_CONFIGS } from "@/app/constants";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const { text, type, voiceIndex, imagePrompt } = await req.json();

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
    const video = await generateVideo(text);
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
  text: string
  // videoPrompt?: string
): Promise<GeneratedItem> {
  const videoDir = path.join(process.cwd(), "public", "videos");

  // 디렉토리가 없으면 생성
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // const inputs = await translateText(text);
  // console.log("prompt (generateVideo)", inputs);

  try {
    // 1. 비디오 생성 요청
    const createResponse = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.DID_API_KEY}`,
      },
      body: JSON.stringify({
        script: {
          type: "text",
          subtitles: "false",
          input: text,
          provider: {
            type: "microsoft",
            voice_id: "Sara",
          },
          ssml: "false",
        },
        config: {
          fluent: "false",
        },
        source_url:
          "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg",
      }),
    });

    console.log("createResponse", createResponse);

    if (!createResponse.ok) {
      throw new Error(`Video creation failed: ${createResponse.statusText}`);
    }

    const { id } = await createResponse.json();

    // 2. 생성 완료 대기 및 결과 확인
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // 최대 30번 시도 (약 5분)

    while (attempts < maxAttempts) {
      const checkResponse = await fetch(`https://api.d-id.com/talks/${id}`, {
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
        },
      });

      if (!checkResponse.ok) {
        throw new Error(
          `Failed to check video status: ${checkResponse.statusText}`
        );
      }

      const result = await checkResponse.json();

      if (result.status === "done") {
        videoUrl = result.result_url;
        break;
      } else if (result.status === "failed") {
        throw new Error("Video generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초 대기
      attempts++;
    }

    if (!videoUrl) {
      throw new Error("Video generation timed out");
    }

    // 3. 비디오 다운로드
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error("Failed to download video");
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoId = uuidv4();
    const videoPath = path.join(videoDir, `${videoId}.mp4`);

    await fs.promises.writeFile(videoPath, Buffer.from(videoBuffer));

    return {
      id: videoId,
      url: `/videos/${videoId}.mp4`,
      description: "D-ID로 생성된 비디오",
    };
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}

import { NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { v2 } from "@google-cloud/translate";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import RunwayML from "@runwayml/sdk";
import { uploadToS3, getSignedUrl, getFromS3 } from "@/app/utils/s3";

import { GeneratedItem } from "@/app/types";
import { VOICE_CONFIGS } from "@/app/constants";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const runwayClient = new RunwayML();

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
  const audioKey = `temp/audio/${audioId}.mp3`;

  // S3에 오디오 파일 업로드
  const audioBlob = new Blob([response.audioContent as Buffer]);
  await uploadToS3(audioBlob, audioKey, "audio/mp3");

  // 서명된 URL 생성
  const signedUrl = await getSignedUrl(audioKey);

  return {
    audio: {
      id: audioId,
      url: signedUrl,
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
    response_format: "url",
  });

  const imageUrl = response.data[0].url;
  const imageId = uuidv4();
  const imageKey = `temp/images/${imageId}.png`;

  // 이미지 다운로드 및 S3 업로드
  const imageResponse = await fetch(imageUrl as string);
  const imageBlob = await imageResponse.blob();
  await uploadToS3(imageBlob, imageKey, "image/png");

  // 서명된 URL 생성
  const signedUrl = await getSignedUrl(imageKey);

  return {
    id: imageId,
    url: signedUrl,
    description: "DALL·E 2로 생성된 이미지",
  };
}

async function generateVideo(text: string): Promise<GeneratedItem> {
  try {
    // S3에서 이미지 가져오기
    const imageBuffer = await getFromS3("avatar.png");
    const base64Image = imageBuffer.toString("base64");
    console.log("이미지를 Base64로 변환 완료");

    const translatedText = await translateText(text);
    const promptText = `A realistic or stylized avatar character speaking the phrase '${translatedText}' with accurate lip-sync, front-facing, neutral background, duration under 4 seconds, close-up shot focusing on the face and mouth movements, natural lighting, high-quality animation.`;
    console.log("promptText (generateVideo)", promptText);
    // RunwayML API 호출
    const task = await runwayClient.imageToVideo.create({
      model: "gen3a_turbo",
      promptImage: `data:image/png;base64,${base64Image}`,
      promptText: promptText,
      ratio: "1280:768",
      duration: 5,
    });

    const taskId = task.id;

    // 3. 생성 완료 대기 및 결과 확인
    let taskResult;
    let attempts = 0;
    const maxAttempts = 30; // 최대 30번 시도 (약 5분)

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초 대기
      taskResult = await runwayClient.tasks.retrieve(taskId);

      if (taskResult.status === "SUCCEEDED") {
        break;
      } else if (taskResult.status === "FAILED") {
        throw new Error("비디오 생성 실패");
      }

      attempts++;
    }

    if (!taskResult || taskResult.status !== "SUCCEEDED") {
      throw new Error("비디오 생성 시간 초과");
    }

    const videoUrl = taskResult.output?.[0] as string;
    if (!videoUrl) {
      throw new Error("비디오 URL을 찾을 수 없습니다");
    }

    const videoId = uuidv4();
    const videoKey = `temp/videos/${videoId}.mp4`;

    // 4. 비디오 다운로드 및 S3 업로드
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error("비디오 다운로드 실패");
    }

    const videoBlob = await videoResponse.blob();
    await uploadToS3(videoBlob, videoKey, "video/mp4");

    // 서명된 URL 생성
    const signedUrl = await getSignedUrl(videoKey);

    return {
      id: videoId,
      url: signedUrl,
      description: "RunwayML로 생성된 비디오",
    };
  } catch (error) {
    console.error("비디오 생성 오류:", error);
    return {
      id: "" + Date.now(),
      url: "",
      description: "비디오 생성 실패",
    };
  }
}

"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDoubleRightIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

import type { GeneratedItem } from "@/app/types";
import { Audios, Images, Videos } from "@/app/components";
import { createDefaultImagePrompt } from "@/app/utils";
import { LoadingIcon } from "@/app/components/icons";
import { GenerationResult } from "@/app/types";
import Link from "next/link";

interface VideoGenerationResponse {
  id: string;
  url: string;
  status?: "SUCCEEDED" | "FAILED" | "PROCESSING";
  description?: string;
}

const MAX_POLLING_ATTEMPTS = 30; // 5분 (10초 간격)
const POLLING_INTERVAL = 10000; // 10초
const AXIOS_TIMEOUT = 60 * 5 * 1000; // 5분

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [step, setStep] = useState<"input" | "audio" | "image" | "video">(
    "input"
  );
  const [imagePrompt, setImagePrompt] = useState("");

  const [audio, setAudio] = useState<GeneratedItem | null>(null);
  const [image, setImage] = useState<GeneratedItem | null>(null);
  const [video, setVideo] = useState<GeneratedItem | null>(null);

  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null);

  const generate = async (
    text: string,
    type: string,
    options?: {
      voiceIndex?: number;
      imagePrompt?: string;
      videoPrompt?: string;
      imageUrl?: string;
      imageType?: "url" | "base64";
    }
  ) => {
    try {
      const response = await axios.post("/api/generate", {
        text,
        type,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(`${type} 생성 중 오류가 발생했습니다.`);
      throw error;
    }
  };

  const handleGenerateAudio = async () => {
    const result = await generate(text, "audio", { voiceIndex: 0 });
    setAudio(result);
    toast.success("음성이 생성되었습니다!");
  };

  const handleGenerateImage = async () => {
    const result = await generate(text, "image", { imagePrompt });
    setImage(result);
    toast.success("이미지가 생성되었습니다!");
  };

  const handleGenerateAudioAndImage = async () => {
    if (!text.trim()) {
      toast.error("텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await handleGenerateAudio();
      await handleGenerateImage();
      setStep("video");
    } catch (error) {
      console.error("Audio and image generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const pollVideoGeneration = async (
    taskId: string
  ): Promise<VideoGenerationResponse> => {
    let attempts = 0;

    while (attempts < MAX_POLLING_ATTEMPTS) {
      try {
        const response = await axios.get<VideoGenerationResponse>(
          `/api/video-polling?taskId=${taskId}`,
          {
            timeout: AXIOS_TIMEOUT,
          }
        );

        if (response.data.status === "SUCCEEDED") {
          return response.data;
        }
        if (response.data.status === "FAILED") {
          throw new Error("비디오 생성에 실패했습니다.");
        }

        // PROCESSING 상태이면 계속 폴링
        attempts++;
        if (attempts < MAX_POLLING_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            throw new Error("요청 시간이 초과되었습니다.");
          }
          // 504 에러는 계속 시도
          if (error.response?.status !== 504) {
            throw error;
          }
        }
        attempts++;
        if (attempts < MAX_POLLING_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
        }
      }
    }

    throw new Error("시간 초과: 비디오 생성이 완료되지 않았습니다.");
  };

  const handleGenerateVideo = async (
    prompt: string,
    imageType: "url" | "base64",
    imageUrl: string
  ) => {
    setLoading(true);

    try {
      // 초기 비디오 생성 요청
      const initResult = await generate(text, "video", {
        videoPrompt: prompt,
        imageType,
        imageUrl,
      });

      console.log("initResult", initResult);

      if (!initResult.taskId) {
        throw new Error("작업 ID를 받지 못했습니다.");
      }

      // 상태 폴링 시작
      const result = await pollVideoGeneration(initResult.taskId);

      if (!result.url) {
        throw new Error("비디오 URL을 받지 못했습니다.");
      }

      setVideo({
        id: result.id,
        url: result.url,
        description: result.description || "생성된 비디오",
      });
      toast.success("비디오가 생성되었습니다!");
    } catch (error) {
      console.error("Video generation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "비디오 생성 중 오류가 발생했습니다.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type: keyof GenerationResult, id: string) => {
    if (type === "audios") {
      setSelectedAudioId(selectedAudioId === id ? null : id);
    } else if (type === "images") {
      setSelectedImageId(selectedImageId === id ? null : id);
    } else if (type === "videos") {
      setSelectedVideoId(selectedVideoId === id ? null : id);
    }
  };

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    setImagePrompt(createDefaultImagePrompt(value));
  };

  const handleSave = async () => {
    const selectedItems = [];

    if (selectedAudioId && audio) {
      const audioPath = audio.url.replace(/^\//, "");
      selectedItems.push({
        path: audioPath,
        type: "audio",
        name: "Generated Audio",
        description: text,
        isExternalUrl: !audio.url.startsWith("/"),
      });
    }

    if (selectedImageId && image) {
      const imagePath = image.url.replace(/^\//, "");
      selectedItems.push({
        path: imagePath,
        type: "images",
        name: "Generated Image",
        description: imagePrompt,
        isExternalUrl: !image.url.startsWith("/"),
      });
    }

    if (selectedVideoId && video) {
      const videoPath = video.url.replace(/^\//, "");
      selectedItems.push({
        path: videoPath,
        type: "videos",
        name: "Generated Video",
        description: text,
        isExternalUrl: !video.url.startsWith("/"),
      });
    }

    if (selectedItems.length === 0) {
      toast.error("저장할 항목을 선택해주세요.");
      return;
    }

    setSaveLoading(true);
    try {
      const response = await axios.post("/api/save", { items: selectedItems });
      if (response.data.success) {
        toast.success("선택한 항목들이 성공적으로 저장되었습니다!");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col justify-center items-center mb-4 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-center mb-3 bg-gradient-to-r to-purple-500 from-blue-500 bg-clip-text text-transparent">
              Text to Multi-Media Generator
            </h1>
            <p className="text-gray-500 text-center">
              텍스트를 음성, 이미지, 비디오로 변환해보세요
            </p>
          </div>

          {(selectedAudioId || selectedImageId || selectedVideoId) && (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl
                hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <LoadingIcon className="w-5 h-5" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    <span>선택항목 저장</span>
                  </>
                )}
              </button>
              <Link
                href="https://ap-northeast-2.console.aws.amazon.com/s3/buckets/text-to-sth"
                target="_blank"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl
                hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                S3
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* 텍스트 입력 & 음성 생성 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="text-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  변환할 텍스트
                </label>
                <div className="flex gap-3">
                  <input
                    id="text-input"
                    value={text}
                    onChange={handleText}
                    placeholder="변환하고 싶은 텍스트를 입력하세요"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all duration-200"
                    disabled={loading || step !== "input"}
                  />
                  <button
                    onClick={handleGenerateAudioAndImage}
                    disabled={loading || step !== "input"}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl
                      hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {loading ? (
                      <>
                        <LoadingIcon className="w-5 h-5" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>생성하기</span>
                        <ChevronDoubleRightIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 생성된 결과물 */}
          <div className="space-y-8">
            {/* 생성된 음성 */}
            {audio && (
              <Audios
                text={text}
                audio={audio}
                selectedId={selectedAudioId}
                handleSelect={handleSelect}
              />
            )}

            {/* 생성된 이미지 */}
            {image && (
              <Images
                text={text}
                image={image}
                selectedId={selectedImageId}
                handleSelect={handleSelect}
                setSelectedImageURL={setSelectedImageURL}
              />
            )}

            {/* 생성된 비디오 */}
            {step === "video" && (
              <Videos
                text={text}
                video={video}
                selectedId={selectedVideoId}
                selectedImageURL={selectedImageURL}
                handleSelect={handleSelect}
                handleGenerateVideo={handleGenerateVideo}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

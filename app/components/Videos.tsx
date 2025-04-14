"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircleIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

import type { GeneratedItem, GenerationResult } from "@/app/types";
//import { createDefaultVideoPrompt } from "@/app/lib/utils";
interface VideosProps {
  text: string;
  video: GeneratedItem | null;
  selectedId: string | null;
  handleSelect: (type: keyof GenerationResult, id: string) => void;
}

export default function Videos({
  text,
  video: initialVideo,
  selectedId,
  handleSelect,
}: VideosProps) {
  const [videos, setVideos] = useState<GeneratedItem[]>(
    initialVideo ? [initialVideo] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  // const [videoPrompt, setVideoPrompt] = useState<string>("");

  const handleRegenerateVideo = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/generate", {
        text: text,
        type: "image",
      });
      setVideos((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error("Video generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO. fix
  useEffect(() => {
    if (initialVideo) {
      setVideos([initialVideo]);
    }
  }, [initialVideo]);

  // useEffect(() => {
  //   setVideoPrompt(createDefaultVideoPrompt(text));
  // }, [text]);

  useEffect(() => {
    if (selectedId) {
      setVideos((prev) =>
        prev.map((item) => ({ ...item, selected: item.id === selectedId }))
      );
    }
  }, [selectedId]);

  if (!initialVideo) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <VideoCameraIcon className="w-5 h-5" />
        <span>비디오</span>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRegenerateVideo}
            disabled={isLoading}
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "생성 중..." : "다시 생성"}
          </button>
        </div>
      </h2>

      {/* <textarea
        value={videoPrompt}
        onChange={(e) => setVideoPrompt(e.target.value)}
        placeholder="비디오 생성을 위한 추가 프롬프트를 입력하세요..."
        className="px-3 w-full h-14 py-1 border rounded text-sm bg-white text-gray-700"
        disabled={isLoading}
      /> */}

      <div className="grid grid-cols-2 gap-4">
        {videos.map((item) => (
          <div
            key={item.id}
            className={`relative border-2 rounded-lg p-2 cursor-pointer
            ${item.selected ? "border-blue-500" : "border-gray-200"}`}
            onClick={() => handleSelect("videos", item.id)}
          >
            {item.selected && (
              <CheckCircleIcon className="absolute top-2 right-2 w-6 h-6 text-blue-500" />
            )}
            <video controls className="w-full h-full object-cover">
              <source src={item.url} type="video/mp4" />
            </video>
          </div>
        ))}
      </div>
    </div>
  );
}

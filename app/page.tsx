"use client";

import { useState } from "react";
import { GenerationResult } from "./types";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

import type { GeneratedItem } from "@/app/types";
import { Audios, Images, Videos } from "@/app/components";
import {
  createDefaultImagePrompt,
  createDefaultVideoPrompt,
} from "./lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [audio, setAudio] = useState<GeneratedItem | null>(null);
  const [image, setImage] = useState<GeneratedItem | null>(null);
  const [video, setVideo] = useState<GeneratedItem | null>(null);

  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const generate = async (
    text: string,
    type: string,
    options?: {
      voiceIndex?: number;
      imagePrompt?: string;
      videoPrompt?: string;
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
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const [v, i, a] = await Promise.all([
        generate(text, "video", {
          videoPrompt: createDefaultVideoPrompt(text),
        }),
        generate(text, "image", {
          imagePrompt: createDefaultImagePrompt(text),
        }),
        generate(text, "audio", { voiceIndex: 0 }),
      ]);

      setVideo(v);
      setImage(i);
      setAudio(a);

      toast.success("모든 미디어가 생성되었습니다!");
    } catch (error) {
      console.error("Generation error:", error);
      if (error instanceof AxiosError) {
        toast.error(error.message || "오류가 발생했습니다. 다시 시도해주세요.");
      } else {
        toast.error("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  // s3에 저장
  const handleSave = async () => {};

  const handleSelect = (type: keyof GenerationResult, id: string) => {
    if (type === "audios") {
      setSelectedAudioId(id);
    } else if (type === "images") {
      setSelectedImageId(id);
    } else if (type === "videos") {
      setSelectedVideoId(id);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Text to Multi-Media Generator
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="변환하고 싶은 텍스트를 입력하세요..."
              className="w-full h-32 p-4 border rounded-lg mb-4 resize-none text-black"
              disabled={loading}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "생성 중..." : "모든 미디어 생성하기"}
            </button>
          </div>

          <div className="space-y-6">
            <Audios
              text={text}
              audio={audio}
              selectedId={selectedAudioId}
              handleSelect={handleSelect}
            />
            <Images
              text={text}
              image={image}
              selectedId={selectedImageId}
              handleSelect={handleSelect}
            />
            <Videos
              text={text}
              video={video}
              selectedId={selectedVideoId}
              handleSelect={handleSelect}
            />
          </div>

          {audio && image && video && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                선택한 결과물 저장하기
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

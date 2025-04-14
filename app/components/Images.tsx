"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircleIcon, PhotoIcon } from "@heroicons/react/24/outline";

import type { GeneratedItem, GenerationResult } from "@/app/types";
import Image from "next/image";
import { createDefaultImagePrompt } from "@/app/lib/utils";

interface ImagesProps {
  text: string;
  image: GeneratedItem | null;
  selectedId: string | null;
  handleSelect: (type: keyof GenerationResult, id: string) => void;
}

export default function Images({
  text,
  image: initialImage,
  selectedId,
  handleSelect,
}: ImagesProps) {
  const [images, setImages] = useState<GeneratedItem[]>(
    initialImage ? [initialImage] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState<string>("");

  const handleRegenerateImage = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/generate", {
        text: text,
        type: "image",
        imagePrompt,
      });
      setImages((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO. fix
  useEffect(() => {
    if (initialImage) {
      setImages([initialImage]);
    }
  }, [initialImage]);

  useEffect(() => {
    setImagePrompt(createDefaultImagePrompt(text));
  }, [text]);

  useEffect(() => {
    if (selectedId) {
      setImages((prev) =>
        prev.map((item) => ({ ...item, selected: item.id === selectedId }))
      );
    }
  }, [selectedId]);

  if (!initialImage) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PhotoIcon className="w-5 h-5" />
        <span>이미지</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRegenerateImage}
            disabled={isLoading}
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "생성 중..." : "다시 생성"}
          </button>
        </div>
      </h2>

      <textarea
        value={imagePrompt}
        onChange={(e) => setImagePrompt(e.target.value)}
        placeholder="이미지 생성을 위한 추가 프롬프트를 입력하세요..."
        className="px-3 w-full h-14 py-1 border rounded text-sm bg-white text-gray-700"
        disabled={isLoading}
      />
      <div className="grid grid-cols-2 gap-4">
        {images.map((item) => (
          <div
            key={item.id}
            className={`relative border-2 rounded-lg p-2 cursor-pointer
                ${item.selected ? "border-blue-500" : "border-gray-200"}`}
            onClick={() => handleSelect("images", item.id)}
          >
            {item.selected && (
              <CheckCircleIcon className="absolute top-2 right-2 w-6 h-6 text-blue-500" />
            )}

            <div>
              <Image
                src={item.url}
                alt={`${text} images`}
                className="w-full h-full object-cover"
                width={160}
                height={160}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  PhotoIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import type { GeneratedItem, GenerationResult } from "@/app/types";
import Image from "next/image";
import { createDefaultImagePrompt } from "@/app/lib/utils";
import { CopyLinkIcon, LoadingIcon } from "@/app/components/icons";
import { toast } from "react-hot-toast";

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

  const handleClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>,
    id: string,
    url?: string
  ) => {
    e.stopPropagation();

    if (e.target instanceof HTMLButtonElement) {
      navigator.clipboard
        .writeText(url ?? "")
        .then(() => {
          toast.success("URL이 복사되었습니다!");
        })
        .catch(() => {
          toast.error("URL 복사 실패");
        });
      return;
    }

    handleSelect("images", id);
  };

  useEffect(() => {
    if (initialImage) {
      setImages([initialImage]);
    }
  }, [initialImage]);

  useEffect(() => {
    setImagePrompt(createDefaultImagePrompt(text));
  }, [text]);

  useEffect(() => {
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.id === selectedId,
      }))
    );
  }, [selectedId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
        <PhotoIcon className="w-6 h-6 text-green-500" />
        <span>이미지</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRegenerateImage}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
          >
            {isLoading ? (
              <>
                <LoadingIcon className="w-4 h-4" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4" />
                <span>다시 생성</span>
              </>
            )}
          </button>
        </div>
      </h2>

      <textarea
        value={imagePrompt}
        onChange={(e) => setImagePrompt(e.target.value)}
        placeholder="이미지 생성을 위한 추가 프롬프트를 입력하세요..."
        className="w-full px-4 py-3 mb-6 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none h-24"
        disabled={isLoading}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {images.map((item) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                ${
                  item.selected
                    ? "ring-2 ring-green-500 shadow-lg"
                    : "border border-gray-200 hover:border-green-300"
                }`}
              onClick={(e) => handleClick(e, item.id)}
            >
              <button
                className="absolute top-3 left-3 z-10 bg-white rounded-lg p-1 flex items-center gap-2 text-black"
                onClick={(e) => handleClick(e, item.id, item.url)}
              >
                URL <CopyLinkIcon className="w-4 h-4" />
              </button>

              {item.selected && (
                <div className="absolute top-3 right-3 z-10 bg-green-500 text-white rounded-full p-1">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              )}
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={item.url}
                  alt={`${text} images`}
                  className="object-cover transition-transform duration-200 hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

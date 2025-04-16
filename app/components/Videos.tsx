"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowPathIcon,
  ChevronDoubleRightIcon,
  CheckCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import type { GeneratedItem, GenerationResult } from "@/app/types";
import { LoadingIcon } from "@/app/components/icons";
import { createDefaultVideoPrompt } from "../utils";
import toast from "react-hot-toast";

interface VideosProps {
  text: string;
  video: GeneratedItem | null;
  selectedId: string | null;
  selectedImageURL: string | null;
  handleSelect: (type: keyof GenerationResult, id: string) => void;
  handleGenerateVideo: (
    prompt: string,
    imageType: "url" | "base64",
    imageUrl: string
  ) => void;
}

export default function Videos({
  text,
  video,
  selectedId,
  selectedImageURL,
  handleSelect,
  handleGenerateVideo,
}: VideosProps) {
  const [videos, setVideos] = useState<GeneratedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState<string>(
    createDefaultVideoPrompt(text)
  );
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<
    "url" | "upload" | "selected"
  >("url");
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setImageUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempImageUrl(e.target.value);
  };

  const handleUrlConfirm = async () => {
    if (!tempImageUrl.trim()) {
      alert("이미지 URL을 입력해주세요.");
      return;
    }

    setIsImageLoading(true);
    try {
      // CORS 오류 있어서 주석처리 함
      // 이미지 URL이 유효한지 확인
      // const response = await fetch(tempImageUrl);
      // if (!response.ok) {
      //   throw new Error("Invalid image URL");
      // }
      // const contentType = response.headers.get("content-type");
      // if (!contentType?.startsWith("image/")) {
      //   throw new Error("Invalid image type");
      // }

      setImageUrl(tempImageUrl);
      setUploadedImage(null);
    } catch (error) {
      console.error(error);
      alert("유효하지 않은 이미지 URL입니다.");
      setImageUrl("");
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!videoPrompt.trim()) {
      alert("비디오 생성을 위한 프롬프트를 입력해주세요.");
      return;
    }

    const finalImageUrl = uploadedImage || imageUrl;
    if (!finalImageUrl) {
      alert("비디오 생성을 위한 이미지를 선택하거나 URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await handleGenerateVideo(
        videoPrompt,
        imageUrl ? "url" : "base64",
        finalImageUrl
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      alert("비디오 생성을 위한 프롬프트를 입력해주세요.");
      return;
    }

    const finalImageUrl = uploadedImage || imageUrl;
    if (!finalImageUrl) {
      alert("비디오 생성을 위한 이미지를 선택하거나 URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await handleGenerateVideo(
        videoPrompt,
        imageUrl ? "url" : "base64",
        finalImageUrl
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSelectedImage = () => {
    if (!selectedImageURL) {
      toast.error("선택된 이미지가 없습니다.");
      return;
    }

    setImageInputType("selected");
    setImageUrl(selectedImageURL);
    setUploadedImage(null);
  };

  useEffect(() => {
    if (video) {
      setVideos((prev) => [video, ...prev]);
    }
  }, [video]);

  useEffect(() => {
    setVideos((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.id === selectedId,
      }))
    );
  }, [selectedId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
        <VideoCameraIcon className="w-6 h-6 text-purple-500" />
        <span>비디오</span>
        <div className="flex items-center gap-2 ml-auto">
          {!video ? (
            <button
              onClick={handleGenerateClick}
              disabled={
                isLoading ||
                !videoPrompt.trim() ||
                (!uploadedImage && !imageUrl)
              }
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg 
                hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 
                flex items-center gap-2 shadow-sm hover:shadow"
            >
              {isLoading ? (
                <>
                  <LoadingIcon className="w-4 h-4" />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <span>비디오 생성하기</span>
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRegenerateVideo}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg 
                hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 
                flex items-center gap-2 shadow-sm hover:shadow"
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
          )}
        </div>
      </h2>

      <div className="space-y-4">
        {/* 프롬프트 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비디오 생성 프롬프트 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="비디오 생성을 위한 프롬프트를 입력하세요."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200 resize-none h-24"
            disabled={isLoading}
          />
        </div>

        {/* 이미지 입력 방식 선택 */}
        <div>
          <div className="flex items-center mb-2 gap-2">
            <label className="block text-sm font-medium text-gray-700">
              이미지 선택 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setImageInputType("url")}
                className={`py-1 px-3 rounded-lg text-xs ${
                  imageInputType === "url"
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-500"
                    : "bg-gray-100 text-gray-600"
                } transition-colors duration-200`}
              >
                URL
              </button>
              <button
                onClick={() => setImageInputType("upload")}
                className={`py-1 px-3 rounded-lg text-xs ${
                  imageInputType === "upload"
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-500"
                    : "bg-gray-100 text-gray-600"
                } transition-colors duration-200`}
              >
                파일
              </button>
              <button
                onClick={handleUseSelectedImage}
                className={`py-1 px-3 rounded-lg text-xs ${
                  imageInputType === "selected"
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-500"
                    : "bg-gray-100 text-gray-600"
                } transition-colors duration-200`}
              >
                선택된 이미지 사용
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {imageInputType === "url" && (
              <>
                <input
                  type="url"
                  value={tempImageUrl}
                  onChange={handleUrlChange}
                  placeholder="이미지 URL을 입력하세요"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  onClick={handleUrlConfirm}
                  disabled={isLoading || isImageLoading || !tempImageUrl.trim()}
                  className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                    flex items-center gap-1 min-w-[60px] justify-center"
                >
                  {isImageLoading ? (
                    <>
                      <LoadingIcon className="w-3 h-3" />
                      <span>확인</span>
                    </>
                  ) : (
                    <span>확인</span>
                  )}
                </button>
              </>
            )}
            {imageInputType === "upload" && (
              <label
                htmlFor="video-image-upload"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed 
                  border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition-colors duration-200
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <PhotoIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  이미지 업로드 (최대 10MB)
                </span>
                <input
                  type="file"
                  id="video-image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            )}

            {/* 선택된 이미지 미리보기 */}
            {(uploadedImage || imageUrl) && (
              <div className="relative rounded-lg overflow-hidden border border-purple-200 flex-shrink-0">
                <Image
                  src={uploadedImage || imageUrl}
                  alt="Selected image"
                  className="object-cover"
                  width={48}
                  height={48}
                />
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setImageUrl("");
                    setTempImageUrl("");
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity
                    flex items-center justify-center"
                  disabled={isLoading}
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 생성된 비디오 목록 */}
      {videos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {videos.map((item) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
                ${
                  item.selected
                    ? "ring-2 ring-purple-500 shadow-lg"
                    : "border border-gray-200 hover:border-purple-300"
                }`}
              onClick={() => handleSelect("videos", item.id)}
            >
              {item.selected && (
                <div className="absolute top-2 right-2 z-10 bg-purple-500 text-white rounded-full p-1">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              )}
              <div className="aspect-video relative overflow-hidden bg-gray-50">
                <video controls className="w-full h-full object-cover">
                  <source src={item.url} type="video/mp4" />
                </video>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

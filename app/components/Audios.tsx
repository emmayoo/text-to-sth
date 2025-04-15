"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { VOICE_CONFIGS } from "@/app/constants";
import type { GeneratedItem, GenerationResult } from "@/app/types";
import { LoadingIcon } from "@/app/components/icons";

const voiceOptions = VOICE_CONFIGS.map((voice, index) => ({
  value: index,
  label: voice.description,
}));

interface AudiosProps {
  text: string;
  audio: GeneratedItem | null;
  selectedId: string | null;
  handleSelect: (type: keyof GenerationResult, id: string) => void;
}

export default function Audios({
  text,
  audio: initialAudio,
  selectedId,
  handleSelect,
}: AudiosProps) {
  const [audios, setAudios] = useState<GeneratedItem[]>(
    initialAudio ? [initialAudio] : []
  );
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegenerateAudio = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/generate", {
        text: text,
        type: "audio",
        voiceIndex: selectedVoiceIndex,
      });
      setAudios((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error("Audio generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialAudio) {
      setAudios([initialAudio]);
    }
  }, [initialAudio]);

  useEffect(() => {
    setAudios((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.id === selectedId,
      }))
    );
  }, [selectedId]);

  if (!initialAudio) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
        <SpeakerWaveIcon className="w-6 h-6 text-blue-500" />
        <span>음성</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRegenerateAudio}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
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

      <select
        value={selectedVoiceIndex}
        onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
        className="w-full px-4 py-2 mb-6 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        disabled={isLoading}
      >
        {voiceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-6">
        {audios.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md
              ${
                item.selected
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "border border-gray-200 hover:border-blue-300"
              }`}
            onClick={() => handleSelect("audios", item.id)}
          >
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
              {item.selected && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              )}
              <div className="text-sm text-gray-600 mb-3 font-medium">
                {item.description}
              </div>
              <audio controls className="w-full">
                <source src={item.url} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

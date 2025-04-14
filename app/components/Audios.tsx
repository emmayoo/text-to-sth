"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircleIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";

import { VOICE_CONFIGS } from "@/app/constants";
import type { GeneratedItem, GenerationResult } from "@/app/types";

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

  // TODO. fix
  useEffect(() => {
    if (initialAudio) {
      setAudios([initialAudio]);
    }
  }, [initialAudio]);

  useEffect(() => {
    if (selectedId) {
      setAudios((prev) =>
        prev.map((item) => ({ ...item, selected: item.id === selectedId }))
      );
    }
  }, [selectedId]);

  if (!initialAudio) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <SpeakerWaveIcon className="w-5 h-5" />
        <span>음성</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleRegenerateAudio}
            disabled={isLoading}
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "생성 중..." : "다시 생성"}
          </button>
        </div>
      </h2>

      <select
        value={selectedVoiceIndex}
        onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
        className="px-3 py-1 mb-4 border rounded text-sm bg-white text-gray-700"
        disabled={isLoading}
      >
        {voiceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-4">
        {audios.map((item) => (
          <div
            key={item.id}
            className={`relative border-2 rounded-lg p-2 cursor-pointer
                ${item.selected ? "border-blue-500" : "border-gray-200"}`}
            onClick={() => handleSelect("audios", item.id)}
          >
            {item.selected && (
              <CheckCircleIcon className="absolute top-2 right-2 w-6 h-6 text-blue-500" />
            )}

            <div>
              <div className="text-sm text-gray-600 mb-2">
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

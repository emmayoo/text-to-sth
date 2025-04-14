export interface GenerationResult {
  videos: GeneratedItem[];
  images: GeneratedItem[];
  audios: GeneratedItem[];
}

export interface GeneratedItem {
  url: string;
  id: string;
  selected?: boolean;
  description?: string;
}

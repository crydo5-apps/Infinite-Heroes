/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Character {
  id: string;
  name: string;
  role: "hero" | "sidekick";
  visualDescription: string;
  avatarUrl?: string; // Generated comic style avatar
  base64Photo?: string; // Original uploaded photo if any
  createdAt: string;
}

export interface DialogueEntry {
  character: string; // "Hero", "Sidekick", "Narrator", or custom name
  text: string;
}

export interface ComicPage {
  pageNumber: number; // 0 to 19
  title: string; // Page headline/caption or narration
  imageDescription: string; // The detailed prompt for gemini-3.1-flash-lite-image
  imageUrl?: string; // Generated image base64 or URL
  isFallback?: boolean; // True if it's an SVG rate-limit fallback
  hasError?: boolean; // True if the image failed to generate or load
  errorMessage?: string; // Error detail message
  dialogue: DialogueEntry[];
  layoutType?: "splash" | "top-bottom" | "left-right" | "comic-grid"; // For responsive panels
  balloonPosition?: "top" | "bottom" | "center" | "left" | "right";
}

export interface Comic {
  id: string;
  title: string;
  genre: string;
  language: string;
  premise: string;
  hero: Character;
  sidekick: Character;
  pages: ComicPage[]; // Exactly 20 pages
  createdAt: string;
}

export interface ScriptGenerationResponse {
  title: string;
  pages: {
    pageNumber: number;
    title: string;
    imageDescription: string;
    dialogue: { character: string; text: string }[];
    layoutType?: string;
    balloonPosition?: string;
  }[];
}

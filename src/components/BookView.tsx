import React, { useState, useEffect } from "react";
import { Comic, ComicPage, DialogueEntry, Character } from "../types";
import CharacterEditModal from "./CharacterEditModal";
import {
  ArrowLeft,
  ArrowRight,
  Book,
  Download,
  Volume2,
  RefreshCw,
  Edit3,
  Play,
  Maximize2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
  FileDown
} from "lucide-react";

interface BookViewProps {
  comic: Comic;
  onRegeneratePageImage: (pageNumber: number, customPrompt: string) => Promise<void>;
  onRegeneratePageText: (pageNumber: number, customInstructions: string) => Promise<void>;
  onDownloadPdf: () => void;
  isRegeneratingPage: Record<number, boolean>;
  onUpdateCharacters: (hero: Character, sidekick: Character) => void;
}

export default function BookView({
  comic,
  onRegeneratePageImage,
  onRegeneratePageText,
  onDownloadPdf,
  isRegeneratingPage,
  onUpdateCharacters,
}: BookViewProps) {
  // Current active page index or spread index.
  // 0: Cover (Page 0)
  // 1: Spread 1 (Pages 1 & 2)
  // 2: Spread 2 (Pages 3 & 4)
  // ...
  // 9: Spread 9 (Pages 17 & 18)
  // 10: Back Cover (Page 19)
  const [spreadIndex, setSpreadIndex] = useState<number>(0);
  const [isEditingPage, setIsEditingPage] = useState<number | null>(null);
  const [isEditingCharacters, setIsEditingCharacters] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editDialogue, setEditDialogue] = useState<DialogueEntry[]>([]);
  const [isFlipping, setIsFlipping] = useState<"next" | "prev" | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const isFirstRender = React.useRef(true);

  // Trigger floating Auto-Saved feedback when comic data updates
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowAutoSaved(true);
    const timer = setTimeout(() => {
      setShowAutoSaved(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [comic]);

  // Sync edit states when page changes
  const openEditModal = (pageNumber: number) => {
    const page = comic.pages.find((p) => p.pageNumber === pageNumber);
    if (page) {
      setIsEditingPage(pageNumber);
      setEditPrompt(page.imageDescription);
      setEditDialogue([...page.dialogue]);
    }
  };

  const getPagesForSpread = (index: number): number[] => {
    if (index === 0) return [0]; // Cover
    if (index === 10) return [19]; // Back Cover
    const leftPage = (index - 1) * 2 + 1;
    const rightPage = leftPage + 1;
    return [leftPage, rightPage];
  };

  const activePages = getPagesForSpread(spreadIndex);

  const handleNext = () => {
    if (spreadIndex < 10) {
      setIsFlipping("next");
      setTimeout(() => {
        setSpreadIndex((prev) => prev + 1);
        setIsFlipping(null);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (spreadIndex > 0) {
      setIsFlipping("prev");
      setTimeout(() => {
        setSpreadIndex((prev) => prev - 1);
        setIsFlipping(null);
      }, 300);
    }
  };

  // Browser Text-To-Speech
  const playPageAudio = (pageNumber: number) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const page = comic.pages.find((p) => p.pageNumber === pageNumber);
      if (!page) return;

      setIsPlayingAudio(true);
      
      // Sequence narration then dialogues
      const textToSpeak: string[] = [];
      if (page.title) textToSpeak.push(page.title);
      page.dialogue.forEach((d) => {
        textToSpeak.push(`${d.character} sagt: ${d.text}`);
      });

      const utterMessage = (index: number) => {
        if (index >= textToSpeak.length) {
          setIsPlayingAudio(false);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(textToSpeak[index]);
        // Set speech options
        utterance.lang = comic.language === "Deutsch" ? "de-DE" : "en-US";
        utterance.onend = () => utterMessage(index + 1);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      };

      utterMessage(0);
    } else {
      alert("Sprachausgabe wird in diesem Browser leider nicht unterstützt.");
    }
  };

  const stopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const handleApplyEdits = async () => {
    if (isEditingPage === null) return;
    
    // 1. Apply custom dialogue local modifications first (or save them)
    const pageToUpdate = comic.pages.find((p) => p.pageNumber === isEditingPage);
    if (pageToUpdate) {
      pageToUpdate.dialogue = editDialogue;
    }

    // 2. Call server-side regeneration for the image if prompt changed
    if (editPrompt !== pageToUpdate?.imageDescription) {
      await onRegeneratePageImage(isEditingPage, editPrompt);
    } else {
      // Just save dialogue local changes
      localStorage.setItem("infinite_heroes_comics", JSON.stringify([comic])); // Save state
    }

    setIsEditingPage(null);
  };

  const handleDialogueTextChange = (idx: number, newText: string) => {
    const updated = [...editDialogue];
    updated[idx] = { ...updated[idx], text: newText };
    setEditDialogue(updated);
  };

  const renderPageContent = (pageNumber: number, isRightPageOfSpread: boolean = false) => {
    const page = comic.pages.find((p) => p.pageNumber === pageNumber);
    if (!page) {
      return (
        <div className="w-full h-full bg-slate-950 flex items-center justify-center border-4 border-slate-950 p-6 text-center">
          <p className="text-slate-600 text-xs font-sans">Wird geladen...</p>
        </div>
      );
    }

    const isCover = pageNumber === 0;
    const isBackCover = pageNumber === 19;
    const isRegenerating = isRegeneratingPage[pageNumber];

    return (
      <div
        className={`w-full h-full relative overflow-hidden flex flex-col justify-between border-4 border-slate-950 bg-slate-950 p-4 transition-all duration-300 ${
          isCover
            ? "rounded-2xl shadow-[8px_8px_0px_#000]"
            : isBackCover
            ? "rounded-2xl shadow-[-8px_8px_0px_#000]"
            : isRightPageOfSpread
            ? "rounded-r-2xl border-l-2 shadow-[8px_8px_0px_#000]"
            : "rounded-l-2xl border-r-2 shadow-[-8px_8px_0px_#000]"
        }`}
      >
        {/* Halftone BG Pattern */}
        <div className="absolute inset-0 halftone-comic-bg opacity-[0.08] pointer-events-none" />

        {/* Loading Indicator */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-4 text-center">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mb-2" />
            <span className="font-bangers text-amber-400 text-sm tracking-widest">RE-ZEICHNE COMIC SEITE...</span>
            <span className="text-[10px] text-slate-400 font-sans mt-1">Ladezeiten minimiert dank paralleler APIs</span>
          </div>
        )}

        {/* Top Banner: Publisher / Slogan */}
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-slate-950/20 z-10">
          <span className="font-bangers text-[10px] text-rose-500 tracking-wider">INFINITE HEROES COMICS</span>
          <span className="font-mono text-[9px] text-slate-400 font-bold">SEITE {pageNumber} / 19</span>
        </div>

        {/* Narrator Caption Block */}
        {page.title && !isCover && !isBackCover && (
          <div className="bg-amber-300 text-slate-950 border-3 border-slate-950 p-2.5 rounded-xl shadow-[3px_3px_0px_#000] z-10 mb-2 relative transform -rotate-1">
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 border border-slate-950 rounded-full" />
            <p className="font-sans text-xs font-black tracking-wide leading-relaxed">
              {page.title}
            </p>
          </div>
        )}

        {/* Main Artwork Panel Container */}
        <div className="flex-grow bg-slate-900 border-3 border-slate-950 rounded-xl relative overflow-hidden group shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]">
          {page.hasError ? (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-15">
              {/* Halftone BG Pattern */}
              <div className="absolute inset-0 halftone-comic-bg opacity-[0.15] pointer-events-none" />
              
              {/* Exploding Comic Starburst shape or error header */}
              <div className="relative mb-4 transform -rotate-3 scale-110">
                <div className="bg-rose-600 text-slate-100 font-bangers text-3xl px-6 py-2.5 border-4 border-slate-950 rounded-xl shadow-[5px_5px_0px_#000] relative z-10">
                  FEHLER!
                </div>
                <div className="absolute inset-0 bg-yellow-400 border-4 border-slate-950 rounded-xl transform rotate-6 translate-x-1.5 translate-y-1.5 z-0" />
              </div>

              <div className="bg-slate-900 border-3 border-slate-950 p-4 rounded-2xl max-w-xs shadow-[4px_4px_0px_rgba(0,0,0,0.5)] z-10 mb-5">
                <p className="text-[11px] font-sans text-rose-400 font-bold uppercase tracking-wider mb-1">
                  Bild-Generierung fehlgeschlagen:
                </p>
                <p className="text-xs text-slate-300 font-mono leading-relaxed break-words bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  {page.errorMessage || "Netzwerkfehler oder Quotenüberschreitung."}
                </p>
              </div>

              {/* Manual Retry Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegeneratePageImage(pageNumber, page.imageDescription);
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bangers tracking-wider text-xs rounded-xl border-3 border-slate-950 shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <RefreshCw className="w-4 h-4 animate-pulse" /> MANUELL NEU STARTEN
              </button>
            </div>
          ) : page.imageUrl ? (
            <>
              <img
                src={page.imageUrl}
                alt={`Page ${pageNumber} artwork`}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {page.isFallback && (
                <div className="absolute top-2 left-2 right-2 bg-slate-950/90 border-2 border-amber-400 p-2 rounded-xl flex items-center justify-between gap-2 text-slate-100 text-[10px] font-bold z-10 backdrop-blur-xs shadow-[3px_3px_0px_#000]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate font-sans font-bold text-amber-400">Retro-Stil (API-Limit erreicht)</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegeneratePageImage(pageNumber, page.imageDescription);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 px-2 py-1 rounded-lg font-bangers tracking-wider text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-[1px_1px_0px_#000]"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> NEU ZEICHNEN
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mb-2" />
              <p className="text-[10px] font-sans">Zeichne Szene...</p>
              <p className="text-[8px] font-mono text-slate-600 mt-1 italic max-w-xs">{page.imageDescription}</p>
            </div>
          )}

          {/* COVER PAGE FINISHING AND LABELS */}
          {isCover && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 z-10">
              {/* Glossy sheen overlay */}
              <div className="absolute inset-0 glossy-finish" />
              
              <div className="text-center transform -rotate-2 bg-rose-500 border-4 border-slate-950 p-4 shadow-[6px_6px_0px_#000] rounded-2xl">
                <span className="font-bangers text-xs text-amber-300 tracking-wider">DAS ULTIMATIVE MEISTERWERK!</span>
                <h1 className="font-bangers text-4xl text-slate-100 tracking-wide drop-shadow-[2px_2px_0px_#000] uppercase mt-1 leading-none">
                  {comic.title}
                </h1>
              </div>

              {/* Cover Slogan dialogue */}
              {page.dialogue.length > 0 && (
                <div className="bg-yellow-300 text-slate-950 font-sans font-extrabold text-center text-xs py-1.5 px-3 border-3 border-slate-950 rounded-xl shadow-[3px_3px_0px_#000] self-center transform rotate-2 max-w-xs">
                  "{page.dialogue[0].text}"
                </div>
              )}

              <div className="flex justify-between items-end">
                <div className="bg-slate-950 border-2 border-slate-800 text-slate-300 text-[9px] px-2.5 py-1 rounded-lg">
                  <span className="block font-bold">STORY BY: GEMINI-3.5</span>
                  <span className="block">ART BY: GEMINI-3.1-LITE</span>
                </div>
                <div className="bg-yellow-300 text-slate-950 border-2 border-slate-950 font-bangers text-xs px-2 py-1 transform -rotate-3 rounded shadow-[2px_2px_0px_#000]">
                  Nr. 1 SPECIAL!
                </div>
              </div>
            </div>
          )}

          {/* BACK COVER SUMMARY & TEASER */}
          {isBackCover && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-slate-950/90 z-10 text-center">
              <div className="absolute inset-0 glossy-finish opacity-40" />

              <div className="border-4 border-double border-slate-800 p-4 rounded-2xl flex-grow flex flex-col justify-center items-center gap-4">
                <Book className="w-12 h-12 text-rose-500 mb-1" />
                <h2 className="font-bangers text-2xl text-amber-400">ENDE DES ABENTEUERS</h2>
                <p className="text-xs text-slate-300 font-sans leading-relaxed italic px-2">
                  {page.title || "Vielen Dank fürs Lesen! Deine Geschichte wurde live von fortschrittlicher künstlicher Intelligenz generiert und lokal im Infinite Archiv deines Browsers persistiert."}
                </p>

                {/* Retro barcode */}
                <div className="mt-4 bg-white border-2 border-slate-950 p-2 rounded flex flex-col items-center">
                  <div className="h-8 w-32 bg-[repeating-linear-gradient(90deg,black,black_2px,white_2px,white_6px)]" />
                  <span className="text-[8px] font-mono font-bold text-slate-950 tracking-widest mt-1">ISBN 978-3-86567-020-0</span>
                </div>
              </div>

              <div className="text-[8px] font-mono text-slate-600 mt-2">
                © {new Date().getFullYear()} INFINITE HEROES INC. ALL RIGHTS RESERVED.
              </div>
            </div>
          )}

          {/* SPEECH DIALOGUE BALLOONS (Absolute positioning inside standard comic frames) */}
          {!isCover && !isBackCover && page.dialogue.map((dial, idx) => {
            const isHero = dial.character === comic.hero.name;
            const isSidekick = dial.character === comic.sidekick.name;
            
            // Layout styling options
            const positions = [
              "absolute top-3 left-4",
              "absolute bottom-4 right-4",
              "absolute top-4 right-4"
            ];
            const positionClass = positions[idx % positions.length];

            return (
              <div
                key={idx}
                className={`${positionClass} z-10 max-w-[180px] bg-white border-3 border-slate-950 p-2 rounded-2xl shadow-[3px_3px_0px_#000] relative transform ${
                  idx % 2 === 0 ? "rotate-1" : "-rotate-1"
                }`}
              >
                {/* Speaker Tag */}
                <span className={`block font-bangers text-[8px] tracking-wider mb-0.5 px-1 py-0.5 rounded ${
                  isHero
                    ? "bg-amber-400 text-slate-950"
                    : isSidekick
                    ? "bg-rose-500 text-slate-950"
                    : "bg-slate-200 text-slate-900"
                }`}>
                  {dial.character.toUpperCase()}
                </span>
                
                {/* Spoken bubble text */}
                <p className="font-comic text-[11px] font-bold text-slate-900 leading-tight">
                  {dial.text}
                </p>

                {/* Comic speech bubble tail spike */}
                <div className={idx % 2 === 0 ? "bubble-spike-bottom" : "bubble-spike-top"} />
              </div>
            );
          })}

          {/* Interactive Page Actions on Hover */}
          {!isRegenerating && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-950/80 p-1.5 rounded-xl backdrop-blur-xs">
              <button
                type="button"
                onClick={() => openEditModal(pageNumber)}
                className="flex-1 py-1 text-[10px] font-bangers tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> SEITE ANPASSEN
              </button>
              <button
                type="button"
                onClick={() => playPageAudio(pageNumber)}
                disabled={isPlayingAudio}
                className="py-1 px-2.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center disabled:opacity-50"
                title="Sprechblasen vorlesen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Auto-Saved Indicator */}
      <div
        className={`absolute -top-3 right-3 z-40 flex items-center gap-2 px-3 py-1.5 bg-emerald-400 text-slate-950 border-3 border-slate-950 rounded-xl font-bangers text-xs tracking-wider shadow-[3px_3px_0px_#000] transition-all duration-300 transform ${
          showAutoSaved
            ? "opacity-100 translate-y-0 scale-100 animate-bounce"
            : "opacity-0 -translate-y-2 scale-90 pointer-events-none"
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-800 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-950"></span>
        </span>
        <span>AUTO-SAVED</span>
      </div>

      {/* Upper Navigation Controls & Spread Indicators */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border-2 border-slate-950">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-amber-400" />
            <h2 className="font-bangers text-lg text-slate-100 tracking-wider uppercase">
              Storybook: {comic.title}
            </h2>
          </div>
          <button
            onClick={() => setIsEditingCharacters(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-bangers tracking-wider border-2 border-slate-800 hover:border-amber-400 rounded-xl transition-all text-slate-300 cursor-pointer shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            CHARAKTERE ANPASSEN
          </button>
        </div>

        {/* Selector pagination map */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none font-bangers text-[10px]">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sIdx) => {
            const label = sIdx === 0 ? "Cover" : sIdx === 10 ? "Back" : `P. ${sIdx * 2 - 1}-${sIdx * 2}`;
            return (
              <button
                key={sIdx}
                onClick={() => setSpreadIndex(sIdx)}
                className={`px-2.5 py-1 rounded-lg border-2 transition-all ${
                  spreadIndex === sIdx
                    ? "bg-amber-400 border-slate-950 text-slate-950 scale-105 shadow-[2px_2px_0px_#000]"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDownloadPdf}
            className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bangers tracking-wider text-xs rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_#000] flex items-center gap-1.5 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" /> PDF HERUNTERLADEN
          </button>
          
          {isPlayingAudio && (
            <button
              onClick={stopAudio}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bangers text-xs rounded-xl flex items-center gap-1"
            >
              <span>STOPP</span>
            </button>
          )}
        </div>
      </div>

      {/* Realistic 3D Book Layout Container */}
      <div className="w-full max-w-5xl mx-auto flex justify-center items-center py-6">
        <div className="w-full book-container">
          <div
            className={`w-full transition-transform duration-500 ease-in-out transform ${
              isFlipping === "next"
                ? "rotate-y-6 scale-[0.98] -translate-x-2"
                : isFlipping === "prev"
                ? "-rotate-y-6 scale-[0.98] translate-x-2"
                : "rotate-y-0 scale-100"
            } flex flex-col md:flex-row justify-center items-stretch gap-0 select-none relative`}
          >
            {/* Opened spread view */}
            {spreadIndex === 0 ? (
              // Cover
              <div className="w-full md:w-[450px] aspect-[3/4] mx-auto z-10 transform hover:rotate-y-3 transition-transform duration-300">
                {renderPageContent(0)}
              </div>
            ) : spreadIndex === 10 ? (
              // Back Cover
              <div className="w-full md:w-[450px] aspect-[3/4] mx-auto z-10 transform hover:-rotate-y-3 transition-transform duration-300">
                {renderPageContent(19)}
              </div>
            ) : (
              // Side-by-side spread pages (Pages 1-18)
              <>
                {/* Left Page */}
                <div className="w-full md:w-[450px] aspect-[3/4] z-10">
                  {renderPageContent(activePages[0])}
                </div>

                {/* 3D Book Spine Shadow Effect */}
                <div className="hidden md:block w-3 bg-gradient-to-r from-black/60 via-black/25 to-black/60 border-y-4 border-slate-950 z-20 self-stretch relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-950/50" />
                </div>

                {/* Right Page */}
                <div className="w-full md:w-[450px] aspect-[3/4] z-10">
                  {renderPageContent(activePages[1], true)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lower Navigation Arrows & Jump pagination */}
      <div className="flex justify-between items-center max-w-sm mx-auto">
        <button
          onClick={handlePrev}
          disabled={spreadIndex === 0}
          className="p-3 bg-slate-950 border-2 border-slate-800 hover:border-amber-400 rounded-2xl disabled:opacity-30 disabled:border-slate-950 disabled:cursor-not-allowed text-amber-400 hover:text-amber-300 transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <span className="font-bangers text-sm text-slate-300 bg-slate-950 px-4 py-1.5 rounded-full border-2 border-slate-800">
          SPREAD {spreadIndex} / 10
        </span>

        <button
          onClick={handleNext}
          disabled={spreadIndex === 10}
          className="p-3 bg-slate-950 border-2 border-slate-800 hover:border-amber-400 rounded-2xl disabled:opacity-30 disabled:border-slate-950 disabled:cursor-not-allowed text-amber-400 hover:text-amber-300 transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* MODAL: INTERACTIVE PAGE REGENERATOR */}
      {isEditingPage !== null && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-900 border-4 border-slate-950 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative font-sans animate-fade-in">
            {/* Corner close button */}
            <button
              onClick={() => setIsEditingPage(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bangers text-2xl text-amber-400 mb-2 flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-rose-500" />
              SEITE {isEditingPage} INDIVIDUELL ANPASSEN
            </h3>
            <p className="text-slate-400 text-xs mb-5">Hier kannst du den Zeichen-Prompt und die Dialogtexte für diese Seite bearbeiten und regenerieren.</p>

            <div className="space-y-4">
              {/* Image Description Prompt */}
              <div>
                <label className="block text-slate-400 font-bangers text-[10px] mb-1.5">ILLUSTRATIONS-PROMPT (BILDERSTELLUNG)</label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 h-20 resize-none font-sans"
                />
              </div>

              {/* Dialogues List */}
              <div className="space-y-2.5">
                <label className="block text-slate-400 font-bangers text-[10px]">SPRECHBLASEN & DIALOGE</label>
                {editDialogue.map((dial, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bangers text-rose-400 min-w-[70px] truncate">
                      {dial.character}:
                    </span>
                    <input
                      type="text"
                      value={dial.text}
                      onChange={(e) => handleDialogueTextChange(idx, e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                ))}
                {editDialogue.length === 0 && (
                  <p className="text-slate-600 text-[10px] italic">Diese Seite enthält keine Dialog-Sprechblasen.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingPage(null)}
                  className="px-4 py-2 bg-slate-950 text-slate-400 text-xs font-bangers tracking-wider rounded-xl hover:text-white"
                >
                  ABBRECHEN
                </button>
                <button
                  type="button"
                  onClick={handleApplyEdits}
                  className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bangers tracking-wider rounded-xl shadow-[3px_3px_0px_#000] border-2 border-slate-950 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> SEITE NEU ZEICHNEN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHARACTER EDIT/REGENERATE */}
      <CharacterEditModal
        isOpen={isEditingCharacters}
        onClose={() => setIsEditingCharacters(false)}
        hero={comic.hero}
        sidekick={comic.sidekick}
        genre={comic.genre}
        onSave={onUpdateCharacters}
      />
    </div>
  );
}

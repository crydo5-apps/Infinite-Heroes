/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Comic, ComicPage, Character, DialogueEntry } from "./types";
import SetupForm from "./components/SetupForm";
import BookView from "./components/BookView";
import Library from "./components/Library";
import {
  Sparkles,
  BookOpen,
  Zap,
  RefreshCw,
  Download,
  Book,
  Trash2,
  FolderPlus,
  Tv,
  Library as LibraryIcon,
  HelpCircle,
  FileText
} from "lucide-react";

export default function App() {
  const [activeComic, setActiveComic] = useState<Comic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; label?: string } | null>(null);
  const [isRegeneratingPage, setIsRegeneratingPage] = useState<Record<number, boolean>>({});
  
  // Library list
  const [comicsList, setComicsList] = useState<Comic[]>([]);
  const [charactersList, setCharactersList] = useState<Character[]>([]);

  // Load Library from LocalStorage on mount
  useEffect(() => {
    try {
      const savedComics = localStorage.getItem("infinite_heroes_comics");
      const savedChars = localStorage.getItem("infinite_heroes_characters");
      if (savedComics) setComicsList(JSON.parse(savedComics));
      if (savedChars) setCharactersList(JSON.parse(savedChars));
    } catch (e) {
      console.error("Failed to load local libraries", e);
    }
  }, []);

  const saveComicToLibrary = (comic: Comic) => {
    try {
      const savedComics = localStorage.getItem("infinite_heroes_comics");
      const list: Comic[] = savedComics ? JSON.parse(savedComics) : [];
      const index = list.findIndex((c) => c.id === comic.id);
      if (index !== -1) {
        list[index] = comic;
      } else {
        list.push(comic);
      }
      setComicsList(list);
      localStorage.setItem("infinite_heroes_comics", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save comic", e);
    }
  };

  const handleLoadCharactersFromLibrary = (hero: Character, sidekick: Character) => {
    // This is passed to SetupForm to instantly load archived sheets
    const setupFormEl = document.getElementById("setup-form-container");
    if (setupFormEl) {
      setupFormEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 1. One-step Comic Generation: Generate entire Script, then trigger Parallel Page Images
  const handleGenerateComic = async (setup: {
    hero: Character;
    sidekick: Character;
    genre: string;
    premise: string;
    language: string;
    tone: string;
  }) => {
    try {
      setIsGenerating(true);
      setGenerationStage("Erstelle Comic-Skript (20 Seiten) mit 'gemini-3.5-flash'...");
      setGenerationProgress({ current: 0, total: 20, label: "Generiere Skript..." });

      const scriptRes = await fetch("/api/comic/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero: setup.hero,
          sidekick: setup.sidekick,
          genre: setup.genre,
          premise: setup.premise,
          language: setup.language,
          tone: setup.tone,
        }),
      });

      const scriptData = await scriptRes.json();
      if (!scriptData || scriptData.error) {
        throw new Error(scriptData.error || "Skript konnte nicht geladen werden.");
      }

      setGenerationStage("Comic-Skript erfolgreich erstellt! Starte jetzt Bildgenerierung...");

      // Create initial comic object with empty image slots
      const initialPages: ComicPage[] = scriptData.pages.map((p: any) => ({
        pageNumber: p.pageNumber,
        title: p.title,
        imageDescription: p.imageDescription,
        dialogue: p.dialogue || [],
        layoutType: p.layoutType || "splash",
        balloonPosition: p.balloonPosition || "top"
      }));

      setGenerationProgress({ current: 0, total: initialPages.length, label: "Initialisiere Bilder..." });

      const newComic: Comic = {
        id: "comic_" + Date.now(),
        title: scriptData.title || "Infinite Adventure",
        genre: setup.genre,
        language: setup.language,
        premise: setup.premise,
        hero: setup.hero,
        sidekick: setup.sidekick,
        pages: initialPages,
        createdAt: new Date().toISOString()
      };

      // Instantly open the book to show progress
      setActiveComic(newComic);
      saveComicToLibrary(newComic);

      // Scroll to Book
      setTimeout(() => {
        const bookEl = document.getElementById("comic-book-viewport");
        if (bookEl) bookEl.scrollIntoView({ behavior: "smooth" });
      }, 300);

      // Process page image generation sequentially with a short delay to be extremely friendly
      // to Gemini free-tier rate limits, while showing progress dynamically page-by-page.
      for (let idx = 0; idx < initialPages.length; idx++) {
        const page = initialPages[idx];
        setGenerationProgress({
          current: idx,
          total: initialPages.length,
          label: `Zeichne Seite ${idx + 1} von ${initialPages.length}...`
        });

        // Small delay between each sequential request to prevent burst rate limits (429)
        if (idx > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1800));
        }

        try {
          const imgRes = await fetch("/api/comic/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageDescription: page.imageDescription,
              genre: setup.genre,
            }),
          });
          
          if (!imgRes.ok) {
            throw new Error(`HTTP-Fehler! Status: ${imgRes.status}`);
          }
          
          const imgData = await imgRes.json();

          if (imgData.imageUrl) {
            // Update active comic and localstorage on the fly!
            setActiveComic((prev) => {
              if (!prev || prev.id !== newComic.id) return prev;
              const updatedPages = prev.pages.map((p) =>
                p.pageNumber === page.pageNumber
                  ? { 
                      ...p, 
                      imageUrl: imgData.imageUrl, 
                      isFallback: imgData.isFallback || false,
                      hasError: imgData.errorInfo ? true : false,
                      errorMessage: imgData.errorInfo || undefined
                    }
                  : p
              );
              const updatedComic = { ...prev, pages: updatedPages };
              saveComicToLibrary(updatedComic); // sync state
              return updatedComic;
            });
          } else {
            throw new Error(imgData.error || "Keine Bild-URL erhalten");
          }
        } catch (e: any) {
          console.error(`Failed to generate image for page ${page.pageNumber}`, e);
          setActiveComic((prev) => {
            if (!prev || prev.id !== newComic.id) return prev;
            const updatedPages = prev.pages.map((p) =>
              p.pageNumber === page.pageNumber
                ? { ...p, hasError: true, errorMessage: e.message || "Bildgenerierung fehlgeschlagen" }
                : p
            );
            const updatedComic = { ...prev, pages: updatedPages };
            saveComicToLibrary(updatedComic); // sync state
            return updatedComic;
          });
        }
      }

      setGenerationProgress({
        current: initialPages.length,
        total: initialPages.length,
        label: "Comic komplett fertiggestellt!"
      });

    } catch (err: any) {
      alert("Fehler bei der Comic-Erstellung: " + err.message);
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  // Tweak/Regenerate page image on the fly
  const handleRegeneratePageImage = async (pageNumber: number, customPrompt: string) => {
    if (!activeComic) return;

    try {
      setIsRegeneratingPage((prev) => ({ ...prev, [pageNumber]: true }));

      // Update local prompt description text first & clear previous error
      setActiveComic((prev) => {
        if (!prev) return prev;
        const updatedPages = prev.pages.map((p) =>
          p.pageNumber === pageNumber 
            ? { ...p, imageDescription: customPrompt, hasError: false, errorMessage: undefined } 
            : p
        );
        return { ...prev, pages: updatedPages };
      });

      const res = await fetch("/api/comic/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDescription: customPrompt,
          genre: activeComic.genre
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP-Fehler! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.imageUrl) {
        setActiveComic((prev) => {
          if (!prev) return prev;
          const updatedPages = prev.pages.map((p) =>
            p.pageNumber === pageNumber
              ? { 
                  ...p, 
                  imageUrl: data.imageUrl, 
                  isFallback: data.isFallback || false,
                  hasError: data.errorInfo ? true : false,
                  errorMessage: data.errorInfo || undefined
                }
              : p
          );
          const updatedComic = { ...prev, pages: updatedPages };
          saveComicToLibrary(updatedComic); // save to library
          return updatedComic;
        });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Fehler beim Abrufen der Bild-URL");
      }
    } catch (err: any) {
      console.error(err);
      setActiveComic((prev) => {
        if (!prev) return prev;
        const updatedPages = prev.pages.map((p) =>
          p.pageNumber === pageNumber
            ? { ...p, hasError: true, errorMessage: err.message || "Fehler beim Neu-Zeichnen" }
            : p
        );
        const updatedComic = { ...prev, pages: updatedPages };
        saveComicToLibrary(updatedComic);
        return updatedComic;
      });
    } finally {
      setIsRegeneratingPage((prev) => ({ ...prev, [pageNumber]: false }));
    }
  };

  // Update characters in active comic & save
  const handleUpdateCharacters = (hero: Character, sidekick: Character) => {
    if (!activeComic) return;
    const updatedComic = {
      ...activeComic,
      hero,
      sidekick
    };
    setActiveComic(updatedComic);
    saveComicToLibrary(updatedComic);
  };

  // Dialogue modifications
  const handleRegeneratePageText = async (pageNumber: number, customInstructions: string) => {
    // In our simplified page-edit form, users can type direct dialogue overrides,
    // which updates instantly in BookView without calling expensive server endpoints.
  };

  // High-fidelity client-side PDF Generator
  const drawPageToCanvas = (page: ComicPage, comic: Comic): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      // Background halftone-like yellow dots
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 800);

      // Yellow-themed retro overlay dots
      ctx.fillStyle = "rgba(244, 63, 94, 0.05)";
      for (let x = 0; x < 600; x += 15) {
        for (let y = 0; y < 800; y += 15) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (page.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Draw Main comic panel
          ctx.drawImage(img, 20, 65, 560, 580);
          
          // Panel Border outline
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#090f19";
          ctx.strokeRect(20, 65, 560, 580);

          // Top Header Branding
          ctx.fillStyle = "#f43f5e";
          ctx.font = "bold 13px Helvetica";
          ctx.fillText("INFINITE HEROES COMICS", 25, 38);
          
          ctx.textAlign = "right";
          ctx.fillStyle = "#090f19";
          ctx.fillText(`SEITE ${page.pageNumber} / 19`, 575, 38);
          ctx.textAlign = "left";

          // Narrator yellow block caption at top
          if (page.title && page.pageNumber !== 0 && page.pageNumber !== 19) {
            ctx.fillStyle = "#fde047"; // Yellow 300
            ctx.fillRect(35, 80, 530, 45);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#090f19";
            ctx.strokeRect(35, 80, 530, 45);

            ctx.fillStyle = "#090f19";
            ctx.font = "bold 11px Helvetica";
            
            // Text wrap helper
            const text = page.title;
            let line = "";
            let yPos = 98;
            const words = text.split(" ");
            for (const word of words) {
              const testLine = line + word + " ";
              const metrics = ctx.measureText(testLine);
              if (metrics.width > 500) {
                ctx.fillText(line, 45, yPos);
                line = word + " ";
                yPos += 15;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, 45, yPos);
          }

          // Dialog balloons overlay
          page.dialogue.forEach((dial, dIdx) => {
            const isHero = dial.character === comic.hero.name;
            const xPos = dIdx % 2 === 0 ? 50 : 360;
            const yPos = dIdx % 2 === 0 ? 150 : 480;

            // Bubble background
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(xPos, yPos, 190, 70, 15);
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#090f19";
            ctx.stroke();

            // Bubble tail spikes
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            if (dIdx % 2 === 0) {
              ctx.moveTo(xPos + 30, yPos + 70);
              ctx.lineTo(xPos + 20, yPos + 85);
              ctx.lineTo(xPos + 45, yPos + 70);
            } else {
              ctx.moveTo(xPos + 160, yPos);
              ctx.lineTo(xPos + 170, yPos - 15);
              ctx.lineTo(xPos + 145, yPos);
            }
            ctx.fill();
            ctx.stroke();

            // Character Label
            ctx.fillStyle = isHero ? "#f59e0b" : "#f43f5e";
            ctx.fillRect(xPos + 12, yPos + 8, 70, 14);
            ctx.strokeRect(xPos + 12, yPos + 8, 70, 14);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "9px Helvetica";
            ctx.fillText(dial.character.toUpperCase(), xPos + 16, yPos + 18);

            // Speech dialog text
            ctx.fillStyle = "#090f19";
            ctx.font = "bold 10px Helvetica";
            
            let dLine = "";
            let dY = yPos + 34;
            const dWords = dial.text.split(" ");
            for (const w of dWords) {
              const testDLine = dLine + w + " ";
              const metrics = ctx.measureText(testDLine);
              if (metrics.width > 165) {
                ctx.fillText(dLine, xPos + 12, dY);
                dLine = w + " ";
                dY += 13;
              } else {
                dLine = testDLine;
              }
            }
            ctx.fillText(dLine, xPos + 12, dY);
          });

          // Footer info
          ctx.fillStyle = "#64748b";
          ctx.font = "9px Courier";
          ctx.fillText("CREATED WITH INFINITE HEROES", 25, 775);
          ctx.textAlign = "right";
          ctx.fillText("WWW.INFINITE-HEROES.COM", 575, 775);

          resolve(canvas.toDataURL("image/jpeg", 0.95));
        };
        img.src = page.imageUrl;
      } else {
        // Fallback for missing images
        ctx.fillStyle = "#090f19";
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = "#fbbf24";
        ctx.textAlign = "center";
        ctx.font = "bold 24px Helvetica";
        ctx.fillText(`SEITE ${page.pageNumber}`, 300, 400);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!activeComic) return;

    try {
      setGenerationStage("Exportiere Comic als PDF-Datei...");
      setIsGenerating(true);
      setGenerationProgress({
        current: 0,
        total: activeComic.pages.length,
        label: "Bereite Seiten vor..."
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [600, 800]
      });

      for (let idx = 0; idx < activeComic.pages.length; idx++) {
        setGenerationProgress({
          current: idx,
          total: activeComic.pages.length,
          label: `Kompiliere Seite ${idx + 1} von ${activeComic.pages.length}...`
        });
        if (idx > 0) pdf.addPage();
        const page = activeComic.pages[idx];
        const pageDataUrl = await drawPageToCanvas(page, activeComic);
        pdf.addImage(pageDataUrl, "JPEG", 0, 0, 600, 800);
      }

      setGenerationProgress({
        current: activeComic.pages.length,
        total: activeComic.pages.length,
        label: "Speichere PDF-Datei..."
      });
      pdf.save(`${activeComic.title.toLowerCase().replace(/\s+/g, "_")}.pdf`);

    } catch (e) {
      console.error(e);
      alert("Es gab einen Fehler beim PDF-Export.");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
      setGenerationProgress(null);
    }
  };

  return (
    <div className="min-h-screen halftone-bg text-slate-100 flex flex-col justify-between font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Upper retro header navigation bar */}
      <nav className="bg-slate-950 border-b-4 border-slate-900 sticky top-0 z-40 px-6 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-12 h-12 rounded-xl bg-amber-400 border-3 border-slate-950 flex items-center justify-center transform rotate-3 shadow-[3px_3px_0px_#f43f5e]">
              <Sparkles className="w-7 h-7 text-slate-950 fill-current" />
            </div>
            <div>
              <h1 className="font-bangers text-3xl text-slate-100 tracking-wider leading-none">
                INFINITE <span className="text-rose-500">HEROES</span>
              </h1>
              <span className="font-mono text-[9px] text-slate-500 font-bold block uppercase tracking-widest mt-0.5">3D AI Comic Creator</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#library-container"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-bangers tracking-wider border-2 border-slate-800 hover:border-amber-400 rounded-xl transition-all"
            >
              <LibraryIcon className="w-4 h-4 text-rose-500" />
              ARCHIV SAMMLUNG
            </a>
            <a
              href="#setup-form-container"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bangers tracking-wider border-2 border-slate-950 rounded-xl transition-all shadow-[2px_2px_0px_#000]"
            >
              <FolderPlus className="w-4 h-4 fill-current" />
              NEUER COMIC
            </a>
          </div>

        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-grow space-y-12 w-full">
        
        {/* Loading Overlay for long-running task */}
        {isGenerating && generationStage && (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs animate-fade-in">
            <div className="w-24 h-24 rounded-2xl bg-amber-400 border-4 border-slate-950 flex items-center justify-center mb-6 shadow-[5px_5px_0px_#f43f5e] transform animate-bounce">
              <Zap className="w-12 h-12 text-slate-950 fill-current animate-pulse" />
            </div>
            <h2 className="font-bangers text-3xl text-slate-100 tracking-wider max-w-lg mb-2">
              {generationStage}
            </h2>

            {/* Progress Bar! */}
            {generationProgress && (
              <div className="w-full max-w-md bg-slate-900 border-4 border-slate-950 p-4 rounded-2xl my-6 shadow-[5px_5px_0px_#000] relative overflow-hidden">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-amber-400 mb-2">
                  <span className="uppercase tracking-widest">{generationProgress.label || "Wird verarbeitet..."}</span>
                  <span>{Math.round((generationProgress.current / generationProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-6 bg-slate-950 border-2 border-slate-800 rounded-lg overflow-hidden p-0.5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-sm transition-all duration-500 ease-out relative"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  >
                    {/* Halftone stripe effect inside the bar */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[pulse_2s_infinite]" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                  <span>START</span>
                  <span>{generationProgress.current} / {generationProgress.total} SEITEN</span>
                  <span>FERTIG</span>
                </div>
              </div>
            )}

            <p className="text-slate-400 text-xs font-sans max-w-md leading-relaxed">
              Bitte lasse dieses Fenster geöffnet. Deine Comic-Elemente (Charakter-Sheets, 20 Skript-Seiten & Kunstwerke) werden in Rekordzeit über parallele Cloud-Pipelines gezeichnet.
            </p>
            {activeComic && (
              <p className="text-amber-400 font-bangers text-sm mt-4 tracking-wider animate-pulse">
                Comic wird bereits im Hintergrund aufgebaut! Blättere gerne unten schon mal los...
              </p>
            )}
          </div>
        )}

        {/* SETUP SCREEN */}
        <SetupForm
          onGenerateComic={handleGenerateComic}
          isGenerating={isGenerating}
          onLoadPredefinedCharacters={handleLoadCharactersFromLibrary}
          savedCharacters={charactersList}
        />

        {/* THE ACTIVE COMIC 3D BOOK VIEWPORT */}
        {activeComic && (
          <section id="comic-book-viewport" className="scroll-mt-24 pt-4">
            <div className="bg-slate-950 border-4 border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600" />
              
              <BookView
                comic={activeComic}
                onRegeneratePageImage={handleRegeneratePageImage}
                onRegeneratePageText={handleRegeneratePageText}
                onDownloadPdf={handleDownloadPdf}
                isRegeneratingPage={isRegeneratingPage}
                onUpdateCharacters={handleUpdateCharacters}
              />
            </div>
          </section>
        )}

        {/* LIBRARY COLLECTIONS ARCHIVE */}
        <Library
          onLoadComic={(comic) => {
            setActiveComic(comic);
            const bookEl = document.getElementById("comic-book-viewport");
            if (bookEl) {
              bookEl.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onLoadCharacters={handleLoadCharactersFromLibrary}
          activeComicId={activeComic?.id}
        />

      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-950 border-t-4 border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© {new Date().getFullYear()} INFINITE HEROES. ALL RIGHTS RESERVED.</span>
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Made in Germany • Powered by Gemini AI
          </span>
        </div>
      </footer>

    </div>
  );
}

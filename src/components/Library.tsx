import React, { useState, useEffect } from "react";
import { Comic, Character } from "../types";
import { Book, Trash2, FolderOpen, Calendar, ArrowRight, Sparkles, User, ShieldAlert } from "lucide-react";

interface LibraryProps {
  onLoadComic: (comic: Comic) => void;
  onLoadCharacters: (hero: Character, sidekick: Character) => void;
  activeComicId?: string;
}

export default function Library({ onLoadComic, onLoadCharacters, activeComicId }: LibraryProps) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<"comics" | "characters">("comics");
  const [searchQuery, setSearchQuery] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedComics = localStorage.getItem("infinite_heroes_comics");
      const savedChars = localStorage.getItem("infinite_heroes_characters");
      if (savedComics) setComics(JSON.parse(savedComics));
      if (savedChars) setCharacters(JSON.parse(savedChars));
    } catch (e) {
      console.error("Failed to load library data from localStorage", e);
    }
  }, [activeComicId]);

  const deleteComic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Möchtest du diesen Comic wirklich löschen?")) {
      const updated = comics.filter((c) => c.id !== id);
      setComics(updated);
      localStorage.setItem("infinite_heroes_comics", JSON.stringify(updated));
    }
  };

  const deleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Möchtest du diesen Charakter wirklich löschen?")) {
      const updated = characters.filter((c) => c.id !== id);
      setCharacters(updated);
      localStorage.setItem("infinite_heroes_characters", JSON.stringify(updated));
    }
  };

  const filteredComics = comics.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.premise.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.visualDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="library-container" className="bg-slate-900 border-4 border-slate-950 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative comic dots in corner */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b-4 border-slate-950">
        <div>
          <h2 className="text-3xl font-bangers text-amber-400 tracking-wide flex items-center gap-2">
            <Book className="w-8 h-8 text-rose-500" />
            INFINITE ARCHIV
          </h2>
          <p className="text-slate-400 text-xs font-sans mt-1">Deine Sammlung an Comic-Meisterwerken und Helden-Sheets</p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border-2 border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab("comics"); setSearchQuery(""); }}
          className={`px-4 py-2 text-sm font-bangers tracking-wider border-2 border-slate-950 rounded-xl transition-all ${
            activeTab === "comics"
              ? "bg-amber-400 text-slate-950 transform -translate-y-0.5 shadow-[4px_4px_0px_#000]"
              : "bg-slate-950 text-slate-400 hover:text-slate-200"
          }`}
        >
          MEINE COMICS ({comics.length})
        </button>
        <button
          onClick={() => { setActiveTab("characters"); setSearchQuery(""); }}
          className={`px-4 py-2 text-sm font-bangers tracking-wider border-2 border-slate-950 rounded-xl transition-all ${
            activeTab === "characters"
              ? "bg-rose-500 text-slate-950 transform -translate-y-0.5 shadow-[4px_4px_0px_#000]"
              : "bg-slate-950 text-slate-400 hover:text-slate-200"
          }`}
        >
          MEINE CHARAKTERE ({characters.length})
        </button>
      </div>

      {/* TAB CONTENT: COMICS */}
      {activeTab === "comics" && (
        <div>
          {filteredComics.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/50 border-2 border-dashed border-slate-800">
              <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-sans">Noch keine Comics gespeichert.</p>
              <p className="text-slate-500 text-xs font-sans mt-1">Erstelle oben deinen ersten 20-seitigen Comic!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComics.map((comic) => {
                const coverPage = comic.pages.find((p) => p.pageNumber === 0);
                const hasImages = comic.pages.some((p) => p.imageUrl);
                const progressCount = comic.pages.filter((p) => p.imageUrl).length;
                
                return (
                  <div
                    key={comic.id}
                    onClick={() => onLoadComic(comic)}
                    className={`group cursor-pointer bg-slate-950 border-2 hover:border-amber-400 p-4 rounded-2xl transition-all relative overflow-hidden flex gap-4 ${
                      activeComicId === comic.id ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : "border-slate-800"
                    }`}
                  >
                    {/* Tiny Cover Art Preview */}
                    <div className="w-20 h-28 bg-slate-900 rounded-lg flex-shrink-0 border-2 border-slate-800 overflow-hidden relative flex items-center justify-center">
                      {coverPage?.imageUrl ? (
                        <img
                          src={coverPage.imageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Book className="w-8 h-8 text-slate-700" />
                      )}
                      {/* Glossy Overlay */}
                      <div className="absolute inset-0 glossy-finish" />
                      <div className="absolute top-1 left-1 bg-amber-400 text-slate-950 font-bangers text-[8px] px-1 rounded">
                        {comic.genre.split(" ")[0]}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bangers text-lg text-amber-300 group-hover:text-amber-400 transition-colors leading-tight truncate">
                            {comic.title}
                          </h3>
                          <button
                            onClick={(e) => deleteComic(comic.id, e)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans line-clamp-2 mt-1 italic">
                          "{comic.premise}"
                        </p>
                      </div>

                      <div className="mt-2">
                        {/* Progress Bar */}
                        <div className="flex justify-between text-[9px] text-slate-500 font-sans mb-1">
                          <span>Bilder generiert: {progressCount}/20</span>
                          <span>{comic.language}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full transition-all"
                            style={{ width: `${(progressCount / 20) * 100}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(comic.createdAt)}
                          </span>
                          <span className="text-amber-400 font-bangers flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            LESEN <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CHARACTERS */}
      {activeTab === "characters" && (
        <div>
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/50 border-2 border-dashed border-slate-800">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-sans">Noch keine Charaktere separat gespeichert.</p>
              <p className="text-slate-500 text-xs font-sans mt-1">Generiere oben bei der Charaktererstellung Avatare, um sie hier zu speichern!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="group bg-slate-950 border-2 border-slate-800 hover:border-rose-500 p-3 rounded-2xl transition-all flex flex-col relative"
                >
                  {/* Tiny delete */}
                  <button
                    onClick={(e) => deleteCharacter(char.id, e)}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-950/90 hover:text-red-400 text-slate-400 p-1.5 rounded-full z-10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Character avatar */}
                  <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800 mb-3 flex items-center justify-center">
                    {char.avatarUrl ? (
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-700" />
                    )}
                    <div className="absolute inset-0 glossy-finish" />
                    <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-bangers ${
                      char.role === "hero" ? "bg-amber-400 text-slate-950" : "bg-rose-500 text-slate-950"
                    }`}>
                      {char.role === "hero" ? "HELD" : "CO-STAR"}
                    </div>
                  </div>

                  <h3 className="font-bangers text-sm text-slate-200 truncate leading-tight mb-1">{char.name}</h3>
                  <p className="text-slate-400 text-[10px] font-sans line-clamp-2 leading-relaxed flex-grow">
                    {char.visualDescription}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between items-center text-[8px] text-slate-500">
                    <span>{formatDate(char.createdAt)}</span>
                    <button
                      onClick={() => {
                        // Find a partner of opposite role in the list to trigger load if possible,
                        // or let the form load this single character.
                        const partner = characters.find((c) => c.role !== char.role);
                        if (partner) {
                          onLoadCharacters(
                            char.role === "hero" ? char : partner,
                            char.role === "sidekick" ? char : partner
                          );
                        } else {
                          // Dummy partner
                          const dummyPartner: Character = {
                            id: "dummy",
                            name: char.role === "hero" ? "Sparky" : "Astra Spark",
                            role: char.role === "hero" ? "sidekick" : "hero",
                            visualDescription: "Ein freundlicher Gefährte.",
                            createdAt: new Date().toISOString(),
                          };
                          onLoadCharacters(
                            char.role === "hero" ? char : dummyPartner,
                            char.role === "sidekick" ? char : dummyPartner
                          );
                        }
                      }}
                      className="text-rose-400 font-bangers hover:underline tracking-wider"
                    >
                      AUSWÄHLEN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

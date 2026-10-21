import React, { useState } from "react";
import { Character } from "../types";
import { X, Sparkles, RefreshCw, User, Check, Edit2 } from "lucide-react";

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  hero: Character;
  sidekick: Character;
  genre: string;
  onSave: (updatedHero: Character, updatedSidekick: Character) => void;
}

export default function CharacterEditModal({
  isOpen,
  onClose,
  hero,
  sidekick,
  genre,
  onSave,
}: CharacterEditModalProps) {
  // Local state for Hero
  const [heroName, setHeroName] = useState(hero.name);
  const [heroDesc, setHeroDesc] = useState(hero.visualDescription);
  const [heroAvatar, setHeroAvatar] = useState(hero.avatarUrl || "");
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroRefine, setHeroRefine] = useState("");

  // Local state for Sidekick
  const [sidekickName, setSidekickName] = useState(sidekick.name);
  const [sidekickDesc, setSidekickDesc] = useState(sidekick.visualDescription);
  const [sidekickAvatar, setSidekickAvatar] = useState(sidekick.avatarUrl || "");
  const [sidekickLoading, setSidekickLoading] = useState(false);
  const [sidekickRefine, setSidekickRefine] = useState("");

  if (!isOpen) return null;

  const handleRegenerate = async (role: "hero" | "sidekick") => {
    const setLoading = role === "hero" ? setHeroLoading : setSidekickLoading;
    const name = role === "hero" ? heroName : sidekickName;
    const visualDescription = role === "hero" ? heroDesc : sidekickDesc;
    const refinePrompt = role === "hero" ? heroRefine : sidekickRefine;
    const setAvatar = role === "hero" ? setHeroAvatar : setSidekickAvatar;
    const base64Photo = role === "hero" ? hero.base64Photo : sidekick.base64Photo;

    try {
      setLoading(true);
      const res = await fetch("/api/character/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          visualDescription,
          genre,
          base64Photo,
          refinePrompt,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setAvatar(data.imageUrl);
      } else if (data.error) {
        alert("Fehler bei der Avatar-Generierung: " + data.error);
      }
    } catch (err) {
      console.error("Avatar regeneration failed", err);
      alert("Es gab einen Fehler bei der Verbindung zum Zeichen-Server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = () => {
    const updatedHero: Character = {
      ...hero,
      name: heroName,
      visualDescription: heroDesc,
      avatarUrl: heroAvatar,
    };

    const updatedSidekick: Character = {
      ...sidekick,
      name: sidekickName,
      visualDescription: sidekickDesc,
      avatarUrl: sidekickAvatar,
    };

    onSave(updatedHero, updatedSidekick);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-4 border-slate-950 rounded-3xl p-6 max-w-4xl w-full shadow-[10px_10px_0px_#000] relative my-8">
        
        {/* Halftone BG Pattern */}
        <div className="absolute inset-0 halftone-comic-bg opacity-[0.03] pointer-events-none rounded-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-2 rounded-xl transition-all border-2 border-transparent hover:border-slate-800 bg-slate-950/40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-amber-400 fill-current" />
            <h2 className="font-bangers text-3xl text-slate-100 tracking-wider">
              HELDEN- & CO-STAR STECKBRIEFE ANPASSEN
            </h2>
          </div>
          <p className="text-slate-400 text-xs font-sans max-w-2xl leading-relaxed">
            Passe die optische Beschreibung deiner Hauptfiguren an oder verfeinere ihr Aussehen. Klicke auf <span className="text-amber-400 font-bold">AVATAR NEU ZEICHNEN</span>, um ihr Profilbild mit Gemini neu zu entwerfen.
          </p>
        </div>

        {/* Main Content Area: Side-By-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* HERO PANEL */}
          <div className="bg-slate-950/60 border-3 border-slate-950 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
            
            <div>
              {/* Header Badge */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-bangers text-xs bg-amber-400 text-slate-950 px-3 py-1 rounded-lg shadow-[2px_2px_0px_#000]">
                  HAUPTCHARAKTER (HELD)
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">Role: Hero</span>
              </div>

              {/* Character Details & Avatar Row */}
              <div className="flex gap-4 items-start mb-4">
                {/* Avatar Display */}
                <div className="w-24 h-24 rounded-xl bg-slate-900 border-2 border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center shadow-[3px_3px_0px_#000]">
                  {heroLoading ? (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                      <span className="text-[7px] font-mono font-bold text-amber-400 mt-1 uppercase tracking-widest">Zeichne...</span>
                    </div>
                  ) : heroAvatar ? (
                    <img
                      src={heroAvatar}
                      alt={heroName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-700" />
                  )}
                  <div className="absolute inset-0 glossy-finish pointer-events-none" />
                </div>

                {/* Name Input */}
                <div className="flex-grow min-w-0">
                  <label className="block text-[10px] font-bangers text-slate-400 tracking-wider mb-1">CHARAKTERNAME</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={heroName}
                      onChange={(e) => setHeroName(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-sans font-bold"
                    />
                    <Edit2 className="w-3 h-3 text-slate-600 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Visual Description Textarea */}
              <div className="mb-4">
                <label className="block text-[10px] font-bangers text-slate-400 tracking-wider mb-1">AUSSEHEN & KÖSTUMBESCHREIBUNG</label>
                <textarea
                  value={heroDesc}
                  onChange={(e) => setHeroDesc(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 h-20 resize-none font-sans leading-relaxed"
                  placeholder="Beschreibe Haare, Anzug, Maske, Gesichtszüge..."
                />
              </div>

              {/* Prompt Refinement Adjustment (Optional modifier) */}
              <div className="mb-4">
                <label className="block text-[10px] font-bangers text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                  OPTIONAL: VERFEINERUNGS-WUNSCH (Z.B. "BREITES GRINSEN", "NASS VOM REGEN")
                </label>
                <input
                  type="text"
                  value={heroRefine}
                  onChange={(e) => setHeroRefine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 focus:outline-none focus:border-amber-400 font-sans"
                  placeholder="Gibt kleinere Korrekturen an den bestehenden Avatar..."
                />
              </div>
            </div>

            {/* Action button to generate */}
            <button
              type="button"
              onClick={() => handleRegenerate("hero")}
              disabled={heroLoading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bangers tracking-wider text-xs rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${heroLoading ? "animate-spin" : ""}`} />
              AVATAR NEU ZEICHNEN
            </button>
          </div>

          {/* SIDEKICK PANEL */}
          <div className="bg-slate-950/60 border-3 border-slate-950 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
            
            <div>
              {/* Header Badge */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-bangers text-xs bg-rose-500 text-slate-950 px-3 py-1 rounded-lg shadow-[2px_2px_0px_#000]">
                  CO-STAR / GEFÄHRTE
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">Role: Sidekick</span>
              </div>

              {/* Character Details & Avatar Row */}
              <div className="flex gap-4 items-start mb-4">
                {/* Avatar Display */}
                <div className="w-24 h-24 rounded-xl bg-slate-900 border-2 border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center shadow-[3px_3px_0px_#000]">
                  {sidekickLoading ? (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
                      <span className="text-[7px] font-mono font-bold text-rose-400 mt-1 uppercase tracking-widest">Zeichne...</span>
                    </div>
                  ) : sidekickAvatar ? (
                    <img
                      src={sidekickAvatar}
                      alt={sidekickName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-700" />
                  )}
                  <div className="absolute inset-0 glossy-finish pointer-events-none" />
                </div>

                {/* Name Input */}
                <div className="flex-grow min-w-0">
                  <label className="block text-[10px] font-bangers text-slate-400 tracking-wider mb-1">CHARAKTERNAME</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sidekickName}
                      onChange={(e) => setSidekickName(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400 font-sans font-bold"
                    />
                    <Edit2 className="w-3 h-3 text-slate-600 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Visual Description Textarea */}
              <div className="mb-4">
                <label className="block text-[10px] font-bangers text-slate-400 tracking-wider mb-1">AUSSEHEN & KÖSTUMBESCHREIBUNG</label>
                <textarea
                  value={sidekickDesc}
                  onChange={(e) => setSidekickDesc(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-400 h-20 resize-none font-sans leading-relaxed"
                  placeholder="Beschreibe Haare, Roboterteile, Haustier-Rolle, Gesichtszüge..."
                />
              </div>

              {/* Prompt Refinement Adjustment (Optional modifier) */}
              <div className="mb-4">
                <label className="block text-[10px] font-bangers text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                  OPTIONAL: VERFEINERUNGS-WUNSCH (Z.B. "WÜTEND", "WINKEND")
                </label>
                <input
                  type="text"
                  value={sidekickRefine}
                  onChange={(e) => setSidekickRefine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 focus:outline-none focus:border-rose-400 font-sans"
                  placeholder="Gibt kleinere Korrekturen an den bestehenden Avatar..."
                />
              </div>
            </div>

            {/* Action button to generate */}
            <button
              type="button"
              onClick={() => handleRegenerate("sidekick")}
              disabled={sidekickLoading}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-bangers tracking-wider text-xs rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sidekickLoading ? "animate-spin" : ""}`} />
              AVATAR NEU ZEICHNEN
            </button>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t-3 border-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-950 text-slate-400 text-xs font-bangers tracking-wider rounded-xl hover:text-white border-2 border-slate-800 transition-colors"
          >
            ABBRECHEN
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bangers tracking-wider rounded-xl shadow-[4px_4px_0px_#000] border-2 border-slate-950 flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5 active:shadow-none"
          >
            <Check className="w-4 h-4" /> SPEICHERN & SCHLIESSEN
          </button>
        </div>

      </div>
    </div>
  );
}

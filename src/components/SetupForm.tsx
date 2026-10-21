import React, { useState } from "react";
import { Character, Comic } from "../types";
import {
  GENRE_PRESETS,
  HERO_PRESETS,
  SIDEKICK_PRESETS,
  LANGUAGES,
  TONES
} from "../data";
import {
  Sparkles,
  Zap,
  Rocket,
  Skull,
  Eye,
  Shield,
  HelpCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Save,
  CheckCircle,
  BookOpen,
  Languages
} from "lucide-react";

interface SetupFormProps {
  onGenerateComic: (setupData: {
    hero: Character;
    sidekick: Character;
    genre: string;
    premise: string;
    language: string;
    tone: string;
  }) => void;
  isGenerating: boolean;
  onLoadPredefinedCharacters?: (hero: Character, sidekick: Character) => void;
  savedCharacters: Character[];
}

export default function SetupForm({ onGenerateComic, isGenerating, savedCharacters }: SetupFormProps) {
  const [step, setStep] = useState<number>(1); // 1: Hero, 2: Sidekick, 3: Premise & Genre
  
  // Hero State
  const [heroName, setHeroName] = useState("Astra Spark");
  const [heroDesc, setHeroDesc] = useState(HERO_PRESETS[0].visualDescription);
  const [heroAvatar, setHeroAvatar] = useState<string>("");
  const [heroPhoto, setHeroPhoto] = useState<string>("");
  const [heroRefinePrompt, setHeroRefinePrompt] = useState("");
  const [heroGenLoading, setHeroGenLoading] = useState(false);

  // Sidekick State
  const [sidekickName, setSidekickName] = useState("Sparky (Der Roboter)");
  const [sidekickDesc, setSidekickDesc] = useState(SIDEKICK_PRESETS[0].visualDescription);
  const [sidekickAvatar, setSidekickAvatar] = useState<string>("");
  const [sidekickPhoto, setSidekickPhoto] = useState<string>("");
  const [sidekickRefinePrompt, setSidekickRefinePrompt] = useState("");
  const [sidekickGenLoading, setSidekickGenLoading] = useState(false);

  // Comic State
  const [selectedGenre, setSelectedGenre] = useState(GENRE_PRESETS[0].id);
  const [premise, setPremise] = useState(GENRE_PRESETS[0].samplePremises[0]);
  const [language, setLanguage] = useState("Deutsch");
  const [tone, setTone] = useState("Dramatic & Epic");

  // Save State
  const [isSavedHero, setIsSavedHero] = useState(false);
  const [isSavedSidekick, setIsSavedSidekick] = useState(false);

  // Load Preset Hero
  const applyHeroPreset = (p: typeof HERO_PRESETS[0]) => {
    setHeroName(p.name);
    setHeroDesc(p.visualDescription);
    setHeroAvatar("");
    setHeroPhoto("");
    setHeroRefinePrompt("");
    setIsSavedHero(false);
  };

  // Load Preset Sidekick
  const applySidekickPreset = (p: typeof SIDEKICK_PRESETS[0]) => {
    setSidekickName(p.name);
    setSidekickDesc(p.visualDescription);
    setSidekickAvatar("");
    setSidekickPhoto("");
    setSidekickRefinePrompt("");
    setIsSavedSidekick(false);
  };

  // Convert uploaded file to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, role: "hero" | "sidekick") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (role === "hero") {
        setHeroPhoto(base64);
        setHeroAvatar(""); // clear pre-existing avatar
      } else {
        setSidekickPhoto(base64);
        setSidekickAvatar(""); // clear pre-existing avatar
      }
    };
    reader.readAsDataURL(file);
  };

  // Call API to generate character avatar
  const generateAvatar = async (role: "hero" | "sidekick") => {
    const isLoading = role === "hero" ? setHeroGenLoading : setSidekickGenLoading;
    const name = role === "hero" ? heroName : sidekickName;
    const visualDescription = role === "hero" ? heroDesc : sidekickDesc;
    const base64Photo = role === "hero" ? heroPhoto : sidekickPhoto;
    const refinePrompt = role === "hero" ? heroRefinePrompt : sidekickRefinePrompt;
    const setAvatar = role === "hero" ? setHeroAvatar : setSidekickAvatar;

    try {
      isLoading(true);
      const res = await fetch("/api/character/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          visualDescription,
          genre: selectedGenre,
          base64Photo,
          refinePrompt
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setAvatar(data.imageUrl);
        if (role === "hero") setIsSavedHero(false);
        else setIsSavedSidekick(false);
      } else if (data.error) {
        alert("Fehler bei der Generierung: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Es gab ein Problem beim Verbinden zum Server.");
    } finally {
      isLoading(false);
    }
  };

  // Save character to local collection library
  const saveCharacterToLibrary = (role: "hero" | "sidekick") => {
    const name = role === "hero" ? heroName : sidekickName;
    const visualDescription = role === "hero" ? heroDesc : sidekickDesc;
    const avatarUrl = role === "hero" ? heroAvatar : sidekickAvatar;
    const base64Photo = role === "hero" ? heroPhoto : sidekickPhoto;
    const setIsSaved = role === "hero" ? setIsSavedHero : setIsSavedSidekick;

    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      visualDescription,
      avatarUrl,
      base64Photo,
      createdAt: new Date().toISOString(),
    };

    try {
      const savedChars = localStorage.getItem("infinite_heroes_characters");
      const charactersList: Character[] = savedChars ? JSON.parse(savedChars) : [];
      charactersList.push(newChar);
      localStorage.setItem("infinite_heroes_characters", JSON.stringify(charactersList));
      setIsSaved(true);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Speichern im Archiv.");
    }
  };

  const selectRandomPremise = () => {
    const genreObj = GENRE_PRESETS.find((g) => g.id === selectedGenre);
    if (genreObj) {
      const randomIdx = Math.floor(Math.random() * genreObj.samplePremises.length);
      setPremise(genreObj.samplePremises[randomIdx]);
    }
  };

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    const genreObj = GENRE_PRESETS.find((g) => g.id === genreId);
    if (genreObj) {
      setPremise(genreObj.samplePremises[0]);
    }
  };

  const handleSubmit = () => {
    const heroChar: Character = {
      id: "hero_" + Date.now(),
      name: heroName,
      role: "hero",
      visualDescription: heroDesc,
      avatarUrl: heroAvatar || undefined,
      base64Photo: heroPhoto || undefined,
      createdAt: new Date().toISOString()
    };

    const sidekickChar: Character = {
      id: "sidekick_" + Date.now(),
      name: sidekickName,
      role: "sidekick",
      visualDescription: sidekickDesc,
      avatarUrl: sidekickAvatar || undefined,
      base64Photo: sidekickPhoto || undefined,
      createdAt: new Date().toISOString()
    };

    onGenerateComic({
      hero: heroChar,
      sidekick: sidekickChar,
      genre: selectedGenre,
      premise,
      language,
      tone
    });
  };

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "zap": return <Zap className={className} />;
      case "rocket": return <Rocket className={className} />;
      case "skull": return <Skull className={className} />;
      case "eye": return <Eye className={className} />;
      case "shield": return <Shield className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  return (
    <div id="setup-form-container" className="bg-slate-900 border-4 border-slate-950 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Dynamic diagonal stripe */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400 -rotate-45 opacity-5 pointer-events-none" />
      
      {/* Header and Step Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b-4 border-slate-950">
        <div>
          <h1 className="text-3xl font-bangers tracking-wider text-rose-500 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            HERO CREATOR ENGINE
          </h1>
          <p className="text-slate-400 text-xs font-sans mt-0.5">Konfiguriere deine Charaktere und entfessele eine neue Geschichte</p>
        </div>

        {/* Multi-step status */}
        <div className="flex items-center gap-2 font-bangers">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => step > s && setStep(s)}
              disabled={isGenerating}
              className={`w-10 h-10 rounded-xl border-2 border-slate-950 flex items-center justify-center transition-all ${
                step === s
                  ? "bg-amber-400 text-slate-950 scale-110 shadow-[2px_2px_0px_#000]"
                  : step > s
                  ? "bg-emerald-500 text-slate-950 cursor-pointer"
                  : "bg-slate-950 text-slate-500 cursor-not-allowed"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: HERO CONFIG */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border-2 border-amber-400/30 p-3 rounded-2xl flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bangers text-amber-400 text-base">SCHRITT 1: DER HAUPTHELD</h3>
              <p className="text-slate-300 text-xs font-sans mt-0.5">Gib deinem Helden einen Namen, wähle ein Preset oder lade ein Foto hoch, um einen einzigartigen Comic-Avatar zu zeichnen.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left inputs */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-slate-400 font-bangers text-xs mb-1.5">HELDEN-NAME</label>
                <input
                  type="text"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2 text-sm text-slate-100 font-sans focus:outline-none"
                  placeholder="Z.B. Captain Cosmos"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bangers text-xs mb-1.5">VISUELLE BESCHREIBUNG & AUSSEHEN</label>
                <textarea
                  value={heroDesc}
                  onChange={(e) => setHeroDesc(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-sans focus:outline-none h-24 resize-none"
                  placeholder="Detaillierte Beschreibung des Aussehens, Kostüms und auffälliger Merkmale..."
                />
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-slate-500 font-bangers text-[10px] tracking-wider mb-2">SCHNELLE PRESETS LADEN</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {HERO_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyHeroPreset(p)}
                      className="px-2.5 py-1.5 text-[10px] font-sans bg-slate-950 border-2 border-slate-800 hover:border-amber-400 rounded-xl text-slate-300 hover:text-white transition-colors truncate"
                    >
                      ⚡ {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Interactive avatar generator */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/60 border-2 border-slate-800/80 p-4 rounded-2xl relative">
              <h4 className="font-bangers text-slate-400 text-xs mb-3 flex items-center justify-between">
                <span>COMIC-AVATAR GENERATOR</span>
                <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Optional</span>
              </h4>

              <div className="flex flex-col items-center gap-4">
                <div className="w-36 h-36 bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                  {heroGenLoading ? (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-bangers text-amber-400 tracking-wider">ZEICHNE AVATAR...</span>
                    </div>
                  ) : null}

                  {heroAvatar ? (
                    <img src={heroAvatar} alt="Hero avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : heroPhoto ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-slate-900">
                      <img src={heroPhoto} alt="Upload raw" className="w-full h-full object-cover opacity-40 rounded" />
                      <div className="absolute text-[9px] font-bangers text-amber-400 text-center px-1">FOTO GELADEN! KLICKE JETZT AUF AVATAR ERSTELLEN</div>
                    </div>
                  ) : (
                    <div className="text-center p-3 text-slate-600 flex flex-col items-center gap-2">
                      <BookOpen className="w-10 h-10 text-slate-800" />
                      <span className="text-[10px] font-sans">Noch kein Avatar vorhanden</span>
                    </div>
                  )}
                  <div className="absolute inset-0 glossy-finish" />
                </div>

                {/* Photo upload trigger */}
                <div className="w-full flex gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-sans hover:text-white transition-all text-center">
                    <Upload className="w-3.5 h-3.5 text-rose-400" />
                    <span>{heroPhoto ? "Foto ändern" : "Foto hochladen"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "hero")}
                      className="hidden"
                    />
                  </label>

                  {heroAvatar && !isSavedHero && (
                    <button
                      type="button"
                      onClick={() => saveCharacterToLibrary("hero")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-sans transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Archivieren
                    </button>
                  )}
                  {isSavedHero && (
                    <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-sans flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Gespeichert!
                    </div>
                  )}
                </div>

                {/* Prompt refinement */}
                <div className="w-full space-y-2 mt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Avatar anpassen (z.B. 'Trägt eine rote Maske')"
                      value={heroRefinePrompt}
                      onChange={(e) => setHeroRefinePrompt(e.target.value)}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => generateAvatar("hero")}
                      disabled={heroGenLoading}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bangers text-xs tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${heroGenLoading ? "animate-spin" : ""}`} />
                      {heroAvatar ? "ANPASSEN" : "ERSTELLEN"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-slate-950">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bangers tracking-wider text-sm rounded-xl transition-all shadow-[4px_4px_0px_#000] border-2 border-slate-950 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              WEITER ZUM CO-STAR <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SIDEKICK CONFIG */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-rose-500/10 border-2 border-rose-400/30 p-3 rounded-2xl flex items-start gap-2.5">
            <div className="p-1.5 bg-rose-500 text-slate-950 rounded-lg">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bangers text-rose-400 text-base">SCHRITT 2: DER CO-STAR / GEFÄHRTE (SIDEKICK)</h3>
              <p className="text-slate-300 text-xs font-sans mt-0.5">Jeder legendäre Held braucht Unterstützung. Erstelle den perfekten Sidekick, der deinen Helden durch dick und dünn begleitet.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left inputs */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-slate-400 font-bangers text-xs mb-1.5">SIDEKICK-NAME</label>
                <input
                  type="text"
                  value={sidekickName}
                  onChange={(e) => setSidekickName(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2 text-sm text-slate-100 font-sans focus:outline-none"
                  placeholder="Z.B. Sparky der Roboter"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bangers text-xs mb-1.5">VISUELLE BESCHREIBUNG & AUSSEHEN</label>
                <textarea
                  value={sidekickDesc}
                  onChange={(e) => setSidekickDesc(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-sans focus:outline-none h-24 resize-none"
                  placeholder="Detaillierte Beschreibung des Aussehens, Kostüms und auffälliger Merkmale..."
                />
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-slate-500 font-bangers text-[10px] tracking-wider mb-2">SCHNELLE PRESETS LADEN</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SIDEKICK_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applySidekickPreset(p)}
                      className="px-2.5 py-1.5 text-[10px] font-sans bg-slate-950 border-2 border-slate-800 hover:border-amber-400 rounded-xl text-slate-300 hover:text-white transition-colors truncate"
                    >
                      🚀 {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right avatar builder */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/60 border-2 border-slate-800/80 p-4 rounded-2xl relative">
              <h4 className="font-bangers text-slate-400 text-xs mb-3 flex items-center justify-between">
                <span>COMIC-AVATAR GENERATOR</span>
                <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Optional</span>
              </h4>

              <div className="flex flex-col items-center gap-4">
                <div className="w-36 h-36 bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                  {sidekickGenLoading ? (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-bangers text-amber-400 tracking-wider">ZEICHNE AVATAR...</span>
                    </div>
                  ) : null}

                  {sidekickAvatar ? (
                    <img src={sidekickAvatar} alt="Sidekick avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : sidekickPhoto ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-slate-900">
                      <img src={sidekickPhoto} alt="Upload raw" className="w-full h-full object-cover opacity-40 rounded" />
                      <div className="absolute text-[9px] font-bangers text-amber-400 text-center px-1">FOTO GELADEN! KLICKE JETZT AUF AVATAR ERSTELLEN</div>
                    </div>
                  ) : (
                    <div className="text-center p-3 text-slate-600 flex flex-col items-center gap-2">
                      <BookOpen className="w-10 h-10 text-slate-800" />
                      <span className="text-[10px] font-sans">Noch kein Avatar vorhanden</span>
                    </div>
                  )}
                  <div className="absolute inset-0 glossy-finish" />
                </div>

                {/* Photo upload trigger */}
                <div className="w-full flex gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-sans hover:text-white transition-all text-center">
                    <Upload className="w-3.5 h-3.5 text-rose-400" />
                    <span>{sidekickPhoto ? "Foto ändern" : "Foto hochladen"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "sidekick")}
                      className="hidden"
                    />
                  </label>

                  {sidekickAvatar && !isSavedSidekick && (
                    <button
                      type="button"
                      onClick={() => saveCharacterToLibrary("sidekick")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-sans transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Archivieren
                    </button>
                  )}
                  {isSavedSidekick && (
                    <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-sans flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Gespeichert!
                    </div>
                  )}
                </div>

                {/* Prompt refinement */}
                <div className="w-full space-y-2 mt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Avatar anpassen (z.B. 'Trägt ein blaues Band')"
                      value={sidekickRefinePrompt}
                      onChange={(e) => setSidekickRefinePrompt(e.target.value)}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => generateAvatar("sidekick")}
                      disabled={sidekickGenLoading}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bangers text-xs tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${sidekickGenLoading ? "animate-spin" : ""}`} />
                      {sidekickAvatar ? "ANPASSEN" : "ERSTELLEN"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t-2 border-slate-950">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-950 border-2 border-slate-800 hover:border-slate-700 text-slate-300 font-bangers tracking-wider text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ZURÜCK
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bangers tracking-wider text-sm rounded-xl transition-all shadow-[4px_4px_0px_#000] border-2 border-slate-950 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              WEITER ZUR GESCHICHTE <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: STORY PREMISE & GENRE */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Genre selector */}
          <div>
            <label className="block text-slate-400 font-bangers text-xs mb-3">WÄHLE DAS COMIC-GENRE</label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {GENRE_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGenreChange(g.id)}
                  className={`border-3 p-3.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer relative overflow-hidden ${
                    selectedGenre === g.id
                      ? `border-amber-400 bg-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.2)] scale-[1.02]`
                      : "border-slate-950 bg-slate-950/40 hover:bg-slate-950/60"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${g.color} flex items-center justify-center text-slate-950 shadow mb-2`}>
                    {renderIcon(g.icon, "w-5 h-5")}
                  </div>
                  <h4 className="font-bangers text-slate-200 text-xs tracking-wide">{g.germanName}</h4>
                  <p className="text-[9px] text-slate-500 font-sans leading-snug mt-1 line-clamp-2">{g.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Premise input & suggestions */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-slate-400 font-bangers text-xs">GESCHICHTS-PRÄMISSE (PREMISE)</label>
              <button
                type="button"
                onClick={selectRandomPremise}
                className="text-[10px] text-amber-400 hover:underline font-bangers flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                ZUFÄLLIGER VORSCHLAG
              </button>
            </div>
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-sans focus:outline-none h-20 resize-none"
              placeholder="Worum soll es in diesem Comic gehen? Beschreibe den Kernkonflikt..."
            />
          </div>

          {/* Localization & Tone selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bangers text-xs mb-1.5">SPRACHE DER DIALOGE</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2 text-xs text-slate-100 font-sans focus:outline-none appearance-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-950">
                      {l.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                  <Languages className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bangers text-xs mb-1.5">ERZÄHL-STIL & TONFALL</label>
              <div className="relative">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-400 rounded-xl px-4 py-2 text-xs text-slate-100 font-sans focus:outline-none appearance-none cursor-pointer"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-slate-950">
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex justify-between pt-4 border-t-2 border-slate-950">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-950 border-2 border-slate-800 hover:border-slate-700 text-slate-300 font-bangers tracking-wider text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ZURÜCK
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bangers tracking-wider text-base rounded-xl transition-all shadow-[6px_6px_0px_#f43f5e] hover:shadow-[4px_4px_0px_#f43f5e] border-3 border-slate-950 flex items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none"
            >
              <Zap className="w-5 h-5 fill-current animate-bounce" />
              COMIC ERSTELLEN STARTEN!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

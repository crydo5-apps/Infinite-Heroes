/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenrePreset {
  id: string;
  name: string;
  germanName: string;
  description: string;
  icon: string;
  color: string;
  samplePremises: string[];
}

export interface CharacterPreset {
  name: string;
  role: "hero" | "sidekick";
  visualDescription: string;
  avatarUrl?: string;
}

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: "Superhero Action",
    name: "Superhero Action",
    germanName: "Superhelden-Action",
    description: "Farbenfrohe, dynamische Action mit strahlenden Helden, fiesen Schurken und epischen Spezialeffekten.",
    icon: "zap",
    color: "from-amber-400 to-red-500",
    samplePremises: [
      "Ein Meteorit schlägt ein und verleiht einem normalen Bibliothekar die Macht, die Zeit anzuhalten.",
      "Ein fieser Erzbösewicht stiehlt das Wahrzeichen der Stadt, um eine riesige Laserwaffe zu bauen.",
      "Ein interdimensionales Portal öffnet sich mitten in der U-Bahn und Roboter-Krabben strömen heraus."
    ]
  },
  {
    id: "Classic Horror",
    name: "Classic Horror",
    germanName: "Klassischer Horror",
    description: "Hommage an die gruseligen 1950er Comic-Hefte mit Monstern, Nebel, Grusel-Häusern und Gänsehaut.",
    icon: "skull",
    color: "from-green-600 to-emerald-950",
    samplePremises: [
      "Zwei Abenteurer verlaufen sich in einem nebligen Sumpf und entdecken eine uralte, verfluchte Hütte.",
      "Der Dorf-Uhrmacher erschafft eine Kuckucksuhr, die die Zeit rückwärts laufen lässt – mit schrecklichen Folgen.",
      "Eine mysteriöse Jahrmarkt-Attraktion erwacht nachts zum Leben und stiehlt die Schatten der Besucher."
    ]
  },
  {
    id: "Dark Sci-Fi",
    name: "Dark Sci-Fi",
    germanName: "Düsteres Sci-Fi",
    description: "Spannung in den Weiten des Alls. Dreckige Raumschiffe, künstliche Intelligenz und kosmische Rätsel.",
    icon: "rocket",
    color: "from-indigo-600 to-slate-900",
    samplePremises: [
      "Eine einsame Bergbau-Sonde sendet ein seltsames Notsignal aus dem Inneren eines Asteroidengürtels.",
      "Die Haupt-KI eines Generationenraumschiffs beschließt, dass Schlafen die beste Überlebenschance ist.",
      "Astronauten entdecken auf einem Eisplaneten eine riesige, pulsierende Pyramide aus reinem Glas."
    ]
  },
  {
    id: "Neon Noir",
    name: "Neon Noir",
    germanName: "Neon Noir",
    description: "Regennasse Straßen, rauchende Detektive, funkelnde Neonreklamen und moralische Grauzonen.",
    icon: "eye",
    color: "from-fuchsia-600 to-purple-950",
    samplePremises: [
      "Ein abgehalfterter Privatdetektiv erhält den Auftrag, ein gestohlenes Hologramm-Haustier zu finden.",
      "In einer Stadt, in der Träume digital verkauft werden, taucht plötzlich ein tödlicher Albtraum-Virus auf.",
      "Eine geheimnisvolle Femme Fatale bittet um Hilfe, um Beweise gegen den allmächtigen Tech-Konzern zu sichern."
    ]
  },
  {
    id: "Fantasy Quest",
    name: "Fantasy Quest",
    germanName: "Fantasy-Abenteuer",
    description: "Epische Reisen durch geheimnisvolle Wälder, schwebende Inseln, Zaubersprüche und Fabelwesen.",
    icon: "shield",
    color: "from-blue-500 to-violet-700",
    samplePremises: [
      "Ein junger Bäckerlehrling findet ein sprechendes Schwert, das Angst vor Dunkelheit hat.",
      "Ein uralter Drache bittet die Helden, seinen gestohlenen Schatz – eine Sammlung von Kochrezepten – zurückzuholen.",
      "Die schwebende Insel der Magier verliert an Höhe, weil jemand den magischen Kristall als Briefbeschwerer benutzt."
    ]
  }
];

export const HERO_PRESETS: CharacterPreset[] = [
  {
    name: "Astra Spark",
    role: "hero",
    visualDescription: "Eine junge, athletische Frau im silbernen Raumanzug mit leuchtend blauem Haar, trägt ein glühendes Energiemedaillon."
  },
  {
    name: "Detektiv Jack",
    role: "hero",
    visualDescription: "Ein charismatischer Mann mittleren Alters mit einem klassischen grauen Trenchcoat, Dreitagebart, tief ins Gesicht gezogenem Hut und brennender Zigarre."
  },
  {
    name: "Valerie Flammenherz",
    role: "hero",
    visualDescription: "Eine stolze Ritterin in gold-rot verzierter Plattenrüstung, mit feurig rotem Zopf und einem prachtvollen Schutzschild."
  },
  {
    name: "Prof. Viktor Uhrwerk",
    role: "hero",
    visualDescription: "Ein älterer, exzentrischer Erfinder mit wildem weißen Haar, Messing-Steampunk-Brille, brauner Weste und einer mechanischen Hand."
  }
];

export const SIDEKICK_PRESETS: CharacterPreset[] = [
  {
    name: "Sparky (Der Roboter)",
    role: "sidekick",
    visualDescription: "Ein kleiner, schwebender Einrad-Roboter mit großen, ausdrucksstarken digitalen Kulleraugen und wackelnden Antennen."
  },
  {
    name: "Luna (Die Schattenkatze)",
    role: "sidekick",
    visualDescription: "Eine mysteriöse, schlanke schwarze Katze mit funkelnden violetten Augen und zwei buschigen Schwänzen, die leicht schimmern."
  },
  {
    name: "Gimli der Gnom",
    role: "sidekick",
    visualDescription: "Ein kleiner, rundlicher Gnom mit grünem Lederhut, Brille auf der Nase und einer riesigen Ledertasche voller seltsamer Tränke."
  },
  {
    name: "Chrono-Uhr",
    role: "sidekick",
    visualDescription: "Eine antike, goldene Taschenuhr, die schweben kann, kleine mechanische Flügel besitzt und ein tickendes Zifferblatt mit Gesicht hat."
  }
];

export const LANGUAGES = [
  { code: "Deutsch", label: "Deutsch 🇩🇪" },
  { code: "English", label: "English 🇺🇸" },
  { code: "Español", label: "Español 🇪🇸" },
  { code: "Français", label: "Français 🇫🇷" },
  { code: "Italiano", label: "Italiano 🇮🇹" },
  { code: "日本語", label: "日本語 🇯🇵" }
];

export const TONES = [
  { value: "Dramatic & Epic", label: "Dramatisch & Episch 🎬" },
  { value: "Funny & Humorous", label: "Lustig & Humorvoll 🤪" },
  { value: "Spooky & Suspenseful", label: "Spannend & Gruselig 👻" },
  { value: "Classic Retro Comic Style", label: "Klassischer Retro-Stil 📻" },
  { value: "Grim & Gritty", label: "Düster & Brutal 🗡️" }
];

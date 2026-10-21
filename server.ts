import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to support base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK lazily to prevent startup crash if API key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure clean error response helper
function handleApiError(res: Response, error: any, message: string) {
  console.error(message, error);
  res.status(500).json({
    error: message,
    details: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Generate a beautifully stylized SVG comic book panel fallback when image generation fails due to API limits.
 */
function generateFallbackSvg(width: number, height: number, text: string, genre: string, subtext: string = ""): string {
  const escapeSvg = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const cleanText = escapeSvg(text || "SCENE");
  const cleanSubtext = escapeSvg(subtext || "");

  // Choose colors based on genre
  let bgGradientStart = "#f43f5e"; // Rose
  let bgGradientEnd = "#e11d48";
  let accentColor = "#fde047"; // Yellow
  let textColor = "#ffffff";
  let moodLabel = "ADVENTURE";

  if (genre === "Superhero Action") {
    bgGradientStart = "#3b82f6"; // Blue
    bgGradientEnd = "#1d4ed8";
    accentColor = "#fbbf24"; // Amber
    moodLabel = "SUPERHERO ACTION";
  } else if (genre === "Classic Horror") {
    bgGradientStart = "#14532d"; // Dark Green
    bgGradientEnd = "#022c22";
    accentColor = "#b91c1c"; // Red
    moodLabel = "CLASSIC HORROR";
  } else if (genre === "Dark Sci-Fi") {
    bgGradientStart = "#4c1d95"; // Dark Purple
    bgGradientEnd = "#1e1b4b";
    accentColor = "#06b6d4"; // Cyan
    moodLabel = "DARK SCI-FI";
  } else if (genre === "Neon Noir") {
    bgGradientStart = "#0f172a"; // Dark Slate
    bgGradientEnd = "#020617";
    accentColor = "#ec4899"; // Hot Pink
    moodLabel = "NEON NOIR";
  }

  // Create lines of subtext for manual wrapping inside the SVG
  const words = cleanSubtext.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).length > 40) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  // Generate wrapped <tspan> elements for subtext
  const maxLinesToShow = Math.min(lines.length, 5);
  let subtextTspans = "";
  for (let i = 0; i < maxLinesToShow; i++) {
    const dyValue = i === 0 ? 0 : 16;
    subtextTspans += `<tspan x="50%" dy="${dyValue}">${lines[i]}</tspan>`;
  }

  // Halftone or starburst dots in background
  let dots = "";
  for (let x = 20; x < width; x += 40) {
    for (let y = 20; y < height; y += 40) {
      dots += `<circle cx="${x}" cy="${y}" r="2" fill="rgba(255,255,255,0.07)" />`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <defs>
      <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
      <pattern id="halftone" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="1.5" fill="rgba(0,0,0,0.12)" />
      </pattern>
    </defs>

    <!-- Outer Frame Border -->
    <rect width="${width}" height="${height}" fill="url(#fallbackGrad)" rx="16" />
    <rect width="${width}" height="${height}" fill="url(#halftone)" rx="16" />
    
    <!-- Dots pattern -->
    ${dots}

    <!-- Retro Comic Starburst -->
    <path d="M ${width/2} ${height/2 - 90} L ${width/2 + 25} ${height/2 - 40} L ${width/2 + 85} ${height/2 - 50} L ${width/2 + 45} ${height/2 - 15} L ${width/2 + 95} ${height/2 + 10} L ${width/2 + 40} ${height/2 + 25} L ${width/2 + 55} ${height/2 + 85} L ${width/2 + 10} ${height/2 + 45} L ${width/2 - 40} L ${width/2 - 10} L ${width/2 - 85} ${height/2 + 30} L ${width/2 - 45} L ${width/2 - 95} ${height/2 - 20} L ${width/2 - 35} ${height/2 - 30} Z" 
          fill="${accentColor}" stroke="#000" stroke-width="4" stroke-linejoin="miter" transform="translate(0, -20) scale(1.1) translate(${-(width/2 * 0.1)}, ${-(height/2 * 0.1 - 2)})" opacity="0.85" />
    
    <path d="M ${width/2} ${height/2 - 70} L ${width/2 + 20} ${height/2 - 30} L ${width/2 + 70} ${height/2 - 35} L ${width/2 + 35} ${height/2 - 10} L ${width/2 + 75} ${height/2 + 10} L ${width/2 + 30} ${height/2 + 20} L ${width/2 + 45} ${height/2 + 65} L ${width/2 + 10} ${height/2 + 35} L ${width/2 - 30} L ${width/2 - 10} L ${width/2 - 70} ${height/2 + 20} L ${width/2 - 35} L ${width/2 - 75} ${height/2 - 15} L ${width/2 - 25} ${height/2 - 25} Z" 
          fill="#ffffff" stroke="#000" stroke-width="3" stroke-linejoin="miter" transform="translate(0, -20)" />

    <!-- Style/Genre Tag -->
    <rect x="${width/2 - 70}" y="20" width="140" height="18" fill="#000000" rx="4" />
    <text x="50%" y="32" font-family="'Impact', 'Arial Black', sans-serif" font-size="10" fill="${accentColor}" text-anchor="middle" letter-spacing="1.5">${moodLabel}</text>

    <!-- Comic Text Title -->
    <g transform="rotate(-5, ${width/2}, ${height/2 - 20})">
      <text x="${width/2 + 3}" y="${height/2 - 10}" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" fill="#000000" text-anchor="middle" font-weight="900">${cleanText.toUpperCase()}</text>
      <text x="${width/2}" y="${height/2 - 13}" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" fill="${textColor}" stroke="#000000" stroke-width="3" stroke-linejoin="round" text-anchor="middle" font-weight="900">${cleanText.toUpperCase()}</text>
    </g>

    <!-- Subtitle description block (centered at the bottom) -->
    <g transform="translate(0, ${height/2 + 50})">
      <rect x="25" y="0" width="${width - 50}" height="100" fill="#ffffff" stroke="#000" stroke-width="3" rx="8" />
      <rect x="25" y="0" width="${width - 50}" height="100" fill="rgba(253, 224, 71, 0.15)" rx="8" />
      
      <rect x="40" y="-8" width="80" height="15" fill="#000" rx="3" />
      <text x="80" y="3" font-family="'Impact', 'Arial Black', sans-serif" font-size="9" fill="#fff" text-anchor="middle">SCENE PROMPT</text>

      <text x="50%" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">
        ${subtextTspans}
      </text>
    </g>

    <!-- Technical Fallback notice -->
    <text x="50%" y="${height - 18}" font-family="monospace" font-size="8" fill="rgba(255,255,255,0.4)" text-anchor="middle">LIVE AI ENGINE • RATE LIMIT REACHED • AUTOFALLBACK</text>

    <!-- Frame inner outline -->
    <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="#000000" stroke-width="3" rx="12" />
  </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Robust wrapper around GoogleGenAI model call with exponential backoff for rate limits.
 */
async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 2, delayMs = 1500) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }
      console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms... Error:`, err?.message || err);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * Endpoint: Generate character avatar (Comic character sheet)
 * Supports text-to-image or image-to-image (stylization)
 */
app.post("/api/character/generate", async (req: Request, res: Response) => {
  try {
    const { name, role, visualDescription, genre, base64Photo, refinePrompt } = req.body;
    const ai = getAiClient();

    let styleInstruction = "";
    if (genre === "Superhero Action") {
      styleInstruction = "vibrant dynamic superhero comic book art, detailed ink outlines, cel-shaded coloring, heroic lighting";
    } else if (genre === "Classic Horror") {
      styleInstruction = "vintage retro horror comic style, hand-drawn halftone shading, heavy dark shadows, eerie gothic atmosphere";
    } else if (genre === "Dark Sci-Fi") {
      styleInstruction = "gritty retro futuristic cyberpunk comic art, high-contrast, atmospheric dust, dramatic cosmic neon backlight";
    } else if (genre === "Neon Noir") {
      styleInstruction = "high-contrast graphic novel detective noir, dark shadows with intense hot-neon accents, moody rain-slicked lighting";
    } else {
      styleInstruction = "retro comic book illustration style, detailed ink linework, vintage halftone texture, classic comic coloring";
    }

    let prompt = `A professional comic book portrait character-sheet of "${name}" who is the ${role}. `;
    prompt += `Appearance: ${visualDescription}. `;
    prompt += `Aesthetic style: ${styleInstruction}. `;
    if (refinePrompt) {
      prompt += `Modification: ${refinePrompt}. Ensure the character maintains their core facial traits but with this adjust. `;
    }
    prompt += `Centered portrait composition, neutral background, perfect details, comic cover quality, clean ink lines, no text.`;

    const contents: any[] = [];
    if (base64Photo) {
      // If photo is provided, we perform image stylization / image-to-image
      const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        }
      });
      // Adjust prompt for stylization
      prompt = `Redraw the person in this photo as a comic-book character named "${name}" who is the ${role}. ` +
               `Maintain key facial structure, hairstyle, and traits, but translate completely into: ${styleInstruction}. ` +
               `Appearance details to keep/add: ${visualDescription}. ` +
               (refinePrompt ? `Adjustments: ${refinePrompt}. ` : "") +
               `Centered portrait composition, no text, clean ink lines, retro comic book art, vintage feel.`;
    }

    contents.push({ text: prompt });

    // Call Image Generation Model
    let base64Image = "";
    try {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.1-flash-lite-image",
        contents: { parts: contents },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      // Find the image in the parts
      if (response && response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }
    } catch (innerError) {
      console.warn("Character avatar generation failed, using fallback SVG.", innerError);
    }

    if (!base64Image) {
      const fallbackUrl = generateFallbackSvg(512, 512, name || "HELD", genre || "Superhero Action", `Charaktersheet: ${visualDescription}`);
      return res.json({
        imageUrl: fallbackUrl,
        isFallback: true,
        promptUsed: prompt
      });
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      promptUsed: prompt,
      isFallback: false
    });

  } catch (error) {
    // Top-level catch just in case, return fallback rather than crash
    const fallbackUrl = generateFallbackSvg(512, 512, req.body.name || "HELD", req.body.genre || "Superhero Action", `Charaktersheet: ${req.body.visualDescription || ""}`);
    res.json({
      imageUrl: fallbackUrl,
      isFallback: true,
      promptUsed: "",
      errorInfo: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Endpoint: Generate whole comic script (20 pages) in one single JSON step
 */
app.post("/api/comic/script", async (req: Request, res: Response) => {
  try {
    const { hero, sidekick, genre, premise, language, tone } = req.body;
    const ai = getAiClient();

    const systemInstruction = `You are an expert, award-winning comic book writer and layout designer.
You write highly engaging, beautifully paced stories with a strong cinematic feel.
Your task is to write a complete 20-page comic book script in the language: ${language || "German"}.
The tone of the story is: ${tone || "Dramatic and epic"}.
The genre is: ${genre}.
The core premise is: ${premise || "An unexpected encounter that changes everything."}

Main Characters:
1. Hero: Name: "${hero.name}", Description: "${hero.visualDescription}".
2. Sidekick: Name: "${sidekick.name}", Description: "${sidekick.visualDescription}".

STRICT STRUCTURE INSTRUCTIONS:
The comic MUST have exactly 20 pages (indexed 0 to 19):
- Page 0 (Cover): Must have pageNumber: 0. The title must be an awesome, memorable comic title. The dialogue must be a cinematic teaser/slogan (e.g. "Der Tag des Jüngsten Gerichts ist da!").
- Pages 1 to 18 (Comic pages): Standard chronological story pages with actions, caption titles, and dialogue. The story should follow a classic 3-act narrative arc:
  - Act 1 (Pages 1-6): Setup, Inciting Incident, and Call to Adventure.
  - Act 2 (Pages 7-14): Rising action, obstacles, confrontation, and the lowest point.
  - Act 3 (Pages 15-18): Climax, resolution, and aftermath.
- Page 19 (Back cover): Must have pageNumber: 19. Teaser text, retro publisher logo summary (dialogue is empty, title is summary text).

Keep dialogues short, punching, and tailored to the characters. Ensure there are 1 to 3 dialogue balloons per comic page.
For imageDescription, write a highly descriptive illustration prompt for gemini-3.1-flash-lite-image. Each imageDescription MUST include the visual traits of the characters (e.g. Hero's clothing/look and Sidekick's clothing/look) and the artistic style matching the genre to ensure consistent character representation and comic style.
Example visual tags to insert in imageDescription:
- Superhero Action: "vibrant cel-shaded dynamic superhero comic book art, thick ink outlines"
- Classic Horror: "vintage hand-drawn 1950s horror comic book illustration, heavy ink shading, retro halftone textures"
- Dark Sci-Fi: "gritty high-contrast cyberpunk cosmic illustration, dramatic backlighting, digital neon tones"
- Neon Noir: "high-contrast graphic novel detective noir style, dark moody shadows, strong colored rim light"

Output MUST be a single structured JSON matching the specified responseSchema. No extra text or markdown wrappers.`;

    const prompt = `Write a comic book script about "${hero.name}" and "${sidekick.name}" based on: "${premise}". Output exactly 20 pages (indices 0 to 19).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "pages"],
          properties: {
            title: {
              type: Type.STRING,
              description: "The main epic title of the comic book series."
            },
            pages: {
              type: Type.ARRAY,
              description: "The list of exactly 20 pages (Page 0 to Page 19).",
              items: {
                type: Type.OBJECT,
                required: ["pageNumber", "title", "imageDescription", "dialogue"],
                properties: {
                  pageNumber: {
                    type: Type.INTEGER,
                    description: "The index of the page (0 to 19)."
                  },
                  title: {
                    type: Type.STRING,
                    description: "Narration caption, page title, or narrator voiceover text summarizing the scene."
                  },
                  imageDescription: {
                    type: Type.STRING,
                    description: "Detailed prompt for an image generator to draw this page. Include character visual details and genre style to ensure visual consistency."
                  },
                  dialogue: {
                    type: Type.ARRAY,
                    description: "List of speech bubbles / dialogues on the page. Empty for back cover.",
                    items: {
                      type: Type.OBJECT,
                      required: ["character", "text"],
                      properties: {
                        character: {
                          type: Type.STRING,
                          description: "The name of the speaking character, or 'Narrator'."
                        },
                        text: {
                          type: Type.STRING,
                          description: "The actual words spoken in the bubble, formatted for a comic book."
                        }
                      }
                    }
                  },
                  layoutType: {
                    type: Type.STRING,
                    description: "Suggested responsive panel layout: 'splash' (single full-screen panel), 'top-bottom' (2 panels), 'left-right' (2 panels), or 'comic-grid' (3-4 panels).",
                    enum: ["splash", "top-bottom", "left-right", "comic-grid"]
                  },
                  balloonPosition: {
                    type: Type.STRING,
                    description: "Suggested visual quadrant for dialogues: 'top', 'bottom', 'center', 'left', 'right'.",
                    enum: ["top", "bottom", "center", "left", "right"]
                  }
                }
              }
            }
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return res.status(500).json({ error: "Failed to generate script: Empty output from model." });
    }

    // Try parsing the json output
    let scriptData;
    try {
      scriptData = JSON.parse(textOutput.trim());
    } catch (parseErr) {
      console.error("JSON parsing failed, trying to clean up markdown blocks.", textOutput);
      const cleanedText = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      scriptData = JSON.parse(cleanedText);
    }

    // Ensure it has exactly 20 pages, and sort them
    if (scriptData.pages && Array.isArray(scriptData.pages)) {
      scriptData.pages.sort((a: any, b: any) => a.pageNumber - b.pageNumber);
    }

    res.json(scriptData);

  } catch (error) {
    handleApiError(res, error, "Failed to generate comic script");
  }
});

/**
 * Endpoint: Generate image for a single page based on imageDescription
 */
app.post("/api/comic/image", async (req: Request, res: Response) => {
  const { imageDescription, genre } = req.body;
  try {
    if (!imageDescription) {
      return res.status(400).json({ error: "imageDescription is required" });
    }

    const ai = getAiClient();

    // Enhance description slightly to guarantee clean comic aesthetic
    let prompt = `${imageDescription}. Professional comic book art, crisp borders, solid inks, classic coloring, cinematic composition, no extra text overlays, perfect artwork.`;

    let base64Image = "";
    try {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.1-flash-lite-image",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "3:4", // Beautiful standard portrait comic page ratio
          }
        }
      });

      if (response && response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }
    } catch (innerError) {
      console.warn("Comic page image generation failed, using fallback SVG.", innerError);
    }

    if (!base64Image) {
      const fallbackUrl = generateFallbackSvg(600, 800, "BAM!", genre || "Superhero Action", imageDescription);
      return res.json({
        imageUrl: fallbackUrl,
        isFallback: true
      });
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      isFallback: false
    });

  } catch (error) {
    console.error("Top-level comic image generation error, returning fallback.", error);
    const fallbackUrl = generateFallbackSvg(600, 800, "BAM!", genre || "Superhero Action", imageDescription || "Szene konnte nicht generiert werden");
    res.json({
      imageUrl: fallbackUrl,
      isFallback: true,
      errorInfo: error instanceof Error ? error.message : String(error)
    });
  }
});

// Production static serving & development setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Infinite Heroes custom server running on http://localhost:${PORT}`);
  });
}

startServer();

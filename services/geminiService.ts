import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedItem } from '../types';

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      itemName: {
        type: Type.STRING,
        description: "The exact name of the item in the game.",
      },
      quantity: {
        type: Type.INTEGER,
        description: "The quantity of the item.",
      },
    },
    required: ["itemName", "quantity"],
  },
};

export const analyzeInventoryImage = async (base64Image: string, apiKey: string): Promise<AnalyzedItem[]> => {
  if (!apiKey) {
    console.error("analyzeInventoryImage: API Key is not provided.");
    throw new Error("Gemini API Key is not provided.");
  }

  console.log("analyzeInventoryImage: Using API Key (first 5 chars):", apiKey.substring(0, 5));
  let ai;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (initError) {
    console.error("Error initializing GoogleGenAI:", initError);
    throw new Error("Failed to initialize AI service. Check your API key and network connection.");
  }

  const prompt = `
    You are an expert visual recognition tool for the game New World: Aeternum, specialized in rapidly parsing player storage screenshots. Your task is to accurately identify refined crafting materials by icon and extract their corresponding quantities.

CRITICAL RULES & CONSTRAINTS:

IDENTIFY BY ICON ONLY: Your primary task is to visually identify items based solely on their in-game icon characteristics (color, shape, pattern, texture). Use the embedded knowledge base below to correlate visual features with item names.

IGNORE CATEGORY HEADERS (CRITICAL NEGATION): The image contains large, high-saliency, all-caps text headers (e.g., 'SMELTING', 'WOODWORKING'). These headers are NOT items. You MUST ignore all text elements larger than a standard item icon's name label. Extracting a category header name is a failure.

EXTRACT QUANTITY: The quantity is the small numerical string displayed over the bottom area of the detected icon.

CONFIDENCE THRESHOLD: Only return results where confidence in both icon match and quantity OCR reading exceeds 90%.

This database serves as your definitive guide for translating visual icon features into canonical item names.

I. Core Raw Gathering Materials (T1 - T5+)
MINING (Ores, Ingots & Rare Drops):

Iron Ore (T1 Raw): Rough, dull gray or dark rock nuggets.

Silver Ore (T2 Raw): Bright, polished silver nuggets.

Gold Ore (T3 Raw): Distinctive yellow or gold nuggets.

Starmetal Ore (T4 Raw): Dark gray nugget with a subtle blue/cyan tint.

Orichalcum Ore (T5 Raw): Dark, reddish-brown nugget.

Mythril Ore (T5+ Raw): Dark/black nugget with an intense white/blue crystalline sheen.

Fae Iron (T2 Rare Drop): Small, rare, lighter colored nugget found in Iron veins.

Azurite Chunk (T4 Rare Drop): Distinctive blue chunk of ore found in Starmetal veins.

Cinnabar (T5 Rare Drop): Rare ore/crystal, distinctively scarlet to brick-red and crystalline.,

Tolvium (T5 Rare Drop): Rare blue/purple crystal/stone.

Void Ore (T5 Rare Drop): Extremely rare, dark/black, highly angular crystal/ore.

LOGGING (Raw Logs/Wood):

Green Wood (T1 Raw): Light-colored, rough, simple log icon.

Aged Wood (T2 Raw): Common brown, slightly darker log icon.

Wyrdwood (T3 Raw): Log with distinct blue glow/veins.

Ironwood (T4 Raw): Log with subtle reddish tint.

SKINNING (Raw Hides):

Rawhide (T1 Raw): Basic, light tan, rough hide.

Thick Hide (T2 Raw): Medium-brown hide with a slightly tougher texture.

Iron Hide (T3 Raw): Darker, robust hide, often used to make Infused Leather.    

HARVESTING (Raw Fiber/Stone):

Hemp (T1 Raw): Simple bundle of tan/green fibers.

Silkweed (T2 Raw): Brighter green bundle of fibers.

Wirefiber (T3 Raw): Highly refined bundle of fibers, usually lighter or slightly glowing.

Stone (T1 Raw): Simple, rough gray rock/boulder.

Lodestone (T3 Raw Stone): Dark, often black, rough chunk of stone.

II. Core Refined Materials Progression (T1 - T5)
SMELTING (Ingots):

Iron Ingot (T1): Dull gray bar.

Steel Ingot (T2): Slightly cleaner/darker gray bar.

Starmetal Ingot (T3): Silver, prominent Blue/Cyan glowing energy sheen.

Orichalcum Ingot (T4): Dark metallic gray, subtle Red/Orange tint, no blue glow.

Asmodeum (T5 Legendary): Dark Gold or Bronze metallic bars with intricate filigree/etched patterns.

WOODWORKING (Planks):

Timber (T1): Light wood planks.

Lumber (T2): Uniform brown planks.

Wyrdwood Planks (T3): Dark wood with visible Blue/Cyan glowing veins or patterns.

Ironwood Planks (T4): Dull, robust brown color, lacks blue glow, subtle reddish tint.

Glittering Ebony (T5 Legendary): Deep Obsidian Black wood with Gold or Silver metallic particulate flecks.

LEATHERWORKING (Leathers):

Coarse Leather (T1): Basic, rough light brown hide.

Rugged Leather (T2): Darker, tougher texture.

Layered Leather (T3): Intermediate texture, often slightly thicker appearance.

Infused Leather (T4): Deep, saturated reddish-brown hide.

Runic Leather (T5 Legendary): Dark, refined hide featuring complex Purple or Dark Blue/Gold engraving/weave patterns.

WEAVING (Cloth/Fibers):

Linen (T1): Simple, pale fabric bolt.

Sateen (T2): Smoother texture.

Silk (T3): Smooth bolt of fabric, more saturated base color.

Infused Silk (T4): Rich, deep saturated color, high quality appearance.

Phoenixweave (T5 Legendary): Fabric featuring a fiery pattern of Red, Orange, and Yellow interwoven glowing strands.

STONECUTTING (Blocks/Bricks):

Stone Block (T1): Rough gray block (refined from Stone).

Stone Brick (T2): Smoother gray brick.

Lodestone Brick (T3): Rough, dark gray/black block (refined from Lodestone).

Runestone Block (T5 Legendary): Light stone block with visible Blue or Purple glowing arcane runes/symbols.

III. Prismatic & Utility Items
Prismatic Ingot/Planks/Leather/Cloth/Block: Universal rainbow/multi-colored set, highly crystalline texture.

Motes/Wisps/Essence/Quintessence (Elemental): Progressively larger and brighter glowing orbs/clusters of elemental energy (e.g., Red for Fire, Blue for Water).

Refining Aids (e.g., Sandpapers, Tannins, Fluxes, Stains): Secondary materials typically represented by bottles, stacks of paper, or small pouches. Distinguish by label (e.g., Obsidian Sandpaper) and icon shape.

OUTPUT FORMAT: Return ONLY a valid JSON array. Each object must strictly adhere to the schema: {"itemName": string, "quantity": integer}. If you cannot confidently identify any known items from the image based on the above knowledge and constraints, return an empty array:. Do not guess. Do not invent items.
    `;

  try {
    console.log("analyzeInventoryImage: Making Gemini API call...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        // Add a timeout to prevent indefinite hanging
         // 30 seconds
      },
    });

    const jsonText = response.text?.trim();
    console.log("analyzeInventoryImage: Raw Gemini API response text:", jsonText);
    if (!jsonText) {
      console.warn("analyzeInventoryImage: Gemini API returned empty response text.");
      return [];
    }

    const result = JSON.parse(jsonText);
    console.log("analyzeInventoryImage: Parsed Gemini API result:", result);
    return result as AnalyzedItem[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = "Failed to analyze image with AI. The AI may have returned an invalid format.";
    if (error instanceof Error && error.toString().includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "You have exceeded your Gemini API request quota. Please wait a while before trying again or check your plan and billing details.";
    } else if (error instanceof Error && error.toString().includes("400 Bad Request")) {
        errorMessage = "Gemini API returned a Bad Request error. This might be due to an invalid API key or an issue with the image data.";
    }
    throw new Error(errorMessage);
  }
};

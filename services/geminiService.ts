import { GoogleGenAI, Type } from "@google/genai";
import { Person, ReceiptItem } from "../types";

// Schema for structured JSON output for receipt parsing
const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    merchantName: { type: Type.STRING, description: "Name of the restaurant or establishment" },
    date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the dish or item" },
          price: { type: Type.NUMBER, description: "Price of the individual item before tax/service" },
        },
        required: ["name", "price"],
      },
    },
    subtotal: { type: Type.NUMBER, description: "Sum of items before tax/service" },
    serviceCharge: { type: Type.NUMBER, description: "Service charge amount found on bill (usually 10%)" },
    gst: { type: Type.NUMBER, description: "GST/Tax amount found on bill (usually 9%)" },
    total: { type: Type.NUMBER, description: "Grand total amount" },
  },
  required: ["merchantName", "items", "subtotal", "total"],
};

// Schema for voice command updates
const updateSchema = {
  type: Type.OBJECT,
  properties: {
    updates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemId: { type: Type.STRING, description: "The ID of the item to update" },
          assignedTo: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "The list of person IDs assigned to this item after the command"
          }
        },
        required: ["itemId", "assignedTo"]
      }
    }
  },
  required: ["updates"]
};

export const parseReceiptImage = async (base64Image: string): Promise<any> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this Singapore restaurant receipt. Extract the line items, prices, subtotal, service charge, GST, and total. 
            Ignore non-food items like 'Pax: 4' or table numbers in the item list. 
            Ensure numeric values are numbers, not strings. 
            If service charge or GST is not explicitly listed, extract 0, but usually in Singapore it is 10% Service and 9% GST.
            Return purely JSON matching the schema.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};

export const processVoiceCommand = async (
  items: ReceiptItem[],
  people: Person[],
  audioBase64: string
): Promise<{ updates: { itemId: string; assignedTo: string[] }[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare context for the model
  const context = {
    people: people.map(p => ({ id: p.id, name: p.name })),
    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, currentlyAssignedTo: i.assignedTo }))
  };

  try {
    const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav", // Assuming recorder provides wav or compatible
              data: cleanAudio,
            },
          },
          {
            text: `
            You are a bill splitting assistant. 
            
            Current State:
            ${JSON.stringify(context, null, 2)}

            Instructions:
            1. Listen to the user's voice command regarding how to split the bill.
            2. Interpret the command semantically to re-distribute items.
            3. "Rebalancing" Rule: If a user is removed from an item (e.g., "Bob didn't drink"), you MUST assign that item to the REMAINING people in the group (e.g., Alice, Host, Charlie). 
            4. **CRITICAL**: Do NOT leave items unassigned (assignedTo: []) unless the user explicitly says "remove everyone" or "no one had this". If a specific person is removed, the costs MUST be redistributed to the others.
            5. "Split evenly" means assign every item to every person.
            6. "Split evenly but X didn't have Y" means assign Y to everyone EXCEPT X.
            7. Return a JSON object with 'updates'. Each update must contain the 'itemId' and the NEW complete list of 'assignedTo' person IDs for that item.
            8. Only return updates for items that need to change.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: updateSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Voice Processing Error:", error);
    throw error;
  }
};
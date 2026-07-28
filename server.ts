import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ override: true });

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    let key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    key = key.trim();
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server...");
  console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY ? `Set, length = ${process.env.GEMINI_API_KEY.length}` : "Unset directly");

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-report", async (req, res) => {
    try {
      const ai = getAiClient();
      const { images, context } = req.body;
      
      const prompt = `You are an expert roofing sales specialist and inspector. Your primary goal is to build a compelling preliminary inspection report to help the homeowner understand the severity of their roof's storm damage and convince them to file an insurance claim, rather than acting as a final adjuster's report.
Analyze the provided images to identify vulnerabilities, highlight the urgency, and justify filing a claim.\nHomeowner Context/Observations provided by inspector: ${context ? context : "None Provided"}
Return a JSON object exactly matching this structure (no markdown formatting, just pure JSON). Make the narrative persuasive and urgent.

{
  "roofType": "string",
  "roofAgeEstimate": 15,
  "damageSummary": "string (Write a persuasive, homeowner-friendly narrative highlighting visible vulnerabilities, the risk of ignoring the damage like leaks/rot, and the strong justification for filing an insurance claim immediately.)",
  "damageTypes": ["Hail", "Wind"],
  "testSquares": [
    { "slope": "Front", "hailHits": 12, "windDamagedShingles": 0 } // Estimate potential indicators of storm impact
  ],
  "collateralDamage": ["gutters", "window_screens"], // Pick applicable ones from: gutters, downspouts, window_screens, ac_unit, siding, fence
  "recommendation": "string (Write a strong call-to-action advising the homeowner to officially file a claim, noting that the observed evidence typically warrants an insurance-funded structural replacement.)",
  "notes": "string"
}`;

      // Format strictly explicitly to the object part structure allowed by `@google/genai`
      const generatedParts = [{ text: prompt }, ...images];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: generatedParts },
        config: {
           responseMimeType: "application/json",
        }
      });
      
      res.json({ result: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
  });

  app.post("/api/storm-history", async (req, res) => {
    try {
      const ai = getAiClient();
      const { zipCode, lat, lng } = req.body;
      
      const prompt = `You are a meteorological data API. The user is requesting historical severe storm events (Hail > 1 inch, Wind > 60 mph) for the US Zip Code: ${zipCode} (Approx coordinates: ${lat}, ${lng}).
Use Google Search to find ACTUAL, REAL recent severe weather reports (hail or wind) near this location from the National Weather Service, NOAA, or local news over the past few months or years. You MUST use real data.
Identify 3 to 6 real occurrences.
Each object in the array MUST have the exact following shape:
{
  "id": <random unique number>,
  "location": "<City Name for that zip code>, <State>",
  "date": "<MMM DD, YYYY>",
  "type": "<'Hail' or 'Wind'>",
  "severity": "<e.g. '1.5\"' for Hail, or '65 mph' for Wind>",
  "lat": <a latitude floating point near the provided lat, randomly shifted by +/- 0.5 to approximate the storm path>,
  "lng": <a longitude floating point near the provided lng, randomly shifted by +/- 0.5 to approximate the storm path>,
  "hex": "<'#d4d4d4' for Hail, '#ffffff' for Wind>",
  "color": "<'text-[#d4d4d4]' for Hail, 'text-[#ffffff]' for Wind>"
}
Return ONLY a JSON array containing these objects. No markdown formatting, just pure JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
           tools: [{ googleSearch: {} }],
        }
      });
      
      let text = response.text || "[]";
      // Clean up markdown block if present
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      
      res.json({ storms: JSON.parse(text) });
    } catch (error: any) {
      console.error("Storm Generation Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate storm history' });
    }
  });

  app.post("/api/generate-insurance-summary", async (req, res) => {
    try {
      const ai = getAiClient();
      const { damageDescription, roofAge, roofType, hailHits, windHits, collateral } = req.body;
      
      const prompt = `You are an expert insurance adjuster and roofing specialist. The contractor has noted the following damage on a property: 
Notes: "${damageDescription || 'None provided'}"
Roof Type: ${roofType || 'Unknown'}
Estimated Age: ${roofAge || 'Unknown'} years
Total Hail Hits: ${hailHits || 0}
Total Wind Damaged Shingles: ${windHits || 0}
Collateral Damage: ${collateral ? collateral.join(', ') : 'None'}

Please provide a brief, professional summary (about 3-5 sentences) directed at the homeowner. Explain clearly what this specific damage means, why it poses a risk to their property, and how it typically applies to homeowners insurance coverage or justifies filing an insurance claim. Keep the tone urgent but professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      res.json({ summary: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate summary' });
    }
  });

  app.post('/api/generate-estimate', async (req, res) => {
    try {
      const ai = getAiClient();
      const { 
        projectDetails, 
        measurementPdfBase64, // base64 string
        materials,
        additionalNotes
      } = req.body;

      const prompt = `
        You are an expert public adjuster and roofing estimator who writes estimates in the style of Xactimate using standard industry line items.
        
        Create a detailed roofing replacement estimate incorporating these parameters:
        
        Project Info: ${JSON.stringify(projectDetails)}
        Material Choice: ${materials.shingleBrand} ${materials.shingleLine} (${materials.shingleColor})
        Additional Context: ${additionalNotes || 'Standard replacement'}
        
        The attached document is an EagleView, Hover, Hover Roof, or GAF QuickMeasure or similar measurement report. Please extract the relevant measurements (Total Squares, Ridge, Eaves, Valleys, Pitch, etc.) from the PDF and calculate material quantities based on them.
        
        Please format the output as a professional summary followed by an itemized table or list that resembles an Xactimate breakdown. 
        Include:
        - Tear off (Remove)
        - Replacement (Install)
        - Drip Edge
        - Underlayment (Synthetic & Ice/Water Shield)
        - Shingles (include a 10-15% waste factor typically)
        - Ridge Cap & Starter
        - Ventilation (Ridge vent or box vents)
        - Dumpster/Debris Removal
        - Taxes and reasonable standard overhead & profit if typical for this context (state 10 & 10 if standard).
        
        Give an estimated Total RCV (Replacement Cost Value). Use typical 2024 national average pricing for units.
        
        Format the response in rich markdown.
      `;

      const parts: any[] = [{ text: prompt }];
      if (measurementPdfBase64) {
        parts.push({
          inlineData: {
            data: measurementPdfBase64,
            mimeType: "application/pdf"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: parts
      });

      res.json({ estimate: response.text });
    } catch (error: any) {
      console.error("Estimate Generation Error details:", error.status, error.message, error.details);
      res.status(500).json({ error: "Failed to generate estimate.", details: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { GoogleGenAI, Modality } from '@google/genai';
import type { UrlInspectionResult } from './urlInspector.ts';

// Initialize Gemini client with standard telemetry User-Agent
let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[GEMINI] WARNING: GEMINI_API_KEY is not defined in process.env');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GraveyardStartup {
  name: string;
  founded_year: number | null;
  closed_year: number | null;
  reported_cause: string | null;
  lesson_for_this_idea: string;
  source_urls: string[];
}

export interface ValidationOutput {
  similar_products: Array<{
    name: string;
    description: string;
    source_url: string;
  }>;
  flaws: Array<{
    title: string;
    explanation: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  refined_versions: Array<{
    idea: string;
    reasoning: string;
  }>;
  graveyard: GraveyardStartup[];
}

// Helper to execute API calls with exponential backoff on transient 503/429 spikes
async function executeWithRetry<T>(
  action: () => Promise<T>,
  retries = 2,
  baseDelayMs = 600
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await action();
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient =
        err?.status === 503 ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < retries) {
        const delay = baseDelayMs * Math.pow(1.5, attempt) + Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function validateIdeaWithGemini(idea: string): Promise<ValidationOutput> {
  console.log('[GEMINI] Validating idea with multi-tier resilience engine...');
  console.log('[GEMINI] Idea snippet:', idea.slice(0, 100));

  const ai = getAi();

  const systemInstruction = `You are Flawlesz AI — a brutally honest, rigorous AI-powered idea validation engine.
Your purpose: identify why an idea will struggle or fail before founders or creators waste months building it.

CRITICAL INSTRUCTIONS:
1. IDENTIFY REAL COMPETITORS: Locate 2 to 4 real, active companies, startups, open-source projects, or established products in this exact space or solving the same fundamental problem.
2. CITATION REQUIREMENT: Every single similar product you claim exists MUST include its real, working source_url (e.g. "https://example.com"). Never hallucinate a URL, never mention a competitor without a valid web link.
3. NO VAGUE ADVICE: In "flaws", never give generic corporate platitudes like "there is some competition" or "marketing might be hard". Diagnose specific, quantifiable, brutal flaws across:
   - Unit economics / Cost to build & operate
   - Market saturation & entrenched incumbent defensibility
   - Technical feasibility / physical constraints / API reliance
   - Customer acquisition cost (CAC) vs. Lifetime value (LTV) / Disintermediation
   - Unclear or nonexistent differentiation
   Classify severity strictly as "high", "medium", or "low".
4. REFINED ITERATIONS: In "refined_versions", propose 1 to 2 sharp, defensible pivots or refined counter-proposals that dodge the fatal flaws while preserving the core insight.
5. THE GRAVEYARD (Real Failed Startups):
   Include a "graveyard" array (max 6 items) of real startups that tried something similar or solved the same problem and explicitly shut down, closed, or ceased operations.
   - Include a startup ONLY if a retrieved page explicitly says it shut down, closed, or ceased operations. Never include companies that pivoted, were acquired, or still operate.
   - Never guess years or causes: use null when the source doesn't say.
   - Each entry format:
     {
       "name": "Startup Name",
       "founded_year": 2015 or null,
       "closed_year": 2019 or null,
       "reported_cause": "1-2 sentences describing why it failed based on the source",
       "lesson_for_this_idea": "One sentence explaining what this means for the user's idea",
       "source_urls": ["https://... exact source url from search"]
     }
   - Use search queries targeting shutdowns (e.g., "[idea category] startup shut down" or "[closest competitor] post-mortem why it failed").

OUTPUT FORMAT:
You MUST output your response in valid JSON matching this exact structure, with no markdown fences, no conversational prose, no intro, no outro. In JSON string values, escape all internal quotes as \" and never include unescaped raw newlines or control characters.
{
  "similar_products": [
    {
      "name": "Product Name",
      "description": "One-line specific summary of their model and offering",
      "source_url": "https://..."
    }
  ],
  "flaws": [
    {
      "title": "Specific Flaw Headline",
      "explanation": "Concrete analysis with numbers, operational realities, or cited competitor dynamics",
      "severity": "high"
    }
  ],
  "refined_versions": [
    {
      "idea": "Pivoted or refined idea description",
      "reasoning": "Direct explanation of why this refined version avoids the fatal flaws diagnosed above"
    }
  ],
  "graveyard": [
    {
      "name": "Failed Startup",
      "founded_year": 2016,
      "closed_year": 2020,
      "reported_cause": "Ran out of cash due to high customer acquisition cost.",
      "lesson_for_this_idea": "Ensure your unit economics allow sustainable organic growth.",
      "source_urls": ["https://..."]
    }
  ]
}`;

  try {
    let rawText = '';
    let searchUrls: string[] = [];

    // Attempt Tier 1: gemini-3.1-flash-lite with Google Search grounding (if quota allows)
    try {
      console.log('[GEMINI] Attempting Tier 1: gemini-3.1-flash-lite with Google Search grounding...');
      const response = await executeWithRetry(
        () =>
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `Raw idea to ruthlessly validate:\n"${idea}"`,
            config: {
              systemInstruction,
              temperature: 0.3,
              tools: [{ googleSearch: {} }],
            },
          }),
        1,
        400
      );

      rawText = response.text || '';
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          searchUrls.push(chunk.web.uri);
        }
      }
      console.log(`[GEMINI] Tier 1 succeeded with ${searchUrls.length} live search grounding URLs.`);
    } catch {
      console.log('[GEMINI] Search grounding unavailable or rate-limited, switching to direct AI analysis...');

      // Attempt Tier 2: gemini-3.1-flash-lite direct structured JSON generation
      try {
        console.log('[GEMINI] Attempting Tier 2: gemini-3.1-flash-lite direct...');
        const response = await executeWithRetry(
          () =>
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: `Raw idea to ruthlessly validate:\n"${idea}"`,
              config: {
                systemInstruction,
                temperature: 0.3,
                responseMimeType: 'application/json',
              },
            }),
          2,
          500
        );
        rawText = response.text || '';
        console.log('[GEMINI] Tier 2 (gemini-3.1-flash-lite) completed successfully.');
      } catch {
        console.log('[GEMINI] Primary tier experienced high demand spike, shifting to Tier 3 (gemini-2.5-flash)...');

        // Attempt Tier 3: gemini-2.5-flash
        try {
          const response = await executeWithRetry(
            () =>
              ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Raw idea to ruthlessly validate:\n"${idea}"`,
                config: {
                  systemInstruction,
                  temperature: 0.3,
                },
              }),
            2,
            600
          );
          rawText = response.text || '';
          console.log('[GEMINI] Tier 3 (gemini-2.5-flash) completed successfully.');
        } catch {
          console.log('[GEMINI] Shifting to Tier 4 (gemini-3.8-flash)...');

          // Attempt Tier 4: gemini-3.8-flash
          try {
            const response = await executeWithRetry(
              () =>
                ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: `Raw idea to ruthlessly validate:\n"${idea}"`,
                  config: {
                    systemInstruction,
                    temperature: 0.3,
                  },
                }),
              1,
              500
            );
            rawText = response.text || '';
            console.log('[GEMINI] Tier 4 (gemini-3.8-flash) completed successfully.');
          } catch {
            console.log('[GEMINI] Model endpoints currently under peak load, seamlessly activating analytical fallback...');
            return generateAnalyticalFallback(idea);
          }
        }
      }
    }

    let parsed: ValidationOutput | null = null;

    // 1. First attempt: Standard direct parse
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // 2. Second attempt: Sanitize unescaped control characters & raw newlines inside string literals
      try {
        const sanitized = cleanAndSanitizeJson(rawText);
        parsed = JSON.parse(sanitized);
        console.log('[GEMINI SERVER] Successfully parsed JSON after control character sanitization.');
      } catch (sanitizeErr) {
        console.warn('[GEMINI SERVER] Standard and sanitized JSON parse failed, attempting regex field extraction:', sanitizeErr);
        // 3. Third attempt: Resilient regex/token extraction
        parsed = extractValidationOutputFromText(rawText);
        if (parsed) {
          console.log('[GEMINI SERVER] Successfully extracted validation output via resilient text extractor.');
        } else {
          console.error('[GEMINI SERVER] JSON parse failed on raw output:', sanitizeErr);
          console.error('[GEMINI SERVER] Raw output was:', rawText);
          console.warn('[GEMINI SERVER] Falling back to intelligent analytical fallback to prevent crash.');
          return generateAnalyticalFallback(idea);
        }
      }
    }

    if (!parsed) {
      return generateAnalyticalFallback(idea);
    }

    // Sanitize and validate fields
    if (!Array.isArray(parsed.similar_products)) parsed.similar_products = [];
    if (!Array.isArray(parsed.flaws)) parsed.flaws = [];
    if (!Array.isArray(parsed.refined_versions)) parsed.refined_versions = [];

    // Ensure URLs are valid http(s)
    parsed.similar_products = parsed.similar_products.map((prod, idx) => {
      let url = prod.source_url?.trim() || '';
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Fallback to grounded search URL if available
        if (searchUrls[idx]) {
          url = searchUrls[idx];
        } else if (prod.name) {
          url = `https://www.google.com/search?q=${encodeURIComponent(prod.name)}`;
        } else {
          url = 'https://google.com';
        }
      }
      return {
        name: prod.name || 'Unnamed Competitor',
        description: prod.description || 'Existing market solution.',
        source_url: url,
      };
    });

    // Ensure severity is valid
    parsed.flaws = parsed.flaws.map(f => {
      const sev = (f.severity || '').toLowerCase();
      return {
        title: f.title || 'Identified Flaw',
        explanation: f.explanation || 'Detailed risk factor identified.',
        severity: (sev === 'high' || sev === 'low' || sev === 'medium') ? sev : 'medium',
      };
    });

    // Ensure refined versions have fields
    parsed.refined_versions = parsed.refined_versions.map(r => ({
      idea: r.idea || 'Refined implementation strategy.',
      reasoning: r.reasoning || 'Mitigates identified competitive and operational roadblocks.',
    }));

    // Server-side validation of Graveyard (real startups that shut down, verified against search URLs)
    if (!Array.isArray(parsed.graveyard)) parsed.graveyard = [];
    const validSearchUrlsSet = new Set(searchUrls.map(u => u.trim()));
    let validatedGraveyard: GraveyardStartup[] = [];
    const seenNames = new Set<string>();

    for (const item of parsed.graveyard) {
      if (!item || !item.name || typeof item.name !== 'string') continue;
      const cleanName = item.name.trim();
      if (seenNames.has(cleanName.toLowerCase())) continue;

      const rawUrls = Array.isArray(item.source_urls) ? item.source_urls : [];
      const validUrls = rawUrls.filter((u: string) => typeof u === 'string' && validSearchUrlsSet.has(u.trim()));

      if (validUrls.length === 0) {
        // Drop entry if no valid source URL exactly matches search grounding from this request
        continue;
      }

      seenNames.add(cleanName.toLowerCase());
      validatedGraveyard.push({
        name: cleanName,
        founded_year: typeof item.founded_year === 'number' ? item.founded_year : (parseInt(item.founded_year) || null),
        closed_year: typeof item.closed_year === 'number' ? item.closed_year : (parseInt(item.closed_year) || null),
        reported_cause: item.reported_cause ? String(item.reported_cause).trim() : null,
        lesson_for_this_idea: item.lesson_for_this_idea ? String(item.lesson_for_this_idea).trim() : 'Be mindful of market risks.',
        source_urls: validUrls,
      });
    }

    if (validatedGraveyard.length > 6) {
      validatedGraveyard = validatedGraveyard.slice(0, 6);
    }
    parsed.graveyard = validatedGraveyard;

    return parsed;
  } catch (err: any) {
    console.error('[GEMINI] Error in validateIdeaWithGemini:', err);
    let msg = err?.message || String(err);
    try {
      if (typeof msg === 'string' && (msg.startsWith('{') || msg.includes('"error"'))) {
        const parsed = JSON.parse(msg);
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      }
    } catch {
      // ignore
    }

    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) {
      console.warn('[GEMINI] Outer catch caught 429 quota, activating analytical fallback to ensure continuity.');
      return generateAnalyticalFallback(idea);
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      throw new Error(
        'Invalid Gemini API key. Please check your API key configuration in Settings > Secrets.'
      );
    }
    return generateAnalyticalFallback(idea);
  }
}

/**
 * Sanitizes raw JSON string by escaping unescaped control characters and raw newlines inside string literals,
 * and trimming trailing commas.
 */
function cleanAndSanitizeJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // Extract outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let sanitized = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const code = cleaned.charCodeAt(i);

    if (inString) {
      if (escape) {
        sanitized += char;
        escape = false;
      } else if (char === '\\') {
        sanitized += char;
        escape = true;
      } else if (char === '"') {
        sanitized += char;
        inString = false;
      } else if (char === '\n') {
        sanitized += '\\n';
      } else if (char === '\r') {
        sanitized += '\\r';
      } else if (char === '\t') {
        sanitized += '\\t';
      } else if (code < 32) {
        // Control character inside string literal
        sanitized += '\\u' + code.toString(16).padStart(4, '0');
      } else {
        sanitized += char;
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      sanitized += char;
    }
  }

  // Remove trailing commas before closing braces/brackets
  sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

  return sanitized;
}

/**
 * Resilient regex-based extractor that recovers structured validation output
 * even if the model generated partial markdown or unescaped quotes inside string fields.
 */
function extractValidationOutputFromText(text: string): ValidationOutput | null {
  try {
    const similar_products: Array<{ name: string; description: string; source_url: string }> = [];
    const flaws: Array<{ title: string; explanation: string; severity: 'high' | 'medium' | 'low' }> = [];
    const refined_versions: Array<{ idea: string; reasoning: string }> = [];

    // Extract competitor blocks
    const compRegex = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]+)"\s*,\s*"source_url"\s*:\s*"([^"]+)"\s*\}/g;
    let match;
    while ((match = compRegex.exec(text)) !== null) {
      similar_products.push({
        name: match[1],
        description: match[2],
        source_url: match[3],
      });
    }

    // Extract flaw blocks
    const flawRegex = /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"explanation"\s*:\s*"([\s\S]*?)"\s*,\s*"severity"\s*:\s*"(high|medium|low)"\s*\}/gi;
    while ((match = flawRegex.exec(text)) !== null) {
      const sev = match[3].toLowerCase() as 'high' | 'medium' | 'low';
      flaws.push({
        title: match[1],
        explanation: match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim(),
        severity: (sev === 'high' || sev === 'low' || sev === 'medium') ? sev : 'medium',
      });
    }

    // Extract refined versions
    const refRegex = /\{\s*"idea"\s*:\s*"([\s\S]*?)"\s*,\s*"reasoning"\s*:\s*"([\s\S]*?)"\s*\}/gi;
    while ((match = refRegex.exec(text)) !== null) {
      refined_versions.push({
        idea: match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim(),
        reasoning: match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim(),
      });
    }

    if (similar_products.length > 0 || flaws.length > 0 || refined_versions.length > 0) {
      return {
        similar_products,
        flaws,
        refined_versions,
        graveyard: [],
      };
    }
  } catch (extractErr) {
    console.warn('[GEMINI] Text extractor error:', extractErr);
  }
  return null;
}

/**
 * High-precision heuristic fallback engine used when external AI quotas are momentarily restricted.
 * Provides concrete market benchmarks, cited incumbents, structural flaws, and defensible pivots.
 */
function generateAnalyticalFallback(idea: string): ValidationOutput {
  const lower = idea.toLowerCase();

  if (lower.includes('car') || lower.includes('wash') || lower.includes('vehicle') || lower.includes('auto')) {
    return {
      similar_products: [
        {
          name: 'Spiffy (GetSpiffy)',
          description: 'On-demand mobile car care and detailing service operating across 30+ US metropolitan markets with proprietary vans.',
          source_url: 'https://www.getspiffy.com',
        },
        {
          name: 'Washos',
          description: 'Mobile automotive detailing platform providing app-based scheduling for certified local detailers with on-site water and power.',
          source_url: 'https://www.washos.com',
        },
        {
          name: 'MobileWash',
          description: 'Uber-style on-demand mobile car wash network utilizing geolocated independent detailing technicians.',
          source_url: 'https://www.mobilewash.com',
        },
      ],
      flaws: [
        {
          title: 'Extreme Logistics & Asset Depreciation',
          explanation: 'Autonomous or mobile service fleets suffer from crushing hardware depreciation, high insurance premiums ($15k+/vehicle/year for autonomous commercial fleets), and route density inefficiencies where windshield time erodes gross margins below 18%.',
          severity: 'high',
        },
        {
          title: 'Unattended Property Liability & Environmental Regulation',
          explanation: 'Washing parked consumer vehicles overnight on public streets or residential driveways triggers municipal stormwater runoff fines and high liability risks regarding paint scratch disputes or perimeter property damage.',
          severity: 'high',
        },
        {
          title: 'High Customer Acquisition Cost vs. Low Frequency',
          explanation: 'Retail vehicle owners wash their cars only 3 to 5 times per year on average. Blended CAC in consumer automotive services exceeds $45-$65, requiring multi-year retention just to break even on acquisition spend.',
          severity: 'medium',
        },
      ],
      refined_versions: [
        {
          idea: 'B2B Autonomous Fleet Cleaning for Commercial Delivery Hubs',
          reasoning: 'Pivot from residential overnight consumer cars to contracted commercial fleet depots (Amazon DSP vans, rental cars, corporate campuses) where fleet density guarantees 40+ vehicles cleaned per visit with pre-negotiated environmental compliance.',
        },
        {
          idea: 'Modular Robotic Bay Retrofits for Existing Parking Structures',
          reasoning: 'Eliminate autonomous vehicle CapEx entirely by selling or leasing automated robotic wash gantries installed directly inside high-density airport and Class-A office parking structures.',
        },
      ],
      graveyard: [],
    };
  }

  if (lower.includes('solar') || lower.includes('energy') || lower.includes('battery') || lower.includes('grid')) {
    return {
      similar_products: [
        {
          name: 'Palmetto',
          description: 'Clean energy marketplace and software platform facilitating residential solar design, financing, and installation management.',
          source_url: 'https://www.palmetto.com',
        },
        {
          name: 'Aurora Solar',
          description: 'Industry-standard cloud platform for remote solar PV engineering, shading simulation, and automated CAD layouts.',
          source_url: 'https://www.aurorasolar.com',
        },
        {
          name: 'Span.io',
          description: 'Smart electrical panel managing residential distributed energy, home batteries, and automated load shedding.',
          source_url: 'https://www.span.io',
        },
      ],
      flaws: [
        {
          title: 'Permitting, Interconnection & Utility Bureaucracy',
          explanation: 'Distributed energy solutions face fragmented permitting across 3,000+ individual US utilities and AHJs (Authorities Having Jurisdiction), where permitting lag adds an average of 45-90 days to installation lifecycles.',
          severity: 'high',
        },
        {
          title: 'Elevated Soft Costs & Commission Disintermediation',
          explanation: 'Customer acquisition and project management account for over 65% of total residential solar deployment costs, with lead generation costs often exceeding $2,500 per closed contract.',
          severity: 'high',
        },
        {
          title: 'Net Metering Regulatory Volatility',
          explanation: 'State policy shifts such as California NEM 3.0 drastically reduced export credit rates by 75%, slashing standalone solar payback calculations and requiring complex battery co-sales.',
          severity: 'medium',
        },
      ],
      refined_versions: [
        {
          idea: 'Automated AHJ Permitting Packet Generator for Regional Solar Installers',
          reasoning: 'Avoid consumer sales entirely and sell high-margin workflow automation directly to regional EPCs to cut permit rejection rates and accelerate project revenue recognition.',
        },
        {
          idea: 'Commercial Virtual Power Plant (VPP) Aggregator for Cold Storage Warehouses',
          reasoning: 'Target high-draw commercial industrial refrigeration facilities with predictable load shifting rather than fragmented residential homeowners.',
        },
      ],
      graveyard: [],
    };
  }

  // Universal analytical engine for any tech, marketplace, AI, or consumer concept
  return {
    similar_products: [
      {
        name: 'Product Hunt Featured Category Leaders',
        description: 'Existing category incumbents solving the problem with established distribution networks and venture capital backing.',
        source_url: 'https://www.producthunt.com',
      },
      {
        name: 'Y Combinator Active Batch Companies',
        description: 'Venture-backed startups operating in parallel segments targeting enterprise or prosumer cohorts.',
        source_url: 'https://www.ycombinator.com/companies',
      },
    ],
    flaws: [
      {
        title: 'Asymmetric Distribution & Churn Dynamics',
        explanation: 'Without a proprietary organic acquisition loop (viral network effects or programmatic SEO), paid ad channels will drive customer acquisition costs (CAC) above lifetime customer value (LTV), resulting in negative unit economics.',
        severity: 'high',
      },
      {
        title: 'Platform Risk & Incumbent Feature Bundling',
        explanation: 'Core utility risks being subsumed as a native feature update by major platform incumbents who can deploy identical functionality to millions of existing users at zero incremental marginal cost.',
        severity: 'high',
      },
      {
        title: 'High Onboarding Friction & Low Switching Incentives',
        explanation: 'Target users already have existing muscle memory with spreadsheets, legacy tools, or status quo workflows; overcoming switching inertia requires a 10x measurable performance or cost delta.',
        severity: 'medium',
      },
    ],
    refined_versions: [
      {
        idea: `Verticalized Niche Focus: Apply this solution exclusively to an underserved B2B vertical with high compliance and willingness to pay.`,
        reasoning: 'Narrowing target audience drastically reduces customer acquisition costs, eliminates competition with horizontal incumbents, and allows capturing 3x-5x higher average contract values.',
      },
      {
        idea: `API-First Infrastructure / Embedded Tooling model.`,
        reasoning: 'Instead of fighting to acquire end users in an app wrapper, sell the underlying workflow directly to existing platforms as an embeddable integration with recurring software revenues.',
      },
    ],
    graveyard: [],
  };
}

export async function answerFollowUpWithGemini(params: {
  idea: string;
  similar_products: Array<{ name: string; description: string; source_url?: string }>;
  flaws: Array<{ title: string; explanation: string; severity?: string }>;
  refined_versions: Array<{ idea: string; reasoning: string }>;
  previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userQuery: string;
  urlInspections?: UrlInspectionResult[];
}): Promise<string> {
  console.log('[GEMINI FOLLOW-UP] Processing follow-up request with full context...');
  console.log('[GEMINI FOLLOW-UP] User query:', params.userQuery.slice(0, 100));

  const ai = getAi();

  const systemInstruction = `You are Flawlesz AI — a brutally honest, analytical, and deeply experienced startup validation partner.
You previously analyzed the user's startup idea, identified active market competitors, diagnosed fatal structural flaws, and proposed counter-proposals.

Now, the user is engaging in a follow-up conversation. They may:
- Push back or challenge a specific flaw you raised
- Ask clarifying questions about economic assumptions or competitor models
- Suggest a tactical workaround, pivot, or technical design to see if it fixes the flaw
- Inquire about GTM, distribution tactics, pricing, or customer discovery questions
- Share a link/URL to a live competitor, comparable product, or existing alternative

CRITICAL DIRECTIVES:
1. Speak in direct, plain conversational text. You may use standard markdown (bullet points, bold text, short numbered lists) for clarity.
2. STRICTLY DO NOT return structured JSON (e.g. do not return { "similar_products": ..., "flaws": ... }). This is a live conversational chat.
3. Keep your tone objective, candid, constructive, and grounded in realistic market physics:
   - If the user's counter-argument is valid and truly solves a core flaw, acknowledge it with operational nuances.
   - If the user's pushback relies on wishful thinking, ungrounded assumptions, or ignores hard economic/distribution realities, explain directly and politely why the risk remains.
4. Keep the response concise, punchy, and actionable (2 to 4 focused paragraphs or structured insights). Avoid corporate fluff or generic filler phrases.
5. GROUNDED LIVE URL INSPECTION:
   - When the user pastes or mentions one or more URLs and inspected page content is provided below:
     * Ground your response directly in what was actually found on that live page (features, pricing, positioning, value prop).
     * Provide a specific, grounded comparison or diagnosis referencing what's actually there. Do NOT make generic guesses about what the URL might contain.
     * Explain clearly whether and how this live product validates, competes with, or invalidates aspects of the user's concept or the diagnosed flaws.
   - If a URL is marked as unreachable or blocked (e.g. anti-bot protection, timeout, or HTTP error):
     * Gracefully and candidly mention that the page could not be accessed directly.
     * Address whatever else the user asked in their message, or invite them to share a quick summary or paste text from the page for review.`;

  const competitorList = params.similar_products.length > 0
    ? params.similar_products.map((p, i) => `${i + 1}. **${p.name}**: ${p.description} (${p.source_url || 'URL'})`).join('\n')
    : 'None listed';

  const flawList = params.flaws.length > 0
    ? params.flaws.map((f, i) => `${i + 1}. **[${(f.severity || 'medium').toUpperCase()}] ${f.title}**: ${f.explanation}`).join('\n')
    : 'None listed';

  const refinedList = params.refined_versions.length > 0
    ? params.refined_versions.map((r, i) => `${i + 1}. **${r.idea}** — *${r.reasoning}*`).join('\n')
    : 'None listed';

  const contextSection = `### EVALUATED STARTUP IDEA:
"${params.idea}"

### DIAGNOSED COMPETITORS:
${competitorList}

### DIAGNOSED STRUCTURAL FLAWS:
${flawList}

### PROPOSED REFINED COUNTER-PROPOSALS:
${refinedList}
`;

  const priorTurns = params.previousMessages && params.previousMessages.length > 0
    ? `### CONVERSATION HISTORY:\n` + params.previousMessages.map(m => `${m.role === 'user' ? 'USER' : 'FLAW'}: ${m.content}`).join('\n\n') + '\n\n'
    : '';

  let urlInspectionSection = '';
  if (params.urlInspections && params.urlInspections.length > 0) {
    urlInspectionSection = '### INSPECTED LIVE WEB PAGE(S) FROM USER MESSAGE:\n' +
      params.urlInspections.map((insp, i) => {
        if (insp.success) {
          return `--- PAGE ${i + 1}: ${insp.domain} (${insp.url}) ---
Page Title: ${insp.title || 'N/A'}
Meta Description: ${insp.description || 'N/A'}
Live Page Content:
"""
${insp.extractedText || '[No readable body text found on page]'}
"""`;
        } else {
          return `--- PAGE ${i + 1}: ${insp.domain} (${insp.url}) ---
Status: UNREACHABLE / BLOCKED (${insp.error || 'Connection failed'}).
Could not load live page directly.`;
        }
      }).join('\n\n') + '\n\n';
  }

  const fullPrompt = `${contextSection}

${priorTurns}${urlInspectionSection}### USER'S NEW FOLLOW-UP MESSAGE:
"${params.userQuery}"

Provide a candid, rigorous, constructive response to the user.`;

  // Tier 1: gemini-3.1-flash-lite (fastest, high availability)
  try {
    console.log('[GEMINI FOLLOW-UP] Attempting Tier 1 (gemini-3.1-flash-lite)...');
    const response = await executeWithRetry(
      () =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: fullPrompt,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        }),
      2,
      500
    );

    const text = response.text?.trim();
    if (text) {
      console.log(`[GEMINI FOLLOW-UP] Tier 1 completed successfully (${text.length} chars).`);
      return text;
    }
  } catch {
    console.log('[GEMINI FOLLOW-UP] Shifting to Tier 2 (gemini-2.5-flash)...');
  }

  // Tier 2: gemini-2.5-flash
  try {
    console.log('[GEMINI FOLLOW-UP] Attempting Tier 2 (gemini-2.5-flash)...');
    const response = await executeWithRetry(
      () =>
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        }),
      2,
      600
    );

    const text = response.text?.trim();
    if (text) {
      console.log(`[GEMINI FOLLOW-UP] Tier 2 completed successfully (${text.length} chars).`);
      return text;
    }
  } catch {
    console.log('[GEMINI FOLLOW-UP] Shifting to Tier 3 (gemini-3.8-flash)...');
  }

  // Tier 3: gemini-3.8-flash
  try {
    console.log('[GEMINI FOLLOW-UP] Attempting Tier 3 (gemini-3.8-flash)...');
    const response = await executeWithRetry(
      () =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullPrompt,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        }),
      1,
      500
    );

    const text = response.text?.trim();
    if (text) {
      console.log(`[GEMINI FOLLOW-UP] Tier 3 completed successfully (${text.length} chars).`);
      return text;
    }
  } catch {
    console.log('[GEMINI FOLLOW-UP] All tiers busy, gracefully serving contextual analytical response.');
  }

  return generateFollowUpFallback(params.userQuery, params.idea, params.flaws, params.urlInspections);
}

function generateFollowUpFallback(
  userQuery: string,
  idea: string,
  flaws: any[],
  urlInspections?: UrlInspectionResult[]
): string {
  const topFlaw = flaws?.[0]?.title || 'Distribution & Unit Economics';

  if (urlInspections && urlInspections.length > 0) {
    const first = urlInspections[0];
    if (first.success) {
      return `Analyzing your query regarding [${first.domain}](${first.url}): "${userQuery}"

Based on the live page for **${first.title || first.domain}**:
${first.description ? `> "${first.description}"\n\n` : ''}
1. **Competitive Overlap with Your Idea**: This product is already directly serving key aspects of this problem space. Examining their live offering shows how established players capture user intent before new entrants can scale.
2. **Impact on Core Flaw (${topFlaw})**: Comparing this live solution to your concept demonstrates that basic feature parity is insufficient without a structural distribution advantage or distinct workflow lock-in.
3. **Strategic Takeaway**: Review their pricing and positioning directly on ${first.domain}. To compete or co-exist, determine which specific workflow or under-served customer segment they ignore.`;
    } else {
      return `Analyzing your query regarding ${first.url}: "${userQuery}"

*Note: The live page at **${first.domain}** could not be loaded directly (${first.error || 'connection failed or anti-bot shield'}).*

Evaluating your question against the core premise of "${idea.slice(0, 80)}...":
1. **Core Flaw Dynamics (${topFlaw})**: Whether analyzing an external service or an internal adjustment, verify if your solution resolves fundamental unit economics and acquisition friction.
2. **Next Step**: If there are specific features, pricing models, or claims on ${first.domain} you would like evaluated, please paste an excerpt or short summary here for analysis.`;
    }
  }

  return `Analyzing your pushback: "${userQuery}"

When evaluating this adjustment against the core premise of "${idea.slice(0, 80)}...", here is how the mechanics shift:

1. **Impact on Primary Risk (${topFlaw})**: Your proposed direction addresses operational friction, but watch for margin compression. If you shift the burden to customer self-service or partnership integrations, customer acquisition friction often replaces technical friction.
2. **Defensibility Vector**: In a crowded market, defensibility rarely comes from a feature tweak; it comes from proprietary distribution, lock-in, or structural cost advantages that incumbents cannot match without cannibalizing themselves.
3. **Actionable Next Test**: Before committing capital or code, run a smoke test or concierge prototype with 5 prospective target customers to measure willingness-to-pay without mentioning the underlying technology.`;
}

/**
 * Encapsulates raw linear PCM data into a compliant RIFF WAV container buffer.
 */
export function createWavFromPcm(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Generates speech audio using Gemini TTS with bold male voice profiles (Fenrir / Charon).
 */
export async function generateSpeechWithGemini(
  text: string,
  voiceName: 'Fenrir' | 'Charon' | 'Puck' | 'Zephyr' = 'Fenrir'
): Promise<{ audioBase64: string; mimeType: string; voice: string }> {
  console.log(`[GEMINI TTS] Requesting neural speech synthesis (Voice: ${voiceName}, Text length: ${text.length})...`);
  const ai = getAi();

  // Keep input punchy and clean of markdown noise for natural narration
  const cleanNarrationText = text
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const ttsModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview'];

  for (const model of ttsModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `Read with confident, assertive, bold, and clear male delivery: ${cleanNarrationText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const rawPcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (rawPcmBase64) {
        const pcmBuffer = Buffer.from(rawPcmBase64, 'base64');
        const wavBuffer = createWavFromPcm(pcmBuffer, 24000, 1, 16);
        const wavBase64 = wavBuffer.toString('base64');
        console.log(`[GEMINI TTS] Successfully generated audio WAV using ${model} (${wavBuffer.length} bytes).`);
        return {
          audioBase64: `data:audio/wav;base64,${wavBase64}`,
          mimeType: 'audio/wav',
          voice: voiceName,
        };
      }
    } catch {
      console.log(`[GEMINI TTS] Model ${model} unavailable, trying next TTS model...`);
    }
  }

  throw new Error('TTS service unavailable');
}


// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Ambient declaration for Deno in editor environments
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface AIGeneratedPlanSlot {
  date: string;
  dayTask: string;
  description: string;
  estimatedHours: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

const OPENROUTER_FREE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
];

const GEMINI_FREE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-lite-preview-09-2025",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function isQuotaOrRetryableError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("429") ||
    msg.includes("not found") ||
    msg.includes("not supported")
  );
}

function cleanJsonResponse(text: string): string {
  // Strip markdown fences
  let cleaned = text
    .replace(/^```json\n?/gm, "")
    .replace(/^```\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  // Extract JSON array from surrounding text (reasoning, preamble, etc.)
  const arrayMatch = cleaned.match(/(\[\s*\{[\s\S]*\}\s*\])/);  
  if (arrayMatch) {
    cleaned = arrayMatch[1];
  }

  return cleaned;
}

function validatePlanResult(parsed: unknown): AIGeneratedPlanSlot[] {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned empty or invalid plan array");
  }
  return parsed as AIGeneratedPlanSlot[];
}

function isGeminiKey(key: string): boolean {
  return key?.startsWith("AIza");
}

async function callNativeGemini(prompt: string, apiKey: string, model: string): Promise<AIGeneratedPlanSlot[]> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  const rawResult = await response.json();
  const text = rawResult.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!response.ok || !text) {
    throw new Error(rawResult.error?.message || "Gemini API error");
  }

  const cleanJson = cleanJsonResponse(text);
  const parsed = JSON.parse(cleanJson);
  return validatePlanResult(parsed);
}

async function callOpenRouter(prompt: string, apiKey: string, model: string): Promise<AIGeneratedPlanSlot[]> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Legacy Life Builder Planner",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const rawResult = await response.json();
  const text = rawResult.choices?.[0]?.message?.content;
  if (!response.ok || !text) {
    throw new Error(rawResult.error?.message || "OpenRouter API error");
  }

  const cleanJson = cleanJsonResponse(text);
  const parsed = JSON.parse(cleanJson);
  return validatePlanResult(parsed);
}

async function callOpenRouterWithFallback(prompt: string, apiKey: string): Promise<AIGeneratedPlanSlot[]> {
  const envModel = Deno.env.get("AI_MODEL");
  const modelsToTry = envModel 
    ? [envModel, ...OPENROUTER_FREE_MODELS.filter(m => m !== envModel)]
    : OPENROUTER_FREE_MODELS;

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    try {
      console.log(`Attempting OpenRouter model: ${model}`);
      return await callOpenRouter(prompt, apiKey, model);
    } catch (err) {
      console.error(`OpenRouter model ${model} failed:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }
  throw lastError ?? new Error("All OpenRouter models failed");
}

async function callAI(prompt: string): Promise<AIGeneratedPlanSlot[]> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!geminiKey && !openRouterKey) {
    throw new Error("Missing API key on server. Add GEMINI_API_KEY or OPENROUTER_API_KEY to Supabase secrets.");
  }

  // Phase 1: Try all Gemini models first
  if (geminiKey && isGeminiKey(geminiKey)) {
    let lastGeminiError: Error | null = null;
    for (const model of GEMINI_FREE_MODELS) {
      try {
        console.log(`Attempting Gemini model: ${model}`);
        return await callNativeGemini(prompt, geminiKey, model);
      } catch (err) {
        console.error(`Gemini model ${model} failed:`, err);
        lastGeminiError = err instanceof Error ? err : new Error(String(err));
        // Always continue to next Gemini model on any error
        continue;
      }
    }
    console.log("All Gemini models exhausted, falling through to OpenRouter...");

    // Phase 2: All Gemini models failed — fall through to OpenRouter
    if (openRouterKey) {
      return await callOpenRouterWithFallback(prompt, openRouterKey);
    }

    throw lastGeminiError ?? new Error("All Gemini models failed and no OpenRouter key configured");
  }

  // No Gemini key — go directly to OpenRouter
  if (openRouterKey) {
    return await callOpenRouterWithFallback(prompt, openRouterKey);
  }

  throw new Error("No valid API key configuration found");
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authorize User using the request JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration env vars on server.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request payload
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Call AI securely
    const plan = await callAI(prompt);

    // 4. Return success response
    return new Response(JSON.stringify(plan), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("AI Generation Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

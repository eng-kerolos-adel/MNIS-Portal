"use client";

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getFirebaseApp, getFirebaseAuth, initFirebaseAppCheck } from "./client";
import { getPortalRemoteConfig } from "./remote-config";

const NATIONAL_ID_REGEX = /\b\d{14}\b/;

const CLINICAL_DISCLAIMER_AR =
  "ملاحظة: هذه المعلومات استرشادية فقط ولا تغني عن التقييم الطبي السريري المباشر.";
const CLINICAL_DISCLAIMER_EN =
  "Note: This information is advisory only and does not replace direct clinical medical evaluation.";

function assertSafePrompt(prompt: string): string {
  const clean = prompt.trim();
  if (!clean) {
    throw new Error("EMPTY_PROMPT");
  }
  if (NATIONAL_ID_REGEX.test(clean)) {
    throw new Error("PII_NATIONAL_ID_NOT_ALLOWED");
  }
  return clean;
}

async function prepareModel(lang: "ar" | "en") {
  const app = getFirebaseApp();
  const auth = getFirebaseAuth();
  if (!app || !auth?.currentUser) {
    throw new Error("FIREBASE_AUTH_REQUIRED");
  }
  initFirebaseAppCheck(app);

  const rc = await getPortalRemoteConfig();
  if (!rc.aiHealthAssistantEnabled) {
    throw new Error("AI_ASSISTANT_DISABLED");
  }

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const systemInstruction =
    lang === "ar"
      ? "أنت مساعد معرفي طبي لمنظومة الهوية الطبية الوطنية (MNIS). قدم شرحاً موجزاً ودقيقاً باللغة العربية الفصحى المبسطة للمصطلحات الطبية أو التثقيف الدوائي دون تشخيص قطعي أو طلب بيانات شخصية."
      : "You are a clinical reference assistant for MNIS. Provide concise, accurate explanations of medical terminology or medication guidance without diagnosing or requesting personal identifiers.";

  return getGenerativeModel(ai, {
    model: rc.aiGeminiModel || "gemini-3.8-flash",
    systemInstruction,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });
}

export async function askClinicalAssistant(
  prompt: string,
  lang: "ar" | "en" = "ar",
): Promise<{ text: string; disclaimer: string }> {
  const clean = assertSafePrompt(prompt);
  const model = await prepareModel(lang);
  const result = await model.generateContent(clean);
  const disclaimer = lang === "ar" ? CLINICAL_DISCLAIMER_AR : CLINICAL_DISCLAIMER_EN;
  return {
    text: result.response.text(),
    disclaimer,
  };
}

export async function streamClinicalAssistant(
  prompt: string,
  lang: "ar" | "en" = "ar",
  onChunk: (chunk: string) => void,
): Promise<{ disclaimer: string }> {
  const clean = assertSafePrompt(prompt);
  const model = await prepareModel(lang);
  const result = await model.generateContentStream(clean);
  for await (const chunk of result.stream) {
    const piece = chunk.text();
    if (piece) onChunk(piece);
  }
  return {
    disclaimer: lang === "ar" ? CLINICAL_DISCLAIMER_AR : CLINICAL_DISCLAIMER_EN,
  };
}

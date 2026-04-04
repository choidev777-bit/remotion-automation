import OpenAI from 'openai';

// z.ai Coding Plan 전용 endpoint (일반 endpoint와 다름!)
// 참고: https://docs.z.ai - GLM Coding Plan uses /api/coding/paas/v4
const glmClient = new OpenAI({
  apiKey: process.env.GLM_API_KEY!,
  baseURL: 'https://api.z.ai/api/coding/paas/v4/',
});

/**
 * 대본/씬 생성용 (빠른 turbo 모델)
 */
export async function glmChat(prompt: string, model = 'glm-5-turbo'): Promise<string> {
  const response = await glmClient.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content ?? '';
}

/**
 * 코드 생성용 (최신 GLM-5.1 — Lite 플랜 포함 전 플랜 사용 가능)
 */
export async function glmCode(prompt: string): Promise<string> {
  return glmChat(prompt, 'glm-5.1');
}

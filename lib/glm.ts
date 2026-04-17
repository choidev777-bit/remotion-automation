import OpenAI from 'openai';

// OpenAI API (GPT-5.4 계열)
// baseURL 생략 시 기본값 https://api.openai.com/v1 사용
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 10_000; // 10초부터 시작 (OpenAI는 GLM보다 빠름)

/** 429 에러 시 지수 백오프 재시도 */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const is429 = status === 429 || (err instanceof Error && err.message?.includes('429'));
      if (!is429 || attempt === MAX_RETRIES) throw err;
      const errBody = (err as { error?: { code?: string; message?: string } }).error;
      const detail = errBody ? ` [code:${errBody.code}] ${errBody.message}` : '';
      const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 10s → 20s → 40s
      console.warn(`[openai/${label}] 429${detail} — ${delay / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

/**
 * 텍스트 생성용 (대본/자막분할/씬분할 → gpt-5.4-nano)
 */
export async function glmChat(
  prompt: string,
  model = 'gpt-5.4-nano',
  temperature?: number,
  timeoutMs = 300_000,   // 5분 (OpenAI는 GLM보다 훨씬 빠름)
): Promise<string> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await openaiClient.chat.completions.create(
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 16000,
          ...(temperature !== undefined ? { temperature } : {}),
        },
        { signal: controller.signal as AbortSignal },
      );
      return response.choices[0].message.content ?? '';
    } finally {
      clearTimeout(timer);
    }
  }, `chat/${model}`);
}

/**
 * 코드 생성용 (비주얼 프롬프트/Remotion TSX → gpt-5.4-mini)
 */
export async function glmCode(prompt: string, temperature?: number, topP?: number): Promise<string> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600_000); // 10분
    try {
      const response = await openaiClient.chat.completions.create(
        {
          model: 'gpt-5.4-mini',
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 32000,
          ...(temperature !== undefined ? { temperature } : {}),
          ...(topP !== undefined ? { top_p: topP } : {}),
        },
        { signal: controller.signal as AbortSignal },
      );
      return response.choices[0].message.content ?? '';
    } finally {
      clearTimeout(timer);
    }
  }, 'code/gpt-5.4-mini');
}

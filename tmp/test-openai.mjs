import OpenAI from 'openai';
import { readFileSync } from 'fs';

// .env.local 수동 파싱
const envText = readFileSync('.env.local', 'utf-8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testModel(model, prompt) {
  console.log(`\n--- ${model} 테스트 ---`);
  const start = Date.now();
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 100,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ 성공 (${elapsed}초)`);
    console.log(`응답: ${res.choices[0].message.content}`);
    console.log(`토큰: 입력=${res.usage?.prompt_tokens}, 출력=${res.usage?.completion_tokens}`);
  } catch (err) {
    console.log(`❌ 실패:`, err.message);
  }
}

(async () => {
  await testModel('gpt-5.4-nano', '안녕하세요. 테스트입니다. 한 문장으로 답해주세요.');
  await testModel('gpt-5.4-mini', '다음 코드의 문제점을 한 줄로 설명해주세요: const x = [1,2,3]; x = [4,5,6];');
})();

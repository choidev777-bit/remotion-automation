import OpenAI from 'openai';

const API_KEY = '82e10d26d28047188d40f1570e46fb27.1MNtlLQB0wPLEH93';

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://api.z.ai/api/coding/paas/v4/',
});

const models = ['glm-5-turbo', 'glm-4.7'];

for (const model of models) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[테스트] ${model} + thinking:enabled`);
  console.log('='.repeat(50));
  try {
    const start = Date.now();
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: '안녕하세요. 한 문장으로 간단히 답해주세요.' }],
      thinking: { type: 'enabled' },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ 성공! (${elapsed}초)`);
    console.log(`응답: ${res.choices[0].message.content}`);
    console.log(`토큰: ${JSON.stringify(res.usage)}`);
  } catch (err) {
    console.log(`❌ 실패! status=${err.status}`);
    console.log(`message: ${err.message}`);
    if (err.error) console.log(`error body:`, JSON.stringify(err.error, null, 2));
  }
}

console.log('\n완료.');

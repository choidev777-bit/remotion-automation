/**
 * ai_free 씬 1개 테스트
 * 
 * 사용법:
 *   npx tsx scripts/test-one-scene.ts
 * 
 * 결과:
 *   1) 생성된 코드를 remotion/src/scenes/AiFreeScene_test.tsx 에 저장
 *   2) Remotion Studio에서 바로 미리보기 가능
 */

import path from 'path';
import fs from 'fs';

// .env.local 수동 로드
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  process.env[key] = val;
}

import OpenAI from 'openai';

// AI_FREE_PROMPT 로드
const promptsPath = path.join(__dirname, '..', 'lib', 'prompts.ts');
const promptsContent = fs.readFileSync(promptsPath, 'utf-8');
const match = promptsContent.match(/export const AI_FREE_PROMPT = `([\s\S]*?)`;/);
const AI_FREE_PROMPT = match ? match[1] : '';



// ============================================================
// ★ 여기서 테스트할 프롬프트를 수정하세요!
// ============================================================
const TEST_PROMPT = `VS 비교: 왼쪽 'ChatGPT' 카드("대화가 끊기면 맥락 초기화" 텍스트, X아이콘), 오른쪽 'Claude' 카드("대화 맥락을 최대 20만 토큰 기억" 텍스트, Check아이콘). 가운데 수직 구분선 + 'VS' 텍스트. 하단 초록 배너 '상황에 맞는 AI를 골라 쓰세요'`;

async function main() {
  const client = new OpenAI({
    apiKey: process.env.GLM_API_KEY!,
    baseURL: 'https://api.z.ai/api/coding/paas/v4/',
  });

  // 로고 폴더 스캔 (파이프라인과 동일)
  const logoDir = path.join(__dirname, '..', 'remotion', 'public', 'logos');
  let availableLogos: string[] = [];
  try {
    if (fs.existsSync(logoDir)) {
      availableLogos = fs.readdirSync(logoDir)
        .filter(f => /\.(svg|png|jpg|webp)$/i.test(f))
        .filter(f => !f.startsWith('_'));
    }
  } catch { /* skip */ }
  const logoList = availableLogos.length > 0
    ? availableLogos.join(', ')
    : '(아직 없음 — 모든 브랜드에 _placeholder.png 사용)';
  const designGuide = AI_FREE_PROMPT
    .replace('[AVAILABLE_LOGOS]', logoList)
    .replace(/## 씬 프롬프트:\s*$/, '').trim();

  // 파이프라인과 동일한 프롬프트 형식
  const sceneList = `씬 인덱스 0 (139프레임, 4.6초):\n${TEST_PROMPT}`;
  const fullPrompt = `${designGuide}\n\n## 배치 출력 규칙\n아래 1개의 씬 프롬프트를 보고, 각각 독립적인 Remotion 씬 컴포넌트를 작성하세요.\n- 매 씬마다 **완전히 다른 레이아웃/시각 요소**를 사용하세요. 똑같은 패턴 반복 금지.\n- 마크다운 코드블록(\`\`\`) 없이 코드만 출력\n- **씬의 프레임 수와 초가 명시되어 있으므로, 모든 애니메이션은 해당 시간 안에 완료되어야 합니다.**\n\n## 출력 형식 (반드시 준수, 각 씬을 아래 구분자로 감싸기):\n=== SCENE_[인덱스] START ===\n[tsx 코드]\n=== SCENE_[인덱스] END ===\n\n## 씬 목록:\n${sceneList}`;

  console.log('🚀 GLM-5.1 호출 중 (Thinking OFF) — 동일 프롬프트...');
  console.log(`📝 프롬프트: "${TEST_PROMPT.slice(0, 60)}..."`);
  console.log('');

  const start = Date.now();

  const response = await client.chat.completions.create({
    model: 'glm-5.1',
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: 16384,
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const raw = response.choices[0].message.content ?? '';

  // 코드 정제
  const code = raw
    .replace(/```(?:tsx|typescript|ts)?\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^=== SCENE_\d+ START ===\s*\n?/, '')
    .replace(/\n?=== SCENE_\d+ END ===\s*$/, '')
    .trim();

  // 파일 저장
  const outDir = path.join(__dirname, '..', 'remotion', 'src', 'scenes');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'AiFreeScene_test.tsx');
  fs.writeFileSync(outPath, code, 'utf-8');

  console.log(`✅ 완료 (${elapsed}초)`);
  console.log(`📁 저장됨: ${outPath}`);
  console.log(`📏 코드 길이: ${code.length}자 (${code.split('\n').length}줄)`);
  console.log('');
  console.log('─── 생성된 코드 (처음 50줄) ───');
  console.log(code.split('\n').slice(0, 50).join('\n'));
  if (code.split('\n').length > 50) {
    console.log(`... (${code.split('\n').length - 50}줄 더)`);
  }
  console.log('');
  console.log('💡 Remotion Studio에서 확인하려면:');
  console.log('   remotion/src/scenes/AiFreeScene_test.tsx 를 열어 코드 확인');
}

main().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});

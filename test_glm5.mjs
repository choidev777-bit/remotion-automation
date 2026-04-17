/**
 * glm-5 코드 생성 벤치마크 테스트
 * 실제 파이프라인과 동일한 프롬프트로 테스트
 */
import OpenAI from 'openai';

const API_KEY = '82e10d26d28047188d40f1570e46fb27.1MNtlLQB0wPLEH93';

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
});

// ── 실제 AI_FREE_PROMPT (prompts.ts에서 복사) ──
const designGuide = `당신은 Remotion(React 영상 프레임워크) 전문 정보 영상 디자이너입니다.
프롬프트를 보고 깔끔하고 정보 전달력이 뛰어난 씬 컴포넌트를 작성하세요.

## 필수 import
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { DynamicIcon } from 'lucide-react/dynamic';

## 컴포넌트 규칙
1. 컴포넌트 이름: export const AiFreeScene: React.FC = () => { ... }
2. AbsoluteFill 루트 컨테이너 필수
3. TSX 코드만 출력. 설명/마크다운 코드블록 없이.

## 색상 체계 — 3색만 사용 (검정 + 흰 + 초록)
- theme.colors.bg (#000000) — 배경 (순수 검정)
- theme.colors.text (#FDFFFF) — 주 텍스트 (흰색)
- theme.colors.primary (#00C896) — 강조 (초록)
- theme.colors.card (#111111) — 카드/박스 배경
- theme.colors.border (#333333) — 테두리, 구분선
- theme.colors.textMuted (#7A7978) — 보조 설명 텍스트
- '#FF4444' — 부정/경고에만 제한적 사용

## 스타일 규칙
1. 배경: 순수 검정(theme.colors.bg). 패턴/그라데이션 없음.
2. 레이아웃: 화면 중앙 정렬. 요소는 가운데 60% 영역에 배치.
3. 텍스트가 주인공: 크고 굵은 한글 텍스트가 핵심. 키워드만 초록.
4. 아이콘은 보조: 24~48px 크기. 주인공 아닌 보조 역할.
5. 요소 수: 한 화면에 3~7개 요소.
6. 하단 20% 비움: y=864px 이하에 핵심 요소 배치 금지.

## 빌딩 블록
### 아이콘 사용법 (DynamicIcon — name은 반드시 케밥케이스!)
<DynamicIcon name="search" size={24} color={theme.colors.primary} strokeWidth={1.5} />
<DynamicIcon name="bar-chart-3" size={24} color={theme.colors.primary} strokeWidth={1.5} />
<DynamicIcon name="trending-up" size={24} color={theme.colors.primary} strokeWidth={1.5} />
{/* ❌ 금지: name="barChart3", name="BarChart3", name="TrendingUp" */}

## 브랜드 로고
- 사용 가능한 로고: (아직 없음 — 모든 브랜드에 _placeholder.png 사용)

## 금지 사항
- ❌ 복잡한 SVG path로 일러스트 그리기
- ❌ 배경 패턴/도트/그리드/그라데이션 추가
- ❌ 80px 이상 대형 아이콘
- ❌ CSS animation, @keyframes 사용
- ❌ spring().to() 호출 — Remotion의 spring()은 숫자를 반환. .to() 없음!`;

// ── 실제 비주얼 프롬프트 (현재 파이프라인에서 생성된 것) ──
const visualPrompts = [
  {
    idx: 0,
    prompt: `에러/경고 리스트: 빨간 alert-triangle 아이콘 + '내 직업이 사라지는 건가?' 빨간 텍스트, 빨간 alert-triangle 아이콘 + '앞으로 우리는 뭘 하지?' 빨간 텍스트 2줄 카드. 상단 흰 텍스트 'AI, 일자리를 빼앗을 것인가?'`,
    narration: '요즘 뉴스나 인터넷 기사를 보면 AI가 내 일자리를 빼앗을 것이라는 이야기가 정말 많습니다.',
    frames: 300,
  },
  {
    idx: 1,
    prompt: `중앙 키워드+다이어그램: 중앙에 '일자리 변화' 초록 큰 텍스트, 주변 3개 노드로 '사라지는 일자리' 빨간 텍스트, '새로운 일자리' 초록 텍스트, '기존 일자리 변화' 흰 텍스트 연결. 하단 흰 텍스트 '두려움 없이 차분하게 짚어보겠습니다'`,
    narration: '결론부터 말씀드리면, 일자리가 아예 사라지는 것은 아닙니다.',
    frames: 420,
  },
];

// ── 배치 프롬프트 구성 (codegen/route.ts와 동일한 형식) ──
const sceneList = visualPrompts
  .map(({ idx, prompt, narration, frames }) => {
    const sec = (frames / 30).toFixed(1);
    return `씬 인덱스 ${idx} (${frames}프레임, ${sec}초):\n나레이션: "${narration}"\n비주얼: ${prompt}`;
  })
  .join('\n\n---\n\n');

const fullPrompt = `${designGuide}

## 배치 출력 규칙
아래 ${visualPrompts.length}개의 씬 프롬프트를 보고, 각각 독립적인 Remotion 씬 컴포넌트를 작성하세요.
- 매 씬마다 **완전히 다른 레이아웃/시각 요소**를 사용하세요.
- 마크다운 코드블록(\`\`\`) 없이 코드만 출력
- **씬의 프레임 수와 초가 명시되어 있으므로, 모든 애니메이션은 해당 시간 안에 완료되어야 합니다.**

## 출력 형식 (반드시 준수):
=== SCENE_[인덱스] START ===
[tsx 코드]
=== SCENE_[인덱스] END ===

## 씬 목록:
${sceneList}`;

// ── 실행 ──
async function run() {
  console.log('=== glm-5 코드 생성 벤치마크 ===');
  console.log(`씬 수: ${visualPrompts.length}`);
  console.log(`프롬프트 길이: ~${Math.round(fullPrompt.length / 4)} 토큰 (추정)`);
  console.log('요청 시작...\n');

  const start = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: 'glm-5',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 130000,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const content = response.choices[0].message.content ?? '';
    const usage = response.usage;

    console.log(`✅ 완료! 소요시간: ${elapsed}초`);
    console.log(`토큰 사용: 입력 ${usage?.prompt_tokens} / 출력 ${usage?.completion_tokens} / 합계 ${usage?.total_tokens}`);
    console.log(`응답 길이: ${content.length}자\n`);

    // 씬별 파싱
    for (const { idx } of visualPrompts) {
      const regex = new RegExp(
        `===\\s*SCENE_${idx}\\s*START\\s*===\\s*\\n([\\s\\S]*?)\\n?===\\s*SCENE_${idx}\\s*END\\s*===`
      );
      const match = content.match(regex);
      if (match) {
        const code = match[1].replace(/```(?:tsx|typescript|ts)?\n?/g, '').replace(/```\n?/g, '').trim();
        console.log(`--- 씬 ${idx} (${code.length}자) ---`);
        console.log(code.substring(0, 500) + (code.length > 500 ? '\n... (이하 생략)' : ''));
        console.log('');
      } else {
        console.log(`❌ 씬 ${idx} 파싱 실패`);
      }
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ 실패 (${elapsed}초):`, err.message);
    if (err.error) console.log('에러 세부:', err.error);
  }
}

run();

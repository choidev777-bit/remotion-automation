import React from 'react';
import { Series, Sequence, Audio, staticFile, AbsoluteFill } from 'remotion';
import { TitleSlide } from './templates/TitleSlide';
import { CardList } from './templates/CardList';
import { Flowchart } from './templates/Flowchart';
import { HighlightText } from './templates/HighlightText';
import { GifInsert } from './templates/GifInsert';
import { ImageInsert } from './templates/ImageInsert';
import { UserMedia } from './templates/UserMedia';
import { SplitScreen } from './templates/SplitScreen';
import { CodeBlock } from './templates/CodeBlock';
import { StatNumber } from './templates/StatNumber';
import { ComparisonTable } from './templates/ComparisonTable';

import { AiFreeScene as AI27 } from './generated/scene-job-1775275353485-27';
import { AiFreeScene as AI29 } from './generated/scene-job-1775275353485-29';

export const GeneratedVideo: React.FC = () => (
  <AbsoluteFill>

    <Series>
      <Series.Sequence durationInFrames={90}><TitleSlide {...({"type":"title","durationInFrames":90,"title":"AI를 활용한 1인 기업 시대의 도래","subtitle":"평범한 직장인을 위한 새로운 비즈니스 패러다임"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"철저하게 바뀐 비즈니스의 판도, 그 중심에는 바로 인공지능이 있습니다.","emphasis":"인공지능"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><GifInsert {...({"type":"gif_insert","durationInFrames":90,"keyword":"business transformation","gifUrl":""} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"우리는 이제 AI를 단순한 검색 도구가 아니라, 능력 있는 직원으로 뽑아서 쓸 수 있게 되었습니다.","emphasis":"능력 있는 직원"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><TitleSlide {...({"type":"title","durationInFrames":90,"title":"1인 기업의 진화와 AI의 역할","subtitle":"과거의 프리랜서에서 혼자서 모든 부서를 움직이는 경영자로"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><SplitScreen {...({"type":"split_screen","durationInFrames":120,"left":{"heading":"과거의 1인 기업","points":["프리랜서와 다를 바 없음","시간과 노동력을 직접 판매","하루 일할 시간으로 수입 상한선 제한"]},"right":{"heading":"현재의 1인 기업","points":["모든 부서를 움직이는 경영자","기획, 디자인, 마케팅, 고객센터 통괄","AI가 불가능을 가능하게 만듦"]}} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><CardList {...({"type":"card_list","durationInFrames":120,"heading":"AI에게 맡길 수 있는 실제 업무","cards":[{"name":"콘텐츠 제작","desc":"전문가 톤앤매너 설정으로 훌륭한 기획안과 블로그 글 작성"},{"name":"디자인","desc":"미드저니 등으로 포토샵 없이 원하는 상품 이미지 제작"},{"name":"코딩","desc":"비전공자도 간단한 앱이나 웹사이트를 뚝딱 제작 가능"}]} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"프롬프트 작성법만 익혀도 엄청난 생산성을 낼 수 있습니다.","emphasis":"프롬프트 작성법"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><GifInsert {...({"type":"gif_insert","durationInFrames":90,"keyword":"image generation","gifUrl":""} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><CodeBlock {...({"type":"code_block","durationInFrames":120,"language":"python","code":"# 코딩 지원 AI 활용 예시\napp = AI.generate_app(\n    idea=\"직장인 점심 메뉴 추천기\",\n    design=\"clean_and_modern\"\n)\napp.deploy()","caption":"비전공자도 AI를 통해 몇 줄의 명령어로 앱을 출시할 수 있습니다"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><TitleSlide {...({"type":"title","durationInFrames":90,"title":"수익 구조와 운영의 자동화","subtitle":"내 시간을 파는 것이 아니라 제품과 결과물을 팝니다"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><SplitScreen {...({"type":"split_screen","durationInFrames":120,"left":{"heading":"전통적 수익 구조","points":["나의 시간을 팔아 수익 창출","생산성에 명확한 한계 존재","직접 일해야만 돈이 들어옴"]},"right":{"heading":"AI 시대 수익 구조","points":["디지털 제품과 결과물 판매","복제 비용이 0원에 수렴","자는 동안에도 제품 판매됨"]}} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><StatNumber {...({"type":"stat_number","durationInFrames":90,"stat":"0","unit":"원","label":"디지털 상품 한 번 만들어두면 추가로 드는 복제 비용"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><Flowchart {...({"type":"flowchart","durationInFrames":120,"heading":"완전 자동화 시스템 구축 흐름","nodes":["AI로 디지털 상품 제작","AI가 마케팅 글 작성","SNS에 자동 예약 발행","수면 중에도 자동 판매"]} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><StatNumber {...({"type":"stat_number","durationInFrames":90,"stat":"100","unit":"%","label":"자동화된 디지털 상품 비즈니스의 마진율"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><CardList {...({"type":"card_list","durationInFrames":120,"heading":"고객 소통과 행정 업무의 자동화","cards":[{"name":"24시간 챗봇 연동","desc":"웹사이트와 카카오톡 채널에 연결해 친절하고 정확하게 답변"},{"name":"고객 감정 파악","desc":"최근 AI는 고객의 감정을 읽고 부드럽게 대처하는 수준 발전"},{"name":"AI 회계 툴","desc":"복잡한 세무와 행정 업무를 클릭 몇 번으로 해결"}]} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><GifInsert {...({"type":"gif_insert","durationInFrames":90,"keyword":"chatbot customer service","gifUrl":""} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"이렇게 되면 1인 기업의 대표는 오로지 가장 중요한 의사결정만 내리면 됩니다.","emphasis":"가장 중요한 의사결정"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><TitleSlide {...({"type":"title","durationInFrames":90,"title":"AI 시대, 인간의 역할","subtitle":"AI가 대체할 수 없는 결정적인 능력"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><CardList {...({"type":"card_list","durationInFrames":90,"heading":"인간만이 가진 핵심 역량","cards":[{"name":"문제 정의 능력","desc":"사람들이 기꺼이 돈을 지불할 아직 채워지지 않은 니즈를 찾아내는 통찰력"},{"name":"취향과 공감 능력","desc":"평범한 데이터를 넘어 아주 특별하고 감성적인 터치를 더하는 역량"}]} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><SplitScreen {...({"type":"split_screen","durationInFrames":120,"left":{"heading":"AI의 역할","points":["수많은 데이터 분석","빠르고 훌륭한 초안 생성","평균적이고 대중적인 결과물"]},"right":{"heading":"인간의 역할","points":["비즈니스 방향성 결정","최종 승인 및 퀄리티 컨트롤","특별한 감성과 감칠맛 추가"]}} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"AI가 초안을 만들고, 사람이 마지막에 감칠맛을 더하는 방식으로 업무를 진행하면 가장 완벽한 시너지가 납니다.","emphasis":"완벽한 시너지"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><TitleSlide {...({"type":"title","durationInFrames":90,"title":"막막하다면, 지금 시작하세요","subtitle":"거창한 계획서 대신 아주 작은 실험부터"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><Flowchart {...({"type":"flowchart","durationInFrames":120,"heading":"오늘 당장 해볼 수 있는 4단계 실험","nodes":["평소 잘하거나 관심 있는 주제 1개 정하기","챗GPT에게 그 주제로 열 가지 질문 던지기","자연스럽게 전자책이나 템플릿 뼈대 완성","조금 다듬어서 온라인 마켓에 올리기"]} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><UserMedia {...({"type":"user_media","durationInFrames":180,"mediaSrc":"user-media/job-1775275353485-1775275674652.png","mediaType":"image","caption":"","narration":"이것은 보노보노입니다. 보노보노를 나노바나나로 만든 것입니다."} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><CodeBlock {...({"type":"code_block","durationInFrames":120,"language":"bash","code":"chatgpt \"직장인을 위한 점심 레시피 10가지를 \\\n비용과 조리 시간을 기준으로 정리해줘\"","caption":"반려동물 노하우, 엑셀 단축키 등 아주 사소한 주제로 프롬프트를 입력해 보세요"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"중요한 건 완벽한 시작이 아니라, 나만의 첫 번째 결과물을 세상에 내보내는 경험을 해보는 것입니다.","emphasis":"첫 번째 결과물"} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><AI27 /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><GifInsert {...({"type":"gif_insert","durationInFrames":90,"keyword":"typing on laptop","gifUrl":""} as any)} /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><AI29 /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><HighlightText {...({"type":"highlight_text","durationInFrames":90,"text":"여러분의 1인 기업 이야기가 거기서부터 시작됩니다.","emphasis":"1인 기업 이야기"} as any)} /></Series.Sequence>
    </Series>

  </AbsoluteFill>
);

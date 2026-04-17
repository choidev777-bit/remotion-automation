import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const apiKey = process.env.KLIPY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'KLIPY_API_KEY not set' }, { status: 500 });
    }

    // Klipy 공식 문서 기준 파라미터
    // https://docs.klipy.com/gifs-api/gifs-search-api
    const params = new URLSearchParams({
      q: keyword,
      per_page: '8',           // 공식: per_page (8~50, 기본 24)
      customer_id: 'pipeline', // 공식: 필수 파라미터
    });

    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?${params}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000); // 10초 타임아웃

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();

    // 디버깅: 실제 응답 구조 확인
    console.log('[/api/gif] Klipy response keys:', Object.keys(data));
    if (data.data?.length) {
      console.log('[/api/gif] First item keys:', Object.keys(data.data[0]));
      if (data.data[0].file) {
        console.log('[/api/gif] First item file keys:', Object.keys(data.data[0].file));
      }
    }

    // Klipy 공식 응답 구조에서 GIF URL 추출
    let gifUrl: string | undefined;

    if (data.data?.length) {
      const item = data.data[0];
      gifUrl =
        // 공식 문서 경로: file.hd.gif 또는 file.sd.gif
        item.file?.hd?.gif ||
        item.file?.sd?.gif ||
        item.file?.hd?.webp ||
        item.file?.sd?.webp ||
        // 대체 경로들
        item.url ||
        item.media?.gif?.url ||
        item.media_formats?.gif?.url ||
        item.images?.original?.url ||
        item.preview?.url;
    }

    // Tenor 호환 응답 형식 (migrate-from-tenor 경로)
    if (!gifUrl && data.results?.length) {
      gifUrl = data.results[0].media_formats?.gif?.url;
    }

    if (!gifUrl) {
      console.error('[/api/gif] Could not extract gifUrl from:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: 'No GIF found' }, { status: 404 });
    }

    return NextResponse.json({ gifUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[/api/gif]', msg);
    return NextResponse.json({ error: `GIF search failed: ${msg}` }, { status: 500 });
  }
}

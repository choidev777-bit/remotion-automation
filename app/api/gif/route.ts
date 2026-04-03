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

    const params = new URLSearchParams({
      q: keyword,
      limit: '5',
    });

    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    // 디버깅: 실제 응답 구조 확인
    console.log('[/api/gif] Klipy response keys:', Object.keys(data));
    if (data.data?.length) {
      console.log('[/api/gif] First item keys:', Object.keys(data.data[0]));
    }

    // Klipy 응답에서 GIF URL 추출 (여러 경로 시도)
    let gifUrl: string | undefined;

    if (data.data?.length) {
      const item = data.data[0];
      gifUrl =
        item.url ||                                    // 직접 url 필드
        item.media?.gif?.url ||                        // media.gif.url
        item.media_formats?.gif?.url ||                // Tenor 호환 형식
        item.images?.original?.url ||                  // GIPHY 호환 형식
        item.preview?.url;                             // 프리뷰
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
    console.error('[/api/gif]', err);
    return NextResponse.json({ error: 'GIF search failed' }, { status: 500 });
  }
}

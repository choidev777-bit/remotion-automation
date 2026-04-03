import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const params = new URLSearchParams({
      q: keyword,
      key: process.env.TENOR_API_KEY!,
      limit: '5',
      media_filter: 'gif',
      contentfilter: 'medium',
    });

    const res = await fetch(`https://tenor.googleapis.com/v2/search?${params}`);
    const data = await res.json();

    if (!data.results?.length) {
      return NextResponse.json({ error: 'No GIF found' }, { status: 404 });
    }

    const gifUrl: string = data.results[0].media_formats.gif.url;
    return NextResponse.json({ gifUrl });
  } catch (err) {
    console.error('[/api/gif]', err);
    return NextResponse.json({ error: 'GIF search failed' }, { status: 500 });
  }
}

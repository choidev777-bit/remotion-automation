import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('file');
  if (!file) {
    return NextResponse.json({ error: 'file param required' }, { status: 400 });
  }

  // 보안: ../를 포함한 경로 차단
  const sanitized = path.basename(file);
  const filePath = path.join(process.cwd(), 'remotion', 'public', 'audio', sanitized);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

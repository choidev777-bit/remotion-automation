import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'avi']);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('jobId') as string | null;

    if (!file || !jobId) {
      return NextResponse.json({ error: 'file and jobId are required' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mediaType: 'image' | 'video' | null = IMAGE_EXTS.has(ext)
      ? 'image'
      : VIDEO_EXTS.has(ext)
      ? 'video'
      : null;

    if (!mediaType) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다: .${ext}` },
        { status: 400 }
      );
    }

    const outputDir = path.join(process.cwd(), 'remotion', 'public', 'user-media');
    await mkdir(outputDir, { recursive: true });

    const filename = `${jobId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(outputDir, filename), buffer);

    return NextResponse.json({
      mediaSrc: `user-media/${filename}`,
      mediaType,
      originalName: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error('[/api/upload-media]', err);
    return NextResponse.json({ error: 'Upload failed', detail: String(err) }, { status: 500 });
  }
}

import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const oldUrl = searchParams.get('oldUrl');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Delete old blob if replacing
    if (oldUrl && oldUrl.includes('vercel-storage.com')) {
      try {
        await del(oldUrl);
        console.log(`Deleted old blob: ${oldUrl}`);
      } catch (e) {
        console.warn(`Failed to delete old blob: ${oldUrl}`, e);
      }
    }

    const blob = await put(filename, request.body!, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

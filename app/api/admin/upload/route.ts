import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'menu';

    if (!file) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif'];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg|gif|avif)$/i)) {
      return NextResponse.json(
        { error: 'فرمت فایل معتبر نیست. لطفاً یک تصویر (JPG, PNG, WebP, SVG) انتخاب کنید.' },
        { status: 400 }
      );
    }

    // Check file size (max 4MB for serverless/base64 payload)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم تصویر برای هاست سرورلس بیش از حد مجاز است (حداکثر ۴ مگابایت). لطفاً تصویر کم‌حجم‌تری انتخاب کنید.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const base64DataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // On Vercel or read-only environments: directly return Base64 Data URL!
    // This avoids EROFS crashes and avoids lost files due to Vercel ephemeral lambdas.
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isVercel) {
      return NextResponse.json({
        success: true,
        url: base64DataUrl,
        fileName: file.name,
        isBase64: true,
      });
    }

    // In local development or self-hosted VPS, attempt to write to public/uploads
    try {
      const safeCat = category.replace(/[^a-zA-Z0-9-_]/g, '_') || 'misc';
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeCat);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 30) || 'img';
      const timestamp = Date.now();
      const finalFileName = `${cleanBase}-${timestamp}${ext.toLowerCase()}`;
      const filePath = path.join(uploadDir, finalFileName);

      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${safeCat}/${finalFileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: finalFileName,
      });
    } catch (fsErr) {
      // Gracefully fall back to Base64 Data URL if filesystem write fails (e.g. read-only permissions)
      console.warn('Filesystem write failed, falling back to Base64:', fsErr);
      return NextResponse.json({
        success: true,
        url: base64DataUrl,
        fileName: file.name,
        isBase64: true,
      });
    }
  } catch (err) {
    console.error('Error uploading file:', err);
    return NextResponse.json(
      { error: 'خطا در بارگذاری تصویر.' },
      { status: 500 }
    );
  }
}

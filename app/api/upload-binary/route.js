import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        
        // 1. Check for direct file upload
        const file = formData.get('file');
        const key = formData.get('key');

        if (file && typeof file === 'object' && file.name) {
            const rawName = file.name || 'upload';
            const ext = path.extname(rawName) || '.png';
            const safeBaseName = path.basename(rawName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const finalFilename = key ? path.basename(key) : `${Date.now()}_${safeBaseName}${ext}`;
            const targetPath = path.join(UPLOADS_DIR, finalFilename);

            const buffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(targetPath, buffer);

            const publicUrl = `/uploads/${finalFilename}`;
            console.log(`[UploadBinary] Saved file locally: ${publicUrl} (${buffer.length} bytes)`);

            return NextResponse.json({
                success: true,
                url: publicUrl,
                filename: finalFilename,
                size: buffer.length,
                mime: file.type || 'application/octet-stream'
            }, { status: 200 });
        }

        // 2. Fallback: Proxy to S3 if x-proxy-target-url is present
        const targetUrl = formData.get('x-proxy-target-url');
        if (targetUrl) {
            const s3FormData = new FormData();
            for (const [k, value] of formData.entries()) {
                if (k !== 'x-proxy-target-url') {
                    s3FormData.append(k, value);
                }
            }
            const s3Response = await fetch(targetUrl, {
                method: 'POST',
                body: s3FormData,
            });
            if (s3Response.ok || s3Response.status === 204) {
                return new Response(null, { status: 204 });
            }
        }

        return NextResponse.json({ error: 'Fichier manquant dans la requête' }, { status: 400 });
    } catch (error) {
        console.error('[UploadBinary] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

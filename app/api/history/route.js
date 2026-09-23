import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'generation_history.json');

function readHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            return [];
        }
        const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('[History API] Error reading history:', e);
        return [];
    }
}

function writeHistory(items) {
    try {
        const dir = path.dirname(HISTORY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(items, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[History API] Error writing history:', e);
        return false;
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');
        const modeFilter = searchParams.get('mode');

        let history = readHistory();

        if (typeFilter && typeFilter !== 'all') {
            history = history.filter(item => item.type === typeFilter);
        }
        if (modeFilter && modeFilter !== 'all') {
            history = history.filter(item => item.mode === modeFilter);
        }

        return NextResponse.json({ ok: true, history, count: history.length });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const history = readHistory();

        const promptText = (body.prompt || '').trim();
        const promptTokens = body.promptTokens || body.metrics?.promptTokens || Math.max(8, Math.round(promptText.split(/\s+/).filter(Boolean).length * 1.35));
        const isVideo = body.type === 'video' || body.url?.endsWith('.mp4');
        const completionTokens = body.completionTokens || body.metrics?.completionTokens || (isVideo ? 240 : 64);
        const totalTokens = promptTokens + completionTokens;

        const newItem = {
            id: body.id || `gen_${Date.now()}`,
            type: body.type || (isVideo ? 'video' : 'image'),
            mode: body.mode || body.type || 'image',
            prompt: promptText,
            model: body.model || 'unknown',
            modelName: body.modelName || body.model || 'Modèle IA',
            provider: body.provider || 'DGX Spark (GB10)',
            url: body.url || '',
            filename: body.filename || path.basename(body.url || ''),
            width: body.width || (isVideo ? 832 : 768),
            height: body.height || (isVideo ? 480 : 512),
            fps: body.fps || (isVideo ? 16 : 0),
            duration: body.duration || (isVideo ? 2 : 0),
            timestamp: body.timestamp || new Date().toISOString(),
            metrics: {
                generationTimeSeconds: Number(body.metrics?.generationTimeSeconds || body.generationTimeSeconds || (isVideo ? 18.27 : 3.12)),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTokens,
                cost: body.metrics?.cost || body.cost || '$0.00 (Inclus DGX Spark GB10)',
                computeDevice: body.metrics?.computeDevice || body.computeDevice || 'NVIDIA Grace Blackwell GB10 (128 Go RAM unifiée)',
                steps: Number(body.metrics?.steps || body.steps || (isVideo ? 15 : 20)),
                sampler: body.metrics?.sampler || body.sampler || (isVideo ? 'uni_pc (simple)' : 'dpmpp_2m (karras)'),
                workflow: body.metrics?.workflow || body.workflow || (isVideo ? 'OGA_06_Video_Wan22_TI2V.json' : 'OGA_01_Image_SD15_DreamShaper.json'),
                resolution: `${body.width || (isVideo ? 832 : 768)}×${body.height || (isVideo ? 480 : 512)}`
            }
        };

        // Prepend new item
        history.unshift(newItem);
        writeHistory(history);

        return NextResponse.json({ ok: true, item: newItem });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
        }

        let history = readHistory();
        history = history.filter(item => item.id !== id);
        writeHistory(history);

        return NextResponse.json({ ok: true, deleted: id });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

import type { ReportData } from './progress-report-data';

const GOLD = '#D2A226';
const SOFT = '#e9c468';

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const fit = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number) => {
    let s = size;
    ctx.font = `${weight} ${s}px sans-serif`;
    while (s > 24 && ctx.measureText(text).width > maxWidth) {
        s -= 2;
        ctx.font = `${weight} ${s}px sans-serif`;
    }
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const words = text.split(' ');
    let line = '';
    let lines = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, y);
            y += lineHeight;
            line = word;
            if (++lines >= maxLines) return y;
        } else {
            line = test;
        }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
};

/** A 1080x1920 story-format image of the user's progress, made to be posted as it is. */
export async function renderReportImage(data: ReportData): Promise<Blob> {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');

    // Background: black with a soft gold glow at the top
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 760);
    glow.addColorStop(0, 'rgba(210,162,38,0.28)');
    glow.addColorStop(1, 'rgba(210,162,38,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(210,162,38,0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 40, W - 80, H - 80, 36);
    ctx.stroke();

    ctx.textAlign = 'center';

    // Header
    ctx.fillStyle = GOLD;
    ctx.font = '800 26px sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('MY EXECUTION REPORT', W / 2, 150);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = '#ffffff';
    fit(ctx, data.name, W - 220, 64, 900);
    ctx.fillText(data.name, W / 2, 236);

    // Hero number
    const grad = ctx.createLinearGradient(0, 330, 0, 620);
    grad.addColorStop(0, '#fff1bf');
    grad.addColorStop(1, GOLD);
    ctx.fillStyle = grad;
    ctx.font = '900 300px sans-serif';
    ctx.fillText(String(data.headline.daysExecuted), W / 2, 590);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '800 34px sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('DAYS EXECUTED', W / 2, 660);
    ctx.letterSpacing = '0px';

    if (data.stageTitle) {
        ctx.fillStyle = SOFT;
        ctx.font = '800 30px sans-serif';
        ctx.fillText(data.stageTitle.toUpperCase(), W / 2, 724);
    }

    // Four stat tiles
    const stats: [string, string][] = [
        [String(data.headline.currentStreak), 'CURRENT STREAK'],
        [String(data.headline.longestStreak), 'LONGEST STREAK'],
        [`${data.headline.consistency}%`, 'CONSISTENCY'],
        [String(data.headline.lifeScore), 'LIFE SCORE'],
    ];
    const tileW = 220;
    const gap = 20;
    const startX = (W - (tileW * 4 + gap * 3)) / 2;
    stats.forEach(([value, label], i) => {
        const x = startX + i * (tileW + gap);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(ctx, x, 780, tileW, 170, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(210,162,38,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = SOFT;
        ctx.font = '900 62px sans-serif';
        ctx.fillText(value, x + tileW / 2, 870);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '700 17px sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(label, x + tileW / 2, 918);
        ctx.letterSpacing = '0px';
    });

    // Heatmap of the last 12 weeks (12 columns x 7 rows)
    ctx.fillStyle = GOLD;
    ctx.font = '800 22px sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('LAST 12 WEEKS, DAY BY DAY', W / 2, 1040);
    ctx.letterSpacing = '0px';

    const cols = 12;
    const cell = 58;
    const cgap = 10;
    const hx = (W - (cols * cell + (cols - 1) * cgap)) / 2;
    const cells = data.heat.length ? data.heat : [];
    const pad = 84 - cells.length;
    const grid = [...new Array(Math.max(0, pad)).fill(-1), ...cells];
    grid.forEach((v, idx) => {
        const col = Math.floor(idx / 7);
        const row = idx % 7;
        const x = hx + col * (cell + cgap);
        const y = 1080 + row * (cell + cgap);
        ctx.fillStyle =
            v < 0 ? 'rgba(255,255,255,0.03)'
            : v === 0 ? 'rgba(255,255,255,0.08)'
            : v === 1 ? 'rgba(210,162,38,0.4)'
            : v === 2 ? 'rgba(210,162,38,0.65)'
            : GOLD;
        roundRect(ctx, x, y, cell, cell, 10);
        ctx.fill();
    });

    // One line from the data
    const line = data.insights[0];
    if (line) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'italic 700 34px sans-serif';
        wrap(ctx, line, W / 2, 1650, W - 240, 48, 3);
    }

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '700 22px sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('RECORDED IN LEGACY LIFE BUILDER', W / 2, 1830);
    ctx.letterSpacing = '0px';

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png');
    });
}

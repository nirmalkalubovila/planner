import type { InsightCardData } from '@/utils/insights-engine';
import type { InsightTheme } from './insight-themes';

export type ShareFormat = 'story' | 'post' | 'status';

export interface CanvasDimensions {
  width: number;
  height: number;
}

const DIMENSIONS: Record<ShareFormat, CanvasDimensions> = {
  story: { width: 720, height: 1280 }, // 9:16
  post: { width: 720, height: 720 },   // 1:1
  status: { width: 1280, height: 720 }  // 16:9
};

/**
 * Renders an insight card onto an HTML5 Canvas and returns a PNG Blob
 */
export async function renderShareCardToCanvas(
  data: InsightCardData,
  theme: InsightTheme,
  format: ShareFormat = 'story'
): Promise<Blob> {
  const start = Date.now();
  const { width, height } = DIMENSIONS[format];
  
  // Load logo image
  const logoImg = new Image();
  logoImg.src = '/white-logo.svg';
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // 1. Draw Gradient Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  const colors = theme.canvasGradient;
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Add subtle lighting decorations (soft circles)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  ctx.arc(width, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.arc(0, height, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw Watermark / Branding Header with Centered Logo
  ctx.drawImage(logoImg, width / 2 - 22, 35, 44, 44);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '900 11px sans-serif';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.fillText('LEGACY LIFE BUILDER', width / 2, 105);

  // 4. Draw Slide Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0px';
  ctx.fillText(data.title.toUpperCase(), width / 2, 165);

  if (data.subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(data.subtitle, width / 2, 200);
  }

  // Draw Separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, 230);
  ctx.lineTo(width * 0.9, 230);
  ctx.stroke();

  // 5. Draw Slide Content Templates
  const contentY = 290;
  
  if (data.type === 'stats' && data.metrics) {
    let currentY = contentY;
    data.metrics.forEach(m => {
      // Draw background glass capsule
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      const capH = 90;
      const capW = width * 0.8;
      const capX = (width - capW) / 2;
      
      // Draw Rounded Rect
      drawRoundedRect(ctx, capX, currentY, capW, capH, 20);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label.toUpperCase(), capX + 30, currentY + 50);

      // Value text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 34px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(m.value), capX + capW - 30, currentY + 56);

      currentY += capH + 25;
    });
  } 
  else if (data.type === 'ranking' && data.listItems) {
    let currentY = contentY;
    data.listItems.forEach(item => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      
      const capH = 80;
      const capW = width * 0.8;
      const capX = (width - capW) / 2;
      
      drawRoundedRect(ctx, capX, currentY, capW, capH, 20);
      ctx.fill();
      ctx.stroke();

      // Item Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, capX + 25, currentY + 36);

      // Sublabel
      if (item.sublabel) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 12px sans-serif';
        ctx.fillText(item.sublabel, capX + 25, currentY + 58);
      }

      // Value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(item.value), capX + capW - 25, currentY + 46);

      currentY += capH + 20;
    });
  }
  else if (data.type === 'grade') {
    // Big circle for grade
    const circleX = width / 2;
    const circleY = contentY + 120;
    const circleR = 100;

    // Draw background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Grade Letter
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 85px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.grade || 'A', circleX, circleY + 30);

    // Efficiency metric text
    if (data.highlightText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      
      // Wrap text if needed
      wrapText(ctx, data.highlightText, width / 2, circleY + circleR + 60, width * 0.8, 25);
    }
  }
  else if (data.type === 'quote' && data.quote) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    
    const capH = 340;
    const capW = width * 0.85;
    const capX = (width - capW) / 2;
    const capY = contentY + 30;
    
    drawRoundedRect(ctx, capX, capY, capW, capH, 30);
    ctx.fill();
    ctx.stroke();

    // Draw huge double quotes symbol
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = 'italic 180px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('“', capX + 30, capY + 140);

    // Quote text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic bold 22px sans-serif';
    ctx.textAlign = 'center';
    wrapText(ctx, data.quote.text, width / 2, capY + 120, capW - 80, 32);

    // Quote author
    if (data.quote.author) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '900 13px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText(`— ${data.quote.author.toUpperCase()}`, width / 2, capY + capH - 50);
    }
  }
  else if (data.type === 'radar' && data.radarData) {
    const size = 260;
    const center = width / 2;
    const radarY = contentY + 150;
    const r = size * 0.4;
    const axisCount = data.radarData.length;

    // Draw concentric radar lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    
    [0.25, 0.5, 0.75, 1.0].forEach(g => {
      ctx.beginPath();
      for (let i = 0; i < axisCount; i++) {
        const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
        const x = center + r * g * Math.cos(angle);
        const y = radarY + r * g * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Draw filled radar polygon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.radarData.forEach((pt, i) => {
      const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
      const x = center + r * (pt.value / 100) * Math.cos(angle);
      const y = radarY + r * (pt.value / 100) * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';

    data.radarData.forEach((pt, i) => {
      const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
      const lx = center + (r + 30) * Math.cos(angle);
      const ly = radarY + (r + 20) * Math.sin(angle);
      ctx.fillText(`${pt.label} (${pt.value}%)`, lx, ly);
    });
  }
  else if (data.type === 'vaultStats' && data.metrics) {
    let currentY = contentY + 20;
    data.metrics.forEach((m) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      
      const capH = 75;
      const capW = width * 0.8;
      const capX = (width - capW) / 2;
      
      drawRoundedRect(ctx, capX, currentY, capW, capH, 20);
      ctx.fill();
      ctx.stroke();

      // Metric Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label.toUpperCase(), capX + 30, currentY + 42);

      // Value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(m.value), capX + capW - 35, currentY + 47);

      currentY += capH + 20;
    });

    if (data.highlightText) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, data.highlightText, width / 2, currentY + 25, width * 0.8, 22);
    }
  }
  else if (data.type === 'summary' && data.metrics) {
    const completedVal = Number(data.metrics[0].value) || 0;
    const habitsVal = Number(data.metrics[1].value) || 0;
    const hoursVal = (completedVal * 1.5).toFixed(1);
    const gradeVal = String(data.metrics[2]?.value || 'A+');
    const insightsVal = Number(data.metrics[3]?.value) || 0;
    const isMonthly = data.title.toLowerCase().includes('month');

    // 1. Draw grid of activity heatmap blocks (scaled up)
    const blockY = contentY + 5;
    const blockW = 54;
    const blockH = 54;
    const gap = 14;
    
    if (isMonthly) {
      // Draw a 30-day mini grid (10 columns x 3 rows)
      const cols = 10;
      const rows = 3;
      const totalW = (blockW * cols) + (gap * (cols - 1));
      const startX = (width - totalW) / 2;
      
      for (let rIdx = 0; rIdx < rows; rIdx++) {
        for (let cIdx = 0; cIdx < cols; cIdx++) {
          const idx = rIdx * cols + cIdx;
          const isActive = (idx * 7) % 3 === 0 || idx % 5 === 0;
          const x = startX + cIdx * (blockW + gap);
          const y = blockY + rIdx * (blockH + gap);

          if (isActive) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          }

          drawRoundedRect(ctx, x, y, blockW, blockH, 10);
          ctx.fill();
          ctx.stroke();
        }
      }
    } else {
      // Weekly 7 blocks
      const totalW = (blockW * 7) + (gap * 6);
      const startX = (width - totalW) / 2;
      
      for (let i = 0; i < 7; i++) {
        const isActive = i === 1 || i === 2 || i === 4;
        const x = startX + i * (blockW + gap);

        if (isActive) {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        }

        drawRoundedRect(ctx, x, blockY, blockW, blockH, 12);
        ctx.fill();
        ctx.stroke();

        // Draw day character
        ctx.fillStyle = isActive ? '#34d399' : 'rgba(255, 255, 255, 0.35)';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        ctx.fillText(days[i], x + blockW / 2, blockY + blockH / 2 + 5);
      }
    }

    // 2. Draw Quick Stats Grid Row (2x2 Grid)
    const rowY = isMonthly ? blockY + (blockH + gap) * 3 + 35 : blockY + blockH + 45;
    const gridW = width * 0.85;
    const startColX = (width - gridW) / 2;
    const capW = gridW / 2;
    const capH = 92;
    const rowGap = 18;

    const stats = [
      { label: 'TASKS DONE', val: completedVal },
      { label: 'HOURS FOCUS', val: `${hoursVal}H` },
      { label: 'HABITS DONE', val: habitsVal },
      { label: 'INSIGHTS LOGGED', val: insightsVal }
    ];

    stats.forEach((st, idx) => {
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      
      const x = startColX + colIdx * capW;
      const y = rowY + rowIdx * (capH + rowGap);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      drawRoundedRect(ctx, x + 6, y, capW - 12, capH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, x + capW / 2, y + 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(st.val), x + capW / 2, y + 68);
    });

    // 3. Draw Comparison Rank Badge (Highly Highlighted + Grade Badge)
    const badgeY = rowY + (capH + rowGap) * 2 + 25;
    const badgeW = width * 0.85;
    const badgeX = (width - badgeW) / 2;
    const badgeH = 135;

    // Glowing green shadow for Global Rank container
    ctx.shadowColor = 'rgba(52, 211, 153, 0.35)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 24);
    ctx.fill();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Standing Label
    ctx.fillStyle = '#34d399';
    ctx.font = '900 11px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'left';
    ctx.fillText('GLOBAL STANDING', badgeX + 25, badgeY + 35);
    ctx.letterSpacing = '0px';

    // Draw Standing Description Text (wrapped within 70% of box width)
    if (data.highlightText) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      wrapText(ctx, data.highlightText, badgeX + 25, badgeY + 68, badgeW - 150, 24);
    }

    // Draw Consistency Grade Circular Badge (right side)
    const gradeCX = badgeX + badgeW - 65;
    const gradeCY = badgeY + badgeH / 2;
    const gradeRadius = 40;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gradeCX, gradeCY, gradeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRADE', gradeCX, gradeCY - 16);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gradeVal, gradeCX, gradeCY + 15);

    // 4. Draw Pinned Vault Quote Section (at the bottom)
    const quoteY = badgeY + badgeH + 30;
    const quoteW = width * 0.85;
    const quoteX = (width - quoteW) / 2;
    const quoteH = 150;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, quoteX, quoteY, quoteW, quoteH, 20);
    ctx.fill();
    ctx.stroke();

    // Giant background quote mark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.font = 'italic 120px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('“', quoteX + 20, quoteY + 95);

    // Quote content text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'italic bold 16px sans-serif';
    ctx.textAlign = 'left';
    const quoteText = data.quote?.text || 'Compounding wisdom daily.';
    wrapText(ctx, quoteText, quoteX + 60, quoteY + 45, quoteW - 90, 24);

    // Quote author
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '900 11px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'right';
    ctx.fillText(data.quote?.author?.toUpperCase() || 'VAULT', quoteX + quoteW - 25, quoteY + quoteH - 22);
    ctx.letterSpacing = '0px';
  }
  else {
    // Intro or fallback: simple centered message
    if (data.highlightText) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, data.highlightText, width / 2, contentY + 120, width * 0.8, 30);
    }
  }

  // 6. Draw footer note / call to action
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('CRUSH YOUR WEEK • LEGACY.LIFE', width / 2, height - 50);

  const durationMs = Date.now() - start;
  console.log(`Share card drawn in ${durationMs}ms`);

  // Return PNG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export to Blob failed'));
    }, 'image/png');
  });
}

// Draw rounded rectangle path helper
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Simple text wrapper utility for canvas context drawing
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

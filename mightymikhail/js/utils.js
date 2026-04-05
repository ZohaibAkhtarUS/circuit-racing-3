// ============================================================
// MIGHTY MIKHAIL - Utility Functions
// ============================================================

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function rnd(min, max) { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function dist(x1, y1, x2, y2) { const dx = x2-x1, dy = y2-y1; return Math.sqrt(dx*dx + dy*dy); }

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function circleRectsOverlap(cx, cy, cr, rx, ry, rw, rh) {
    const nearX = clamp(cx, rx, rx + rw);
    const nearY = clamp(cy, ry, ry + rh);
    return dist(cx, cy, nearX, nearY) <= cr;
}

function shadeColor(hex, pct) {
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    r = clamp(Math.round(r * (1 + pct)), 0, 255);
    g = clamp(Math.round(g * (1 + pct)), 0, 255);
    b = clamp(Math.round(b * (1 + pct)), 0, 255);
    return '#' + [r,g,b].map(c => c.toString(16).padStart(2,'0')).join('');
}

function drawRR(ctx, x, y, w, h, r, fill, stroke, lineW) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineW || 2; ctx.stroke(); }
}

function drawStar(ctx, cx, cy, r, points, fill) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const a = (i * Math.PI / points) - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.4;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function drawHeart(ctx, cx, cy, size, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.2);
    ctx.bezierCurveTo(cx, cy - size * 0.5, cx - size * 0.5, cy - size * 0.6, cx - size * 0.5, cy - size * 0.3);
    ctx.bezierCurveTo(cx - size * 0.5, cy, cx, cy + size * 0.3, cx, cy + size * 0.4);
    ctx.bezierCurveTo(cx, cy + size * 0.3, cx + size * 0.5, cy, cx + size * 0.5, cy - size * 0.3);
    ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.6, cx, cy - size * 0.5, cx, cy - size * 0.2);
    ctx.fill();
}

function drawSpeechBubble(ctx, x, y, text, bgColor) {
    ctx.font = 'bold 12px Arial';
    const m = ctx.measureText(text);
    const pw = m.width + 14;
    const ph = 22;
    const bx = x - pw / 2;
    const by = y - ph - 8;
    drawRR(ctx, bx, by, pw, ph, 6, bgColor || 'rgba(255,255,255,0.9)');
    // Tail
    ctx.fillStyle = bgColor || 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(x - 4, by + ph);
    ctx.lineTo(x, by + ph + 6);
    ctx.lineTo(x + 4, by + ph);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + ph / 2);
}

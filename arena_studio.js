/*! ITI CONNECT — Arena Studio PRO v3.0 (Drop-in plugin for arena_games.js)
 *  Load right AFTER ./arena_games.js.
 *  Adds: Live Preview Canvas, 13 Presets (incl. Classic Ludo), 11 Textured Boards,
 *  8 Bespoke 3D Pieces, 5 Team Palettes, 6 3D Dice Skins, 5 Trail FX, 3 Center Emblems,
 *  1.5x Speed, Haptics & Mid-Game Quick Studio Drawer.
 */
(function () {
  "use strict";

  var api = window.ArenaGames;
  if (!api || window.ArenaStudio) return;

  var LS_KEY = "iti_as_studio_v1";
  var TAU = Math.PI * 2;
  var shade = api.shade, alpha = api.alpha;

  var CZ_TABS = [
    ["presets", "Presets", "sparkles"],
    ["board",   "Themes",  "layout-grid"],
    ["pieces",  "Pieces",  "crown"],
    ["fx",      "Dice & FX", "dices"],
    ["ctrl",    "Controls", "sliders-horizontal"]
  ];

  var STYLES = [["classic", "Classic Tactile"], ["modern", "Modern Glow"]];

  var PIECES = [
    ["pawn",   "Royal Pawn"],
    ["crown",  "King Crown"],
    ["orb",    "Crystal Gem"],
    ["rocket", "Rocket"],
    ["shield", "Knight Crest"],
    ["bolt",   "Volt Star"],
    ["hex",    "Cyber Core"],
    ["lotus",  "Royal Lotus"]
  ];

  var PALETTE_IDS = ["classic", "neon", "pastel", "royal", "sunset"];
  var PALETTES = {
    classic: { name: "Classic",    colors: ["#ef4444", "#22c55e", "#facc15", "#38bdf8"] },
    neon:    { name: "Cyber Neon", colors: ["#ff2e93", "#00f59b", "#ffd60a", "#00e5ff"] },
    pastel:  { name: "Candy Pop",  colors: ["#fb7185", "#4ade80", "#fde047", "#60a5fa"] },
    royal:   { name: "Royal Gem",  colors: ["#dc2626", "#059669", "#f59e0b", "#2563eb"] },
    sunset:  { name: "Sunset",     colors: ["#e11d48", "#a855f7", "#f97316", "#06b6d4"] }
  };

  var DICE_SKINS = [
    ["ivory",    "Pearl Ivory",   "#ffffff", "#dbe4ee", "#0f172a"],
    ["obsidian", "Obsidian Gold", "#0f172a", "#1e293b", "#fbbf24"],
    ["neon",     "Cyber Glass",   "#130d2e", "#2e1065", "#22d3ee"],
    ["gold",     "24K Gold",      "#fde68a", "#d97706", "#451a03"],
    ["crystal",  "Frost Ice",     "#e0f2fe", "#7dd3fc", "#0369a1"],
    ["wood",     "Walnut Wood",   "#92400e", "#451a03", "#fef3c7"]
  ];

  var TRAILS = [
    ["spark",   "Sparks"],
    ["fire",    "Blaze"],
    ["star",    "Stardust"],
    ["rainbow", "Prism"],
    ["none",    "Clean"]
  ];

  var CENTERS = [
    ["jewel", "Prism Jewel"],
    ["crown", "Royal Crown"],
    ["star",  "North Star"]
  ];

  var BOARD_IDS = ["auto", "classic", "wood", "felt", "cyber", "ocean", "gold", "sakura", "lava", "aurora", "retro"];
  var BOARDS = {
    auto_dark:  { name: "Auto",           base: "#0f172a", base2: "#1e293b", cellA: "#1e293b", cellB: "#172033", track: "#334155", line: "#475569", frame: "#0b1220", text: "#e2e8f0", accent: "#fbbf24", glow: "#fbbf24", dark: true,  tex: "grid" },
    auto_light: { name: "Auto",           base: "#f1f5f9", base2: "#e2e8f0", cellA: "#ffffff", cellB: "#e2e8f0", track: "#ffffff", line: "#94a3b8", frame: "#cbd5e1", text: "#1e293b", accent: "#d97706", glow: "#f59e0b", dark: false, tex: "none" },
    classic:    { name: "Classic Ludo",   base: "#fffdf7", base2: "#f3ead8", cellA: "#ffffff", cellB: "#f1f5f9", track: "#ffffff", line: "#334155", frame: "#1e293b", text: "#0f172a", accent: "#dc2626", glow: "#f59e0b", dark: false, tex: "classic" },
    wood:       { name: "Royal Wood",     base: "#6b4423", base2: "#8a5a30", cellA: "#e8c99b", cellB: "#c49a6c", track: "#f3dfb8", line: "#4a2c14", frame: "#3b2210", text: "#3b2210", accent: "#f59e0b", glow: "#fbbf24", dark: false, tex: "wood" },
    felt:       { name: "Emerald Felt",   base: "#065f46", base2: "#047857", cellA: "#10795a", cellB: "#0b5d45", track: "#d1fae5", line: "#022c22", frame: "#064e3b", text: "#ecfdf5", accent: "#fbbf24", glow: "#34d399", dark: true,  tex: "felt" },
    cyber:      { name: "Midnight Cyber", base: "#0b0220", base2: "#1e1b4b", cellA: "#1e1b4b", cellB: "#151236", track: "#241b4d", line: "#7c3aed", frame: "#312e81", text: "#e0e7ff", accent: "#22d3ee", glow: "#a78bfa", dark: true,  tex: "grid" },
    ocean:      { name: "Oceanic Abyss",  base: "#0c2a4d", base2: "#0e4a7a", cellA: "#14507d", cellB: "#0f3d63", track: "#e0f2fe", line: "#38bdf8", frame: "#082f49", text: "#e0f2fe", accent: "#38bdf8", glow: "#38bdf8", dark: true,  tex: "waves" },
    gold:       { name: "Maharaja Gold",  base: "#2b123f", base2: "#4c1d57", cellA: "#3b1752", cellB: "#2d1042", track: "#fef3c7", line: "#f59e0b", frame: "#78350f", text: "#fef3c7", accent: "#fbbf24", glow: "#f59e0b", dark: true,  tex: "filigree" },
    sakura:     { name: "Sakura Zen",     base: "#fdf2f8", base2: "#fce7f3", cellA: "#ffffff", cellB: "#fbcfe8", track: "#fff1f2", line: "#f472b6", frame: "#be185d", text: "#831843", accent: "#ec4899", glow: "#f472b6", dark: false, tex: "sakura" },
    lava:       { name: "Lava Forge",     base: "#1c0a0a", base2: "#3b0d0c", cellA: "#2a1215", cellB: "#1f0b0e", track: "#38181b", line: "#f97316", frame: "#7c2d12", text: "#ffedd5", accent: "#fb923c", glow: "#ef4444", dark: true,  tex: "lava" },
    aurora:     { name: "Aurora Sky",     base: "#051923", base2: "#161a42", cellA: "#0f2c3f", cellB: "#172042", track: "#1e293b", line: "#2dd4bf", frame: "#0d9488", text: "#ccfbf1", accent: "#2dd4bf", glow: "#a855f7", dark: true,  tex: "aurora" },
    retro:      { name: "Arcade 8-Bit",   base: "#111827", base2: "#1f2937", cellA: "#18181b", cellB: "#27272a", track: "#f4f4f5", line: "#22c55e", frame: "#16a34a", text: "#bbf7d0", accent: "#4ade80", glow: "#22c55e", dark: true,  tex: "pixel" }
  };

  var PRESETS = [
    { id: "classic",  name: "Classic Ludo", emoji: "🎲", sub: "Iconic bright board · traditional pawns · ivory dice", grad: "linear-gradient(135deg,#dc2626,#d97706 52%,#15803d)", set: { style: "classic", board: "classic", piece: "pawn",   palette: "classic", dice: "ivory",    trail: "none",    center: "crown" } },
    { id: "cyber",    name: "Cyber Neon",   emoji: "⚡", sub: "Synthwave glow",       grad: "linear-gradient(135deg,#0b0220,#6d28d9,#06b6d4)",   set: { style: "modern",  board: "cyber",   piece: "hex",    palette: "neon",    dice: "neon",     trail: "rainbow", center: "jewel" } },
    { id: "maharaja", name: "Maharaja",     emoji: "👑", sub: "Royal purple & gold",  grad: "linear-gradient(135deg,#2b123f,#b45309,#fbbf24)",   set: { style: "classic", board: "gold",    piece: "crown",  palette: "royal",   dice: "gold",     trail: "star",    center: "crown" } },
    { id: "casino",   name: "VIP Casino",   emoji: "🎰", sub: "Emerald felt & gold",  grad: "linear-gradient(135deg,#022c22,#047857,#d97706)",   set: { style: "classic", board: "felt",    piece: "shield", palette: "royal",   dice: "obsidian", trail: "spark",   center: "crown" } },
    { id: "abyss",    name: "Deep Ocean",   emoji: "🌊", sub: "Tidal waves & ice",    grad: "linear-gradient(135deg,#082f49,#0284c7,#38bdf8)",   set: { style: "modern",  board: "ocean",   piece: "orb",    palette: "classic", dice: "crystal",  trail: "star",    center: "star"  } },
    { id: "arcade",   name: "Retro 8-Bit",  emoji: "👾", sub: "Pixel grid & neon",    grad: "linear-gradient(135deg,#09090b,#15803d,#4ade80)",   set: { style: "modern",  board: "retro",   piece: "bolt",   palette: "neon",    dice: "neon",     trail: "rainbow", center: "star"  } },
    { id: "sakura",   name: "Sakura Zen",   emoji: "🌸", sub: "Blossom & pearl",      grad: "linear-gradient(135deg,#831843,#ec4899,#fbcfe8)",   set: { style: "modern",  board: "sakura",  piece: "lotus",  palette: "pastel",  dice: "crystal",  trail: "star",    center: "star"  } },
    { id: "volcano",  name: "Lava Forge",   emoji: "🔥", sub: "Obsidian & flame",     grad: "linear-gradient(135deg,#1c0a0a,#dc2626,#f97316)",   set: { style: "modern",  board: "lava",    piece: "rocket", palette: "sunset",  dice: "obsidian", trail: "fire",    center: "jewel" } },
    { id: "aurora",   name: "Aurora Sky",   emoji: "🌌", sub: "Northern lights",      grad: "linear-gradient(135deg,#051923,#0d9488,#7c3aed)",   set: { style: "modern",  board: "aurora",  piece: "orb",    palette: "neon",    dice: "crystal",  trail: "rainbow", center: "jewel" } },
    { id: "heritage", name: "Royal Wood",   emoji: "🪵", sub: "Carved classic",       grad: "linear-gradient(135deg,#3b2210,#78350f,#d97706)",   set: { style: "classic", board: "wood",    piece: "pawn",   palette: "classic", dice: "wood",     trail: "spark",   center: "crown" } },
    { id: "knight",   name: "Dark Knight",  emoji: "🛡️", sub: "Forged crest & fire",  grad: "linear-gradient(135deg,#0f172a,#334155,#dc2626)",   set: { style: "classic", board: "lava",    piece: "shield", palette: "royal",   dice: "obsidian", trail: "fire",    center: "crown" } },
    { id: "thunder",  name: "Volt Surge",   emoji: "🌩️", sub: "Gold bolt & storm",    grad: "linear-gradient(135deg,#1e1b4b,#7c3aed,#f59e0b)",   set: { style: "modern",  board: "cyber",   piece: "bolt",   palette: "sunset",  dice: "gold",     trail: "spark",   center: "star"  } },
    { id: "candy",    name: "Candy Rush",   emoji: "🍭", sub: "Pastel pop & prism",   grad: "linear-gradient(135deg,#be185d,#a855f7,#38bdf8)",   set: { style: "modern",  board: "sakura",  piece: "rocket", palette: "pastel",  dice: "ivory",    trail: "rainbow", center: "jewel" } }
  ];

  var DEFAULTS = {
    open: false, czTab: "presets",
    style: "modern", board: "auto", piece: "pawn", palette: "classic",
    dice: "ivory", trail: "spark", center: "jewel",
    speed: 1, mute: false, haptic: true
  };

  function has(list, id) { for (var i = 0; i < list.length; i++) if ((list[i][0] || list[i]) === id) return true; return false; }
  function nameOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1]; return ""; }
  function bright() { return document.documentElement.classList.contains("bright-mode"); }
  function icons() { try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) { } }
  function ico(n, c) { return '<i data-lucide="' + n + '" class="ag-i ' + (c || "") + '"></i>'; }
  function buzz(p) { if (!S.haptic) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  function loadStudio() {
    var s = {}, k, base = api.getPrefs(), saved = null;
    for (k in DEFAULTS) s[k] = DEFAULTS[k];
    if (base) {
      if (has(STYLES, base.style)) s.style = base.style;
      if (BOARD_IDS.indexOf(base.board) >= 0) s.board = base.board;
      if (has(PIECES, base.piece)) s.piece = base.piece;
      if (base.speed === 1 || base.speed === 2) s.speed = base.speed;
      if (typeof base.mute === "boolean") s.mute = base.mute;
      if (typeof base.open === "boolean") s.open = base.open;
    }
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { saved = null; }
    if (saved && typeof saved === "object") {
      if (typeof saved.open === "boolean") s.open = saved.open;
      if (has(CZ_TABS, saved.czTab)) s.czTab = saved.czTab;
      if (has(STYLES, saved.style)) s.style = saved.style;
      if (BOARD_IDS.indexOf(saved.board) >= 0) s.board = saved.board;
      if (has(PIECES, saved.piece)) s.piece = saved.piece;
      if (PALETTE_IDS.indexOf(saved.palette) >= 0) s.palette = saved.palette;
      if (has(DICE_SKINS, saved.dice)) s.dice = saved.dice;
      if (has(TRAILS, saved.trail)) s.trail = saved.trail;
      if (has(CENTERS, saved.center)) s.center = saved.center;
      if (saved.speed === 1 || saved.speed === 1.5 || saved.speed === 2) s.speed = saved.speed;
      if (typeof saved.mute === "boolean") s.mute = saved.mute;
      if (typeof saved.haptic === "boolean") s.haptic = saved.haptic;
    }
    return s;
  }
  function saveStudio() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } }

  var S = loadStudio();
  var origSetPref = api.setPref, origSubscribe = api.subscribe;
  var subList = [], pvRaf = 0, pvSparks = [], pvT0 = 0, pvLastHop = -1, root = null, mounted = false;

  /* ---------- Canvas Renderers (11 Textured Boards, 8 3D Pieces, 3 Center Emblems, 5 Trails) ---------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function getBoard(id) {
    id = id || S.board;
    var t = id === "auto" ? (bright() ? BOARDS.auto_light : BOARDS.auto_dark) : (BOARDS[id] || BOARDS.auto_dark), o = { id: id + "_" + S.palette }, k;
    for (k in t) o[k] = t[k];
    if (id === "auto") o.name = "Auto";
    o.modern = S.style === "modern";
    return o;
  }

  function getPalette(id) {
    return (PALETTES[id || S.palette] || PALETTES.classic).colors.slice();
  }

  function paintBoardBg(ctx, x, y, w, h, radius, boardId) {
    if (!ctx) return;
    var b = getBoard(boardId), r = radius == null ? Math.min(w, h) * 0.04 : radius, g, i, j, n, st;
    ctx.save();
    rr(ctx, x, y, w, h, r);
    g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, b.base); g.addColorStop(1, b.base2);
    ctx.fillStyle = g; ctx.fill(); ctx.clip();

    if (b.tex === "classic") {
      ctx.strokeStyle = "rgba(30,41,59,0.22)"; ctx.lineWidth = Math.max(1.5, w * 0.005);
      rr(ctx, x + w * 0.018, y + h * 0.018, w * 0.964, h * 0.964, r * 0.82); ctx.stroke();
    } else if (b.tex === "wood") {
      ctx.strokeStyle = "rgba(40,20,5,0.16)"; ctx.lineWidth = Math.max(1, w * 0.004);
      for (i = 0; i < 18; i++) {
        var yy = y + (i / 18) * h;
        ctx.beginPath(); ctx.moveTo(x, yy);
        ctx.bezierCurveTo(x + w * 0.33, yy + Math.sin(i * 1.4) * h * 0.025, x + w * 0.66, yy - Math.cos(i) * h * 0.025, x + w, yy + Math.sin(i) * h * 0.015);
        ctx.stroke();
      }
    } else if (b.tex === "felt") {
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      for (i = 0; i < w + h; i += Math.max(8, w * 0.03)) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x, y + i); ctx.stroke(); }
      ctx.strokeStyle = alpha(b.accent, 0.45); ctx.lineWidth = Math.max(1.5, w * 0.004); ctx.setLineDash([6, 5]);
      rr(ctx, x + w * 0.02, y + h * 0.02, w * 0.96, h * 0.96, r * 0.8); ctx.stroke(); ctx.setLineDash([]);
    } else if (b.tex === "waves") {
      ctx.strokeStyle = alpha(b.glow, 0.14); ctx.lineWidth = Math.max(1.2, w * 0.004);
      for (i = 1; i < 9; i++) {
        var wy = y + (i / 9) * h; ctx.beginPath();
        for (j = 0; j <= 16; j++) { var wx = x + (j / 16) * w, oy = Math.sin(j * 0.9 + i) * h * 0.018; if (j) ctx.lineTo(wx, wy + oy); else ctx.moveTo(wx, wy + oy); }
        ctx.stroke();
      }
    } else if (b.tex === "filigree") {
      ctx.strokeStyle = alpha(b.accent, 0.26); ctx.lineWidth = Math.max(1.2, w * 0.004);
      rr(ctx, x + w * 0.025, y + h * 0.025, w * 0.95, h * 0.95, r * 0.75); ctx.stroke();
      var cs = [[x + w * 0.05, y + h * 0.05], [x + w * 0.95, y + h * 0.05], [x + w * 0.05, y + h * 0.95], [x + w * 0.95, y + h * 0.95]];
      for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cs[i][0], cs[i][1], w * 0.06, 0, TAU); ctx.stroke(); }
    } else if (b.tex === "sakura") {
      var pts = [[0.14, 0.18], [0.84, 0.14], [0.22, 0.82], [0.86, 0.78], [0.5, 0.12], [0.5, 0.88]];
      ctx.fillStyle = "rgba(244,114,182,0.24)";
      for (i = 0; i < pts.length; i++) {
        ctx.save(); ctx.translate(x + pts[i][0] * w, y + pts[i][1] * h); ctx.rotate(i * 1.1);
        for (j = 0; j < 5; j++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -w * 0.024, w * 0.011, w * 0.02, 0, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    } else if (b.tex === "lava") {
      g = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, w * 0.05, x + w * 0.5, y + h * 0.5, w * 0.75);
      g.addColorStop(0, "rgba(249,115,22,0.28)"); g.addColorStop(0.55, "rgba(220,38,38,0.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(251,146,60,0.28)"; ctx.lineWidth = Math.max(1.5, w * 0.005);
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.25); ctx.lineTo(x + w * 0.3, y + h * 0.42); ctx.lineTo(x + w * 0.65, y + h * 0.34); ctx.lineTo(x + w, y + h * 0.62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h); ctx.lineTo(x + w * 0.48, y + h * 0.68); ctx.lineTo(x + w * 0.82, y + h * 0.8); ctx.stroke();
    } else if (b.tex === "aurora") {
      var a1 = ctx.createRadialGradient(x + w * 0.2, y + h * 0.2, 0, x + w * 0.2, y + h * 0.2, w * 0.7);
      a1.addColorStop(0, "rgba(45,212,191,0.3)"); a1.addColorStop(1, "rgba(45,212,191,0)");
      ctx.fillStyle = a1; ctx.fillRect(x, y, w, h);
      var a2 = ctx.createRadialGradient(x + w * 0.82, y + h * 0.78, 0, x + w * 0.82, y + h * 0.78, w * 0.7);
      a2.addColorStop(0, "rgba(168,85,247,0.32)"); a2.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = a2; ctx.fillRect(x, y, w, h);
    } else if (b.tex === "pixel") {
      n = 15; st = w / n; ctx.strokeStyle = "rgba(74,222,128,0.14)"; ctx.lineWidth = 1; ctx.beginPath();
      for (i = 1; i < n; i++) { ctx.moveTo(x + i * st, y); ctx.lineTo(x + i * st, y + h); }
      for (i = 1; i * st < h; i++) { ctx.moveTo(x, y + i * st); ctx.lineTo(x + w, y + i * st); }
      ctx.stroke();
    }

    if (b.modern) {
      if (b.tex === "grid") {
        n = 12; st = w / n; ctx.strokeStyle = alpha(b.glow, b.dark ? 0.11 : 0.12); ctx.lineWidth = 1; ctx.beginPath();
        for (i = 1; i < n; i++) { ctx.moveTo(x + i * st, y); ctx.lineTo(x + i * st, y + h); }
        for (i = 1; i * st < h; i++) { ctx.moveTo(x, y + i * st); ctx.lineTo(x + w, y + i * st); }
        ctx.stroke();
      }
      g = ctx.createRadialGradient(x + w * 0.85, y + h * 0.1, 0, x + w * 0.85, y + h * 0.1, Math.max(w, h) * 0.72);
      g.addColorStop(0, alpha(b.glow, 0.24)); g.addColorStop(1, alpha(b.glow, 0));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else {
      g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.24)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();

    ctx.save(); rr(ctx, x, y, w, h, r);
    if (b.modern) {
      ctx.strokeStyle = alpha(b.accent, 0.85); ctx.lineWidth = Math.max(1.5, w * 0.007);
      ctx.shadowColor = alpha(b.glow, 0.9); ctx.shadowBlur = Math.max(6, w * 0.022);
    } else {
      ctx.strokeStyle = b.frame; ctx.lineWidth = Math.max(3, w * 0.014);
    }
    ctx.stroke(); ctx.restore();
  }

  function drawToken(ctx, x, y, r, color, shape, style, lift) {
    if (!ctx) return;
    r = r > 0 ? r : 12; color = color || "#38bdf8"; lift = lift || 0;
    if (!has(PIECES, shape)) shape = S.piece;
    var modern = (style === "classic" || style === "modern" ? style : S.style) === "modern";
    var dk = shade(color, -0.5), md = shade(color, -0.08), lt = shade(color, 0.5), g, i, a;

    ctx.save();
    var shA = Math.max(0.12, (modern ? 0.32 : 0.38) - lift / (r * 5));
    var shS = Math.max(0.45, 0.74 - lift / (r * 2.6 + 1) * 0.25);
    ctx.fillStyle = "rgba(0,0,0," + shA.toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.64, r * shS, r * 0.22, 0, 0, TAU); ctx.fill();

    y -= lift;
    ctx.translate(x, y);
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    if (shape === "pawn") {
      var u = r;
      function pBody() {
        ctx.beginPath();
        ctx.moveTo(-u * 0.58, u * 0.5);
        ctx.bezierCurveTo(-u * 0.5, u * 0.12, -u * 0.28, -u * 0.02, -u * 0.19, -u * 0.22);
        ctx.lineTo(u * 0.19, -u * 0.22);
        ctx.bezierCurveTo(u * 0.28, -u * 0.02, u * 0.5, u * 0.12, u * 0.58, u * 0.5);
        ctx.closePath();
      }
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = Math.max(1.8, u * 0.18);
      if (modern) { ctx.shadowColor = alpha(color, 0.85); ctx.shadowBlur = u * 0.55; }
      ctx.beginPath(); ctx.ellipse(0, u * 0.5, u * 0.7, u * 0.21, 0, 0, TAU); ctx.stroke();
      pBody(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -u * 0.48, u * 0.38, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;

      g = ctx.createLinearGradient(-u * 0.7, 0, u * 0.7, 0);
      g.addColorStop(0, dk); g.addColorStop(0.35, lt); g.addColorStop(0.7, md); g.addColorStop(1, dk);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, u * 0.5, u * 0.7, u * 0.21, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = Math.max(0.8, u * 0.05); ctx.stroke();

      g = ctx.createLinearGradient(-u * 0.58, 0, u * 0.58, 0);
      g.addColorStop(0, dk); g.addColorStop(0.3, lt); g.addColorStop(0.65, md); g.addColorStop(1, dk);
      ctx.fillStyle = g; pBody(); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.32)";
      ctx.beginPath(); ctx.ellipse(-u * 0.22, u * 0.18, u * 0.07, u * 0.24, 0.12, 0, TAU); ctx.fill();

      g = ctx.createLinearGradient(-u * 0.35, 0, u * 0.35, 0);
      g.addColorStop(0, md); g.addColorStop(0.4, lt); g.addColorStop(1, dk);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -u * 0.2, u * 0.34, u * 0.1, 0, 0, TAU); ctx.fill();

      g = ctx.createRadialGradient(-u * 0.14, -u * 0.63, u * 0.04, 0, -u * 0.48, u * 0.44);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.25, lt); g.addColorStop(0.7, md); g.addColorStop(1, dk);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -u * 0.48, u * 0.38, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath(); ctx.ellipse(-u * 0.14, -u * 0.62, u * 0.1, u * 0.065, -0.6, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }

    var sc = r * 0.88;
    ctx.scale(sc, sc);
    function haloFill(pathFn, fillStyle) {
      pathFn();
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 0.18;
      if (modern) { ctx.shadowColor = alpha(color, 0.9); ctx.shadowBlur = sc * 0.7; }
      ctx.stroke(); ctx.restore();
      pathFn(); ctx.fillStyle = fillStyle; ctx.fill();
      ctx.strokeStyle = modern ? "rgba(255,255,255,.65)" : dk; ctx.lineWidth = 0.06; ctx.stroke();
    }

    if (shape === "crown") {
      g = ctx.createLinearGradient(-0.75, -0.7, 0.75, 0.65);
      g.addColorStop(0, lt); g.addColorStop(0.45, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath();
        ctx.moveTo(-0.68, 0.48); ctx.lineTo(-0.78, -0.32); ctx.lineTo(-0.34, 0.04);
        ctx.lineTo(0, -0.64); ctx.lineTo(0.34, 0.04); ctx.lineTo(0.78, -0.32);
        ctx.lineTo(0.68, 0.48); ctx.closePath();
      }, g);
      ctx.fillStyle = "#fde047"; ctx.fillRect(-0.64, 0.3, 1.28, 0.22);
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 0.05; ctx.strokeRect(-0.64, 0.3, 1.28, 0.22);
      var tips = [[-0.78, -0.36], [0, -0.68], [0.78, -0.36]];
      for (i = 0; i < 3; i++) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tips[i][0], tips[i][1], 0.11, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.arc(0, 0.41, 0.08, 0, TAU); ctx.arc(-0.36, 0.41, 0.06, 0, TAU); ctx.arc(0.36, 0.41, 0.06, 0, TAU); ctx.fill();
    } else if (shape === "orb") {
      g = ctx.createRadialGradient(-0.25, -0.3, 0.06, 0, 0, 0.9);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.28, lt); g.addColorStop(0.62, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath();
        for (i = 0; i < 8; i++) { a = -Math.PI / 2 + i * TAU / 8; if (i) ctx.lineTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78); else ctx.moveTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78); }
        ctx.closePath();
      }, g);
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 0.05; ctx.beginPath();
      for (i = 0; i < 8; i++) { a = -Math.PI / 2 + i * TAU / 8; if (i) ctx.lineTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44); else ctx.moveTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44); }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.ellipse(-0.24, -0.26, 0.16, 0.09, -0.7, 0, TAU); ctx.fill();
    } else if (shape === "rocket") {
      g = ctx.createLinearGradient(-0.5, -0.8, 0.5, 0.5);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath(); ctx.moveTo(0, -0.86);
        ctx.bezierCurveTo(0.45, -0.45, 0.42, 0.1, 0.34, 0.42);
        ctx.lineTo(0.68, 0.62); ctx.lineTo(0.28, 0.58); ctx.lineTo(0, 0.48); ctx.lineTo(-0.28, 0.58); ctx.lineTo(-0.68, 0.62); ctx.lineTo(-0.34, 0.42);
        ctx.bezierCurveTo(-0.42, 0.1, -0.45, -0.45, 0, -0.86); ctx.closePath();
      }, g);
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.moveTo(-0.18, 0.5); ctx.lineTo(0, 0.82); ctx.lineTo(0.18, 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e0f2fe"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.arc(0, -0.14, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (shape === "shield") {
      g = ctx.createLinearGradient(-0.6, -0.75, 0.6, 0.85);
      g.addColorStop(0, lt); g.addColorStop(0.45, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath(); ctx.moveTo(0, -0.8); ctx.lineTo(0.68, -0.56); ctx.lineTo(0.62, 0.08);
        ctx.bezierCurveTo(0.56, 0.52, 0.22, 0.74, 0, 0.86); ctx.bezierCurveTo(-0.22, 0.74, -0.56, 0.52, -0.62, 0.08);
        ctx.lineTo(-0.68, -0.56); ctx.closePath();
      }, g);
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.moveTo(0, -0.42); ctx.lineTo(0.32, 0.02); ctx.lineTo(0, 0.44); ctx.lineTo(-0.32, 0.02); ctx.closePath(); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0.02, 0.12, 0, TAU); ctx.fill();
    } else if (shape === "bolt") {
      g = ctx.createLinearGradient(-0.6, -0.8, 0.6, 0.8);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath();
        for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; var rad = i % 2 ? 0.44 : 0.88; if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
        ctx.closePath();
      }, g);
      ctx.fillStyle = "#fff"; ctx.beginPath();
      ctx.moveTo(0.1, -0.38); ctx.lineTo(-0.22, 0.05); ctx.lineTo(-0.02, 0.05); ctx.lineTo(-0.1, 0.42); ctx.lineTo(0.22, -0.04); ctx.lineTo(0.02, -0.04); ctx.closePath(); ctx.fill();
    } else if (shape === "hex") {
      g = ctx.createLinearGradient(-0.7, -0.7, 0.7, 0.7);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath();
        for (i = 0; i < 6; i++) { a = -Math.PI / 6 + i * TAU / 6; if (i) ctx.lineTo(Math.cos(a) * 0.82, Math.sin(a) * 0.82); else ctx.moveTo(Math.cos(a) * 0.82, Math.sin(a) * 0.82); }
        ctx.closePath();
      }, g);
      ctx.fillStyle = "#0b1020"; ctx.beginPath(); ctx.arc(0, 0, 0.42, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.07; ctx.stroke();
      ctx.fillStyle = lt; ctx.beginPath(); ctx.arc(0, 0, 0.22, 0, TAU); ctx.fill();
    } else {
      g = ctx.createLinearGradient(0, -0.8, 0, 0.65);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, lt); g.addColorStop(0.75, color); g.addColorStop(1, dk);
      haloFill(function () {
        ctx.beginPath(); ctx.moveTo(0, -0.82);
        ctx.bezierCurveTo(0.35, -0.4, 0.35, 0.1, 0.25, 0.36); ctx.bezierCurveTo(0.55, 0.05, 0.85, -0.1, 0.78, 0.32);
        ctx.bezierCurveTo(0.68, 0.62, 0.3, 0.68, 0, 0.62); ctx.bezierCurveTo(-0.3, 0.68, -0.68, 0.62, -0.78, 0.32);
        ctx.bezierCurveTo(-0.85, -0.1, -0.55, 0.05, -0.25, 0.36); ctx.bezierCurveTo(-0.35, 0.1, -0.35, -0.4, 0, -0.82); ctx.closePath();
      }, g);
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(0, 0.22, 0.15, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawCenter(c, cx, cy, r, t) {
    var cols = getPalette(), g, i;
    c.save();
    if (S.center === "crown") {
      g = c.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      g.addColorStop(0, "#fef9c3"); g.addColorStop(0.55, "#f59e0b"); g.addColorStop(1, "#78350f");
      c.shadowColor = "rgba(251,191,36,.8)"; c.shadowBlur = r * 0.85;
      c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fillStyle = g; c.fill();
      c.shadowBlur = 0; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, r * 0.1); c.stroke();
      var s = r * (0.58 + 0.06 * Math.sin(t / 350));
      c.translate(cx, cy); c.fillStyle = "#451a03";
      c.beginPath(); c.moveTo(-s * 0.72, s * 0.45); c.lineTo(-s * 0.82, -s * 0.35); c.lineTo(-s * 0.3, s * 0.05);
      c.lineTo(0, -s * 0.65); c.lineTo(s * 0.3, s * 0.05); c.lineTo(s * 0.82, -s * 0.35); c.lineTo(s * 0.72, s * 0.45); c.closePath(); c.fill();
      c.fillStyle = "#fef08a"; c.fillRect(-s * 0.68, s * 0.3, s * 1.36, s * 0.2);
    } else if (S.center === "star") {
      c.translate(cx, cy); c.rotate((t / 2800) % TAU);
      c.shadowColor = "#fde047"; c.shadowBlur = r * 0.9;
      c.beginPath();
      for (i = 0; i < 16; i++) { var a = i * TAU / 16, rad = i % 2 ? r * 0.45 : r * 1.05; if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
      c.closePath();
      g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#fde047"); g.addColorStop(1, "#f59e0b");
      c.fillStyle = g; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.stroke();
    } else {
      if (c.createConicGradient) {
        g = c.createConicGradient((t / 2200) % TAU, cx, cy);
        for (i = 0; i < 4; i++) g.addColorStop(i / 4, cols[i]);
        g.addColorStop(1, cols[0]);
      } else g = "#fde047";
      c.shadowColor = "rgba(255,255,255,.8)"; c.shadowBlur = r * 0.9;
      c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fillStyle = g; c.fill();
      c.shadowBlur = 0; c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = Math.max(1.5, r * 0.1); c.stroke();
      g = c.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r * 0.7);
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#cbd5e1");
      c.beginPath(); c.arc(cx, cy, r * 0.66, 0, TAU); c.fillStyle = g; c.fill();
      c.translate(cx, cy); c.rotate(-(t / 1500) % TAU);
      c.beginPath();
      for (i = 0; i < 10; i++) { var a2 = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? r * 0.23 : r * 0.5; if (i) c.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); else c.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2); }
      c.closePath(); c.fillStyle = "#f59e0b"; c.fill(); c.strokeStyle = "#92400e"; c.lineWidth = 1; c.stroke();
    }
    c.restore();
  }

  function spawnTrail(particles, x, y, col, sz) {
    if (S.trail === "none") return;
    sz = sz || 440;
    if (S.trail === "fire") {
      particles.push({ k: "s", x: x, y: y, vx: (Math.random() - 0.5) * 0.9, vy: -1.0 - Math.random() * 1.1, life: 0.95, col: Math.random() < 0.5 ? "#f97316" : "#fde047", r: sz * 0.014 });
    } else if (S.trail === "star") {
      particles.push({ k: "s", x: x, y: y, vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4, life: 0.95, col: Math.random() < 0.4 ? "#ffffff" : "#fde047", r: sz * 0.013 });
    } else if (S.trail === "rainbow") {
      particles.push({ k: "s", x: x, y: y, vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7, life: 0.95, col: "hsl(" + Math.round((performance.now() * 0.55) % 360) + ",95%,62%)", r: sz * 0.014 });
    } else {
      particles.push({ k: "d", x: x, y: y, life: 0.82, col: col, r: sz * 0.017 });
    }
  }

  /* ---------- Bridge onto window.ArenaGames ---------- */
  api.getBoard = getBoard;
  api.getPalette = getPalette;
  api.paintBoardBg = paintBoardBg;
  api.drawToken = drawToken;
  api.drawCenter = drawCenter;
  api.spawnTrail = spawnTrail;
  api.speed = function () { return S.speed; };
  api.dur = function (ms) { return ms / S.speed; };
  api.boards = function () { return BOARD_IDS.slice(); };
  api.pieces = function () { return PIECES.map(function (p) { return p[0]; }); };
  api.subscribe = function (fn) {
    subList.push(fn);
    var unsub = origSubscribe(fn);
    return function () { var i = subList.indexOf(fn); if (i >= 0) subList.splice(i, 1); unsub(); };
  };

  function notifyGames(key) {
    var snap = api.getPrefs();
    snap.style = S.style; snap.board = S.board; snap.piece = S.piece; snap.palette = S.palette; snap.dice = S.dice; snap.speed = S.speed;
    if (subList.length) {
      for (var i = 0; i < subList.length; i++) { try { subList[i](snap, key); } catch (e) { } }
    } else {
      // Fallback redraw if games mounted before this plugin loaded
      var alt = S.style === "modern" ? "classic" : "modern";
      origSetPref("style", alt); origSetPref("style", S.style);
    }
  }

  function applyRootAttrs() {
    if (!root) return;
    var b = getBoard(), rs = root.style;
    rs.setProperty("--agb-base", b.base); rs.setProperty("--agb-base2", b.base2);
    rs.setProperty("--agb-accent", b.accent); rs.setProperty("--agb-glow", b.glow);
    rs.setProperty("--ag-k", String(1 / S.speed));
    root.setAttribute("data-ag-style", S.style);
    root.setAttribute("data-ag-board", S.board);
    root.setAttribute("data-ag-piece", S.piece);
    root.setAttribute("data-as-dice", S.dice);
  }

  function commit(key) {
    saveStudio();
    if (key === "style" || key === "all") origSetPref("style", S.style);
    if (key === "mute" || key === "all") origSetPref("mute", S.mute);
    if (key === "open") origSetPref("open", S.open);
    applyRootAttrs();
    syncStudio();
    drawThumbs();
    notifyGames(key || "studio");
  }

  function toggleInGameStudio() {
    if (!root) return;
    var w = root.querySelector(".ag-wrap"); if (!w) return;
    var showing = w.classList.toggle("ag-peek-cz");
    S.open = showing;
    commit("open");
    api.playSfx("click");
  }
  api.toggleStudio = toggleInGameStudio;

  /* ---------- Studio CSS (Drawer + Live Preview + 6 3D Dice Skins) ---------- */
  function injectCss() {
    if (document.getElementById("as-style")) return;
    var R = "#quiz-arena-root ", c = [
      R + ".ag-cz{border-color:rgba(251,191,36,.35)!important}",
      R + ".ag-cz-h{background:linear-gradient(90deg,rgba(251,191,36,.09),transparent 65%)!important}",
      R + ".ag-cz-ic{width:36px!important;height:36px!important;border-radius:.75rem!important;background:linear-gradient(135deg,rgba(251,191,36,.3),rgba(245,158,11,.12))!important;box-shadow:0 0 16px -4px rgba(251,191,36,.5)}",
      R + ".as-badge{font-size:9px;font-weight:900;letter-spacing:.08em;padding:2px 6px;border-radius:999px;background:linear-gradient(135deg,#fde047,#f59e0b);color:#1f1300;margin-left:5px;vertical-align:1px}",
      R + ".as-pv{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--ag-bd);margin:.65rem 0;box-shadow:0 10px 24px -14px rgba(0,0,0,.7)}",
      R + ".as-pv-cv{display:block;width:100%;height:108px}",
      R + ".as-pv-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(2,6,23,.58);border-top:1px solid rgba(255,255,255,.1);color:#f8fafc}",
      R + ".as-pv-tag{font-size:11px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      R + ".as-pv-dots{display:flex;gap:3px}",
      R + ".as-pv-dots i{width:9px;height:9px;border-radius:50%;border:1px solid rgba(255,255,255,.65)}",
      R + ".as-rand{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:800;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1f1300!important;border:0}",
      R + ".as-rand .ag-i{width:12px;height:12px}",
      R + ".as-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:3px;border-radius:.85rem;background:var(--ag-bg2);border:1px solid var(--ag-bd);margin-bottom:.65rem}",
      R + ".as-tb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;border-radius:.65rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-size:10px;font-weight:800;transition:.18s}",
      R + ".as-tb .ag-i{width:14px;height:14px}",
      R + ".as-tb.on{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",
      R + ".as-presets{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;max-height:260px;overflow-y:auto;padding:2px}",
      R + ".as-pr{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 10px 9px;border-radius:14px;border:1.5px solid rgba(255,255,255,.22);color:#fff!important;text-align:left;box-shadow:0 8px 18px -10px rgba(0,0,0,.65);transition:transform .15s,box-shadow .2s,border-color .2s}",
      R + ".as-pr:active{transform:scale(.97)}",
      R + ".as-pr.on{border-color:#fde047;box-shadow:0 0 0 2px #fde047,0 10px 22px -8px rgba(251,191,36,.65)}",
      R + ".as-pr[data-k='classic']{grid-column:1/-1}",
      R + ".as-pr-e{font-size:18px;line-height:1}",
      R + ".as-pr-n{font-size:12.5px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.45)}",
      R + ".as-pr-s{font-size:10px;font-weight:600;opacity:.88}",
      R + ".as-boards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      R + ".as-pieces{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      R + ".as-pals{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}",
      R + ".as-dices{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}",
      R + ".as-boards button," + R + ".as-pieces button," + R + ".as-pal," + R + ".as-dskin{display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 3px 6px;border-radius:.82rem;border:1.5px solid var(--ag-bd);background:var(--ag-bg2);transition:.18s}",
      R + ".as-boards button.on," + R + ".as-pieces button.on," + R + ".as-pal.on," + R + ".as-dskin.on{border-color:var(--ag-onb);background:var(--ag-on);box-shadow:0 0 0 1px var(--ag-onb)}",
      R + ".as-pal-d{display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:4px}",
      R + ".as-pal-d i{width:11px;height:11px;border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.45)}",
      R + ".as-dchip{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:2px solid;font-size:20px;line-height:1;box-shadow:0 4px 10px -4px rgba(0,0,0,.55)}",
      R + ".ag-playing.ag-peek-cz .ag-cz{display:block!important;margin-bottom:.55rem}",
      R + ".as-midbtn{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;color:var(--ag-ac)!important;border:1px solid var(--ag-onb)!important;background:var(--ag-on)!important;flex:none}",
      /* 6 3D Dice Skins for Ludo */
      "#quiz-arena-root[data-as-dice='obsidian'] .lx-f{background:linear-gradient(145deg,#1e293b,#0f172a 60%,#020617);border-color:rgba(251,191,36,.65);box-shadow:inset 0 0 calc(var(--s)*.18) rgba(251,191,36,.2),inset 0 0 0 calc(var(--s)*.035) #fbbf24}",
      "#quiz-arena-root[data-as-dice='obsidian'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#fef08a,#f59e0b 65%,#92400e);box-shadow:0 0 6px rgba(251,191,36,.65)}",
      "#quiz-arena-root[data-as-dice='neon'] .lx-f{background:linear-gradient(145deg,rgba(46,16,101,.92),rgba(15,10,40,.96));border-color:var(--dc);box-shadow:inset 0 0 calc(var(--s)*.24) var(--dc),inset 0 0 0 calc(var(--s)*.04) var(--dc)}",
      "#quiz-arena-root[data-as-dice='neon'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#22d3ee 60%,#0891b2);box-shadow:0 0 8px #22d3ee}",
      "#quiz-arena-root[data-as-dice='gold'] .lx-f{background:linear-gradient(145deg,#fef9c3,#fbbf24 52%,#b45309);border-color:#fef08a;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.65),inset 0 0 0 calc(var(--s)*.035) #78350f}",
      "#quiz-arena-root[data-as-dice='gold'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#92400e,#451a03 75%);box-shadow:0 1px 1px rgba(255,255,255,.6)}",
      "#quiz-arena-root[data-as-dice='crystal'] .lx-f{background:linear-gradient(145deg,#ffffff,#e0f2fe 45%,#7dd3fc);border-color:#ffffff;box-shadow:inset 0 0 calc(var(--s)*.25) #ffffff,inset 0 0 0 calc(var(--s)*.035) #0284c7}",
      "#quiz-arena-root[data-as-dice='crystal'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#38bdf8,#0369a1 72%);box-shadow:0 0 5px rgba(56,189,248,.65)}",
      "#quiz-arena-root[data-as-dice='wood'] .lx-f{background:linear-gradient(145deg,#b45309,#78350f 55%,#451a03);border-color:#f59e0b;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(254,243,199,.22),inset 0 0 0 calc(var(--s)*.035) #f59e0b}",
      "#quiz-arena-root[data-as-dice='wood'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#fef3c7 65%,#d97706);box-shadow:inset 0 -1px 2px rgba(0,0,0,.4)}"
    ];
    var st = document.createElement("style"); st.id = "as-style"; st.textContent = c.join("\n");
    document.head.appendChild(st);
  }

  /* ---------- Studio HTML & Interactive Sync ---------- */
  function seg(p, k, label) { return '<button type="button" data-as="set" data-p="' + p + '" data-k="' + k + '">' + label + '</button>'; }

  function studioHTML() {
    var h = '<button type="button" id="ag-cz-h" class="ag-cz-h" data-as="open" aria-expanded="false" aria-controls="ag-cz-b">' +
      '<span class="ag-cz-ic">' + ico("sparkles") + '</span>' +
      '<span class="min-w-0 flex-1"><span class="ag-cz-t">Arena Studio<span class="as-badge">PRO</span></span><span id="ag-cz-sum" class="ag-cz-s truncate"></span></span>' +
      ico("chevron-down", "ag-chev") + '</button>' +
      '<div class="ag-cz-b" id="ag-cz-b"><div class="ag-cz-in"><div class="ag-cz-pad">';

    h += '<div class="as-pv"><canvas id="as-live-cv" class="as-pv-cv"></canvas>' +
      '<div class="as-pv-bar"><span id="as-pv-tag" class="as-pv-tag"></span><span id="as-pv-dots" class="as-pv-dots"></span>' +
      '<button type="button" class="as-rand" data-as="rand">' + ico("shuffle") + 'Mix</button></div></div>';

    h += '<div class="as-tabs">' + CZ_TABS.map(function (t) {
      return '<button type="button" class="as-tb" data-as="cztab" data-k="' + t[0] + '">' + ico(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join("") + '</div>';

    h += '<div class="as-pane" data-asp="presets"><div class="ag-lbl" style="margin-top:.1rem">13 one-tap themes</div><div class="as-presets">' +
      PRESETS.map(function (pr) {
        return '<button type="button" class="as-pr" data-as="preset" data-k="' + pr.id + '" style="background:' + pr.grad + '">' +
          '<span class="as-pr-e">' + pr.emoji + '</span><span class="as-pr-n">' + pr.name + '</span><span class="as-pr-s">' + pr.sub + '</span></button>';
      }).join("") + '</div></div>';

    h += '<div class="as-pane ag-off" data-asp="board"><div class="ag-lbl" style="margin-top:.1rem">Board finish</div><div class="ag-seg">' +
      STYLES.map(function (s) { return seg("style", s[0], s[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">11 textured boards</div><div class="as-boards">' + BOARD_IDS.map(function (id) {
        var nm = id === "auto" ? "Auto" : BOARDS[id].name;
        return '<button type="button" data-as="set" data-p="board" data-k="' + id + '"><span class="ag-sw as-sw" data-k="' + id + '"></span><span class="ag-bn">' + nm + '</span></button>';
      }).join("") + '</div></div>';

    h += '<div class="as-pane ag-off" data-asp="pieces"><div class="ag-lbl" style="margin-top:.1rem">8 bespoke 3D pieces</div><div class="as-pieces">' +
      PIECES.map(function (p) {
        return '<button type="button" data-as="set" data-p="piece" data-k="' + p[0] + '"><span class="ag-pc"><canvas class="as-thumb" data-k="' + p[0] + '"></canvas></span><span class="ag-bn">' + p[1] + '</span></button>';
      }).join("") + '</div><div class="ag-lbl">Team color palette</div><div class="as-pals">' + PALETTE_IDS.map(function (id) {
        var pl = PALETTES[id];
        return '<button type="button" class="as-pal" data-as="set" data-p="palette" data-k="' + id + '">' +
          '<span class="as-pal-d">' + pl.colors.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + '</span>' +
          '<span class="ag-bn">' + pl.name + '</span></button>';
      }).join("") + '</div></div>';

    h += '<div class="as-pane ag-off" data-asp="fx"><div class="ag-lbl" style="margin-top:.1rem">3D dice skin</div><div class="as-dices">' +
      DICE_SKINS.map(function (d) {
        return '<button type="button" class="as-dskin" data-as="set" data-p="dice" data-k="' + d[0] + '">' +
          '<span class="as-dchip" style="background:linear-gradient(135deg,' + d[2] + ',' + d[3] + ');color:' + d[4] + ';border-color:' + d[4] + '">⚄</span>' +
          '<span class="ag-bn">' + d[1] + '</span></button>';
      }).join("") + '</div><div class="ag-lbl">Hop trail FX</div><div class="ag-seg">' +
      TRAILS.map(function (t) { return seg("trail", t[0], t[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">Ludo center emblem</div><div class="ag-seg">' +
      CENTERS.map(function (c) { return seg("center", c[0], c[1]); }).join("") + '</div></div>';

    h += '<div class="as-pane ag-off" data-asp="ctrl"><div class="ag-two"><div><div class="ag-lbl" style="margin-top:.1rem">Speed</div><div class="ag-seg">' +
      seg("speed", "1", "1×") + seg("speed", "1.5", "1.5×") + seg("speed", "2", "2×") + '</div></div>' +
      '<div><div class="ag-lbl" style="margin-top:.1rem">Sound</div><div id="ag-snd" class="ag-seg">' +
      '<button type="button" data-as="snd" data-m="0" class="ag-snd-on">' + ico("volume-2") + 'On</button>' +
      '<button type="button" data-as="snd" data-m="1" class="ag-snd-off">' + ico("volume-x") + 'Mute</button></div></div></div>' +
      '<div class="ag-lbl">Haptic buzz</div><div class="ag-seg">' + seg("haptic", "true", "On") + seg("haptic", "false", "Off") + '</div>' +
      '<button type="button" class="ag-reset" data-as="reset">' + ico("rotate-ccw") + 'Reset Studio</button></div>';

    h += '</div></div></div>';
    return h;
  }

  function matchPreset() {
    for (var i = 0; i < PRESETS.length; i++) {
      var st = PRESETS[i].set, ok = true, k;
      for (k in st) if (S[k] !== st[k]) { ok = false; break; }
      if (ok) return PRESETS[i].id;
    }
    return "";
  }

  function syncStudio() {
    if (!root) return;
    var cz = root.querySelector("#ag-cz"); if (!cz) return;
    var b = getBoard(), pal = getPalette(), ap = matchPreset();
    cz.classList.toggle("open", !!S.open);
    var hdr = cz.querySelector("#ag-cz-h"); if (hdr) hdr.setAttribute("aria-expanded", S.open ? "true" : "false");
    var sum = cz.querySelector("#ag-cz-sum"); if (sum) sum.textContent = (S.board === "auto" ? "Auto" : b.name) + " · " + nameOf(PIECES, S.piece) + " · " + nameOf(DICE_SKINS, S.dice);
    var snd = cz.querySelector("#ag-snd"); if (snd) snd.classList.toggle("ag-muted", !!S.mute);

    cz.querySelectorAll("[data-as='cztab']").forEach(function (el) { el.classList.toggle("on", el.getAttribute("data-k") === S.czTab); });
    cz.querySelectorAll(".as-pane").forEach(function (el) { el.classList.toggle("ag-off", el.getAttribute("data-asp") !== S.czTab); });
    cz.querySelectorAll("[data-as='preset']").forEach(function (el) { el.classList.toggle("on", el.getAttribute("data-k") === ap); });
    cz.querySelectorAll("[data-as='set']").forEach(function (el) {
      el.classList.toggle("on", String(S[el.getAttribute("data-p")]) === el.getAttribute("data-k"));
    });
    cz.querySelectorAll(".as-sw").forEach(function (el) {
      var t = getBoard(el.getAttribute("data-k"));
      el.style.background = "linear-gradient(135deg," + t.base + "," + t.base2 + ")";
      el.style.borderColor = t.accent;
    });
    cz.querySelectorAll(".ag-pc").forEach(function (el) { el.style.background = "linear-gradient(135deg," + b.base + "," + b.base2 + ")"; });
    var tag = cz.querySelector("#as-pv-tag"); if (tag) tag.textContent = (S.board === "auto" ? "Auto" : b.name) + " · " + nameOf(PIECES, S.piece);
    var dots = cz.querySelector("#as-pv-dots"); if (dots) dots.innerHTML = pal.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("");

    if (S.open && api.getTab() !== "quiz") startPreview(); else stopPreview();
  }

  function drawThumbs() {
    if (!root) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5), pal = getPalette();
    root.querySelectorAll(".as-thumb").forEach(function (cv, idx) {
      var s = 46, c = cv.getContext && cv.getContext("2d"); if (!c) return;
      if (cv.width !== s * dpr) { cv.width = s * dpr; cv.height = s * dpr; cv.style.width = s + "px"; cv.style.height = s + "px"; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, s, s);
      drawToken(c, s / 2, s / 2 + 1, 16, pal[idx % 4], cv.getAttribute("data-k"), S.style, 0);
    });
  }

  /* ---------- Live Animated Studio Preview ---------- */
  function stopPreview() { if (pvRaf) { window.cancelAnimationFrame(pvRaf); pvRaf = 0; } }
  function startPreview() { if (!pvRaf && root) { pvT0 = performance.now(); pvRaf = window.requestAnimationFrame(drawPreview); } }
  function drawPreview(now) {
    pvRaf = 0;
    if (!root || !S.open || api.getTab() === "quiz") return;
    var cv = root.querySelector("#as-live-cv"); if (!cv) return;
    var w = Math.floor(cv.clientWidth), h = Math.floor(cv.clientHeight);
    if (w < 40 || h < 40) { pvRaf = window.requestAnimationFrame(drawPreview); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var c = cv.getContext("2d"); if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);

    var b = getBoard(), pal = getPalette(), t = (now - pvT0) * 0.001 * S.speed;
    paintBoardBg(c, 0, 0, w, h, 14);

    var cols = 7, cw = Math.min((w - 92) / cols, h * 0.36), ox = 12, oy = (h - cw * 2) / 2, i, j;
    for (i = 0; i < cols; i++) {
      for (j = 0; j < 2; j++) {
        rr(c, ox + i * cw + 2, oy + j * cw + 2, cw - 4, cw - 4, 6);
        c.fillStyle = (j === 1 && i > 0 && i < 6) ? alpha(pal[0], b.modern ? 0.55 : 0.78) : (b.modern ? alpha(b.cellA, 0.92) : b.track);
        c.fill(); c.strokeStyle = alpha(b.line, 0.5); c.lineWidth = 1; c.stroke();
      }
    }
    for (i = 1; i < 4; i++) drawToken(c, ox + (i * 2 - 0.5) * cw, oy + 1.48 * cw, cw * 0.38, pal[i], S.piece, S.style, 0);

    var prog = (t * 0.95) % 5, segI = Math.floor(prog), frac = prog - segI;
    var hopX = ox + (0.5 + segI + frac) * cw, hopY = oy + 0.5 * cw, lift = Math.sin(frac * Math.PI) * (cw * 0.42);
    if (segI !== pvLastHop && S.trail !== "none") {
      pvLastHop = segI;
      for (i = 0; i < 6; i++) {
        var ang = Math.random() * TAU, sp = 0.6 + Math.random() * 1.4;
        var sc = S.trail === "fire" ? (i % 2 ? "#f97316" : "#fde047") : S.trail === "rainbow" ? pal[i % 4] : S.trail === "star" ? "#fde047" : pal[0];
        pvSparks.push({ x: ox + (0.5 + segI) * cw, y: hopY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col: sc });
      }
    }
    if (S.trail !== "none" && Math.random() < 0.55) {
      var tc = S.trail === "fire" ? "#fb923c" : S.trail === "rainbow" ? "hsl(" + Math.round((t * 220) % 360) + ",95%,62%)" : S.trail === "star" ? "#fde047" : pal[0];
      pvSparks.push({ x: hopX, y: hopY - lift * 0.5, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, life: 0.75, col: tc });
    }
    for (i = pvSparks.length - 1; i >= 0; i--) {
      var spk = pvSparks[i]; spk.x += spk.vx; spk.y += spk.vy; spk.life -= 0.045;
      if (spk.life <= 0) { pvSparks.splice(i, 1); continue; }
      c.save(); c.globalAlpha = Math.max(0, spk.life); c.fillStyle = spk.col;
      c.beginPath(); c.arc(spk.x, spk.y, 2.5 * spk.life + 0.8, 0, TAU); c.fill(); c.restore();
    }
    drawToken(c, hopX, hopY - cw * 0.08, cw * 0.42, pal[0], S.piece, S.style, lift);

    var ds = DICE_SKINS[0];
    for (i = 0; i < DICE_SKINS.length; i++) if (DICE_SKINS[i][0] === S.dice) ds = DICE_SKINS[i];
    var dx = w - 64, dy = h / 2 - 25, dsz = 50;
    c.save(); c.translate(dx + dsz / 2, dy + dsz / 2); c.rotate(Math.sin(t * 2.2) * 0.14);
    rr(c, -dsz / 2, -dsz / 2, dsz, dsz, 12);
    var dg = c.createLinearGradient(-dsz / 2, -dsz / 2, dsz / 2, dsz / 2);
    dg.addColorStop(0, ds[2]); dg.addColorStop(1, ds[3]);
    c.fillStyle = dg; if (S.dice === "neon") { c.shadowColor = ds[4]; c.shadowBlur = 12; }
    c.fill(); c.shadowBlur = 0;
    c.strokeStyle = S.dice === "ivory" ? pal[0] : ds[4]; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = S.dice === "ivory" ? pal[0] : ds[4];
    var dp = [[-11, -11], [11, -11], [0, 0], [-11, 11], [11, 11]];
    for (i = 0; i < dp.length; i++) { c.beginPath(); c.arc(dp[i][0], dp[i][1], 4, 0, TAU); c.fill(); }
    c.restore();

    pvRaf = window.requestAnimationFrame(drawPreview);
  }

  /* ---------- Mid-Game Quick Studio Button Auto-Injector ---------- */
  function injectMidGameBtn() {
    if (!root) return;
    var ldTop = root.querySelector("#ag-pane-ludo .lx-top");
    if (ldTop && !ldTop.querySelector("[data-as='mid']")) {
      var b1 = document.createElement("button");
      b1.type = "button"; b1.className = "as-midbtn"; b1.setAttribute("data-as", "mid"); b1.title = "Arena Studio";
      b1.innerHTML = ico("sparkles");
      ldTop.insertBefore(b1, ldTop.lastElementChild);
      icons();
    }
    var slTop = root.querySelector("#ag-pane-snakes .bg-box > .ag-glass");
    if (slTop && slTop.querySelector("#sl-msg") && !slTop.querySelector("[data-as='mid']")) {
      var b2 = document.createElement("button");
      b2.type = "button"; b2.className = "as-midbtn"; b2.setAttribute("data-as", "mid"); b2.title = "Arena Studio";
      b2.innerHTML = ico("sparkles");
      slTop.appendChild(b2);
      icons();
    }
  }

  /* ---------- Mount Studio ---------- */
  function mountStudio() {
    if (mounted) return;
    root = document.getElementById("quiz-arena-root");
    var cz = root && root.querySelector("#ag-cz");
    if (!cz) { setTimeout(mountStudio, 60); return; }
    mounted = true;
    injectCss();
    cz.innerHTML = studioHTML();
    icons();

    root.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-as]");
      if (!b || !root.contains(b)) return;
      var a = b.getAttribute("data-as"), k = b.getAttribute("data-k");
      if (a === "open") {
        var w = root.querySelector(".ag-wrap");
        if (w && w.classList.contains("ag-playing")) { toggleInGameStudio(); return; }
        S.open = !S.open; commit("open");
      } else if (a === "mid") {
        toggleInGameStudio();
      } else if (a === "cztab") {
        S.czTab = k; saveStudio(); syncStudio(); api.playSfx("tab");
      } else if (a === "preset") {
        for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === k) {
          var st = PRESETS[i].set, pk; for (pk in st) S[pk] = st[pk];
          commit("all"); api.playSfx("home"); buzz(18); break;
        }
      } else if (a === "rand") {
        var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
        S.style = pick(STYLES)[0]; S.board = pick(BOARD_IDS.slice(1)); S.piece = pick(PIECES)[0];
        S.palette = pick(PALETTE_IDS); S.dice = pick(DICE_SKINS)[0]; S.trail = pick(TRAILS.slice(0, 4))[0]; S.center = pick(CENTERS)[0];
        commit("all"); api.playSfx("home"); buzz(18);
      } else if (a === "set") {
        var p = b.getAttribute("data-p"), v = k === "true" ? true : k === "false" ? false : (p === "speed" ? +k : k);
        S[p] = v; commit(p); api.playSfx("click"); buzz(10);
      } else if (a === "snd") {
        S.mute = b.getAttribute("data-m") === "1"; commit("mute"); api.playSfx("click");
      } else if (a === "reset") {
        var o = S.open, ct = S.czTab; for (var dk in DEFAULTS) S[dk] = DEFAULTS[dk]; S.open = o; S.czTab = ct;
        commit("all"); api.playSfx("click");
      }
    });

    origSubscribe(function (_, key) {
      if (key === "tab" || key === "theme") {
        applyRootAttrs(); syncStudio(); drawThumbs();
      }
    });

    try {
      new MutationObserver(injectMidGameBtn).observe(root, { childList: true, subtree: true });
    } catch (e) { }

    applyRootAttrs(); syncStudio(); drawThumbs(); injectMidGameBtn();
  }

  window.ArenaStudio = { version: "3.0.0", toggle: toggleInGameStudio, getBoard: getBoard, getPalette: getPalette };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountStudio); else mountStudio();
})();

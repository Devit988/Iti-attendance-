/*! ITI CONNECT — Arena Games v3.0 (Arena Studio + Snakes & Ladders + Ludo + Online Rooms)
 *  Load AFTER ./quiz_arena.js. Wraps #quiz-arena-root with a top switcher:
 *    Quiz & Clash (quiz_arena.js, untouched) | Ludo | Snakes & Ladders
 */
(function () {
  "use strict";

  var LS_KEY = "iti_ag_prefs_v2";
  var LS_OLD = "iti_ag_prefs_v1";
  var NAME_KEY = "iti_qa_name_v1";
  var TAU = Math.PI * 2;
  var FB_V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXPIRE_MS = 24 * 3600 * 1000;
  var INVITE_BASE = "https://devit988.github.io/Iti-attendance-/?battle=";

  var TABS = [["quiz", "Quiz & Clash", "swords"], ["ludo", "Ludo", "dices"], ["snakes", "Snakes & Ladders", "route"]];
  var CZ_TABS = [["presets", "Presets", "sparkles"], ["board", "Themes", "layout-grid"], ["pieces", "Pieces", "crown"], ["fx", "Dice & FX", "dices"], ["ctrl", "Controls", "sliders-horizontal"]];
  var STYLES = [["classic", "Classic Tactile"], ["modern", "Modern Glow"]];

  var PIECES = [
    ["pawn", "Royal Pawn"],
    ["crown", "King Crown"],
    ["orb", "Crystal Gem"],
    ["rocket", "Rocket"],
    ["shield", "Knight Crest"],
    ["bolt", "Volt Star"],
    ["hex", "Cyber Core"],
    ["lotus", "Royal Lotus"]
  ];

  var PALETTE_IDS = ["classic", "neon", "pastel", "royal", "sunset"];
  var PALETTES = {
    classic: { name: "Classic", colors: ["#ef4444", "#22c55e", "#facc15", "#38bdf8"] },
    neon:    { name: "Cyber Neon", colors: ["#ff2e93", "#00f59b", "#ffd60a", "#00e5ff"] },
    pastel:  { name: "Candy Pop", colors: ["#fb7185", "#4ade80", "#fde047", "#60a5fa"] },
    royal:   { name: "Royal Gem", colors: ["#dc2626", "#059669", "#f59e0b", "#2563eb"] },
    sunset:  { name: "Sunset", colors: ["#e11d48", "#a855f7", "#f97316", "#06b6d4"] }
  };

  var DICE_SKINS = [
    ["ivory", "Pearl Ivory", "#ffffff", "#dbe4ee", "#0f172a"],
    ["obsidian", "Obsidian Gold", "#0f172a", "#1e293b", "#fbbf24"],
    ["neon", "Cyber Glass", "#130d2e", "#2e1065", "#22d3ee"],
    ["gold", "24K Gold", "#fde68a", "#d97706", "#451a03"],
    ["crystal", "Frost Ice", "#e0f2fe", "#7dd3fc", "#0369a1"],
    ["wood", "Walnut Wood", "#92400e", "#451a03", "#fef3c7"]
  ];

  var TRAILS = [
    ["spark", "Sparks"],
    ["fire", "Blaze"],
    ["star", "Stardust"],
    ["rainbow", "Prism"],
    ["none", "Clean"]
  ];

  var CENTERS = [
    ["jewel", "Prism Jewel"],
    ["crown", "Royal Crown"],
    ["star", "North Star"]
  ];

  var SFX_PACKS = [
    ["arcade", "Arcade"],
    ["soft", "Soft Zen"],
    ["retro", "8-Bit"]
  ];

  var BOARD_IDS = ["auto", "wood", "felt", "cyber", "ocean", "gold", "sakura", "lava", "aurora", "retro"];
  var BOARDS = {
    auto_dark:  { name: "Auto",           base: "#0f172a", base2: "#1e293b", cellA: "#1e293b", cellB: "#172033", track: "#334155", line: "#475569", frame: "#0b1220", text: "#e2e8f0", accent: "#fbbf24", glow: "#fbbf24", dark: true,  tex: "grid" },
    auto_light: { name: "Auto",           base: "#f1f5f9", base2: "#e2e8f0", cellA: "#ffffff", cellB: "#e2e8f0", track: "#ffffff", line: "#94a3b8", frame: "#cbd5e1", text: "#1e293b", accent: "#d97706", glow: "#f59e0b", dark: false, tex: "none" },
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
    { id: "cyber",    name: "Cyber Neon", emoji: "⚡", sub: "Synthwave glow",   grad: "linear-gradient(135deg,#0b0220,#6d28d9,#06b6d4)", set: { style: "modern",  board: "cyber",  piece: "hex",    palette: "neon",    dice: "neon",     trail: "rainbow", center: "jewel", sfx: "retro"  } },
    { id: "maharaja", name: "Maharaja",   emoji: "👑", sub: "Royal purple & gold", grad: "linear-gradient(135deg,#2b123f,#b45309,#fbbf24)", set: { style: "classic", board: "gold",   piece: "crown",  palette: "royal",   dice: "gold",     trail: "star",    center: "crown", sfx: "soft"   } },
    { id: "sakura",   name: "Sakura Zen", emoji: "🌸", sub: "Blossom & pearl",  grad: "linear-gradient(135deg,#831843,#ec4899,#fbcfe8)", set: { style: "modern",  board: "sakura", piece: "lotus",  palette: "pastel",  dice: "crystal",  trail: "star",    center: "star",  sfx: "soft"   } },
    { id: "volcano",  name: "Lava Forge", emoji: "🔥", sub: "Obsidian & flame", grad: "linear-gradient(135deg,#1c0a0a,#dc2626,#f97316)", set: { style: "modern",  board: "lava",   piece: "rocket", palette: "sunset",  dice: "obsidian", trail: "fire",    center: "jewel", sfx: "arcade" } },
    { id: "aurora",   name: "Aurora Sky", emoji: "🌌", sub: "Northern lights",  grad: "linear-gradient(135deg,#051923,#0d9488,#7c3aed)", set: { style: "modern",  board: "aurora", piece: "orb",    palette: "neon",    dice: "crystal",  trail: "rainbow", center: "jewel", sfx: "soft"   } },
    { id: "heritage", name: "Royal Wood", emoji: "🪵", sub: "Carved classic",   grad: "linear-gradient(135deg,#3b2210,#78350f,#d97706)", set: { style: "classic", board: "wood",   piece: "pawn",   palette: "classic", dice: "wood",     trail: "spark",   center: "crown", sfx: "arcade" } }
  ];

  var DEFAULTS = {
    tab: "quiz", open: false, czTab: "presets",
    style: "modern", board: "auto", piece: "pawn", palette: "classic",
    dice: "ivory", trail: "spark", center: "jewel",
    speed: 1, mute: false, sfx: "arcade", haptic: true, autoMove: true, hints: true
  };

  var P = loadPrefs();
  var root = null, subs = [], GAMES = {}, mounted = {}, lastBright = null, resizeT = 0;
  var FBP = null, pendingInvite = null;
  var pvRaf = 0, pvSparks = [], pvT0 = 0, pvLastHop = -1;

  /* ---------- small helpers ---------- */
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bright() { return document.documentElement.classList.contains("bright-mode"); }
  function has(list, id) { for (var i = 0; i < list.length; i++) if ((list[i][0] || list[i]) === id) return true; return false; }
  function nameOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1]; return ""; }
  function icons() { try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) { } }
  function ico(n, c) { return '<i data-lucide="' + n + '" class="ag-i ' + (c || "") + '"></i>'; }
  function q(sel, el) { return (el || root).querySelector(sel); }
  function qa(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function savedName() { return (ls(NAME_KEY) || "").trim().slice(0, 14) || "Player"; }
  function saveName(n) { var v = String(n || "").trim().slice(0, 14); if (v) lsSet(NAME_KEY, v); }
  function vibrate(pat) { if (!P.haptic) return; try { if (navigator.vibrate) navigator.vibrate(pat); } catch (e) { } }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      try {
        var a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select();
        var r = document.execCommand("copy"); a.remove(); r ? ok() : no();
      } catch (e) { no(e); }
    });
  }

  function loadDefaults() { var p = {}, k; for (k in DEFAULTS) p[k] = DEFAULTS[k]; return p; }
  function loadPrefs() {
    var p = loadDefaults(), s = null;
    try { s = JSON.parse(ls(LS_KEY) || ls(LS_OLD) || "null"); } catch (e) { s = null; }
    if (s && typeof s === "object") {
      if (has(TABS, s.tab)) p.tab = s.tab;
      if (typeof s.open === "boolean") p.open = s.open;
      if (has(CZ_TABS, s.czTab)) p.czTab = s.czTab;
      if (has(STYLES, s.style)) p.style = s.style;
      if (BOARD_IDS.indexOf(s.board) >= 0) p.board = s.board;
      if (has(PIECES, s.piece)) p.piece = s.piece;
      if (PALETTE_IDS.indexOf(s.palette) >= 0) p.palette = s.palette;
      if (has(DICE_SKINS, s.dice)) p.dice = s.dice;
      if (has(TRAILS, s.trail)) p.trail = s.trail;
      if (has(CENTERS, s.center)) p.center = s.center;
      if (has(SFX_PACKS, s.sfx)) p.sfx = s.sfx;
      if (s.speed === 1 || s.speed === 1.5 || s.speed === 2) p.speed = s.speed;
      if (typeof s.mute === "boolean") p.mute = s.mute;
      if (typeof s.haptic === "boolean") p.haptic = s.haptic;
      if (typeof s.autoMove === "boolean") p.autoMove = s.autoMove;
      if (typeof s.hints === "boolean") p.hints = s.hints;
    }
    return p;
  }
  function savePrefs() { lsSet(LS_KEY, JSON.stringify(P)); }
  function copyPrefs() { var o = {}, k; for (k in P) o[k] = P[k]; return o; }

  /* ---------- Firebase helper (shared with quiz_arena.js) ---------- */
  function loadFb() {
    if (FBP) return FBP;
    FBP = Promise.all([
      import(FB_V + "firebase-app.js"),
      import(FB_V + "firebase-firestore.js"),
      import(FB_V + "firebase-auth.js")
    ]).then(function (m) {
      var A = m[0], F = m[1], U = m[2], app;
      if (A.getApps().length) app = A.getApps()[0];
      else {
        var c = typeof window.getActiveFirebaseConfig === "function" ? window.getActiveFirebaseConfig() : null;
        if (!c || !c.projectId) throw { code: "no-config" };
        app = A.initializeApp(c);
      }
      var auth = U.getAuth(app), db = F.getFirestore(app);
      return (auth.authStateReady ? auth.authStateReady() : Promise.resolve()).then(function () {
        return auth.currentUser || U.signInAnonymously(auth).then(function (cr) { return cr.user; });
      }).then(function (user) { return { F: F, db: db, uid: user.uid }; });
    }).catch(function (e) { FBP = null; throw e; });
    return FBP;
  }
  function fbErr(e) {
    var c = (e && e.code) || "";
    if (c === "nf") return "Room not found. Check the 4-digit code.";
    if (c === "wrong-game") return "That room is for a different game.";
    if (c === "started") return "That match has already started.";
    if (c === "full") return "That room is already full.";
    if (c === "no-code") return "Couldn't generate a free room code. Try again.";
    if (c === "permission-denied") return "Room unavailable or expired.";
    return "Connection error. Check your internet.";
  }

  /* ---------- colour helpers ---------- */
  function parseColor(c) {
    var m;
    if (typeof c !== "string") return null;
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) return [parseInt(m[1].charAt(0) + m[1].charAt(0), 16), parseInt(m[1].charAt(1) + m[1].charAt(1), 16), parseInt(m[1].charAt(2) + m[1].charAt(2), 16)];
    if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return [parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16)];
    if ((m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c))) return [+m[1], +m[2], +m[3]];
    return null;
  }
  function shade(c, p) {
    var rgb = parseColor(c); if (!rgb) return c;
    var t = p < 0 ? 0 : 255, a = Math.abs(p);
    return "rgb(" + Math.round(rgb[0] + (t - rgb[0]) * a) + "," + Math.round(rgb[1] + (t - rgb[1]) * a) + "," + Math.round(rgb[2] + (t - rgb[2]) * a) + ")";
  }
  function alpha(c, a) {
    var rgb = parseColor(c); if (!rgb) return c;
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
  }

  /* ---------- board themes & palettes ---------- */
  function getBoard(id) {
    id = id || P.board;
    var t = id === "auto" ? (bright() ? BOARDS.auto_light : BOARDS.auto_dark) : (BOARDS[id] || BOARDS.auto_dark), o = { id: id }, k;
    for (k in t) o[k] = t[k];
    if (id === "auto") o.name = "Auto";
    o.modern = P.style === "modern";
    return o;
  }
  function getPalette(id) {
    var p = PALETTES[id || P.palette] || PALETTES.classic;
    return p.colors.slice();
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function paintBoardBg(ctx, x, y, w, h, radius, boardId) {
    if (!ctx) return;
    var b = getBoard(boardId), r = radius == null ? Math.min(w, h) * 0.04 : radius, g, i, j, n, st;
    ctx.save();
    rr(ctx, x, y, w, h, r);
    g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, b.base); g.addColorStop(1, b.base2);
    ctx.fillStyle = g; ctx.fill(); ctx.clip();

    // Procedural theme textures
    if (b.tex === "wood") {
      ctx.strokeStyle = "rgba(40,20,5,0.16)"; ctx.lineWidth = Math.max(1, w * 0.004);
      for (i = 0; i < 18; i++) {
        var yy = y + (i / 18) * h;
        ctx.beginPath(); ctx.moveTo(x, yy);
        ctx.bezierCurveTo(x + w * 0.33, yy + Math.sin(i * 1.4) * h * 0.025, x + w * 0.66, yy - Math.cos(i) * h * 0.025, x + w, yy + Math.sin(i) * h * 0.015);
        ctx.stroke();
      }
    } else if (b.tex === "felt") {
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      for (i = 0; i < w + h; i += Math.max(8, w * 0.03)) {
        ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x, y + i); ctx.stroke();
      }
      ctx.strokeStyle = alpha(b.accent, 0.45); ctx.lineWidth = Math.max(1.5, w * 0.004); ctx.setLineDash([6, 5]);
      rr(ctx, x + w * 0.02, y + h * 0.02, w * 0.96, h * 0.96, r * 0.8); ctx.stroke(); ctx.setLineDash([]);
    } else if (b.tex === "waves") {
      ctx.strokeStyle = alpha(b.glow, 0.14); ctx.lineWidth = Math.max(1.2, w * 0.004);
      for (i = 1; i < 9; i++) {
        var wy = y + (i / 9) * h;
        ctx.beginPath();
        for (j = 0; j <= 16; j++) {
          var wx = x + (j / 16) * w, offY = Math.sin(j * 0.9 + i) * h * 0.018;
          if (j) ctx.lineTo(wx, wy + offY); else ctx.moveTo(wx, wy + offY);
        }
        ctx.stroke();
      }
    } else if (b.tex === "filigree") {
      ctx.strokeStyle = alpha(b.accent, 0.24); ctx.lineWidth = Math.max(1.2, w * 0.004);
      rr(ctx, x + w * 0.025, y + h * 0.025, w * 0.95, h * 0.95, r * 0.75); ctx.stroke();
      var corners = [[x + w * 0.05, y + h * 0.05], [x + w * 0.95, y + h * 0.05], [x + w * 0.05, y + h * 0.95], [x + w * 0.95, y + h * 0.95]];
      for (i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(corners[i][0], corners[i][1], w * 0.06, 0, TAU); ctx.stroke();
      }
    } else if (b.tex === "sakura") {
      var pts = [[0.14, 0.18], [0.84, 0.14], [0.22, 0.82], [0.86, 0.78], [0.5, 0.12], [0.5, 0.88]];
      ctx.fillStyle = "rgba(244,114,182,0.22)";
      for (i = 0; i < pts.length; i++) {
        ctx.save(); ctx.translate(x + pts[i][0] * w, y + pts[i][1] * h); ctx.rotate(i * 1.1);
        for (j = 0; j < 5; j++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -w * 0.024, w * 0.011, w * 0.02, 0, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    } else if (b.tex === "lava") {
      g = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, w * 0.05, x + w * 0.5, y + h * 0.5, w * 0.75);
      g.addColorStop(0, "rgba(249,115,22,0.28)"); g.addColorStop(0.55, "rgba(220,38,38,0.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(251,146,60,0.25)"; ctx.lineWidth = Math.max(1.5, w * 0.005);
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.25); ctx.lineTo(x + w * 0.3, y + h * 0.42); ctx.lineTo(x + w * 0.65, y + h * 0.34); ctx.lineTo(x + w, y + h * 0.62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h); ctx.lineTo(x + w * 0.48, y + h * 0.68); ctx.lineTo(x + w * 0.82, y + h * 0.8); ctx.stroke();
    } else if (b.tex === "aurora") {
      var a1 = ctx.createRadialGradient(x + w * 0.2, y + h * 0.2, 0, x + w * 0.2, y + h * 0.2, w * 0.7);
      a1.addColorStop(0, "rgba(45,212,191,0.28)"); a1.addColorStop(1, "rgba(45,212,191,0)");
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
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.26)");
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

  /* ---------- unified 8-piece 3D/glossy token painter (used by Ludo, Snakes & Studio) ---------- */
  function drawToken(ctx, x, y, r, color, shape, style, lift) {
    if (!ctx) return;
    r = r > 0 ? r : 12; color = color || "#38bdf8"; lift = lift || 0;
    if (!has(PIECES, shape)) shape = P.piece;
    var modern = (style === "classic" || style === "modern" ? style : P.style) === "modern";
    var dk = shade(color, -0.5), md = shade(color, -0.08), lt = shade(color, 0.5), g, i, a;

    ctx.save();
    // dynamic ground shadow
    var shAlpha = Math.max(0.12, (modern ? 0.32 : 0.38) - lift / (r * 5));
    var shScale = Math.max(0.45, 0.74 - lift / (r * 2.6 + 1) * 0.25);
    ctx.fillStyle = "rgba(0,0,0," + shAlpha.toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.66, r * shScale, r * 0.23, 0, 0, TAU); ctx.fill();

    y -= lift;
    ctx.translate(x, y);
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    if (shape === "pawn") {
      // Signature glossy bell-shaped Ludo pawn
      var u = r;
      function pawnBody() {
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
      pawnBody(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -u * 0.48, u * 0.38, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;

      g = ctx.createLinearGradient(-u * 0.7, 0, u * 0.7, 0);
      g.addColorStop(0, dk); g.addColorStop(0.35, lt); g.addColorStop(0.7, md); g.addColorStop(1, dk);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, u * 0.5, u * 0.7, u * 0.21, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = Math.max(0.8, u * 0.05); ctx.stroke();

      g = ctx.createLinearGradient(-u * 0.58, 0, u * 0.58, 0);
      g.addColorStop(0, dk); g.addColorStop(0.3, lt); g.addColorStop(0.65, md); g.addColorStop(1, dk);
      ctx.fillStyle = g; pawnBody(); ctx.fill(); ctx.stroke();

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

    ctx.scale(r, r);
    // Helper for crisp white outer halo + glow
    function haloAndFill(pathFn, fillStyle) {
      pathFn();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 0.18;
      if (modern) { ctx.shadowColor = alpha(color, 0.9); ctx.shadowBlur = r * 0.7; }
      ctx.stroke();
      ctx.restore();
      pathFn();
      ctx.fillStyle = fillStyle; ctx.fill();
      ctx.strokeStyle = modern ? "rgba(255,255,255,.65)" : dk; ctx.lineWidth = 0.06; ctx.stroke();
    }

    if (shape === "crown") {
      g = ctx.createLinearGradient(-0.75, -0.7, 0.75, 0.65);
      g.addColorStop(0, lt); g.addColorStop(0.45, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        ctx.moveTo(-0.68, 0.48); ctx.lineTo(-0.78, -0.32); ctx.lineTo(-0.34, 0.04);
        ctx.lineTo(0, -0.64); ctx.lineTo(0.34, 0.04); ctx.lineTo(0.78, -0.32);
        ctx.lineTo(0.68, 0.48); ctx.closePath();
      }, g);
      // gold crown band + jewels
      ctx.fillStyle = "#fde047"; ctx.fillRect(-0.64, 0.3, 1.28, 0.22);
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 0.05; ctx.strokeRect(-0.64, 0.3, 1.28, 0.22);
      var tips = [[-0.78, -0.36], [0, -0.68], [0.78, -0.36]];
      for (i = 0; i < 3; i++) {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tips[i][0], tips[i][1], 0.11, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.arc(0, 0.41, 0.08, 0, TAU); ctx.arc(-0.36, 0.41, 0.06, 0, TAU); ctx.arc(0.36, 0.41, 0.06, 0, TAU); ctx.fill();

    } else if (shape === "orb") {
      // Faceted crystal diamond gem
      g = ctx.createRadialGradient(-0.25, -0.3, 0.06, 0, 0, 0.9);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.28, lt); g.addColorStop(0.62, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        for (i = 0; i < 8; i++) {
          a = -Math.PI / 2 + i * TAU / 8;
          if (i) ctx.lineTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78); else ctx.moveTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78);
        }
        ctx.closePath();
      }, g);
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (i = 0; i < 8; i++) {
        a = -Math.PI / 2 + i * TAU / 8;
        if (i) ctx.lineTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44); else ctx.moveTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44);
      }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.ellipse(-0.24, -0.26, 0.16, 0.09, -0.7, 0, TAU); ctx.fill();

    } else if (shape === "rocket") {
      // Sleek finned space rocket
      g = ctx.createLinearGradient(-0.5, -0.8, 0.5, 0.5);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        ctx.moveTo(0, -0.86);
        ctx.bezierCurveTo(0.45, -0.45, 0.42, 0.1, 0.34, 0.42);
        ctx.lineTo(0.68, 0.62); ctx.lineTo(0.28, 0.58);
        ctx.lineTo(0, 0.48); ctx.lineTo(-0.28, 0.58);
        ctx.lineTo(-0.68, 0.62); ctx.lineTo(-0.34, 0.42);
        ctx.bezierCurveTo(-0.42, 0.1, -0.45, -0.45, 0, -0.86);
        ctx.closePath();
      }, g);
      // glowing exhaust
      ctx.fillStyle = "#fde047";
      ctx.beginPath(); ctx.moveTo(-0.18, 0.5); ctx.lineTo(0, 0.82); ctx.lineTo(0.18, 0.5); ctx.closePath(); ctx.fill();
      // cockpit porthole
      ctx.fillStyle = "#e0f2fe"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.07;
      ctx.beginPath(); ctx.arc(0, -0.14, 0.2, 0, TAU); ctx.fill(); ctx.stroke();

    } else if (shape === "shield") {
      // Knight's heraldic shield
      g = ctx.createLinearGradient(-0.6, -0.75, 0.6, 0.85);
      g.addColorStop(0, lt); g.addColorStop(0.45, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        ctx.moveTo(0, -0.8); ctx.lineTo(0.68, -0.56); ctx.lineTo(0.62, 0.08);
        ctx.bezierCurveTo(0.56, 0.52, 0.22, 0.74, 0, 0.86);
        ctx.bezierCurveTo(-0.22, 0.74, -0.56, 0.52, -0.62, 0.08);
        ctx.lineTo(-0.68, -0.56); ctx.closePath();
      }, g);
      // inner chevron crest
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.moveTo(0, -0.42); ctx.lineTo(0.32, 0.02); ctx.lineTo(0, 0.44); ctx.lineTo(-0.32, 0.02); ctx.closePath(); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0.02, 0.12, 0, TAU); ctx.fill();

    } else if (shape === "bolt") {
      // Electric star + lightning emblem
      g = ctx.createLinearGradient(-0.6, -0.8, 0.6, 0.8);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        for (i = 0; i < 10; i++) {
          a = -Math.PI / 2 + i * Math.PI / 5; var rad = i % 2 ? 0.44 : 0.88;
          if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
      }, g);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(0.1, -0.38); ctx.lineTo(-0.22, 0.05); ctx.lineTo(-0.02, 0.05);
      ctx.lineTo(-0.1, 0.42); ctx.lineTo(0.22, -0.04); ctx.lineTo(0.02, -0.04); ctx.closePath(); ctx.fill();

    } else if (shape === "hex") {
      // Futuristic Cyber Core
      g = ctx.createLinearGradient(-0.7, -0.7, 0.7, 0.7);
      g.addColorStop(0, lt); g.addColorStop(0.5, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        for (i = 0; i < 6; i++) {
          a = -Math.PI / 6 + i * TAU / 6;
          if (i) ctx.lineTo(Math.cos(a) * 0.82, Math.sin(a) * 0.82); else ctx.moveTo(Math.cos(a) * 0.82, Math.sin(a) * 0.82);
        }
        ctx.closePath();
      }, g);
      ctx.fillStyle = "#0b1020"; ctx.beginPath(); ctx.arc(0, 0, 0.42, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.07; ctx.stroke();
      ctx.fillStyle = lt; ctx.beginPath(); ctx.arc(0, 0, 0.22, 0, TAU); ctx.fill();

    } else {
      // Royal Lotus
      g = ctx.createLinearGradient(0, -0.8, 0, 0.65);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, lt); g.addColorStop(0.75, color); g.addColorStop(1, dk);
      haloAndFill(function () {
        ctx.beginPath();
        ctx.moveTo(0, -0.82);
        ctx.bezierCurveTo(0.35, -0.4, 0.35, 0.1, 0.25, 0.36);
        ctx.bezierCurveTo(0.55, 0.05, 0.85, -0.1, 0.78, 0.32);
        ctx.bezierCurveTo(0.68, 0.62, 0.3, 0.68, 0, 0.62);
        ctx.bezierCurveTo(-0.3, 0.68, -0.68, 0.62, -0.78, 0.32);
        ctx.bezierCurveTo(-0.85, -0.1, -0.55, 0.05, -0.25, 0.36);
        ctx.bezierCurveTo(-0.35, 0.1, -0.35, -0.4, 0, -0.82);
        ctx.closePath();
      }, g);
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(0, 0.22, 0.15, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function diceSVG(val) {
    var pips = {
      1: [[50, 50]],
      2: [[28, 28], [72, 72]],
      3: [[26, 26], [50, 50], [74, 74]],
      4: [[28, 28], [72, 28], [28, 72], [72, 72]],
      5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
      6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]]
    }[val || 1] || [[50, 50]];
    return '<svg viewBox="0 0 100 100" width="38" height="38" aria-hidden="true">' +
      pips.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="10" fill="currentColor"/>'; }).join("") +
      "</svg>";
  }

  /* ---------- sound (AudioContext synth with 3 sound packs) ---------- */
  var AC = null, MASTER = null;
  function audio() {
    if (AC) return AC;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { AC = new C(); MASTER = AC.createGain(); MASTER.gain.value = 0.5; MASTER.connect(AC.destination); } catch (e) { AC = null; }
    return AC;
  }
  function unlockAudio() { var a = audio(); if (a && a.state === "suspended" && a.resume) { try { a.resume(); } catch (e) { } } }
  function tone(f, ms, type, vol, delay, to) {
    var a = audio(); if (!a) return;
    var k = 1 / P.speed, t = a.currentTime + ((delay || 0) * k) / 1000, d = (ms * k) / 1000;
    var o = a.createOscillator(), g = a.createGain();
    var wv = type || "sine";
    if (P.sfx === "soft") wv = "sine";
    else if (P.sfx === "retro") wv = "square";
    o.type = wv; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    var v = (vol || 0.2) * (P.sfx === "soft" ? 0.85 : P.sfx === "retro" ? 0.65 : 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + d + 0.04);
  }
  function playSfx(type) {
    if (P.mute) return false;
    var a = audio(); if (!a) return false;
    unlockAudio();
    try {
      var i;
      switch (type) {
        case "tab": tone(520, 60, "sine", 0.1); break;
        case "preset": tone(523, 80, "triangle", 0.14); tone(659, 80, "triangle", 0.14, 65); tone(880, 140, "triangle", 0.16, 130); break;
        case "dice": for (i = 0; i < 6; i++) tone(300 + Math.random() * 400, 45, "square", 0.05, i * 70); tone(180, 120, "triangle", 0.16, 450); break;
        case "move": tone(440, 70, "triangle", 0.14); tone(560, 70, "triangle", 0.1, 60); break;
        case "capture": tone(320, 220, "sawtooth", 0.12, 0, 90); tone(140, 160, "square", 0.1, 40); break;
        case "home": tone(523, 110, "triangle", 0.16); tone(659, 110, "triangle", 0.16, 100); tone(784, 180, "triangle", 0.18, 200); break;
        case "six": tone(523, 80, "square", 0.08); tone(659, 80, "square", 0.08, 70); tone(784, 80, "square", 0.08, 140); tone(1047, 160, "square", 0.09, 210); break;
        case "win": tone(523, 140, "triangle", 0.18); tone(659, 140, "triangle", 0.18, 130); tone(784, 140, "triangle", 0.18, 260); tone(1047, 380, "triangle", 0.2, 390); tone(784, 380, "sine", 0.1, 390); break;
        case "lose": tone(392, 180, "sawtooth", 0.1); tone(330, 180, "sawtooth", 0.1, 170); tone(262, 320, "sawtooth", 0.1, 340); break;
        case "ladder": tone(300, 320, "sine", 0.16, 0, 900); break;
        case "snake": tone(700, 420, "sawtooth", 0.11, 0, 120); break;
        case "error": tone(160, 130, "sawtooth", 0.12); break;
        default: tone(660, 50, "triangle", 0.12);
      }
    } catch (e) { return false; }
    return true;
  }

  /* ---------- state -> DOM sync & Live Studio Preview ---------- */
  function applyVars() {
    if (!root) return;
    var b = getBoard(), s = root.style;
    s.setProperty("--agb-base", b.base); s.setProperty("--agb-base2", b.base2);
    s.setProperty("--agb-cell-a", b.cellA); s.setProperty("--agb-cell-b", b.cellB);
    s.setProperty("--agb-track", b.track); s.setProperty("--agb-line", b.line);
    s.setProperty("--agb-frame", b.frame); s.setProperty("--agb-text", b.text);
    s.setProperty("--agb-accent", b.accent); s.setProperty("--agb-glow", b.glow);
    s.setProperty("--ag-k", String(1 / P.speed));
    root.setAttribute("data-ag-style", P.style);
    root.setAttribute("data-ag-board", P.board);
    root.setAttribute("data-ag-piece", P.piece);
    root.setAttribute("data-ag-dice", P.dice);
  }

  function matchPreset() {
    for (var i = 0; i < PRESETS.length; i++) {
      var s = PRESETS[i].set, ok = true, k;
      for (k in s) if (P[k] !== s[k]) { ok = false; break; }
      if (ok) return PRESETS[i].id;
    }
    return "";
  }

  function syncUI() {
    if (!root) return;
    var b = getBoard(), pal = getPalette(), activePreset = matchPreset();
    qa("[data-ag='tab']").forEach(function (el) {
      var on = el.getAttribute("data-k") === P.tab;
      el.classList.toggle("on", on); el.setAttribute("aria-selected", on ? "true" : "false");
    });
    qa(".ag-pane").forEach(function (el) { el.classList.toggle("ag-off", el.id !== "ag-pane-" + P.tab); });
    var cz = q("#ag-cz"); if (!cz) return;
    cz.classList.toggle("ag-off", P.tab === "quiz");
    cz.classList.toggle("open", !!P.open);
    q("#ag-cz-h").setAttribute("aria-expanded", P.open ? "true" : "false");
    q("#ag-cz-sum").textContent = (P.board === "auto" ? "Auto" : b.name) + " · " + nameOf(PIECES, P.piece) + " · " + nameOf(DICE_SKINS, P.dice);

    // studio sub-tabs
    qa("[data-ag='cztab']").forEach(function (el) {
      var on = el.getAttribute("data-k") === P.czTab;
      el.classList.toggle("on", on);
    });
    qa(".ag-czp").forEach(function (el) {
      el.classList.toggle("ag-off", el.getAttribute("data-czp") !== P.czTab);
    });

    // presets
    qa("[data-ag='preset']").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-k") === activePreset);
    });

    // all single-pref buttons
    qa("[data-ag='set']").forEach(function (el) {
      var key = el.getAttribute("data-p"), on = String(P[key]) === el.getAttribute("data-k");
      el.classList.toggle("on", on); el.setAttribute("aria-pressed", on ? "true" : "false");
    });

    // swatches & piece card backgrounds
    qa(".ag-sw").forEach(function (el) {
      var t = getBoard(el.getAttribute("data-k"));
      el.style.background = "linear-gradient(135deg," + t.base + "," + t.base2 + ")";
      el.style.borderColor = t.accent;
    });
    qa(".ag-pc").forEach(function (el) {
      el.style.background = "linear-gradient(135deg," + b.base + "," + b.base2 + ")";
    });

    // sound & toggles
    var snd = q("#ag-snd"); if (snd) snd.classList.toggle("ag-muted", !!P.mute);
    var pvBadge = q("#ag-pv-tag");
    if (pvBadge) pvBadge.textContent = (P.board === "auto" ? "Auto" : b.name) + " · " + nameOf(PIECES, P.piece);
    var pvDots = q("#ag-pv-dots");
    if (pvDots) pvDots.innerHTML = pal.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("");

    if (P.open && P.tab !== "quiz") startPreview(); else stopPreview();
  }

  function drawThumbs() {
    if (!root) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5), pal = getPalette();
    qa(".ag-thumb").forEach(function (cv, idx) {
      var s = 46, c = cv.getContext && cv.getContext("2d"); if (!c) return;
      if (cv.width !== s * dpr) { cv.width = s * dpr; cv.height = s * dpr; cv.style.width = s + "px"; cv.style.height = s + "px"; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, s, s);
      drawToken(c, s / 2, s / 2 + 1, 16, pal[idx % 4], cv.getAttribute("data-k"), P.style, 0);
    });
  }

  /* ---------- Live Animated Studio Preview Canvas ---------- */
  function stopPreview() {
    if (pvRaf) { window.cancelAnimationFrame(pvRaf); pvRaf = 0; }
  }
  function startPreview() {
    if (pvRaf || !root) return;
    pvT0 = performance.now();
    pvRaf = window.requestAnimationFrame(drawPreview);
  }
  function drawPreview(now) {
    pvRaf = 0;
    if (!root || !P.open || P.tab === "quiz") return;
    var cv = q("#ag-live-cv"); if (!cv) return;
    var w = Math.floor(cv.clientWidth), h = Math.floor(cv.clientHeight);
    if (w < 40 || h < 40) { pvRaf = window.requestAnimationFrame(drawPreview); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var c = cv.getContext("2d"); if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    var b = getBoard(), pal = getPalette(), t = (now - pvT0) * 0.001 * P.speed;
    paintBoardBg(c, 0, 0, w, h, 14);

    // Draw mini Ludo track strip across the preview
    var cols = 7, cw = Math.min((w - 92) / cols, h * 0.36), ox = 12, oy = (h - cw * 2) / 2;
    var i, j, tx, ty;
    for (i = 0; i < cols; i++) {
      for (j = 0; j < 2; j++) {
        tx = ox + i * cw; ty = oy + j * cw;
        rr(c, tx + 2, ty + 2, cw - 4, cw - 4, 6);
        var isHome = j === 1 && i > 0 && i < 6;
        c.fillStyle = isHome ? alpha(pal[0], b.modern ? 0.55 : 0.75) : (b.modern ? alpha(b.cellA, 0.92) : b.track);
        c.fill();
        c.strokeStyle = alpha(b.line, 0.5); c.lineWidth = 1; c.stroke();
      }
    }
    // Draw 3 static team pieces on bottom/top tiles
    for (i = 1; i < 4; i++) {
      drawToken(c, ox + (i * 2 - 0.5) * cw, oy + 1.48 * cw, cw * 0.38, pal[i], P.piece, P.style, 0);
    }

    // Animated hopping hero piece along top row
    var prog = (t * 0.95) % 5, seg = Math.floor(prog), frac = prog - seg;
    var hopX = ox + (0.5 + seg + frac) * cw;
    var hopY = oy + 0.5 * cw;
    var lift = Math.sin(frac * Math.PI) * (cw * 0.42);
    if (seg !== pvLastHop && P.trail !== "none") {
      pvLastHop = seg;
      for (i = 0; i < 6; i++) {
        var ang = Math.random() * TAU, sp = 0.6 + Math.random() * 1.4;
        var col = P.trail === "fire" ? (i % 2 ? "#f97316" : "#fde047") : (P.trail === "rainbow" ? pal[i % 4] : (P.trail === "star" ? "#fde047" : pal[0]));
        pvSparks.push({ x: ox + (0.5 + seg) * cw, y: hopY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col: col });
      }
    }
    if (P.trail !== "none" && Math.random() < 0.55) {
      var tc = P.trail === "fire" ? "#fb923c" : P.trail === "rainbow" ? "hsl(" + Math.round((t * 220) % 360) + ",95%,62%)" : P.trail === "star" ? "#fde047" : pal[0];
      pvSparks.push({ x: hopX, y: hopY - lift * 0.5, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, life: 0.75, col: tc });
    }
    for (i = pvSparks.length - 1; i >= 0; i--) {
      var spk = pvSparks[i];
      spk.x += spk.vx; spk.y += spk.vy; spk.life -= 0.045;
      if (spk.life <= 0) { pvSparks.splice(i, 1); continue; }
      c.save(); c.globalAlpha = Math.max(0, spk.life); c.fillStyle = spk.col;
      c.beginPath(); c.arc(spk.x, spk.y, 2.5 * spk.life + 0.8, 0, TAU); c.fill(); c.restore();
    }
    // Destination ring hint preview
    if (P.hints) {
      var nextX = ox + (0.5 + ((seg + 1) % 6)) * cw;
      c.save(); c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.setLineDash([4, 3]);
      c.beginPath(); c.arc(nextX, hopY, cw * 0.32, 0, TAU); c.stroke(); c.restore();
    }
    drawToken(c, hopX, hopY - cw * 0.08, cw * 0.42, pal[0], P.piece, P.style, lift);

    // Live Dice Skin badge on right side of preview
    var ds = DICE_SKINS[0];
    for (i = 0; i < DICE_SKINS.length; i++) if (DICE_SKINS[i][0] === P.dice) ds = DICE_SKINS[i];
    var dx = w - 66, dy = h / 2 - 26, dsz = 52;
    c.save();
    c.translate(dx + dsz / 2, dy + dsz / 2);
    c.rotate(Math.sin(t * 2.2) * 0.14);
    rr(c, -dsz / 2, -dsz / 2, dsz, dsz, 12);
    var dg = c.createLinearGradient(-dsz / 2, -dsz / 2, dsz / 2, dsz / 2);
    dg.addColorStop(0, ds[2]); dg.addColorStop(1, ds[3]);
    c.fillStyle = dg;
    if (P.dice === "neon") { c.shadowColor = ds[4]; c.shadowBlur = 12; }
    c.fill(); c.shadowBlur = 0;
    c.strokeStyle = P.dice === "ivory" ? pal[0] : ds[4]; c.lineWidth = 2.2; c.stroke();
    // 5 pips
    c.fillStyle = P.dice === "ivory" ? pal[0] : ds[4];
    var dp = [[-12, -12], [12, -12], [0, 0], [-12, 12], [12, 12]];
    for (i = 0; i < dp.length; i++) { c.beginPath(); c.arc(dp[i][0], dp[i][1], 4.2, 0, TAU); c.fill(); }
    c.restore();

    pvRaf = window.requestAnimationFrame(drawPreview);
  }

  function emit(key) {
    var i, snap = copyPrefs();
    for (i = 0; i < subs.length; i++) { try { subs[i](snap, key); } catch (e) { } }
    try { window.dispatchEvent(new CustomEvent("ag:change", { detail: { key: key, prefs: snap } })); } catch (e) { }
  }
  function commit(key, noSave) {
    if (!noSave) savePrefs();
    applyVars(); syncUI(); drawThumbs(); emit(key);
  }
  function setPref(key, val) {
    if (key === "style" && !has(STYLES, val)) return false;
    if (key === "czTab" && !has(CZ_TABS, val)) return false;
    if (key === "board" && BOARD_IDS.indexOf(val) < 0) return false;
    if (key === "piece" && !has(PIECES, val)) return false;
    if (key === "palette" && PALETTE_IDS.indexOf(val) < 0) return false;
    if (key === "dice" && !has(DICE_SKINS, val)) return false;
    if (key === "trail" && !has(TRAILS, val)) return false;
    if (key === "center" && !has(CENTERS, val)) return false;
    if (key === "sfx" && !has(SFX_PACKS, val)) return false;
    if (key === "speed") { val = +val; if (val !== 1 && val !== 1.5 && val !== 2) return false; }
    if (key === "mute" || key === "open" || key === "autoMove" || key === "haptic" || key === "hints") val = !!val;
    if (!(key in DEFAULTS) || key === "tab") return false;
    if (P[key] === val) return true;
    P[key] = val; commit(key); return true;
  }
  function applyPreset(id) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) {
        var s = PRESETS[i].set, k;
        for (k in s) P[k] = s[k];
        commit("all");
        return true;
      }
    }
    return false;
  }
  function randomizeStudio() {
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    P.style = pick(STYLES)[0];
    P.board = pick(BOARD_IDS.slice(1));
    P.piece = pick(PIECES)[0];
    P.palette = pick(PALETTE_IDS);
    P.dice = pick(DICE_SKINS)[0];
    P.trail = pick(TRAILS.slice(0, 4))[0];
    P.center = pick(CENTERS)[0];
    commit("all");
  }
  function resetPrefs() {
    var t = P.tab, o = P.open, ct = P.czTab;
    P = loadDefaults(); P.tab = t; P.open = o; P.czTab = ct;
    commit("all");
  }

  /* ---------- tabs & game panes ---------- */
  function mountGame(id) {
    var pane = q("#ag-pane-" + id); if (!pane || mounted[id]) return;
    if (GAMES[id] && typeof GAMES[id].mount === "function") {
      pane.innerHTML = ""; mounted[id] = "game";
      try { GAMES[id].mount(pane, api); } catch (e) { pane.innerHTML = '<div class="ag-card ag-glass ag-ph"><p class="ag-ph-d">This game failed to start. Please refresh the page.</p></div>'; }
    }
  }
  function setPlaying(on) {
    var w = root && root.querySelector(".ag-wrap"); if (!w) return;
    var was = w.classList.contains("ag-playing");
    w.classList.toggle("ag-playing", !!on);
    if (!on) w.classList.remove("ag-peek-cz");
    if (on && !was) { try { root.scrollIntoView({ block: "start" }); } catch (e) { } }
  }
  function toggleInGameStudio() {
    var w = root && root.querySelector(".ag-wrap"); if (!w) return;
    var showing = w.classList.toggle("ag-peek-cz");
    P.open = showing;
    applyVars(); syncUI(); drawThumbs();
    playSfx("click");
  }
  function setTab(id) {
    if (!has(TABS, id) || !root) return;
    var prev = P.tab;
    if (prev !== id && GAMES[prev] && GAMES[prev].onHide) { try { GAMES[prev].onHide(); } catch (e) { } }
    P.tab = id; savePrefs(); setPlaying(false);
    if (id !== "quiz") mountGame(id);
    applyVars(); syncUI();
    if (GAMES[id] && mounted[id] === "game" && GAMES[id].onShow) { try { GAMES[id].onShow(); } catch (e) { } }
    window.requestAnimationFrame(drawThumbs);
    emit("tab");
  }
  function registerGame(id, g) {
    if (id !== "ludo" && id !== "snakes") return false;
    GAMES[id] = g;
    if (root && P.tab === id) mountGame(id);
    return true;
  }

  /* ---------- Redesigned Arena Studio Shell HTML ---------- */
  function segBtn(p, k, label, extra) {
    return '<button type="button" data-ag="set" data-p="' + p + '" data-k="' + k + '" aria-pressed="false">' + (extra || "") + label + '</button>';
  }
  function shellHTML() {
    var h = '<div class="ag-wrap">';
    h += '<nav class="ag-bar ag-glass" role="tablist" aria-label="Arena games">' + TABS.map(function (t) {
      return '<button type="button" role="tab" class="ag-tab" data-ag="tab" data-k="' + t[0] + '" aria-selected="false">' + ico(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join("") + '</nav>';

    h += '<section id="ag-cz" class="ag-cz ag-glass ag-off">';
    h += '<button type="button" id="ag-cz-h" class="ag-cz-h" data-ag="open" aria-expanded="false" aria-controls="ag-cz-b">' +
      '<span class="ag-cz-ic">' + ico("sparkles") + '</span>' +
      '<span class="min-w-0 flex-1"><span class="ag-cz-t">Arena Studio <span class="ag-badge">PRO</span></span><span id="ag-cz-sum" class="ag-cz-s truncate"></span></span>' +
      ico("chevron-down", "ag-chev") + '</button>';

    h += '<div class="ag-cz-b" id="ag-cz-b"><div class="ag-cz-in"><div class="ag-cz-pad">';

    // Live interactive preview card
    h += '<div class="ag-pv-box"><canvas id="ag-live-cv" class="ag-pv-cv"></canvas>' +
      '<div class="ag-pv-bar"><span id="ag-pv-tag" class="ag-pv-tag"></span><span id="ag-pv-dots" class="ag-pv-dots"></span>' +
      '<button type="button" class="ag-rand" data-ag="rand" title="Surprise Me!">' + ico("shuffle") + 'Mix</button></div></div>';

    // Studio Sub-Tabs
    h += '<div class="ag-cz-tabs">' + CZ_TABS.map(function (t) {
      return '<button type="button" class="ag-cz-tb" data-ag="cztab" data-k="' + t[0] + '">' + ico(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join("") + '</div>';

    // Pane 1: One-Tap Presets
    h += '<div class="ag-czp" data-czp="presets">' +
      '<div class="ag-lbl">One-tap pro themes</div>' +
      '<div class="ag-presets">' + PRESETS.map(function (pr) {
        return '<button type="button" class="ag-pr" data-ag="preset" data-k="' + pr.id + '" style="background:' + pr.grad + '">' +
          '<span class="ag-pr-e">' + pr.emoji + '</span><span class="ag-pr-n">' + pr.name + '</span><span class="ag-pr-s">' + pr.sub + '</span></button>';
      }).join("") + '</div></div>';

    // Pane 2: Board Themes & Finish
    h += '<div class="ag-czp ag-off" data-czp="board">' +
      '<div class="ag-lbl">Board finish</div><div class="ag-seg">' + STYLES.map(function (s) { return segBtn("style", s[0], s[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">10 textured arenas</div><div class="ag-boards">' + BOARD_IDS.map(function (id) {
        var nm = id === "auto" ? "Auto" : BOARDS[id].name;
        return '<button type="button" data-ag="set" data-p="board" data-k="' + id + '" aria-pressed="false"><span class="ag-sw" data-k="' + id + '"></span><span class="ag-bn">' + nm + '</span></button>';
      }).join("") + '</div></div>';

    // Pane 3: Pieces & Team Palettes
    h += '<div class="ag-czp ag-off" data-czp="pieces">' +
      '<div class="ag-lbl">8 bespoke 3D pieces</div><div class="ag-pieces">' + PIECES.map(function (p) {
        return '<button type="button" data-ag="set" data-p="piece" data-k="' + p[0] + '" aria-pressed="false"><span class="ag-pc"><canvas class="ag-thumb" data-k="' + p[0] + '"></canvas></span><span class="ag-bn">' + p[1] + '</span></button>';
      }).join("") + '</div>' +
      '<div class="ag-lbl">Team color palette</div><div class="ag-pals">' + PALETTE_IDS.map(function (id) {
        var pl = PALETTES[id];
        return '<button type="button" class="ag-pal" data-ag="set" data-p="palette" data-k="' + id + '" aria-pressed="false">' +
          '<span class="ag-pal-d">' + pl.colors.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + '</span>' +
          '<span class="ag-bn">' + pl.name + '</span></button>';
      }).join("") + '</div></div>';

    // Pane 4: 3D Dice Skins, Hop Trails & Center Emblem
    h += '<div class="ag-czp ag-off" data-czp="fx">' +
      '<div class="ag-lbl">3D dice skin</div><div class="ag-dices">' + DICE_SKINS.map(function (d) {
        return '<button type="button" class="ag-dskin" data-ag="set" data-p="dice" data-k="' + d[0] + '" aria-pressed="false">' +
          '<span class="ag-dchip" style="background:linear-gradient(135deg,' + d[2] + ',' + d[3] + ');color:' + d[4] + ';border-color:' + d[4] + '">⚄</span>' +
          '<span class="ag-bn">' + d[1] + '</span></button>';
      }).join("") + '</div>' +
      '<div class="ag-lbl">Move &amp; capture trail</div><div class="ag-seg">' + TRAILS.map(function (t) { return segBtn("trail", t[0], t[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">Ludo center emblem</div><div class="ag-seg">' + CENTERS.map(function (c) { return segBtn("center", c[0], c[1]); }).join("") + '</div></div>';

    // Pane 5: Controls, Speed, Sound Packs & Haptics
    h += '<div class="ag-czp ag-off" data-czp="ctrl">' +
      '<div class="ag-two"><div><div class="ag-lbl">Speed</div><div class="ag-seg">' + segBtn("speed", "1", "1×") + segBtn("speed", "1.5", "1.5×") + segBtn("speed", "2", "2×") + '</div></div>' +
      '<div><div class="ag-lbl">Sound</div><div id="ag-snd" class="ag-seg">' +
      '<button type="button" data-ag="snd" data-m="0" class="ag-snd-on">' + ico("volume-2") + 'On</button>' +
      '<button type="button" data-ag="snd" data-m="1" class="ag-snd-off">' + ico("volume-x") + 'Mute</button></div></div></div>' +
      '<div class="ag-lbl">Sound pack</div><div class="ag-seg">' + SFX_PACKS.map(function (s) { return segBtn("sfx", s[0], s[1]); }).join("") + '</div>' +
      '<div class="ag-two"><div><div class="ag-lbl">Haptic buzz</div><div class="ag-seg">' + segBtn("haptic", "true", "On") + segBtn("haptic", "false", "Off") + '</div></div>' +
      '<div><div class="ag-lbl">Move hints</div><div class="ag-seg">' + segBtn("hints", "true", "On") + segBtn("hints", "false", "Off") + '</div></div></div>' +
      '<button type="button" class="ag-reset" data-ag="reset">' + ico("rotate-ccw") + 'Reset Studio to Defaults</button></div>';

    h += '</div></div></div></section></div>';
    h += '<div id="ag-pane-quiz" class="ag-pane"></div><div id="ag-pane-ludo" class="ag-pane ag-off"></div><div id="ag-pane-snakes" class="ag-pane ag-off"></div>';
    return h;
  }

  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-ag]");
    if (!b || !root.contains(b)) return;
    var a = b.getAttribute("data-ag"), k = b.getAttribute("data-k");
    if (a === "tab") { setTab(k); playSfx("tab"); }
    else if (a === "open") {
      var w = root && root.querySelector(".ag-wrap");
      if (w && w.classList.contains("ag-playing")) { toggleInGameStudio(); return; }
      setPref("open", !P.open);
    }
    else if (a === "cztab") { setPref("czTab", k); playSfx("tab"); }
    else if (a === "preset") { if (applyPreset(k)) { playSfx("preset"); vibrate(18); } }
    else if (a === "rand") { randomizeStudio(); playSfx("preset"); vibrate(18); }
    else if (a === "set") {
      var p = b.getAttribute("data-p");
      var v = (k === "true") ? true : (k === "false") ? false : k;
      if (setPref(p, v)) { playSfx("click"); vibrate(10); }
    }
    else if (a === "snd") { setPref("mute", b.getAttribute("data-m") === "1"); playSfx("click"); }
    else if (a === "reset") { resetPrefs(); playSfx("click"); }
  }

  function keyGuard(e) {
    if (!root || P.tab === "quiz" || e.ctrlKey || e.metaKey || e.altKey || !/^[1-4a-dA-D]$/.test(e.key)) return;
    var t = e.target, tn = t && t.tagName;
    if (tn === "INPUT" || tn === "TEXTAREA" || tn === "SELECT" || (t && t.isContentEditable)) return;
    if (q("#ag-pane-quiz [data-a='opt']")) e.stopImmediatePropagation();
  }

  /* ---------- styles (Arena Studio + Shared Game UI) ---------- */
  function injectCss() {
    if (document.getElementById("ag-style")) return;
    var R = "#quiz-arena-root ", css = [
      R.trim() + "{--ag-tx:#e2e8f0;--ag-t2:#94a3b8;--ag-bg:rgba(15,23,42,.66);--ag-bg2:rgba(30,41,59,.58);--ag-bd:rgba(148,163,184,.22);--ag-ac:#fbbf24;--ag-actx:#fde68a;--ag-on:rgba(251,191,36,.16);--ag-onb:rgba(251,191,36,.65);--ag-sh:0 12px 30px -10px rgba(0,0,0,.55),0 1px 0 0 rgba(255,255,255,.07) inset;--ag-k:1}",
      "html.bright-mode " + R.trim() + "{--ag-tx:#1e293b;--ag-t2:#475569;--ag-bg:rgba(255,255,255,.68);--ag-bg2:rgba(255,255,255,.78);--ag-bd:rgba(148,163,184,.42);--ag-ac:#b45309;--ag-actx:#92400e;--ag-on:rgba(217,119,6,.14);--ag-onb:rgba(217,119,6,.55);--ag-sh:0 10px 28px -10px rgba(15,23,42,.18),0 1px 0 0 rgba(255,255,255,.8) inset}",
      R + ".ag-off{display:none!important}",
      R + ".ag-wrap{color:var(--ag-tx);margin-bottom:.75rem}",
      R + ".ag-wrap *{box-sizing:border-box}",
      R + ".ag-wrap button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      R + ".ag-i{width:16px;height:16px;flex:none}",
      R + ".ag-glass{background:var(--ag-bg);-webkit-backdrop-filter:blur(16px) saturate(145%);backdrop-filter:blur(16px) saturate(145%);border:1px solid var(--ag-bd);box-shadow:var(--ag-sh);border-radius:1.05rem}",
      "html.no-glass " + R + ".ag-glass{background:#0f172a;-webkit-backdrop-filter:none;backdrop-filter:none}",
      "html.no-glass.bright-mode " + R + ".ag-glass{background:#fff}",
      R + ".ag-bar{display:flex;gap:4px;padding:4px;margin-bottom:.6rem}",
      R + ".ag-tab{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;padding:.62rem .4rem;border-radius:.75rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-weight:700;font-size:12.5px;line-height:1.1;text-align:center;transition:background .2s,color .2s,border-color .2s,box-shadow .2s}",
      R + ".ag-tab:hover{color:var(--ag-tx)}",
      R + ".ag-tab.on{color:var(--ag-actx);background:linear-gradient(135deg,rgba(251,191,36,.22),rgba(245,158,11,.10));border-color:var(--ag-onb);box-shadow:0 4px 14px -6px rgba(245,158,11,.45)}",
      "@media(max-width:480px){" + R + ".ag-tab{flex-direction:column;gap:3px;font-size:11px;padding:.5rem .2rem}}",

      /* Arena Studio Drawer */
      R + ".ag-cz{margin-bottom:.75rem;overflow:hidden;border-color:rgba(251,191,36,.32)}",
      R + ".ag-cz-h{width:100%;display:flex;align-items:center;gap:.65rem;padding:.72rem .85rem;background:linear-gradient(90deg,rgba(251,191,36,.08),transparent 65%);border:0;text-align:left}",
      R + ".ag-cz-ic{display:grid;place-items:center;width:36px;height:36px;border-radius:.75rem;background:linear-gradient(135deg,rgba(251,191,36,.3),rgba(245,158,11,.12));border:1px solid var(--ag-onb);color:var(--ag-ac);flex:none;box-shadow:0 0 16px -4px rgba(251,191,36,.5)}",
      R + ".ag-cz-t{display:flex;align-items:center;gap:6px;font-weight:900;font-size:13.5px}",
      R + ".ag-badge{font-size:9px;font-weight:900;letter-spacing:.08em;padding:2px 6px;border-radius:999px;background:linear-gradient(135deg,#fde047,#f59e0b);color:#1f1300}",
      R + ".ag-cz-s{display:block;font-size:11px;color:var(--ag-t2);margin-top:1px}",
      R + ".ag-chev{color:var(--ag-t2);transition:transform calc(.25s*var(--ag-k))}",
      R + ".ag-cz.open .ag-chev{transform:rotate(180deg)}",
      R + ".ag-cz-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows calc(.28s*var(--ag-k)) ease}",
      R + ".ag-cz.open .ag-cz-b{grid-template-rows:1fr}",
      R + ".ag-cz-in{min-height:0;overflow:hidden;visibility:hidden;transition:visibility 0s linear calc(.28s*var(--ag-k))}",
      R + ".ag-cz.open .ag-cz-in{visibility:visible;transition-delay:0s}",
      R + ".ag-cz-pad{padding:.75rem .85rem .9rem;border-top:1px solid var(--ag-bd)}",

      /* Live preview box */
      R + ".ag-pv-box{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--ag-bd);margin-bottom:.7rem;box-shadow:0 10px 24px -14px rgba(0,0,0,.7)}",
      R + ".ag-pv-cv{display:block;width:100%;height:110px}",
      R + ".ag-pv-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(2,6,23,.55);border-top:1px solid rgba(255,255,255,.1);color:#f8fafc}",
      R + ".ag-pv-tag{font-size:11px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      R + ".ag-pv-dots{display:flex;gap:3px}",
      R + ".ag-pv-dots i{width:9px;height:9px;border-radius:50%;border:1px solid rgba(255,255,255,.65)}",
      R + ".ag-rand{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:800;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1f1300!important;border:0}",
      R + ".ag-rand .ag-i{width:12px;height:12px}",

      /* Studio sub-tabs */
      R + ".ag-cz-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:3px;border-radius:.85rem;background:var(--ag-bg2);border:1px solid var(--ag-bd);margin-bottom:.65rem}",
      R + ".ag-cz-tb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;border-radius:.65rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-size:10px;font-weight:800;transition:.18s}",
      R + ".ag-cz-tb .ag-i{width:14px;height:14px}",
      R + ".ag-cz-tb.on{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",

      /* Presets */
      R + ".ag-presets{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}",
      R + ".ag-pr{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 10px 9px;border-radius:14px;border:1.5px solid rgba(255,255,255,.22);color:#fff!important;text-align:left;box-shadow:0 8px 18px -10px rgba(0,0,0,.65);transition:transform .15s,box-shadow .2s,border-color .2s}",
      R + ".ag-pr:active{transform:scale(.97)}",
      R + ".ag-pr.on{border-color:#fde047;box-shadow:0 0 0 2px #fde047,0 10px 22px -8px rgba(251,191,36,.65)}",
      R + ".ag-pr-e{font-size:18px;line-height:1}",
      R + ".ag-pr-n{font-size:12.5px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.45)}",
      R + ".ag-pr-s{font-size:10px;font-weight:600;opacity:.88}",

      /* Controls inside studio panes */
      R + ".ag-lbl{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--ag-t2);margin:.6rem 0 .38rem}",
      R + ".ag-czp>.ag-lbl:first-child{margin-top:.1rem}",
      R + ".ag-seg{display:flex;gap:3px;padding:3px;border-radius:.8rem;background:var(--ag-bg2);border:1px solid var(--ag-bd)}",
      R + ".ag-seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:.48rem .25rem;border-radius:.6rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-weight:700;font-size:11.5px;transition:.18s;min-width:0}",
      R + ".ag-seg button.on,#ag-snd:not(.ag-muted) .ag-snd-on,#ag-snd.ag-muted .ag-snd-off{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",
      R + ".ag-boards{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}",
      R + ".ag-pieces{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      R + ".ag-pals{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}",
      R + ".ag-dices{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}",
      R + ".ag-boards button," + R + ".ag-pieces button," + R + ".ag-pal," + R + ".ag-dskin{display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 3px 6px;border-radius:.82rem;border:1.5px solid var(--ag-bd);background:var(--ag-bg2);transition:.18s}",
      R + ".ag-boards button.on," + R + ".ag-pieces button.on," + R + ".ag-pal.on," + R + ".ag-dskin.on{border-color:var(--ag-onb);background:var(--ag-on);box-shadow:0 0 0 1px var(--ag-onb)}",
      R + ".ag-sw{display:block;width:32px;height:32px;border-radius:50%;border:2px solid transparent;box-shadow:inset 0 0 0 2px rgba(255,255,255,.2),0 3px 8px -3px rgba(0,0,0,.55)}",
      R + ".ag-pc{display:grid;place-items:center;width:100%;max-width:60px;height:50px;border-radius:.65rem;border:1px solid var(--ag-bd)}",
      R + ".ag-pal-d{display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:4px}",
      R + ".ag-pal-d i{width:11px;height:11px;border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.45)}",
      R + ".ag-dchip{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:2px solid;font-size:20px;line-height:1;box-shadow:0 4px 10px -4px rgba(0,0,0,.55)}",
      R + ".ag-bn{font-size:9.8px;line-height:1.15;font-weight:700;color:var(--ag-t2);text-align:center}",
      R + ".on>.ag-bn{color:var(--ag-actx)}",
      R + ".ag-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}",
      R + ".ag-snd-off .ag-i," + R + ".ag-snd-on .ag-i{width:13px;height:13px}",
      R + ".ag-reset{display:flex;align-items:center;justify-content:center;gap:6px;margin:.8rem auto 0;padding:.44rem .9rem;border-radius:999px;border:1px solid var(--ag-bd);background:transparent;color:var(--ag-t2);font-size:11.5px;font-weight:700}",
      R + ".ag-reset:hover{color:var(--ag-tx)}",
      R + ".ag-fail{padding:1rem;text-align:center;font-size:13px;color:var(--ag-t2)}",

      /* Shared Board Game UI */
      R + ".bg-box{max-width:30rem;margin:0 auto;color:var(--ag-tx)}",
      R + ".bg-box *{box-sizing:border-box}",
      R + ".bg-box button,.bg-box input{font:inherit;color:inherit}",
      R + ".bg-in{width:100%;padding:.45rem .75rem;border-radius:.75rem;font-size:13px;font-weight:600;background:var(--ag-bg2);border:1px solid var(--ag-bd);outline:none}",
      R + ".bg-in:focus{border-color:var(--ag-onb)}",
      R + ".bg-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:.45rem;padding:.78rem 1rem;border-radius:1rem;font-weight:800;font-size:14px;color:#1f1300!important;background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);box-shadow:0 10px 22px -10px rgba(245,158,11,.75),0 1px 0 rgba(255,255,255,.4) inset;border:1px solid rgba(255,255,255,.25)}",
      R + ".bg-cta:active:not(:disabled){transform:scale(.985)}",
      R + ".bg-cta:disabled{opacity:.45;box-shadow:none}",
      R + ".bg-sec{display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.6rem .8rem;border-radius:.9rem;font-weight:700;font-size:12px;background:var(--ag-bg2);border:1px solid var(--ag-bd)}",
      R + ".bg-pill{padding:.32rem .65rem;border-radius:999px;font-size:11px;font-weight:700;background:var(--ag-bg2);border:1px solid var(--ag-bd)}",
      R + ".bg-pill.on{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",
      R + ".bg-cv-wrap{position:relative;width:100%;max-width:440px;margin:0 auto;aspect-ratio:1/1;border-radius:16px;overflow:hidden}",
      R + ".ag-playing .ag-bar," + R + ".ag-playing:not(.ag-peek-cz) .ag-cz," + R + ".ag-playing .ag-speed-tag{display:none!important}",
      R + ".ag-playing.ag-peek-cz .ag-cz{display:block!important;margin-bottom:.55rem}",
      R + ".ag-playing .bg-box{max-width:none}",
      R + "#ag-pane-snakes .bg-cv-wrap," + R + "#ag-pane-ludo .bg-cv-wrap{width:100%}",
      R + ".ag-playing #ag-pane-snakes .bg-cv-wrap{width:min(100%,calc(100vh - 330px));width:min(100%,calc(100dvh - 330px));min-width:240px}",
      R + ".ag-playing #ag-pane-ludo .bg-cv-wrap{width:min(100%,calc(100vh - 400px));width:min(100%,calc(100dvh - 400px));min-width:240px}",
      R + ".ag-playing .bg-emo{padding:.15rem 0;font-size:15px}",
      R + ".bg-cv{display:block;width:100%;height:100%;touch-action:manipulation}",
      R + ".bg-dice{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;border:2px solid var(--ag-onb);background:var(--ag-bg2);box-shadow:0 8px 20px -6px rgba(0,0,0,.45);transition:transform .15s,border-color .2s;flex:none}",
      R + ".bg-dice:active:not(:disabled){transform:scale(.93)}",
      R + ".bg-dice:disabled{opacity:.55}",
      R + ".bg-dice.roll{animation:bgSpin 1s ease-in-out}",
      "@keyframes bgSpin{0%{transform:rotate(0) scale(1)}30%{transform:rotate(-16deg) scale(1.1)}70%{transform:rotate(16deg) scale(1.1)}100%{transform:rotate(0) scale(1)}}",
      R + ".bg-pchip{position:relative;display:flex;align-items:center;gap:6px;padding:.38rem .58rem;border-radius:.8rem;background:var(--ag-bg2);border:1.5px solid var(--ag-bd);font-size:11.5px;font-weight:700;min-width:0;transition:border-color .2s,background .2s}",
      R + ".bg-pchip.turn{border-color:var(--ag-onb);background:var(--ag-on)}",
      R + ".bg-dot{width:10px;height:10px;border-radius:50%;flex:none}",
      R + ".bg-code{font-size:2.4rem;line-height:1.1;font-weight:900;letter-spacing:.2em;padding-left:.2em;color:var(--ag-ac)}",
      R + ".bg-emo-bar{display:flex;align-items:center;justify-content:space-between;gap:4px}",
      R + ".bg-emo{flex:1;padding:.3rem 0;border-radius:.7rem;background:var(--ag-bg2);border:1px solid var(--ag-bd);font-size:16px;line-height:1.2}",
      R + ".bg-emo:active{transform:scale(.9)}",
      R + ".bg-bubble{position:absolute;right:6px;top:-14px;font-size:20px;pointer-events:none;animation:bgPop 1.3s ease-out forwards;z-index:5}",
      "@keyframes bgPop{0%{opacity:0;transform:translateY(6px) scale(.7)}20%{opacity:1;transform:translateY(-4px) scale(1.15)}80%{opacity:1;transform:translateY(-12px) scale(1)}100%{opacity:0;transform:translateY(-20px) scale(.9)}}",
      "@media(prefers-reduced-motion:reduce){" + R + ".bg-dice.roll," + R + ".bg-bubble{animation:none}}"
    ];
    var st = document.createElement("style"); st.id = "ag-style"; st.textContent = css.join("\n");
    document.head.appendChild(st);
  }

  /* ---------- mount ---------- */
  function boot() {
    root = document.getElementById("quiz-arena-root");
    if (!root || root.getAttribute("data-ag") === "1") return;
    if (root.getAttribute("data-qa") !== "1" && window.QuizArena && window.QuizArena.mount) { try { window.QuizArena.mount(); } catch (e) { } }
    root.setAttribute("data-ag", "1");
    injectCss();
    var kids = []; while (root.firstChild) kids.push(root.removeChild(root.firstChild));
    root.innerHTML = shellHTML();
    var qp = q("#ag-pane-quiz");
    if (kids.length) kids.forEach(function (k) { qp.appendChild(k); });
    else qp.innerHTML = '<div class="ag-fail">Quiz Arena could not load. Please refresh the page.</div>';

    try {
      var sp = new URLSearchParams(location.search), bCode = sp.get("battle"), gType = sp.get("game");
      if (bCode && /^\d{4}$/.test(bCode) && (gType === "ludo" || gType === "snakes")) {
        pendingInvite = { code: bCode, game: gType };
        P.tab = gType;
      } else if (window.QuizArena && window.QuizArena.invite && window.QuizArena.invite()) {
        P.tab = "quiz";
      }
    } catch (e) { }

    window.addEventListener("qa:invite", function () { if (!pendingInvite) setTab("quiz"); });
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", keyGuard, true);
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        drawThumbs();
        if (P.tab !== "quiz" && GAMES[P.tab] && GAMES[P.tab].onShow) { try { GAMES[P.tab].onShow(); } catch (e) { } }
      }, 150);
    });
    lastBright = bright();
    try {
      new MutationObserver(function () {
        var b = bright(); if (b === lastBright) return; lastBright = b;
        commit("theme", true);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    } catch (e) { }

    var vq = document.getElementById("view-quiz");
    if (vq) {
      try {
        new MutationObserver(function () {
          if (!vq.classList.contains("hidden")) {
            window.requestAnimationFrame(function () {
              drawThumbs();
              if (P.tab !== "quiz" && GAMES[P.tab] && mounted[P.tab] === "game" && GAMES[P.tab].onShow) {
                try { GAMES[P.tab].onShow(); } catch (e) { }
              }
            });
          }
        }).observe(vq, { attributes: true, attributeFilter: ["class"] });
      } catch (e) { }
    }

    if (P.tab !== "quiz") mountGame(P.tab);
    applyVars(); syncUI(); icons();
    window.requestAnimationFrame(drawThumbs);
    for (var id in GAMES) if (P.tab === id) mountGame(id);
  }

  var api = window.ArenaGames = {
    version: "3.0.0-studio",
    getPrefs: copyPrefs,
    setPref: setPref,
    applyPreset: applyPreset,
    randomizeStudio: randomizeStudio,
    resetPrefs: resetPrefs,
    subscribe: function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
    getBoard: getBoard,
    getPalette: getPalette,
    boards: function () { return BOARD_IDS.slice(); },
    pieces: function () { return PIECES.map(function (p) { return p[0]; }); },
    paintBoardBg: paintBoardBg,
    drawToken: drawToken,
    shade: shade,
    alpha: alpha,
    playSfx: playSfx,
    vibrate: vibrate,
    toggleStudio: toggleInGameStudio,
    speed: function () { return P.speed; },
    dur: function (ms) { return ms / P.speed; },
    isMuted: function () { return !!P.mute; },
    registerGame: registerGame,
    setTab: setTab,
    getTab: function () { return P.tab; }
  };
  /* =====================================================================
   * GAME 1: SNAKES & LADDERS (Offline + Online Friends + Studio Integration)
   * ===================================================================== */
  (function () {
    var LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
    var SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };

    var host = null, view = "setup";
    var cfg = { mode: "ai", count: 2, myName: savedName(), names: ["You", "Bot 1", "Bot 2", "Bot 3"], code: "" };
    var st = null, rm = null, busy = false;
    var cv = null, ctx = null, off = null, offCtx = null, offKey = "", size = 0, dpr = 1;
    var raf = 0, botT = 0, diceT = 0, quitT = 0, particles = [];
    var gen = 0;
    function later(fn, ms) { var g = gen; return setTimeout(function () { if (g !== gen) return; fn(); }, ms); }

    if (pendingInvite && pendingInvite.game === "snakes") {
      cfg.mode = "online"; cfg.code = pendingInvite.code;
    }

    function slColors() { return getPalette(); }

    function cellCenter(n, s) {
      n = Math.max(1, Math.min(100, n));
      var idx = n - 1, row = Math.floor(idx / 10), col = idx % 10;
      if (row % 2 === 1) col = 9 - col;
      var pad = s * 0.04, inner = s - pad * 2, cw = inner / 10;
      return { x: pad + (col + 0.5) * cw, y: s - pad - (row + 0.5) * cw, cw: cw };
    }

    function buildCache() {
      if (!size || !offCtx) return;
      var b = api.getBoard(), key = size + "|" + dpr + "|" + b.id + "|" + (b.modern ? "m" : "c") + "|" + b.dark + "|sl3";
      if (key === offKey) return;
      offKey = key;
      off.width = size * dpr; off.height = size * dpr;
      var c = offCtx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBoardBg(c, 0, 0, size, size, 16);

      var i, n, p, cw = cellCenter(1, size).cw;
      for (n = 1; n <= 100; n++) {
        p = cellCenter(n, size);
        var x = p.x - cw / 2, y = p.y - cw / 2, alt = (Math.floor((n - 1) / 10) + (n - 1)) % 2 === 0;
        c.fillStyle = b.modern ? alpha(alt ? b.cellA : b.cellB, 0.88) : (alt ? b.cellA : b.cellB);
        c.fillRect(x, y, cw, cw);
        c.strokeStyle = alpha(b.line, 0.35); c.lineWidth = 1; c.strokeRect(x, y, cw, cw);
      }
      c.textAlign = "left"; c.textBaseline = "top";
      c.font = "700 " + Math.max(8, Math.round(cw * 0.26)) + "px sans-serif";
      c.fillStyle = alpha(b.text, 0.78);
      for (n = 1; n <= 100; n++) {
        p = cellCenter(n, size);
        c.fillText(String(n), p.x - cw / 2 + cw * 0.08, p.y - cw / 2 + cw * 0.06);
      }
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = "800 " + Math.max(8, Math.round(cw * 0.2)) + "px sans-serif";
      c.fillStyle = b.accent;
      p = cellCenter(1, size); c.fillText("START", p.x, p.y + cw * 0.3);
      p = cellCenter(100, size); c.fillText("WIN", p.x, p.y + cw * 0.3);

      var k, f, t, dx, dy, len, nx, ny, rungs, r;
      for (k in LADDERS) {
        f = cellCenter(+k, size); t = cellCenter(LADDERS[k], size);
        dx = t.x - f.x; dy = t.y - f.y; len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len * cw * 0.16; ny = dx / len * cw * 0.16;
        c.save(); c.lineCap = "round";
        c.strokeStyle = "#a16207"; c.lineWidth = Math.max(2.5, cw * 0.075);
        c.beginPath(); c.moveTo(f.x + nx, f.y + ny); c.lineTo(t.x + nx, t.y + ny); c.stroke();
        c.beginPath(); c.moveTo(f.x - nx, f.y - ny); c.lineTo(t.x - nx, t.y - ny); c.stroke();
        c.strokeStyle = "#fbbf24"; c.lineWidth = Math.max(2, cw * 0.06);
        rungs = Math.max(3, Math.round(len / (cw * 0.42)));
        for (r = 1; r < rungs; r++) {
          var u = r / rungs;
          c.beginPath(); c.moveTo(f.x + dx * u + nx, f.y + dy * u + ny); c.lineTo(f.x + dx * u - nx, f.y + dy * u - ny); c.stroke();
        }
        c.restore();
      }

      var si = 0, cols = ["#ef4444", "#f97316", "#a855f7", "#ec4899"];
      for (k in SNAKES) {
        f = cellCenter(+k, size); t = cellCenter(SNAKES[k], size);
        dx = t.x - f.x; dy = t.y - f.y; len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len; ny = dx / len;
        var amp = cw * 0.38 * (si % 2 ? -1 : 1), col = cols[si % cols.length]; si++;
        var pts = [], steps = 28, w;
        for (i = 0; i <= steps; i++) {
          var tt = i / steps; w = Math.sin(tt * Math.PI * 3) * amp;
          pts.push([f.x + dx * tt + nx * w, f.y + dy * tt + ny * w]);
        }
        c.save(); c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = Math.max(5, cw * 0.2);
        c.beginPath(); for (i = 0; i <= steps; i++) c[i ? "lineTo" : "moveTo"](pts[i][0] + 1.5, pts[i][1] + 2); c.stroke();
        c.strokeStyle = col; c.lineWidth = Math.max(4, cw * 0.16);
        c.beginPath(); for (i = 0; i <= steps; i++) c[i ? "lineTo" : "moveTo"](pts[i][0], pts[i][1]); c.stroke();
        c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = Math.max(1.5, cw * 0.05); c.setLineDash([cw * 0.12, cw * 0.14]);
        c.beginPath(); for (i = 0; i <= steps; i++) c[i ? "lineTo" : "moveTo"](pts[i][0], pts[i][1]); c.stroke();
        c.setLineDash([]);
        c.fillStyle = col; c.beginPath(); c.arc(pts[0][0], pts[0][1], cw * 0.17, 0, TAU); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(pts[0][0] - cw * 0.06, pts[0][1] - cw * 0.04, cw * 0.04, 0, TAU); c.arc(pts[0][0] + cw * 0.06, pts[0][1] - cw * 0.04, cw * 0.04, 0, TAU); c.fill();
        c.fillStyle = "#111"; c.beginPath(); c.arc(pts[0][0] - cw * 0.06, pts[0][1] - cw * 0.04, cw * 0.018, 0, TAU); c.arc(pts[0][0] + cw * 0.06, pts[0][1] - cw * 0.04, cw * 0.018, 0, TAU); c.fill();
        c.restore();
      }
    }

    function spawnSparks(x, y, col, n) {
      if (P.trail === "none") return;
      for (var i = 0; i < (n || 14); i++) {
        var a = Math.random() * TAU, sp = 1.2 + Math.random() * 3.2;
        particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: col });
      }
    }

    function drawFrame() {
      if (!ctx || !size) return;
      buildCache();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if (off && off.width) ctx.drawImage(off, 0, 0, size, size);
      if (!st) return;

      var groups = {}, i, pl, key;
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i]; if (pl.anim) continue;
        key = String(pl.pos);
        if (!groups[key]) groups[key] = [];
        groups[key].push(i);
      }
      var cw = (size * 0.92) / 10, baseR = Math.max(9, cw * 0.36);
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i];
        if (pl.anim) { drawToken(ctx, pl.anim.x, pl.anim.y, baseR * 1.12, pl.color, P.piece, P.style, cw * 0.14); continue; }
        var c = cellCenter(pl.pos, size), grp = groups[String(pl.pos)] || [i], idx = grp.indexOf(i), len = grp.length;
        var ox = 0, oy = 0, sc = 1;
        if (len > 1) {
          var ang = (idx / len) * TAU - Math.PI / 4, dist = cw * 0.2;
          ox = Math.cos(ang) * dist; oy = Math.sin(ang) * dist; sc = 0.82;
        }
        if (i === st.turn && !st.busy && !st.winner) {
          ctx.save(); ctx.strokeStyle = pl.color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(c.x + ox, c.y + oy + baseR * 0.3, baseR * sc * 0.95, 0, TAU); ctx.stroke(); ctx.restore();
        }
        drawToken(ctx, c.x + ox, c.y + oy, baseR * sc, pl.color, P.piece, P.style, 0);
      }

      for (i = particles.length - 1; i >= 0; i--) {
        var pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.035 * api.speed();
        if (pt.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, pt.life); ctx.fillStyle = pt.col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, TAU); ctx.fill(); ctx.restore();
      }
      if (particles.length || st.players.some(function (p) { return !!p.anim; })) {
        raf = window.requestAnimationFrame(drawFrame);
      } else { raf = 0; }
    }
    function kickLoop() { if (!raf && cv) raf = window.requestAnimationFrame(drawFrame); }

    function resizeBoard() {
      if (!cv || !host) return;
      var wrap = q(".bg-cv-wrap", host); if (!wrap) return;
      var w = Math.floor(wrap.clientWidth);
      if (w < 40) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== size || cv.width !== w * dpr) { size = w; cv.width = size * dpr; cv.height = size * dpr; offKey = ""; }
      drawFrame();
    }

    function turnTxt(n) { return n === "You" ? "Your turn" : n + "'s turn"; }
    function setMsg(txt) {
      if (st) st.msg = txt;
      var el = q("#sl-msg", host); if (el) el.textContent = txt;
    }

    function showReaction(pIdx, emo) {
      var chip = q("#sl-chip-" + pIdx, host);
      if (!chip) return;
      var old = chip.querySelector(".bg-bubble"); if (old) old.remove();
      var sp = document.createElement("span");
      sp.className = "bg-bubble"; sp.textContent = emo;
      chip.appendChild(sp);
      setTimeout(function () { if (sp.parentNode) sp.remove(); }, 1350);
    }

    function animatePath(pl, steps, onDone) {
      var i = 0, g = gen;
      function stepNext() {
        if (g !== gen) return;
        if (!st || i >= steps.length) { pl.anim = null; drawFrame(); if (onDone) onDone(); return; }
        var from = cellCenter(pl.pos, size), to = cellCenter(steps[i], size);
        var start = performance.now(), ms = api.dur(280);
        playSfx("move");
        function tick(now) {
          if (!st || g !== gen) return;
          var t = Math.min(1, (now - start) / ms), arc = Math.sin(t * Math.PI) * (size * 0.025);
          pl.anim = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - arc };
          drawFrame();
          if (t < 1) raf = window.requestAnimationFrame(tick);
          else { pl.pos = steps[i]; i++; stepNext(); }
        }
        raf = window.requestAnimationFrame(tick);
      }
      stepNext();
    }

    function animateJump(pl, dest, isLadder, onDone) {
      var g = gen, from = cellCenter(pl.pos, size), to = cellCenter(dest, size);
      var start = performance.now(), ms = api.dur(1000);
      playSfx(isLadder ? "ladder" : "snake");
      if (!isLadder) vibrate([35, 30, 35]);
      spawnSparks(from.x, from.y, isLadder ? "#34d399" : "#f43f5e", 16);
      function tick(now) {
        if (!st || g !== gen) return;
        var t = Math.min(1, (now - start) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var wave = isLadder ? 0 : Math.sin(t * Math.PI * 3) * (size * 0.035);
        pl.anim = { x: from.x + (to.x - from.x) * e + wave, y: from.y + (to.y - from.y) * e };
        drawFrame();
        if (t < 1) raf = window.requestAnimationFrame(tick);
        else {
          pl.pos = dest; pl.anim = null;
          spawnSparks(to.x, to.y, isLadder ? "#fbbf24" : "#f43f5e", 14);
          drawFrame(); if (onDone) onDone();
        }
      }
      raf = window.requestAnimationFrame(tick);
    }

    function pushOnlineState(nextTurn, winnerIdx, msg) {
      if (!rm || !st) return;
      var positions = st.players.map(function (p) { return p.pos; });
      var up = {
        "sl.positions": positions,
        "sl.turn": nextTurn,
        "sl.dice": st.dice,
        "sl.rollId": st.rollId,
        "sl.msg": msg
      };
      if (winnerIdx >= 0) { up.status = "finished"; up["sl.winner"] = winnerIdx; }
      rm.F.updateDoc(rm.ref, up).catch(function () { });
    }

    function finishTurn(rolledSix, isActor) {
      if (!st || st.winner) return;
      st.busy = false;
      var nextTurn = rolledSix ? st.turn : (st.turn + 1) % st.players.length;
      var msg = rolledSix ? (st.players[st.turn].name + " rolled 6! Roll again") : turnTxt(st.players[nextTurn].name);
      st.turn = nextTurn;
      setMsg(msg);
      if (rm && isActor) pushOnlineState(nextTurn, -1, msg);
      updateHUD();
      if (!rm) maybeBot();
    }

    function executeMove(pIdx, val, isActor) {
      var pl = st.players[pIdx], target = pl.pos + val, rolledSix = val === 6;
      if (rolledSix) playSfx("six");
      if (target > 100) {
        setMsg("Need exact " + (100 - pl.pos) + " to finish!");
        later(function () { finishTurn(rolledSix, isActor); }, api.dur(1000));
        return;
      }
      var path = [], s;
      for (s = pl.pos + 1; s <= target; s++) path.push(s);
      animatePath(pl, path, function () {
        updateHUD();
        if (pl.pos === 100) {
          st.winner = pl; st.busy = false;
          playSfx("win");
          var c = cellCenter(100, size); spawnSparks(c.x, c.y, "#fbbf24", 32);
          vibrate([40, 40, 80]);
          if (rm && isActor) pushOnlineState(st.turn, pIdx, pl.name + " wins!");
          later(function () { view = "result"; render(); }, api.dur(1300));
          return;
        }
        if (LADDERS[pl.pos]) {
          var up = LADDERS[pl.pos];
          setMsg(pl.name + " climbed ladder to " + up + "!");
          animateJump(pl, up, true, function () { updateHUD(); finishTurn(rolledSix, isActor); });
        } else if (SNAKES[pl.pos]) {
          var dn = SNAKES[pl.pos];
          setMsg("Snake slid " + pl.name + " to " + dn + "!");
          animateJump(pl, dn, false, function () { updateHUD(); finishTurn(rolledSix, isActor); });
        } else {
          finishTurn(rolledSix, isActor);
        }
      });
    }

    function canRollNow() {
      if (!st || st.busy || st.winner) return false;
      if (rm) return st.players[st.turn].uid === rm.uid;
      return !st.players[st.turn].bot;
    }

    function rollDice(byBot) {
      if (byBot === true) { if (rm || !st || st.busy || st.winner || !st.players[st.turn].bot) return; }
      else if (!canRollNow()) return;
      st.busy = true; updateHUD();
      playSfx("dice");
      var btn = q("#sl-dice-btn", host);
      if (btn) { btn.classList.remove("roll"); void btn.offsetWidth; btn.classList.add("roll"); }
      var ticks = 0, finalVal = 1 + Math.floor(Math.random() * 6);
      clearTimeout(diceT);
      var SLN = 12;
      (function slTick() {
        ticks++;
        var show = ticks >= SLN ? finalVal : 1 + Math.floor(Math.random() * 6);
        st.dice = show;
        if (btn) btn.innerHTML = diceSVG(show);
        if (ticks < SLN) { diceT = later(slTick, api.dur(70 + ticks * 12)); return; }
        st.rollId = (st.rollId || 0) + 1;
        if (rm) {
          rm.F.updateDoc(rm.ref, {
            "sl.lastMove": { by: st.turn, val: finalVal, id: st.rollId },
            "sl.dice": finalVal
          }).catch(function () { });
        }
        executeMove(st.turn, finalVal, true);
      })();
    }

    function maybeBot() {
      clearTimeout(botT);
      if (!st || st.busy || st.winner || rm) return;
      if (st.players[st.turn].bot) botT = later(function () { rollDice(true); }, api.dur(1200));
    }

    function sendEmoji(emo) {
      if (!st) return;
      var myIdx = rm ? st.players.findIndex(function (p) { return p.uid === rm.uid; }) : st.turn;
      if (myIdx < 0) myIdx = 0;
      showReaction(myIdx, emo);
      playSfx("click");
      if (rm) rm.F.updateDoc(rm.ref, { "sl.react": { by: myIdx, emo: emo, id: Date.now() } }).catch(function () { });
    }

    /* ---------- Online Rooms for Snakes & Ladders ---------- */
    function leaveOnline() {
      if (!rm) return;
      var r = rm; rm = null; st = null; gen++;
      clearTimeout(r.wd);
      if (r.unsub) r.unsub();
      if (r.isHost && r.data && r.data.status === "waiting") r.F.deleteDoc(r.ref).catch(function () { });
      view = "setup"; render();
    }

    function createOnlineRoom() {
      if (busy) return;
      var name = (cfg.myName || "").trim() || savedName();
      saveName(name); busy = true;
      var msg = q("#sl-net-msg", host); if (msg) msg.textContent = "Creating room…";
      loadFb().then(function (f) {
        var tries = 0, F = f.F;
        function attempt() {
          var code = String(1000 + Math.floor(Math.random() * 9000)), ref = F.doc(f.db, "battles", code);
          return F.getDoc(ref).then(function (s) { return s.exists(); }, function () { return true; }).then(function (taken) {
            if (taken) { if (++tries >= 8) throw { code: "no-code" }; return attempt(); }
            var pl = {}; pl[f.uid] = { name: name, joinedAt: Date.now() };
            return F.setDoc(ref, {
              gameType: "snakes", status: "waiting", hostId: f.uid, maxPlayers: cfg.count,
              expireAt: F.Timestamp.fromMillis(Date.now() + EXPIRE_MS), players: pl
            }).then(function () { return { code: code, ref: ref, f: f }; });
          });
        }
        return attempt();
      }).then(function (res) {
        attachRoom(res.code, res.ref, res.f, true);
      }).catch(function (e) {
        if (msg) msg.textContent = fbErr(e);
      }).then(function () { busy = false; });
    }

    function joinOnlineRoom(codeInput) {
      var code = String(codeInput || cfg.code || "").replace(/\D/g, "");
      if (code.length !== 4 || busy) {
        var m = q("#sl-net-msg", host); if (m) m.textContent = "Enter a valid 4-digit room code.";
        return;
      }
      var name = (cfg.myName || "").trim() || savedName();
      saveName(name); busy = true;
      var msg = q("#sl-net-msg", host); if (msg) msg.textContent = "Joining room " + code + "…";
      loadFb().then(function (f) {
        var F = f.F, ref = F.doc(f.db, "battles", code);
        return F.getDoc(ref).then(function (s) {
          if (!s.exists()) throw { code: "nf" };
          var d = s.data();
          if (d.gameType !== "snakes") throw { code: "wrong-game" };
          if (d.status !== "waiting" && !(d.players && d.players[f.uid])) throw { code: "started" };
          if (!d.players[f.uid] && Object.keys(d.players).length >= d.maxPlayers) throw { code: "full" };
          var up = {}; up["players." + f.uid] = { name: name, joinedAt: Date.now() };
          return F.updateDoc(ref, up).then(function () { return { code: code, ref: ref, f: f }; });
        });
      }).then(function (res) {
        attachRoom(res.code, res.ref, res.f, false);
      }).catch(function (e) {
        if (msg) msg.textContent = fbErr(e);
      }).then(function () { busy = false; });
    }

    function startOnlineMatch() {
      if (!rm || !rm.isHost || !rm.data) return;
      var d = rm.data, uids = Object.keys(d.players).sort(function (a, b) {
        return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0);
      });
      if (uids.length < 2) return;
      var pos = uids.map(function () { return 1; });
      rm.F.updateDoc(rm.ref, {
        status: "playing",
        sl: { order: uids, positions: pos, turn: 0, dice: 6, rollId: 0, msg: d.players[uids[0]].name + "'s turn" }
      }).catch(function () { });
    }

    function armWatch(turnIdx, sig) {
      if (!rm || !st || rm.sig === sig) return;
      rm.sig = sig; clearTimeout(rm.wd);
      var me = st.players.findIndex(function (p) { return p.uid === rm.uid; });
      if (me < 0 || me === turnIdx) return;
      var rank = 0, k;
      for (k = 0; k < me; k++) if (k !== turnIdx) rank++;
      rm.wd = setTimeout(function () {
        if (!rm || !st || st.winner || rm.sig !== sig) return;
        var nx = (turnIdx + 1) % st.players.length;
        rm.F.updateDoc(rm.ref, { "sl.turn": nx, "sl.msg": st.players[turnIdx].name + " timed out — " + turnTxt(st.players[nx].name) }).catch(function () { });
      }, 60000 + rank * 8000);
    }

    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastRollId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { clearTimeout(rm.wd); rm = null; st = null; gen++; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.sl) {
          var sl = d.sl, cols = slColors();
          if (!st || view !== "game") {
            var pls = sl.order.map(function (u, idx) {
              return { uid: u, name: (d.players[u] && d.players[u].name) || "Player " + (idx + 1), color: cols[idx], pos: sl.positions[idx] || 1, bot: false, anim: null };
            });
            st = { players: pls, turn: sl.turn || 0, dice: sl.dice || 6, rollId: sl.rollId || 0, busy: false, winner: null, msg: sl.msg || "" };
            gen++; rm.lastRollId = (sl.lastMove && sl.lastMove.id) || 0;
            particles = []; view = "game"; render();
          }
          armWatch(sl.turn || 0, JSON.stringify([sl.turn, sl.positions, sl.lastMove && sl.lastMove.id]));
          if (sl.react && sl.react.id && sl.react.id !== rm.lastReactId) {
            rm.lastReactId = sl.react.id;
            var myIdx = st.players.findIndex(function (p) { return p.uid === rm.uid; });
            if (sl.react.by !== myIdx) showReaction(sl.react.by, sl.react.emo);
          }
          if (sl.lastMove && sl.lastMove.id && sl.lastMove.id > rm.lastRollId) {
            rm.lastRollId = sl.lastMove.id;
            var actorIdx = sl.lastMove.by;
            if (st.players[actorIdx] && st.players[actorIdx].uid !== rm.uid) {
              st.busy = true; st.dice = sl.lastMove.val;
              var btn = q("#sl-dice-btn", host); if (btn) btn.innerHTML = diceSVG(st.dice);
              playSfx("dice");
              executeMove(actorIdx, sl.lastMove.val, false);
            }
          } else if (!st.busy) {
            st.turn = sl.turn;
            st.players.forEach(function (p, i) { if (sl.positions[i]) p.pos = sl.positions[i]; });
            if (sl.msg) setMsg(sl.msg);
            updateHUD(); drawFrame();
          }
        } else if (d.status === "finished" && d.sl) {
          clearTimeout(rm.wd);
          if (!st) {
            var fcols = slColors();
            st = { players: d.sl.order.map(function (u, idx) {
              return { uid: u, name: (d.players[u] && d.players[u].name) || "Player " + (idx + 1), color: fcols[idx], pos: 1, bot: false, anim: null };
            }), turn: 0, dice: d.sl.dice || 6, rollId: d.sl.rollId || 0, busy: false, winner: null, msg: "" };
          }
          var wIdx = d.sl.winner != null ? d.sl.winner : 0;
          st.players.forEach(function (p, i) { if (d.sl.positions[i]) p.pos = d.sl.positions[i]; });
          st.winner = st.players[wIdx] || st.players[0];
          view = "result"; render();
        }
      });
    }

    function startOfflineMatch() {
      gen++; clearTimeout(diceT); clearTimeout(botT); rm = null;
      var cols = slColors(), pls = [], i, nm;
      for (i = 0; i < cfg.count; i++) {
        nm = (cfg.names[i] || "").trim() || (cfg.mode === "ai" && i > 0 ? "Bot " + i : "Player " + (i + 1));
        pls.push({ name: nm, color: cols[i], pos: 1, bot: cfg.mode === "ai" && i > 0, anim: null });
      }
      st = { players: pls, turn: 0, dice: 6, rollId: 0, busy: false, winner: null, msg: pls[0].name + "'s turn — Tap dice!" };
      particles = []; view = "game"; render();
    }

    function updateHUD() {
      if (!st || !host) return;
      var pl = st.players[st.turn], btn = q("#sl-dice-btn", host), can = canRollNow();
      if (btn) btn.disabled = !can;
      var hint = q("#sl-roll-hint", host);
      if (hint) {
        if (st.busy) hint.textContent = "Moving…";
        else if (rm) hint.textContent = can ? "Your turn — Tap dice!" : "Waiting for " + pl.name + "…";
        else hint.textContent = pl.bot ? pl.name + " is rolling…" : "Tap dice to roll";
      }
      qa(".bg-pchip", host).forEach(function (el, idx) {
        el.classList.toggle("turn", idx === st.turn);
        var dot = el.querySelector(".bg-dot");
        if (dot && st.players[idx]) dot.style.background = st.players[idx].color;
        var posEl = el.querySelector(".sl-pos");
        if (posEl && st.players[idx]) posEl.textContent = "#" + st.players[idx].pos;
      });
    }

    function renderSetup() {
      var m = cfg.mode, cols = slColors(), i, h = '<div class="bg-box"><div class="ag-glass p-3.5 space-y-3">';
      h += '<div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2">' + ico("route", "qa-ac") + '<span class="text-base font-extrabold">Snakes &amp; Ladders</span></div><span class="text-xs qa-t2 font-bold">1 → 100</span></div>';
      h += '<div class="ag-seg">' +
        '<button type="button" data-sl="mode" data-k="ai" class="' + (m === "ai" ? "on" : "") + '">' + ico("bot") + 'AI Bot</button>' +
        '<button type="button" data-sl="mode" data-k="local" class="' + (m === "local" ? "on" : "") + '">' + ico("users") + 'Pass &amp; Play</button>' +
        '<button type="button" data-sl="mode" data-k="online" class="' + (m === "online" ? "on" : "") + '">' + ico("wifi") + 'Online</button></div>';

      if (m === "online") {
        h += '<div><div class="ag-lbl" style="margin-top:0">Your Name</div><input class="bg-in" type="text" maxlength="14" data-sl-myname="1" value="' + esc(cfg.myName) + '" placeholder="Player"></div>';
        h += '<div><div class="ag-lbl" style="margin-top:0">Room Size</div><div class="ag-seg">' +
          [2, 3, 4].map(function (n) { return '<button type="button" data-sl="count" data-k="' + n + '" class="' + (cfg.count === n ? "on" : "") + '">' + n + 'P</button>'; }).join("") +
          '</div></div>';
        h += '<button type="button" class="bg-cta" data-sl="create">' + ico("plus") + 'Create Online Room</button>';
        h += '<div class="flex gap-1.5"><input id="sl-code-in" class="bg-in" style="width:6.2rem;text-align:center;letter-spacing:.22em;font-weight:800" type="text" inputmode="numeric" maxlength="4" placeholder="0000" value="' + esc(cfg.code) + '">' +
          '<button type="button" class="bg-sec flex-1 font-extrabold" data-sl="join">' + ico("log-in") + 'Join Room</button></div>';
        h += '<div id="sl-net-msg" class="text-xs qa-t2 text-center"></div>';
      } else {
        h += '<div><div class="ag-lbl" style="margin-top:0">Players</div><div class="ag-seg">' +
          [2, 3, 4].map(function (n) { return '<button type="button" data-sl="count" data-k="' + n + '" class="' + (cfg.count === n ? "on" : "") + '">' + n + ' Players</button>'; }).join("") +
          '</div></div>';
        h += '<div class="grid grid-cols-2 gap-2">';
        for (i = 0; i < cfg.count; i++) {
          var def = m === "ai" ? (i === 0 ? "You" : "Bot " + i) : "Player " + (i + 1);
          var val = cfg.names[i] && cfg.names[i].indexOf("Player ") !== 0 && cfg.names[i].indexOf("Bot ") !== 0 && cfg.names[i] !== "You" ? cfg.names[i] : def;
          cfg.names[i] = val;
          h += '<div class="flex items-center gap-1.5"><span class="bg-dot" style="background:' + cols[i] + '"></span>' +
            '<input class="bg-in" type="text" maxlength="14" data-sl-name="' + i + '" value="' + esc(val) + '"' + (m === "ai" && i > 0 ? " readonly" : "") + '></div>';
        }
        h += '</div><button type="button" class="bg-cta" data-sl="start">' + ico("play") + 'Start Game</button>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderLobby() {
      var d = rm.data, cols = slColors(), uids = Object.keys(d.players).sort(function (a, b) { return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0); });
      var wa = "https://wa.me/?text=" + encodeURIComponent("Join my ITI CONNECT Snakes & Ladders room! 🎲\nCode: " + rm.code + "\n" + INVITE_BASE + rm.code + "&game=snakes");
      var h = '<div class="bg-box"><div class="ag-glass p-4 text-center space-y-3">';
      h += '<div class="flex items-center justify-between"><span class="text-sm font-extrabold">Snakes &amp; Ladders Room</span><button type="button" class="bg-sec" style="padding:.4rem .6rem" data-sl="leave">' + ico("x") + '</button></div>';
      h += '<div><div class="text-xs qa-t2 font-bold">ROOM CODE</div><div class="bg-code">' + rm.code + '</div></div>';
      h += '<div class="grid grid-cols-2 gap-2"><button type="button" class="bg-sec" data-sl="copy">' + ico("copy") + 'Copy Code</button>' +
        '<a class="bg-sec" style="text-decoration:none" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + 'WhatsApp</a></div>';
      h += '<div class="space-y-1.5 text-left">';
      for (var i = 0; i < d.maxPlayers; i++) {
        var u = uids[i];
        h += '<div class="bg-pchip"><span class="bg-dot" style="background:' + cols[i] + '"></span><span class="flex-1 truncate">' +
          (u ? esc(d.players[u].name) + (u === rm.uid ? " (You)" : "") : '<span class="qa-t2">Waiting for friend…</span>') + '</span></div>';
      }
      h += '</div>';
      if (rm.isHost) {
        h += '<button type="button" class="bg-cta" data-sl="onstart"' + (uids.length < 2 ? " disabled" : "") + '>' + ico("play") + 'Start Match (' + uids.length + '/' + d.maxPlayers + ')</button>';
      } else {
        h += '<div class="text-xs qa-t2">Waiting for host to start…</div>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderGame() {
      var h = '<div class="bg-box space-y-2.5">';
      h += '<div class="ag-glass p-2.5 flex items-center justify-between gap-2">' +
        '<button type="button" class="bg-sec" style="padding:.45rem .6rem" data-sl="quit" aria-label="Quit game">' + ico("x") + '</button>' +
        '<div id="sl-msg" class="text-xs font-extrabold text-center truncate flex-1">' + esc(st.msg) + '</div>' +
        '<button type="button" class="bg-sec" style="padding:.45rem .6rem" data-sl="studio" title="Arena Studio">' + ico("sparkles") + '</button></div>';
      h += '<div class="bg-cv-wrap ag-glass"><canvas id="sl-canvas" class="bg-cv"></canvas></div>';
      h += '<div class="ag-glass p-2.5 space-y-2"><div class="flex items-center gap-2.5">' +
        '<button type="button" id="sl-dice-btn" class="bg-dice" data-sl="roll" aria-label="Roll dice">' + diceSVG(st.dice) + '</button>' +
        '<div class="min-w-0 flex-1 space-y-1.5">' +
        '<div id="sl-roll-hint" class="text-xs font-extrabold">Tap dice to roll</div>' +
        '<div class="grid grid-cols-2 gap-1.5">' + st.players.map(function (pl, idx) {
          return '<div id="sl-chip-' + idx + '" class="bg-pchip' + (idx === st.turn ? " turn" : "") + '"><span class="bg-dot" style="background:' + pl.color + '"></span>' +
            '<span class="truncate flex-1">' + esc(pl.name) + '</span><span class="sl-pos qa-ac font-extrabold">#' + pl.pos + '</span></div>';
        }).join("") + '</div></div></div>';
      h += '<div class="bg-emo-bar">' + ["👏", "😂", "🔥", "😱"].map(function (em) {
        return '<button type="button" class="bg-emo" data-sl="emo" data-k="' + em + '">' + em + '</button>';
      }).join("") + '</div></div></div>';
      host.innerHTML = h; icons();
      cv = q("#sl-canvas", host); ctx = cv.getContext("2d");
      if (!off) { off = document.createElement("canvas"); offCtx = off.getContext("2d"); }
      offKey = "";
      window.requestAnimationFrame(function () { resizeBoard(); updateHUD(); maybeBot(); });
    }

    function renderResult() {
      var ranked = st.players.slice().sort(function (a, b) { return b.pos - a.pos; });
      var medals = ["🥇", "🥈", "🥉", "4️⃣"];
      var h = '<div class="bg-box"><div class="ag-glass p-4 text-center space-y-3">';
      h += '<div class="text-xs font-extrabold qa-t2 uppercase tracking-wider">Snakes &amp; Ladders</div>';
      h += '<div class="text-xl font-extrabold">' + esc(ranked[0].name) + ' Wins! 🏆</div>';
      h += '<div class="space-y-1.5 text-left">' + ranked.map(function (pl, idx) {
        return '<div class="bg-pchip' + (idx === 0 ? " turn" : "") + '"><span>' + medals[idx] + '</span>' +
          '<span class="bg-dot" style="background:' + pl.color + '"></span>' +
          '<span class="truncate flex-1">' + esc(pl.name) + '</span>' +
          '<span class="font-extrabold qa-ac">' + (pl.pos === 100 ? "100 ★" : "Tile " + pl.pos) + '</span></div>';
      }).join("") + '</div>';
      h += '<div class="grid grid-cols-2 gap-2 pt-1">' +
        (rm ? '<button type="button" class="bg-cta col-span-2" data-sl="leave">' + ico("log-out") + 'Leave Room</button>' :
          '<button type="button" class="bg-cta" data-sl="start">' + ico("rotate-ccw") + 'Play Again</button>' +
          '<button type="button" class="bg-sec" data-sl="setup">' + ico("sliders-horizontal") + 'Setup</button>') +
        '</div></div></div>';
      host.innerHTML = h; icons();
    }

    function render() {
      if (!host) return;
      setPlaying(view === "game" && !!st);
      if (view === "lobby" && rm) renderLobby();
      else if (view === "game" && st) renderGame();
      else if (view === "result" && st) renderResult();
      else { view = "setup"; renderSetup(); }
    }

    registerGame("snakes", {
      mount: function (el) {
        host = el;
        host.addEventListener("click", function (e) {
          var b = e.target.closest && e.target.closest("[data-sl]");
          if (!b || !host.contains(b)) return;
          var a = b.getAttribute("data-sl"), k = b.getAttribute("data-k");
          if (a === "mode") {
            cfg.mode = k;
            if (k === "ai") cfg.names = ["You", "Bot 1", "Bot 2", "Bot 3"];
            else if (k === "local") cfg.names = ["Player 1", "Player 2", "Player 3", "Player 4"];
            playSfx("click"); renderSetup();
          } else if (a === "count") { cfg.count = +k; playSfx("click"); renderSetup(); }
          else if (a === "start") { playSfx("click"); startOfflineMatch(); }
          else if (a === "create") { playSfx("click"); createOnlineRoom(); }
          else if (a === "join") { playSfx("click"); joinOnlineRoom((q("#sl-code-in", host) || {}).value); }
          else if (a === "onstart") { playSfx("click"); startOnlineMatch(); }
          else if (a === "copy" && rm) { copyText(rm.code); playSfx("click"); }
          else if (a === "leave") { playSfx("click"); leaveOnline(); }
          else if (a === "setup") { playSfx("click"); view = "setup"; render(); }
          else if (a === "studio") { toggleInGameStudio(); }
          else if (a === "roll") { rollDice(); }
          else if (a === "emo") { sendEmoji(k); }
          else if (a === "quit") {
            var now = Date.now();
            if (now - quitT < 2500) {
              gen++; clearTimeout(diceT); clearTimeout(botT);
              if (rm) leaveOnline(); else { st = null; view = "setup"; render(); }
            } else { quitT = now; setMsg("Tap ✕ again to quit"); }
          }
        });
        host.addEventListener("input", function (e) {
          var idx = e.target.getAttribute && e.target.getAttribute("data-sl-name");
          if (idx != null) cfg.names[+idx] = e.target.value.slice(0, 14);
          if (e.target.getAttribute("data-sl-myname")) cfg.myName = e.target.value.slice(0, 14);
          if (e.target.id === "sl-code-in") { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); cfg.code = e.target.value; }
        });
        api.subscribe(function (_, key) {
          if (key === "palette" || key === "all") {
            var cols = slColors();
            if (st) { st.players.forEach(function (p, i) { p.color = cols[i]; }); updateHUD(); }
            else if (view === "setup") renderSetup();
          }
          if (key === "style" || key === "board" || key === "piece" || key === "palette" || key === "theme" || key === "all") {
            offKey = ""; drawFrame();
          }
        });
        render();
      },
      onShow: function () { setPlaying(view === "game" && !!st); resizeBoard(); kickLoop(); },
      onHide: function () { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    });
  })();

  /* =====================================================================
   * GAME 2: LUDO ARENA v3 (Arena Studio: 10 Themes, 8 Pieces, 6 Dice Skins,
   * 5 Palettes, 5 Trail FX, 3 Center Emblems + Mid-Game Live Customization)
   * ===================================================================== */
  (function () {
    var SEAT_NAMES = ["Red", "Green", "Yellow", "Blue"];
    var START_IDX = [0, 13, 26, 39];
    var SAFE_TRACK = [0, 8, 13, 21, 26, 34, 39, 47];

    var TRACK = [
      [1,6],[2,6],[3,6],[4,6],[5,6],
      [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
      [7,0],
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],
      [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
      [14,7],
      [14,8],[13,8],[12,8],[11,8],[10,8],[9,8],
      [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
      [7,14],
      [6,14],[6,13],[6,12],[6,11],[6,10],[6,9],
      [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
      [0,7],[0,6]
    ];
    var HOME_LANES = [
      [[1,7],[2,7],[3,7],[4,7],[5,7]],
      [[7,1],[7,2],[7,3],[7,4],[7,5]],
      [[13,7],[12,7],[11,7],[10,7],[9,7]],
      [[7,13],[7,12],[7,11],[7,10],[7,9]]
    ];
    var YARD_SPOTS = [
      [[1.8,1.8],[4.2,1.8],[1.8,4.2],[4.2,4.2]],
      [[10.8,1.8],[13.2,1.8],[10.8,4.2],[13.2,4.2]],
      [[10.8,10.8],[13.2,10.8],[10.8,13.2],[13.2,13.2]],
      [[1.8,10.8],[4.2,10.8],[1.8,13.2],[4.2,13.2]]
    ];
    var FINISH_SPOTS = [
      [[6.35,7.1],[6.35,7.9],[6.6,7.5],[6.15,7.5]],
      [[7.1,6.35],[7.9,6.35],[7.5,6.6],[7.5,6.15]],
      [[8.65,7.1],[8.65,7.9],[8.4,7.5],[8.85,7.5]],
      [[7.1,8.65],[7.9,8.65],[7.5,8.4],[7.5,8.85]]
    ];
    var YARDS = [[0, 0], [9, 0], [9, 9], [0, 9]];
    var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    var FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
    var REDUCE = false;
    try { REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { }

    var host = null, view = "setup";
    var cfg = { mode: "ai", turbo: true, count: 2, myName: savedName(), names: ["You", "Bot 1", "Bot 2", "Bot 3"], code: "" };
    var st = null, rm = null, busy = false;
    var cv = null, ctx = null, off = null, offCtx = null, offKey = "", size = 0, dpr = 1;
    var raf = 0, lastT = 0, botT = 0, diceT = 0, quitT = 0, particles = [];
    var gen = 0;
    function later(fn, ms) { var g = gen; return setTimeout(function () { if (g !== gen) return; fn(); }, ms); }
    var dieRot = { x: 0, y: 0 }, lastTurnShown = -1, resizeBound = false;

    if (pendingInvite && pendingInvite.game === "ludo") {
      cfg.mode = "online"; cfg.code = pendingInvite.code;
    }

    function seatColors() { return getPalette(); }

    /* ---------------------------------------------------------------
     * Styles (scoped under #quiz-arena-root, prefix lx- + 6 Dice Skins)
     * --------------------------------------------------------------- */
    function lxCss() {
      if (document.getElementById("lx-style")) return;
      var R = "#quiz-arena-root ", c = [
        R + ".lx{max-width:30rem;margin:0 auto;color:var(--ag-tx)}",
        R + ".ag-playing .lx{max-width:none}",
        R + ".lx *{box-sizing:border-box}",
        R + ".lx button," + R + ".lx input{font:inherit;color:inherit}",
        R + ".lx button{cursor:pointer;-webkit-tap-highlight-color:transparent}",
        R + ".lx button:disabled{cursor:default}",
        R + ".lx-gap{display:flex;flex-direction:column;gap:10px}",
        R + ".lx-enter{animation:lxEnter .55s cubic-bezier(.2,.9,.3,1.1) both}",

        /* hero */
        R + ".lx-hero{position:relative;overflow:hidden;border-radius:22px;padding:18px 16px;color:#fff;border:1px solid rgba(255,255,255,.14);background:radial-gradient(120% 100% at 90% -10%,rgba(251,191,36,.38),transparent 55%),radial-gradient(90% 90% at -10% 110%,rgba(56,189,248,.32),transparent 55%),radial-gradient(70% 70% at 50% 125%,rgba(239,68,68,.25),transparent 60%),linear-gradient(160deg,#1e1b4b,#0b1020);box-shadow:0 18px 40px -18px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.18)}",
        R + ".lx-hero-in{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px}",
        R + ".lx-kick{font-size:10.5px;font-weight:800;letter-spacing:.3em;color:#fde68a;opacity:.9}",
        R + ".lx-title{font-size:40px;line-height:.95;font-weight:900;letter-spacing:.03em;margin-top:4px;background:linear-gradient(180deg,#fff,#fde68a 55%,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}",
        R + ".lx-title span{display:block;font-size:15px;letter-spacing:.55em;margin-top:7px;background:linear-gradient(90deg,#ef4444,#facc15,#22c55e,#38bdf8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
        R + ".lx-sub{font-size:12px;font-weight:600;color:#cbd5e1;margin-top:9px}",
        R + ".lx-orb{position:absolute;z-index:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,currentColor 58%);box-shadow:0 0 16px currentColor;animation:lxDrift 6s ease-in-out infinite}",
        R + ".lx-hero .lx-die{--s:62px;margin:6px 10px 6px 0}",

        /* setup controls */
        R + ".lx-card{padding:14px}",
        R + ".lx-lbl{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ag-t2);margin:0 0 6px}",
        R + ".lx-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
        R + ".lx-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
        R + ".lx-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px 9px;border-radius:16px;background:var(--ag-bg2);border:1.5px solid var(--ag-bd);text-align:center;transition:transform .15s,border-color .2s,background .2s,box-shadow .2s}",
        R + ".lx-tile:active{transform:scale(.96)}",
        R + ".lx-tile .ic{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--ag-on);color:var(--ag-ac);font-size:18px;line-height:1}",
        R + ".lx-tile .ic .ag-i{width:18px;height:18px}",
        R + ".lx-tile .t{font-size:12px;font-weight:800}",
        R + ".lx-tile .s{font-size:10px;font-weight:600;color:var(--ag-t2)}",
        R + ".lx-tile .dots{display:flex;gap:3px;height:10px;align-items:center}",
        R + ".lx-tile .dots i{width:9px;height:9px;border-radius:50%;box-shadow:inset -1px -1px 2px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.5)}",
        R + ".lx-tile.on{border-color:var(--ag-onb);background:var(--ag-on);box-shadow:0 0 0 1px var(--ag-onb),0 10px 22px -10px rgba(245,158,11,.65)}",
        R + ".lx-nr{display:flex;align-items:center;gap:8px;padding:5px 8px 5px 5px;border-radius:14px;background:var(--ag-bg2);border:1.5px solid var(--ag-bd);min-width:0}",
        R + ".lx-nr input{flex:1;min-width:0;background:transparent;border:0;outline:none;font-size:13px;font-weight:700}",
        R + ".lx-pawn{width:26px;height:26px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,#fff,var(--c) 52%,var(--cd));box-shadow:0 3px 8px -3px var(--c)}",
        R + ".lx-in{width:100%;padding:.6rem .8rem;border-radius:14px;font-size:13px;font-weight:700;background:var(--ag-bg2);border:1.5px solid var(--ag-bd);outline:none}",
        R + ".lx-in:focus{border-color:var(--ag-onb)}",
        R + ".lx-cta{position:relative;overflow:hidden;width:100%;display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.9rem 1rem;border-radius:16px;font-weight:900;font-size:15px;letter-spacing:.03em;color:#1f1300!important;background:linear-gradient(135deg,#fde68a,#fbbf24 40%,#f59e0b 75%,#d97706);border:1px solid rgba(255,255,255,.45);box-shadow:0 12px 26px -10px rgba(245,158,11,.85),0 1px 0 rgba(255,255,255,.6) inset,0 -3px 0 rgba(180,83,9,.45) inset;transition:transform .12s}",
        R + ".lx-cta::after{content:'';position:absolute;top:0;bottom:0;width:38%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);transform:skewX(-20deg);animation:lxShine 2.8s ease-in-out infinite}",
        R + ".lx-cta:active:not(:disabled){transform:translateY(2px) scale(.99)}",
        R + ".lx-cta:disabled{opacity:.45;box-shadow:none}",
        R + ".lx-cta:disabled::after{display:none}",
        R + ".lx-code{display:flex;justify-content:center;gap:8px}",
        R + ".lx-dg{width:50px;height:64px;border-radius:14px;display:grid;place-items:center;font-size:34px;font-weight:900;color:var(--ag-ac);background:var(--ag-bg2);border:1.5px solid var(--ag-onb);box-shadow:0 0 22px -6px var(--ag-onb),inset 0 1px 0 rgba(255,255,255,.2);animation:lxEnter .5s both}",
        R + ".lx-slot{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:var(--ag-bg2);border:1.5px solid var(--ag-bd);font-size:13px;font-weight:800;min-width:0}",
        R + ".lx-slot.me{border-color:var(--ag-onb);background:var(--ag-on)}",
        R + ".lx-wait{display:inline-flex;gap:4px}",
        R + ".lx-wait i{width:6px;height:6px;border-radius:50%;background:var(--ag-t2);animation:lxDot 1.2s ease-in-out infinite}",
        R + ".lx-wait i:nth-child(2){animation-delay:.2s}",
        R + ".lx-wait i:nth-child(3){animation-delay:.4s}",

        /* in-game HUD */
        R + ".lx-top{display:flex;align-items:center;gap:6px}",
        R + ".lx-ib{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--ag-bg2);border:1px solid var(--ag-bd);flex:none}",
        R + ".lx-ib.studio{color:var(--ag-ac);border-color:var(--ag-onb);background:var(--ag-on)}",
        R + ".lx-msg{flex:1;min-width:0;text-align:center;font-size:12px;font-weight:800;padding:.5rem .7rem;border-radius:999px;background:var(--ag-bg2);border:1px solid var(--ag-bd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
        R + ".lx-pill{padding:.45rem .68rem;border-radius:999px;font-size:11px;font-weight:800;background:var(--ag-bg2);border:1px solid var(--ag-bd);flex:none}",
        R + ".lx-pill.on{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",
        R + ".lx-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
        R + ".lx-pc{position:relative;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 6px;border-radius:18px;min-width:0;background:linear-gradient(135deg,var(--c),var(--cd));border:2px solid rgba(255,255,255,.3);box-shadow:0 6px 14px -8px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.35);opacity:.7;transform:scale(.96);transition:transform .3s cubic-bezier(.2,1.4,.4,1),opacity .25s,box-shadow .25s}",
        R + ".lx-pc.turn{opacity:1;transform:scale(1.035);border-color:#fff;box-shadow:0 0 0 2px var(--c),0 0 24px 3px var(--c),0 10px 20px -8px rgba(0,0,0,.7);animation:lxGlow 1.3s ease-in-out infinite}",
        R + ".lx-av{position:relative;isolation:isolate;width:36px;height:36px;flex:none;display:grid;place-items:center;font-weight:900;font-size:16px;color:var(--cd)}",
        R + ".lx-av::after{content:'';position:absolute;inset:0;border-radius:50%;background:#fff;z-index:1;box-shadow:0 2px 4px rgba(0,0,0,.3)}",
        R + ".lx-av b{position:relative;z-index:2}",
        R + ".lx-pc.turn .lx-av::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(#fff,rgba(255,255,255,0) 38%,#fde047 55%,rgba(255,255,255,0) 80%,#fff);animation:lxSpinZ 1.2s linear infinite;z-index:0}",
        R + ".lx-nfo{flex:1;min-width:0;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)}",
        R + ".lx-nm{font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
        R + ".lx-tks{display:flex;gap:4px;margin-top:4px}",
        R + ".lx-tk{width:11px;height:11px;border-radius:50%;background:rgba(0,0,0,.3);border:1.5px solid rgba(255,255,255,.75);transition:all .3s}",
        R + ".lx-tk.done{background:#fde047;border-color:#fff;box-shadow:0 0 8px #fde047}",
        R + ".lx-last{width:26px;height:26px;border-radius:9px;flex:none;display:grid;place-items:center;font-weight:900;font-size:14px;background:rgba(255,255,255,.92);color:var(--cd);box-shadow:0 2px 0 rgba(0,0,0,.25)}",
        R + ".lx-last.pop{animation:lxLand .45s ease-out}",
        R + ".lx-bw{position:relative;width:100%;max-width:520px;margin:2px auto;aspect-ratio:1/1}",
        R + ".ag-playing .lx-bw{width:min(100%,calc(100vh - 372px));width:min(100%,calc(100dvh - 372px));min-width:240px}",
        R + ".lx-bw.shake{animation:lxShake .45s ease-in-out}",
        R + ".lx-cv{display:block;width:100%;height:100%;touch-action:manipulation;border-radius:4.5%;box-shadow:0 22px 44px -16px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06)}",
        R + ".lx-toast{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%) scale(.5);opacity:0;pointer-events:none;z-index:6;font-weight:900;font-size:clamp(18px,6.2vw,30px);letter-spacing:.03em;color:#fff;white-space:nowrap;padding:.28rem 1rem;border-radius:999px;text-shadow:0 2px 0 rgba(0,0,0,.35);background:linear-gradient(135deg,var(--tc,#f59e0b),rgba(15,23,42,.8));border:2px solid rgba(255,255,255,.8);box-shadow:0 10px 30px -6px var(--tc,#f59e0b)}",
        R + ".lx-toast.go{animation:lxToast 1.25s cubic-bezier(.2,1.2,.4,1) forwards}",

        /* dock + 3D dice + 6 bespoke dice skins */
        R + ".lx-dock{--dc:#fbbf24;--dp:#a16207;--dpl:#facc15;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 8px 8px;border-radius:22px;background:var(--ag-bg);border:1px solid var(--ag-bd);box-shadow:var(--ag-sh);position:relative}",
        R + ".lx-side{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px;min-width:0}",
        R + ".lx-emo{padding:.4rem 0;border-radius:.9rem;font-size:18px;line-height:1.1;background:var(--ag-bg2);border:1px solid var(--ag-bd);transition:transform .15s}",
        R + ".lx-emo:active{transform:scale(.8) rotate(-8deg)}",
        R + ".lx-ctr{display:flex;flex-direction:column;align-items:center;flex:none;width:112px}",
        R + ".lx-dwrap{position:relative;padding:12px 18px 10px}",
        R + ".lx-dwrap::before{content:'';position:absolute;left:50%;top:50%;width:74px;height:74px;margin:-43px 0 0 -37px;border-radius:50%;border:2px solid var(--dc);opacity:0;pointer-events:none}",
        R + ".lx-dwrap.ready::before{animation:lxPulse 1.4s ease-out infinite}",
        R + ".lx-sh{position:absolute;left:50%;bottom:2px;width:54px;height:9px;margin-left:-27px;border-radius:50%;background:radial-gradient(rgba(0,0,0,.5),transparent 70%)}",
        R + ".lx-dwrap.rolling .lx-sh{animation:lxSh var(--jd,1s) ease-in-out}",
        R + ".lx-die{--s:62px;position:relative;display:block;width:var(--s);height:var(--s);padding:0;border:0;background:transparent;perspective:380px;flex:none}",
        R + ".lx-die.ready{animation:lxFloat 1.4s ease-in-out infinite;filter:drop-shadow(0 0 10px var(--dc))}",
        R + ".lx-die.jump{animation:lxJump var(--jd,1s) cubic-bezier(.3,.6,.4,1)}",
        R + ".lx-die.land{animation:lxLand .45s ease-out}",
        R + ".lx-die:active:not(:disabled){transform:scale(.94)}",
        R + ".lx-tilt{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-20deg) rotateY(26deg)}",
        R + ".lx-cube{position:absolute;inset:0;transform-style:preserve-3d;transition:transform 1s cubic-bezier(.12,.75,.2,1)}",
        R + ".lx-cube.spin{transition:none;animation:lxSpin 9s linear infinite}",
        R + ".lx-f{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:calc(var(--s)*.15);border-radius:calc(var(--s)*.22);backface-visibility:hidden;-webkit-backface-visibility:hidden;background:linear-gradient(145deg,#ffffff,#eef2f7 55%,#c9d3e0);border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.9),inset 0 -3px 8px rgba(100,116,139,.35),inset 0 0 0 calc(var(--s)*.035) var(--dc)}",
        R + ".lx-f i{display:block;margin:auto;width:calc(var(--s)*.19);height:calc(var(--s)*.19);border-radius:50%}",
        R + ".lx-f i.o{background:radial-gradient(circle at 35% 30%,var(--dpl),var(--dp) 70%);box-shadow:inset 0 -2px 3px rgba(0,0,0,.35),0 1px 1px rgba(255,255,255,.9)}",
        /* Dice Skin 2: Obsidian Gold */
        "#quiz-arena-root[data-ag-dice='obsidian'] .lx-f{background:linear-gradient(145deg,#1e293b,#0f172a 60%,#020617);border-color:rgba(251,191,36,.65);box-shadow:inset 0 0 calc(var(--s)*.18) rgba(251,191,36,.2),inset 0 0 0 calc(var(--s)*.035) #fbbf24}",
        "#quiz-arena-root[data-ag-dice='obsidian'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#fef08a,#f59e0b 65%,#92400e);box-shadow:0 0 6px rgba(251,191,36,.65)}",
        /* Dice Skin 3: Cyber Glass */
        "#quiz-arena-root[data-ag-dice='neon'] .lx-f{background:linear-gradient(145deg,rgba(46,16,101,.92),rgba(15,10,40,.96));border-color:var(--dc);box-shadow:inset 0 0 calc(var(--s)*.24) var(--dc),inset 0 0 0 calc(var(--s)*.04) var(--dc)}",
        "#quiz-arena-root[data-ag-dice='neon'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#22d3ee 60%,#0891b2);box-shadow:0 0 8px #22d3ee}",
        /* Dice Skin 4: 24K Gold */
        "#quiz-arena-root[data-ag-dice='gold'] .lx-f{background:linear-gradient(145deg,#fef9c3,#fbbf24 52%,#b45309);border-color:#fef08a;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.65),inset 0 0 0 calc(var(--s)*.035) #78350f}",
        "#quiz-arena-root[data-ag-dice='gold'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#92400e,#451a03 75%);box-shadow:0 1px 1px rgba(255,255,255,.6)}",
        /* Dice Skin 5: Frost Crystal */
        "#quiz-arena-root[data-ag-dice='crystal'] .lx-f{background:linear-gradient(145deg,#ffffff,#e0f2fe 45%,#7dd3fc);border-color:#ffffff;box-shadow:inset 0 0 calc(var(--s)*.25) #ffffff,inset 0 0 0 calc(var(--s)*.035) #0284c7}",
        "#quiz-arena-root[data-ag-dice='crystal'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#38bdf8,#0369a1 72%);box-shadow:0 0 5px rgba(56,189,248,.65)}",
        /* Dice Skin 6: Walnut Wood */
        "#quiz-arena-root[data-ag-dice='wood'] .lx-f{background:linear-gradient(145deg,#b45309,#78350f 55%,#451a03);border-color:#f59e0b;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(254,243,199,.22),inset 0 0 0 calc(var(--s)*.035) #f59e0b}",
        "#quiz-arena-root[data-ag-dice='wood'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#fef3c7 65%,#d97706);box-shadow:inset 0 -1px 2px rgba(0,0,0,.4)}",

        R + ".lx-f1{transform:translateZ(calc(var(--s)/2))}",
        R + ".lx-f6{transform:rotateY(180deg) translateZ(calc(var(--s)/2))}",
        R + ".lx-f2{transform:rotateY(90deg) translateZ(calc(var(--s)/2))}",
        R + ".lx-f5{transform:rotateY(-90deg) translateZ(calc(var(--s)/2))}",
        R + ".lx-f3{transform:rotateX(90deg) translateZ(calc(var(--s)/2))}",
        R + ".lx-f4{transform:rotateX(-90deg) translateZ(calc(var(--s)/2))}",
        R + ".lx-hint{min-height:26px;font-size:10.5px;line-height:1.25;font-weight:800;text-align:center;color:var(--ag-tx);display:flex;align-items:flex-start;justify-content:center}",

        /* result */
        R + ".lx-res{position:relative;overflow:hidden;border-radius:22px;padding:22px 14px 16px;text-align:center;color:#fff;border:1px solid rgba(255,255,255,.16);background:radial-gradient(100% 70% at 50% -5%,rgba(251,191,36,.45),transparent 60%),radial-gradient(80% 60% at 100% 100%,rgba(56,189,248,.25),transparent 60%),linear-gradient(170deg,#1e1b4b,#0b1020);box-shadow:0 20px 44px -18px rgba(0,0,0,.75)}",
        R + ".lx-res>*{position:relative;z-index:2}",
        R + ".lx-cf{position:absolute!important;top:-16px;z-index:1!important;width:8px;height:14px;border-radius:2px;opacity:0;animation:lxCf var(--t,3s) linear var(--d,0s) infinite}",
        R + ".lx-trophy{font-size:68px;line-height:1;animation:lxTrophy 1.8s ease-in-out infinite;filter:drop-shadow(0 10px 16px rgba(251,191,36,.65))}",
        R + ".lx-wt{font-size:11px;font-weight:800;letter-spacing:.4em;color:#fde68a;margin-top:6px}",
        R + ".lx-wn{font-size:28px;font-weight:900;margin:2px 0 14px;text-shadow:0 0 22px var(--wc,#fbbf24)}",
        R + ".lx-rk{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:14px;text-align:left;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);animation:lxEnter .5s both}",
        R + ".lx-rk.first{background:linear-gradient(135deg,rgba(251,191,36,.3),rgba(255,255,255,.08));border-color:rgba(251,191,36,.7);box-shadow:0 0 22px -6px #fbbf24}",
        R + ".lx-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden;margin-top:5px}",
        R + ".lx-bar i{display:block;height:100%;border-radius:99px;background:var(--c);box-shadow:0 0 10px var(--c)}",

        /* keyframes */
        "@keyframes lxEnter{0%{opacity:0;transform:translateY(14px) scale(.94)}100%{opacity:1;transform:none}}",
        "@keyframes lxShine{0%,55%{left:-60%}100%{left:130%}}",
        "@keyframes lxDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(8px,-12px)}}",
        "@keyframes lxDot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}",
        "@keyframes lxGlow{50%{box-shadow:0 0 0 2px var(--c),0 0 34px 7px var(--c),0 10px 20px -8px rgba(0,0,0,.7)}}",
        "@keyframes lxSpinZ{to{transform:rotate(360deg)}}",
        "@keyframes lxSpin{from{transform:rotateX(0) rotateY(0)}to{transform:rotateX(360deg) rotateY(720deg)}}",
        "@keyframes lxFloat{50%{transform:translateY(-7px)}}",
        "@keyframes lxJump{0%{transform:translateY(0) scale(1)}20%{transform:translateY(-38px) scale(1.28)}42%{transform:translateY(0) scale(1)}56%{transform:translateY(-16px) scale(1.12)}72%{transform:translateY(0) scale(1)}84%{transform:translateY(-5px)}100%{transform:translateY(0) scale(1)}}",
        "@keyframes lxLand{0%{transform:scale(1.28)}55%{transform:scale(.93)}100%{transform:scale(1)}}",
        "@keyframes lxSh{0%{transform:scale(1);opacity:1}20%{transform:scale(.45);opacity:.35}42%{transform:scale(1);opacity:1}56%{transform:scale(.7);opacity:.6}72%{transform:scale(1)}100%{transform:scale(1)}}",
        "@keyframes lxPulse{0%{transform:scale(.7);opacity:.85}100%{transform:scale(1.55);opacity:0}}",
        "@keyframes lxToast{0%{opacity:0;transform:translate(-50%,-30%) scale(.4)}22%{opacity:1;transform:translate(-50%,-50%) scale(1.14)}70%{opacity:1;transform:translate(-50%,-58%) scale(1)}100%{opacity:0;transform:translate(-50%,-95%) scale(.9)}}",
        "@keyframes lxShake{0%,100%{transform:translate(0,0)}15%{transform:translate(-6px,2px) rotate(-.6deg)}30%{transform:translate(6px,-2px) rotate(.6deg)}45%{transform:translate(-5px,-2px)}60%{transform:translate(4px,2px)}80%{transform:translate(-2px,0)}}",
        "@keyframes lxCf{0%{opacity:1;transform:translate3d(0,0,0) rotate(0)}100%{opacity:1;transform:translate3d(var(--x,20px),560px,0) rotate(720deg)}}",
        "@keyframes lxTrophy{0%,100%{transform:translateY(0) rotate(-4deg) scale(1)}50%{transform:translateY(-8px) rotate(4deg) scale(1.08)}}",
        "@media(prefers-reduced-motion:reduce){" + R + ".lx *{animation:none!important}" + R + ".lx-cube{transition:none!important}" + R + ".lx-toast{opacity:1}}"
      ];
      var s = document.createElement("style"); s.id = "lx-style"; s.textContent = c.join("\n");
      document.head.appendChild(s);
    }

    function drawStarFill(c, cx, cy, r, fill, stroke) {
      c.save(); c.translate(cx, cy); c.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.46 : r;
        if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      c.closePath(); c.fillStyle = fill; c.fill();
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = Math.max(1, r * 0.1); c.stroke(); }
      c.restore();
    }
    function arrow(c, px, py, dx, dy, s, col) {
      c.save(); c.translate(px, py); c.rotate(Math.atan2(dy, dx)); c.fillStyle = col;
      c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.7, -s * 0.85); c.lineTo(-s * 0.25, 0); c.lineTo(-s * 0.7, s * 0.85); c.closePath(); c.fill(); c.restore();
    }
    function tile(c, col, row, cw, top, bot, stroke) {
      var p = cw * 0.05, x = col * cw + p, y = row * cw + p, w = cw - 2 * p, g;
      rr(c, x, y, w, w, cw * 0.17);
      g = c.createLinearGradient(x, y, x, y + w); g.addColorStop(0, top); g.addColorStop(1, bot);
      c.fillStyle = g; c.fill(); c.strokeStyle = stroke; c.lineWidth = 1; c.stroke();
    }

    /* ---------------------------------------------------------------
     * Static board layer (cached offscreen with textures & custom palette)
     * --------------------------------------------------------------- */
    function buildCache() {
      if (!size || !offCtx) return;
      var b = api.getBoard(), cols = seatColors();
      var key = size + "|" + dpr + "|" + b.id + "|" + (b.modern ? "m" : "c") + "|" + b.dark + "|" + P.palette;
      if (key === offKey) return;
      offKey = key;
      off.width = size * dpr; off.height = size * dpr;
      var c = offCtx, cw = size / 15, M = b.modern, i, j, x, y, g, sc, pad = cw * 0.14;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBoardBg(c, 0, 0, size, size, size * 0.045);

      // 1. corner yards
      for (i = 0; i < 4; i++) {
        sc = cols[i]; x = YARDS[i][0] * cw; y = YARDS[i][1] * cw;
        c.save(); rr(c, x + pad, y + pad, cw * 6 - pad * 2, cw * 6 - pad * 2, cw * 0.6);
        if (M) {
          c.fillStyle = alpha(sc, 0.22); c.fill(); c.shadowColor = sc; c.shadowBlur = cw * 0.45;
          c.strokeStyle = alpha(sc, 0.92); c.lineWidth = 2; c.stroke();
        } else {
          g = c.createLinearGradient(x, y, x + cw * 6, y + cw * 6);
          g.addColorStop(0, shade(sc, 0.3)); g.addColorStop(0.5, sc); g.addColorStop(1, shade(sc, -0.3));
          c.fillStyle = g; c.fill(); c.strokeStyle = b.frame; c.lineWidth = 2; c.stroke();
        }
        c.restore();

        var ix = x + cw * 0.85, iy = y + cw * 0.85, iw = cw * 4.3;
        c.save(); rr(c, ix, iy, iw, iw, cw * 0.75);
        if (M) { c.fillStyle = alpha(b.base, 0.9); c.fill(); c.strokeStyle = alpha(sc, 0.55); c.lineWidth = 1.5; c.stroke(); }
        else {
          g = c.createRadialGradient(ix + iw / 2, iy + iw / 2, iw * 0.1, ix + iw / 2, iy + iw / 2, iw * 0.7);
          g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#ece3cf");
          c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 2; c.stroke();
        }
        c.restore();

        for (j = 0; j < 4; j++) {
          var sp = YARD_SPOTS[i][j], sx = sp[0] * cw, sy = sp[1] * cw;
          g = c.createRadialGradient(sx - cw * 0.12, sy - cw * 0.12, cw * 0.05, sx, sy, cw * 0.48);
          g.addColorStop(0, alpha(sc, 0.12)); g.addColorStop(1, alpha(sc, 0.5));
          c.beginPath(); c.arc(sx, sy, cw * 0.46, 0, TAU); c.fillStyle = g; c.fill();
          c.strokeStyle = sc; c.lineWidth = 2; c.stroke();
          c.beginPath(); c.arc(sx, sy, cw * 0.46, Math.PI * 1.1, Math.PI * 1.7); c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.5; c.stroke();
        }
      }

      // 2. outer track tiles
      var tTop = M ? alpha(b.cellA, 0.94) : shade(b.track, 0.12), tBot = M ? alpha(b.cellB, 0.94) : shade(b.track, -0.1), tLn = alpha(b.line, 0.52);
      for (i = 0; i < 52; i++) tile(c, TRACK[i][0], TRACK[i][1], cw, tTop, tBot, tLn);

      // 3. home lanes + start tiles
      for (i = 0; i < 4; i++) {
        sc = cols[i];
        var cTop = M ? alpha(sc, 0.72) : shade(sc, 0.25), cBot = M ? alpha(sc, 0.42) : shade(sc, -0.15);
        for (j = 0; j < 5; j++) {
          var hc = HOME_LANES[i][j], nx = j < 4 ? HOME_LANES[i][j + 1] : [7, 7], dx = nx[0] - hc[0], dy = nx[1] - hc[1];
          tile(c, hc[0], hc[1], cw, cTop, cBot, tLn);
          arrow(c, (hc[0] + 0.5) * cw, (hc[1] + 0.5) * cw, dx === 0 ? 0 : (dx > 0 ? 1 : -1), dy === 0 ? 0 : (dy > 0 ? 1 : -1), cw * 0.2, "rgba(255,255,255,.72)");
        }
        var s0 = TRACK[START_IDX[i]];
        tile(c, s0[0], s0[1], cw, M ? alpha(sc, 0.85) : shade(sc, 0.2), M ? alpha(sc, 0.6) : shade(sc, -0.2), tLn);
      }

      // 4. safe stars
      for (i = 0; i < SAFE_TRACK.length; i++) {
        var sq = TRACK[SAFE_TRACK[i]], isStart = START_IDX.indexOf(SAFE_TRACK[i]) >= 0;
        drawStarFill(c, (sq[0] + 0.5) * cw, (sq[1] + 0.5) * cw, cw * 0.34,
          isStart ? "rgba(255,255,255,.95)" : (M ? "#fde047" : "#f59e0b"), isStart ? "rgba(0,0,0,.3)" : (M ? "rgba(0,0,0,.25)" : "#92400e"));
      }

      // 5. centre finish triangles
      var ctr = 7.5 * cw, tris = [
        [[6 * cw, 6 * cw], [6 * cw, 9 * cw], [6 * cw, 7.5 * cw]],
        [[6 * cw, 6 * cw], [9 * cw, 6 * cw], [7.5 * cw, 6 * cw]],
        [[9 * cw, 6 * cw], [9 * cw, 9 * cw], [9 * cw, 7.5 * cw]],
        [[6 * cw, 9 * cw], [9 * cw, 9 * cw], [7.5 * cw, 9 * cw]]
      ];
      for (i = 0; i < 4; i++) {
        sc = cols[i];
        g = c.createLinearGradient(tris[i][2][0], tris[i][2][1], ctr, ctr);
        g.addColorStop(0, M ? alpha(shade(sc, 0.2), 0.95) : shade(sc, 0.3)); g.addColorStop(1, M ? alpha(sc, 0.55) : shade(sc, -0.3));
        c.beginPath(); c.moveTo(ctr, ctr); c.lineTo(tris[i][0][0], tris[i][0][1]); c.lineTo(tris[i][1][0], tris[i][1][1]); c.closePath();
        c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.4; c.stroke();
      }

      // 6. glass sheen
      c.save(); rr(c, 0, 0, size, size, size * 0.045); c.clip();
      g = c.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, "rgba(255,255,255,.14)"); g.addColorStop(0.35, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.12)");
      c.fillStyle = g; c.fillRect(0, 0, size, size); c.restore();
    }

    /* ---------------------------------------------------------------
     * Particles (sparks / rings / confetti / 5 custom hop trails)
     * --------------------------------------------------------------- */
    function spawnSparks(x, y, col, n) {
      if (P.trail === "none") return;
      var k = (size || 440) / 440;
      for (var i = 0; i < (n || 14); i++) {
        var a = Math.random() * TAU, sp = (1.4 + Math.random() * 3.6) * k;
        var pc = P.trail === "fire" ? (i % 2 ? "#f97316" : "#fde047") : (P.trail === "rainbow" ? "hsl(" + Math.round(Math.random() * 360) + ",95%,62%)" : col);
        particles.push({ k: "s", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: pc, r: (1.4 + Math.random() * 2.4) * Math.max(.8, k) });
      }
    }
    function spawnTrail(x, y, col) {
      if (REDUCE || P.trail === "none") return;
      var sz = size || 440;
      if (P.trail === "fire") {
        particles.push({ k: "f", x: x + (Math.random() - 0.5) * 4, y: y, vx: (Math.random() - 0.5) * 0.8, vy: -0.9 - Math.random() * 1.1, life: 0.9, col: Math.random() < 0.5 ? "#f97316" : "#fde047", r: sz * 0.02 });
      } else if (P.trail === "star") {
        particles.push({ k: "st", x: x, y: y, vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.9, rot: Math.random() * TAU, life: 0.9, col: "#fde047", r: sz * 0.022 });
      } else if (P.trail === "rainbow") {
        particles.push({ k: "d", x: x, y: y, life: 0.85, col: "hsl(" + Math.round((performance.now() * 0.5) % 360) + ",95%,62%)", r: sz * 0.02 });
      } else {
        particles.push({ k: "d", x: x, y: y, life: 0.8, col: col, r: sz * 0.017 });
      }
    }
    function spawnRing(x, y, col, max) { particles.push({ k: "r", x: x, y: y, life: 1, col: col, max: max || size * 0.09 }); }
    function spawnConfetti(x, y, n) {
      var k = (size || 440) / 440, cols = seatColors().concat(["#ffffff", "#fde047"]);
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = (3 + Math.random() * 6) * k;
        particles.push({ k: "c", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: cols[i % cols.length], rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.4, w: (4 + Math.random() * 4) * Math.max(.8, k), h: (7 + Math.random() * 5) * Math.max(.8, k) });
      }
    }
    function stepParticles() {
      var sp = api.speed(), i, p;
      for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        if (p.k === "r") p.life -= 0.05 * sp;
        else if (p.k === "d") p.life -= 0.07 * sp;
        else if (p.k === "f") { p.x += p.vx; p.y += p.vy; p.life -= 0.065 * sp; }
        else if (p.k === "st") { p.x += p.vx; p.y += p.vy; p.rot += 0.14; p.life -= 0.055 * sp; }
        else if (p.k === "c") { p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vx *= 0.99; p.rot += p.vr; p.life -= 0.011 * sp; }
        else { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy = p.vy * 0.96 + 0.05; p.life -= 0.03 * sp; }
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    /* ---------------------------------------------------------------
     * Geometry helpers & 3 Living Center Emblems
     * --------------------------------------------------------------- */
    function seatMap(n) { return n === 2 ? [0, 2] : (n === 3 ? [0, 1, 2] : [0, 1, 2, 3]); }
    function trackIdx(seat, step) { return (START_IDX[seat] + step) % 52; }
    function tokenCoords(seat, tIdx, step, s) {
      var cw = s / 15, col, row;
      if (step < 0) { col = YARD_SPOTS[seat][tIdx][0]; row = YARD_SPOTS[seat][tIdx][1]; }
      else if (step <= 50) { var tc = TRACK[trackIdx(seat, step)]; col = tc[0] + 0.5; row = tc[1] + 0.5; }
      else if (step <= 55) { var hc = HOME_LANES[seat][step - 51]; col = hc[0] + 0.5; row = hc[1] + 0.5; }
      else { col = FINISH_SPOTS[seat][tIdx][0]; row = FINISH_SPOTS[seat][tIdx][1]; }
      return { x: col * cw, y: row * cw, cw: cw };
    }

    function drawCenterEmblem(c, cx, cy, r, t) {
      var cols = seatColors(), g, i;
      c.save();
      if (P.center === "crown") {
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
      } else if (P.center === "star") {
        c.translate(cx, cy); c.rotate((t / 2800) % TAU);
        c.shadowColor = "#fde047"; c.shadowBlur = r * 0.9;
        c.beginPath();
        for (i = 0; i < 16; i++) {
          var a = i * TAU / 16, rad = i % 2 ? r * 0.45 : r * 1.05;
          if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
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
        drawStarFill(c, 0, 0, r * 0.5, "#f59e0b", "#92400e");
      }
      c.restore();
    }

    /* ---------------------------------------------------------------
     * Dynamic frame (all 8 custom pieces + trails + hints)
     * --------------------------------------------------------------- */
    function drawFrame() {
      if (!ctx || !size) return;
      buildCache();
      var c = ctx, cw = size / 15, t = performance.now(), i, j;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, size, size);
      if (off && off.width) c.drawImage(off, 0, 0, size, size);
      if (!st) return;

      var pulse = REDUCE ? 0.6 : 0.5 + 0.5 * Math.sin(t / 220), slow = REDUCE ? 0.5 : 0.5 + 0.5 * Math.sin(t / 520);

      for (i = 0; i < SAFE_TRACK.length; i++) {
        var sq = TRACK[SAFE_TRACK[i]], tw = REDUCE ? 0.3 : 0.5 + 0.5 * Math.sin(t / 420 + i * 1.7);
        c.fillStyle = "rgba(253,224,71," + (0.06 + 0.2 * tw).toFixed(3) + ")";
        c.beginPath(); c.arc((sq[0] + 0.5) * cw, (sq[1] + 0.5) * cw, cw * 0.44, 0, TAU); c.fill();
      }

      if (!st.winner && st.players[st.turn]) {
        var ap = st.players[st.turn], yy = YARDS[ap.seat];
        c.save(); rr(c, yy[0] * cw + cw * 0.14, yy[1] * cw + cw * 0.14, cw * 6 - cw * 0.28, cw * 6 - cw * 0.28, cw * 0.6);
        c.strokeStyle = alpha(ap.color, 0.5 + 0.45 * slow); c.lineWidth = cw * 0.12;
        c.shadowColor = ap.color; c.shadowBlur = cw * (0.4 + 0.7 * slow); c.stroke(); c.restore();
      }

      drawCenterEmblem(c, size / 2, size / 2, cw * 0.62, t);

      // destination markers for movable pieces (respecting hints toggle)
      if (P.hints && st.awaitMove && st.validTokens.length && st.players[st.turn]) {
        var vp = st.players[st.turn];
        for (j = 0; j < st.validTokens.length; j++) {
          var vt = st.validTokens[j], cur = vp.tokens[vt], ds = cur < 0 ? 0 : cur + st.dice;
          if (ds > 56) continue;
          var dp = tokenCoords(vp.seat, vt, ds, size);
          c.save(); c.translate(dp.x, dp.y);
          c.fillStyle = alpha(vp.color, 0.3 + 0.22 * pulse); c.strokeStyle = "#ffffff"; c.lineWidth = 2;
          c.setLineDash([cw * 0.14, cw * 0.1]); c.lineDashOffset = -t / 70;
          c.beginPath(); c.arc(0, 0, cw * (0.34 + 0.07 * pulse), 0, TAU); c.fill(); c.stroke(); c.restore();
        }
      }

      var baseR = Math.max(10, cw * (P.piece === "pawn" ? 0.62 : 0.54)), groups = {}, list = [], draws = [], pl, t2, key, step, anim;
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i];
        for (t2 = 0; t2 < pl.tokens.length; t2++) {
          step = pl.tokens[t2]; anim = pl.anims && pl.anims[t2];
          key = step < 0 ? "y" + pl.seat + "_" + t2 : (step === 56 ? "f" + pl.seat + "_" + t2 : (step > 50 ? "h" + pl.seat + "_" + step : "t" + trackIdx(pl.seat, step)));
          var item = { pIdx: i, tIdx: t2, pl: pl, step: step, anim: anim, key: key };
          list.push(item);
          if (!anim) { if (!groups[key]) groups[key] = []; groups[key].push(item); }
        }
      }
      for (i = 0; i < list.length; i++) {
        var it = list[i];
        if (it.anim) { it.screenX = it.anim.x; it.screenY = it.anim.y; draws.push({ x: it.anim.x, y: it.anim.y - cw * 0.1, r: baseR * 1.12, c: it.pl.color, lift: cw * 0.14, z: 1e6 }); continue; }
        var pos = tokenCoords(it.pl.seat, it.tIdx, it.step, size);
        var grp = groups[it.key] || [it], idx = grp.indexOf(it), len = grp.length, ox = 0, oy = 0, sc2 = 1;
        if (len > 1) { sc2 = 0.86; ox = (idx - (len - 1) / 2) * cw * 0.26; oy = -idx * cw * 0.05; }
        it.screenX = pos.x + ox; it.screenY = pos.y + oy;
        var valid = st.awaitMove && it.pIdx === st.turn && st.validTokens.indexOf(it.tIdx) >= 0, lift = 0;
        if (valid) {
          lift = (REDUCE ? 0.5 : Math.abs(Math.sin(t / 220))) * cw * 0.18;
          c.save(); c.strokeStyle = "#fff"; c.lineWidth = 2.5; c.shadowColor = "#fde047"; c.shadowBlur = 12;
          c.beginPath(); c.ellipse(it.screenX, it.screenY + baseR * 0.62, baseR * (0.9 + pulse * 0.25), baseR * 0.34, 0, 0, TAU); c.stroke(); c.restore();
        }
        draws.push({ x: it.screenX, y: it.screenY - cw * 0.12, r: baseR * sc2, c: it.pl.color, lift: lift, z: it.screenY });
      }
      draws.sort(function (p, q3) { return p.z - q3.z; });
      for (i = 0; i < draws.length; i++) drawToken(c, draws[i].x, draws[i].y, draws[i].r, draws[i].c, P.piece, P.style, draws[i].lift);
      st._rendered = list;

      for (i = 0; i < particles.length; i++) {
        var pt = particles[i], a = Math.max(0, Math.min(1, pt.life));
        c.save(); c.globalAlpha = a;
        if (pt.k === "r") {
          c.strokeStyle = pt.col; c.lineWidth = Math.max(1, 4 * a); c.beginPath(); c.arc(pt.x, pt.y, pt.max * (1 - a) + 2, 0, TAU); c.stroke();
        } else if (pt.k === "c") {
          c.translate(pt.x, pt.y); c.rotate(pt.rot); c.fillStyle = pt.col; c.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
        } else if (pt.k === "st") {
          c.translate(pt.x, pt.y); c.rotate(pt.rot);
          drawStarFill(c, 0, 0, pt.r * a, pt.col, "#fff");
        } else if (pt.k === "d" || pt.k === "f") {
          c.fillStyle = pt.col; c.globalCompositeOperation = "lighter"; c.beginPath(); c.arc(pt.x, pt.y, pt.r * a, 0, TAU); c.fill();
        } else {
          c.globalCompositeOperation = "lighter"; c.fillStyle = pt.col; c.shadowColor = pt.col; c.shadowBlur = 8;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r * (0.4 + 0.6 * a), 0, TAU); c.fill();
        }
        c.restore();
      }
    }

    function loop(now) {
      raf = 0;
      if (!st || view !== "game" || !cv || document.hidden) return;
      var fast = particles.length > 0 || st.awaitMove || st.busy;
      if (fast || now - lastT >= 33) { lastT = now; if (particles.length) stepParticles(); drawFrame(); }
      raf = window.requestAnimationFrame(loop);
    }
    function kickLoop() { if (!raf && cv && st && view === "game") raf = window.requestAnimationFrame(loop); }

    function resizeBoard() {
      if (!cv || !host) return;
      var wrap = q(".lx-bw", host); if (!wrap) return;
      var w = Math.floor(wrap.clientWidth);
      if (w < 40) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w !== size || cv.width !== w * dpr) { size = w; cv.width = size * dpr; cv.height = size * dpr; offKey = ""; }
      drawFrame();
    }
    /* ---------------------------------------------------------------
     * 3D dice
     * --------------------------------------------------------------- */
    function pipFace(n) {
      var on = PIPS[n] || [], h = '<div class="lx-f lx-f' + n + '">', i;
      for (i = 0; i < 9; i++) h += '<i' + (on.indexOf(i) >= 0 ? ' class="o"' : '') + '></i>';
      return h + '</div>';
    }
    function cubeHTML(spin) {
      return '<div class="lx-tilt"><div class="lx-cube' + (spin ? " spin" : "") + '"' + (spin ? "" : ' id="ld-cube"') + '>' + [1, 2, 3, 4, 5, 6].map(pipFace).join("") + '</div></div>';
    }
    function dieVars(color) { return "--dc:" + color + ";--dp:" + shade(color, -0.42) + ";--dpl:" + shade(color, 0.12) + ";"; }

    function setCube(v, anim, ms) {
      var cube = q("#ld-cube", host); if (!cube) return;
      var t = FACE_ROT[v] || FACE_ROT[1], nx, ny;
      if (anim && !REDUCE) {
        nx = Math.ceil(dieRot.x / 360) * 360 + 360 * (1 + Math.floor(Math.random() * 2)) + t[0];
        ny = Math.ceil(dieRot.y / 360) * 360 + 360 * (2 + Math.floor(Math.random() * 2)) + t[1];
        cube.style.transition = "transform " + ms + "ms cubic-bezier(.12,.75,.2,1)";
      } else {
        nx = Math.round(dieRot.x / 360) * 360 + t[0]; ny = Math.round(dieRot.y / 360) * 360 + t[1];
        cube.style.transition = "none";
      }
      dieRot.x = nx; dieRot.y = ny;
      cube.style.transform = "rotateX(" + nx + "deg) rotateY(" + ny + "deg)";
    }
    function paintDie(idx) {
      var pl = st && st.players[idx], dk = q(".lx-dock", host); if (!pl || !dk) return;
      dk.style.setProperty("--dc", pl.color);
      dk.style.setProperty("--dp", shade(pl.color, -0.42));
      dk.style.setProperty("--dpl", shade(pl.color, 0.12));
    }
    function dieVisual(idx, val, ms) {
      paintDie(idx);
      var d = q("#ld-die", host), dw = q(".lx-dwrap", host); if (!d || !dw) return;
      setCube(val, true, ms);
      d.style.setProperty("--jd", ms + "ms"); dw.style.setProperty("--jd", ms + "ms");
      d.classList.remove("jump", "land"); dw.classList.remove("rolling"); void d.offsetWidth;
      d.classList.add("jump"); dw.classList.add("rolling");
      setTimeout(function () { d.classList.remove("jump"); dw.classList.remove("rolling"); }, ms + 60);
    }
    function refreshLast(idx) {
      if (!st || !st.players[idx]) return;
      var el = q("#ld-last-" + idx, host); if (!el) return;
      el.textContent = st.players[idx].lastDice || "–";
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }

    /* ---------------------------------------------------------------
     * FX helpers
     * --------------------------------------------------------------- */
    function toast(txt, col) {
      var el = q("#ld-toast", host); if (!el) return;
      el.textContent = txt; el.style.setProperty("--tc", col || "#f59e0b");
      el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
    }
    function shake() {
      var w = q(".lx-bw", host); if (!w) return;
      w.classList.remove("shake"); void w.offsetWidth; w.classList.add("shake");
    }
    function turnTxt(n) { return n === "You" ? "Your turn" : n + "'s turn"; }
    function setMsg(txt) {
      if (st) st.msg = txt;
      var el = q("#ld-msg", host); if (el) el.textContent = txt;
    }
    function showReaction(pIdx, emo) {
      var chip = q("#ld-chip-" + pIdx, host); if (!chip) return;
      var old = chip.querySelector(".bg-bubble"); if (old) old.remove();
      var sp = document.createElement("span"); sp.className = "bg-bubble"; sp.textContent = emo;
      chip.appendChild(sp); setTimeout(function () { if (sp.parentNode) sp.remove(); }, 1350);
    }

    /* ---------------------------------------------------------------
     * Game rules & hop trail animations
     * --------------------------------------------------------------- */
    function legalMoves(pl, dice) {
      var valid = [];
      for (var t = 0; t < pl.tokens.length; t++) {
        var s = pl.tokens[t];
        if (s < 0 && dice === 6) valid.push(t);
        else if (s >= 0 && s + dice <= 56) valid.push(t);
      }
      return valid;
    }

    function animateHop(pl, tIdx, steps, onDone) {
      var i = 0, g = gen;
      if (!pl.anims) pl.anims = [];
      kickLoop();
      function next() {
        if (g !== gen) return;
        if (!st || i >= steps.length) { pl.anims[tIdx] = null; if (st) drawFrame(); if (onDone) onDone(); return; }
        var from = tokenCoords(pl.seat, tIdx, pl.tokens[tIdx], size);
        var to = tokenCoords(pl.seat, tIdx, steps[i], size);
        var start = performance.now(), ms = api.dur(190);
        playSfx("move");
        function tick(now) {
          if (!st || g !== gen) return;
          var t = Math.min(1, (now - start) / ms), arc = Math.sin(t * Math.PI) * (size * 0.03);
          var px = from.x + (to.x - from.x) * t, py = from.y + (to.y - from.y) * t - arc;
          pl.anims[tIdx] = { x: px, y: py };
          if (Math.random() < 0.72) spawnTrail(px, py, pl.color);
          if (t < 1) window.requestAnimationFrame(tick);
          else { pl.tokens[tIdx] = steps[i]; i++; next(); }
        }
        window.requestAnimationFrame(tick);
      }
      next();
    }

    function pushOnlineState(nextTurn, winnerIdx, msg) {
      if (!rm || !st) return;
      var allTokens = st.players.map(function (p) { return { t: p.tokens.slice() }; });
      var up = {
        "ld.tokens": allTokens,
        "ld.turn": nextTurn,
        "ld.dice": st.dice,
        "ld.sixes": st.sixes,
        "ld.msg": msg
      };
      if (winnerIdx >= 0) { up.status = "finished"; up["ld.winner"] = winnerIdx; }
      rm.F.updateDoc(rm.ref, up).catch(function () { });
    }

    function endTurn(bonus, isActor) {
      if (!st || st.winner) return;
      st.busy = false; st.awaitMove = false; st.validTokens = [];
      var nextTurn = bonus ? st.turn : (st.turn + 1) % st.players.length;
      if (!bonus) st.sixes = 0;
      var msg = bonus ? (st.players[st.turn].name + " gets a bonus roll!") : turnTxt(st.players[nextTurn].name);
      st.turn = nextTurn;
      setMsg(msg);
      if (rm && isActor) pushOnlineState(nextTurn, -1, msg);
      updateHUD(); drawFrame(); kickLoop();
      if (!rm) maybeBot();
    }

    function executeTokenMove(pIdx, tIdx, dice, isActor) {
      var pl = st.players[pIdx], cur = pl.tokens[tIdx];
      st.awaitMove = false; st.validTokens = []; st.busy = true; updateHUD();

      var path = [];
      if (cur < 0) path = [0];
      else { for (var s = cur + 1; s <= cur + dice; s++) path.push(s); }

      animateHop(pl, tIdx, path, function () {
        var dest = pl.tokens[tIdx], bonus = dice === 6, lp = tokenCoords(pl.seat, tIdx, dest, size);
        spawnRing(lp.x, lp.y, pl.color, size * 0.07);
        if (dest === 56) {
          bonus = true; playSfx("home");
          spawnSparks(lp.x, lp.y, pl.color, 20); spawnConfetti(lp.x, lp.y, 26);
          toast("🏠 HOME!", pl.color);
          vibrate([20, 30, 35]);
        } else if (dest >= 0 && dest <= 50) {
          var tSq = trackIdx(pl.seat, dest);
          if (SAFE_TRACK.indexOf(tSq) < 0) {
            for (var o = 0; o < st.players.length; o++) {
              if (o === pIdx) continue;
              var op = st.players[o];
              for (var ot = 0; ot < op.tokens.length; ot++) {
                if (op.tokens[ot] >= 0 && op.tokens[ot] <= 50 && trackIdx(op.seat, op.tokens[ot]) === tSq) {
                  var hitPos = tokenCoords(op.seat, ot, op.tokens[ot], size);
                  op.tokens[ot] = -1; bonus = true;
                  playSfx("capture");
                  spawnSparks(hitPos.x, hitPos.y, op.color, 26); spawnRing(hitPos.x, hitPos.y, "#ffffff", size * 0.12); spawnRing(hitPos.x, hitPos.y, op.color, size * 0.09);
                  toast("💥 CAPTURED!", "#ef4444"); shake();
                  vibrate(45);
                  setMsg(pl.name + " captured " + op.name + "!");
                }
              }
            }
          }
        }
        updateHUD();
        if (pl.tokens.every(function (v) { return v === 56; })) {
          st.winner = pl; st.busy = false; playSfx("win");
          spawnConfetti(size / 2, size * 0.6, 70); spawnConfetti(size * 0.2, size * 0.7, 30); spawnConfetti(size * 0.8, size * 0.7, 30);
          toast("🏆 " + pl.name + " WINS!", pl.color);
          vibrate([40, 40, 80]);
          if (rm && isActor) pushOnlineState(st.turn, pIdx, pl.name + " wins!");
          kickLoop();
          later(function () { view = "result"; render(); }, api.dur(2200));
          return;
        }
        endTurn(bonus, isActor);
      });
    }

    function pickBestBotToken(pl, valid, dice) {
      for (var i = 0; i < valid.length; i++) {
        var t = valid[i], dest = pl.tokens[t] < 0 ? 0 : pl.tokens[t] + dice;
        if (dest === 56) return t;
        if (dest <= 50) {
          var sq = trackIdx(pl.seat, dest);
          if (SAFE_TRACK.indexOf(sq) < 0) {
            for (var o = 0; o < st.players.length; o++) {
              if (st.players[o] === pl) continue;
              for (var ot = 0; ot < st.players[o].tokens.length; ot++) {
                var os = st.players[o].tokens[ot];
                if (os >= 0 && os <= 50 && trackIdx(st.players[o].seat, os) === sq) return t;
              }
            }
          }
        }
      }
      for (var j = 0; j < valid.length; j++) if (pl.tokens[valid[j]] < 0) return valid[j];
      return valid[0];
    }

    function canActNow() {
      if (!st || st.winner) return false;
      if (rm) return st.players[st.turn].uid === rm.uid;
      return !st.players[st.turn].bot;
    }

    function afterDice(val) {
      var pl = st.players[st.turn];
      if (val === 6) {
        st.sixes = (st.sixes || 0) + 1; playSfx("six"); vibrate(22);
        if (st.sixes >= 3) {
          setMsg(pl.name + " rolled three 6s! Turn skipped");
          toast("3 SIXES 😵", "#64748b");
          later(function () { endTurn(false, true); }, api.dur(900));
          return;
        }
        toast("SIX! 🔥", pl.color);
        spawnSparks(size / 2, size / 2, pl.color, 18);
      } else { st.sixes = 0; }

      var valid = legalMoves(pl, val);
      if (!valid.length) {
        setMsg("No valid moves for " + pl.name);
        later(function () { endTurn(val === 6, true); }, api.dur(800));
        return;
      }
      if (pl.bot) {
        var pick = pickBestBotToken(pl, valid, val);
        later(function () { executeTokenMove(st.turn, pick, val, true); }, api.dur(600));
        return;
      }
      if (valid.length === 1 && P.autoMove) {
        sendAndMove(valid[0], val);
        return;
      }
      st.busy = false; st.awaitMove = true; st.validTokens = valid;
      setMsg("Tap a glowing piece to move");
      updateHUD(); kickLoop();
    }

    function sendAndMove(tIdx, val) {
      st.moveId = Math.max((st.moveId || 0) + 1, Date.now());
      if (rm) {
        rm.F.updateDoc(rm.ref, {
          "ld.lastMove": { by: st.turn, tIdx: tIdx, dice: val, id: st.moveId },
          "ld.dice": val
        }).catch(function () { });
      }
      executeTokenMove(st.turn, tIdx, val, true);
    }

    function rollDice(byBot) {
      if (!st || st.winner || st.busy || st.awaitMove) return;
      if (byBot === true) { if (rm || !st.players[st.turn].bot) return; }
      else if (!canActNow()) return;
      st.busy = true; updateHUD(); playSfx("dice"); vibrate(14); kickLoop();
      var turn = st.turn, finalVal = 1 + Math.floor(Math.random() * 6), ms = api.dur(1150);
      dieVisual(turn, finalVal, ms);
      clearTimeout(diceT);
      diceT = later(function () {
        if (!st || !st.players[turn]) return;
        st.dice = finalVal; st.players[turn].lastDice = finalVal; refreshLast(turn);
        var d = q("#ld-die", host); if (d) { d.classList.remove("land"); void d.offsetWidth; d.classList.add("land"); }
        afterDice(finalVal);
      }, ms + 60);
    }

    function handleBoardTap(e) {
      if (!st || !st.awaitMove || !canActNow() || !cv || !st._rendered) return;
      var rect = cv.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (size / rect.width);
      var y = (e.clientY - rect.top) * (size / rect.height);
      var hitR = Math.max(18, (size / 15) * 0.65), best = -1, bestD = hitR;
      for (var i = 0; i < st._rendered.length; i++) {
        var it = st._rendered[i];
        if (it.pIdx !== st.turn || st.validTokens.indexOf(it.tIdx) < 0) continue;
        var d = Math.hypot(x - it.screenX, y - it.screenY);
        if (d < bestD) { bestD = d; best = it.tIdx; }
      }
      if (best >= 0) sendAndMove(best, st.dice);
    }

    function maybeBot() {
      clearTimeout(botT);
      if (!st || st.busy || st.awaitMove || st.winner || rm) return;
      if (st.players[st.turn].bot) botT = later(function () { rollDice(true); }, api.dur(1000));
    }

    function sendEmoji(emo) {
      if (!st) return;
      var myIdx = rm ? st.players.findIndex(function (p) { return p.uid === rm.uid; }) : st.turn;
      if (myIdx < 0) myIdx = 0;
      showReaction(myIdx, emo); playSfx("click");
      if (rm) rm.F.updateDoc(rm.ref, { "ld.react": { by: myIdx, emo: emo, id: Date.now() } }).catch(function () { });
    }

    /* ---------- Online Rooms for Ludo ---------- */
    function leaveOnline() {
      if (!rm) return;
      var r = rm; rm = null; st = null; gen++;
      clearTimeout(r.wd);
      if (r.unsub) r.unsub();
      if (r.isHost && r.data && r.data.status === "waiting") r.F.deleteDoc(r.ref).catch(function () { });
      view = "setup"; render();
    }

    function createOnlineRoom() {
      if (busy) return;
      var name = (cfg.myName || "").trim() || savedName();
      saveName(name); busy = true;
      var msg = q("#ld-net-msg", host); if (msg) msg.textContent = "Creating room…";
      loadFb().then(function (f) {
        var tries = 0, F = f.F;
        function attempt() {
          var code = String(1000 + Math.floor(Math.random() * 9000)), ref = F.doc(f.db, "battles", code);
          return F.getDoc(ref).then(function (s) { return s.exists(); }, function () { return true; }).then(function (taken) {
            if (taken) { if (++tries >= 8) throw { code: "no-code" }; return attempt(); }
            var pl = {}; pl[f.uid] = { name: name, joinedAt: Date.now() };
            return F.setDoc(ref, {
              gameType: "ludo", status: "waiting", hostId: f.uid, maxPlayers: cfg.count, turbo: !!cfg.turbo,
              expireAt: F.Timestamp.fromMillis(Date.now() + EXPIRE_MS), players: pl
            }).then(function () { return { code: code, ref: ref, f: f }; });
          });
        }
        return attempt();
      }).then(function (res) {
        attachRoom(res.code, res.ref, res.f, true);
      }).catch(function (e) {
        if (msg) msg.textContent = fbErr(e);
      }).then(function () { busy = false; });
    }

    function joinOnlineRoom(codeInput) {
      var code = String(codeInput || cfg.code || "").replace(/\D/g, "");
      if (code.length !== 4 || busy) {
        var m = q("#ld-net-msg", host); if (m) m.textContent = "Enter a valid 4-digit room code.";
        return;
      }
      var name = (cfg.myName || "").trim() || savedName();
      saveName(name); busy = true;
      var msg = q("#ld-net-msg", host); if (msg) msg.textContent = "Joining room " + code + "…";
      loadFb().then(function (f) {
        var F = f.F, ref = F.doc(f.db, "battles", code);
        return F.getDoc(ref).then(function (s) {
          if (!s.exists()) throw { code: "nf" };
          var d = s.data();
          if (d.gameType !== "ludo") throw { code: "wrong-game" };
          if (d.status !== "waiting" && !(d.players && d.players[f.uid])) throw { code: "started" };
          if (!d.players[f.uid] && Object.keys(d.players).length >= d.maxPlayers) throw { code: "full" };
          var up = {}; up["players." + f.uid] = { name: name, joinedAt: Date.now() };
          return F.updateDoc(ref, up).then(function () { return { code: code, ref: ref, f: f }; });
        });
      }).then(function (res) {
        attachRoom(res.code, res.ref, res.f, false);
      }).catch(function (e) {
        if (msg) msg.textContent = fbErr(e);
      }).then(function () { busy = false; });
    }

    function startOnlineMatch() {
      if (!rm || !rm.isHost || !rm.data) return;
      var d = rm.data, uids = Object.keys(d.players).sort(function (a, b) {
        return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0);
      });
      if (uids.length < 2) return;
      var initToks = uids.map(function () { return { t: d.turbo ? [0, -1] : [-1, -1, -1, -1] }; });
      rm.F.updateDoc(rm.ref, {
        status: "playing",
        ld: { order: uids, tokens: initToks, turn: 0, dice: 6, sixes: 0, moveId: 0, msg: d.players[uids[0]].name + "'s turn" }
      }).catch(function () { });
    }

    function armWatch(turnIdx, sig) {
      if (!rm || !st || rm.sig === sig) return;
      rm.sig = sig; clearTimeout(rm.wd);
      var me = st.players.findIndex(function (p) { return p.uid === rm.uid; });
      if (me < 0 || me === turnIdx) return;
      var rank = 0, k;
      for (k = 0; k < me; k++) if (k !== turnIdx) rank++;
      rm.wd = setTimeout(function () {
        if (!rm || !st || st.winner || rm.sig !== sig) return;
        var nx = (turnIdx + 1) % st.players.length;
        rm.F.updateDoc(rm.ref, { "ld.turn": nx, "ld.sixes": 0, "ld.msg": st.players[turnIdx].name + " timed out — " + turnTxt(st.players[nx].name) }).catch(function () { });
      }, 60000 + rank * 8000);
    }

    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastMoveId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { clearTimeout(rm.wd); rm = null; st = null; gen++; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.ld) {
          var ld = d.ld, seats = seatMap(ld.order.length), cols = seatColors();
          if (!st || view !== "game") {
            var pls = ld.order.map(function (u, idx) {
              var seat = seats[idx];
              return { uid: u, seat: seat, name: (d.players[u] && d.players[u].name) || SEAT_NAMES[seat], color: cols[seat], tokens: ((ld.tokens[idx] && ld.tokens[idx].t) || [-1, -1]).slice(), bot: false, anims: [] };
            });
            st = { players: pls, turn: ld.turn || 0, dice: ld.dice || 6, sixes: ld.sixes || 0, moveId: ld.moveId || 0, busy: false, awaitMove: false, validTokens: [], winner: null, msg: ld.msg || "" };
            gen++; rm.lastMoveId = (ld.lastMove && ld.lastMove.id) || 0;
            particles = []; view = "game"; render();
          }
          armWatch(ld.turn || 0, JSON.stringify([ld.turn, ld.tokens, ld.lastMove && ld.lastMove.id]));
          if (ld.react && ld.react.id && ld.react.id !== rm.lastReactId) {
            rm.lastReactId = ld.react.id;
            var myIdx = st.players.findIndex(function (p) { return p.uid === rm.uid; });
            if (ld.react.by !== myIdx) showReaction(ld.react.by, ld.react.emo);
          }
          if (ld.lastMove && ld.lastMove.id && ld.lastMove.id !== rm.lastMoveId) {
            rm.lastMoveId = ld.lastMove.id;
            var actorIdx = ld.lastMove.by, mvT = ld.lastMove.tIdx, mvD = ld.lastMove.dice;
            if (st.players[actorIdx] && st.players[actorIdx].uid !== rm.uid) {
              st.dice = mvD; st.players[actorIdx].lastDice = mvD; st.turn = actorIdx;
              st.busy = true; updateHUD(); playSfx("dice");
              var rms = api.dur(800);
              dieVisual(actorIdx, mvD, rms);
              later(function () {
                if (!st || !st.players[actorIdx]) return;
                refreshLast(actorIdx);
                executeTokenMove(actorIdx, mvT, mvD, false);
              }, rms + 40);
            }
          } else if (!st.busy && (!st.awaitMove || ld.turn !== st.turn)) {
            st.awaitMove = false; st.validTokens = [];
            st.turn = ld.turn; st.sixes = ld.sixes || 0;
            st.players.forEach(function (p, i) { if (ld.tokens[i] && ld.tokens[i].t) p.tokens = ld.tokens[i].t.slice(); });
            if (ld.msg) setMsg(ld.msg);
            updateHUD(); drawFrame();
          }
        } else if (d.status === "finished" && d.ld) {
          clearTimeout(rm.wd);
          if (!st) {
            var fseats = seatMap(d.ld.order.length), fcols = seatColors();
            st = { players: d.ld.order.map(function (u, idx) {
              var seat = fseats[idx];
              return { uid: u, seat: seat, name: (d.players[u] && d.players[u].name) || SEAT_NAMES[seat], color: fcols[seat], tokens: [-1, -1], bot: false, anims: [] };
            }), turn: 0, dice: d.ld.dice || 6, sixes: 0, moveId: 0, busy: false, awaitMove: false, validTokens: [], winner: null, msg: "" };
          }
          var wIdx = d.ld.winner != null ? d.ld.winner : 0;
          st.players.forEach(function (p, i) { if (d.ld.tokens[i] && d.ld.tokens[i].t) p.tokens = d.ld.tokens[i].t.slice(); });
          st.winner = st.players[wIdx] || st.players[0];
          view = "result"; render();
        }
      });
    }

    function startOfflineMatch() {
      gen++; clearTimeout(diceT); clearTimeout(botT); rm = null;
      var seats = seatMap(cfg.count), cols = seatColors(), pls = [], i, seat, nm;
      for (i = 0; i < cfg.count; i++) {
        seat = seats[i];
        nm = (cfg.names[i] || "").trim() || (cfg.mode === "ai" && i > 0 ? "Bot " + i : SEAT_NAMES[seat]);
        pls.push({ seat: seat, name: nm, color: cols[seat], tokens: cfg.turbo ? [0, -1] : [-1, -1, -1, -1], bot: cfg.mode === "ai" && i > 0, anims: [] });
      }
      st = { players: pls, turn: 0, dice: 6, sixes: 0, moveId: 0, busy: false, awaitMove: false, validTokens: [], winner: null, msg: turnTxt(pls[0].name) + " — tap the dice!" };
      particles = []; view = "game"; render();
    }

    /* ---------------------------------------------------------------
     * HUD
     * --------------------------------------------------------------- */
    function updateHUD() {
      if (!st || !host) return;
      var pl = st.players[st.turn], can = canActNow(), rdy = can && !st.busy && !st.awaitMove && !st.winner;
      qa(".lx-pc", host).forEach(function (el) {
        var idx = +el.getAttribute("data-i"), p = st.players[idx];
        el.classList.toggle("turn", idx === st.turn && !st.winner);
        if (p) {
          el.style.setProperty("--c", p.color);
          el.style.setProperty("--cd", shade(p.color, -0.4));
          qa(".lx-tk", el).forEach(function (tk, k) { tk.classList.toggle("done", p.tokens[k] === 56); });
        }
      });
      var die = q("#ld-die", host), dw = q(".lx-dwrap", host);
      if (die) { die.disabled = !rdy; die.classList.toggle("ready", rdy); }
      if (dw) dw.classList.toggle("ready", rdy);
      if (lastTurnShown !== st.turn) {
        lastTurnShown = st.turn; paintDie(st.turn);
        if (die && !st.busy) { die.classList.remove("land"); void die.offsetWidth; die.classList.add("land"); }
      }
      var hint = q("#ld-roll-hint", host);
      if (hint) {
        if (st.winner) hint.textContent = "";
        else if (st.awaitMove) hint.textContent = can ? "Tap a glowing piece" : pl.name + " is choosing…";
        else if (st.busy) hint.textContent = "";
        else if (rm) hint.textContent = can ? "Your turn — tap the dice!" : "Waiting for " + pl.name + "…";
        else hint.textContent = pl.bot ? pl.name + " is rolling…" : (pl.name === "You" ? "Tap to roll!" : "Tap to roll, " + pl.name);
      }
    }

    /* ---------------------------------------------------------------
     * Views
     * --------------------------------------------------------------- */
    function seatDots(n) {
      var cols = seatColors();
      return seatMap(n).map(function (s) { return '<i style="background:' + cols[s] + '"></i>'; }).join("");
    }

    function renderSetup() {
      var m = cfg.mode, seats = seatMap(cfg.count), cols = seatColors(), i, h = '<div class="lx lx-gap">';
      h += '<div class="lx-hero lx-enter">' +
        '<i class="lx-orb" style="color:' + cols[0] + ';width:14px;height:14px;left:54%;top:16%"></i>' +
        '<i class="lx-orb" style="color:' + cols[1] + ';width:10px;height:10px;right:8%;top:10%;animation-delay:-2s"></i>' +
        '<i class="lx-orb" style="color:' + cols[3] + ';width:12px;height:12px;right:12%;bottom:12%;animation-delay:-4s"></i>' +
        '<i class="lx-orb" style="color:' + cols[2] + ';width:16px;height:16px;left:50%;bottom:14%;animation-delay:-1s"></i>' +
        '<div class="lx-hero-in"><div><div class="lx-kick">ITI CONNECT</div><div class="lx-title">LUDO<span>ARENA</span></div>' +
        '<div class="lx-sub">Roll. Race. Capture. Rule the board.</div></div>' +
        '<div class="lx-die" style="' + dieVars("#f59e0b") + '">' + cubeHTML(true) + '</div></div></div>';

      h += '<div class="ag-glass lx-card lx-enter" style="animation-delay:.08s">';
      h += '<div class="lx-lbl">Game mode</div><div class="lx-g3">' + [
        ["ai", "bot", "vs Bots", "Play solo"], ["local", "users", "Pass & Play", "Same phone"], ["online", "wifi", "Online", "With friends"]
      ].map(function (t) {
        return '<button type="button" data-ld="mode" data-k="' + t[0] + '" class="lx-tile' + (m === t[0] ? " on" : "") + '"><span class="ic">' + ico(t[1]) + '</span><span class="t">' + t[2] + '</span><span class="s">' + t[3] + '</span></button>';
      }).join("") + '</div>';

      h += '<div class="lx-lbl" style="margin-top:12px">Tokens</div><div class="lx-g2">' +
        '<button type="button" data-ld="turbo" data-k="1" class="lx-tile' + (cfg.turbo ? " on" : "") + '"><span class="ic">⚡</span><span class="t">Turbo</span><span class="s">2 tokens · fast</span></button>' +
        '<button type="button" data-ld="turbo" data-k="0" class="lx-tile' + (!cfg.turbo ? " on" : "") + '"><span class="ic">🏁</span><span class="t">Classic</span><span class="s">4 tokens · full</span></button></div>';

      h += '<div class="lx-lbl" style="margin-top:12px">' + (m === "online" ? "Room size" : "Players") + '</div><div class="lx-g3">' +
        [2, 3, 4].map(function (n) {
          return '<button type="button" data-ld="count" data-k="' + n + '" class="lx-tile' + (cfg.count === n ? " on" : "") + '"><span class="t" style="font-size:15px">' + n + 'P</span><span class="dots">' + seatDots(n) + '</span></button>';
        }).join("") + '</div>';

      if (m === "online") {
        h += '<div class="lx-lbl" style="margin-top:12px">Your name</div><input class="lx-in" type="text" maxlength="14" data-ld-myname="1" value="' + esc(cfg.myName) + '" placeholder="Player">';
        h += '<div style="margin-top:12px"><button type="button" class="lx-cta" data-ld="create">' + ico("plus") + 'Create Online Room</button></div>';
        h += '<div style="display:flex;gap:8px;margin-top:10px"><input id="ld-code-in" class="lx-in" style="width:6.4rem;text-align:center;letter-spacing:.22em;font-weight:900" type="text" inputmode="numeric" maxlength="4" placeholder="0000" value="' + esc(cfg.code) + '">' +
          '<button type="button" class="bg-sec" style="flex:1;font-weight:800;border-radius:14px" data-ld="join">' + ico("log-in") + 'Join Room</button></div>';
        h += '<div id="ld-net-msg" style="font-size:12px;text-align:center;color:var(--ag-t2);margin-top:8px;min-height:1rem"></div>';
      } else {
        h += '<div class="lx-lbl" style="margin-top:12px">Names</div><div class="lx-g2">';
        for (i = 0; i < cfg.count; i++) {
          var seat = seats[i], def = m === "ai" ? (i === 0 ? "You" : "Bot " + i) : SEAT_NAMES[seat];
          var val = cfg.names[i] && cfg.names[i].indexOf("Bot ") !== 0 && SEAT_NAMES.indexOf(cfg.names[i]) < 0 && cfg.names[i] !== "You" ? cfg.names[i] : def;
          cfg.names[i] = val;
          h += '<div class="lx-nr"><span class="lx-pawn" style="--c:' + cols[seat] + ';--cd:' + shade(cols[seat], -0.35) + '"></span>' +
            '<input type="text" maxlength="14" data-ld-name="' + i + '" value="' + esc(val) + '"' + (m === "ai" && i > 0 ? " readonly" : "") + '></div>';
        }
        h += '</div><div style="margin-top:14px"><button type="button" class="lx-cta" data-ld="start">' + ico("play") + 'START GAME</button></div>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderLobby() {
      var d = rm.data, seats = seatMap(d.maxPlayers), cols = seatColors(), uids = Object.keys(d.players).sort(function (a, b) { return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0); });
      var wa = "https://wa.me/?text=" + encodeURIComponent("Join my ITI CONNECT Ludo match! 🎲\nCode: " + rm.code + "\n" + INVITE_BASE + rm.code + "&game=ludo");
      var h = '<div class="lx lx-gap"><div class="ag-glass lx-card lx-enter" style="text-align:center">';
      h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;font-weight:900">🎲 Ludo Room · ' + (d.turbo ? "Turbo" : "Classic") + '</span><button type="button" class="lx-ib" data-ld="leave" aria-label="Leave room">' + ico("x") + '</button></div>';
      h += '<div class="lx-lbl" style="text-align:center">Room code</div><div class="lx-code">' + String(rm.code).split("").map(function (ch, i) { return '<span class="lx-dg" style="animation-delay:' + (i * 0.08) + 's">' + esc(ch) + '</span>'; }).join("") + '</div>';
      h += '<div class="lx-g2" style="margin:12px 0"><button type="button" class="bg-sec" style="border-radius:14px" data-ld="copy">' + ico("copy") + '<span class="lx-t">Copy Code</span></button>' +
        '<a class="bg-sec" style="text-decoration:none;border-radius:14px" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + 'WhatsApp</a></div>';
      h += '<div style="display:flex;flex-direction:column;gap:8px;text-align:left">';
      for (var i = 0; i < d.maxPlayers; i++) {
        var u = uids[i], seat = seats[i];
        h += '<div class="lx-slot' + (u === rm.uid ? " me" : "") + '"><span class="lx-pawn" style="--c:' + cols[seat] + ';--cd:' + shade(cols[seat], -0.35) + '"></span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          (u ? esc(d.players[u].name) + (u === rm.uid ? " (You)" : "") : '<span style="color:var(--ag-t2);font-weight:700">Waiting for friend <span class="lx-wait"><i></i><i></i><i></i></span></span>') + '</span></div>';
      }
      h += '</div><div style="margin-top:14px">';
      if (rm.isHost) h += '<button type="button" class="lx-cta" data-ld="onstart"' + (uids.length < 2 ? " disabled" : "") + '>' + ico("play") + 'START MATCH (' + uids.length + '/' + d.maxPlayers + ')</button>';
      else h += '<div style="font-size:12px;font-weight:700;color:var(--ag-t2)">Waiting for host to start <span class="lx-wait"><i></i><i></i><i></i></span></div>';
      h += '</div></div></div>';
      host.innerHTML = h; icons();
    }

    function ldCard(seat) {
      var idx = -1, i;
      for (i = 0; i < st.players.length; i++) if (st.players[i].seat === seat) idx = i;
      if (idx < 0) return '<div></div>';
      var pl = st.players[idx], dots = "", k;
      for (k = 0; k < pl.tokens.length; k++) dots += '<i class="lx-tk' + (pl.tokens[k] === 56 ? " done" : "") + '"></i>';
      return '<div id="ld-chip-' + idx + '" data-i="' + idx + '" class="lx-pc' + (idx === st.turn ? " turn" : "") + '" style="--c:' + pl.color + ';--cd:' + shade(pl.color, -0.4) + '">' +
        '<div class="lx-av"><b>' + esc((pl.name || "?").charAt(0).toUpperCase()) + '</b></div>' +
        '<div class="lx-nfo"><div class="lx-nm">' + esc(pl.name) + '</div><div class="lx-tks">' + dots + '</div></div>' +
        '<div class="lx-last" id="ld-last-' + idx + '">' + (pl.lastDice || "–") + '</div></div>';
    }

    function renderGame() {
      var cur = st.players[st.turn], h = '<div class="lx lx-gap" style="gap:8px">';
      h += '<div class="lx-top lx-enter"><button type="button" class="lx-ib" data-ld="quit" aria-label="Quit game">' + ico("x") + '</button>' +
        '<div id="ld-msg" class="lx-msg">' + esc(st.msg) + '</div>' +
        '<button type="button" class="lx-ib studio" data-ld="studio" aria-label="Arena Studio" title="Live Theme &amp; Piece Studio">' + ico("sparkles") + '</button>' +
        '<button type="button" id="ld-auto-btn" class="lx-pill' + (P.autoMove ? " on" : "") + '" data-ld="automove" title="Auto-move when only 1 piece can move">Auto</button></div>';
      h += '<div class="lx-row lx-enter" style="animation-delay:.05s">' + ldCard(0) + ldCard(1) + '</div>';
      h += '<div class="lx-bw lx-enter" style="animation-delay:.1s"><canvas id="ld-canvas" class="lx-cv"></canvas><div id="ld-toast" class="lx-toast"></div></div>';
      h += '<div class="lx-row lx-enter" style="animation-delay:.15s">' + ldCard(3) + ldCard(2) + '</div>';
      h += '<div class="lx-dock lx-enter" style="animation-delay:.2s;' + dieVars(cur.color) + '">' +
        '<div class="lx-side">' + ["👏", "😂"].map(function (em) { return '<button type="button" class="lx-emo" data-ld="emo" data-k="' + em + '">' + em + '</button>'; }).join("") + '</div>' +
        '<div class="lx-ctr"><div class="lx-dwrap"><button type="button" id="ld-die" class="lx-die" data-ld="roll" aria-label="Roll dice">' + cubeHTML(false) + '</button><i class="lx-sh"></i></div>' +
        '<div id="ld-roll-hint" class="lx-hint"></div></div>' +
        '<div class="lx-side">' + ["🔥", "😱"].map(function (em) { return '<button type="button" class="lx-emo" data-ld="emo" data-k="' + em + '">' + em + '</button>'; }).join("") + '</div></div>';
      h += '</div>';
      host.innerHTML = h; icons();
      cv = q("#ld-canvas", host); ctx = cv.getContext("2d");
      cv.addEventListener("click", handleBoardTap);
      if (!off) { off = document.createElement("canvas"); offCtx = off.getContext("2d"); }
      offKey = ""; dieRot = { x: 0, y: 0 }; lastTurnShown = -1;
      setCube(cur.lastDice || 1, false);
      window.requestAnimationFrame(function () { resizeBoard(); updateHUD(); maybeBot(); kickLoop(); });
    }

    function confettiHTML(n) {
      var h = "", i, cols = seatColors().concat(["#ffffff", "#fde047"]);
      for (i = 0; i < n; i++) {
        h += '<i class="lx-cf" style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';--x:' + Math.round(Math.random() * 90 - 45) + 'px;--t:' + (2.6 + Math.random() * 2).toFixed(2) + 's;--d:' + (Math.random() * 2.2).toFixed(2) + 's"></i>';
      }
      return h;
    }

    function renderResult() {
      var ranked = st.players.slice().sort(function (a, b) {
        var da = a.tokens.filter(function (v) { return v === 56; }).length;
        var db = b.tokens.filter(function (v) { return v === 56; }).length;
        if (db !== da) return db - da;
        var sa = a.tokens.reduce(function (acc, v) { return acc + Math.max(0, v + 1); }, 0);
        var sb = b.tokens.reduce(function (acc, v) { return acc + Math.max(0, v + 1); }, 0);
        return sb - sa;
      });
      var medals = ["🥇", "🥈", "🥉", "4️⃣"];
      var h = '<div class="lx"><div class="lx-res lx-enter" style="--wc:' + ranked[0].color + '">' + confettiHTML(40);
      h += '<div class="lx-trophy">🏆</div><div class="lx-wt">WINNER</div><div class="lx-wn">' + esc(ranked[0].name) + '</div>';
      h += '<div style="display:flex;flex-direction:column;gap:8px">' + ranked.map(function (pl, idx) {
        var done = pl.tokens.filter(function (v) { return v === 56; }).length, pct = Math.round(done / pl.tokens.length * 100);
        return '<div class="lx-rk' + (idx === 0 ? " first" : "") + '" style="animation-delay:' + (0.15 + idx * 0.1) + 's;--c:' + pl.color + '">' +
          '<span style="font-size:22px">' + medals[idx] + '</span>' +
          '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:800"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(pl.name) + '</span><span style="color:#fde68a;flex:none">' + done + '/' + pl.tokens.length + ' Home</span></div>' +
          '<div class="lx-bar"><i style="width:' + pct + '%"></i></div></div></div>';
      }).join("") + '</div>';
      h += '<div class="lx-g2" style="margin-top:14px">' +
        (rm ? '<button type="button" class="lx-cta" style="grid-column:span 2" data-ld="leave">' + ico("log-out") + 'Leave Room</button>' :
          '<button type="button" class="lx-cta" data-ld="start">' + ico("rotate-ccw") + 'Rematch</button>' +
          '<button type="button" class="bg-sec" style="border-radius:16px;color:#fff;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25)" data-ld="setup">' + ico("sliders-horizontal") + 'Setup</button>') +
        '</div></div></div>';
      host.innerHTML = h; icons();
    }

    function render() {
      if (!host) return;
      setPlaying(view === "game" && !!st);
      if (view !== "game") { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
      if (view === "lobby" && rm) renderLobby();
      else if (view === "game" && st) renderGame();
      else if (view === "result" && st) renderResult();
      else { view = "setup"; renderSetup(); }
    }

    registerGame("ludo", {
      mount: function (el) {
        host = el; lxCss();
        host.addEventListener("click", function (e) {
          var b = e.target.closest && e.target.closest("[data-ld]");
          if (!b || !host.contains(b)) return;
          var a = b.getAttribute("data-ld"), k = b.getAttribute("data-k");
          if (a === "mode") {
            cfg.mode = k;
            if (k === "ai") cfg.names = ["You", "Bot 1", "Bot 2", "Bot 3"];
            else if (k === "local") cfg.names = SEAT_NAMES.slice();
            playSfx("click"); renderSetup();
          } else if (a === "turbo") { cfg.turbo = k === "1"; playSfx("click"); renderSetup(); }
          else if (a === "count") { cfg.count = +k; playSfx("click"); renderSetup(); }
          else if (a === "start") { playSfx("click"); startOfflineMatch(); }
          else if (a === "create") { playSfx("click"); createOnlineRoom(); }
          else if (a === "join") { playSfx("click"); joinOnlineRoom((q("#ld-code-in", host) || {}).value); }
          else if (a === "onstart") { playSfx("click"); startOnlineMatch(); }
          else if (a === "copy" && rm) {
            copyText(rm.code); playSfx("click");
            var lab = b.querySelector(".lx-t"); if (lab) { lab.textContent = "Copied!"; setTimeout(function () { lab.textContent = "Copy Code"; }, 1500); }
          }
          else if (a === "leave") { playSfx("click"); leaveOnline(); }
          else if (a === "setup") { playSfx("click"); view = "setup"; render(); }
          else if (a === "studio") { toggleInGameStudio(); }
          else if (a === "roll") { rollDice(); }
          else if (a === "emo") { sendEmoji(k); }
          else if (a === "automove") {
            setPref("autoMove", !P.autoMove); playSfx("click");
            var ab = q("#ld-auto-btn", host); if (ab) ab.classList.toggle("on", P.autoMove);
          } else if (a === "quit") {
            var now = Date.now();
            if (now - quitT < 2500) {
              gen++; clearTimeout(diceT); clearTimeout(botT);
              if (rm) leaveOnline(); else { st = null; view = "setup"; render(); }
            } else { quitT = now; setMsg("Tap ✕ again to quit"); }
          }
        });
        host.addEventListener("input", function (e) {
          var idx = e.target.getAttribute && e.target.getAttribute("data-ld-name");
          if (idx != null) cfg.names[+idx] = e.target.value.slice(0, 14);
          if (e.target.getAttribute && e.target.getAttribute("data-ld-myname")) cfg.myName = e.target.value.slice(0, 14);
          if (e.target.id === "ld-code-in") { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); cfg.code = e.target.value; }
        });
        api.subscribe(function (_, key) {
          if (key === "palette" || key === "all") {
            var cols = seatColors();
            if (st) {
              st.players.forEach(function (p) { p.color = cols[p.seat]; });
              paintDie(st.turn);
              updateHUD();
            } else if (view === "setup") {
              renderSetup();
            } else if (view === "lobby" && rm) {
              renderLobby();
            }
          }
          if (key === "autoMove" || key === "all") {
            var ab = q("#ld-auto-btn", host);
            if (ab) ab.classList.toggle("on", P.autoMove);
          }
          if (key === "style" || key === "board" || key === "piece" || key === "palette" || key === "center" || key === "hints" || key === "theme" || key === "all") {
            offKey = ""; drawFrame();
          }
        });
        if (!resizeBound) {
          resizeBound = true;
          var rt = 0;
          window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (view === "game") resizeBoard(); }, 120); });
          document.addEventListener("visibilitychange", function () { if (!document.hidden) kickLoop(); });
        }
        render();
      },
      onShow: function () { setPlaying(view === "game" && !!st); resizeBoard(); kickLoop(); },
      onHide: function () { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    });
  })();

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

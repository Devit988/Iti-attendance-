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
  function lookEnd() { try { var a = window.ArenaGames; if (a && a.watchLook) a.watchLook(null); if (a && a.restoreLook) a.restoreLook(); } catch (e) { } }
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
        case "bite": tone(2400, 260, "sawtooth", 0.05, 0, 700); tone(1800, 200, "sawtooth", 0.04, 120, 500); break;
        case "chomp": tone(220, 110, "square", 0.22, 0, 60); tone(1000, 70, "sawtooth", 0.12, 0, 260); tone(140, 160, "square", 0.14, 70, 70); break;
        case "swallow": tone(300, 520, "sine", 0.16, 0, 90); tone(220, 520, "triangle", 0.1, 380, 70); tone(180, 120, "square", 0.1, 940, 90); break;
        case "climb": for (i = 0; i < 8; i++) tone(330 + i * 70, 85, "triangle", 0.13, i * 140); tone(1318, 260, "triangle", 0.16, 1150); break;
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
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3), pal = getPalette();
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
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
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
  (function agInjectGameCss() {
    if (document.getElementById("ag-game-mode-css-js")) return;
    var st = document.createElement("style"); st.id = "ag-game-mode-css-js";
    st.textContent = "html.ag-game-on #top-sticky,html.ag-game-on #main-header,html.ag-game-on #search-bar-wrap,html.ag-game-on #bottom-tab-bar,html.ag-game-on nav[aria-label='Primary Sections']{display:none!important}html.ag-game-on body{padding-bottom:0!important}html.ag-game-on,html.ag-game-on body{overflow:hidden!important;overscroll-behavior:none!important}html.ag-game-on body{touch-action:none}html.ag-game-on button,html.ag-game-on canvas,html.ag-game-on [data-ld],html.ag-game-on [data-sl]{touch-action:manipulation}"+
      /* in-game Studio = bottom sheet on top of the game (scrollable, board stays visible above it) */
      "html.ag-game-on #quiz-arena-root .ag-playing.ag-peek-cz .ag-cz{display:block!important;position:fixed!important;left:8px;right:8px;bottom:8px;margin:0!important;max-height:58vh;max-height:58dvh;overflow-y:auto!important;overflow-x:hidden;z-index:2147483000;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y!important;box-shadow:0 -10px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.18)!important;border-radius:20px!important;background:var(--ag-bg2,#fff)!important}"+
      "html.ag-game-on #quiz-arena-root .ag-playing.ag-peek-cz .ag-cz *{touch-action:pan-y}"+
      "html.ag-game-on #quiz-arena-root .ag-playing.ag-peek-cz .ag-cz button,html.ag-game-on #quiz-arena-root .ag-playing.ag-peek-cz .ag-cz canvas{touch-action:manipulation}";
    (document.head || document.documentElement).appendChild(st);
  })();
  function agSyncChrome() {
    try {
      var w = root && root.querySelector(".ag-wrap");
      var v = document.getElementById("view-quiz");
      var on = !!(w && w.classList.contains("ag-playing") && v && !v.classList.contains("hidden"));
      document.documentElement.classList.toggle("ag-game-on", on);
    } catch (e) { }
  }
  ["visibilitychange", "pageshow", "focus", "resize", "orientationchange"].forEach(function (ev) {
    (ev === "visibilitychange" ? document : window).addEventListener(ev, function () { agSyncChrome(); setTimeout(agSyncChrome, 300); });
  });
  setInterval(agSyncChrome, 1000);
  function setPlaying(on) {
    var w = root && root.querySelector(".ag-wrap"); if (!w) return;
    var was = w.classList.contains("ag-playing");
    w.classList.toggle("ag-playing", !!on);
    /* game mode: hide app header, date/clock row & bottom nav while playing */
    document.documentElement.classList.toggle("ag-game-on", !!on);
    if (!on) w.classList.remove("ag-peek-cz");
    if (on && !was) { try { root.scrollIntoView({ block: "start" }); } catch (e) { } }
  }
  function toggleInGameStudio() {
    /* the Studio plugin owns the real open/close state: delegate to it so the panel actually expands */
    var ag = window.ArenaGames;
    if (ag && typeof ag.toggleStudio === "function" && ag.toggleStudio !== toggleInGameStudio) { ag.toggleStudio(); return; }
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
      /* Ludo setup screen: LUDO ARENA banner goes right under the game tabs, above Arena Studio.
         .ag-wrap closes before the game panes, so the root itself is the flex container. */
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero){display:flex;flex-direction:column;gap:10px}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > *{order:3}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > .ag-wrap{display:contents}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > .ag-wrap > *{order:3;margin-bottom:0}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > .ag-wrap > .ag-bar{order:0}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > .ag-wrap > .ag-cz{order:2}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > #ag-pane-ludo{display:contents}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > #ag-pane-ludo > .lx{display:contents}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > #ag-pane-ludo > .lx > *{order:3}",
      "#quiz-arena-root:has(#ag-pane-ludo:not(.ag-off) > .lx > .lx-hero) > #ag-pane-ludo > .lx > .lx-hero{order:1}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero){display:flex;flex-direction:column;gap:10px}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > *{order:3}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > .ag-wrap{display:contents}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > .ag-wrap > *{order:3;margin-bottom:0}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > .ag-wrap > .ag-bar{order:0}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > .ag-wrap > .ag-cz{order:2}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > #ag-pane-snakes{display:contents}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > #ag-pane-snakes > *{order:3}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > #ag-pane-snakes > .sl-hero{order:1}",
      "#quiz-arena-root:has(#ag-pane-snakes:not(.ag-off) > .sl-hero) > #ag-pane-snakes > .bg-box{width:100%}",
      R + ".sl-hero{position:relative;overflow:hidden;width:100%;max-width:30rem;margin:0 auto;border-radius:22px;padding:18px 16px;color:#fff;border:1px solid rgba(255,255,255,.14);background:radial-gradient(120% 100% at 90% -10%,rgba(251,191,36,.36),transparent 55%),radial-gradient(90% 90% at -10% 110%,rgba(34,197,94,.34),transparent 55%),radial-gradient(70% 70% at 50% 125%,rgba(239,68,68,.22),transparent 60%),linear-gradient(160deg,#14301f,#0b1020);box-shadow:0 18px 40px -18px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.18);animation:slEnter .55s cubic-bezier(.2,.9,.3,1.1) both}",
      R + ".sl-hero-in{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px}",
      R + ".sl-title{font-size:38px;line-height:.95;font-weight:900;letter-spacing:.03em;margin-top:4px;background:linear-gradient(180deg,#fff,#fde68a 55%,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}",
      R + ".sl-title span{display:block;font-size:14px;letter-spacing:.34em;margin-top:7px;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444,#38bdf8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
      R + ".sl-sub{font-size:12px;font-weight:600;color:#cbd5e1;margin-top:9px}",
      R + ".sl-orb{position:absolute;z-index:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,currentColor 58%);box-shadow:0 0 16px currentColor;animation:slDrift 6s ease-in-out infinite}",
      R + ".sl-art{flex:none;width:84px;height:84px;margin-right:6px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45));animation:slBob 3.2s ease-in-out infinite}",
      R + ".sl-art svg{display:block;width:100%;height:100%}",
      "@keyframes slEnter{0%{opacity:0;transform:translateY(14px) scale(.94)}100%{opacity:1;transform:none}}",
      "@keyframes slDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(8px,-12px)}}",
      "@keyframes slBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}",
      "@media(prefers-reduced-motion:reduce){#quiz-arena-root .sl-hero,#quiz-arena-root .sl-orb,#quiz-arena-root .sl-art{animation:none!important}}",
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
      R + ".ag-wrap .ag-cz-tabs{grid-template-columns:repeat(5,minmax(0,1fr))}",
      R + ".ag-wrap .ag-cz-tabs .ag-cz-tb{font-size:10px;line-height:1.15;font-weight:800;min-width:0;padding:6px 1px;white-space:nowrap;letter-spacing:-.01em}",
      R + ".ag-wrap .ag-cz-tabs .ag-cz-tb span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".ag-wrap .ag-cz-tabs .ag-cz-tb .ag-i{width:14px;height:14px}",

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
      R + ".bg-dice:not(:disabled){border-color:var(--ag-ac);box-shadow:0 0 0 3px rgba(251,191,36,.28),0 10px 24px -6px rgba(245,158,11,.65)}",
      R + "#ag-pane-snakes .bg-cv-wrap{box-shadow:0 0 0 2px rgba(251,191,36,.38),0 0 26px -4px rgba(251,191,36,.35),0 20px 44px -14px rgba(0,0,0,.7)}",
      R + ".sl-shake{animation:slShake .52s cubic-bezier(.36,.07,.19,.97) both}",
      "@keyframes slShake{10%,90%{transform:translate(-2px,1px)}20%,80%{transform:translate(4px,-2px)}30%,50%,70%{transform:translate(-7px,3px) rotate(-.5deg)}40%,60%{transform:translate(7px,-3px) rotate(.5deg)}}",
      R + ".bg-dice:disabled{opacity:.55}",
      R + ".sl-pg{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      R + ".sl-pc{padding:.2rem .5rem .2rem .2rem;gap:4px;overflow:visible;min-height:62px}",
      R + ".sl-pc.turn{box-shadow:0 0 0 2px var(--ag-ac),0 8px 18px -8px rgba(245,158,11,.7)}",
      R + ".sl-pc .lx-dwrap{flex:none;padding:10px 11px 9px}",
      R + ".sl-pc .lx-die{--s:36px}",
      R + ".sl-pc .lx-dwrap::before{width:50px;height:50px;margin:-31px 0 0 -25px}",
      R + ".sl-pc .lx-sh{width:30px;margin-left:-15px;bottom:1px;height:7px}",
      R + ".sl-pi{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}",
      R + ".sl-pn{display:flex;align-items:center;gap:5px;min-width:0}",
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

    /* ================= WOW ENGINE: living snakes, ladders, FX ================= */
    var REDUCE_SL = false;
    try { REDUCE_SL = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { }
    var lraf = 0, lastDraw = 0, lastF = 0, dprCap = 2.5, lowFx = false, slowFrames = 0;
    var fx = { texts: [], rings: [], flash: null, celebrate: null };
    var biteFx = null, climbFx = null, swallowFx = null;
    var SN_COLS = ["#22c55e", "#ef4444", "#a855f7", "#f97316", "#06b6d4", "#eab308", "#ec4899", "#84cc16"];
    var snakeKeys = Object.keys(SNAKES).map(Number);
    var geoT = -1, geoV = {};

    function resetFx() {
      fx = { texts: [], rings: [], flash: null, celebrate: null };
      biteFx = null; climbFx = null; swallowFx = null; particles = []; geoT = -1; geoV = {};
    }
    function rrp(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function easeIO(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    /* ---------- snake geometry (live, wavy, anchored head & tail) ---------- */
    function biteState(now) {
      var b = biteFx; if (!b) return null;
      var e = (now - b.t0) * api.speed(), s = 0, open = 0, sh = 0, u;
      if (e < 260) { u = e / 260; u = 1 - (1 - u) * (1 - u); s = -0.42 * u; open = 0.55 * u; }
      else if (e < 380) { u = (e - 260) / 120; s = -0.42 + 0.6 * u; open = 0.55 + 0.45 * u; }
      else if (e < 760) { u = (e - 380) / 380; s = 0.18 - 0.12 * Math.min(1, u * 3); open = Math.max(0.1, 1 - u * 4); sh = Math.sin(e * 0.09) * (1 - u); }
      else { s = 0.06 * (1 - Math.min(1, (e - 760) / 300)); open = 0.08; }
      return { s: s, open: open, sh: sh, e: e };
    }
    function snakeGeo(k, now) {
      var f = cellCenter(k, size), t = cellCenter(SNAKES[k], size), cw = f.cw;
      var dx = t.x - f.x, dy = t.y - f.y, len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
      var si = snakeKeys.indexOf(k), dir = si % 2 ? -1 : 1;
      var half = Math.max(2, Math.min(9, Math.round(len / (cw * 1.5))));
      var amp = cw * 0.44 * dir, N = lowFx ? 26 : 40, pts = [], i, tt, env, w, cum = [0];
      var fast = swallowFx && swallowFx.k === k ? 2.6 : 1;
      var ph = REDUCE_SL ? 0 : Math.sin(now * 0.0032 * fast + si * 1.7) * 0.9;
      for (i = 0; i <= N; i++) {
        tt = i / N; env = Math.pow(Math.sin(tt * Math.PI), 0.55);
        w = Math.sin(tt * Math.PI * half + ph) * amp * env;
        pts.push([f.x + dx * tt + nx * w, f.y + dy * tt + ny * w]);
      }
      var open = 0, bs = biteState(now);
      if (bs && biteFx.k === k) {
        var fvx = pts[0][0] - pts[3][0], fvy = pts[0][1] - pts[3][1], fl = Math.sqrt(fvx * fvx + fvy * fvy) || 1;
        fvx /= fl; fvy /= fl;
        var sh2 = bs.sh * cw * 0.05;
        for (i = 0; i < 10; i++) {
          var wg = Math.pow(1 - i / 10, 2);
          pts[i][0] += (fvx * bs.s * cw + nx * sh2) * wg; pts[i][1] += (fvy * bs.s * cw + ny * sh2) * wg;
        }
        open = bs.open;
      }
      for (i = 1; i <= N; i++) { var ddx = pts[i][0] - pts[i - 1][0], ddy = pts[i][1] - pts[i - 1][1]; cum.push(cum[i - 1] + Math.sqrt(ddx * ddx + ddy * ddy)); }
      return { pts: pts, cum: cum, cw: cw, open: open, si: si };
    }
    function geo(k, now) {
      if (geoT !== now) { geoT = now; geoV = {}; }
      return geoV[k] || (geoV[k] = snakeGeo(k, now));
    }
    function pointAt(g, u) {
      var cum = g.cum, tot = cum[cum.length - 1], target = Math.max(0, Math.min(1, u)) * tot, i = 1;
      while (i < cum.length - 1 && cum[i] < target) i++;
      var seg = (cum[i] - cum[i - 1]) || 1, f = (target - cum[i - 1]) / seg, a = g.pts[i - 1], b = g.pts[i];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }

    /* ---------- static board (cached): glossy tiles + wooden ladders ---------- */
    function buildCache() {
      if (!size || !offCtx) return;
      var b = api.getBoard(), key = size + "|" + dpr + "|" + b.id + "|" + (b.modern ? "m" : "c") + "|" + b.dark + "|sl4";
      if (key === offKey) return;
      offKey = key;
      off.width = size * dpr; off.height = size * dpr;
      var c = offCtx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      api.paintBoardBg(c, 0, 0, size, size, 16);

      var cw = cellCenter(1, size).cw, n, p, x, y, alt, base, g, gp = cw * 0.04, rad = cw * 0.17, hs = {}, ts = {}, ls = {}, k;
      for (k in SNAKES) { hs[k] = 1; ts[SNAKES[k]] = 1; }
      for (k in LADDERS) ls[k] = 1;
      for (n = 1; n <= 100; n++) {
        p = cellCenter(n, size); x = p.x - cw / 2 + gp; y = p.y - cw / 2 + gp;
        alt = (Math.floor((n - 1) / 10) + (n - 1)) % 2 === 0; base = alt ? b.cellA : b.cellB;
        g = c.createLinearGradient(x, y, x, y + cw - 2 * gp);
        g.addColorStop(0, shade(base, 0.12)); g.addColorStop(1, shade(base, -0.07));
        c.save(); c.globalAlpha = b.modern ? 0.92 : 1;
        rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fillStyle = g; c.fill();
        c.restore();
        c.strokeStyle = alpha(b.line, 0.3); c.lineWidth = 1; rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.stroke();
        c.save(); c.globalAlpha = 0.5; c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x + rad, y + 1); c.lineTo(x + cw - 2 * gp - rad, y + 1); c.stroke(); c.restore();
        if (hs[n]) { c.fillStyle = "rgba(239,68,68,.24)"; rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fill(); }
        else if (ts[n]) { c.fillStyle = "rgba(239,68,68,.08)"; rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fill(); }
        else if (ls[n]) { c.fillStyle = "rgba(34,197,94,.26)"; rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fill(); }
        if (n === 100) { c.fillStyle = "rgba(251,191,36,.5)"; rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fill(); }
        if (n === 1) { c.fillStyle = alpha(b.accent, 0.25); rrp(c, x, y, cw - 2 * gp, cw - 2 * gp, rad); c.fill(); }
      }
      c.textAlign = "left"; c.textBaseline = "top";
      c.font = "800 " + Math.max(8, Math.round(cw * 0.25)) + "px sans-serif";
      c.fillStyle = alpha(b.text, 0.8);
      for (n = 1; n <= 100; n++) { p = cellCenter(n, size); c.fillText(String(n), p.x - cw / 2 + cw * 0.1, p.y - cw / 2 + cw * 0.08); }
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = "900 " + Math.max(8, Math.round(cw * 0.2)) + "px sans-serif";
      c.fillStyle = b.accent;
      p = cellCenter(1, size); c.fillText("START", p.x, p.y + cw * 0.3);
      p = cellCenter(100, size); c.fillStyle = "#92400e"; c.fillText("WIN", p.x, p.y + cw * 0.3);

      var f, t, dx, dy, len, nx, ny, rungs, r, u;
      for (k in LADDERS) {
        f = cellCenter(+k, size); t = cellCenter(LADDERS[k], size);
        dx = t.x - f.x; dy = t.y - f.y; len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len * cw * 0.17; ny = dx / len * cw * 0.17;
        c.save(); c.lineCap = "round";
        c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = Math.max(3, cw * 0.095);
        c.beginPath(); c.moveTo(f.x + nx + 2, f.y + ny + 3); c.lineTo(t.x + nx + 2, t.y + ny + 3); c.stroke();
        c.beginPath(); c.moveTo(f.x - nx + 2, f.y - ny + 3); c.lineTo(t.x - nx + 2, t.y - ny + 3); c.stroke();
        rungs = Math.max(3, Math.round(len / (cw * 0.42)));
        c.strokeStyle = "#78350f"; c.lineWidth = Math.max(2, cw * 0.07);
        for (r = 1; r < rungs; r++) { u = r / rungs; c.beginPath(); c.moveTo(f.x + dx * u + nx, f.y + dy * u + ny + 1); c.lineTo(f.x + dx * u - nx, f.y + dy * u - ny + 1); c.stroke(); }
        c.strokeStyle = "#fbbf24"; c.lineWidth = Math.max(1.6, cw * 0.05);
        for (r = 1; r < rungs; r++) { u = r / rungs; c.beginPath(); c.moveTo(f.x + dx * u + nx, f.y + dy * u + ny); c.lineTo(f.x + dx * u - nx, f.y + dy * u - ny); c.stroke(); }
        c.strokeStyle = "#92400e"; c.lineWidth = Math.max(3, cw * 0.095);
        c.beginPath(); c.moveTo(f.x + nx, f.y + ny); c.lineTo(t.x + nx, t.y + ny); c.stroke();
        c.beginPath(); c.moveTo(f.x - nx, f.y - ny); c.lineTo(t.x - nx, t.y - ny); c.stroke();
        c.strokeStyle = "#f59e0b"; c.lineWidth = Math.max(1.2, cw * 0.035);
        c.beginPath(); c.moveTo(f.x + nx, f.y + ny); c.lineTo(t.x + nx, t.y + ny); c.stroke();
        c.beginPath(); c.moveTo(f.x - nx, f.y - ny); c.lineTo(t.x - nx, t.y - ny); c.stroke();
        c.fillStyle = "#451a03";
        [[f.x + nx, f.y + ny], [f.x - nx, f.y - ny], [t.x + nx, t.y + ny], [t.x - nx, t.y - ny]].forEach(function (q2) { c.beginPath(); c.arc(q2[0], q2[1], cw * 0.06, 0, TAU); c.fill(); });
        c.restore();
      }
    }

    /* ---------- FX helpers ---------- */
    function spawnBurst(x, y, cols, n, o) {
      if (P.trail === "none") return;
      o = o || {};
      for (var i = 0; i < n; i++) {
        if (particles.length > 260) break;
        var a = Math.random() * TAU, sp = (o.sp || 1.4) + Math.random() * (o.spr || 3.2);
        particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), life: 1, col: cols[i % cols.length],
          sz: (o.sz || 2.2) + Math.random() * (o.szr || 2), g: o.g == null ? 0.06 : o.g, d: o.d || 0.03, rect: o.rect ? 1 : 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.4 });
      }
    }
    function spawnSparks(x, y, col, n) { spawnBurst(x, y, [col], n || 14, {}); }
    function popText(txt, x, y, col, size, dur) {
      var m = size * 3.2;
      fx.texts.push({ txt: txt, x: Math.max(m, Math.min(size0() - m, x)), y: Math.max(size * 1.4, y), col: col, size: size, t0: performance.now(), dur: dur || 1100 });
    }
    function size0() { return size; }
    function addRing(x, y, col, max, dur) { fx.rings.push({ x: x, y: y, col: col, max: max, t0: performance.now(), dur: dur || 520 }); }
    function flashBoard(rgb, a, dur) { fx.flash = { rgb: rgb, a: a, t0: performance.now(), dur: dur || 520 }; }
    function shakeBoard() {
      if (REDUCE_SL) return;
      var w = q(".bg-cv-wrap", host); if (!w) return;
      w.classList.remove("sl-shake"); void w.offsetWidth; w.classList.add("sl-shake");
      setTimeout(function () { w.classList.remove("sl-shake"); }, 560);
    }
    function celebrate(pl) {
      var now = performance.now(), cw = size * 0.092, c = cellCenter(100, size);
      fx.celebrate = { until: now + api.dur(2300) };
      flashBoard("251,191,36", 0.55, 900);
      popText("WINNER!", size / 2, size * 0.42, "#fde047", cw * 0.95, 2300);
      popText(pl.name, size / 2, size * 0.56, "#ffffff", cw * 0.6, 2300);
      spawnBurst(c.x, c.y, ["#fbbf24", "#fde047", "#fff"], 40, { sp: 2, spr: 4.5, g: 0.05 });
      addRing(c.x, c.y, "#fde047", cw * 3, 900);
      [0.25, 0.75].forEach(function (fxp, i) { later(function () { spawnBurst(size * fxp, size * (0.3 + i * 0.2), ["#ef4444", "#22c55e", "#38bdf8", "#fbbf24", "#ec4899"], 34, { sp: 1.6, spr: 4, g: 0.05 }); }, api.dur(300 + i * 350)); });
      vibrate([40, 40, 80, 40, 120]);
    }

    /* ---------- the main painter ---------- */
    function drawHead(c, k, now) {
      var g = geo(k, now), P0 = g.pts[0], P1 = g.pts[4], cw = g.cw, col = SN_COLS[g.si % SN_COLS.length];
      var dark = shade(col, -0.5), ang = Math.atan2(P0[1] - P1[1], P0[0] - P1[0]), hr = cw * 0.28, hh = cw * 0.2, open = g.open || 0;
      var ca = Math.cos(ang), sa = Math.sin(ang), tg = headTarget(k), i;
      var lx = (tg.x - P0[0]) * ca + (tg.y - P0[1]) * sa, ly = -(tg.x - P0[0]) * sa + (tg.y - P0[1]) * ca, ll = Math.sqrt(lx * lx + ly * ly) || 1;
      lx /= ll; ly /= ll;
      c.save(); c.translate(P0[0], P0[1]); c.rotate(ang);
      var fl = REDUCE_SL ? 0 : Math.pow(Math.max(0, Math.sin(now * 0.0065 + g.si * 2.1)), 8);
      if ((fl > 0.05 && open < 0.4) || (open > 0.05 && open < 0.5)) {
        var tl = hr * (0.9 + 0.9 * Math.min(1, fl + open));
        c.strokeStyle = "#ef4444"; c.lineWidth = Math.max(1.4, cw * 0.035); c.lineCap = "round"; c.lineJoin = "round";
        c.beginPath(); c.moveTo(hr * 0.8, 0); c.lineTo(hr + tl * 0.6, 0); c.lineTo(hr + tl, -tl * 0.28); c.moveTo(hr + tl * 0.6, 0); c.lineTo(hr + tl, tl * 0.28); c.stroke();
      }
      var hg = c.createLinearGradient(0, -hh, 0, hh); hg.addColorStop(0, shade(col, 0.32)); hg.addColorStop(1, shade(col, -0.22));
      c.fillStyle = hg; c.strokeStyle = dark; c.lineWidth = Math.max(1.5, cw * 0.045);
      c.beginPath(); c.ellipse(0, 0, hr, hh, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,.28)"; c.beginPath(); c.ellipse(hr * 0.05, -hh * 0.4, hr * 0.5, hh * 0.18, 0, 0, TAU); c.fill();
      if (open > 0.06) {
        c.fillStyle = "#3b0a0a"; c.beginPath(); c.ellipse(hr * 0.42, 0, hr * 0.58, hh * 0.95 * open, 0, 0, TAU); c.fill();
        c.fillStyle = "#fff"; var fh = hh * 0.55 * Math.min(1, open * 1.2), fy = hh * 0.85 * open;
        c.beginPath(); c.moveTo(hr * 0.5, -fy); c.lineTo(hr * 0.7, -fy); c.lineTo(hr * 0.6, -fy + fh); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(hr * 0.5, fy); c.lineTo(hr * 0.7, fy); c.lineTo(hr * 0.6, fy - fh); c.closePath(); c.fill();
      }
      for (i = -1; i <= 1; i += 2) {
        var ex = hr * 0.05, ey = i * hh * 0.56;
        c.fillStyle = "#fff"; c.beginPath(); c.arc(ex, ey, hh * 0.38, 0, TAU); c.fill();
        c.strokeStyle = dark; c.lineWidth = 1; c.stroke();
        c.fillStyle = open > 0.3 ? "#dc2626" : "#0f172a";
        c.beginPath(); c.arc(ex + lx * hh * 0.12, ey + ly * hh * 0.12, hh * 0.19, 0, TAU); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(ex + lx * hh * 0.12 - hh * 0.05, ey + ly * hh * 0.12 - hh * 0.06, hh * 0.05, 0, TAU); c.fill();
        c.fillStyle = dark; c.beginPath(); c.arc(hr * 0.82, i * hh * 0.26, Math.max(1, cw * 0.02), 0, TAU); c.fill();
      }
      c.restore();
    }
    function headTarget(k) {
      if (biteFx && biteFx.k === k && biteFx.pos) return biteFx.pos;
      var pl = st && st.players[st.turn];
      if (pl) { if (pl.anim) return pl.anim; return cellCenter(pl.pos, size); }
      return { x: size / 2, y: size / 2 };
    }
    function drawSnake(c, k, now, skipHead) {
      var g = geo(k, now), pts = g.pts, cw = g.cw, N = pts.length - 1, col = SN_COLS[g.si % SN_COLS.length], i, tt, wd;
      var dark = shade(col, -0.5), mid = shade(col, -0.14), lite = shade(col, 0.3), a, b2;
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = "rgba(0,0,0,.26)"; c.lineWidth = cw * 0.17;
      c.beginPath(); for (i = 0; i <= N; i++) c[i ? "lineTo" : "moveTo"](pts[i][0] + cw * 0.05, pts[i][1] + cw * 0.09); c.stroke();
      for (i = N; i >= 1; i--) {
        tt = (i - 0.5) / N; wd = cw * (0.045 + 0.155 * Math.pow(1 - tt, 0.7)); a = pts[i - 1]; b2 = pts[i];
        c.strokeStyle = dark; c.lineWidth = wd + cw * 0.05; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
      }
      for (i = N; i >= 1; i--) {
        tt = (i - 0.5) / N; wd = cw * (0.045 + 0.155 * Math.pow(1 - tt, 0.7)); a = pts[i - 1]; b2 = pts[i];
        c.strokeStyle = (Math.floor(i / 3) % 2) ? mid : col; c.lineWidth = wd; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
      }
      for (i = N; i >= 1; i--) {
        tt = (i - 0.5) / N; wd = cw * (0.045 + 0.155 * Math.pow(1 - tt, 0.7)); a = pts[i - 1]; b2 = pts[i];
        c.strokeStyle = lite; c.lineWidth = wd * 0.26; c.beginPath(); c.moveTo(a[0], a[1] - wd * 0.2); c.lineTo(b2[0], b2[1] - wd * 0.2); c.stroke();
      }
      c.fillStyle = alpha(dark, 0.55);
      for (i = 5; i < N - 2; i += 4) { tt = i / N; c.beginPath(); c.arc(pts[i][0], pts[i][1], cw * (0.02 + 0.03 * (1 - tt)), 0, TAU); c.fill(); }
      if (swallowFx && swallowFx.k === k) {
        var bp = pointAt(g, swallowFx.u), br = cw * (0.27 + 0.03 * Math.sin(now * 0.02));
        var bgd = c.createRadialGradient(bp[0] - br * 0.3, bp[1] - br * 0.3, br * 0.1, bp[0], bp[1], br);
        bgd.addColorStop(0, lite); bgd.addColorStop(1, mid);
        c.fillStyle = bgd; c.strokeStyle = dark; c.lineWidth = cw * 0.045;
        c.beginPath(); c.arc(bp[0], bp[1], br, 0, TAU); c.fill(); c.stroke();
      }
      c.restore();
      if (!skipHead) drawHead(c, k, now);
    }
    function putToken(c, x, y, r, col, lift, an) {
      if (an && (an.sq || an.a != null)) {
        c.save(); if (an.a != null) c.globalAlpha = an.a;
        c.translate(x, y); if (an.sq) c.scale(1 + an.sq, 1 - an.sq);
        api.drawToken(c, 0, 0, r, col, null, null, lift);
        c.restore();
      } else api.drawToken(c, x, y, r, col, null, null, lift);
    }

    function drawFrame(now) {
      if (!ctx || !size) return;
      now = (typeof now === "number") ? now : performance.now();
      var tStart = performance.now();
      buildCache();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, size, size);
      if (off && off.width) ctx.drawImage(off, 0, 0, size, size);
      if (!st) return;
      var fdt = lastF ? Math.min(3, Math.max(0.3, (now - lastF) / 16.67)) : 1; lastF = now;
      var sp = api.speed(), cw = (size * 0.92) / 10, baseR = Math.max(9, cw * 0.36), i, pl, c0, key, groups = {}, pt;

      /* WIN tile: pulsing golden star */
      var wp = cellCenter(100, size), pulse = REDUCE_SL ? 0.6 : 0.5 + 0.5 * Math.sin(now / 340);
      ctx.save(); ctx.translate(wp.x, wp.y - cw * 0.06); ctx.rotate(now / 2600);
      ctx.fillStyle = "rgba(253,224,71," + (0.16 + 0.16 * pulse).toFixed(3) + ")";
      for (i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw * 0.1, -cw * (0.55 + 0.12 * pulse)); ctx.lineTo(-cw * 0.1, -cw * (0.55 + 0.12 * pulse)); ctx.closePath(); ctx.fill(); }
      ctx.restore();

      /* ladder glow while climbing */
      if (climbFx) {
        var cf = climbFx, ddx = cf.to.x - cf.from.x, ddy = cf.to.y - cf.from.y, ll = Math.sqrt(ddx * ddx + ddy * ddy) || 1, nnx = -ddy / ll * cw * 0.17, nny = ddx / ll * cw * 0.17;
        var ex2 = cf.from.x + ddx * cf.u, ey2 = cf.from.y + ddy * cf.u;
        ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = "rgba(254,240,138,.95)"; ctx.shadowColor = "#fde047"; ctx.shadowBlur = cw * 0.55; ctx.lineWidth = Math.max(2.5, cw * 0.075);
        ctx.beginPath(); ctx.moveTo(cf.from.x + nnx, cf.from.y + nny); ctx.lineTo(ex2 + nnx, ey2 + nny); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cf.from.x - nnx, cf.from.y - nny); ctx.lineTo(ex2 - nnx, ey2 - nny); ctx.stroke();
        var rg = Math.max(3, Math.round(ll / (cw * 0.42))), r2;
        for (r2 = 1; r2 < rg; r2++) { var uu = r2 / rg; if (uu > cf.u) break; ctx.beginPath(); ctx.moveTo(cf.from.x + ddx * uu + nnx, cf.from.y + ddy * uu + nny); ctx.lineTo(cf.from.x + ddx * uu - nnx, cf.from.y + ddy * uu - nny); ctx.stroke(); }
        ctx.restore();
      }

      /* snakes (living) */
      var sk, biting = biteFx ? biteFx.k : -1;
      for (i = 0; i < snakeKeys.length; i++) { sk = snakeKeys[i]; drawSnake(ctx, sk, now, sk === biting); }

      /* tokens: resting first, moving on top */
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i]; if (pl.anim) continue;
        key = String(pl.pos); (groups[key] = groups[key] || []).push(i);
      }
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i]; if (pl.anim) continue;
        c0 = cellCenter(pl.pos, size); var grp = groups[String(pl.pos)], idx = grp.indexOf(i), len = grp.length, ox = 0, oy = 0, sc = 1;
        if (len > 1) { var ang = (idx / len) * TAU - Math.PI / 4, dist = cw * 0.2; ox = Math.cos(ang) * dist; oy = Math.sin(ang) * dist; sc = 0.82; }
        if (i === st.turn && !st.busy && !st.winner) {
          var rp = 1 + 0.12 * Math.sin(now / 260);
          ctx.save(); ctx.strokeStyle = pl.color; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(now / 260);
          ctx.beginPath(); ctx.arc(c0.x + ox, c0.y + oy + baseR * 0.3, baseR * sc * 0.95 * rp, 0, TAU); ctx.stroke(); ctx.restore();
        }
        api.drawToken(ctx, c0.x + ox, c0.y + oy, baseR * sc, pl.color, null, null, REDUCE_SL ? 0 : Math.max(0, Math.sin(now / 420 + i) * cw * 0.03));
      }
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i]; if (!pl.anim) continue;
        var an = pl.anim, sc2 = an.s || 1;
        putToken(ctx, an.x, an.y, baseR * 1.12 * sc2, pl.color, cw * 0.14 * (an.lift == null ? 1 : an.lift), an);
        if (an.tint) { ctx.save(); ctx.strokeStyle = "rgba(239,68,68," + (0.5 + 0.4 * Math.sin(now / 50)).toFixed(2) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(an.x, an.y, baseR * 1.2, 0, TAU); ctx.stroke(); ctx.restore(); }
      }
      if (biting >= 0) drawHead(ctx, biting, now);

      /* rings */
      for (i = fx.rings.length - 1; i >= 0; i--) {
        var rg2 = fx.rings[i], rp2 = (now - rg2.t0) * sp / rg2.dur;
        if (rp2 >= 1) { fx.rings.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = 1 - rp2; ctx.strokeStyle = rg2.col; ctx.lineWidth = Math.max(1.5, cw * 0.12 * (1 - rp2));
        ctx.beginPath(); ctx.arc(rg2.x, rg2.y, rg2.max * easeIO(rp2 * 0.9 + 0.1) * rp2 + 2, 0, TAU); ctx.stroke(); ctx.restore();
      }
      /* celebration confetti */
      if (fx.celebrate) {
        if (now > fx.celebrate.until) fx.celebrate = null;
        else for (i = 0; i < 3; i++) spawnBurst(Math.random() * size, -4, ["#ef4444", "#22c55e", "#38bdf8", "#fbbf24", "#ec4899", "#fff"], 1, { sp: 0.2, spr: 1.2, g: 0.035, d: 0.007, rect: 1, sz: 3, szr: 3 });
      }
      /* particles */
      for (i = particles.length - 1; i >= 0; i--) {
        pt = particles[i];
        pt.vy += (pt.g || 0) * fdt; pt.x += pt.vx * fdt; pt.y += pt.vy * fdt; pt.life -= (pt.d || 0.035) * sp * fdt; pt.rot += (pt.vr || 0) * fdt;
        if (pt.life <= 0 || pt.y > size + 20) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, pt.life * 1.4)); ctx.fillStyle = pt.col;
        if (pt.rect) { ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot); ctx.fillRect(-pt.sz, -pt.sz * 0.5, pt.sz * 2, pt.sz); }
        else { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.sz || 3, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
      /* flash */
      if (fx.flash) {
        var fp = (now - fx.flash.t0) * sp / fx.flash.dur;
        if (fp >= 1) fx.flash = null;
        else {
          var fg = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.75);
          fg.addColorStop(0, "rgba(" + fx.flash.rgb + ",0)"); fg.addColorStop(1, "rgba(" + fx.flash.rgb + "," + (fx.flash.a * (1 - fp)).toFixed(3) + ")");
          ctx.fillStyle = fg; ctx.fillRect(0, 0, size, size);
        }
      }
      /* pop-up texts */
      for (i = fx.texts.length - 1; i >= 0; i--) {
        var tx = fx.texts[i], tp = (now - tx.t0) * sp / tx.dur;
        if (tp >= 1) { fx.texts.splice(i, 1); continue; }
        var ts2 = tp < 0.2 ? 0.5 + (tp / 0.2) * 0.85 : 1.35 - (tp - 0.2) * 0.35, ta = tp > 0.65 ? 1 - (tp - 0.65) / 0.35 : 1;
        ctx.save(); ctx.globalAlpha = Math.max(0, ta); ctx.translate(tx.x, tx.y - tp * tx.size * 1.6); ctx.scale(ts2, ts2);
        ctx.font = "900 " + Math.round(tx.size) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(15,23,42,.85)"; ctx.lineWidth = tx.size * 0.22; ctx.strokeText(tx.txt, 0, 0);
        ctx.fillStyle = tx.col; ctx.fillText(tx.txt, 0, 0); ctx.restore();
      }
      /* adaptive quality: step down by itself if frames are slow */
      var dur = performance.now() - tStart;
      slowFrames = dur > 22 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (!lowFx && slowFrames >= 30) { lowFx = true; dprCap = 1.75; offKey = ""; geoT = -1; setTimeout(resizeBoard, 0); }
    }
    function fxBusy() {
      return !!(st && (st.busy || particles.length || fx.texts.length || fx.rings.length || fx.flash || fx.celebrate));
    }
    function loop(now) {
      lraf = 0;
      if (!cv || !st || view !== "game" || document.hidden) return;
      if (fxBusy() || now - lastDraw >= (lowFx ? 55 : 32)) { lastDraw = now; drawFrame(now); }
      lraf = window.requestAnimationFrame(loop);
    }
    function kickLoop() { if (!lraf && cv && st && view === "game") lraf = window.requestAnimationFrame(loop); }
    function sgResume() { if (document.hidden || !cv) return; offKey = ""; resizeBoard(); kickLoop(); setTimeout(function () { offKey = ""; resizeBoard(); kickLoop(); }, 250); }
    document.addEventListener("visibilitychange", sgResume); window.addEventListener("pageshow", sgResume);

    function resizeBoard() {
      if (!cv || !host) return;
      var wrap = q(".bg-cv-wrap", host); if (!wrap) return;
      var w = Math.floor(wrap.clientWidth);
      if (w < 40) return;
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), dprCap);
      if (w !== size || cv.width !== Math.round(w * dpr)) { size = w; cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); offKey = ""; geoT = -1; }
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
        if (!st || i >= steps.length) { pl.anim = null; if (onDone) onDone(); return; }
        var from = cellCenter(pl.pos, size), to = cellCenter(steps[i], size);
        var start = performance.now(), ms = api.dur(i === steps.length - 1 ? 300 : 250);
        playSfx("move");
        function tick(now) {
          if (!st || g !== gen) return;
          var t = Math.max(0, Math.min(1, (now - start) / ms)), arc = Math.sin(t * Math.PI) * (size * 0.04);
          pl.anim = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - arc, s: 1 + 0.1 * Math.sin(t * Math.PI), sq: t > 0.8 ? 0.14 * Math.sin((t - 0.8) / 0.2 * Math.PI) : 0 };
          if (t < 1) window.requestAnimationFrame(tick);
          else { spawnBurst(to.x, to.y + size * 0.02, [pl.color, "#ffffff"], 5, { sp: 0.5, spr: 1.2, g: 0.03, sz: 1.5, szr: 1.2, d: 0.06 }); pl.pos = steps[i]; i++; stepNext(); }
        }
        window.requestAnimationFrame(tick);
      }
      stepNext();
    }

    /* ladder: the piece hops up rung by rung while the ladder lights up */
    function animateLadder(pl, dest, onDone) {
      var g0 = gen, pos0 = pl.pos, from = cellCenter(pos0, size), to = cellCenter(dest, size), cw = from.cw;
      var dx = to.x - from.x, dy = to.y - from.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var rungs = Math.max(3, Math.round(len / (cw * 0.42))), t0 = performance.now(), MS = 1300, lastSp = 0;
      playSfx("climb"); vibrate(15);
      popText("LADDER!", from.x, from.y - cw * 0.5, "#bbf7d0", cw * 0.52, 950);
      addRing(from.x, from.y, "#4ade80", cw * 1.4, 520);
      spawnBurst(from.x, from.y, ["#34d399", "#bbf7d0"], 14, {});
      climbFx = { from: from, to: to, u: 0 };
      function tick(now) {
        if (!st || g0 !== gen) { climbFx = null; return; }
        var e = (now - t0) * api.speed(), u = Math.max(0, Math.min(1, e / MS)), ue = easeIO(u);
        var hop = Math.abs(Math.sin(ue * rungs * Math.PI)) * cw * 0.11, x = from.x + dx * ue, y = from.y + dy * ue - hop;
        pl.anim = { x: x, y: y, s: 1.1, lift: 0.8 };
        climbFx.u = ue;
        if (now - lastSp > 45) { lastSp = now; spawnBurst(x, y, ["#fde047", "#ffffff"], 2, { sp: 0.3, spr: 0.8, g: 0.04, sz: 1.6, szr: 1.6, d: 0.05 }); }
        if (u < 1) { window.requestAnimationFrame(tick); return; }
        climbFx = null; pl.pos = dest; pl.anim = null;
        flashBoard("250,204,21", 0.38, 560);
        addRing(to.x, to.y, "#fde047", cw * 1.8, 640);
        spawnBurst(to.x, to.y, ["#fbbf24", "#fde047", "#ffffff", "#34d399"], 28, { sp: 1.8, spr: 3.6, g: 0.05 });
        popText("+" + (dest - pos0) + " UP!", to.x, to.y - cw * 0.55, "#fde047", cw * 0.58, 1100);
        vibrate([20, 30, 20]);
        if (onDone) onDone();
      }
      window.requestAnimationFrame(tick);
    }

    /* snake: head rears back, STRIKES, bites, then swallows the piece and slides it down the body */
    function animateSnake(pl, dest, onDone) {
      var g0 = gen, k = pl.pos, c0 = cellCenter(k, size), cw = c0.cw, sp = api.speed(), t0 = performance.now();
      var BITE_END = 760, SLIDE = 1150, POP = 300, struck = false, slid = false, popped = false, tailPos = cellCenter(dest, size);
      biteFx = { k: k, t0: t0, pos: { x: c0.x, y: c0.y } };
      playSfx("bite"); vibrate([20, 30, 20]);
      popText("SSSS…", c0.x, c0.y - cw * 0.95, "#bbf7d0", cw * 0.4, 800);
      function tick(now) {
        if (!st || g0 !== gen) { biteFx = null; swallowFx = null; return; }
        var e = (now - t0) * sp, u, p;
        if (e < BITE_END) {
          if (!struck && e >= 380) {
            struck = true;
            flashBoard("239,68,68", 0.5, 560); shakeBoard();
            addRing(c0.x, c0.y, "#fecaca", cw * 1.7, 540); addRing(c0.x, c0.y, "#ef4444", cw * 1.0, 420);
            spawnBurst(c0.x, c0.y, ["#ef4444", "#fca5a5", "#4ade80", "#ffffff"], 26, { sp: 1.8, spr: 3.6, g: 0.05 });
            popText("SNAKE BITE!", c0.x, c0.y - cw * 0.75, "#fecaca", cw * 0.62, 1250);
            playSfx("chomp"); vibrate([70, 30, 110]);
          }
          pl.anim = { x: c0.x, y: c0.y, s: 1, lift: 0.4, sq: e >= 380 ? 0.24 * Math.sin((e - 380) * 0.07) : 0, tint: e >= 380 ? 1 : 0 };
          window.requestAnimationFrame(tick);
        } else if (e < BITE_END + SLIDE) {
          if (!slid) { slid = true; playSfx("swallow"); }
          u = easeIO((e - BITE_END) / SLIDE); p = pointAt(geo(k, now), u);
          swallowFx = { k: k, u: u };
          pl.anim = { x: p[0], y: p[1], s: 0.5, lift: 0 };
          window.requestAnimationFrame(tick);
        } else if (e < BITE_END + SLIDE + POP) {
          if (!popped) {
            popped = true; swallowFx = null; biteFx = null; pl.pos = dest;
            addRing(tailPos.x, tailPos.y, "#86efac", cw * 1.5, 560);
            spawnBurst(tailPos.x, tailPos.y, ["#4ade80", "#bbf7d0", "#ffffff"], 22, { sp: 1.6, spr: 3.2, g: 0.05 });
            popText("-" + (k - dest) + " DOWN", tailPos.x, tailPos.y - cw * 0.6, "#fca5a5", cw * 0.55, 1100);
          }
          u = (e - BITE_END - SLIDE) / POP;
          pl.anim = { x: tailPos.x, y: tailPos.y, s: 0.5 + 0.5 * u + 0.35 * Math.sin(u * Math.PI), lift: 2 * Math.sin(u * Math.PI) };
          window.requestAnimationFrame(tick);
        } else {
          biteFx = null; swallowFx = null; pl.pos = dest; pl.anim = null;
          if (onDone) onDone();
        }
      }
      window.requestAnimationFrame(tick);
    }

    function animateJump(pl, dest, isLadder, onDone) {
      if (isLadder) animateLadder(pl, dest, onDone); else animateSnake(pl, dest, onDone);
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
          celebrate(pl);
          vibrate([40, 40, 80]);
          if (rm && isActor) pushOnlineState(st.turn, pIdx, pl.name + " wins!");
          later(function () { view = "result"; render(); }, api.dur(2700));
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
      var finalVal = 1 + Math.floor(Math.random() * 6), actor = st.turn, ms = Math.round(api.dur(1000));
      clearTimeout(diceT);
      st.dice = finalVal; st.players[actor].lastDice = finalVal;
      dieVisual(actor, finalVal, ms);
      diceT = later(function () {
        st.rollId = (st.rollId || 0) + 1;
        if (rm) {
          rm.F.updateDoc(rm.ref, {
            "sl.lastMove": { by: actor, val: finalVal, id: st.rollId },
            "sl.dice": finalVal
          }).catch(function () { });
        }
        executeMove(actor, finalVal, true);
      }, ms + 80);
    }

    /* ---------- 3D dice (shared with Ludo) ---------- */
    var slRots = {};
    function dkit() { return api.diceKit; }
    function slRot(i) { return slRots[i] || (slRots[i] = { x: 0, y: 0 }); }
    function dieVisual(idx, val, ms) {
      var k = dkit(); if (!k) return;
      k.roll(q("#sl-die-" + idx, host), q("#sl-dw-" + idx, host), q("#sl-cube-" + idx, host), slRot(idx), val, ms);
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
      var r = rm; rm = null; lookEnd(); st = null; gen++;
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

    function themeSync(g, field) {
      var a = window.ArenaGames; if (!rm || !g || !a || !a.getLook || !a.applyLook) return;
      if (rm.isHost) {
        if (!rm.lookHooked) {
          rm.lookHooked = true;
          a.watchLook(function (l) { if (rm && rm.isHost) { rm.lookSent = JSON.stringify(l); var u = {}; u[field + ".theme"] = l; rm.F.updateDoc(rm.ref, u).catch(function () { }); } });
        }
        var cur = a.getLook(), sig = JSON.stringify(cur);
        if (rm.lookSent !== sig && JSON.stringify(g.theme || null) !== sig) {
          rm.lookSent = sig; var u2 = {}; u2[field + ".theme"] = cur; rm.F.updateDoc(rm.ref, u2).catch(function () { });
        }
      } else if (g.theme) {
        var gs = JSON.stringify(g.theme);
        if (gs !== rm.lookSig) { rm.lookSig = gs; a.applyLook(g.theme); }
      }
    }
    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastRollId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { clearTimeout(rm.wd); rm = null; lookEnd(); st = null; gen++; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.sl) {
          themeSync(d.sl, "sl");
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
              var rms = Math.round(api.dur(1000));
              st.players[actorIdx].lastDice = sl.lastMove.val;
              dieVisual(actorIdx, sl.lastMove.val, rms); updateHUD();
              playSfx("dice");
              later(function () { executeMove(actorIdx, sl.lastMove.val, false); }, rms + 80);
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
      gen++; clearTimeout(diceT); clearTimeout(botT); rm = null; lookEnd();
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
      var pl = st.players[st.turn], can = canRollNow();
      st.players.forEach(function (p, i) {
        var d = q("#sl-die-" + i, host), w = q("#sl-dw-" + i, host); if (!d || !w) return;
        var mine = i === st.turn, ready = mine && can;
        d.disabled = !ready;
        d.classList.toggle("ready", ready); w.classList.toggle("ready", ready); w.classList.toggle("idle", !mine);
      });
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
      var hero = '<div class="sl-hero">' +
        '<i class="sl-orb" style="color:' + cols[0] + ';width:14px;height:14px;left:54%;top:16%"></i>' +
        '<i class="sl-orb" style="color:' + cols[1] + ';width:10px;height:10px;right:8%;top:10%;animation-delay:-2s"></i>' +
        '<i class="sl-orb" style="color:' + (cols[3] || cols[0]) + ';width:12px;height:12px;right:30%;bottom:12%;animation-delay:-4s"></i>' +
        '<i class="sl-orb" style="color:' + (cols[2] || cols[1]) + ';width:16px;height:16px;left:50%;bottom:14%;animation-delay:-1s"></i>' +
        '<div class="sl-hero-in"><div><div class="sl-title">SNAKES<span>&amp; LADDERS</span></div>' +
        '<div class="sl-sub">Climb. Slide. Race to 100.</div></div>' +
        '<div class="sl-art"><svg viewBox="0 0 90 90" aria-hidden="true"><g stroke="#fbbf24" stroke-linecap="round" fill="none"><path d="M14 84L38 10M30 86L54 12" stroke-width="4"/><path d="M17.6 72.9L33.6 74.9M22.4 58.1L38.4 60.1M27.2 43.3L43.2 45.3M32 28.5L48 30.5" stroke-width="3"/></g><path d="M70 12C90 24 50 36 66 52S84 72 62 84" fill="none" stroke="#15803d" stroke-width="10" stroke-linecap="round"/><path d="M70 12C90 24 50 36 66 52S84 72 62 84" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/><circle cx="70" cy="10" r="7" fill="#16a34a"/><circle cx="67.5" cy="8" r="1.8" fill="#fff"/><circle cx="72.5" cy="8" r="1.8" fill="#fff"/><path d="M70 17v6M70 23l-2 3M70 23l2 3" stroke="#ef4444" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg></div></div></div>';
      host.innerHTML = hero + h; icons();
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
      resetFx();
      var h = '<div class="bg-box space-y-2.5">';
      h += '<div class="ag-glass p-2.5 flex items-center justify-between gap-2">' +
        '<button type="button" class="bg-sec" style="padding:.45rem .6rem" data-sl="quit" aria-label="Quit game">' + ico("x") + '</button>' +
        '<div id="sl-msg" class="text-xs font-extrabold text-center truncate flex-1">' + esc(st.msg) + '</div>' +
        '<button type="button" class="bg-sec" style="padding:.45rem .6rem" data-sl="studio" title="Arena Studio">' + ico("sparkles") + '</button></div>';
      h += '<div class="bg-cv-wrap ag-glass"><canvas id="sl-canvas" class="bg-cv"></canvas></div>';
      var K = dkit(); if (K) K.css();
      slRots = {};
      h += '<div class="ag-glass p-2.5 space-y-2">' +
        '<div id="sl-roll-hint" class="text-xs font-extrabold text-center">Tap dice to roll</div>' +
        '<div class="sl-pg">' + st.players.map(function (pl, idx) {
          return '<div id="sl-chip-' + idx + '" class="bg-pchip sl-pc' + (idx === st.turn ? " turn" : "") + '">' +
            '<div class="lx-dwrap lx-big' + (idx === st.turn ? "" : " idle") + '" id="sl-dw-' + idx + '" style="' + (K ? K.vars(pl.color) : "") + '">' +
            '<button type="button" id="sl-die-' + idx + '" class="lx-die" data-sl="roll" aria-label="Roll dice for ' + esc(pl.name) + '" disabled>' + (K ? K.cube("sl-cube-" + idx) : "") + '</button><i class="lx-sh"></i></div>' +
            '<div class="sl-pi"><div class="sl-pn"><span class="bg-dot" style="background:' + pl.color + '"></span><span class="truncate flex-1">' + esc(pl.name) + '</span></div>' +
            '<span class="sl-pos qa-ac font-extrabold">#' + pl.pos + '</span></div></div>';
        }).join("") + '</div></div>';
      h += '<div class="bg-emo-bar">' + ["👏", "😂", "🔥", "😱"].map(function (em) {
        return '<button type="button" class="bg-emo" data-sl="emo" data-k="' + em + '">' + em + '</button>';
      }).join("") + '</div></div></div>';
      host.innerHTML = h; icons();
      cv = q("#sl-canvas", host); ctx = cv.getContext("2d");
      if (!off) { off = document.createElement("canvas"); offCtx = off.getContext("2d"); }
      offKey = "";
      st.players.forEach(function (p, i) { var k = dkit(); if (k) k.set(q("#sl-cube-" + i, host), slRot(i), p.lastDice || 1, false); });
      window.requestAnimationFrame(function () { resizeBoard(); updateHUD(); maybeBot(); kickLoop(); });
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
      onHide: function () { if (lraf) { window.cancelAnimationFrame(lraf); lraf = 0; } }
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
    var cv = null, ctx = null, off = null, offCtx = null, offKey = "", size = 0, dpr = 1, pad = 0;
    var dprCap = 2.5, prevNow = 0, slowN = 0, lastDprT = 0; /* adaptive HD: starts sharp, steps down by itself if frames get slow */
    var raf = 0, lastT = 0, botT = 0, diceT = 0, quitT = 0, particles = [];
    var gen = 0;
    function later(fn, ms) { var g = gen; return setTimeout(function () { if (g !== gen) return; fn(); }, ms); }
    var dieRots = {}, lastTurnShown = -1, resizeBound = false, perDie = false;
    function rotOf(i) { i = i || 0; return dieRots[i] || (dieRots[i] = { x: 0, y: 0 }); }
    function dieEl(i) { return q(perDie ? "#ld-die-" + i : "#ld-die", host); }
    function dwEl(i) { return q(perDie ? "#ld-dw-" + i : ".lx-dwrap", host); }

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
        R + ".lx-mini{position:relative;flex:none;width:46px;height:46px;padding:0;display:block}",
        R + ".lx-mini .lx-die{--s:36px;margin:5px}",
        R + ".lx-mini .lx-sh{display:none}",
        R + ".lx-mini::before{width:50px;height:50px;margin:-25px 0 0 -25px}",
        R + ".lx-mini .lx-die:disabled{opacity:.8}",
        R + ".lx-cell{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}",
        R + ".lx-cell{gap:10px}",
        R + ".lx-cell > .lx-pc{width:100%;box-sizing:border-box;position:relative;z-index:3}",
        R + ".lx-big{position:relative;z-index:1}",
        R + ".lx-big .lx-die.ready{filter:drop-shadow(0 5px 6px rgba(0,0,0,.4)) drop-shadow(0 0 12px var(--dc))}",
        R + ".lx-big:not(.idle) .lx-die{filter:drop-shadow(0 4px 5px rgba(0,0,0,.35))}",
        R + ".lx-big{transition:opacity .25s,filter .25s}",
        R + ".lx-big.idle{opacity:.45;filter:grayscale(.5)}",
        R + ".lx-pdl > .lx-top{justify-content:space-between}",
        R + ".lx-pdl{min-height:calc(100vh - 24px);min-height:calc(100dvh - 24px)}",
        R + ".lx-pdl > .lx-rt{margin-top:auto}",
        R + ".lx-pdl > .lx-rb{margin-bottom:auto}",
        R + ".lx-pc.lx-pd{gap:6px;padding:5px 6px 5px 5px}",
        R + ".lx-pd .lx-av{width:30px;height:30px;font-size:14px}",
        R + ".lx-pd .lx-nm{font-size:11.5px}",
        R + ".lx-pd .lx-tks{gap:3px}",
        R + ".lx-pd .lx-tk{width:9px;height:9px}",
        R + ".lx-pd .lx-mini{width:38px;height:38px}",
        R + ".lx-pd .lx-mini .lx-die{--s:28px;margin:5px}",
        R + ".lx-pd .lx-mini::before{width:40px;height:40px;margin:-20px 0 0 -20px}",
        R + ".lx-bw{position:relative;width:100%;max-width:520px;margin:2px auto;aspect-ratio:1/1}",
        R + ".lx-bw::before{content:\"\";position:absolute;inset:0;border-radius:4.5%;box-shadow:0 22px 44px -16px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06)}",
        R + ".ag-playing .lx-bw{width:min(100%,calc(100vh - 372px));width:min(100%,calc(100dvh - 372px));min-width:240px}",
        R + ".lx-bw.shake{animation:lxShake .45s ease-in-out}",
        R + ".lx-cv{display:block;position:absolute;left:0;top:0;width:100%;height:100%;touch-action:manipulation;pointer-events:none;z-index:1}",
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
        R + ".lx-f{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:calc(var(--s)*.15);border-radius:calc(var(--s)*.2);backface-visibility:hidden;-webkit-backface-visibility:hidden;background:linear-gradient(145deg,#ffffff,#eef2f7 55%,#c9d3e0);border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.9),inset 0 -3px 8px rgba(100,116,139,.35),inset 0 0 0 calc(var(--s)*.035) var(--dc)}",
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
        R + ".lx-core{backface-visibility:visible;-webkit-backface-visibility:visible;border-radius:calc(var(--s)*.06);pointer-events:none}",
        R + ".lx-c1{transform:none}",
        R + ".lx-c2{transform:rotateY(90deg)}",
        R + ".lx-c3{transform:rotateX(90deg)}",
        R + ".lx-cube{--core:#e3e9f1;background:var(--core);border-radius:calc(var(--s)*.2)}",
        R + ".lx-cube::before,.lx-cube::after{content:\"\";position:absolute;inset:0;border-radius:calc(var(--s)*.2);background:var(--core)}",
        R + ".lx-cube::before{transform:rotateY(90deg)}",
        R + ".lx-cube::after{transform:rotateX(90deg)}",
        "#quiz-arena-root[data-ag-dice='obsidian'] .lx-cube{--core:#0f172a}",
        "#quiz-arena-root[data-as-dice='obsidian'] .lx-cube{--core:#0f172a}",
        "#quiz-arena-root[data-ag-dice='neon'] .lx-cube{--core:#1b0f3a}",
        "#quiz-arena-root[data-as-dice='neon'] .lx-cube{--core:#1b0f3a}",
        "#quiz-arena-root[data-ag-dice='gold'] .lx-cube{--core:#e8a317}",
        "#quiz-arena-root[data-as-dice='gold'] .lx-cube{--core:#e8a317}",
        "#quiz-arena-root[data-ag-dice='crystal'] .lx-cube{--core:#bde6fb}",
        "#quiz-arena-root[data-as-dice='crystal'] .lx-cube{--core:#bde6fb}",
        "#quiz-arena-root[data-ag-dice='wood'] .lx-cube{--core:#78350f}",
        "#quiz-arena-root[data-as-dice='wood'] .lx-cube{--core:#78350f}",
        "#quiz-arena-root[data-ag-dice='jade'] .lx-cube{--core:#2fbf8b}",
        "#quiz-arena-root[data-as-dice='jade'] .lx-cube{--core:#2fbf8b}",
        "#quiz-arena-root[data-ag-dice='ruby'] .lx-cube{--core:#d9475f}",
        "#quiz-arena-root[data-as-dice='ruby'] .lx-cube{--core:#d9475f}",
        "#quiz-arena-root[data-ag-dice='candy'] .lx-cube{--core:#e08fd0}",
        "#quiz-arena-root[data-as-dice='candy'] .lx-cube{--core:#e08fd0}",
        "#quiz-arena-root[data-ag-dice='galaxy'] .lx-cube{--core:#1e1b4b}",
        "#quiz-arena-root[data-as-dice='galaxy'] .lx-cube{--core:#1e1b4b}",
        "#quiz-arena-root[data-ag-dice='magma'] .lx-cube{--core:#1c1917}",
        "#quiz-arena-root[data-as-dice='magma'] .lx-cube{--core:#1c1917}",
        "#quiz-arena-root[data-ag-dice='meadow'] .lx-cube{--core:#5cc97f}",
        "#quiz-arena-root[data-as-dice='meadow'] .lx-cube{--core:#5cc97f}",
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
      api.paintBoardBg(c, 0, 0, size, size, size * 0.045);

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
      if (REDUCE) return;
      if (api.spawnTrail) { api.spawnTrail(particles, x, y, col, size || 440); return; }
      if (P.trail === "none") return;
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
        else if (p.k === "h") { p.x += p.vx + Math.sin(p.life * 9) * 0.25; p.y += p.vy; p.life -= 0.032 * sp; }
        else if (p.k === "bb") { p.x += p.vx + Math.sin(p.life * 12) * 0.3; p.y += p.vy; p.life -= 0.03 * sp; }
        else if (p.k === "lf") { p.x += p.vx + Math.sin(p.rot) * 0.35; p.y += p.vy; p.rot += p.vr; p.life -= 0.032 * sp; }
        else if (p.k === "sn") { p.x += p.vx + Math.sin(p.life * 10) * 0.2; p.y += p.vy; p.life -= 0.034 * sp; }
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
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cv.width, cv.height);
      c.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
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

      (api.drawCenter || drawCenterEmblem)(c, size / 2, size / 2, cw * 0.62, t);

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
      for (i = 0; i < draws.length; i++) api.drawToken(c, draws[i].x, draws[i].y, draws[i].r, draws[i].c, null, null, draws[i].lift);
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
        } else if (pt.k === "h") {
          c.translate(pt.x, pt.y); var hz = pt.r * (0.6 + 0.4 * a) * 1.9; c.fillStyle = pt.col;
          c.beginPath(); c.moveTo(0, hz * 0.35); c.bezierCurveTo(-hz, -hz * 0.2, -hz * 0.5, -hz * 0.9, 0, -hz * 0.4); c.bezierCurveTo(hz * 0.5, -hz * 0.9, hz, -hz * 0.2, 0, hz * 0.35); c.fill();
        } else if (pt.k === "bb") {
          c.fillStyle = "rgba(186,230,253,.28)"; c.strokeStyle = "rgba(224,242,254,.95)"; c.lineWidth = 1.2;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(pt.x - pt.r * 0.35, pt.y - pt.r * 0.35, pt.r * 0.22, 0, TAU); c.fill();
        } else if (pt.k === "lf") {
          c.translate(pt.x, pt.y); c.rotate(pt.rot); c.fillStyle = pt.col;
          c.beginPath(); c.moveTo(0, -pt.r); c.quadraticCurveTo(pt.r * 0.95, 0, 0, pt.r); c.quadraticCurveTo(-pt.r * 0.95, 0, 0, -pt.r); c.fill();
          c.strokeStyle = "rgba(20,83,45,.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -pt.r * 0.9); c.lineTo(0, pt.r * 0.9); c.stroke();
        } else if (pt.k === "sn") {
          c.fillStyle = pt.col; c.shadowColor = "rgba(186,230,253,.9)"; c.shadowBlur = 5;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, TAU); c.fill();
        } else if (pt.k === "d" || pt.k === "f") {
          c.fillStyle = pt.col; c.globalCompositeOperation = "lighter"; c.beginPath(); c.arc(pt.x, pt.y, pt.r * a, 0, TAU); c.fill();
        } else {
          c.globalCompositeOperation = "lighter"; c.fillStyle = pt.col; c.shadowColor = pt.col; c.shadowBlur = 8;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r * (0.4 + 0.6 * a), 0, TAU); c.fill();
        }
        c.restore();
      }
    }

    function adaptHd(now) {
      var dt = now - prevNow; prevNow = now;
      if (dt <= 0 || dt > 200) { slowN = 0; return; }
      slowN = dt > 36 ? slowN + 1 : Math.max(0, slowN - 1);
      if (slowN >= 18 && dprCap > 1.5 && now - lastDprT > 1200) { dprCap = dprCap > 2.4 ? 2 : 1.5; slowN = 0; lastDprT = now; resizeBoard(); }
    }
    function loop(now) {
      raf = 0;
      if (!st || view !== "game" || !cv || document.hidden) { prevNow = 0; return; }
      adaptHd(now);
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
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), dprCap);
      var np = Math.round(w / 15 * 1.1), full = w + np * 2; /* transparent margin so edge pawns are never clipped */
      if (w !== size || np !== pad || cv.width !== Math.round(full * dpr)) {
        size = w; pad = np;
        cv.style.left = cv.style.top = (-pad) + "px"; cv.style.width = cv.style.height = full + "px";
        cv.width = Math.round(full * dpr); cv.height = Math.round(full * dpr); offKey = "";
      }
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
    function cubeHTML(spin, idx) {
      return '<div class="lx-tilt"><div class="lx-cube' + (spin ? " spin" : "") + '"' + (spin ? "" : ' id="ld-cube' + (idx == null ? "" : "-" + idx) + '"') + '>' + [1, 2, 3, 4, 5, 6].map(pipFace).join("") + '<div class="lx-f lx-core lx-c1"></div><div class="lx-f lx-core lx-c2"></div><div class="lx-f lx-core lx-c3"></div></div></div>';
    }
    function dieVars(color) { return "--dc:" + color + ";--dp:" + shade(color, -0.42) + ";--dpl:" + shade(color, 0.12) + ";"; }

    function setCube(v, anim, ms, idx) {
      var cube = q(perDie ? "#ld-cube-" + idx : "#ld-cube", host); if (!cube) return;
      var dieRot = rotOf(idx);
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
      var d = dieEl(idx), dw = dwEl(idx); if (!d || !dw) return;
      setCube(val, true, ms, idx);
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
        var d = dieEl(turn); if (d) { d.classList.remove("land"); void d.offsetWidth; d.classList.add("land"); }
        afterDice(finalVal);
      }, ms + 60);
    }

    function handleBoardTap(e) {
      if (!st || !st.awaitMove || !canActNow() || !cv || !st._rendered) return;
      var rect = cv.getBoundingClientRect();
      var x = (e.clientX - rect.left) * ((size + pad * 2) / rect.width) - pad;
      var y = (e.clientY - rect.top) * ((size + pad * 2) / rect.height) - pad;
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
      var r = rm; rm = null; lookEnd(); st = null; gen++;
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

    function themeSync(g, field) {
      var a = window.ArenaGames; if (!rm || !g || !a || !a.getLook || !a.applyLook) return;
      if (rm.isHost) {
        if (!rm.lookHooked) {
          rm.lookHooked = true;
          a.watchLook(function (l) { if (rm && rm.isHost) { rm.lookSent = JSON.stringify(l); var u = {}; u[field + ".theme"] = l; rm.F.updateDoc(rm.ref, u).catch(function () { }); } });
        }
        var cur = a.getLook(), sig = JSON.stringify(cur);
        if (rm.lookSent !== sig && JSON.stringify(g.theme || null) !== sig) {
          rm.lookSent = sig; var u2 = {}; u2[field + ".theme"] = cur; rm.F.updateDoc(rm.ref, u2).catch(function () { });
        }
      } else if (g.theme) {
        var gs = JSON.stringify(g.theme);
        if (gs !== rm.lookSig) { rm.lookSig = gs; a.applyLook(g.theme); }
      }
    }
    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastMoveId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { clearTimeout(rm.wd); rm = null; lookEnd(); st = null; gen++; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.ld) {
          themeSync(d.ld, "ld");
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
      gen++; clearTimeout(diceT); clearTimeout(botT); rm = null; lookEnd();
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
      var die = dieEl(st.turn), dw = dwEl(st.turn);
      if (perDie) {
        st.players.forEach(function (p, i) {
          var di = dieEl(i), wi = dwEl(i), on = rdy && i === st.turn;
          if (di) { di.disabled = !on; di.classList.toggle("ready", on); }
          if (wi) { wi.classList.toggle("ready", on); wi.classList.toggle("idle", i !== st.turn); }
        });
      } else {
        if (die) { die.disabled = !rdy; die.classList.toggle("ready", rdy); }
        if (dw) dw.classList.toggle("ready", rdy);
      }
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
        '<div class="lx-hero-in"><div><div class="lx-title">LUDO<span>ARENA</span></div>' +
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
(perDie ? "" : '<div class="lx-last" id="ld-last-' + idx + '">' + (pl.lastDice || "–") + '</div>') + '</div>';
    }

    function dieBlock(idx) {
      var pl = st.players[idx];
      return '<div class="lx-dwrap lx-big' + (idx === st.turn ? "" : " idle") + '" id="ld-dw-' + idx + '" style="' + dieVars(pl.color) + '">' +
        '<button type="button" id="ld-die-' + idx + '" class="lx-die" data-ld="roll" aria-label="Roll dice for ' + esc(pl.name) + '" disabled>' + cubeHTML(false, idx) + '</button><i class="lx-sh"></i></div>';
    }
    function ldCell(seat, top) {
      var idx = -1, i;
      for (i = 0; i < st.players.length; i++) if (st.players[i].seat === seat) idx = i;
      if (idx < 0) return '<div></div>';
      return '<div class="lx-cell">' + (top ? dieBlock(idx) + ldCard(seat) : ldCard(seat) + dieBlock(idx)) + '</div>';
    }
    function renderGame() {
      perDie = !rm && st.players.filter(function (p) { return !p.bot; }).length >= 2;
      var cur = st.players[st.turn], h = '<div class="lx lx-gap' + (perDie ? " lx-pdl" : "") + '" style="gap:8px">';
      h += '<div class="lx-top lx-enter"><button type="button" class="lx-ib" data-ld="quit" aria-label="Quit game">' + ico("x") + '</button>' +
        (perDie ? '' : '<div id="ld-msg" class="lx-msg">' + esc(st.msg) + '</div>') +
        '<button type="button" class="lx-ib studio" data-ld="studio" aria-label="Arena Studio" title="Live Theme &amp; Piece Studio">' + ico("sparkles") + '</button>' +
        (perDie ? '' : '<button type="button" id="ld-auto-btn" class="lx-pill' + (P.autoMove ? " on" : "") + '" data-ld="automove" title="Auto-move when only 1 piece can move">Auto</button>') + '</div>';
      h += '<div class="lx-row lx-enter' + (perDie ? " lx-rt" : "") + '" style="animation-delay:.05s">' + (perDie ? ldCell(0, true) + ldCell(1, true) : ldCard(0) + ldCard(1)) + '</div>';
      h += '<div class="lx-bw lx-enter" style="animation-delay:.1s"><canvas id="ld-canvas" class="lx-cv"></canvas><div id="ld-toast" class="lx-toast"></div></div>';
      h += '<div class="lx-row lx-enter' + (perDie ? " lx-rb" : "") + '" style="animation-delay:.15s">' + (perDie ? ldCell(3, false) + ldCell(2, false) : ldCard(3) + ldCard(2)) + '</div>';
      if (!perDie) h += '<div class="lx-dock lx-enter" style="animation-delay:.2s;' + dieVars(cur.color) + '">' +
        '<div class="lx-side">' + ["👏", "😂"].map(function (em) { return '<button type="button" class="lx-emo" data-ld="emo" data-k="' + em + '">' + em + '</button>'; }).join("") + '</div>' +
        '<div class="lx-ctr">' + (perDie ? "" : '<div class="lx-dwrap"><button type="button" id="ld-die" class="lx-die" data-ld="roll" aria-label="Roll dice">' + cubeHTML(false) + '</button><i class="lx-sh"></i></div>') +
        '<div id="ld-roll-hint" class="lx-hint"></div></div>' +
        '<div class="lx-side">' + ["🔥", "😱"].map(function (em) { return '<button type="button" class="lx-emo" data-ld="emo" data-k="' + em + '">' + em + '</button>'; }).join("") + '</div></div>';
      h += '</div>';
      host.innerHTML = h; icons();
      cv = q("#ld-canvas", host); ctx = cv.getContext("2d");
      q(".lx-bw", host).addEventListener("click", handleBoardTap);
      if (!off) { off = document.createElement("canvas"); offCtx = off.getContext("2d"); }
      offKey = ""; dieRots = {}; lastTurnShown = -1;
      if (perDie) st.players.forEach(function (p, i) { setCube(p.lastDice || 1, false, 0, i); });
      else setCube(cur.lastDice || 1, false);
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

    /* shared 3D dice kit (Snakes & Ladders reuses Ludo's cube + skins) */
    api.diceKit = {
      css: lxCss,
      vars: dieVars,
      cube: function (id) { return cubeHTML(false, 0).replace('id="ld-cube-0"', 'id="' + id + '"'); },
      set: function (cube, rot, v, anim, ms) {
        if (!cube || !rot) return;
        var t = FACE_ROT[v] || FACE_ROT[1], nx, ny;
        if (anim && !REDUCE) {
          nx = Math.ceil(rot.x / 360) * 360 + 360 * (1 + Math.floor(Math.random() * 2)) + t[0];
          ny = Math.ceil(rot.y / 360) * 360 + 360 * (2 + Math.floor(Math.random() * 2)) + t[1];
          cube.style.transition = "transform " + ms + "ms cubic-bezier(.12,.75,.2,1)";
        } else {
          nx = Math.round(rot.x / 360) * 360 + t[0]; ny = Math.round(rot.y / 360) * 360 + t[1];
          cube.style.transition = "none";
        }
        rot.x = nx; rot.y = ny;
        cube.style.transform = "rotateX(" + nx + "deg) rotateY(" + ny + "deg)";
      },
      roll: function (die, dw, cube, rot, v, ms) {
        if (!die || !dw) return;
        api.diceKit.set(cube, rot, v, true, ms);
        die.style.setProperty("--jd", ms + "ms"); dw.style.setProperty("--jd", ms + "ms");
        die.classList.remove("jump", "land"); dw.classList.remove("rolling"); void die.offsetWidth;
        die.classList.add("jump"); dw.classList.add("rolling");
        setTimeout(function () { die.classList.remove("jump"); dw.classList.remove("rolling"); }, ms + 60);
      }
    };

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
          function onResume() { if (document.hidden) return; offKey = ""; resizeBoard(); kickLoop(); setTimeout(function () { offKey = ""; resizeBoard(); kickLoop(); }, 250); }
          document.addEventListener("visibilitychange", onResume);
          window.addEventListener("pageshow", onResume);
          window.addEventListener("focus", onResume);
        }
        render();
      },
      onShow: function () { setPlaying(view === "game" && !!st); resizeBoard(); kickLoop(); },
      onHide: function () { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    });
  })();

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

/* ================= Arena Studio PRO (merged plugin) ================= */
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
    ["lotus",  "Royal Lotus"],
    ["cat",    "Kitty Cat"],
    ["bear",   "Teddy Bear"],
    ["bunny",  "Bunny Hop"],
    ["panda",  "Panda Pal"],
    ["penguin","Penguin"],
    ["duck",   "Ducky"],
    ["ghost",  "Boo Ghost"],
    ["robot",  "Robo Buddy"],
    ["wizard", "Mini Wizard"],
    ["ninja",  "Chibi Ninja"]
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
    ["wood",     "Walnut Wood",   "#92400e", "#451a03", "#fef3c7"],
    ["jade",     "Jade Stone",    "#d1fae5", "#34d399", "#064e3b"],
    ["ruby",     "Ruby Glass",    "#fecdd3", "#e11d48", "#ffffff"],
    ["candy",    "Candy Swirl",   "#fdf2f8", "#c084fc", "#6b21a8"],
    ["galaxy",   "Galaxy Night",  "#312e81", "#020617", "#c4b5fd"],
    ["magma",    "Magma Rock",    "#292524", "#0c0a09", "#fb923c"],
    ["meadow",   "Meadow Moss",   "#bef264", "#15803d", "#fffbeb"]
  ];

  var TRAILS = [
    ["spark",   "Sparks"],
    ["fire",    "Blaze"],
    ["star",    "Stardust"],
    ["rainbow", "Prism"],
    ["hearts",  "Love Pop"],
    ["bubbles", "Bubbles"],
    ["leaves",  "Leaf Drift"],
    ["snow",    "Snowfall"],
    ["confetti","Party Pop"],
    ["none",    "Clean"]
  ];

  var CENTERS = [
    ["jewel", "Prism Jewel"],
    ["crown", "Royal Crown"],
    ["star",  "North Star"],
    ["heart",  "Love Heart"],
    ["flower", "Happy Bloom"],
    ["planet", "Ringed Planet"],
    ["trophy", "Gold Trophy"]
  ];

  var BOARD_IDS = ["auto", "classic", "grass", "wood", "felt", "cyber", "ocean", "gold", "sakura", "lava", "aurora", "retro"];
  var BOARDS = {
    auto_dark:  { name: "Auto",           base: "#0f172a", base2: "#1e293b", cellA: "#1e293b", cellB: "#172033", track: "#334155", line: "#475569", frame: "#0b1220", text: "#e2e8f0", accent: "#fbbf24", glow: "#fbbf24", dark: true,  tex: "grid" },
    auto_light: { name: "Auto",           base: "#f1f5f9", base2: "#e2e8f0", cellA: "#ffffff", cellB: "#e2e8f0", track: "#ffffff", line: "#94a3b8", frame: "#cbd5e1", text: "#1e293b", accent: "#d97706", glow: "#f59e0b", dark: false, tex: "none" },
    classic:    { name: "Classic Ludo",   base: "#fffdf7", base2: "#f3ead8", cellA: "#ffffff", cellB: "#f1f5f9", track: "#ffffff", line: "#334155", frame: "#1e293b", text: "#0f172a", accent: "#dc2626", glow: "#f59e0b", dark: false, tex: "classic" },
    grass:      { name: "Meadow Grass",   base: "#4ade80", base2: "#15803d", cellA: "#bbf7d0", cellB: "#86efac", track: "#f7fee7", line: "#166534", frame: "#14532d", text: "#14532d", accent: "#facc15", glow: "#86efac", dark: false, tex: "grass" },
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
    { id: "candy",    name: "Candy Rush",   emoji: "🍭", sub: "Pastel pop & prism",   grad: "linear-gradient(135deg,#be185d,#a855f7,#38bdf8)",   set: { style: "modern",  board: "sakura",  piece: "rocket", palette: "pastel",  dice: "ivory",    trail: "rainbow", center: "jewel" } },
    { id: "meadow",   name: "Meadow Picnic", emoji: "🌿", sub: "Grass board · bunny · leaf trail",  grad: "linear-gradient(135deg,#14532d,#22c55e,#bef264)", set: { style: "classic", board: "grass",  piece: "bunny",   palette: "pastel",  dice: "meadow", trail: "leaves",   center: "flower" } },
    { id: "toybox",   name: "Toy Box",       emoji: "🧸", sub: "Teddy pieces · candy dice · hearts", grad: "linear-gradient(135deg,#be185d,#f472b6,#fde68a)", set: { style: "modern",  board: "sakura", piece: "bear",    palette: "pastel",  dice: "candy",  trail: "hearts",   center: "heart" } },
    { id: "ghostpty", name: "Ghost Party",   emoji: "👻", sub: "Boo pieces · galaxy dice · confetti", grad: "linear-gradient(135deg,#1e1b4b,#7c3aed,#22d3ee)", set: { style: "modern",  board: "aurora", piece: "ghost",   palette: "neon",    dice: "galaxy", trail: "confetti", center: "planet" } },
    { id: "pole",     name: "Penguin Pole",  emoji: "🐧", sub: "Penguins · frost dice · snowfall",   grad: "linear-gradient(135deg,#082f49,#38bdf8,#e0f2fe)", set: { style: "modern",  board: "ocean",  piece: "penguin", palette: "classic", dice: "crystal",trail: "snow",     center: "star" } },
    { id: "robolab",  name: "Robo Lab",      emoji: "🤖", sub: "Robo buddies · magma dice · bubbles", grad: "linear-gradient(135deg,#0f172a,#0891b2,#f97316)", set: { style: "modern",  board: "cyber",  piece: "robot",   palette: "sunset",  dice: "magma",  trail: "bubbles",  center: "trophy" } },
    { id: "zen", name: "Zen Garden", emoji: "🎍", sub: "Meadow · lotus · jade dice", grad: "linear-gradient(135deg,#14532d,#34d399,#d1fae5)", set: { style: "modern", board: "grass", piece: "lotus", palette: "pastel", dice: "jade", trail: "leaves", center: "flower" } },
    { id: "moonsakura", name: "Midnight Sakura", emoji: "🌙", sub: "Blossoms · ninja · galaxy dice", grad: "linear-gradient(135deg,#312e81,#ec4899,#fbcfe8)", set: { style: "modern", board: "sakura", piece: "ninja", palette: "pastel", dice: "galaxy", trail: "star", center: "star" } },
    { id: "wizard", name: "Wizard Tower", emoji: "🧙", sub: "Mystic gold · wizard · stardust", grad: "linear-gradient(135deg,#2b123f,#7c3aed,#fbbf24)", set: { style: "modern", board: "gold", piece: "wizard", palette: "royal", dice: "galaxy", trail: "spark", center: "planet" } },
    { id: "dojo", name: "Ninja Dojo", emoji: "🥷", sub: "Timber floor · ninja · obsidian", grad: "linear-gradient(135deg,#3b2210,#7f1d1d,#0f172a)", set: { style: "classic", board: "wood", piece: "ninja", palette: "royal", dice: "obsidian", trail: "spark", center: "star" } },
    { id: "bamboo", name: "Panda Bamboo", emoji: "🐼", sub: "Grass · panda · jade · leaves", grad: "linear-gradient(135deg,#14532d,#4ade80,#f0fdf4)", set: { style: "classic", board: "grass", piece: "panda", palette: "pastel", dice: "jade", trail: "leaves", center: "heart" } },
    { id: "pond", name: "Duck Pond", emoji: "🦆", sub: "Blue lagoon · ducky · bubbles", grad: "linear-gradient(135deg,#0c4a6e,#38bdf8,#fde047)", set: { style: "modern", board: "ocean", piece: "duck", palette: "classic", dice: "crystal", trail: "bubbles", center: "flower" } },
    { id: "catcafe", name: "Cat Cafe", emoji: "🐱", sub: "Warm wood · kitty · hearts", grad: "linear-gradient(135deg,#78350f,#f472b6,#fde68a)", set: { style: "modern", board: "wood", piece: "cat", palette: "pastel", dice: "candy", trail: "hearts", center: "heart" } },
    { id: "space", name: "Space Race", emoji: "🚀", sub: "Aurora sky · rockets · prism", grad: "linear-gradient(135deg,#020617,#7c3aed,#22d3ee)", set: { style: "modern", board: "aurora", piece: "rocket", palette: "neon", dice: "galaxy", trail: "rainbow", center: "planet" } },
    { id: "ruby", name: "Ruby Palace", emoji: "💎", sub: "Royal gold · gems · ruby dice", grad: "linear-gradient(135deg,#450a0a,#be123c,#fbbf24)", set: { style: "classic", board: "gold", piece: "orb", palette: "royal", dice: "ruby", trail: "star", center: "jewel" } },
    { id: "frozen", name: "Frozen Crown", emoji: "❄️", sub: "Ice board · crown · snowfall", grad: "linear-gradient(135deg,#082f49,#7dd3fc,#f0f9ff)", set: { style: "classic", board: "ocean", piece: "crown", palette: "classic", dice: "crystal", trail: "snow", center: "crown" } },
    { id: "pixelq", name: "Pixel Quest", emoji: "🕹️", sub: "8-bit grid · cyber core · confetti", grad: "linear-gradient(135deg,#09090b,#16a34a,#facc15)", set: { style: "modern", board: "retro", piece: "hex", palette: "neon", dice: "neon", trail: "confetti", center: "trophy" } },
    { id: "dragon", name: "Dragon Forge", emoji: "🐉", sub: "Molten forge · crest · magma", grad: "linear-gradient(135deg,#1c0a0a,#b91c1c,#f59e0b)", set: { style: "classic", board: "lava", piece: "shield", palette: "sunset", dice: "magma", trail: "fire", center: "trophy" } },
    { id: "pearl", name: "Pearl & Gold", emoji: "🏆", sub: "Ivory board · crown · 24K dice", grad: "linear-gradient(135deg,#fffdf7,#f59e0b,#b45309)", set: { style: "classic", board: "classic", piece: "crown", palette: "royal", dice: "gold", trail: "star", center: "trophy" } },
    { id: "lagoon", name: "Neon Lagoon", emoji: "🐧", sub: "Deep sea glow · penguin · prism", grad: "linear-gradient(135deg,#0c2a4d,#06b6d4,#a855f7)", set: { style: "modern", board: "ocean", piece: "penguin", palette: "neon", dice: "neon", trail: "rainbow", center: "jewel" } }
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
  var LOOK_KEYS = ["style", "board", "piece", "palette", "dice", "trail", "center"], savedLook = null, lookCb = null;
  function saveStudio() {
    try {
      var o = {}, k; for (k in S) o[k] = S[k];
      if (savedLook) LOOK_KEYS.forEach(function (kk) { o[kk] = savedLook[kk]; }); /* never persist a room's borrowed look */
      localStorage.setItem(LS_KEY, JSON.stringify(o));
    } catch (e) { }
  }

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
    } else if (b.tex === "grass") {
      n = 10; st = w / n;
      for (i = 0; i < n; i += 2) { ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fillRect(x + i * st, y, st, h); }
      var sd = 12345, rnd = function () { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; };
      var nb = Math.round(Math.min(170, w / 3));
      ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, w * 0.004);
      for (i = 0; i < nb; i++) {
        var bx = x + rnd() * w, by = y + rnd() * h, bl = w * (0.012 + rnd() * 0.02), lean = (rnd() - 0.5) * bl;
        ctx.strokeStyle = rnd() < 0.55 ? "rgba(21,128,61,0.42)" : "rgba(217,249,157,0.45)";
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + lean * 0.3, by - bl * 0.6, bx + lean, by - bl); ctx.stroke();
      }
      var fcol = ["#ffffff", "#fde047", "#f9a8d4", "#fdba74"], nf = Math.round(Math.min(24, w / 16));
      for (i = 0; i < nf; i++) {
        var fx = x + rnd() * w, fy = y + rnd() * h, fr = w * (0.006 + rnd() * 0.006);
        ctx.save(); ctx.translate(fx, fy); ctx.globalAlpha = 0.8; ctx.fillStyle = fcol[i % 4];
        for (j = 0; j < 5; j++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.arc(0, -fr, fr * 0.8, 0, TAU); ctx.fill(); }
        ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(0, 0, fr * 0.6, 0, TAU); ctx.fill(); ctx.restore();
      }
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


  var PV_TC = {
    hearts: ["#fb7185", "#f472b6"], bubbles: ["#bae6fd", "#7dd3fc"], leaves: ["#4ade80", "#86efac", "#22c55e"],
    snow: ["#ffffff", "#e0f2fe"], confetti: ["#f43f5e", "#facc15", "#38bdf8", "#4ade80"]
  };
  var CUTE_IDS = ["cat", "bear", "bunny", "panda", "penguin", "duck", "ghost", "robot", "wizard", "ninja"];

  function drawCute(ctx, shape, color, lt, md, dk, haloFill) {
    var g, i;
    function C(x, y, r, f) { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    function E(x, y, rx, ry, f, rot) { ctx.fillStyle = f; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); }
    function eyes(y, dx, r) {
      C(-dx, y, r, "#111827"); C(dx, y, r, "#111827");
      C(-dx + r * 0.32, y - r * 0.34, r * 0.38, "#fff"); C(dx + r * 0.32, y - r * 0.34, r * 0.38, "#fff");
    }
    function cheeks(y, dx, r) { E(-dx, y, r, r * 0.62, "rgba(251,113,133,.6)"); E(dx, y, r, r * 0.62, "rgba(251,113,133,.6)"); }
    function smile(y, w) {
      ctx.strokeStyle = "#111827"; ctx.lineWidth = 0.04; ctx.beginPath();
      ctx.moveTo(-w, y); ctx.quadraticCurveTo(-w * 0.5, y + w * 0.9, 0, y); ctx.quadraticCurveTo(w * 0.5, y + w * 0.9, w, y); ctx.stroke();
    }
    function pedestal() {
      var bg = ctx.createLinearGradient(-0.7, 0, 0.7, 0);
      bg.addColorStop(0, dk); bg.addColorStop(0.4, lt); bg.addColorStop(1, dk);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0.56, 0.62, 0.17, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 0.04; ctx.stroke();
    }
    function bodyGrad(cx, cy, r) {
      var q = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15);
      q.addColorStop(0, lt); q.addColorStop(0.55, color); q.addColorStop(1, dk); return q;
    }
    function shine(x, y, rx, ry) { E(x, y, rx, ry, "rgba(255,255,255,.55)", -0.6); }
    function star5(x, y, R, f) {
      ctx.fillStyle = f; ctx.beginPath();
      for (i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rd = i % 2 ? R * 0.45 : R; if (i) ctx.lineTo(x + Math.cos(a) * rd, y + Math.sin(a) * rd); else ctx.moveTo(x + Math.cos(a) * rd, y + Math.sin(a) * rd); }
      ctx.closePath(); ctx.fill();
    }

    if (shape === "cat") {
      pedestal();
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, -0.04, 0.58, 0, TAU);
        ctx.moveTo(-0.56, -0.16); ctx.lineTo(-0.5, -0.8); ctx.lineTo(-0.1, -0.5); ctx.closePath();
        ctx.moveTo(0.56, -0.16); ctx.lineTo(0.1, -0.5); ctx.lineTo(0.5, -0.8); ctx.closePath();
      }, bodyGrad(0, -0.04, 0.58));
      ctx.fillStyle = "#fda4af";
      ctx.beginPath(); ctx.moveTo(-0.47, -0.3); ctx.lineTo(-0.45, -0.64); ctx.lineTo(-0.2, -0.46); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.47, -0.3); ctx.lineTo(0.2, -0.46); ctx.lineTo(0.45, -0.64); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = alpha(dk, 0.55); ctx.lineWidth = 0.045;
      for (i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 0.13, -0.58 + Math.abs(i) * 0.05); ctx.lineTo(i * 0.13, -0.42 + Math.abs(i) * 0.03); ctx.stroke(); }
      eyes(-0.05, 0.24, 0.1); cheeks(0.13, 0.38, 0.1);
      ctx.fillStyle = "#fb7185"; ctx.beginPath(); ctx.moveTo(-0.06, 0.05); ctx.lineTo(0.06, 0.05); ctx.lineTo(0, 0.12); ctx.closePath(); ctx.fill();
      smile(0.14, 0.12);
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 0.03;
      ctx.beginPath(); ctx.moveTo(-0.42, 0.05); ctx.lineTo(-0.72, 0.0); ctx.moveTo(-0.42, 0.14); ctx.lineTo(-0.72, 0.18);
      ctx.moveTo(0.42, 0.05); ctx.lineTo(0.72, 0.0); ctx.moveTo(0.42, 0.14); ctx.lineTo(0.72, 0.18); ctx.stroke();
      shine(-0.28, -0.33, 0.11, 0.06);
    } else if (shape === "bear") {
      pedestal();
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, -0.02, 0.56, 0, TAU);
        ctx.moveTo(-0.2, -0.5); ctx.arc(-0.4, -0.5, 0.2, 0, TAU);
        ctx.moveTo(0.6, -0.5); ctx.arc(0.4, -0.5, 0.2, 0, TAU);
      }, bodyGrad(0, -0.02, 0.56));
      C(-0.4, -0.5, 0.1, "rgba(255,205,185,.85)"); C(0.4, -0.5, 0.1, "rgba(255,205,185,.85)");
      E(0, 0.12, 0.24, 0.18, "#fef3e2");
      E(0, 0.04, 0.07, 0.05, "#3b1d0e");
      ctx.strokeStyle = "#3b1d0e"; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(0, 0.08); ctx.lineTo(0, 0.14); ctx.stroke();
      smile(0.14, 0.09);
      eyes(-0.12, 0.22, 0.085); cheeks(0.08, 0.4, 0.09);
      shine(-0.26, -0.34, 0.11, 0.06);
    } else if (shape === "bunny") {
      pedestal();
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, 0.08, 0.48, 0, TAU);
        ctx.moveTo(-0.13, -0.46); ctx.ellipse(-0.26, -0.46, 0.13, 0.38, 0, 0, TAU);
        ctx.moveTo(0.39, -0.46); ctx.ellipse(0.26, -0.46, 0.13, 0.38, 0, 0, TAU);
      }, bodyGrad(0, -0.1, 0.65));
      E(-0.26, -0.44, 0.065, 0.26, "#fda4af"); E(0.26, -0.44, 0.065, 0.26, "#fda4af");
      eyes(0.03, 0.2, 0.085); cheeks(0.17, 0.34, 0.09);
      E(0, 0.12, 0.05, 0.035, "#fb7185"); smile(0.17, 0.09);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.02;
      ctx.fillRect(-0.05, 0.2, 0.045, 0.08); ctx.strokeRect(-0.05, 0.2, 0.045, 0.08);
      ctx.fillRect(0.005, 0.2, 0.045, 0.08); ctx.strokeRect(0.005, 0.2, 0.045, 0.08);
    } else if (shape === "panda") {
      pedestal();
      var pg = ctx.createRadialGradient(-0.2, -0.3, 0.05, 0, -0.02, 0.65);
      pg.addColorStop(0, "#ffffff"); pg.addColorStop(0.6, "#f1f5f9"); pg.addColorStop(1, "#94a3b8");
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, -0.02, 0.56, 0, TAU);
        ctx.moveTo(-0.2, -0.5); ctx.arc(-0.4, -0.5, 0.2, 0, TAU);
        ctx.moveTo(0.6, -0.5); ctx.arc(0.4, -0.5, 0.2, 0, TAU);
      }, pg);
      C(-0.4, -0.5, 0.16, "#1f2937"); C(0.4, -0.5, 0.16, "#1f2937");
      E(-0.2, -0.06, 0.13, 0.17, "#1f2937", 0.45); E(0.2, -0.06, 0.13, 0.17, "#1f2937", -0.45);
      C(-0.2, -0.08, 0.055, "#fff"); C(0.2, -0.08, 0.055, "#fff");
      C(-0.19, -0.07, 0.03, "#111827"); C(0.19, -0.07, 0.03, "#111827");
      E(0, 0.1, 0.07, 0.045, "#111827"); smile(0.16, 0.1); cheeks(0.14, 0.38, 0.085);
      ctx.fillStyle = color; ctx.strokeStyle = dk; ctx.lineWidth = 0.035;
      ctx.beginPath(); ctx.moveTo(0, 0.47); ctx.lineTo(-0.22, 0.35); ctx.lineTo(-0.22, 0.59); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0.47); ctx.lineTo(0.22, 0.35); ctx.lineTo(0.22, 0.59); ctx.closePath(); ctx.fill(); ctx.stroke();
      C(0, 0.47, 0.06, lt);
    } else if (shape === "penguin") {
      E(-0.22, 0.6, 0.17, 0.07, "#fb923c"); E(0.22, 0.6, 0.17, 0.07, "#fb923c");
      haloFill(function () { ctx.beginPath(); ctx.ellipse(0, -0.02, 0.52, 0.64, 0, 0, TAU); }, bodyGrad(0, -0.02, 0.6));
      E(-0.54, 0.14, 0.12, 0.34, md, 0.25); E(0.54, 0.14, 0.12, 0.34, md, -0.25);
      E(0, 0.14, 0.33, 0.44, "#fffbeb");
      C(-0.17, -0.3, 0.12, "#fff"); C(0.17, -0.3, 0.12, "#fff");
      C(-0.15, -0.29, 0.065, "#111827"); C(0.15, -0.29, 0.065, "#111827");
      C(-0.13, -0.31, 0.025, "#fff"); C(0.17, -0.31, 0.025, "#fff");
      E(0, -0.12, 0.12, 0.07, "#fb923c"); E(0, -0.09, 0.09, 0.035, "#f97316");
      E(-0.3, -0.08, 0.07, 0.045, "rgba(251,113,133,.6)"); E(0.3, -0.08, 0.07, 0.045, "rgba(251,113,133,.6)");
      shine(-0.28, -0.46, 0.1, 0.055);
    } else if (shape === "duck") {
      pedestal();
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, 0.18, 0.46, 0, TAU);
        ctx.moveTo(0.34, -0.34); ctx.arc(0, -0.34, 0.34, 0, TAU);
      }, bodyGrad(0, -0.06, 0.7));
      E(-0.3, 0.24, 0.14, 0.2, "rgba(255,255,255,.28)", 0.3); E(0.3, 0.24, 0.14, 0.2, "rgba(255,255,255,.28)", -0.3);
      E(0, -0.24, 0.17, 0.09, "#fb923c"); E(0, -0.21, 0.15, 0.04, "#f97316");
      C(-0.14, -0.42, 0.06, "#111827"); C(0.14, -0.42, 0.06, "#111827");
      C(-0.12, -0.44, 0.022, "#fff"); C(0.16, -0.44, 0.022, "#fff");
      E(-0.27, -0.28, 0.07, 0.045, "rgba(251,113,133,.6)"); E(0.27, -0.28, 0.07, 0.045, "rgba(251,113,133,.6)");
      ctx.strokeStyle = lt; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(-0.03, -0.66); ctx.quadraticCurveTo(-0.12, -0.84, 0.03, -0.8); ctx.stroke();
      shine(-0.2, -0.54, 0.09, 0.05);
    } else if (shape === "ghost") {
      var gg = ctx.createRadialGradient(-0.22, -0.4, 0.05, 0, 0, 0.8);
      gg.addColorStop(0, "#ffffff"); gg.addColorStop(0.45, lt); gg.addColorStop(1, color);
      haloFill(function () {
        ctx.beginPath(); ctx.moveTo(-0.55, 0.52); ctx.lineTo(-0.55, -0.1); ctx.arc(0, -0.1, 0.55, Math.PI, TAU); ctx.lineTo(0.55, 0.52);
        for (var k = 0; k < 3; k++) { var xa = 0.55 - k * 0.3667, xb = xa - 0.3667; ctx.quadraticCurveTo((xa + xb) / 2, 0.8, xb, 0.52); }
        ctx.closePath();
      }, gg);
      E(-0.2, -0.12, 0.09, 0.13, "#111827"); E(0.2, -0.12, 0.09, 0.13, "#111827");
      C(-0.17, -0.17, 0.03, "#fff"); C(0.23, -0.17, 0.03, "#fff");
      E(0, 0.1, 0.07, 0.09, "#111827"); E(0, 0.14, 0.04, 0.035, "#fb7185");
      cheeks(0.05, 0.36, 0.1);
      shine(-0.3, -0.42, 0.1, 0.055);
    } else if (shape === "robot") {
      pedestal();
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(0, -0.72); ctx.stroke();
      C(0, -0.76, 0.09, "#f43f5e"); C(-0.03, -0.79, 0.03, "#fff");
      haloFill(function () { rr(ctx, -0.52, -0.5, 1.04, 0.9, 0.22); }, bodyGrad(0, -0.05, 0.62));
      C(-0.52, -0.05, 0.07, "#cbd5e1"); C(0.52, -0.05, 0.07, "#cbd5e1");
      rr(ctx, -0.4, -0.3, 0.8, 0.4, 0.14); ctx.fillStyle = "#0b1020"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 0.03; ctx.stroke();
      C(-0.2, -0.1, 0.1, "#22d3ee"); C(0.2, -0.1, 0.1, "#22d3ee"); C(-0.17, -0.13, 0.035, "#fff"); C(0.23, -0.13, 0.035, "#fff");
      rr(ctx, -0.2, 0.2, 0.4, 0.1, 0.04); ctx.fillStyle = "#0b1020"; ctx.fill();
      ctx.strokeStyle = lt; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(-0.1, 0.2); ctx.lineTo(-0.1, 0.3); ctx.moveTo(0, 0.2); ctx.lineTo(0, 0.3); ctx.moveTo(0.1, 0.2); ctx.lineTo(0.1, 0.3); ctx.stroke();
      E(-0.38, 0.2, 0.07, 0.04, "rgba(251,113,133,.6)"); E(0.38, 0.2, 0.07, 0.04, "rgba(251,113,133,.6)");
    } else if (shape === "wizard") {
      haloFill(function () {
        ctx.beginPath(); ctx.arc(0, 0.16, 0.4, 0, TAU);
        ctx.moveTo(-0.5, -0.1); ctx.lineTo(0.14, -0.88); ctx.lineTo(0.5, -0.1); ctx.closePath();
        ctx.moveTo(0.64, -0.08); ctx.ellipse(0, -0.08, 0.64, 0.14, 0, 0, TAU);
      }, bodyGrad(0, -0.4, 0.8));
      C(0, 0.16, 0.34, "#fde7c8");
      ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.03;
      ctx.beginPath(); ctx.moveTo(-0.34, 0.16); ctx.quadraticCurveTo(-0.42, 0.58, 0, 0.66); ctx.quadraticCurveTo(0.42, 0.58, 0.34, 0.16); ctx.quadraticCurveTo(0, 0.32, -0.34, 0.16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.moveTo(-0.4, -0.22); ctx.lineTo(0.445, -0.22); ctx.lineTo(0.5, -0.1); ctx.lineTo(-0.5, -0.1); ctx.closePath(); ctx.fill();
      star5(0.02, -0.52, 0.1, "#fde047");
      C(-0.14, 0.09, 0.055, "#111827"); C(0.14, 0.09, 0.055, "#111827"); C(-0.12, 0.07, 0.02, "#fff"); C(0.16, 0.07, 0.02, "#fff");
      E(0, 0.19, 0.06, 0.045, "#fb923c"); cheeks(0.16, 0.24, 0.06);
    } else if (shape === "ninja") {
      haloFill(function () { ctx.beginPath(); ctx.arc(0, -0.02, 0.58, 0, TAU); }, bodyGrad(0, -0.02, 0.58));
      E(0, 0.1, 0.4, 0.2, "#fde7c8");
      ctx.save(); ctx.beginPath(); ctx.arc(0, -0.02, 0.58, 0, TAU); ctx.clip();
      ctx.fillStyle = "#111827"; ctx.fillRect(-0.7, -0.4, 1.4, 0.2); ctx.restore();
      ctx.fillStyle = "#111827";
      ctx.beginPath(); ctx.moveTo(0.52, -0.32); ctx.lineTo(0.86, -0.5); ctx.lineTo(0.76, -0.32); ctx.lineTo(0.88, -0.18); ctx.lineTo(0.52, -0.24); ctx.closePath(); ctx.fill();
      rr(ctx, -0.15, -0.4, 0.3, 0.2, 0.05); ctx.fillStyle = "#cbd5e1"; ctx.fill(); star5(0, -0.3, 0.07, "#475569");
      eyes(0.08, 0.17, 0.065); cheeks(0.19, 0.3, 0.06);
      shine(-0.3, -0.12, 0.09, 0.05);
    }
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
    } else if (CUTE_IDS.indexOf(shape) >= 0) {
      drawCute(ctx, shape, color, lt, md, dk, haloFill);
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
    } else if (S.center === "heart") {
      var hs = r * (1 + 0.07 * Math.sin(t / 260));
      c.translate(cx, cy);
      for (i = 0; i < 4; i++) {
        var oa = t / 1400 + i * TAU / 4;
        c.save(); c.translate(Math.cos(oa) * r * 1.02, Math.sin(oa) * r * 1.02);
        c.fillStyle = cols[i]; c.shadowColor = cols[i]; c.shadowBlur = r * 0.3;
        c.beginPath(); c.moveTo(0, r * 0.14); c.bezierCurveTo(-r * 0.24, -r * 0.02, -r * 0.12, -r * 0.24, 0, -r * 0.12); c.bezierCurveTo(r * 0.12, -r * 0.24, r * 0.24, -r * 0.02, 0, r * 0.14); c.fill(); c.restore();
      }
      c.shadowColor = "rgba(244,63,94,.85)"; c.shadowBlur = r * 0.8;
      g = c.createRadialGradient(-hs * 0.25, -hs * 0.3, hs * 0.05, 0, 0, hs);
      g.addColorStop(0, "#ffe4e6"); g.addColorStop(0.5, "#fb7185"); g.addColorStop(1, "#be123c");
      c.beginPath(); c.moveTo(0, hs * 0.72); c.bezierCurveTo(-hs * 1.15, -hs * 0.05, -hs * 0.62, -hs * 0.92, 0, -hs * 0.4); c.bezierCurveTo(hs * 0.62, -hs * 0.92, hs * 1.15, -hs * 0.05, 0, hs * 0.72);
      c.fillStyle = g; c.fill(); c.shadowBlur = 0; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, r * 0.08); c.stroke();
      c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.ellipse(-hs * 0.38, -hs * 0.3, hs * 0.14, hs * 0.08, -0.6, 0, TAU); c.fill();
    } else if (S.center === "flower") {
      var fa = (t / 4000) % TAU;
      c.translate(cx, cy); c.rotate(fa);
      c.shadowColor = "rgba(255,255,255,.6)"; c.shadowBlur = r * 0.35;
      for (i = 0; i < 8; i++) {
        c.save(); c.rotate(i * TAU / 8);
        g = c.createRadialGradient(0, -r * 0.62, 0, 0, -r * 0.62, r * 0.42); g.addColorStop(0, "#ffffff"); g.addColorStop(1, cols[i % 4]);
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -r * 0.66, r * 0.27, r * 0.4, 0, 0, TAU); c.fill();
        c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = Math.max(1, r * 0.04); c.stroke(); c.restore();
      }
      c.shadowBlur = 0; c.rotate(-fa);
      g = c.createRadialGradient(-r * 0.1, -r * 0.12, r * 0.05, 0, 0, r * 0.4); g.addColorStop(0, "#fef9c3"); g.addColorStop(1, "#f59e0b");
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.2, r * 0.06); c.stroke();
      c.fillStyle = "#451a03"; c.beginPath(); c.arc(-r * 0.14, -r * 0.06, r * 0.05, 0, TAU); c.fill(); c.beginPath(); c.arc(r * 0.14, -r * 0.06, r * 0.05, 0, TAU); c.fill();
      c.strokeStyle = "#451a03"; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.arc(0, r * 0.04, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    } else if (S.center === "planet") {
      var pr = r * 0.62, tilt = -0.42, ma = t / 900;
      c.translate(cx, cy);
      c.shadowColor = "rgba(125,211,252,.8)"; c.shadowBlur = r * 0.7;
      c.save(); c.rotate(tilt); c.strokeStyle = "rgba(253,224,71,.85)"; c.lineWidth = Math.max(2, r * 0.13);
      c.beginPath(); c.ellipse(0, 0, r * 1.02, r * 0.3, 0, Math.PI, TAU); c.stroke(); c.restore();
      c.shadowBlur = 0;
      g = c.createRadialGradient(-pr * 0.35, -pr * 0.4, pr * 0.1, 0, 0, pr * 1.05);
      g.addColorStop(0, "#bae6fd"); g.addColorStop(0.5, "#38bdf8"); g.addColorStop(1, "#1e3a8a");
      c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.fillStyle = g; c.fill();
      c.save(); c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.clip(); c.fillStyle = "rgba(74,222,128,.75)";
      c.beginPath(); c.ellipse(-pr * 0.3, -pr * 0.1, pr * 0.34, pr * 0.22, 0.5, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(pr * 0.38, pr * 0.34, pr * 0.3, pr * 0.16, -0.4, 0, TAU); c.fill(); c.restore();
      c.save(); c.rotate(tilt); c.strokeStyle = "rgba(253,224,71,.95)"; c.lineWidth = Math.max(2, r * 0.13);
      c.beginPath(); c.ellipse(0, 0, r * 1.02, r * 0.3, 0, 0, Math.PI); c.stroke();
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(Math.cos(ma) * r * 1.02, Math.sin(ma) * r * 0.3, r * 0.1, 0, TAU); c.fill(); c.restore();
    } else if (S.center === "trophy") {
      var ts = r * 0.95, bob = Math.sin(t / 380) * r * 0.04;
      c.translate(cx, cy + bob);
      c.shadowColor = "rgba(251,191,36,.9)"; c.shadowBlur = r * 0.8;
      g = c.createLinearGradient(-ts * 0.6, 0, ts * 0.6, 0);
      g.addColorStop(0, "#b45309"); g.addColorStop(0.35, "#fde047"); g.addColorStop(0.7, "#f59e0b"); g.addColorStop(1, "#92400e");
      c.fillStyle = g; c.strokeStyle = "#78350f"; c.lineWidth = Math.max(1, r * 0.05);
      c.beginPath(); c.moveTo(-ts * 0.55, -ts * 0.62); c.lineTo(ts * 0.55, -ts * 0.62);
      c.bezierCurveTo(ts * 0.55, ts * 0.1, ts * 0.25, ts * 0.3, 0, ts * 0.34); c.bezierCurveTo(-ts * 0.25, ts * 0.3, -ts * 0.55, ts * 0.1, -ts * 0.55, -ts * 0.62); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-ts * 0.55, -ts * 0.5); c.bezierCurveTo(-ts * 0.98, -ts * 0.5, -ts * 0.9, -ts * 0.05, -ts * 0.4, ts * 0.05); c.stroke();
      c.beginPath(); c.moveTo(ts * 0.55, -ts * 0.5); c.bezierCurveTo(ts * 0.98, -ts * 0.5, ts * 0.9, -ts * 0.05, ts * 0.4, ts * 0.05); c.stroke();
      c.fillRect(-ts * 0.09, ts * 0.32, ts * 0.18, ts * 0.25); c.fillRect(-ts * 0.4, ts * 0.55, ts * 0.8, ts * 0.2); c.strokeRect(-ts * 0.4, ts * 0.55, ts * 0.8, ts * 0.2);
      c.shadowBlur = 0; c.fillStyle = "#fffbeb"; c.beginPath();
      for (i = 0; i < 10; i++) { var sa = -Math.PI / 2 + i * Math.PI / 5, sr = i % 2 ? ts * 0.1 : ts * 0.22; if (i) c.lineTo(Math.cos(sa) * sr, -ts * 0.22 + Math.sin(sa) * sr); else c.moveTo(Math.cos(sa) * sr, -ts * 0.22 + Math.sin(sa) * sr); }
      c.closePath(); c.fill(); c.strokeStyle = "#b45309"; c.lineWidth = 1; c.stroke();
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
    } else if (S.trail === "hearts") {
      particles.push({ k: "h", x: x, y: y, vx: (Math.random() - 0.5) * 0.5, vy: -0.7 - Math.random() * 0.7, life: 1, col: Math.random() < 0.5 ? "#fb7185" : "#f472b6", r: sz * 0.02 });
    } else if (S.trail === "bubbles") {
      particles.push({ k: "bb", x: x, y: y, vx: (Math.random() - 0.5) * 0.5, vy: -0.5 - Math.random() * 0.6, life: 1, col: "#bae6fd", r: sz * (0.009 + Math.random() * 0.012) });
    } else if (S.trail === "leaves") {
      particles.push({ k: "lf", x: x, y: y, vx: (Math.random() - 0.5) * 0.6, vy: 0.25 + Math.random() * 0.45, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.22, life: 1, col: Math.random() < 0.5 ? "#4ade80" : (Math.random() < 0.5 ? "#22c55e" : "#bef264"), r: sz * 0.019 });
    } else if (S.trail === "snow") {
      particles.push({ k: "sn", x: x, y: y, vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.4, life: 1, col: "#ffffff", r: sz * (0.007 + Math.random() * 0.008) });
    } else if (S.trail === "confetti") {
      particles.push({ k: "c", x: x, y: y, vx: (Math.random() - 0.5) * 1.8, vy: -0.9 - Math.random() * 1.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.4, w: sz * 0.012, h: sz * 0.022, life: 0.6, col: "hsl(" + Math.floor(Math.random() * 360) + ",90%,60%)" });
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

  /* ---------- HD themed scenes for the full-screen backdrop (one hand-painted scene per board) ---------- */
  function bdRng(seed) { var t = seed >>> 0; return function () { t += 0x6D2B79F5; var r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function bdA(hex, al) { var h = String(hex || "#000").replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16) || 0; return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + al + ")"; }
  function bdLin(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i++) g.addColorStop(st[i][0], st[i][1]); return g; }
  function bdRad(c, x, y, r, st) { var g = c.createRadialGradient(x, y, 0, x, y, r); for (var i = 0; i < st.length; i++) g.addColorStop(st[i][0], st[i][1]); return g; }
  function bdGlow(c, x, y, r, col, al) { c.fillStyle = bdRad(c, x, y, r, [[0, bdA(col, al)], [1, bdA(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
  function bdDot(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
  function bdStar4(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
  function bdVignette(c, w, h, al) { c.fillStyle = bdRad(c, w / 2, h * 0.46, Math.max(w, h) * 0.78, [[0, "rgba(0,0,0,0)"], [0.62, "rgba(0,0,0,0)"], [1, "rgba(0,0,0," + al + ")"]]); c.fillRect(0, 0, w, h); }
  function bdPetal(c, x, y, s, rot, fill) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = fill; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s * 0.9, -s * 0.5, -s * 0.7, -s * 1.5, 0, -s * 1.25); c.bezierCurveTo(s * 0.7, -s * 1.5, s * 0.9, -s * 0.5, 0, 0); c.fill(); c.restore(); }

  var BD_SCENES = {
    mesh: function (c, b, w, h, R) {
      var i, x, y, P = [[0.1, 0.06, b.glow], [0.96, 0.3, b.accent], [0.04, 0.8, b.accent], [0.92, 0.96, b.glow]];
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, b.base2], [1, b.base]]); c.fillRect(0, 0, w, h);
      for (i = 0; i < P.length; i++) bdGlow(c, P[i][0] * w, P[i][1] * h, w * 0.95, P[i][2], b.dark ? 0.3 : 0.26);
      for (y = 13; y < h; y += 26) for (x = 13; x < w; x += 26) bdDot(c, x, y, 1.1, b.dark ? "rgba(255,255,255,.07)" : bdA(b.line, 0.18));
      bdVignette(c, w, h, b.dark ? 0.4 : 0.1);
    },
    classic: function (c, b, w, h, R) {
      var i, cs = [["#ef4444", 0, 0], ["#22c55e", w, 0], ["#38bdf8", 0, h], ["#facc15", w, h]];
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#fffdf7"], [1, "#f1e6cf"]]); c.fillRect(0, 0, w, h);
      c.lineWidth = 1; c.strokeStyle = "rgba(146,64,14,.07)";
      c.beginPath(); for (i = -h; i < w; i += 34) { c.moveTo(i, 0); c.lineTo(i + h, h); c.moveTo(i + h, 0); c.lineTo(i, h); } c.stroke();
      for (i = 0; i < 4; i++) bdGlow(c, cs[i][1], cs[i][2], w * 0.95, cs[i][0], 0.3);
      bdGlow(c, w / 2, h * 0.5, w * 0.8, "#ffffff", 0.7);
      bdVignette(c, w, h, 0.16);
    },
    grass: function (c, b, w, h, R) {
      var i, k, x, y, L, ph, cl = ["#a7f3d0", "#86efac", "#4ade80", "#16a34a", "#166534"];
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#7dd3fc"], [0.4, "#d9f99d"], [1, "#4ade80"]]); c.fillRect(0, 0, w, h);
      bdGlow(c, w * 0.82, h * 0.08, w * 0.6, "#fef9c3", 0.95);
      for (i = 0; i < 5; i++) { x = R() * w; y = h * (0.06 + R() * 0.2); for (k = 0; k < 5; k++) { c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(x + k * 22 - 40, y + (k % 2) * 6, 30 + R() * 14, 14 + R() * 6, 0, 0, 6.2832); c.fill(); } }
      for (L = 0; L < 5; L++) {
        y = h * (0.5 + L * 0.095); ph = R() * 6; c.fillStyle = cl[L]; c.beginPath(); c.moveTo(0, h);
        for (x = 0; x <= w; x += 6) c.lineTo(x, y + Math.sin(x * (0.012 + L * 0.004) + ph) * (16 + L * 3));
        c.lineTo(w, h); c.closePath(); c.fill();
      }
      c.lineCap = "round";
      for (i = 0; i < 420; i++) { x = R() * w; y = h - R() * h * 0.34; k = 8 + R() * 22; c.strokeStyle = R() < 0.5 ? "rgba(21,128,61,.55)" : "rgba(134,239,172,.55)"; c.lineWidth = 1.2 + R(); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - 0.5) * 10, y - k * 0.6, x + (R() - 0.5) * 14, y - k); c.stroke(); }
      for (i = 0; i < 46; i++) { x = R() * w; y = h * (0.62 + R() * 0.36); bdDot(c, x, y, 3.2, ["#ffffff", "#fbcfe8", "#fde047"][i % 3]); bdDot(c, x, y, 1.2, "#f59e0b"); }
      for (i = 0; i < 16; i++) bdDot(c, R() * w, R() * h * 0.7, 8 + R() * 26, "rgba(255,255,255,.11)");
      bdVignette(c, w, h, 0.14);
    },
    wood: function (c, b, w, h, R) {
      var pw = 76, x, i, j, y, px, n;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#8a5a30"], [1, "#4a2c14"]]); c.fillRect(0, 0, w, h);
      for (x = -10, n = 0; x < w; x += pw, n++) {
        c.fillStyle = (n % 2 ? "rgba(255,200,120,.07)" : "rgba(0,0,0,.09)"); c.fillRect(x, 0, pw, h);
        for (j = 0; j < 16; j++) {
          px = x + 4 + R() * (pw - 8); c.strokeStyle = R() < 0.6 ? "rgba(30,14,4,.16)" : "rgba(255,210,150,.08)"; c.lineWidth = 0.6 + R() * 1.4; c.beginPath();
          var ph = R() * 6, am = 1.5 + R() * 3.5; for (y = 0; y <= h; y += 16) { var xx = px + Math.sin(y * 0.014 + ph) * am; if (y === 0) c.moveTo(xx, y); else c.lineTo(xx, y); } c.stroke();
        }
        c.fillStyle = "rgba(0,0,0,.42)"; c.fillRect(x, 0, 2, h); c.fillStyle = "rgba(255,220,170,.14)"; c.fillRect(x + 2, 0, 1, h);
      }
      for (i = 0; i < 5; i++) { px = R() * w; y = R() * h; for (j = 4; j > 0; j--) { c.strokeStyle = "rgba(30,14,4," + (0.1 + j * 0.05) + ")"; c.lineWidth = 1.4; c.beginPath(); c.ellipse(px, y, 5 + j * 5, 9 + j * 8, 0, 0, 6.2832); c.stroke(); } }
      bdGlow(c, w * 0.5, h * 0.12, w * 1.0, "#ffd699", 0.38); bdVignette(c, w, h, 0.62);
    },
    felt: function (c, b, w, h, R) {
      var i, x, y;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#0b7a5a"], [1, "#033f2f"]]); c.fillRect(0, 0, w, h);
      bdGlow(c, w / 2, h * 0.3, w * 1.1, "#34d399", 0.4);
      for (i = 0; i < 9000; i++) { c.fillStyle = R() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.08)"; c.fillRect(R() * w, R() * h, 1.2, 1.2); }
      c.strokeStyle = "rgba(251,191,36,.07)"; c.lineWidth = 1; c.beginPath();
      for (i = -h; i < w; i += 46) { c.moveTo(i, 0); c.lineTo(i + h, h); c.moveTo(i + h, 0); c.lineTo(i, h); } c.stroke();
      c.strokeStyle = "rgba(251,191,36,.4)"; c.lineWidth = 2; c.strokeRect(14, 14, w - 28, h - 28);
      c.strokeStyle = "rgba(251,191,36,.18)"; c.lineWidth = 1; c.strokeRect(22, 22, w - 44, h - 44);
      for (i = 0; i < 4; i++) { x = i % 2 ? w - 14 : 14; y = i < 2 ? 14 : h - 14; bdStar4(c, x, y, 9, "rgba(251,191,36,.7)"); }
      bdVignette(c, w, h, 0.55);
    },
    cyber: function (c, b, w, h, R) {
      var i, k, hor = h * 0.58, cx = w / 2, sr = w * 0.36, bg;
      bg = bdLin(c, 0, 0, 0, hor, [[0, "#0b0220"], [0.7, "#1e1b4b"], [1, "#4c1d95"]]); c.fillStyle = bg; c.fillRect(0, 0, w, hor);
      for (i = 0; i < 110; i++) bdDot(c, R() * w, R() * hor * 0.9, R() * 1.1 + 0.3, "rgba(255,255,255," + (0.25 + R() * 0.6) + ")");
      c.save(); c.beginPath(); c.arc(cx, hor - sr * 0.6, sr, 0, 6.2832); c.clip();
      c.fillStyle = bdLin(c, 0, hor - sr * 1.6, 0, hor, [[0, "#f0abfc"], [0.55, "#f472b6"], [1, "#22d3ee"]]); c.fillRect(cx - sr, hor - sr * 1.6, sr * 2, sr * 2);
      c.fillStyle = bg; for (k = 0; k < 7; k++) c.fillRect(cx - sr, hor - sr * 0.9 + k * sr * 0.16 + k * 1.6, sr * 2, 3 + k * 1.7);
      c.restore();
      bdGlow(c, cx, hor, w * 0.9, "#a78bfa", 0.35);
      c.fillStyle = bdLin(c, 0, hor, 0, h, [[0, "#1a0b3d"], [1, "#07021a"]]); c.fillRect(0, hor, w, h - hor);
      c.save(); c.shadowColor = "#a78bfa"; c.shadowBlur = 7; c.strokeStyle = "rgba(167,139,250,.65)"; c.lineWidth = 1.2; c.beginPath();
      for (i = -16; i <= 16; i++) { c.moveTo(cx, hor); c.lineTo(cx + i * w * 0.26, h); }
      for (k = 1; k <= 15; k++) { var yy = hor + (h - hor) * Math.pow(k / 15, 2.3); c.moveTo(0, yy); c.lineTo(w, yy); }
      c.stroke(); c.restore();
      c.fillStyle = "rgba(34,211,238,.9)"; c.fillRect(0, hor - 1, w, 2);
      bdVignette(c, w, h, 0.4);
    },
    ocean: function (c, b, w, h, R) {
      var i, k, x, y, ph;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#0e6ba8"], [0.5, "#0c3d66"], [1, "#041a30"]]); c.fillRect(0, 0, w, h);
      for (i = 0; i < 8; i++) { x = R() * w * 1.1 - w * 0.05; k = 20 + R() * 40; c.fillStyle = bdLin(c, x, 0, x, h * 0.85, [[0, "rgba(186,230,253,.16)"], [1, "rgba(186,230,253,0)"]]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + k, 0); c.lineTo(x + k * 3 + 50, h * 0.85); c.lineTo(x - k, h * 0.85); c.closePath(); c.fill(); }
      for (i = 0; i < 9; i++) {
        y = h * (0.12 + i * 0.1); ph = R() * 6; c.beginPath(); c.moveTo(0, h);
        for (x = 0; x <= w; x += 5) c.lineTo(x, y + Math.sin(x * 0.02 + ph + i) * (9 + i * 1.2) + Math.sin(x * 0.047 + ph) * 3);
        c.lineTo(w, h); c.closePath(); c.fillStyle = "rgba(14,116,184," + (0.05 + i * 0.012) + ")"; c.fill();
        c.strokeStyle = "rgba(186,230,253," + (0.14 + i * 0.03) + ")"; c.lineWidth = 1.3; c.stroke();
      }
      for (i = 0; i < 46; i++) { x = R() * w; y = R() * h; k = 2 + R() * 9; c.strokeStyle = "rgba(224,242,254,.42)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, k, 0, 6.2832); c.stroke(); bdDot(c, x - k * 0.35, y - k * 0.35, k * 0.22, "rgba(255,255,255,.7)"); }
      bdGlow(c, w * 0.5, 0, w * 0.9, "#7dd3fc", 0.3); bdVignette(c, w, h, 0.5);
    },
    gold: function (c, b, w, h, R) {
      var i, k, cx = w / 2, cy = h * 0.42, r, n;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#3b1457"], [0.5, "#2b123f"], [1, "#16051f"]]); c.fillRect(0, 0, w, h);
      bdGlow(c, cx, cy, w * 1.1, "#f59e0b", 0.3);
      c.save(); c.translate(cx, cy); c.strokeStyle = "rgba(251,191,36,.2)"; c.lineWidth = 1.2;
      for (r = 36; r < w * 1.05; r += 34) { c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.stroke(); n = Math.round(r / 7); for (k = 0; k < n; k++) { var a = k / n * 6.2832; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, 9, a + 1.57, a + 4.71); c.stroke(); } }
      c.strokeStyle = "rgba(251,191,36,.12)"; for (k = 0; k < 48; k++) { c.rotate(6.2832 / 48); c.beginPath(); c.moveTo(20, 0); c.lineTo(w * 1.1, 0); c.stroke(); }
      c.restore();
      for (i = 0; i < 70; i++) bdStar4(c, R() * w, R() * h, 2 + R() * 4, "rgba(253,230,138," + (0.35 + R() * 0.5) + ")");
      c.strokeStyle = "rgba(251,191,36,.45)"; c.lineWidth = 1.4;
      for (i = 0; i < 2; i++) for (k = 0; k * 22 < w + 22; k++) { c.beginPath(); c.arc(k * 22, i ? h : 0, 11, i ? Math.PI : 0, i ? 6.2832 : Math.PI); c.stroke(); }
      bdVignette(c, w, h, 0.5);
    },
    sakura: function (c, b, w, h, R) {
      var i, x, y, k;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#fff1f6"], [0.5, "#fbcfe8"], [1, "#f9a8d4"]]); c.fillRect(0, 0, w, h);
      bdGlow(c, w * 0.15, 0, w * 1.2, "#ffffff", 0.85);
      for (i = 0; i < 14; i++) bdDot(c, R() * w, R() * h, 10 + R() * 34, "rgba(255,255,255,.2)");
      c.strokeStyle = "rgba(131,24,67,.5)"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(-10, h * 0.1); c.bezierCurveTo(w * 0.3, h * 0.04, w * 0.55, h * 0.16, w * 1.05, h * 0.08); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.3, h * 0.05); c.quadraticCurveTo(w * 0.34, h * 0.11, w * 0.28, h * 0.17); c.moveTo(w * 0.6, h * 0.13); c.quadraticCurveTo(w * 0.7, h * 0.2, w * 0.78, h * 0.19); c.stroke();
      for (i = 0; i < 22; i++) {
        x = i < 11 ? R() * w : R() * w * 0.9; y = i < 11 ? h * (0.03 + R() * 0.17) : R() * h; k = 9 + R() * 9;
        for (var p = 0; p < 5; p++) bdPetal(c, x, y, k, p * 1.2566 + R() * 0.2, "rgba(251,113,160," + (0.6 + R() * 0.3) + ")");
        bdDot(c, x, y, k * 0.2, "#fbbf24");
      }
      for (i = 0; i < 80; i++) { c.save(); c.shadowColor = "rgba(244,114,182,.6)"; c.shadowBlur = R() < 0.3 ? 10 : 0; bdPetal(c, R() * w, R() * h, 5 + R() * 11, R() * 6.28, "rgba(255," + (205 + (R() * 40 | 0)) + ",225," + (0.5 + R() * 0.45) + ")"); c.restore(); }
      c.fillStyle = bdLin(c, 0, h * 0.7, 0, h, [[0, "rgba(255,255,255,0)"], [1, "rgba(255,241,246,.7)"]]); c.fillRect(0, h * 0.7, w, h * 0.3);
      bdVignette(c, w, h, 0.1);
    },
    lava: function (c, b, w, h, R) {
      var i, k, x, y, n;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#070202"], [0.55, "#2a0b0a"], [1, "#7c2d12"]]); c.fillRect(0, 0, w, h);
      bdGlow(c, w / 2, h, w * 1.1, "#f97316", 0.6); bdGlow(c, w * 0.2, h * 0.9, w * 0.7, "#ef4444", 0.35);
      for (i = 0; i < 6; i++) bdDot(c, R() * w, R() * h * 0.4, 40 + R() * 80, "rgba(0,0,0,.22)");
      c.lineCap = "round"; c.lineJoin = "round";
      for (i = 0; i < 9; i++) {
        x = R() * w; y = h; n = 6 + (R() * 6 | 0); c.beginPath(); c.moveTo(x, y);
        for (k = 0; k < n; k++) { x += (R() - 0.5) * 70; y -= 24 + R() * 60; c.lineTo(x, y); }
        c.save(); c.shadowColor = "#f97316"; c.shadowBlur = 16; c.strokeStyle = "rgba(251,146,60,.8)"; c.lineWidth = 3.2; c.stroke(); c.restore();
        c.strokeStyle = "rgba(254,240,138,.9)"; c.lineWidth = 1; c.stroke();
      }
      for (i = 0; i < 100; i++) { c.save(); c.shadowColor = "#fb923c"; c.shadowBlur = 8; bdDot(c, R() * w, h - Math.pow(R(), 1.6) * h, 0.8 + R() * 2.2, "rgba(253,186,116,.95)"); c.restore(); }
      bdVignette(c, w, h, 0.55);
    },
    aurora: function (c, b, w, h, R) {
      var i, k, x, y0, len, col = [b.accent, "#a855f7", "#38bdf8"], pts;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#020617"], [0.5, "#051923"], [1, "#161a42"]]); c.fillRect(0, 0, w, h);
      for (i = 0; i < 180; i++) bdDot(c, R() * w, R() * h * 0.8, R() * 1.2 + 0.25, "rgba(255,255,255," + (0.2 + R() * 0.7) + ")");
      for (k = 0; k < 3; k++) {
        var p1 = R() * 6, p2 = R() * 6, p3 = R() * 6;
        for (x = 0; x < w; x += 3) {
          y0 = h * (0.2 + k * 0.1) + Math.sin(x * 0.012 + p1) * h * 0.05 + Math.sin(x * 0.031 + p2) * h * 0.015; len = h * (0.2 + 0.1 * Math.sin(x * 0.02 + p3));
          c.fillStyle = bdLin(c, 0, y0, 0, y0 + len, [[0, bdA(col[k], 0)], [0.12, bdA(col[k], 0.5)], [1, bdA(col[k], 0)]]); c.fillRect(x, y0, 3.4, len);
        }
      }
      c.fillStyle = "#020617"; c.beginPath(); c.moveTo(0, h); pts = 0;
      for (x = 0; x <= w + 30; x += 30) { c.lineTo(x, h * 0.9 - (R() * 0.07 + (Math.sin(x * 0.012) + 1) * 0.04) * h); } c.lineTo(w, h); c.closePath(); c.fill();
      bdVignette(c, w, h, 0.4);
    },
    retro: function (c, b, w, h, R) {
      var i, x, y, bm = ["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"], ps = 5, ox, oy;
      c.fillStyle = bdLin(c, 0, 0, 0, h, [[0, "#05080f"], [1, "#0f1d2b"]]); c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(34,197,94,.08)"; c.lineWidth = 1; c.beginPath(); for (x = 0; x < w; x += 18) { c.moveTo(x, 0); c.lineTo(x, h); } for (y = 0; y < h; y += 18) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke();
      for (i = 0; i < 70; i++) { c.fillStyle = ["#4ade80", "#fde047", "#f472b6", "#22d3ee", "#ffffff"][i % 5]; c.globalAlpha = 0.3 + R() * 0.6; c.fillRect((R() * w / 3 | 0) * 3, (R() * h / 3 | 0) * 3, 3, 3); } c.globalAlpha = 1;
      for (i = 0; i < 3; i++) { ox = w * (0.12 + i * 0.3); oy = h * (0.05 + (i % 2) * 0.05); c.fillStyle = "rgba(74,222,128,.2)"; for (y = 0; y < 8; y++) for (x = 0; x < 11; x++) if (bm[y][x] === "1") c.fillRect(ox + x * ps, oy + y * ps, ps, ps); }
      bdGlow(c, w / 2, h, w, "#22c55e", 0.3); c.fillStyle = "rgba(74,222,128,.8)"; c.fillRect(0, h - 4, w, 4);
      c.fillStyle = "rgba(0,0,0,.2)"; for (y = 0; y < h; y += 4) c.fillRect(0, y, w, 1.5);
      bdVignette(c, w, h, 0.5);
    }
  };
  var bdKey = "", bdResizeT = 0, bdDrawT = 0;
  function drawBackdropScene(el, b) {
    var W = Math.max(window.innerWidth || 360, 200), H = Math.max(window.innerHeight || 640, document.documentElement.clientHeight || 0, 300),
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5), bid = String(b.id || "").split("_")[0] + (b.dark ? "d" : "l"), key = [bid, W, H, dpr].join("|"), cv = el.querySelector("canvas");
    if (key === bdKey && cv) return;
    if (!cv) { cv = document.createElement("canvas"); el.appendChild(cv); }
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    var id = String(b.id || "").split("_")[0], fn = BD_SCENES[id] || BD_SCENES.mesh, seed = 0, i; for (i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) | 0;
    fn(c, b, W, H, bdRng(seed + 1234567)); bdKey = key;
  }

  /* ---------- Themed full-screen backdrop while playing (follows the selected board theme) ---------- */
  function paintBackdrop() {
    try {
      var el = document.getElementById("ag-backdrop");
      if (!el) {
        if (!document.body) return;
        el = document.createElement("div"); el.id = "ag-backdrop"; el.setAttribute("aria-hidden", "true");
        document.body.appendChild(el);
        if (!document.getElementById("ag-backdrop-css")) {
          var st = document.createElement("style"); st.id = "ag-backdrop-css";
          st.textContent = "#ag-backdrop{position:fixed;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;display:none}" +
            "html.ag-game-on #ag-backdrop{display:block;animation:agBdIn .45s ease-out}" +
            "html.ag-game-on body{background:transparent!important}" +
            "html.ag-game-on body::before,html.ag-game-on body::after,html.ag-game-on[data-lkbg]:not(#lk0)::before{display:none!important}" +
            "#ag-backdrop canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}" +
            "@keyframes agBdIn{from{opacity:0}to{opacity:1}}";
          document.head.appendChild(st);
        }
      }
      var b = getBoard(), a = api.alpha;
      el.style.background = [
        "radial-gradient(90% 50% at 50% 0%," + a(b.glow, 0.42) + "," + a(b.glow, 0) + " 72%)",
        "radial-gradient(90% 50% at 50% 100%," + a(b.accent, 0.38) + "," + a(b.accent, 0) + " 72%)",
        "radial-gradient(circle at 2px 2px," + a(b.glow, 0.26) + " 1.6px," + a(b.glow, 0) + " 2.4px) 0 0/24px 24px",
        "linear-gradient(180deg," + b.base2 + "," + b.base + ")"
      ].join(",");
      clearTimeout(bdDrawT); bdDrawT = setTimeout(function () { try { drawBackdropScene(el, b); } catch (e2) { } }, 90); /* after the game appears, so Start never waits on it */
      if (!window.__agBdResize) { window.__agBdResize = 1; window.addEventListener("resize", function () { clearTimeout(bdResizeT); bdResizeT = setTimeout(function () { if (document.documentElement.classList.contains("ag-game-on")) paintBackdrop(); }, 200); }); }
    } catch (e) { }
  }

  function applyRootAttrs() {
    paintBackdrop();
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
    if (lookCb && !savedLook && key !== "open" && key !== "mute") { try { lookCb(api.getLook()); } catch (e) { } }
  }

  /* ---------- Shared look for online rooms: host's theme is shown on every phone ---------- */
  api.getLook = function () { var o = {}; LOOK_KEYS.forEach(function (k) { o[k] = S[k]; }); return o; };
  api.applyLook = function (l) {
    if (!l || typeof l !== "object") return;
    var ok = (has(STYLES, l.style) && BOARD_IDS.indexOf(l.board) >= 0 && has(PIECES, l.piece) && PALETTE_IDS.indexOf(l.palette) >= 0 &&
      has(DICE_SKINS, l.dice) && has(TRAILS, l.trail) && has(CENTERS, l.center));
    if (!ok) return;
    if (!savedLook) savedLook = api.getLook();
    LOOK_KEYS.forEach(function (k) { S[k] = l[k]; });
    commit("all");
  };
  api.restoreLook = function () {
    if (!savedLook) return;
    var l = savedLook; savedLook = null;
    LOOK_KEYS.forEach(function (k) { S[k] = l[k]; });
    commit("all");
  };
  api.watchLook = function (fn) { lookCb = typeof fn === "function" ? fn : null; };

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
      R + ".ag-wrap .as-tabs{grid-template-columns:repeat(5,minmax(0,1fr))}",
      R + ".ag-wrap .as-tabs .as-tb{font-size:10px;line-height:1.15;font-weight:800;min-width:0;padding:6px 1px;white-space:nowrap;letter-spacing:-.01em}",
      R + ".ag-wrap .as-tabs .as-tb span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".ag-wrap .as-tabs .as-tb .ag-i{width:14px;height:14px}",
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
      "#quiz-arena-root.as-fs{position:fixed;top:0;left:0;right:0;bottom:0;width:auto;max-width:none;z-index:2147483000;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:calc(env(safe-area-inset-top,0px) + 6px) 10px calc(env(safe-area-inset-bottom,0px) + 8px);background:var(--as-fsbg,#0b1220);-webkit-overflow-scrolling:touch;overscroll-behavior:contain}",
      "#quiz-arena-root.as-fs .ag-playing #ag-pane-snakes .bg-cv-wrap{width:min(100%,calc(100vh - 250px));width:min(100%,calc(100dvh - 250px));min-width:240px}",
      "#quiz-arena-root.as-fs .ag-playing .lx-bw{width:min(100%,calc(100vh - 290px));width:min(100%,calc(100dvh - 290px));min-width:240px}",
      "html.as-fs-lock,html.as-fs-lock body{overflow:hidden!important}",
      R + ".as-wrap{flex-wrap:wrap}",
      R + ".as-wrap button{flex:1 1 30%}",
      "#quiz-arena-root[data-as-dice='jade'] .lx-f{background:linear-gradient(145deg,#d1fae5,#34d399 55%,#047857);border-color:#a7f3d0;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.55),inset 0 0 0 calc(var(--s)*.035) #065f46}",
      "#quiz-arena-root[data-as-dice='jade'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#065f46,#022c22 75%);box-shadow:0 1px 1px rgba(255,255,255,.5)}",
      "#quiz-arena-root[data-as-dice='ruby'] .lx-f{background:linear-gradient(145deg,#fecdd3,#fb7185 38%,#9f1239);border-color:#fda4af;box-shadow:inset 0 0 calc(var(--s)*.25) rgba(255,255,255,.6),inset 0 0 0 calc(var(--s)*.035) #881337}",
      "#quiz-arena-root[data-as-dice='ruby'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#ffe4e6 70%,#fda4af);box-shadow:0 0 5px rgba(255,255,255,.7)}",
      "#quiz-arena-root[data-as-dice='candy'] .lx-f{background:linear-gradient(145deg,#fdf2f8,#f9a8d4 48%,#c084fc);border-color:#fbcfe8;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.7),inset 0 0 0 calc(var(--s)*.035) #a855f7}",
      "#quiz-arena-root[data-as-dice='candy'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#e9d5ff,#7e22ce 70%,#4c1d95);box-shadow:0 1px 1px rgba(255,255,255,.6)}",
      "#quiz-arena-root[data-as-dice='galaxy'] .lx-f{background:radial-gradient(circle at 20% 25%,rgba(255,255,255,.95) 0 1px,transparent 2px),radial-gradient(circle at 78% 68%,rgba(255,255,255,.85) 0 1px,transparent 2px),radial-gradient(circle at 60% 18%,rgba(196,181,253,.9) 0 1px,transparent 2px),linear-gradient(145deg,#4338ca,#1e1b4b 52%,#020617);border-color:#818cf8;box-shadow:inset 0 0 calc(var(--s)*.24) rgba(129,140,248,.6),inset 0 0 0 calc(var(--s)*.035) #6366f1}",
      "#quiz-arena-root[data-as-dice='galaxy'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#c4b5fd 62%,#7c3aed);box-shadow:0 0 8px #a78bfa}",
      "#quiz-arena-root[data-as-dice='magma'] .lx-f{background:linear-gradient(145deg,#44403c,#1c1917 55%,#0c0a09);border-color:#f97316;box-shadow:inset 0 0 calc(var(--s)*.26) rgba(249,115,22,.55),inset 0 0 0 calc(var(--s)*.035) #ea580c}",
      "#quiz-arena-root[data-as-dice='magma'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#fef08a,#f97316 62%,#b91c1c);box-shadow:0 0 8px rgba(249,115,22,.85)}",
      "#quiz-arena-root[data-as-dice='meadow'] .lx-f{background:linear-gradient(145deg,#ecfccb,#86efac 40%,#15803d);border-color:#d9f99d;box-shadow:inset 0 0 calc(var(--s)*.2) rgba(255,255,255,.5),inset 0 0 0 calc(var(--s)*.035) #166534}",
      "#quiz-arena-root[data-as-dice='meadow'] .lx-f i.o{background:radial-gradient(circle at 35% 30%,#ffffff,#fffbeb 60%,#fde68a);box-shadow:0 1px 1px rgba(0,0,0,.3)}",
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
      '<div class="ag-lbl">' + (BOARD_IDS.length - 1) + ' textured boards</div><div class="as-boards">' + BOARD_IDS.map(function (id) {
        var nm = id === "auto" ? "Auto" : BOARDS[id].name;
        return '<button type="button" data-as="set" data-p="board" data-k="' + id + '"><span class="ag-sw as-sw" data-k="' + id + '"></span><span class="ag-bn">' + nm + '</span></button>';
      }).join("") + '</div></div>';

    h += '<div class="as-pane ag-off" data-asp="pieces"><div class="ag-lbl" style="margin-top:.1rem">' + PIECES.length + ' bespoke 3D pieces</div><div class="as-pieces">' +
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
      }).join("") + '</div><div class="ag-lbl">Hop trail FX</div><div class="ag-seg as-wrap">' +
      TRAILS.map(function (t) { return seg("trail", t[0], t[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">Ludo center emblem</div><div class="ag-seg as-wrap">' +
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
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3), pal = getPalette();
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
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
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
        var sc = PV_TC[S.trail] ? PV_TC[S.trail][i % PV_TC[S.trail].length] : S.trail === "fire" ? (i % 2 ? "#f97316" : "#fde047") : S.trail === "rainbow" ? pal[i % 4] : S.trail === "star" ? "#fde047" : pal[0];
        pvSparks.push({ x: ox + (0.5 + segI) * cw, y: hopY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col: sc });
      }
    }
    if (S.trail !== "none" && Math.random() < 0.55) {
      var tc = PV_TC[S.trail] ? PV_TC[S.trail][Math.floor(Math.random() * PV_TC[S.trail].length)] : S.trail === "fire" ? "#fb923c" : S.trail === "rainbow" ? "hsl(" + Math.round((t * 220) % 360) + ",95%,62%)" : S.trail === "star" ? "#fde047" : pal[0];
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
  var midBusy = false;
  function injectMidGameBtn() {
    if (!root || midBusy) return;
    midBusy = true;
    try { injectMidGameBtnInner(); } finally { setTimeout(function () { midBusy = false; }, 0); }
  }
  function injectMidGameBtnInner() {
    if (!root) return;
    /* Ludo & Snakes already render their own Studio (sparkles) button, so only add the full-screen button
       (and fall back to a Studio button only if the game has none) -> no duplicate sparkles icons. */
    var ldTop = root.querySelector("#ag-pane-ludo .lx-top");
    if (ldTop && !ldTop.querySelector("[data-as]")) {
      var ldNative = ldTop.querySelector("[data-ld='studio']");
      if (ldNative) { }
      else {
        var b1 = document.createElement("button");
        b1.type = "button"; b1.className = "as-midbtn"; b1.setAttribute("data-as", "mid"); b1.title = "Arena Studio";
        b1.innerHTML = ico("sparkles");
        ldTop.insertBefore(b1, ldTop.lastElementChild);
        icons();
      }
    }
    var slTop = root.querySelector("#ag-pane-snakes .bg-box > .ag-glass");
    if (slTop && slTop.querySelector("#sl-msg") && !slTop.querySelector("[data-as]")) {
      var slNative = slTop.querySelector("[data-sl='studio']");
      if (slNative) { }
      else {
        var b2 = document.createElement("button");
        b2.type = "button"; b2.className = "as-midbtn"; b2.setAttribute("data-as", "mid"); b2.title = "Arena Studio";
        b2.innerHTML = ico("sparkles");
        slTop.appendChild(b2);
        icons();
      }
    }
  }

  /* ---------- Full screen while playing ---------- */
  function fsApiEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsOn() { return !!(root && root.classList.contains("as-fs")); }
  function fsBg() {
    var els = [document.body, document.documentElement], i, c;
    for (i = 0; i < els.length; i++) {
      c = window.getComputedStyle(els[i]).backgroundColor;
      if (c && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c)) return c;
    }
    return bright() ? "#f8fafc" : "#0b1220";
  }
  function fsPoke() { setTimeout(function () { try { window.dispatchEvent(new Event("resize")); } catch (e) { } }, 120); setTimeout(function () { try { window.dispatchEvent(new Event("resize")); } catch (e) { } }, 450); }
  function fsSyncBtns() {
    if (!root) return;
    var on = fsOn();
    Array.prototype.forEach.call(root.querySelectorAll("[data-as='fs']"), function (b) {
      b.innerHTML = ico(on ? "minimize" : "maximize");
      b.title = on ? "Exit full screen" : "Full screen";
      b.setAttribute("aria-label", b.title);
    });
    icons();
  }
  function enterFs() {
    if (!root || fsOn()) return;
    root.style.setProperty("--as-fsbg", fsBg());
    root.classList.add("as-fs");
    document.documentElement.classList.add("as-fs-lock");
    var f = root.requestFullscreen || root.webkitRequestFullscreen;
    if (f) { try { var pr = f.call(root); if (pr && pr.catch) pr.catch(function () { }); } catch (e) { } }
    try { window.scrollTo(0, 0); root.scrollTop = 0; } catch (e) { }
    fsSyncBtns(); fsPoke();
  }
  function exitFs() {
    if (!root || !fsOn()) return;
    root.classList.remove("as-fs");
    document.documentElement.classList.remove("as-fs-lock");
    if (fsApiEl()) { try { var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { var pr = ex.call(document); if (pr && pr.catch) pr.catch(function () { }); } } catch (e) { } }
    fsSyncBtns(); fsPoke();
    try { root.scrollIntoView({ block: "start" }); } catch (e) { }
  }
  function toggleFs() { if (fsOn()) exitFs(); else enterFs(); }
  function onFsChange() { if (fsOn() && !fsApiEl() && fsUsedApi) exitFs(); }
  var fsUsedApi = false;
  ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
    document.addEventListener(ev, function () { if (fsApiEl()) fsUsedApi = true; onFsChange(); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && fsOn() && !fsApiEl()) exitFs(); });
  function fsWatchPlaying() {
    var w = root && root.querySelector(".ag-wrap");
    if (!w || w._asFs) return;
    w._asFs = true;
    try {
      new MutationObserver(function () { if (fsOn() && !w.classList.contains("ag-playing")) exitFs(); })
        .observe(w, { attributes: true, attributeFilter: ["class"] });
    } catch (e) { }
  }
  function mkFsBtn() {
    var b = document.createElement("button");
    b.type = "button"; b.className = "as-midbtn as-fsbtn"; b.setAttribute("data-as", "fs");
    b.innerHTML = ico(fsOn() ? "minimize" : "maximize");
    b.title = fsOn() ? "Exit full screen" : "Full screen"; b.setAttribute("aria-label", b.title);
    return b;
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
      } else if (a === "fs") {
        toggleFs();
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
        S.palette = pick(PALETTE_IDS); S.dice = pick(DICE_SKINS)[0]; S.trail = pick(TRAILS.slice(0, TRAILS.length - 1))[0]; S.center = pick(CENTERS)[0];
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

    applyRootAttrs(); syncStudio(); drawThumbs(); injectMidGameBtn(); fsWatchPlaying();
  }

  window.ArenaStudio = { version: "3.2.0", fullscreen: toggleFs, toggle: toggleInGameStudio, getBoard: getBoard, getPalette: getPalette };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountStudio); else mountStudio();
})();

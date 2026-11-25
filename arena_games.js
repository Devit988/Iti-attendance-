/*! ITI CONNECT — Arena Games (Complete: Foundation + Snakes & Ladders + Ludo + Online Rooms)
 *  Load AFTER ./quiz_arena.js. Wraps #quiz-arena-root with a top switcher:
 *    Quiz & Clash (quiz_arena.js, untouched) | Ludo | Snakes & Ladders
 */
(function () {
  "use strict";

  var LS_KEY = "iti_ag_prefs_v1";
  var NAME_KEY = "iti_qa_name_v1";
  var TAU = Math.PI * 2;
  var FB_V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXPIRE_MS = 24 * 3600 * 1000;
  var INVITE_BASE = "https://devit988.github.io/Iti-attendance-/?battle=";

  var TABS = [["quiz", "Quiz & Clash", "swords"], ["ludo", "Ludo", "dices"], ["snakes", "Snakes & Ladders", "route"]];
  var STYLES = [["classic", "Classic (Old)"], ["modern", "Modern Cyber (New)"]];
  var PIECES = [["pawn", "Classic Pawn"], ["orb", "Neon Orb / Gem"], ["crown", "Shield / Crown"], ["bolt", "Bolt / Star"]];
  var BOARD_IDS = ["auto", "wood", "felt", "cyber", "ocean"];
  var BOARDS = {
    auto_dark: { name: "Auto", base: "#0f172a", base2: "#1e293b", cellA: "#1e293b", cellB: "#172033", track: "#334155", line: "#475569", frame: "#0b1220", text: "#e2e8f0", accent: "#fbbf24", glow: "#fbbf24", dark: true },
    auto_light: { name: "Auto", base: "#f1f5f9", base2: "#e2e8f0", cellA: "#ffffff", cellB: "#e2e8f0", track: "#ffffff", line: "#94a3b8", frame: "#cbd5e1", text: "#1e293b", accent: "#d97706", glow: "#f59e0b", dark: false },
    wood: { name: "Royal Wood", base: "#6b4423", base2: "#8a5a30", cellA: "#e8c99b", cellB: "#c49a6c", track: "#f3dfb8", line: "#4a2c14", frame: "#3b2210", text: "#3b2210", accent: "#f59e0b", glow: "#fbbf24", dark: false },
    felt: { name: "Emerald Felt", base: "#065f46", base2: "#047857", cellA: "#10795a", cellB: "#0b5d45", track: "#d1fae5", line: "#022c22", frame: "#064e3b", text: "#ecfdf5", accent: "#fbbf24", glow: "#34d399", dark: true },
    cyber: { name: "Midnight Cyber", base: "#0b0220", base2: "#1e1b4b", cellA: "#1e1b4b", cellB: "#151236", track: "#241b4d", line: "#7c3aed", frame: "#312e81", text: "#e0e7ff", accent: "#22d3ee", glow: "#a78bfa", dark: true },
    ocean: { name: "Oceanic Navy", base: "#0c2a4d", base2: "#0e4a7a", cellA: "#14507d", cellB: "#0f3d63", track: "#e0f2fe", line: "#38bdf8", frame: "#082f49", text: "#e0f2fe", accent: "#38bdf8", glow: "#38bdf8", dark: true }
  };
  var DEFAULTS = { tab: "quiz", open: false, style: "modern", board: "auto", piece: "pawn", speed: 1, mute: false, autoMove: true };

  var P = loadPrefs();
  var root = null, subs = [], GAMES = {}, mounted = {}, lastBright = null, resizeT = 0;
  var FBP = null, pendingInvite = null;

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

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      try {
        var a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select();
        var r = document.execCommand("copy"); a.remove(); r ? ok() : no();
      } catch (e) { no(e); }
    });
  }

  function loadPrefs() {
    var p = {}, k, s = null;
    for (k in DEFAULTS) p[k] = DEFAULTS[k];
    try { s = JSON.parse(ls(LS_KEY) || "null"); } catch (e) { s = null; }
    if (s && typeof s === "object") {
      if (has(TABS, s.tab)) p.tab = s.tab;
      if (typeof s.open === "boolean") p.open = s.open;
      if (has(STYLES, s.style)) p.style = s.style;
      if (BOARD_IDS.indexOf(s.board) >= 0) p.board = s.board;
      if (has(PIECES, s.piece)) p.piece = s.piece;
      if (s.speed === 1 || s.speed === 2) p.speed = s.speed;
      if (typeof s.mute === "boolean") p.mute = s.mute;
      if (typeof s.autoMove === "boolean") p.autoMove = s.autoMove;
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

  /* ---------- board themes ---------- */
  function getBoard(id) {
    id = id || P.board;
    var t = id === "auto" ? (bright() ? BOARDS.auto_light : BOARDS.auto_dark) : (BOARDS[id] || BOARDS.auto_dark), o = { id: id }, k;
    for (k in t) o[k] = t[k];
    if (id === "auto") o.name = "Auto";
    o.modern = P.style === "modern";
    return o;
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function paintBoardBg(ctx, x, y, w, h, radius) {
    if (!ctx) return;
    var b = getBoard(), r = radius == null ? Math.min(w, h) * 0.04 : radius, g, i, n, st;
    ctx.save();
    rr(ctx, x, y, w, h, r);
    g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, b.base); g.addColorStop(1, b.base2);
    ctx.fillStyle = g; ctx.fill(); ctx.clip();
    if (b.modern) {
      n = 12; st = w / n; ctx.strokeStyle = alpha(b.glow, b.dark ? 0.10 : 0.12); ctx.lineWidth = 1; ctx.beginPath();
      for (i = 1; i < n; i++) { ctx.moveTo(x + i * st, y); ctx.lineTo(x + i * st, y + h); }
      for (i = 1; i * st < h; i++) { ctx.moveTo(x, y + i * st); ctx.lineTo(x + w, y + i * st); }
      ctx.stroke();
      g = ctx.createRadialGradient(x + w * 0.85, y + h * 0.1, 0, x + w * 0.85, y + h * 0.1, Math.max(w, h) * 0.7);
      g.addColorStop(0, alpha(b.glow, 0.22)); g.addColorStop(1, alpha(b.glow, 0));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else {
      g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, r);
    if (b.modern) { ctx.strokeStyle = alpha(b.accent, 0.8); ctx.lineWidth = Math.max(1.5, w * 0.006); ctx.shadowColor = alpha(b.glow, 0.9); ctx.shadowBlur = Math.max(6, w * 0.02); }
    else { ctx.strokeStyle = b.frame; ctx.lineWidth = Math.max(3, w * 0.014); }
    ctx.stroke(); ctx.restore();
  }

  /* ---------- shared token painter ---------- */
  function tokenPath(ctx, shape) {
    var i, a, rad;
    ctx.beginPath();
    if (shape === "pawn") {
      ctx.moveTo(-0.17, -0.2);
      ctx.bezierCurveTo(-0.17, 0.15, -0.4, 0.3, -0.46, 0.6);
      ctx.quadraticCurveTo(-0.64, 0.64, -0.64, 0.8);
      ctx.quadraticCurveTo(0, 0.95, 0.64, 0.8);
      ctx.quadraticCurveTo(0.64, 0.64, 0.46, 0.6);
      ctx.bezierCurveTo(0.4, 0.3, 0.17, 0.15, 0.17, -0.2);
      ctx.closePath();
      ctx.moveTo(0.34, -0.52); ctx.arc(0, -0.52, 0.34, 0, TAU);
    } else if (shape === "orb") {
      ctx.arc(0, 0, 0.8, 0, TAU);
    } else if (shape === "crown") {
      ctx.moveTo(-0.7, -0.72); ctx.lineTo(0.7, -0.72); ctx.lineTo(0.7, 0.05);
      ctx.bezierCurveTo(0.7, 0.5, 0.3, 0.75, 0, 0.95);
      ctx.bezierCurveTo(-0.3, 0.75, -0.7, 0.5, -0.7, 0.05);
      ctx.closePath();
    } else {
      for (i = 0; i < 10; i++) {
        a = -Math.PI / 2 + i * Math.PI / 5; rad = i % 2 ? 0.44 : 0.98;
        if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad + 0.05); else ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad + 0.05);
      }
      ctx.closePath();
    }
  }
  function drawToken(ctx, x, y, r, color, shape, style) {
    if (!ctx) return;
    r = r > 0 ? r : 12; color = color || "#38bdf8";
    if (!has(PIECES, shape)) shape = P.piece;
    var modern = (style === "classic" || style === "modern" ? style : P.style) === "modern";
    var dark = shade(color, -0.5), g, i, a;
    ctx.save();
    ctx.translate(x, y);
    ctx.save(); ctx.translate(0, r * 0.82); ctx.scale(1, 0.28);
    ctx.fillStyle = "rgba(0,0,0," + (modern ? 0.3 : 0.4) + ")"; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.fill(); ctx.restore();
    ctx.scale(r, r);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (shape === "orb") {
      g = ctx.createRadialGradient(-0.28, -0.3, 0.05, 0, 0, 0.85);
      g.addColorStop(0, shade(color, modern ? 0.7 : 0.6)); g.addColorStop(0.45, color); g.addColorStop(1, shade(color, modern ? -0.55 : -0.4));
    } else if (modern) {
      g = ctx.createLinearGradient(-0.6, -0.9, 0.6, 0.9);
      g.addColorStop(0, shade(color, 0.5)); g.addColorStop(0.5, color); g.addColorStop(1, shade(color, -0.45));
    } else { g = color; }
    tokenPath(ctx, shape);
    ctx.fillStyle = g;
    if (modern) { ctx.shadowColor = alpha(color, 0.9); ctx.shadowBlur = r * 0.9; }
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
    ctx.lineWidth = modern ? 0.06 : 0.11;
    ctx.strokeStyle = modern ? "rgba(255,255,255,0.7)" : dark;
    ctx.stroke();
    if (shape === "pawn") {
      ctx.fillStyle = "rgba(255,255,255," + (modern ? 0.5 : 0.35) + ")";
      ctx.beginPath(); ctx.arc(-0.12, -0.62, 0.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = modern ? "rgba(255,255,255,0.35)" : alpha(dark, 0.6); ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.moveTo(-0.48, 0.58); ctx.lineTo(0.48, 0.58); ctx.stroke();
    } else if (shape === "orb") {
      if (modern) {
        ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = 0.045; ctx.beginPath();
        for (i = 0; i < 6; i++) { a = Math.PI / 6 + i * Math.PI / 3; if (i) ctx.lineTo(Math.cos(a) * 0.46, Math.sin(a) * 0.46); else ctx.moveTo(Math.cos(a) * 0.46, Math.sin(a) * 0.46); }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -0.46); ctx.lineTo(0, 0.46); ctx.moveTo(-0.4, -0.23); ctx.lineTo(0.4, 0.23); ctx.moveTo(-0.4, 0.23); ctx.lineTo(0.4, -0.23);
        ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.beginPath(); ctx.arc(-0.28, -0.3, 0.16, 0, TAU); ctx.fill();
      }
    } else if (shape === "crown") {
      ctx.fillStyle = modern ? "rgba(255,255,255,0.95)" : "#fff7d6";
      ctx.beginPath();
      ctx.moveTo(-0.38, 0.12); ctx.lineTo(-0.42, -0.4); ctx.lineTo(-0.2, -0.16); ctx.lineTo(0, -0.5);
      ctx.lineTo(0.2, -0.16); ctx.lineTo(0.42, -0.4); ctx.lineTo(0.38, 0.12); ctx.closePath(); ctx.fill();
      ctx.fillRect(-0.38, 0.2, 0.76, 0.12);
      if (!modern) { ctx.strokeStyle = alpha(dark, 0.7); ctx.lineWidth = 0.04; ctx.stroke(); }
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath();
      ctx.moveTo(0.1, -0.4); ctx.lineTo(-0.22, 0.08); ctx.lineTo(-0.02, 0.08); ctx.lineTo(-0.1, 0.46);
      ctx.lineTo(0.22, -0.04); ctx.lineTo(0.02, -0.04); ctx.closePath(); ctx.fill();
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

  /* ---------- sound (AudioContext synth, no files) ---------- */
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
    var k = P.speed === 2 ? 0.6 : 1, t = a.currentTime + ((delay || 0) * k) / 1000, d = (ms * k) / 1000;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
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

  /* ---------- state -> DOM sync ---------- */
  function applyVars() {
    if (!root) return;
    var b = getBoard(), s = root.style;
    s.setProperty("--agb-base", b.base); s.setProperty("--agb-base2", b.base2);
    s.setProperty("--agb-cell-a", b.cellA); s.setProperty("--agb-cell-b", b.cellB);
    s.setProperty("--agb-track", b.track); s.setProperty("--agb-line", b.line);
    s.setProperty("--agb-frame", b.frame); s.setProperty("--agb-text", b.text);
    s.setProperty("--agb-accent", b.accent); s.setProperty("--agb-glow", b.glow);
    s.setProperty("--ag-k", P.speed === 2 ? "0.5" : "1");
    root.setAttribute("data-ag-style", P.style); root.setAttribute("data-ag-board", P.board);
    root.setAttribute("data-ag-piece", P.piece);
  }
  function syncUI() {
    if (!root) return;
    var b = getBoard();
    qa("[data-ag='tab']").forEach(function (el) { var on = el.getAttribute("data-k") === P.tab; el.classList.toggle("on", on); el.setAttribute("aria-selected", on ? "true" : "false"); });
    qa(".ag-pane").forEach(function (el) { el.classList.toggle("ag-off", el.id !== "ag-pane-" + P.tab); });
    var cz = q("#ag-cz"); if (!cz) return;
    cz.classList.toggle("ag-off", P.tab === "quiz");
    cz.classList.toggle("open", !!P.open);
    q("#ag-cz-h").setAttribute("aria-expanded", P.open ? "true" : "false");
    q("#ag-cz-sum").textContent = nameOf(STYLES, P.style).replace(/ \(.*\)/, "") + " · " + (P.board === "auto" ? "Auto" : b.name) + " · " + nameOf(PIECES, P.piece);
    qa("[data-ag='set']").forEach(function (el) {
      var key = el.getAttribute("data-p"), on = String(P[key]) === el.getAttribute("data-k");
      el.classList.toggle("on", on); el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    qa(".ag-sw").forEach(function (el) {
      var t = getBoard(el.getAttribute("data-k"));
      el.style.background = "linear-gradient(135deg," + t.base + "," + t.base2 + ")";
      el.style.borderColor = t.accent;
    });
    qa(".ag-pc").forEach(function (el) { el.style.background = "linear-gradient(135deg," + b.base + "," + b.base2 + ")"; });
    q("#ag-snd").classList.toggle("ag-muted", !!P.mute);
  }
  function drawThumbs() {
    if (!root) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    qa(".ag-thumb").forEach(function (cv) {
      var s = 44, c = cv.getContext && cv.getContext("2d"); if (!c) return;
      if (cv.width !== s * dpr) { cv.width = s * dpr; cv.height = s * dpr; cv.style.width = s + "px"; cv.style.height = s + "px"; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, s, s);
      drawToken(c, s / 2, s / 2 - 1, 15, "#ef4444", cv.getAttribute("data-k"), P.style);
    });
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
    if (key === "board" && BOARD_IDS.indexOf(val) < 0) return false;
    if (key === "piece" && !has(PIECES, val)) return false;
    if (key === "speed") { val = +val; if (val !== 1 && val !== 2) return false; }
    if (key === "mute" || key === "open" || key === "autoMove") val = !!val;
    if (!(key in DEFAULTS) || key === "tab") return false;
    if (P[key] === val) return true;
    P[key] = val; commit(key); return true;
  }
  function resetPrefs() { var t = P.tab, o = P.open; P = loadDefaults(); P.tab = t; P.open = o; commit("all"); }
  function loadDefaults() { var p = {}, k; for (k in DEFAULTS) p[k] = DEFAULTS[k]; return p; }

  /* ---------- tabs & game panes ---------- */
  function mountGame(id) {
    var pane = q("#ag-pane-" + id); if (!pane || mounted[id]) return;
    if (GAMES[id] && typeof GAMES[id].mount === "function") {
      pane.innerHTML = ""; mounted[id] = "game";
      try { GAMES[id].mount(pane, api); } catch (e) { pane.innerHTML = '<div class="ag-card ag-glass ag-ph"><p class="ag-ph-d">This game failed to start. Please refresh the page.</p></div>'; }
    }
  }
  function setTab(id) {
    if (!has(TABS, id) || !root) return;
    var prev = P.tab;
    if (prev !== id && GAMES[prev] && GAMES[prev].onHide) { try { GAMES[prev].onHide(); } catch (e) { } }
    P.tab = id; savePrefs();
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

  /* ---------- UI build ---------- */
  function segBtn(p, k, label, extra) { return '<button type="button" data-ag="set" data-p="' + p + '" data-k="' + k + '" aria-pressed="false">' + (extra || "") + label + '</button>'; }
  function shellHTML() {
    var h = '<div class="ag-wrap">';
    h += '<nav class="ag-bar ag-glass" role="tablist" aria-label="Arena games">' + TABS.map(function (t) {
      return '<button type="button" role="tab" class="ag-tab" data-ag="tab" data-k="' + t[0] + '" aria-selected="false">' + ico(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join("") + '</nav>';
    h += '<section id="ag-cz" class="ag-cz ag-glass ag-off">' +
      '<button type="button" id="ag-cz-h" class="ag-cz-h" data-ag="open" aria-expanded="false" aria-controls="ag-cz-b">' +
      '<span class="ag-cz-ic">' + ico("palette") + '</span>' +
      '<span class="min-w-0 flex-1"><span class="ag-cz-t">Customize Board &amp; Pieces</span><span id="ag-cz-sum" class="ag-cz-s truncate"></span></span>' +
      ico("chevron-down", "ag-chev") + '</button>' +
      '<div class="ag-cz-b" id="ag-cz-b"><div class="ag-cz-in"><div class="ag-cz-pad">' +
      '<div class="ag-lbl">Style</div><div class="ag-seg">' + STYLES.map(function (s) { return segBtn("style", s[0], s[1]); }).join("") + '</div>' +
      '<div class="ag-lbl">Board background</div><div class="ag-boards">' + BOARD_IDS.map(function (id) {
        var nm = id === "auto" ? "Auto" : BOARDS[id].name;
        return '<button type="button" data-ag="set" data-p="board" data-k="' + id + '" aria-pressed="false"><span class="ag-sw" data-k="' + id + '"></span><span class="ag-bn">' + nm + '</span></button>';
      }).join("") + '</div>' +
      '<div class="ag-lbl">Playing pieces</div><div class="ag-pieces">' + PIECES.map(function (p) {
        return '<button type="button" data-ag="set" data-p="piece" data-k="' + p[0] + '" aria-pressed="false"><span class="ag-pc"><canvas class="ag-thumb" data-k="' + p[0] + '"></canvas></span><span class="ag-bn">' + p[1] + '</span></button>';
      }).join("") + '</div>' +
      '<div class="ag-two"><div><div class="ag-lbl">Animation speed</div><div class="ag-seg">' + segBtn("speed", "1", "1×") + segBtn("speed", "2", "2×") + '</div></div>' +
      '<div><div class="ag-lbl">Sound</div><div id="ag-snd" class="ag-seg">' +
      '<button type="button" data-ag="snd" data-m="0" class="ag-snd-on">' + ico("volume-2") + 'On</button>' +
      '<button type="button" data-ag="snd" data-m="1" class="ag-snd-off">' + ico("volume-x") + 'Mute</button></div></div></div>' +
      '<button type="button" class="ag-reset" data-ag="reset">' + ico("rotate-ccw") + 'Reset to defaults</button>' +
      '</div></div></div></section></div>';
    h += '<div id="ag-pane-quiz" class="ag-pane"></div><div id="ag-pane-ludo" class="ag-pane ag-off"></div><div id="ag-pane-snakes" class="ag-pane ag-off"></div>';
    return h;
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-ag]");
    if (!b || !root.contains(b)) return;
    var a = b.getAttribute("data-ag"), k = b.getAttribute("data-k");
    if (a === "tab") { setTab(k); playSfx("tab"); }
    else if (a === "open") setPref("open", !P.open);
    else if (a === "set") { var p = b.getAttribute("data-p"); if (setPref(p, k)) playSfx("click"); }
    else if (a === "snd") { setPref("mute", b.getAttribute("data-m") === "1"); playSfx("click"); }
    else if (a === "reset") { resetPrefs(); playSfx("click"); }
  }
  function keyGuard(e) {
    if (!root || P.tab === "quiz" || e.ctrlKey || e.metaKey || e.altKey || !/^[1-4a-dA-D]$/.test(e.key)) return;
    var t = e.target, tn = t && t.tagName;
    if (tn === "INPUT" || tn === "TEXTAREA" || tn === "SELECT" || (t && t.isContentEditable)) return;
    if (q("#ag-pane-quiz [data-a='opt']")) e.stopImmediatePropagation();
  }

  /* ---------- styles ---------- */
  function injectCss() {
    if (document.getElementById("ag-style")) return;
    var R = "#quiz-arena-root ", css = [
      R.trim() + "{--ag-tx:#e2e8f0;--ag-t2:#94a3b8;--ag-bg:rgba(15,23,42,.62);--ag-bg2:rgba(30,41,59,.55);--ag-bd:rgba(148,163,184,.22);--ag-ac:#fbbf24;--ag-actx:#fde68a;--ag-on:rgba(251,191,36,.16);--ag-onb:rgba(251,191,36,.6);--ag-sh:0 10px 28px -10px rgba(0,0,0,.5),0 1px 0 0 rgba(255,255,255,.06) inset;--ag-k:1}",
      "html.bright-mode " + R.trim() + "{--ag-tx:#1e293b;--ag-t2:#475569;--ag-bg:rgba(255,255,255,.62);--ag-bg2:rgba(255,255,255,.7);--ag-bd:rgba(148,163,184,.4);--ag-ac:#b45309;--ag-actx:#92400e;--ag-on:rgba(217,119,6,.14);--ag-onb:rgba(217,119,6,.55);--ag-sh:0 10px 28px -10px rgba(15,23,42,.18),0 1px 0 0 rgba(255,255,255,.75) inset}",
      R + ".ag-off{display:none!important}",
      R + ".ag-wrap{color:var(--ag-tx);margin-bottom:.75rem}",
      R + ".ag-wrap *{box-sizing:border-box}",
      R + ".ag-wrap button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      R + ".ag-i{width:16px;height:16px;flex:none}",
      R + ".ag-glass{background:var(--ag-bg);-webkit-backdrop-filter:blur(16px) saturate(140%);backdrop-filter:blur(16px) saturate(140%);border:1px solid var(--ag-bd);box-shadow:var(--ag-sh);border-radius:1rem}",
      "html.no-glass " + R + ".ag-glass{background:#0f172a;-webkit-backdrop-filter:none;backdrop-filter:none}",
      "html.no-glass.bright-mode " + R + ".ag-glass{background:#fff}",
      R + ".ag-bar{display:flex;gap:4px;padding:4px;margin-bottom:.6rem}",
      R + ".ag-tab{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;padding:.62rem .4rem;border-radius:.75rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-weight:700;font-size:12.5px;line-height:1.1;text-align:center;transition:background .2s,color .2s,border-color .2s,box-shadow .2s}",
      R + ".ag-tab:hover{color:var(--ag-tx)}",
      R + ".ag-tab.on{color:var(--ag-actx);background:linear-gradient(135deg,rgba(251,191,36,.22),rgba(245,158,11,.10));border-color:var(--ag-onb);box-shadow:0 4px 14px -6px rgba(245,158,11,.45)}",
      "html.bright-mode " + R + ".ag-tab.on{background:linear-gradient(135deg,rgba(251,191,36,.28),rgba(245,158,11,.12));box-shadow:0 4px 12px -6px rgba(217,119,6,.35)}",
      "@media(max-width:480px){" + R + ".ag-tab{flex-direction:column;gap:3px;font-size:11px;padding:.5rem .2rem}}",
      R + ".ag-cz{margin-bottom:.75rem;overflow:hidden}",
      R + ".ag-cz-h{width:100%;display:flex;align-items:center;gap:.65rem;padding:.7rem .85rem;background:transparent;border:0;text-align:left}",
      R + ".ag-cz-ic{display:grid;place-items:center;width:32px;height:32px;border-radius:.65rem;background:var(--ag-on);border:1px solid var(--ag-onb);color:var(--ag-ac);flex:none}",
      R + ".ag-cz-t{display:block;font-weight:800;font-size:13.5px}",
      R + ".ag-cz-s{display:block;font-size:11px;color:var(--ag-t2);margin-top:1px}",
      R + ".ag-chev{color:var(--ag-t2);transition:transform calc(.25s*var(--ag-k))}",
      R + ".ag-cz.open .ag-chev{transform:rotate(180deg)}",
      R + ".ag-cz-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows calc(.28s*var(--ag-k)) ease}",
      R + ".ag-cz.open .ag-cz-b{grid-template-rows:1fr}",
      R + ".ag-cz-in{min-height:0;overflow:hidden;visibility:hidden;transition:visibility 0s linear calc(.28s*var(--ag-k))}",
      R + ".ag-cz.open .ag-cz-in{visibility:visible;transition-delay:0s}",
      R + ".ag-cz-pad{padding:0 .85rem .85rem;border-top:1px solid var(--ag-bd)}",
      R + ".ag-lbl{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ag-t2);margin:.75rem 0 .4rem}",
      R + ".ag-seg{display:flex;gap:3px;padding:3px;border-radius:.8rem;background:var(--ag-bg2);border:1px solid var(--ag-bd)}",
      R + ".ag-seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:.5rem .4rem;border-radius:.6rem;border:1px solid transparent;background:transparent;color:var(--ag-t2);font-weight:700;font-size:12px;transition:.2s}",
      R + ".ag-seg button.on,#ag-snd:not(.ag-muted) .ag-snd-on,#ag-snd.ag-muted .ag-snd-off{color:var(--ag-actx);background:var(--ag-on);border-color:var(--ag-onb)}",
      R + ".ag-boards{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}",
      R + ".ag-pieces{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      R + ".ag-boards button,#quiz-arena-root .ag-pieces button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 2px 6px;border-radius:.8rem;border:1px solid var(--ag-bd);background:var(--ag-bg2);transition:.2s}",
      R + ".ag-boards button.on,#quiz-arena-root .ag-pieces button.on{border-color:var(--ag-onb);background:var(--ag-on);box-shadow:0 0 0 1px var(--ag-onb)}",
      R + ".ag-sw{display:block;width:34px;height:34px;border-radius:50%;border:2px solid transparent;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18),0 3px 8px -3px rgba(0,0,0,.5)}",
      R + ".ag-pc{display:grid;place-items:center;width:100%;max-width:58px;height:50px;border-radius:.65rem;border:1px solid var(--ag-bd)}",
      R + ".ag-bn{font-size:10px;line-height:1.15;font-weight:700;color:var(--ag-t2);text-align:center}",
      R + ".on>.ag-bn{color:var(--ag-actx)}",
      R + ".ag-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
      R + ".ag-snd-off .ag-i,#quiz-arena-root .ag-snd-on .ag-i{width:14px;height:14px}",
      R + ".ag-reset{display:flex;align-items:center;gap:6px;margin:.85rem auto 0;padding:.4rem .8rem;border-radius:999px;border:1px solid var(--ag-bd);background:transparent;color:var(--ag-t2);font-size:11.5px;font-weight:700}",
      R + ".ag-reset:hover{color:var(--ag-tx)}",
      R + ".ag-fail{padding:1rem;text-align:center;font-size:13px;color:var(--ag-t2)}",
      /* Shared Board Game UI (Snakes & Ladders + Ludo) */
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
      R + ".bg-cv{display:block;width:100%;height:100%;touch-action:manipulation}",
      R + ".bg-dice{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;border:2px solid var(--ag-onb);background:var(--ag-bg2);box-shadow:0 8px 20px -6px rgba(0,0,0,.45);transition:transform .15s,border-color .2s;flex:none}",
      R + ".bg-dice:active:not(:disabled){transform:scale(.93)}",
      R + ".bg-dice:disabled{opacity:.55}",
      R + ".bg-dice.roll{animation:bgSpin .42s ease-in-out}",
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

    /* Check URL invite params (?battle=XXXX&game=ludo|snakes) */
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
    version: "2.0.0-complete",
    getPrefs: copyPrefs,
    setPref: setPref,
    resetPrefs: resetPrefs,
    subscribe: function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
    getBoard: getBoard,
    boards: function () { return BOARD_IDS.slice(); },
    pieces: function () { return PIECES.map(function (p) { return p[0]; }); },
    paintBoardBg: paintBoardBg,
    drawToken: drawToken,
    shade: shade,
    alpha: alpha,
    playSfx: playSfx,
    speed: function () { return P.speed; },
    dur: function (ms) { return ms / P.speed; },
    isMuted: function () { return !!P.mute; },
    registerGame: registerGame,
    setTab: setTab,
    getTab: function () { return P.tab; }
  };

  /* =====================================================================
   * GAME 1: SNAKES & LADDERS (Offline + Online Friends + Emoji Reactions)
   * ===================================================================== */
  (function () {
    var COLORS = ["#ef4444", "#22c55e", "#facc15", "#38bdf8"];
    var LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
    var SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };

    var host = null, view = "setup";
    var cfg = { mode: "ai", count: 2, myName: savedName(), names: ["You", "Bot 1", "Bot 2", "Bot 3"], code: "" };
    var st = null, rm = null, busy = false;
    var cv = null, ctx = null, off = null, offCtx = null, offKey = "", size = 0, dpr = 1;
    var raf = 0, botT = 0, diceT = 0, quitT = 0, particles = [];

    if (pendingInvite && pendingInvite.game === "snakes") {
      cfg.mode = "online"; cfg.code = pendingInvite.code;
    }

    function cellCenter(n, s) {
      n = Math.max(1, Math.min(100, n));
      var idx = n - 1, row = Math.floor(idx / 10), col = idx % 10;
      if (row % 2 === 1) col = 9 - col;
      var pad = s * 0.04, inner = s - pad * 2, cw = inner / 10;
      return { x: pad + (col + 0.5) * cw, y: s - pad - (row + 0.5) * cw, cw: cw };
    }

    function buildCache() {
      if (!size || !offCtx) return;
      var b = api.getBoard(), key = size + "|" + dpr + "|" + b.id + "|" + (b.modern ? "m" : "c") + "|" + b.dark;
      if (key === offKey) return;
      offKey = key;
      off.width = size * dpr; off.height = size * dpr;
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBoardBg(offCtx, 0, 0, size, size, 16);

      var pad = size * 0.04, inner = size - pad * 2, cw = inner / 10, r, c, num, x, y;
      offCtx.textAlign = "left"; offCtx.textBaseline = "top";
      offCtx.font = "700 " + Math.max(9, Math.round(cw * 0.27)) + "px Inter,system-ui,sans-serif";

      for (r = 0; r < 10; r++) {
        for (c = 0; c < 10; c++) {
          num = r * 10 + (r % 2 === 0 ? c + 1 : 10 - c);
          x = pad + c * cw; y = size - pad - (r + 1) * cw;
          offCtx.fillStyle = (r + c) % 2 === 0 ? b.cellA : b.cellB;
          if (b.modern) {
            offCtx.globalAlpha = 0.72;
            rr(offCtx, x + 1, y + 1, cw - 2, cw - 2, 4);
            offCtx.fill();
            offCtx.globalAlpha = 1;
            offCtx.strokeStyle = alpha(b.line, 0.35); offCtx.lineWidth = 1; offCtx.stroke();
          } else {
            offCtx.fillRect(x, y, cw, cw);
            offCtx.strokeStyle = alpha(b.line, 0.45); offCtx.lineWidth = 1; offCtx.strokeRect(x, y, cw, cw);
          }
          if (num === 1 || num === 100) {
            offCtx.fillStyle = alpha(b.accent, b.modern ? 0.25 : 0.3);
            offCtx.fillRect(x + 1, y + 1, cw - 2, cw - 2);
          }
          offCtx.fillStyle = num === 100 ? b.accent : alpha(b.text, 0.75);
          offCtx.fillText(num === 100 ? "100★" : String(num), x + cw * 0.1, y + cw * 0.08);
        }
      }

      var k, p1, p2, dx, dy, len, ux, uy, nx, ny, rail, steps, i, t, rx, ry;
      for (k in LADDERS) {
        p1 = cellCenter(+k, size); p2 = cellCenter(LADDERS[k], size);
        dx = p2.x - p1.x; dy = p2.y - p1.y; len = Math.hypot(dx, dy) || 1;
        ux = dx / len; uy = dy / len; nx = -uy; ny = ux;
        rail = cw * 0.19; steps = Math.max(4, Math.floor(len / (cw * 0.32)));
        offCtx.save(); offCtx.lineCap = "round";
        if (b.modern) {
          offCtx.strokeStyle = "#34d399"; offCtx.shadowColor = "#10b981"; offCtx.shadowBlur = 10; offCtx.lineWidth = Math.max(2.5, cw * 0.08);
        } else {
          offCtx.strokeStyle = "#92400e"; offCtx.lineWidth = Math.max(3, cw * 0.09);
        }
        offCtx.beginPath();
        offCtx.moveTo(p1.x + nx * rail, p1.y + ny * rail); offCtx.lineTo(p2.x + nx * rail, p2.y + ny * rail);
        offCtx.moveTo(p1.x - nx * rail, p1.y - ny * rail); offCtx.lineTo(p2.x - nx * rail, p2.y - ny * rail);
        offCtx.stroke();
        offCtx.lineWidth = Math.max(2, cw * 0.065);
        if (b.modern) offCtx.strokeStyle = "#fde047";
        offCtx.beginPath();
        for (i = 1; i < steps; i++) {
          t = i / steps; rx = p1.x + dx * t; ry = p1.y + dy * t;
          offCtx.moveTo(rx + nx * rail, ry + ny * rail); offCtx.lineTo(rx - nx * rail, ry - ny * rail);
        }
        offCtx.stroke(); offCtx.restore();
      }

      var idx = 0, sCols = ["#f43f5e", "#a855f7", "#fb923c", "#ec4899"], sc, cx1, cy1, cx2, cy2, ang;
      for (k in SNAKES) {
        p1 = cellCenter(+k, size); p2 = cellCenter(SNAKES[k], size);
        dx = p2.x - p1.x; dy = p2.y - p1.y; len = Math.hypot(dx, dy) || 1;
        nx = -dy / len; ny = dx / len;
        sc = sCols[idx % sCols.length]; idx++;
        cx1 = p1.x + dx * 0.33 + nx * cw * 0.65; cy1 = p1.y + dy * 0.33 + ny * cw * 0.65;
        cx2 = p1.x + dx * 0.68 - nx * cw * 0.65; cy2 = p1.y + dy * 0.68 - ny * cw * 0.65;
        offCtx.save(); offCtx.lineCap = "round";
        offCtx.beginPath(); offCtx.moveTo(p1.x, p1.y); offCtx.bezierCurveTo(cx1, cy1, cx2, cy2, p2.x, p2.y);
        if (b.modern) {
          offCtx.strokeStyle = sc; offCtx.shadowColor = sc; offCtx.shadowBlur = 12; offCtx.lineWidth = Math.max(4, cw * 0.16); offCtx.stroke();
          offCtx.strokeStyle = "rgba(255,255,255,0.65)"; offCtx.lineWidth = Math.max(1.5, cw * 0.045); offCtx.stroke();
        } else {
          offCtx.strokeStyle = shade(sc, -0.2); offCtx.lineWidth = Math.max(5, cw * 0.19); offCtx.stroke();
          offCtx.strokeStyle = "#fde047"; offCtx.setLineDash([cw * 0.12, cw * 0.14]); offCtx.lineWidth = Math.max(2, cw * 0.08); offCtx.stroke();
          offCtx.setLineDash([]);
        }
        ang = Math.atan2(cy1 - p1.y, cx1 - p1.x);
        offCtx.translate(p1.x, p1.y); offCtx.rotate(ang);
        offCtx.fillStyle = shade(sc, b.modern ? 0.15 : -0.15);
        offCtx.beginPath(); offCtx.ellipse(0, 0, cw * 0.17, cw * 0.13, 0, 0, TAU); offCtx.fill();
        offCtx.fillStyle = "#fff";
        offCtx.beginPath(); offCtx.arc(-cw * 0.04, -cw * 0.06, cw * 0.035, 0, TAU); offCtx.arc(-cw * 0.04, cw * 0.06, cw * 0.035, 0, TAU); offCtx.fill();
        offCtx.fillStyle = "#000";
        offCtx.beginPath(); offCtx.arc(-cw * 0.05, -cw * 0.06, cw * 0.018, 0, TAU); offCtx.arc(-cw * 0.05, cw * 0.06, cw * 0.018, 0, TAU); offCtx.fill();
        offCtx.restore();
      }
    }

    function spawnSparks(x, y, col, n) {
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
      var cw = (size * 0.92) / 10, baseR = Math.max(9, cw * 0.34);
      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i];
        if (pl.anim) { drawToken(ctx, pl.anim.x, pl.anim.y, baseR * 1.12, pl.color); continue; }
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
        drawToken(ctx, c.x + ox, c.y + oy, baseR * sc, pl.color);
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
      var i = 0;
      function stepNext() {
        if (!st || i >= steps.length) { pl.anim = null; drawFrame(); if (onDone) onDone(); return; }
        var from = cellCenter(pl.pos, size), to = cellCenter(steps[i], size);
        var start = performance.now(), ms = api.dur(130);
        playSfx("move");
        function tick(now) {
          if (!st) return;
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
      var from = cellCenter(pl.pos, size), to = cellCenter(dest, size);
      var start = performance.now(), ms = api.dur(420);
      playSfx(isLadder ? "ladder" : "snake");
      if (!isLadder) { try { if (navigator.vibrate) navigator.vibrate([35, 30, 35]); } catch (e) { } }
      spawnSparks(from.x, from.y, isLadder ? "#34d399" : "#f43f5e", 16);
      function tick(now) {
        if (!st) return;
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
      var msg = rolledSix ? (st.players[st.turn].name + " rolled 6! Roll again") : (st.players[nextTurn].name + "'s turn");
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
        setTimeout(function () { finishTurn(rolledSix, isActor); }, api.dur(600));
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
          try { if (navigator.vibrate) navigator.vibrate([40, 40, 80]); } catch (e) { }
          if (rm && isActor) pushOnlineState(st.turn, pIdx, pl.name + " wins!");
          setTimeout(function () { view = "result"; render(); }, api.dur(750));
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

    function rollDice() {
      if (!canRollNow()) return;
      st.busy = true; updateHUD();
      playSfx("dice");
      var btn = q("#sl-dice-btn", host);
      if (btn) { btn.classList.remove("roll"); void btn.offsetWidth; btn.classList.add("roll"); }
      var ticks = 0, finalVal = 1 + Math.floor(Math.random() * 6);
      clearInterval(diceT);
      diceT = setInterval(function () {
        ticks++;
        var show = ticks >= 6 ? finalVal : 1 + Math.floor(Math.random() * 6);
        st.dice = show;
        if (btn) btn.innerHTML = diceSVG(show);
        if (ticks >= 6) {
          clearInterval(diceT);
          st.rollId = (st.rollId || 0) + 1;
          if (rm) {
            rm.F.updateDoc(rm.ref, {
              "sl.lastMove": { by: st.turn, val: finalVal, id: st.rollId },
              "sl.dice": finalVal
            }).catch(function () { });
          }
          executeMove(st.turn, finalVal, true);
        }
      }, api.dur(60));
    }

    function maybeBot() {
      clearTimeout(botT);
      if (!st || st.busy || st.winner || rm) return;
      if (st.players[st.turn].bot) botT = setTimeout(rollDice, api.dur(520));
    }

    function sendEmoji(emo) {
      if (!st) return;
      var myIdx = rm ? st.players.findIndex(function (p) { return p.uid === rm.uid; }) : st.turn;
      if (myIdx < 0) myIdx = 0;
      showReaction(myIdx, emo);
      playSfx("click");
      if (rm) {
        rm.F.updateDoc(rm.ref, { "sl.react": { by: myIdx, emo: emo, id: Date.now() } }).catch(function () { });
      }
    }

    /* ---------- Online Rooms for Snakes & Ladders ---------- */
    function leaveOnline() {
      if (!rm) return;
      var r = rm; rm = null; st = null;
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

    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastRollId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { rm = null; st = null; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.sl) {
          var sl = d.sl;
          if (!st || view !== "game") {
            var pls = sl.order.map(function (u, idx) {
              return { uid: u, name: (d.players[u] && d.players[u].name) || "Player " + (idx + 1), color: COLORS[idx], pos: sl.positions[idx] || 1, bot: false, anim: null };
            });
            st = { players: pls, turn: sl.turn || 0, dice: sl.dice || 6, rollId: sl.rollId || 0, busy: false, winner: null, msg: sl.msg || "" };
            particles = []; view = "game"; render();
          }
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
        } else if (d.status === "finished" && d.sl && st) {
          var wIdx = d.sl.winner != null ? d.sl.winner : 0;
          st.players.forEach(function (p, i) { if (d.sl.positions[i]) p.pos = d.sl.positions[i]; });
          st.winner = st.players[wIdx] || st.players[0];
          view = "result"; render();
        }
      });
    }

    function startOfflineMatch() {
      clearInterval(diceT); clearTimeout(botT); rm = null;
      var pls = [], i, nm;
      for (i = 0; i < cfg.count; i++) {
        nm = (cfg.names[i] || "").trim() || (cfg.mode === "ai" && i > 0 ? "Bot " + i : "Player " + (i + 1));
        pls.push({ name: nm, color: COLORS[i], pos: 1, bot: cfg.mode === "ai" && i > 0, anim: null });
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
        var posEl = el.querySelector(".sl-pos");
        if (posEl && st.players[idx]) posEl.textContent = "#" + st.players[idx].pos;
      });
    }

    function renderSetup() {
      var m = cfg.mode, i, h = '<div class="bg-box"><div class="ag-glass p-3.5 space-y-3">';
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
          h += '<div class="flex items-center gap-1.5"><span class="bg-dot" style="background:' + COLORS[i] + '"></span>' +
            '<input class="bg-in" type="text" maxlength="14" data-sl-name="' + i + '" value="' + esc(val) + '"' + (m === "ai" && i > 0 ? " readonly" : "") + '></div>';
        }
        h += '</div><button type="button" class="bg-cta" data-sl="start">' + ico("play") + 'Start Game</button>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderLobby() {
      var d = rm.data, uids = Object.keys(d.players).sort(function (a, b) { return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0); });
      var wa = "https://wa.me/?text=" + encodeURIComponent("Join my ITI CONNECT Snakes & Ladders room! 🎲\nCode: " + rm.code + "\n" + INVITE_BASE + rm.code + "&game=snakes");
      var h = '<div class="bg-box"><div class="ag-glass p-4 text-center space-y-3">';
      h += '<div class="flex items-center justify-between"><span class="text-sm font-extrabold">Snakes &amp; Ladders Room</span><button type="button" class="bg-sec" style="padding:.4rem .6rem" data-sl="leave">' + ico("x") + '</button></div>';
      h += '<div><div class="text-xs qa-t2 font-bold">ROOM CODE</div><div class="bg-code">' + rm.code + '</div></div>';
      h += '<div class="grid grid-cols-2 gap-2"><button type="button" class="bg-sec" data-sl="copy">' + ico("copy") + 'Copy Code</button>' +
        '<a class="bg-sec" style="text-decoration:none" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + 'WhatsApp</a></div>';
      h += '<div class="space-y-1.5 text-left">';
      for (var i = 0; i < d.maxPlayers; i++) {
        var u = uids[i];
        h += '<div class="bg-pchip"><span class="bg-dot" style="background:' + COLORS[i] + '"></span><span class="flex-1 truncate">' +
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
        '<span class="text-xs font-bold qa-t2 shrink-0">' + P.speed + '×</span></div>';
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
          else if (a === "roll") { rollDice(); }
          else if (a === "emo") { sendEmoji(k); }
          else if (a === "quit") {
            var now = Date.now();
            if (now - quitT < 2500) {
              clearInterval(diceT); clearTimeout(botT);
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
          if (key === "style" || key === "board" || key === "piece" || key === "theme") { offKey = ""; drawFrame(); }
        });
        render();
      },
      onShow: function () { resizeBoard(); kickLoop(); },
      onHide: function () { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    });
  })();

  /* =====================================================================
   * GAME 2: TURBO & CLASSIC LUDO (Offline + Online Friends + Emoji Reactions)
   * ===================================================================== */
  (function () {
    var SEAT_COLORS = ["#ef4444", "#22c55e", "#facc15", "#38bdf8"]; // Red, Green, Yellow, Blue
    var SEAT_NAMES = ["Red", "Green", "Yellow", "Blue"];
    var START_IDX = [0, 13, 26, 39];
    var SAFE_TRACK = [0, 8, 13, 21, 26, 34, 39, 47];

    // 52-square outer track in (col, row) on 15x15 grid
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
      [[1,7],[2,7],[3,7],[4,7],[5,7]],       // Red
      [[7,1],[7,2],[7,3],[7,4],[7,5]],       // Green
      [[13,7],[12,7],[11,7],[10,7],[9,7]],   // Yellow
      [[7,13],[7,12],[7,11],[7,10],[7,9]]    // Blue
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

    var host = null, view = "setup";
    var cfg = { mode: "ai", turbo: true, count: 2, myName: savedName(), names: ["You", "Bot 1", "Bot 2", "Bot 3"], code: "" };
    var st = null, rm = null, busy = false;
    var cv = null, ctx = null, off = null, offCtx = null, offKey = "", size = 0, dpr = 1;
    var raf = 0, botT = 0, diceT = 0, quitT = 0, particles = [];

    if (pendingInvite && pendingInvite.game === "ludo") {
      cfg.mode = "online"; cfg.code = pendingInvite.code;
    }

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

    function drawStar(c, cx, cy, r, col) {
      c.save(); c.translate(cx, cy); c.strokeStyle = col; c.lineWidth = Math.max(1.2, r * 0.14);
      c.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
        if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      c.closePath(); c.stroke(); c.restore();
    }

    function buildCache() {
      if (!size || !offCtx) return;
      var b = api.getBoard(), key = size + "|" + dpr + "|" + b.id + "|" + (b.modern ? "m" : "c") + "|" + b.dark;
      if (key === offKey) return;
      offKey = key;
      off.width = size * dpr; off.height = size * dpr;
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBoardBg(offCtx, 0, 0, size, size, 16);

      var cw = size / 15, i, j, x, y;
      // 1. Track squares
      for (i = 0; i < 52; i++) {
        x = TRACK[i][0] * cw; y = TRACK[i][1] * cw;
        offCtx.fillStyle = b.modern ? alpha(b.cellA, 0.85) : b.track;
        offCtx.fillRect(x, y, cw, cw);
        offCtx.strokeStyle = alpha(b.line, 0.45); offCtx.lineWidth = 1; offCtx.strokeRect(x, y, cw, cw);
      }
      // 2. Colored home lanes + start tiles
      for (i = 0; i < 4; i++) {
        var sc = SEAT_COLORS[i], stSq = TRACK[START_IDX[i]];
        offCtx.fillStyle = b.modern ? alpha(sc, 0.45) : sc;
        offCtx.fillRect(stSq[0] * cw, stSq[1] * cw, cw, cw);
        offCtx.strokeStyle = alpha(b.line, 0.5); offCtx.strokeRect(stSq[0] * cw, stSq[1] * cw, cw, cw);
        for (j = 0; j < 5; j++) {
          x = HOME_LANES[i][j][0] * cw; y = HOME_LANES[i][j][1] * cw;
          offCtx.fillStyle = b.modern ? alpha(sc, 0.35) : alpha(sc, 0.78);
          offCtx.fillRect(x, y, cw, cw);
          offCtx.strokeStyle = alpha(b.line, 0.45); offCtx.strokeRect(x, y, cw, cw);
        }
      }
      // 3. Safe stars
      for (i = 0; i < SAFE_TRACK.length; i++) {
        var sq = TRACK[SAFE_TRACK[i]];
        drawStar(offCtx, (sq[0] + 0.5) * cw, (sq[1] + 0.5) * cw, cw * 0.32, b.modern ? "#fff" : alpha(b.text, 0.65));
      }
      // 4. 4 Corner Yards
      var yards = [[0, 0], [9, 0], [9, 9], [0, 9]];
      for (i = 0; i < 4; i++) {
        var yc = SEAT_COLORS[i];
        x = yards[i][0] * cw; y = yards[i][1] * cw;
        offCtx.fillStyle = b.modern ? alpha(yc, 0.25) : yc;
        offCtx.fillRect(x, y, cw * 6, cw * 6);
        offCtx.strokeStyle = b.modern ? yc : b.frame; offCtx.lineWidth = 2; offCtx.strokeRect(x, y, cw * 6, cw * 6);
        rr(offCtx, x + cw * 0.75, y + cw * 0.75, cw * 4.5, cw * 4.5, cw * 0.6);
        offCtx.fillStyle = b.modern ? alpha(b.base, 0.85) : "#ffffff"; offCtx.fill();
        for (j = 0; j < 4; j++) {
          var sp = YARD_SPOTS[i][j];
          offCtx.beginPath(); offCtx.arc(sp[0] * cw, sp[1] * cw, cw * 0.44, 0, TAU);
          offCtx.fillStyle = alpha(yc, 0.25); offCtx.fill();
          offCtx.strokeStyle = yc; offCtx.lineWidth = 1.5; offCtx.stroke();
        }
      }
      // 5. Center Finish Triangles
      var cx = 7.5 * cw, cy = 7.5 * cw, tris = [
        [[6 * cw, 6 * cw], [6 * cw, 9 * cw]],
        [[6 * cw, 6 * cw], [9 * cw, 6 * cw]],
        [[9 * cw, 6 * cw], [9 * cw, 9 * cw]],
        [[6 * cw, 9 * cw], [9 * cw, 9 * cw]]
      ];
      for (i = 0; i < 4; i++) {
        offCtx.beginPath(); offCtx.moveTo(cx, cy); offCtx.lineTo(tris[i][0][0], tris[i][0][1]); offCtx.lineTo(tris[i][1][0], tris[i][1][1]); offCtx.closePath();
        offCtx.fillStyle = b.modern ? alpha(SEAT_COLORS[i], 0.65) : SEAT_COLORS[i]; offCtx.fill();
        offCtx.strokeStyle = b.frame; offCtx.lineWidth = 1.5; offCtx.stroke();
      }
    }

    function spawnSparks(x, y, col, n) {
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

      var cw = size / 15, baseR = Math.max(8, cw * 0.36), pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
      var groups = {}, list = [], i, t, pl, key;

      for (i = 0; i < st.players.length; i++) {
        pl = st.players[i];
        for (t = 0; t < pl.tokens.length; t++) {
          var step = pl.tokens[t], anim = pl.anims && pl.anims[t];
          key = step < 0 ? "y" + pl.seat + "_" + t : (step === 56 ? "f" + pl.seat + "_" + t : (step > 50 ? "h" + pl.seat + "_" + step : "t" + trackIdx(pl.seat, step)));
          var item = { pIdx: i, tIdx: t, pl: pl, step: step, anim: anim, key: key };
          list.push(item);
          if (!anim) { if (!groups[key]) groups[key] = []; groups[key].push(item); }
        }
      }

      for (i = 0; i < list.length; i++) {
        var it = list[i];
        if (it.anim) { drawToken(ctx, it.anim.x, it.anim.y, baseR * 1.12, it.pl.color); continue; }
        var pos = tokenCoords(it.pl.seat, it.tIdx, it.step, size);
        var grp = groups[it.key] || [it], idx = grp.indexOf(it), len = grp.length;
        var ox = 0, oy = 0, sc = 1;
        if (len > 1) {
          var ang = (idx / len) * TAU - Math.PI / 4, dist = cw * 0.18;
          ox = Math.cos(ang) * dist; oy = Math.sin(ang) * dist; sc = 0.8;
        }
        it.screenX = pos.x + ox; it.screenY = pos.y + oy;
        if (st.awaitMove && it.pIdx === st.turn && st.validTokens.indexOf(it.tIdx) >= 0) {
          ctx.save();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(it.screenX, it.screenY, baseR * (0.95 + pulse * 0.25), 0, TAU); ctx.stroke();
          ctx.restore();
        }
        drawToken(ctx, it.screenX, it.screenY, baseR * sc, it.pl.color);
      }
      st._rendered = list;

      for (i = particles.length - 1; i >= 0; i--) {
        var pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.035 * api.speed();
        if (pt.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, pt.life); ctx.fillStyle = pt.col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, TAU); ctx.fill(); ctx.restore();
      }
      var hasAnim = st.players.some(function (p) { return p.anims && p.anims.some(Boolean); });
      if (particles.length || hasAnim || st.awaitMove) raf = window.requestAnimationFrame(drawFrame);
      else raf = 0;
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
      var i = 0;
      if (!pl.anims) pl.anims = [];
      function next() {
        if (!st || i >= steps.length) { pl.anims[tIdx] = null; drawFrame(); if (onDone) onDone(); return; }
        var from = tokenCoords(pl.seat, tIdx, pl.tokens[tIdx], size);
        var to = tokenCoords(pl.seat, tIdx, steps[i], size);
        var start = performance.now(), ms = api.dur(120);
        playSfx("move");
        function tick(now) {
          if (!st) return;
          var t = Math.min(1, (now - start) / ms), arc = Math.sin(t * Math.PI) * (size * 0.022);
          pl.anims[tIdx] = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - arc };
          drawFrame();
          if (t < 1) raf = window.requestAnimationFrame(tick);
          else { pl.tokens[tIdx] = steps[i]; i++; next(); }
        }
        raf = window.requestAnimationFrame(tick);
      }
      next();
    }

    function pushOnlineState(nextTurn, winnerIdx, msg) {
      if (!rm || !st) return;
      var allTokens = st.players.map(function (p) { return p.tokens.slice(); });
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
      var msg = bonus ? (st.players[st.turn].name + " gets a bonus roll!") : (st.players[nextTurn].name + "'s turn");
      st.turn = nextTurn;
      setMsg(msg);
      if (rm && isActor) pushOnlineState(nextTurn, -1, msg);
      updateHUD(); drawFrame();
      if (!rm) maybeBot();
    }

    function executeTokenMove(pIdx, tIdx, dice, isActor) {
      var pl = st.players[pIdx], cur = pl.tokens[tIdx];
      st.awaitMove = false; st.validTokens = []; st.busy = true; updateHUD();

      var path = [];
      if (cur < 0) path = [0];
      else { for (var s = cur + 1; s <= cur + dice; s++) path.push(s); }

      animateHop(pl, tIdx, path, function () {
        var dest = pl.tokens[tIdx], bonus = dice === 6;
        if (dest === 56) {
          bonus = true; playSfx("home");
          var fc = tokenCoords(pl.seat, tIdx, 56, size);
          spawnSparks(fc.x, fc.y, pl.color, 20);
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
                  spawnSparks(hitPos.x, hitPos.y, op.color, 22);
                  try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { }
                  setMsg(pl.name + " captured " + op.name + "!");
                }
              }
            }
          }
        }
        updateHUD();
        if (pl.tokens.every(function (v) { return v === 56; })) {
          st.winner = pl; st.busy = false; playSfx("win");
          try { if (navigator.vibrate) navigator.vibrate([40, 40, 80]); } catch (e) { }
          if (rm && isActor) pushOnlineState(st.turn, pIdx, pl.name + " wins!");
          setTimeout(function () { view = "result"; render(); }, api.dur(750));
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
        st.sixes = (st.sixes || 0) + 1; playSfx("six");
        if (st.sixes >= 3) {
          setMsg(pl.name + " rolled three 6s! Turn skipped");
          setTimeout(function () { endTurn(false, true); }, api.dur(700));
          return;
        }
      } else { st.sixes = 0; }

      var valid = legalMoves(pl, val);
      if (!valid.length) {
        setMsg("No valid moves for " + pl.name);
        setTimeout(function () { endTurn(val === 6, true); }, api.dur(650));
        return;
      }
      if (pl.bot) {
        var pick = pickBestBotToken(pl, valid, val);
        setTimeout(function () { executeTokenMove(st.turn, pick, val, true); }, api.dur(350));
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
      st.moveId = (st.moveId || 0) + 1;
      if (rm) {
        rm.F.updateDoc(rm.ref, {
          "ld.lastMove": { by: st.turn, tIdx: tIdx, dice: val, id: st.moveId },
          "ld.dice": val
        }).catch(function () { });
      }
      executeTokenMove(st.turn, tIdx, val, true);
    }

    function rollDice() {
      if (!canActNow() || st.busy || st.awaitMove) return;
      st.busy = true; updateHUD(); playSfx("dice");
      var btn = q("#ld-dice-btn", host);
      if (btn) { btn.classList.remove("roll"); void btn.offsetWidth; btn.classList.add("roll"); }
      var ticks = 0, finalVal = 1 + Math.floor(Math.random() * 6);
      clearInterval(diceT);
      diceT = setInterval(function () {
        ticks++;
        var show = ticks >= 6 ? finalVal : 1 + Math.floor(Math.random() * 6);
        st.dice = show;
        if (btn) btn.innerHTML = diceSVG(show);
        if (ticks >= 6) {
          clearInterval(diceT);
          afterDice(finalVal);
        }
      }, api.dur(60));
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
      if (st.players[st.turn].bot) botT = setTimeout(rollDice, api.dur(520));
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
      var r = rm; rm = null; st = null;
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
      var initToks = uids.map(function () { return d.turbo ? [0, -1] : [-1, -1, -1, -1]; });
      rm.F.updateDoc(rm.ref, {
        status: "playing",
        ld: { order: uids, tokens: initToks, turn: 0, dice: 6, sixes: 0, moveId: 0, msg: d.players[uids[0]].name + "'s turn" }
      }).catch(function () { });
    }

    function attachRoom(code, ref, f, isHost) {
      rm = { code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost, data: null, lastMoveId: 0, lastReactId: 0, unsub: null };
      rm.unsub = f.F.onSnapshot(ref, function (snap) {
        if (!rm) return;
        if (!snap.exists()) { rm = null; st = null; view = "setup"; render(); return; }
        var d = snap.data(); rm.data = d;
        if (d.status === "waiting") {
          view = "lobby"; renderLobby();
          if (rm.isHost && Object.keys(d.players).length >= d.maxPlayers) startOnlineMatch();
        } else if (d.status === "playing" && d.ld) {
          var ld = d.ld, seats = seatMap(ld.order.length);
          if (!st || view !== "game") {
            var pls = ld.order.map(function (u, idx) {
              var seat = seats[idx];
              return { uid: u, seat: seat, name: (d.players[u] && d.players[u].name) || SEAT_NAMES[seat], color: SEAT_COLORS[seat], tokens: (ld.tokens[idx] || [-1, -1]).slice(), bot: false, anims: [] };
            });
            st = { players: pls, turn: ld.turn || 0, dice: ld.dice || 6, sixes: ld.sixes || 0, moveId: ld.moveId || 0, busy: false, awaitMove: false, validTokens: [], winner: null, msg: ld.msg || "" };
            particles = []; view = "game"; render();
          }
          if (ld.react && ld.react.id && ld.react.id !== rm.lastReactId) {
            rm.lastReactId = ld.react.id;
            var myIdx = st.players.findIndex(function (p) { return p.uid === rm.uid; });
            if (ld.react.by !== myIdx) showReaction(ld.react.by, ld.react.emo);
          }
          if (ld.lastMove && ld.lastMove.id && ld.lastMove.id > rm.lastMoveId) {
            rm.lastMoveId = ld.lastMove.id;
            var actorIdx = ld.lastMove.by;
            if (st.players[actorIdx] && st.players[actorIdx].uid !== rm.uid) {
              st.dice = ld.lastMove.dice;
              var btn = q("#ld-dice-btn", host); if (btn) btn.innerHTML = diceSVG(st.dice);
              playSfx("dice");
              executeTokenMove(actorIdx, ld.lastMove.tIdx, ld.lastMove.dice, false);
            }
          } else if (!st.busy && !st.awaitMove) {
            st.turn = ld.turn; st.sixes = ld.sixes || 0;
            st.players.forEach(function (p, i) { if (ld.tokens[i]) p.tokens = ld.tokens[i].slice(); });
            if (ld.msg) setMsg(ld.msg);
            updateHUD(); drawFrame();
          }
        } else if (d.status === "finished" && d.ld && st) {
          var wIdx = d.ld.winner != null ? d.ld.winner : 0;
          st.players.forEach(function (p, i) { if (d.ld.tokens[i]) p.tokens = d.ld.tokens[i].slice(); });
          st.winner = st.players[wIdx] || st.players[0];
          view = "result"; render();
        }
      });
    }

    function startOfflineMatch() {
      clearInterval(diceT); clearTimeout(botT); rm = null;
      var seats = seatMap(cfg.count), pls = [], i, seat, nm;
      for (i = 0; i < cfg.count; i++) {
        seat = seats[i];
        nm = (cfg.names[i] || "").trim() || (cfg.mode === "ai" && i > 0 ? "Bot " + i : SEAT_NAMES[seat]);
        pls.push({ seat: seat, name: nm, color: SEAT_COLORS[seat], tokens: cfg.turbo ? [0, -1] : [-1, -1, -1, -1], bot: cfg.mode === "ai" && i > 0, anims: [] });
      }
      st = { players: pls, turn: 0, dice: 6, sixes: 0, moveId: 0, busy: false, awaitMove: false, validTokens: [], winner: null, msg: pls[0].name + "'s turn — Tap dice!" };
      particles = []; view = "game"; render();
    }

    function updateHUD() {
      if (!st || !host) return;
      var pl = st.players[st.turn], btn = q("#ld-dice-btn", host), can = canActNow();
      if (btn) btn.disabled = !can || st.busy || st.awaitMove;
      var hint = q("#ld-roll-hint", host);
      if (hint) {
        if (st.awaitMove) hint.textContent = can ? "Tap a glowing piece on the board" : pl.name + " is choosing a piece…";
        else if (st.busy) hint.textContent = "Moving…";
        else if (rm) hint.textContent = can ? "Your turn — Tap dice!" : "Waiting for " + pl.name + "…";
        else hint.textContent = pl.bot ? pl.name + " is rolling…" : "Tap dice to roll";
      }
      qa(".bg-pchip", host).forEach(function (el, idx) {
        el.classList.toggle("turn", idx === st.turn);
        var homeEl = el.querySelector(".ld-home");
        if (homeEl && st.players[idx]) {
          var done = st.players[idx].tokens.filter(function (v) { return v === 56; }).length;
          homeEl.textContent = done + "/" + st.players[idx].tokens.length;
        }
      });
    }

    function renderSetup() {
      var m = cfg.mode, seats = seatMap(cfg.count), i, h = '<div class="bg-box"><div class="ag-glass p-3.5 space-y-3">';
      h += '<div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2">' + ico("dices", "qa-ac") + '<span class="text-base font-extrabold">Ludo Arena</span></div><span class="text-xs qa-t2 font-bold">' + (cfg.turbo ? "Turbo 2-Token" : "Classic 4-Token") + '</span></div>';
      h += '<div class="ag-seg">' +
        '<button type="button" data-ld="mode" data-k="ai" class="' + (m === "ai" ? "on" : "") + '">' + ico("bot") + 'AI Bot</button>' +
        '<button type="button" data-ld="mode" data-k="local" class="' + (m === "local" ? "on" : "") + '">' + ico("users") + 'Pass &amp; Play</button>' +
        '<button type="button" data-ld="mode" data-k="online" class="' + (m === "online" ? "on" : "") + '">' + ico("wifi") + 'Online</button></div>';

      h += '<div class="ag-seg">' +
        '<button type="button" data-ld="turbo" data-k="1" class="' + (cfg.turbo ? "on" : "") + '">⚡ Turbo (2 Tokens)</button>' +
        '<button type="button" data-ld="turbo" data-k="0" class="' + (!cfg.turbo ? "on" : "") + '">Classic (4 Tokens)</button></div>';

      if (m === "online") {
        h += '<div><div class="ag-lbl" style="margin-top:0">Your Name</div><input class="bg-in" type="text" maxlength="14" data-ld-myname="1" value="' + esc(cfg.myName) + '" placeholder="Player"></div>';
        h += '<div><div class="ag-lbl" style="margin-top:0">Room Size</div><div class="ag-seg">' +
          [2, 3, 4].map(function (n) { return '<button type="button" data-ld="count" data-k="' + n + '" class="' + (cfg.count === n ? "on" : "") + '">' + n + 'P</button>'; }).join("") +
          '</div></div>';
        h += '<button type="button" class="bg-cta" data-ld="create">' + ico("plus") + 'Create Online Room</button>';
        h += '<div class="flex gap-1.5"><input id="ld-code-in" class="bg-in" style="width:6.2rem;text-align:center;letter-spacing:.22em;font-weight:800" type="text" inputmode="numeric" maxlength="4" placeholder="0000" value="' + esc(cfg.code) + '">' +
          '<button type="button" class="bg-sec flex-1 font-extrabold" data-ld="join">' + ico("log-in") + 'Join Room</button></div>';
        h += '<div id="ld-net-msg" class="text-xs qa-t2 text-center"></div>';
      } else {
        h += '<div><div class="ag-lbl" style="margin-top:0">Players</div><div class="ag-seg">' +
          [2, 3, 4].map(function (n) { return '<button type="button" data-ld="count" data-k="' + n + '" class="' + (cfg.count === n ? "on" : "") + '">' + n + ' Players</button>'; }).join("") +
          '</div></div>';
        h += '<div class="grid grid-cols-2 gap-2">';
        for (i = 0; i < cfg.count; i++) {
          var seat = seats[i], def = m === "ai" ? (i === 0 ? "You" : "Bot " + i) : SEAT_NAMES[seat];
          var val = cfg.names[i] && cfg.names[i].indexOf("Bot ") !== 0 && SEAT_NAMES.indexOf(cfg.names[i]) < 0 && cfg.names[i] !== "You" ? cfg.names[i] : def;
          cfg.names[i] = val;
          h += '<div class="flex items-center gap-1.5"><span class="bg-dot" style="background:' + SEAT_COLORS[seat] + '"></span>' +
            '<input class="bg-in" type="text" maxlength="14" data-ld-name="' + i + '" value="' + esc(val) + '"' + (m === "ai" && i > 0 ? " readonly" : "") + '></div>';
        }
        h += '</div><button type="button" class="bg-cta" data-ld="start">' + ico("play") + 'Start Ludo</button>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderLobby() {
      var d = rm.data, seats = seatMap(d.maxPlayers), uids = Object.keys(d.players).sort(function (a, b) { return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0); });
      var wa = "https://wa.me/?text=" + encodeURIComponent("Join my ITI CONNECT Ludo match! 🎲\nCode: " + rm.code + "\n" + INVITE_BASE + rm.code + "&game=ludo");
      var h = '<div class="bg-box"><div class="ag-glass p-4 text-center space-y-3">';
      h += '<div class="flex items-center justify-between"><span class="text-sm font-extrabold">Ludo Room · ' + (d.turbo ? "Turbo" : "Classic") + '</span><button type="button" class="bg-sec" style="padding:.4rem .6rem" data-ld="leave">' + ico("x") + '</button></div>';
      h += '<div><div class="text-xs qa-t2 font-bold">ROOM CODE</div><div class="bg-code">' + rm.code + '</div></div>';
      h += '<div class="grid grid-cols-2 gap-2"><button type="button" class="bg-sec" data-ld="copy">' + ico("copy") + 'Copy Code</button>' +
        '<a class="bg-sec" style="text-decoration:none" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + 'WhatsApp</a></div>';
      h += '<div class="space-y-1.5 text-left">';
      for (var i = 0; i < d.maxPlayers; i++) {
        var u = uids[i], seat = seats[i];
        h += '<div class="bg-pchip"><span class="bg-dot" style="background:' + SEAT_COLORS[seat] + '"></span><span class="flex-1 truncate">' +
          (u ? esc(d.players[u].name) + (u === rm.uid ? " (You)" : "") : '<span class="qa-t2">Waiting for friend…</span>') + '</span></div>';
      }
      h += '</div>';
      if (rm.isHost) {
        h += '<button type="button" class="bg-cta" data-ld="onstart"' + (uids.length < 2 ? " disabled" : "") + '>' + ico("play") + 'Start Match (' + uids.length + '/' + d.maxPlayers + ')</button>';
      } else {
        h += '<div class="text-xs qa-t2">Waiting for host to start…</div>';
      }
      h += '</div></div>';
      host.innerHTML = h; icons();
    }

    function renderGame() {
      var h = '<div class="bg-box space-y-2.5">';
      h += '<div class="ag-glass p-2.5 flex items-center justify-between gap-2">' +
        '<button type="button" class="bg-sec" style="padding:.45rem .6rem" data-ld="quit" aria-label="Quit game">' + ico("x") + '</button>' +
        '<div id="ld-msg" class="text-xs font-extrabold text-center truncate flex-1">' + esc(st.msg) + '</div>' +
        '<button type="button" id="ld-auto-btn" class="bg-pill' + (P.autoMove ? " on" : "") + '" data-ld="automove" title="Auto-move when only 1 piece can move">Auto</button></div>';
      h += '<div class="bg-cv-wrap ag-glass"><canvas id="ld-canvas" class="bg-cv"></canvas></div>';
      h += '<div class="ag-glass p-2.5 space-y-2"><div class="flex items-center gap-2.5">' +
        '<button type="button" id="ld-dice-btn" class="bg-dice" data-ld="roll" aria-label="Roll dice">' + diceSVG(st.dice) + '</button>' +
        '<div class="min-w-0 flex-1 space-y-1.5">' +
        '<div id="ld-roll-hint" class="text-xs font-extrabold">Tap dice to roll</div>' +
        '<div class="grid grid-cols-2 gap-1.5">' + st.players.map(function (pl, idx) {
          var done = pl.tokens.filter(function (v) { return v === 56; }).length;
          return '<div id="ld-chip-' + idx + '" class="bg-pchip' + (idx === st.turn ? " turn" : "") + '"><span class="bg-dot" style="background:' + pl.color + '"></span>' +
            '<span class="truncate flex-1">' + esc(pl.name) + '</span><span class="ld-home qa-ac font-extrabold">' + done + '/' + pl.tokens.length + '</span></div>';
        }).join("") + '</div></div></div>';
      h += '<div class="bg-emo-bar">' + ["👏", "😂", "🔥", "😱"].map(function (em) {
        return '<button type="button" class="bg-emo" data-ld="emo" data-k="' + em + '">' + em + '</button>';
      }).join("") + '</div></div></div>';
      host.innerHTML = h; icons();
      cv = q("#ld-canvas", host); ctx = cv.getContext("2d");
      cv.addEventListener("click", handleBoardTap);
      if (!off) { off = document.createElement("canvas"); offCtx = off.getContext("2d"); }
      offKey = "";
      window.requestAnimationFrame(function () { resizeBoard(); updateHUD(); maybeBot(); });
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
      var h = '<div class="bg-box"><div class="ag-glass p-4 text-center space-y-3">';
      h += '<div class="text-xs font-extrabold qa-t2 uppercase tracking-wider">Ludo Arena</div>';
      h += '<div class="text-xl font-extrabold">' + esc(ranked[0].name) + ' Wins! 🏆</div>';
      h += '<div class="space-y-1.5 text-left">' + ranked.map(function (pl, idx) {
        var done = pl.tokens.filter(function (v) { return v === 56; }).length;
        return '<div class="bg-pchip' + (idx === 0 ? " turn" : "") + '"><span>' + medals[idx] + '</span>' +
          '<span class="bg-dot" style="background:' + pl.color + '"></span>' +
          '<span class="truncate flex-1">' + esc(pl.name) + '</span>' +
          '<span class="font-extrabold qa-ac">' + done + '/' + pl.tokens.length + ' Home</span></div>';
      }).join("") + '</div>';
      h += '<div class="grid grid-cols-2 gap-2 pt-1">' +
        (rm ? '<button type="button" class="bg-cta col-span-2" data-ld="leave">' + ico("log-out") + 'Leave Room</button>' :
          '<button type="button" class="bg-cta" data-ld="start">' + ico("rotate-ccw") + 'Play Again</button>' +
          '<button type="button" class="bg-sec" data-ld="setup">' + ico("sliders-horizontal") + 'Setup</button>') +
        '</div></div></div>';
      host.innerHTML = h; icons();
    }

    function render() {
      if (!host) return;
      if (view === "lobby" && rm) renderLobby();
      else if (view === "game" && st) renderGame();
      else if (view === "result" && st) renderResult();
      else { view = "setup"; renderSetup(); }
    }

    registerGame("ludo", {
      mount: function (el) {
        host = el;
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
          else if (a === "copy" && rm) { copyText(rm.code); playSfx("click"); }
          else if (a === "leave") { playSfx("click"); leaveOnline(); }
          else if (a === "setup") { playSfx("click"); view = "setup"; render(); }
          else if (a === "roll") { rollDice(); }
          else if (a === "emo") { sendEmoji(k); }
          else if (a === "automove") {
            setPref("autoMove", !P.autoMove); playSfx("click");
            var ab = q("#ld-auto-btn", host); if (ab) ab.classList.toggle("on", P.autoMove);
          } else if (a === "quit") {
            var now = Date.now();
            if (now - quitT < 2500) {
              clearInterval(diceT); clearTimeout(botT);
              if (rm) leaveOnline(); else { st = null; view = "setup"; render(); }
            } else { quitT = now; setMsg("Tap ✕ again to quit"); }
          }
        });
        host.addEventListener("input", function (e) {
          var idx = e.target.getAttribute && e.target.getAttribute("data-ld-name");
          if (idx != null) cfg.names[+idx] = e.target.value.slice(0, 14);
          if (e.target.getAttribute("data-ld-myname")) cfg.myName = e.target.value.slice(0, 14);
          if (e.target.id === "ld-code-in") { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); cfg.code = e.target.value; }
        });
        api.subscribe(function (_, key) {
          if (key === "style" || key === "board" || key === "piece" || key === "theme") { offKey = ""; drawFrame(); }
        });
        render();
      },
      onShow: function () { resizeBoard(); kickLoop(); },
      onHide: function () { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    });
  })();

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

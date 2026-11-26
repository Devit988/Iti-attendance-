/*! ITI CONNECT — Quiz Arena v2.0 (Glassmorphism Studio Edition · Solo, 2–4P Battle & 1v1 Power Clash)
 *  Mounts into <div id="quiz-arena-root"></div>. Needs ./quiz_bank.json.
 *  Live rooms: Firestore doc battles/{roomCode}, Firebase v10.12.2 (same app as index.html),
 *  anonymous Firebase Auth for the player id. Invite link: ?battle=XXXX
 *  Tug of War (1v1): battleType "tug" rooms - synchronized rounds, High-Voltage power bar
 *  API: window.QuizArena, window.QuizArenaMulti.{createRoom(cfg), joinRoom(code, cfg)}
 *  Admin: custom questions live in Firestore quiz_meta/custom_questions (1 read, cached in localStorage)
 */
(function () {
  "use strict";

  var LS = { prefs: "iti_qa_prefs_v1", name: "iti_qa_name_v1", streak: "iti_qa_streak_v1", custom: "iti_qa_custom_v1" };
  var BANK_URL = "./quiz_bank.json";
  var BANK_EXTRA_URL = "./quiz_bank_extra.json";   /* extra topics; ids 50001+ are reserved for this file */
  var EXTRA_ID_MIN = 50000;
  var SEC_PER_Q = 12;
  var COUNTS = [10, 15, 20, 25, 50];
  /* 1v1 Tug of War tuning */
  var TUG_SEC = 10, TUG_FLASH = 1600, TUG_PULL = 15, TUG_TIE = 8, TUG_OVER = 1.5, TUG_MISS = 3, TUG_SD = 3;
  var TOPICS = [
    ["iti", "all", "All ITI"],
    ["iti", "elec", "ITI ELEC"],
    ["iti", "wcs", "Workshop Calc"],
    ["iti", "draw", "Eng. Drawing"],
    ["iti", "safe", "Safety & Tools"],
    ["sci", "all", "Science"],
    ["sci", "phy", "Physics"],
    ["sci", "chem", "Chemistry"],
    ["sci", "bio", "Biology"],
    ["gs", "all", "GS / GK"],
    ["gs", "his", "History"],
    ["gs", "geo", "Geography"],
    ["gs", "pol", "Polity & GK"],
    ["gs", "eco", "Economy"],
    ["gs", "comp", "Computer"],
    ["apt", "math", "Maths"],
    ["apt", "eng", "English"],
    ["apt", "reason", "Reasoning"],
    ["mix", "mix", "Exam Mix"]
  ];
  var SUBS = {
    iti: [["all", "All ITI (all subjects)"], ["y1", "1st Year Only"], ["y2", "2nd Year Only"], ["wcs", "Workshop Calc & Science"], ["draw", "Engineering Drawing"], ["safe", "Safety & Tools"]],
    sci: [["all", "All Science"], ["phy", "Physics"], ["chem", "Chemistry"], ["bio", "Biology"]],
    gs: [["all", "All GS (Sci + GK)"], ["his", "History"], ["geo", "Geography"], ["pol", "Polity & Static"], ["eco", "Indian Economy"], ["comp", "Computer Basics"]],
    apt: [["math", "Math Only"], ["eng", "English Only"], ["reason", "Reasoning Only"]],
    mix: [["mix", "GS + ITI Combined"]]
  };
  var ELEC = {
    y1: { name: "1st Year", mods: [["ohm", "Basic Electricity & Circuits"], ["ac", "AC, Magnetism & Machines"], ["cell", "Cells & Batteries"], ["wire", "Wiring, Cables & Controls"], ["inst", "Instruments & Hand Tools"], ["safe", "Safety, Earthing & Protection"]] },
    y2: { name: "2nd Year", mods: [["tr", "Transformers"], ["mot", "Motors & Starters"], ["alt", "Alternators & Synchronous"], ["pf", "3-Phase & Power Factor"], ["prot", "Protection & Switchgear"], ["em", "Electronics, Meters & Installation"]] }
  };
  function elecParts(main, sub) {
    if (main !== "iti" || typeof sub !== "string") return null;
    if (sub === "elec") return { yr: "", mod: "" };
    var m = /^(y1|y2)(?::([a-z]+))?$/.exec(sub);
    if (!m) return null;
    if (m[2] && !modName(m[1], m[2])) return null;
    return { yr: m[1], mod: m[2] || "" };
  }
  function modName(yr, mod) {
    var e = ELEC[yr], i; if (!e) return "";
    for (i = 0; i < e.mods.length; i++) if (e.mods[i][0] === mod) return e.mods[i][1];
    return "";
  }
  function validTopic(main, sub) {
    return TOPICS.some(function (t) { return t[0] === main && t[1] === sub; }) || !!elecParts(main, sub);
  }
  var MAIN_NAMES = { iti: "ITI Trade", sci: "Science", gs: "GS / GK", apt: "Aptitude", mix: "Exam Mix" };
  var TAGS = { y1: "ITI 1st Year", y2: "ITI 2nd Year", phy: "Physics", chem: "Chemistry", bio: "Biology", his: "History", geo: "Geography", pol: "Polity & GK", math: "Maths", eng: "English", wcs: "Workshop Calc & Science", draw: "Engineering Drawing", safe: "Safety & Tools", eco: "Indian Economy", comp: "Computer Basics", reason: "Reasoning" };

  var root = null, view = null, msgEl = null, msgT = 0;
  var bank = [], bankState = "loading";
  var screen = "setup", G = null, last = null, reviewOpen = false;
  var S = { mode: "solo", players: 2, count: 10, main: "iti", sub: "all", name: "", battle: "classic" };
  var R = null, busy = false, pendingCode = "", codeDraft = "", FBR = null, FBP = null, FBC = null;
  var baseBank = [], baseById = {}, custom = { updatedAt: 0, items: [] }, AD = null;

  /* ---------- helpers ---------- */
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + pad(s % 60); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function $(id) { return root ? root.querySelector("#" + id) : null; }
  function icons() { try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) { } }
  function ico(n, c) { return '<i data-lucide="' + n + '" class="qa-i ' + (c || "") + '"></i>'; }
  function sfx(type) { try { if (window.ArenaGames && window.ArenaGames.playSfx) window.ArenaGames.playSfx(type); } catch (e) { } }
  function toast(t) {
    if (!msgEl) return; msgEl.textContent = t; msgEl.classList.add("on");
    clearTimeout(msgT); msgT = setTimeout(function () { msgEl.classList.remove("on"); }, 2600);
  }
  function activePlayers() { return S.mode === "solo" ? 1 : S.players; }

  /* ---------- prefs ---------- */
  function loadPrefs() {
    S.name = (ls(LS.name) || "").slice(0, 16);
    try {
      var p = JSON.parse(ls(LS.prefs) || "{}");
      if (p.mode === "solo" || p.mode === "multi") S.mode = p.mode;
      else if ([2, 3, 4].indexOf(p.players) > -1) S.mode = "multi";
      if ([2, 3, 4].indexOf(p.players) > -1) S.players = p.players;
      if (COUNTS.indexOf(p.count) > -1) S.count = p.count;
      if (p.battle === "tug" || p.battle === "classic") S.battle = p.battle;
      if (validTopic(p.main, p.sub)) { S.main = p.main; S.sub = p.sub; }
    } catch (e) { }
  }
  function savePrefs() {
    lsSet(LS.prefs, JSON.stringify({ mode: S.mode, players: S.players, count: S.count, main: S.main, sub: S.sub, battle: S.battle }));
  }

  /* ---------- question pools ---------- */
  function poolFor(main, sub) {
    return bank.filter(function (q) {
      if (main === "iti") {
        var ep = elecParts(main, sub);
        if (ep) return q.group === "iti" && (ep.yr ? q.sub === ep.yr && (!ep.mod || q.mod === ep.mod) : (q.sub === "y1" || q.sub === "y2"));
        return q.group === "iti" && (sub === "all" || q.sub === sub);
      }
      if (main === "sci") return q.group === "sci" && (sub === "all" || q.sub === sub);
      if (main === "gs") return sub === "all" ? (q.group === "gs" || q.group === "sci") : (q.group === "gs" && q.sub === sub);
      if (main === "apt") return q.group === "apt" && q.sub === sub;
      return false;
    });
  }
  function mixPools() {
    return {
      a: bank.filter(function (q) { return q.group === "iti"; }),
      b: bank.filter(function (q) { return q.group === "sci" || q.group === "gs"; })
    };
  }
  function feas(n, A, B) { var h = Math.floor(n / 2); return h <= A && n - h <= B; }
  function feasible(n, cfg) {
    cfg = cfg || S;
    if (cfg.main === "iti" && cfg.sub === "elec") return false;
    if (cfg.main === "mix") { var m = mixPools(); return feas(n, m.a.length, m.b.length); }
    return n <= poolFor(cfg.main, cfg.sub).length;
  }
  function availFor(main, sub) {
    if (main === "mix") {
      var m = mixPools();
      for (var n = m.a.length + m.b.length; n > 0; n--) if (feas(n, m.a.length, m.b.length)) return n;
      return 0;
    }
    return poolFor(main, sub).length;
  }
  function maxAvail() { return availFor(S.main, S.sub); }
  function pick(cfg) {
    cfg = cfg || S; var n = cfg.count;
    if (cfg.main === "mix") {
      var m = mixPools(), h = Math.floor(n / 2);
      return shuffle(shuffle(m.a).slice(0, h).concat(shuffle(m.b).slice(0, n - h)));
    }
    return shuffle(poolFor(cfg.main, cfg.sub)).slice(0, n);
  }
  function prep(q) {
    return { id: q.id, q: q.q, tag: (TAGS[q.sub] || "") + (q.mod && modName(q.sub, q.mod) ? " · " + modName(q.sub, q.mod) : ""), o: shuffle(q.opts.map(function (t, i) { return { t: t, ok: i === q.ans }; })) };
  }
  function ensureCount() {
    if (bankState !== "ok" || feasible(S.count)) return;
    var i, c;
    for (i = COUNTS.length - 1; i >= 0; i--) { c = COUNTS[i]; if (c <= S.count && feasible(c)) { S.count = c; return; } }
    for (i = 0; i < COUNTS.length; i++) if (feasible(COUNTS[i])) { S.count = COUNTS[i]; return; }
  }
  function catLabel() {
    var m = MAIN_NAMES[S.main] || S.main;
    var ep = elecParts(S.main, S.sub);
    if (ep) return "ITI ELEC" + (ep.yr ? " · " + ELEC[ep.yr].name.replace(" Year", " Yr") + " · " + (ep.mod ? modName(ep.yr, ep.mod) : "Trade Test") : "");
    var s = SUBS[S.main].filter(function (x) { return x[0] === S.sub; })[0];
    return S.main === "mix" ? m + " · GS + ITI" : m + " · " + (s ? s[1] : "");
  }

  /* ---------- daily streak ---------- */
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function readStreak() {
    try { var s = JSON.parse(ls(LS.streak)); if (s && s.d) return s; } catch (e) { }
    return { d: "", n: 0, best: 0 };
  }
  function liveStreak() {
    var s = readStreak(), t = new Date(), y = new Date(); y.setDate(y.getDate() - 1);
    return (s.d === ymd(t) || s.d === ymd(y)) ? s.n : 0;
  }
  function bumpStreak() {
    var s = readStreak(), t = ymd(new Date()), y = new Date(); y.setDate(y.getDate() - 1);
    if (s.d === t) return s;
    s.n = s.d === ymd(y) ? s.n + 1 : 1; s.d = t; s.best = Math.max(s.best || 0, s.n);
    lsSet(LS.streak, JSON.stringify(s)); return s;
  }

  /* ---------- styles (Redesigned v2.0: Obsidian & Molten-Orange Glassmorphism · Dark + Bright Mode) ---------- */
  function injectCss() {
    if (document.getElementById("qa-style")) return;
    var st = document.createElement("style"); st.id = "qa-style";
    st.textContent = `
/* ===== Design Tokens (Dark default + Bright mode) ===== */
#quiz-arena-root {
  --qa-tx: #f8fafc;
  --qa-t2: #94a3b8;
  --qa-t3: #cbd5e1;
  --qa-cd: rgba(11, 16, 30, 0.58);
  --qa-cd2: rgba(255, 255, 255, 0.055);
  --qa-cd3: rgba(255, 255, 255, 0.09);
  --qa-bd: rgba(148, 163, 184, 0.22);
  --qa-bd2: rgba(255, 255, 255, 0.10);
  --qa-ac: #fb923c;
  --qa-ac2: #fbbf24;
  --qa-ac-ink: #fed7aa;
  --qa-on: rgba(249, 115, 22, 0.18);
  --qa-onb: rgba(251, 146, 60, 0.68);
  --qa-sh: 0 18px 40px -16px rgba(0, 0, 0, 0.68), 0 1px 0 0 rgba(255, 255, 255, 0.09) inset;
  --qa-okb: rgba(16, 185, 129, 0.18);
  --qa-okc: #34d399;
  --qa-bdb: rgba(244, 63, 94, 0.18);
  --qa-bdc: #fb7185;
  --tga: #f97316; --tga2: #fbbf24;
  --tgb: #22d3ee; --tgb2: #0284c7;
  --tgat: #fbbf24; --tgbt: #38bdf8;
  --tgtr: rgba(148, 163, 184, 0.18);
  color: var(--qa-tx);
}
html.bright-mode #quiz-arena-root {
  --qa-tx: #0f172a;
  --qa-t2: #475569;
  --qa-t3: #334155;
  --qa-cd: rgba(255, 255, 255, 0.66);
  --qa-cd2: rgba(255, 255, 255, 0.72);
  --qa-cd3: rgba(255, 255, 255, 0.92);
  --qa-bd: rgba(148, 163, 184, 0.36);
  --qa-bd2: rgba(255, 255, 255, 0.85);
  --qa-ac: #ea580c;
  --qa-ac2: #d97706;
  --qa-ac-ink: #9a3412;
  --qa-on: rgba(249, 115, 22, 0.13);
  --qa-onb: rgba(234, 88, 12, 0.58);
  --qa-sh: 0 16px 36px -14px rgba(15, 23, 42, 0.16), 0 1px 0 0 rgba(255, 255, 255, 0.92) inset;
  --qa-okb: #d1fae5; --qa-okc: #059669;
  --qa-bdb: #ffe4e6; --qa-bdc: #e11d48;
  --tgat: #c2410c; --tgbt: #0369a1;
  --tgtr: rgba(100, 116, 139, 0.18);
}

#quiz-arena-root * { box-sizing: border-box; }
#quiz-arena-root button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
#quiz-arena-root button:disabled { cursor: not-allowed; }
.qa-wrap, .qa-setup-shell { max-width: 30rem; margin: 0 auto; }
.qa-t2 { color: var(--qa-t2); }
.qa-ac { color: var(--qa-ac); }
.qa-i { width: 16px; height: 16px; flex: none; }

/* ===== Glass Surfaces ===== */
.qa-glass {
  position: relative;
  background:
    radial-gradient(120% 85% at 100% 0%, rgba(249, 115, 22, 0.11), transparent 58%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01) 48%),
    var(--qa-cd);
  border: 1px solid var(--qa-bd);
  box-shadow: var(--qa-sh);
  -webkit-backdrop-filter: blur(20px) saturate(1.55);
  backdrop-filter: blur(20px) saturate(1.55);
  border-radius: 1.35rem;
}
html.bright-mode .qa-glass {
  background:
    radial-gradient(120% 85% at 100% 0%, rgba(249, 115, 22, 0.09), transparent 58%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.35) 55%),
    var(--qa-cd);
}
html.no-glass .qa-glass { -webkit-backdrop-filter: none; backdrop-filter: none; background: #0f172a; }
html.no-glass.bright-mode .qa-glass { background: #ffffff; }

.qa-inner {
  background: var(--qa-cd2);
  border: 1px solid var(--qa-bd);
  border-radius: 1rem;
  box-shadow: 0 1px 0 var(--qa-bd2) inset;
}

/* ===== Hero Header (Setup) ===== */
.qa-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.35rem;
  padding: 15px 15px 13px;
  color: #fff;
  border: 1px solid rgba(251, 146, 60, 0.32);
  background:
    radial-gradient(115% 110% at 96% -15%, rgba(249, 115, 22, 0.48), transparent 56%),
    radial-gradient(80% 90% at -10% 115%, rgba(251, 191, 36, 0.25), transparent 55%),
    linear-gradient(155deg, #161110 0%, #0b1020 62%, #070a14 100%);
  box-shadow: 0 18px 36px -16px rgba(0, 0, 0, 0.72), 0 1px 0 rgba(255, 255, 255, 0.14) inset;
  margin-bottom: 10px;
}
.qa-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(circle at 80% 25%, #000, transparent 78%);
  -webkit-mask-image: radial-gradient(circle at 80% 25%, #000, transparent 78%);
}
.qa-hero-row { position: relative; z-index: 2; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.qa-hero-kick {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; color: #fdba74;
}
.qa-hero-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #fb923c;
  box-shadow: 0 0 8px #f97316;
  animation: qaPulseDot 2.2s ease-in-out infinite;
}
@keyframes qaPulseDot { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
.qa-hero-title {
  margin-top: 3px; font-size: 26px; line-height: 1.02; font-weight: 900; letter-spacing: .02em; color: #fff;
}
.qa-hero-title span {
  background: linear-gradient(95deg, #fde68a, #fb923c 55%, #f97316);
  -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
}
.qa-hero-sub { margin-top: 4px; font-size: 11px; font-weight: 600; color: #cbd5e1; }
.qa-hero-acts { display: flex; align-items: center; gap: 6px; flex: none; }
.qa-streak-pill {
  display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px;
  font-size: 11.5px; font-weight: 800; color: #fde68a;
  background: rgba(249, 115, 22, 0.22); border: 1px solid rgba(251, 146, 60, 0.55);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.qa-streak-pill.cold { color: #cbd5e1; background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.18); }
.qa-admin-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 5px 9px; border-radius: 999px;
  font-size: 11px; font-weight: 800; color: #fff;
  background: rgba(255, 255, 255, 0.11); border: 1px solid rgba(255, 255, 255, 0.22);
  transition: background .2s ease;
}
.qa-admin-btn:hover { background: rgba(255, 255, 255, 0.18); }
.qa-hero-meta {
  position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(255, 255, 255, 0.11);
  font-size: 10.5px; font-weight: 700; color: #cbd5e1;
}
.qa-hero-meta b { color: #fbbf24; font-weight: 800; }

/* ===== Labels & Inputs ===== */
.qa-lbl-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.qa-lbl { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--qa-t2); }
.qa-lbl-hint { font-size: 10px; font-weight: 700; color: var(--qa-ac); }

.qa-in {
  width: 100%; padding: .5rem .8rem; border-radius: .85rem; font-size: 13px; font-weight: 700;
  color: var(--qa-tx); background: var(--qa-cd2); border: 1.5px solid var(--qa-bd); outline: none;
  transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
}
.qa-in::placeholder { color: var(--qa-t2); font-weight: 600; opacity: .75; }
.qa-in:focus { border-color: var(--qa-ac); background: var(--qa-cd3); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.16); }
textarea.qa-in { resize: vertical; line-height: 1.45; }

.qa-name-wrap {
  display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: .9rem;
  background: var(--qa-cd2); border: 1.5px solid var(--qa-bd);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.qa-name-wrap:focus-within { border-color: var(--qa-ac); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14); }
.qa-name-ic { color: var(--qa-ac); flex: none; display: grid; place-items: center; }
.qa-name-wrap input {
  flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
  font-size: 13px; font-weight: 700; color: var(--qa-tx); padding: 4px 0;
}

/* ===== Segmented Mode Switcher & Sliding Indicator ===== */
.qa-slide { position: relative; }
.qa-slide > .qa-seg, .qa-slide > .qa-pill { position: relative; z-index: 1; }
.qa-slide > .qa-seg.on, .qa-slide > .qa-pill.on {
  background: transparent !important; border-color: transparent !important; box-shadow: none !important;
}
.qa-ind {
  position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 0; pointer-events: none;
  border-radius: .78rem;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.28), rgba(251, 191, 36, 0.14));
  border: 1px solid var(--qa-onb);
  box-shadow: 0 4px 14px -6px rgba(249, 115, 22, 0.55);
  opacity: 0;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), width .3s cubic-bezier(.22, 1, .36, 1), height .3s cubic-bezier(.22, 1, .36, 1), opacity .18s ease;
}
html.bright-mode .qa-ind {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.12));
  box-shadow: 0 4px 12px -6px rgba(234, 88, 12, 0.32);
}

.qa-inner[role=tablist] { padding: 4px; border-radius: 1rem; gap: 4px; }
.qa-seg {
  min-height: 38px; padding: .42rem .6rem; border-radius: .78rem;
  font-size: 12.5px; font-weight: 800; color: var(--qa-t2);
  border: 1px solid transparent; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: color .2s ease;
}
.qa-seg.on { color: var(--qa-ac-ink); }
.qa-seg .qa-mini {
  font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 999px;
  background: rgba(249, 115, 22, 0.16); border: 1px solid rgba(249, 115, 22, 0.4); color: var(--qa-ac);
}

/* ===== Live Battle Sub-Panel ===== */
.qa-mp-box { padding: 10px; display: flex; flex-direction: column; gap: 9px; }
.qa-join-bar { display: flex; gap: 7px; }
.qa-code-in {
  width: 6.2rem !important; flex: none; text-align: center; letter-spacing: .26em;
  font-weight: 900 !important; padding-left: .95rem !important; font-variant-numeric: tabular-nums;
}
.qa-btypes { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.qa-bt {
  display: flex; align-items: center; gap: 8px; padding: 8px 9px; border-radius: .85rem;
  background: var(--qa-cd2); border: 1.5px solid var(--qa-bd); text-align: left;
  transition: border-color .2s ease, background-color .2s ease;
}
.qa-bt.on { border-color: var(--qa-onb); background: var(--qa-on); }
.qa-bt-ic {
  width: 28px; height: 28px; border-radius: .65rem; flex: none; display: grid; place-items: center;
  background: rgba(249, 115, 22, 0.14); color: var(--qa-ac);
}
.qa-bt.on .qa-bt-ic { background: var(--qa-ac); color: #fff; }
.qa-bt-t { display: block; font-size: 11.5px; font-weight: 800; line-height: 1.15; }
.qa-bt-s { display: block; font-size: 9.5px; font-weight: 600; color: var(--qa-t2); margin-top: 1px; }
.qa-tug-hint {
  font-size: 11px; line-height: 1.4; font-weight: 600; color: var(--qa-t2);
  padding: 7px 10px; border-radius: .75rem;
  background: linear-gradient(90deg, rgba(249, 115, 22, 0.1), rgba(34, 211, 238, 0.08));
  border: 1px solid rgba(249, 115, 22, 0.25);
}

/* ===== Topic Pills & Count Grid ===== */
.qa-pill {
  min-height: 31px; padding: .3rem .65rem; border-radius: .75rem;
  font-size: 11.5px; font-weight: 700; color: var(--qa-tx);
  background: var(--qa-cd2); border: 1px solid var(--qa-bd);
  transition: border-color .18s ease, background-color .18s ease, color .18s ease;
  white-space: nowrap;
}
.qa-pill:hover:not(:disabled) { border-color: var(--qa-onb); }
.qa-pill.on { background: var(--qa-on); border-color: var(--qa-onb); color: var(--qa-ac-ink); }
.qa-pill:disabled { opacity: .36; text-decoration: line-through; }
.qa-lock .qa-pill:disabled { text-decoration: none; opacity: .38; }

.qa-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.qa-row::-webkit-scrollbar { display: none; }
.qa-wrapRow { display: flex; flex-wrap: wrap; gap: 5px; }

.qa-cmp .qa-pill {
  flex: 1 1 auto; justify-content: center; display: inline-flex; align-items: center; gap: 5px;
  min-height: 30px; padding: 4px 5px 4px 10px; font-size: 11px; font-weight: 700;
  color: var(--qa-t3); background: var(--qa-cd2); border: 1px solid var(--qa-bd);
}
.qa-cmp .qa-pill:not(:has(.qa-n)) { padding-right: 10px; }
.qa-cmp .qa-pill .qa-n {
  min-width: 1.5rem; height: 1.2rem; padding: 0 5px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--qa-ac); background: rgba(249, 115, 22, 0.12); border: 1px solid rgba(249, 115, 22, 0.3);
}
.qa-cmp .qa-pill.on {
  color: var(--qa-ac-ink);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.24), rgba(251, 191, 36, 0.1));
  border-color: var(--qa-onb);
}
.qa-cmp .qa-pill.on .qa-n { color: #fff; background: #ea580c; border-color: #ea580c; }
.qa-cmp .qa-pill .qa-i { width: 12px; height: 12px; }
.qa-sub { display: inline-block; max-width: 9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .82; font-weight: 600; }

/* Smooth expandable ITI ELEC drawer */
.qa-xp {
  flex: 0 0 100%; width: 100%; display: grid; grid-template-rows: 0fr; opacity: 0; margin: -2px 0;
  transition: grid-template-rows .3s cubic-bezier(.22, 1, .36, 1), opacity .24s ease, margin .3s cubic-bezier(.22, 1, .36, 1);
}
.qa-xp.open { grid-template-rows: 1fr; opacity: 1; margin: 4px 0; }
.qa-xpi { overflow: hidden; min-height: 0; }
.qa-xpbox {
  padding: 10px; border-radius: .95rem;
  background: linear-gradient(180deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.02)), var(--qa-cd2);
  border: 1px solid rgba(249, 115, 22, 0.32);
}

/* Question count 5-col bar */
.qa-cnt { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; padding: 3px; border-radius: .95rem; background: var(--qa-cd2); border: 1px solid var(--qa-bd); }
.qa-cnt .qa-pill { min-height: 32px; padding: 0; text-align: center; font-size: 12.5px; font-weight: 800; border-color: transparent; background: transparent; color: var(--qa-t2); }
.qa-cnt .qa-pill.on { color: var(--qa-ac-ink); }

/* ===== Primary & Secondary Buttons ===== */
.qa-cta {
  position: relative; overflow: hidden; width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: .82rem 1rem; border-radius: 1rem; font-weight: 900; font-size: 14px; letter-spacing: .01em;
  color: #fff !important;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 55%, #d97706 100%);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: 0 12px 24px -10px rgba(234, 88, 12, 0.72), 0 1px 0 rgba(255, 255, 255, 0.32) inset;
  transition: transform .15s ease, filter .2s ease;
}
.qa-cta::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 34%; left: -45%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.34), transparent);
  transform: skewX(-18deg); pointer-events: none;
  animation: qaSheen 3.4s ease-in-out infinite;
}
@keyframes qaSheen { 0%, 62% { left: -45%; } 100% { left: 130%; } }
.qa-cta:hover:not(:disabled) { filter: brightness(1.05); }
.qa-cta:active:not(:disabled) { transform: scale(.985); }
.qa-cta:disabled { opacity: .45; box-shadow: none; }
.qa-cta:disabled::after { display: none; }

.qa-sec {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: .68rem .9rem; border-radius: .95rem; font-weight: 800; font-size: 12.5px;
  color: var(--qa-tx); background: var(--qa-cd2); border: 1px solid var(--qa-bd);
  transition: border-color .2s ease, background-color .2s ease;
}
.qa-sec:hover:not(:disabled) { border-color: var(--qa-onb); background: var(--qa-cd3); }

/* ===== Gameplay HUD & Cards ===== */
.qa-hud { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.qa-hud-mid { display: flex; align-items: center; gap: 6px; }
.qa-ic {
  width: 36px; height: 36px; border-radius: .85rem; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--qa-cd2); border: 1px solid var(--qa-bd);
  transition: border-color .2s ease, background-color .2s ease;
}
.qa-ic:hover { border-color: var(--qa-onb); background: var(--qa-cd3); }

.qa-chip {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 999px;
  font-weight: 800; font-size: 12px; font-variant-numeric: tabular-nums;
  background: var(--qa-cd2); border: 1px solid var(--qa-bd);
}
.qa-chip.amb { color: var(--qa-ac-ink); border-color: var(--qa-onb); background: var(--qa-on); }
.qa-chip.combo { color: #fbbf24; border-color: rgba(251, 191, 36, 0.55); background: rgba(251, 191, 36, 0.14); }
html.bright-mode .qa-chip.combo { color: #b45309; background: #fef3c7; }
.qa-chip.low { color: var(--qa-bdc); border-color: var(--qa-bdc); background: var(--qa-bdb); animation: qaLowPulse 1s ease-in-out infinite; }
@keyframes qaLowPulse { 0%,100% { opacity: 1; } 50% { opacity: .7; } }

.qa-prog-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--qa-t2); margin-top: 12px; }
.qa-prog-meta b { color: var(--qa-tx); }
.qa-track { height: 7px; border-radius: 999px; background: var(--qa-cd2); border: 1px solid var(--qa-bd); overflow: hidden; margin-top: 5px; }
.qa-fill {
  height: 100%; width: 0; border-radius: 999px;
  background: linear-gradient(90deg, #ea580c, #f97316 55%, #fbbf24);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.55);
  transition: width .3s cubic-bezier(.22, 1, .36, 1);
}

.qa-nosel { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.qa-card {
  position: relative; margin-top: 11px; padding: 18px 16px; min-height: 108px; overflow: hidden;
  border-top: 2px solid rgba(249, 115, 22, 0.55);
}
.qa-card-in { animation: qaSlideIn .28s cubic-bezier(.22, 1, .36, 1) both; }
@keyframes qaSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.qa-qtag {
  display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase;
  color: var(--qa-ac); background: var(--qa-on); border: 1px solid rgba(249, 115, 22, 0.3);
}
.qa-q { margin: 10px 0 0; font-size: 16px; font-weight: 700; line-height: 1.48; color: var(--qa-tx); }

.qa-pop {
  position: absolute; right: 14px; top: 14px; font-weight: 900; font-size: 13px;
  opacity: 0; color: var(--qa-okc); pointer-events: none; z-index: 4;
}
.qa-pop.bad { color: var(--qa-bdc); }
.qa-pop.go { animation: qapop .68s cubic-bezier(.22, 1, .36, 1); }
@keyframes qapop { 0% { opacity: 0; transform: translateY(6px); } 22% { opacity: 1; } 100% { opacity: 0; transform: translateY(-12px); } }

.qa-opts { display: grid; gap: 9px; margin-top: 11px; }
.qa-opt {
  display: flex; align-items: center; gap: 11px; width: 100%; padding: 12px 13px; border-radius: 1rem;
  text-align: left; font-size: 14px; font-weight: 600; line-height: 1.35;
  background: var(--qa-cd); border: 1.5px solid var(--qa-bd); box-shadow: var(--qa-sh);
  -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4);
  transition: border-color .16s ease, background-color .16s ease, transform .14s ease;
}
.qa-opt:hover:not(:disabled) { border-color: var(--qa-onb); background: var(--qa-cd3); }
.qa-opt:active:not(:disabled) { transform: scale(.99); }
.qa-let {
  flex: none; width: 30px; height: 30px; border-radius: .65rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; color: var(--qa-ac);
  background: var(--qa-on); border: 1px solid rgba(249, 115, 22, 0.35);
  transition: background-color .16s ease, color .16s ease, border-color .16s ease;
}
.qa-opt.qa-ok { background: var(--qa-okb) !important; border-color: var(--qa-okc) !important; }
.qa-opt.qa-ok .qa-let { background: var(--qa-okc); border-color: var(--qa-okc); color: #fff; font-size: 14px; }
.qa-opt.qa-bad { background: var(--qa-bdb) !important; border-color: var(--qa-bdc) !important; }
.qa-opt.qa-bad .qa-let { background: var(--qa-bdc); border-color: var(--qa-bdc); color: #fff; font-size: 14px; }
.qa-opt.qa-dim { opacity: .55; }

.qa-bump { animation: qabump .24s ease; }
@keyframes qabump { 50% { transform: scale(1.08); } }

/* ===== Live Multiplayer Rank Strip & Lobby ===== */
.qa-rank {
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px;
  margin-top: 10px; padding: 7px 11px; font-size: 11.5px; font-weight: 700; border-radius: .95rem;
}
.qa-rk { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.qa-rk.me { color: var(--qa-ac); font-weight: 800; }
.qa-rn { display: inline-block; max-width: 6.5rem; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; }

.qa-code-tiles { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
.qa-code-d {
  width: 50px; height: 62px; border-radius: 14px; display: grid; place-items: center;
  font-size: 30px; font-weight: 900; font-variant-numeric: tabular-nums;
  color: var(--qa-ac); background: var(--qa-cd2); border: 1.5px solid var(--qa-onb);
  box-shadow: 0 8px 22px -10px rgba(249, 115, 22, 0.55), 0 1px 0 var(--qa-bd2) inset;
}
.qa-slot { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 1rem; }
.qa-empty { border: 1.5px dashed var(--qa-bd); background: transparent; }
.qa-host-pill {
  font-size: 9.5px; font-weight: 900; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #ea580c); color: #fff;
}
.qa-dots { display: inline-flex; gap: 4px; margin-left: 5px; vertical-align: middle; }
.qa-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--qa-t2); animation: qaDot 1.2s ease-in-out infinite; }
.qa-dots i:nth-child(2) { animation-delay: .18s; }
.qa-dots i:nth-child(3) { animation-delay: .36s; }
@keyframes qaDot { 0%,100% { opacity: .25; } 50% { opacity: 1; } }

/* ===== Countdown ===== */
.qa-cd-wrap { padding: 14vh 0 6vh; text-align: center; }
.qa-cd-ring {
  position: relative; width: 144px; height: 144px; margin: 18px auto 0;
  border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.24), transparent 70%);
  border: 2px solid var(--qa-onb);
  box-shadow: 0 0 40px -6px rgba(249, 115, 22, 0.65);
}
.qa-cd-num {
  font-size: 72px; line-height: 1; font-weight: 900;
  background: linear-gradient(180deg, #fde68a, #fb923c 60%, #ea580c);
  -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
}

/* ===== Solo Result & Live SVG Gauge ===== */
.qa-res-hero {
  position: relative; overflow: hidden; padding: 20px 16px 18px; text-align: center;
  border-top: 2px solid rgba(249, 115, 22, 0.6);
}
.qa-gauge { position: relative; width: 136px; height: 136px; margin: 12px auto 6px; }
.qa-gauge svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.qa-gauge-bg { fill: none; stroke: var(--qa-bd); stroke-width: 10; opacity: .45; }
.qa-gauge-fg {
  fill: none; stroke: url(#qaGaugeGrad); stroke-width: 10; stroke-linecap: round;
  transition: stroke-dashoffset .9s cubic-bezier(.22, 1, .36, 1);
}
.qa-gauge-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.qa-gauge-pct { font-size: 32px; line-height: 1; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--qa-tx); }
.qa-gauge-lbl { font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--qa-t2); margin-top: 3px; }
.qa-big {
  font-size: 2.5rem; line-height: 1.05; font-weight: 900; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fbbf24, #f97316 55%, #ea580c);
  -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
}
.qa-stat { padding: 11px 6px; text-align: center; }
.qa-stat b { display: block; font-size: 16px; font-weight: 900; font-variant-numeric: tabular-nums; }
.qa-stat span { display: block; font-size: 10px; color: var(--qa-t2); font-weight: 700; margin-top: 2px; }

/* Review answers */
.qa-rev-item { padding: 11px 12px; border-radius: .95rem; background: var(--qa-cd2); border: 1px solid var(--qa-bd); }
.qa-rv { display: grid; gap: 8px; margin-top: 10px; }
.qa-rv-q { font-size: 13px; font-weight: 700; line-height: 1.4; margin: 6px 0 7px; }
.qa-rv-a { display: flex; align-items: flex-start; gap: 7px; padding: 6px 9px; border-radius: .7rem; font-size: 12px; font-weight: 600; line-height: 1.35; border: 1px solid var(--qa-bd); }
.qa-rv-a + .qa-rv-a { margin-top: 5px; }
.qa-rv-a b { flex: none; font-weight: 900; }
.qa-rv-a.ok { background: var(--qa-okb); border-color: var(--qa-okc); } .qa-rv-a.ok b { color: var(--qa-okc); }
.qa-rv-a.bad { background: var(--qa-bdb); border-color: var(--qa-bdc); } .qa-rv-a.bad b { color: var(--qa-bdc); }
.qa-rv-a.skip { color: var(--qa-t2); }
.qa-chev { transition: transform .22s ease; } .qa-open .qa-chev { transform: rotate(180deg); }

/* ===== Multiplayer Podium ===== */
.qa-pod { display: flex; align-items: flex-end; justify-content: center; gap: 8px; margin-top: 16px; padding: 0 4px; }
.qa-pcol { flex: 1; min-width: 0; text-align: center; animation: qaPodRise .45s cubic-bezier(.22, 1, .36, 1) both; }
.qa-pcol:nth-child(2) { animation-delay: .06s; }
.qa-pcol:nth-child(3) { animation-delay: .12s; }
@keyframes qaPodRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.qa-pcrown { font-size: 20px; line-height: 1; margin-bottom: 2px; }
.qa-pn { font-size: 12px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa-ps { font-size: 18px; font-weight: 900; color: var(--qa-ac); margin: 1px 0 5px; font-variant-numeric: tabular-nums; }
.qa-pbar {
  display: flex; align-items: flex-start; justify-content: center; padding-top: 8px;
  border-radius: 1rem 1rem 0 0; font-size: 30px; font-weight: 900; color: #1c1100;
  border-top: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 -6px 20px -8px rgba(0, 0, 0, 0.35);
}
.qa-pbar.r0 { background: linear-gradient(180deg, #fef08a, #f59e0b 65%, #d97706); }
.qa-pbar.r1 { background: linear-gradient(180deg, #f1f5f9, #cbd5e1 65%, #94a3b8); }
.qa-pbar.r2 { background: linear-gradient(180deg, #fed7aa, #ea580c 75%, #c2410c); }

/* ===== 1v1 High-Voltage Tug of War ===== */
.qa-tug { margin-top: 10px; padding: 12px 13px 13px; border-top: 2px solid rgba(249, 115, 22, 0.5); }
.qa-tug-h { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; }
.qa-te { min-width: 0; flex: 1; padding: 6px 9px; border-radius: .85rem; border: 1px solid transparent; background: var(--qa-cd2); transition: border-color .25s ease, box-shadow .25s ease; }
.qa-te.r { text-align: right; }
.qa-tn { font-size: 11.5px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa-tp { font-size: 25px; line-height: 1.08; font-weight: 900; font-variant-numeric: tabular-nums; }
.qa-te.l .qa-tn, .qa-te.l .qa-tp { color: var(--tgat); }
.qa-te.r .qa-tn, .qa-te.r .qa-tp { color: var(--tgbt); }
.qa-tsub { font-size: 10px; font-weight: 800; color: var(--qa-t2); min-height: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.qa-beamw { position: relative; padding: 8px 16px; margin-top: 6px; }
.qa-beam {
  position: relative; height: 22px; border-radius: 999px; overflow: hidden;
  background: var(--tgtr); border: 1px solid var(--qa-bd);
  box-shadow: 0 0 18px -5px rgba(249, 115, 22, 0.45), 0 0 18px -5px rgba(34, 211, 238, 0.45);
}
.qa-bl, .qa-br { position: absolute; top: 0; bottom: 0; transition: width .52s cubic-bezier(.22, 1, .36, 1); }
.qa-bl { left: 0; background: linear-gradient(90deg, var(--tga), var(--tga2)); }
.qa-br { right: 0; background: linear-gradient(270deg, var(--tgb2), var(--tgb)); }
.qa-bl::after, .qa-br::after {
  content: ""; position: absolute; inset: 0;
  background: repeating-linear-gradient(110deg, transparent 0 10px, rgba(255, 255, 255, 0.28) 10px 14px, transparent 14px 24px);
  background-size: 48px 100%; animation: qaFlow 1s linear infinite;
}
.qa-br::after { animation-direction: reverse; }
@keyframes qaFlow { to { background-position: 48px 0; } }
.qa-mk { position: absolute; top: 4px; bottom: 4px; width: 1.5px; background: rgba(255, 255, 255, 0.45); z-index: 1; }
.qa-lane { position: absolute; left: 16px; right: 16px; top: 0; bottom: 0; pointer-events: none; }
.qa-core {
  position: absolute; top: 50%; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; z-index: 2;
  background: radial-gradient(circle, #fff 0 20%, #fef3c7 34%, rgba(249, 115, 22, 0.92) 52%, rgba(34, 211, 238, 0.85) 75%, transparent 100%);
  box-shadow: 0 0 12px 3px rgba(255, 255, 255, 0.9), 0 0 26px 8px rgba(249, 115, 22, 0.55), 0 0 34px 10px rgba(34, 211, 238, 0.45);
  transition: left .52s cubic-bezier(.22, 1, .36, 1);
  animation: qaSpark .55s ease-in-out infinite alternate;
}
@keyframes qaSpark { from { transform: scale(.9); } to { transform: scale(1.12); } }
.qa-core::before, .qa-core::after {
  content: ""; position: absolute; left: 50%; top: 50%; width: 46px; height: 2px; margin: -1px 0 0 -23px;
  background: linear-gradient(90deg, transparent, #fff, transparent); transform: rotate(35deg);
  animation: qaZap .35s steps(2) infinite;
}
.qa-core::after { transform: rotate(-35deg); animation-delay: .17s; }
@keyframes qaZap { 0% { opacity: 1; } 50% { opacity: .15; } 100% { opacity: .9; } }
.qa-tug.crit-l .qa-te.l, .qa-tug.crit-r .qa-te.r { border-color: var(--qa-bdc); animation: qaCrit .9s ease-in-out infinite; }
@keyframes qaCrit { 0%,100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } 50% { box-shadow: 0 0 16px 2px rgba(239, 68, 68, 0.48); } }
.qa-tt { height: 5px; border-radius: 99px; background: var(--qa-cd2); border: 1px solid var(--qa-bd); overflow: hidden; margin-top: 9px; }
.qa-tt > i { display: block; height: 100%; width: 100%; border-radius: 99px; background: linear-gradient(90deg, #f97316, #fbbf24); transition: width .2s linear; }
.qa-tt.low > i { background: linear-gradient(90deg, #e11d48, var(--qa-bdc)); }
.qa-shake { animation: qaShake .4s cubic-bezier(.36, .07, .19, .97); }
@keyframes qaShake { 10%,90% { transform: translateX(-1px); } 20%,80% { transform: translateX(2px); } 30%,50%,70% { transform: translateX(-3px); } 40%,60% { transform: translateX(3px); } }
.qa-fl { text-align: center; padding: 16px 6px; animation: qaSlideIn .28s both; }
.qa-fl b { display: block; font-size: 24px; line-height: 1.15; font-weight: 900; }
.qa-fl span { display: block; margin-top: 5px; font-size: 12px; font-weight: 700; color: var(--qa-t2); }
.qa-fl.me b { color: var(--tgat); } .qa-fl.opp b { color: var(--tgbt); } .qa-fl.blk b { color: var(--qa-bdc); }
.qa-vs { font-size: 2.6rem; line-height: 1; font-weight: 900; font-variant-numeric: tabular-nums; }
.qa-vs .a { color: var(--tgat); } .qa-vs .b { color: var(--tgbt); }
.qa-vs .v { font-size: .95rem; font-weight: 800; color: var(--qa-t2); margin: 0 9px; vertical-align: middle; }
.qa-win {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 15px; border-radius: 999px;
  font-weight: 900; font-size: 13px; color: #fff;
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 8px 18px -8px rgba(249, 115, 22, 0.78);
}
.qa-win.lose { color: var(--qa-tx); background: var(--qa-cd2); border: 1px solid var(--qa-bd); box-shadow: none; }

/* ===== Admin & Utility ===== */
.qa-id { font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: var(--qa-on); color: var(--qa-ac); }
.qa-ar { padding: 11px 12px; }
.qa-arq { margin-top: 6px; font-size: 13.5px; font-weight: 600; line-height: 1.38; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.qa-pre {
  margin: 8px 0; padding: 9px 10px; border-radius: .85rem; font-size: 11px; line-height: 1.5;
  white-space: pre-wrap; word-break: break-word; background: var(--qa-cd2); border: 1px solid var(--qa-bd);
  color: var(--qa-t2); font-family: ui-monospace, Menlo, monospace;
}
.qa-enter { animation: qaSlideIn .28s cubic-bezier(.22, 1, .36, 1) both; }
.qa-msg {
  position: fixed; left: 50%; bottom: calc(var(--nav-offset, 0px) + 6.2rem); transform: translate(-50%, 10px);
  max-width: 90%; padding: 8px 15px; border-radius: 999px; font-size: 12px; font-weight: 800;
  color: #fff; background: rgba(15, 23, 42, 0.92);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  border: 1px solid rgba(249, 115, 22, 0.5); box-shadow: 0 10px 26px -8px rgba(0, 0, 0, 0.55);
  opacity: 0; pointer-events: none; transition: opacity .22s ease, transform .22s ease; z-index: 70; text-align: center;
}
.qa-msg.on { opacity: 1; transform: translate(-50%, 0); }

@media (prefers-reduced-motion: reduce) {
  .qa-cta::after, .qa-hero-dot, .qa-pop.go, .qa-bump, .qa-card-in, .qa-pcol,
  .qa-core, .qa-core::before, .qa-core::after, .qa-bl::after, .qa-br::after,
  .qa-tug.crit-l .qa-te.l, .qa-tug.crit-r .qa-te.r, .qa-shake, .qa-fl, .qa-enter { animation: none !important; }
  .qa-ind, .qa-xp, .qa-fill, .qa-bl, .qa-br, .qa-core, .qa-tt > i, .qa-gauge-fg { transition: none !important; }
}
`;
    document.head.appendChild(st);
  }

  /* ---------- setup screen ---------- */
  function pill(a, k, label, on, dis) {
    return '<button type="button" class="qa-pill btn-tap' + (on ? " on" : "") + '" data-a="' + a + '" data-k="' + k + '" aria-pressed="' + (on ? "true" : "false") + '"' + (dis ? " disabled" : "") + ">" + label + "</button>";
  }

  var elecOpen = false, lastEp = null, xpState = { elec: false, mods: false };
  var IND = {}, lastDraw = null;

  function slideInd(box, key) {
    var ind = box && box.querySelector(".qa-ind"); if (!ind) return;
    var on = box.querySelector(".qa-seg.on,.qa-pill.on");
    if (!on) { ind.style.opacity = 0; delete IND[key]; return; }
    var r = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight }, p = IND[key];
    function put(q) { ind.style.width = q.w + "px"; ind.style.height = q.h + "px"; ind.style.transform = "translate(" + q.x + "px," + q.y + "px)"; }
    ind.style.opacity = 1; ind.style.transition = "none";
    put(p || r); void ind.offsetWidth; ind.style.transition = ""; put(r);
    IND[key] = r;
  }

  function elecPanel(ep, ready, wantM) {
    var h = '<div class="qa-xp' + (xpState.elec ? " open" : "") + '" data-xp="elec"><div class="qa-xpi"><div class="qa-xpbox">';
    h += '<div class="qa-lbl" style="margin-bottom:5px">Select Year</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      ["y1", "y2"].map(function (y) {
        var n = ready ? availFor("iti", y) : 0;
        return '<button type="button" class="qa-pill btn-tap text-center' + (ep.yr === y ? " on" : "") + '" style="padding:6px 0;justify-content:center" data-a="yr" data-k="' + y + '" aria-pressed="' + (ep.yr === y) + '">' + ELEC[y].name + '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
      }).join("") + "</div>";
    if (ep.yr && (wantM || xpState.mods)) {
      h += '<div class="qa-xp' + (xpState.mods ? " open" : "") + '" data-xp="mods"><div class="qa-xpi"><div style="padding-top:9px">';
      h += '<div class="qa-lbl" style="margin-bottom:5px">Module / Test Type</div><div class="qa-wrapRow qa-cmp">';
      h += '<button type="button" class="qa-pill btn-tap' + (!ep.mod ? " on" : "") + '" data-a="mod" data-k="" aria-pressed="' + !ep.mod + '">' + ico("shuffle") + " Trade Test · All" + '<span class="qa-n">' + (ready ? availFor("iti", ep.yr) : "…") + "</span></button>";
      ELEC[ep.yr].mods.forEach(function (m) {
        var n = ready ? availFor("iti", ep.yr + ":" + m[0]) : 0, on = ep.mod === m[0];
        h += '<button type="button" class="qa-pill btn-tap' + (on ? " on" : "") + '" data-a="mod" data-k="' + m[0] + '" aria-pressed="' + on + '"' + (ready && !n ? " disabled" : "") + ">" + esc(m[1]) + '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
      });
      h += '</div><div class="text-xs qa-t2" style="margin-top:6px">' + (ep.mod ? "Focused drill from this module only." : "Trade Test draws questions across all " + ELEC[ep.yr].name + " modules.") + "</div></div></div></div>";
    }
    return h + "</div></div></div>";
  }

  function syncXp(want) {
    ["elec", "mods"].forEach(function (id) {
      var el = view.querySelector('[data-xp="' + id + '"]');
      if (!el) { xpState[id] = false; return; }
      if (want[id] !== xpState[id]) {
        void el.offsetHeight;
        el.classList.toggle("open", want[id]);
        xpState[id] = want[id];
        if (!want[id]) setTimeout(function () { var e2 = view && view.querySelector('[data-xp="' + id + '"]'); if (e2 && !e2.classList.contains("open")) { if (e2.parentNode) e2.parentNode.removeChild(e2); } }, 340);
      }
    });
  }

  function renderSetup() {
    if (view && !view.querySelector(".qa-setup")) { elecOpen = false; xpState = { elec: false, mods: false }; IND = {}; lastDraw = null; }
    var topicKey = S.main + "|" + (elecParts(S.main, S.sub) ? "elec" : S.sub);
    var modeChg = !!lastDraw && lastDraw.mode !== S.mode;
    var enter = modeChg ? " qa-enter" : "";
    var ready = bankState === "ok", st = liveStreak(), multi = S.mode === "multi", tug = multi && S.battle === "tug", h = "";
    var canStart = ready && feasible(S.count);
    var estSec = S.count * (tug ? TUG_SEC : SEC_PER_Q);
    var estStr = estSec >= 60 ? ("~" + Math.round(estSec / 60) + " min") : ("~" + estSec + "s");

    h += '<div class="qa-setup-shell">';

    /* Hero Banner */
    h += '<div class="qa-hero">';
    h += '<div class="qa-hero-row">';
    h += '<div class="min-w-0"><div class="qa-hero-kick"><i class="qa-hero-dot"></i>ITI CONNECT ARENA</div>' +
      '<div class="qa-hero-title">QUIZ <span>&amp; CLASH</span></div>' +
      '<div class="qa-hero-sub">Speed Drills · Live Rooms · 1v1 High-Voltage</div></div>';
    h += '<div class="qa-hero-acts">' +
      '<div class="qa-streak-pill' + (st ? "" : " cold") + '" title="Daily streak">' + ico("flame") + "<span>" + st + "d</span></div>" +
      '<button type="button" class="admin-only' + (adminOn() ? "" : " hidden") + ' qa-admin-btn btn-tap" data-a="adopen" title="Manage questions">' + ico("settings-2") + "<span>Edit</span></button>" +
      "</div></div>";
    h += '<div class="qa-hero-meta">' +
      '<span>' + (ready ? ('<b>' + bank.length + '</b> verified questions ready') : (bankState === "error" ? 'Bank offline' : 'Loading question bank…')) + '</span>' +
      '<span>' + esc(catLabel()) + '</span></div>';
    h += "</div>";

    /* Main Setup Glass Card */
    h += '<div class="qa-glass qa-setup p-3.5 space-y-3">';

    /* Solo | Live Battle tabs */
    h += '<div class="qa-inner qa-slide grid grid-cols-2" role="tablist" aria-label="Quiz mode" data-slide="tabs"><span class="qa-ind" aria-hidden="true"></span>';
    h += '<button type="button" role="tab" aria-selected="' + !multi + '" class="qa-seg btn-tap' + (!multi ? " on" : "") + '" data-a="mode" data-k="solo">' + ico("user") + "<span>Solo Practice</span></button>";
    h += '<button type="button" role="tab" aria-selected="' + multi + '" class="qa-seg btn-tap' + (multi ? " on" : "") + '" data-a="mode" data-k="multi">' + ico("swords") + '<span>Live Battle</span><span class="qa-mini">2–4P</span></button>';
    h += "</div>";

    if (multi) {
      if (pendingCode) {
        h += '<div class="qa-inner p-2 flex items-center gap-2' + enter + '" style="border-color:var(--qa-onb)">';
        h += '<button type="button" class="qa-cta btn-tap flex-1" style="padding:.58rem .8rem;font-size:12.5px" data-a="joinlink">' + ico("log-in") + "Join Room " + pendingCode + "</button>";
        h += '<button type="button" class="qa-ic btn-tap shrink-0" data-a="dismissinv" aria-label="Dismiss invite">' + ico("x") + "</button></div>";
      }

      h += '<div class="qa-inner qa-mp-box' + enter + '">';
      /* Join existing code */
      h += '<div class="qa-join-bar"><input id="qa-code" class="qa-in qa-code-in" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="0000" value="' + esc(codeDraft || pendingCode || "") + '" aria-label="4-digit room code">';
      h += '<button type="button" class="qa-sec btn-tap flex-1" data-a="join">' + ico("log-in") + "Join Room Code</button></div>";

      /* Battle type visual cards */
      h += '<div><div class="qa-lbl" style="margin-bottom:5px">Battle Format</div><div class="qa-btypes" role="group" aria-label="Game type">' +
        '<button type="button" class="qa-bt btn-tap' + (!tug ? " on" : "") + '" data-a="btype" data-k="classic" aria-pressed="' + !tug + '">' +
        '<span class="qa-bt-ic">' + ico("swords") + '</span><span class="min-w-0"><span class="qa-bt-t">Classic Race</span><span class="qa-bt-s">2–4P · Speed score</span></span></button>' +
        '<button type="button" class="qa-bt btn-tap' + (tug ? " on" : "") + '" data-a="btype" data-k="tug" aria-pressed="' + tug + '">' +
        '<span class="qa-bt-ic">' + ico("zap") + '</span><span class="min-w-0"><span class="qa-bt-t">Power Clash</span><span class="qa-bt-s">1v1 · Tug of War</span></span></button>' +
        '</div></div>';

      /* Room size */
      h += '<div style="display:flex;flex-direction:column;gap:6px"><span class="qa-lbl">Room Size</span><div class="grid grid-cols-3 gap-1.5' + (tug ? " qa-lock" : "") + '">' +
        [2, 3, 4].map(function (n) {
          var on = tug ? n === 2 : S.players === n;
          return '<button type="button" class="qa-pill btn-tap text-center' + (on ? " on" : "") + '" style="padding:5px 0" data-a="players" data-k="' + n + '" aria-pressed="' + on + '"' + (tug && n !== 2 ? " disabled" : "") + '>' + n + " Players</button>";
        }).join("") + "</div></div>";

      if (tug) {
        h += '<div class="qa-tug-hint">⚡ <b>1v1 High-Voltage:</b> 10s synchronized rounds · faster correct answer pulls the plasma core · 3 streak triggers <b>×1.5 Overdrive</b>.</div>';
      }
      h += "</div>";
    }

    /* Player Name */
    h += '<div class="qa-name-wrap"><span class="qa-name-ic">' + ico("user-round") + '</span>' +
      '<input id="qa-name" type="text" maxlength="16" autocomplete="nickname" placeholder="Enter your display name…" value="' + esc(S.name) + '" aria-label="Display name"></div>';

    /* Topic Matrix */
    var ep = elecParts(S.main, S.sub); if (ep) lastEp = ep;
    var epr = ep || lastEp, wantE = !!(elecOpen && ep), wantM = !!(wantE && ep.yr);
    h += '<div><div class="qa-lbl-row"><span class="qa-lbl">Select Topic</span><span class="qa-lbl-hint">' + (ready ? maxAvail() + " Qs available" : "…") + '</span></div>' +
      '<div class="qa-wrapRow qa-cmp">' + TOPICS.map(function (t) {
        var n = ready ? availFor(t[0], t[1]) : 0, isE = t[1] === "elec" && t[0] === "iti", on = S.main === t[0] && (isE ? !!ep : S.sub === t[1]);
        var lbl = t[2];
        if (isE && ep && ep.yr) lbl += ' <span class="qa-sub">· ' + esc(ELEC[ep.yr].name.replace(" Year", " Yr")) + " · " + esc(ep.mod ? modName(ep.yr, ep.mod) : "Trade Test") + "</span>";
        var btn = '<button type="button" class="qa-pill btn-tap' + (on ? " on" : "") + '" data-a="topic" data-k="' + t[0] + "|" + t[1] + '" aria-pressed="' + on + '"' + (isE ? ' aria-expanded="' + wantE + '"' : "") + (ready && !n ? " disabled" : "") + ">" + lbl +
          '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
        if (isE && epr && (wantE || xpState.elec)) btn += elecPanel(epr, ready, wantM);
        return btn;
      }).join("") + "</div></div>";

    /* Question Count + Estimated Time */
    h += '<div><div class="qa-lbl-row"><span class="qa-lbl">Questions</span><span class="qa-lbl-hint">' + estStr + '</span></div>' +
      '<div class="qa-cnt qa-slide" data-slide="cnt"><span class="qa-ind" aria-hidden="true"></span>' +
      COUNTS.map(function (c) { return pill("count", c, c, S.count === c, !ready || !feasible(c)); }).join("") + "</div></div>";

    if (bankState === "error") {
      h += '<div class="qa-inner p-3 text-xs text-center">Couldn’t load the question bank. Check your connection, then retry.<button type="button" class="qa-sec btn-tap mt-2 w-full" data-a="retry">' + ico("rotate-ccw") + "Retry Loading</button></div>";
    }

    /* Primary CTA */
    h += '<button type="button" class="qa-cta btn-tap' + enter + '" data-a="' + (multi ? "create" : "start") + '"' + (canStart ? "" : " disabled") + ">" +
      ico(multi ? (tug ? "zap" : "plus") : "play") + (multi ? (tug ? "Launch 1v1 Power Clash" : "Create Battle Room") : "Start Solo Quiz (" + S.count + " Qs)") + "</button>";
    if (ready && !canStart && !(S.main === "iti" && S.sub === "elec")) {
      h += '<div class="text-xs qa-t2 text-center" style="margin-top:-4px">Not enough questions in this topic for ' + S.count + ' Qs.</div>';
    }
    h += "</div></div>";

    view.innerHTML = h; icons();
    syncXp({ elec: wantE, mods: wantM });
    slideInd(view.querySelector('[data-slide="tabs"]'), "tabs");
    slideInd(view.querySelector('[data-slide="cnt"]'), "cnt");
    lastDraw = { mode: S.mode, topic: topicKey, players: S.players };
  }

  /* ---------- gameplay ---------- */
  function startSolo() {
    if (bankState !== "ok" || !feasible(S.count)) return;
    var qs = pick(S).map(prep), total = qs.length * SEC_PER_Q * 1000, now = Date.now();
    G = { qs: qs, i: 0, score: 0, correct: 0, wrong: 0, combo: 0, bestCombo: 0, total: total, startT: now, endAt: now + total, qStart: now, locked: false, tick: 0, adv: 0, quitAt: 0, done: false, timeUp: false, log: [] };
    screen = "game"; sfx("click"); renderGame(); G.tick = setInterval(tick, 250);
  }
  function stopGame() { if (G) { clearInterval(G.tick); clearTimeout(G.adv); G.done = true; } }

  function renderGame() {
    var h = '<div class="qa-wrap">' +
      '<div class="qa-hud">' +
      '<button type="button" class="qa-ic btn-tap" data-a="quit" aria-label="Quit quiz">' + ico("x") + "</button>" +
      '<div class="qa-hud-mid">' +
      '<div class="qa-chip" id="qa-timechip">' + ico("clock") + '<span id="qa-time">' + fmt(G.total) + "</span></div>" +
      '<div class="qa-chip combo hidden" id="qa-combo">' + ico("flame") + '<span id="qa-combov">0</span></div>' +
      "</div>" +
      '<div class="qa-chip amb" id="qa-scorechip">' + ico("trophy") + '<span id="qa-score">0</span></div></div>' +
      (G.mp ? '<div class="qa-glass qa-rank" id="qa-rank">' + strip(R.room) + "</div>" : "") +
      '<div class="qa-prog-meta"><span id="qa-qn"></span><span>+10 to +15 · speed bonus</span></div>' +
      '<div class="qa-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" id="qa-prog"><div class="qa-fill" id="qa-bar"></div></div>' +
      '<div class="qa-glass qa-card qa-nosel" id="qa-card"></div>' +
      '<div class="qa-opts qa-nosel" id="qa-opts"></div></div>';
    view.innerHTML = h; icons(); showQ(); tick();
  }

  function showQ() {
    var q = G.qs[G.i], n = G.qs.length; G.locked = false; G.qStart = Date.now();
    var qn = $("qa-qn"); if (qn) qn.innerHTML = "Question <b>" + (G.i + 1) + "</b> of " + n;
    setBar(G.i / n);
    var card = $("qa-card");
    if (card) {
      card.classList.remove("qa-card-in"); void card.offsetWidth; card.classList.add("qa-card-in");
      card.innerHTML = '<div class="qa-pop" id="qa-pop"></div>' +
        '<div class="qa-qtag">' + esc(q.tag || "Quiz") + '</div>' +
        '<p class="qa-q">' + esc(q.q) + "</p>";
    }
    var opts = $("qa-opts");
    if (opts) {
      opts.innerHTML = q.o.map(function (o, k) {
        return '<button type="button" class="qa-opt btn-tap" data-a="opt" data-k="' + k + '"><span class="qa-let">' + "ABCD".charAt(k) + '</span><span>' + esc(o.t) + "</span></button>";
      }).join("");
    }
  }

  function setBar(f) {
    var b = $("qa-bar"); if (b) b.style.width = Math.round(f * 100) + "%";
    var p = $("qa-prog"); if (p) p.setAttribute("aria-valuenow", Math.round(f * 100));
  }

  function tick() {
    if (!G || G.done) return;
    if (!root || !document.body.contains(root)) { stopGame(); return; }
    var rem = Math.max(0, G.endAt - Date.now());
    var t = $("qa-time"); if (t) t.textContent = fmt(rem);
    var c = $("qa-timechip"); if (c) c.classList.toggle("low", rem <= G.total * 0.2);
    if (rem <= 0) { G.timeUp = true; finish(); }
  }

  function answer(k) {
    if (!G || G.locked || G.done) return;
    G.locked = true;
    var q = G.qs[G.i], ok = q.o[k].ok, el = (Date.now() - G.qStart) / 1000, bonus = 0;
    if (ok) {
      bonus = Math.max(0, Math.min(5, Math.ceil(5 * (1 - el / SEC_PER_Q))));
      G.correct++; G.score += 10 + bonus;
      G.combo = (G.combo || 0) + 1;
      G.bestCombo = Math.max(G.bestCombo || 0, G.combo);
      sfx(bonus >= 4 ? "six" : "move");
    } else {
      G.wrong++; G.combo = 0;
      sfx("error");
      try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { }
    }
    var btns = root.querySelectorAll(".qa-opt");
    Array.prototype.forEach.call(btns, function (b, i) {
      b.disabled = true;
      var lt = b.querySelector(".qa-let");
      if (q.o[i].ok) { b.classList.add("qa-ok"); if (lt) lt.textContent = "✓"; }
      else if (i === k) { b.classList.add("qa-bad"); if (lt) lt.textContent = "✕"; }
      else { b.classList.add("qa-dim"); }
    });
    G.log[G.i] = { k: k, ok: ok };

    var sc = $("qa-score"); if (sc) sc.textContent = G.score;
    var chip = $("qa-scorechip"); if (chip) { chip.classList.remove("qa-bump"); void chip.offsetWidth; if (ok) chip.classList.add("qa-bump"); }
    var cbEl = $("qa-combo"), cbVal = $("qa-combov");
    if (cbEl && cbVal) {
      cbEl.classList.toggle("hidden", G.combo < 2);
      cbVal.textContent = G.combo + "×";
    }
    var pop = $("qa-pop");
    if (pop) {
      pop.textContent = ok ? ("+" + (10 + bonus) + (bonus >= 4 ? " ⚡" : "")) : "Wrong";
      pop.className = "qa-pop " + (ok ? "" : "bad");
      void pop.offsetWidth; pop.className += " go";
    }
    setBar((G.i + 1) / G.qs.length);
    if (G.mp) mpPush(G.i + 1 >= G.qs.length);
    G.adv = setTimeout(next, 720);
  }

  function next() {
    if (!G || G.done) return;
    G.i++;
    if (G.i >= G.qs.length) finish(); else showQ();
  }

  function finish() {
    if (!G || G.done) return;
    stopGame();
    if (G.mp) { mpFinish(); return; }
    var n = G.qs.length, el = Math.min(Date.now() - G.startT, G.total), sk = Math.max(0, n - G.correct - G.wrong);
    var s = bumpStreak();
    var review = G.qs.map(function (q, i) {
      var lg = G.log[i], ci = 0; q.o.forEach(function (o, j) { if (o.ok) ci = j; });
      return { q: q.q, tag: q.tag, opts: q.o.map(function (o) { return o.t; }), correct: ci, pick: lg ? lg.k : -1 };
    });
    reviewOpen = false;
    var acc = Math.round(G.correct / n * 100);
    if (acc >= 60) sfx("win");
    last = { review: review, score: G.score, max: n * (10 + 5), correct: G.correct, wrong: G.wrong, skipped: sk, bestCombo: G.bestCombo || 0, n: n, acc: acc, ms: el, label: catLabel(), name: S.name || "Player", streak: s.n, best: s.best, timeUp: G.timeUp, date: new Date() };
    screen = "result"; render();
  }

  /* ---------- result screen ---------- */
  function canShareFiles() {
    try { return typeof File === "function" && navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }); } catch (e) { return false; }
  }
  function reviewHtml(r) {
    return (r.review || []).map(function (it, i) {
      var h = '<div class="qa-rev-item"><div class="flex items-center gap-2"><span class="qa-id">Q' + (i + 1) + "</span>" + (it.tag ? '<span class="qa-qtag">' + esc(it.tag) + "</span>" : "") + "</div>" +
        '<div class="qa-rv-q">' + esc(it.q) + "</div>";
      if (it.pick === it.correct) h += '<div class="qa-rv-a ok"><b>✓</b><span>' + esc(it.opts[it.correct]) + "</span></div>";
      else {
        if (it.pick > -1) h += '<div class="qa-rv-a bad"><b>✕</b><span>' + esc(it.opts[it.pick]) + "</span></div>";
        else h += '<div class="qa-rv-a skip"><b>–</b><span>Not answered</span></div>';
        h += '<div class="qa-rv-a ok"><b>✓</b><span>' + esc(it.opts[it.correct]) + "</span></div>";
      }
      return h + "</div>";
    }).join("");
  }
  function toggleReview() {
    reviewOpen = !reviewOpen;
    var box = $("qa-revbox"), p = $("qa-rev"), b = $("qa-revbtn");
    if (!box || !p) return;
    box.classList.toggle("qa-open", reviewOpen); p.hidden = !reviewOpen; if (b) b.setAttribute("aria-expanded", reviewOpen ? "true" : "false");
    if (reviewOpen) { try { p.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { } }
  }
  function renderResult() {
    var r = last;
    var msg = r.acc >= 85 ? "Outstanding precision!" : r.acc >= 65 ? "Strong run!" : r.acc >= 45 ? "Solid practice!" : "Good warm-up — run it back!";
    var circ = 2 * Math.PI * 56;
    var targetOff = circ * (1 - r.acc / 100);

    var h = '<div class="qa-wrap">';
    h += '<div class="qa-glass qa-res-hero">' +
      (r.timeUp ? '<div class="text-xs font-extrabold" style="color:var(--qa-bdc);margin-bottom:4px">TIME’S UP</div>' : "") +
      '<div class="text-xs font-extrabold qa-t2 uppercase tracking-wider">' + esc(r.name) + " · " + esc(r.label) + "</div>" +
      '<div class="qa-gauge"><svg viewBox="0 0 132 132" aria-hidden="true">' +
      '<defs><linearGradient id="qaGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs>' +
      '<circle class="qa-gauge-bg" cx="66" cy="66" r="56"/>' +
      '<circle id="qa-gauge-fg" class="qa-gauge-fg" cx="66" cy="66" r="56" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + circ.toFixed(1) + '"/>' +
      '</svg><div class="qa-gauge-in"><span class="qa-gauge-pct">' + r.acc + '%</span><span class="qa-gauge-lbl">ACCURACY</span></div></div>' +
      '<div class="qa-big">' + r.score + '<span class="text-sm qa-t2 font-bold" style="-webkit-text-fill-color:var(--qa-t2)"> / ' + r.max + " pts</span></div>" +
      '<div class="mt-1.5 text-sm font-extrabold">' + msg + "</div></div>";

    h += '<div class="grid grid-cols-3 gap-2 mt-3">' +
      '<div class="qa-glass qa-stat"><b>' + r.correct + "/" + r.n + "</b><span>Correct</span></div>" +
      '<div class="qa-glass qa-stat"><b>' + fmt(r.ms) + "</b><span>Time Taken</span></div>" +
      '<div class="qa-glass qa-stat"><b>' + (r.bestCombo || 0) + "×</b><span>Best Combo</span></div></div>";

    h += '<div class="qa-glass mt-3 p-3 flex items-center gap-3">' +
      '<div class="qa-bt-ic" style="width:36px;height:36px;border-radius:12px">' + ico("flame") + '</div>' +
      '<div class="flex-1 min-w-0"><div class="font-extrabold text-sm">' + r.streak + "-day active streak</div>" +
      '<div class="text-xs qa-t2">Personal best: ' + r.best + " day" + (r.best === 1 ? "" : "s") + " · keep showing up daily</div></div></div>";

    h += '<div class="qa-glass mt-3 p-2.5' + (reviewOpen ? " qa-open" : "") + '" id="qa-revbox">' +
      '<button type="button" class="qa-sec btn-tap w-full" data-a="review" id="qa-revbtn" aria-expanded="' + reviewOpen + '" aria-controls="qa-rev">' + ico("list-checks") + "<span>Review All " + r.n + " Answers</span>" + ico("chevron-down", "qa-chev") + "</button>" +
      '<div class="qa-rv" id="qa-rev"' + (reviewOpen ? "" : " hidden") + ">" + reviewHtml(r) + "</div></div>";

    h += '<div class="mt-4 grid gap-2.5">' +
      '<button type="button" class="qa-cta btn-tap" data-a="again">' + ico("rotate-ccw") + "Play Again</button>" +
      '<div class="grid ' + (canShareFiles() ? "grid-cols-2" : "grid-cols-1") + ' gap-2">' +
      '<button type="button" class="qa-sec btn-tap" data-a="dl">' + ico("download") + "Save Card (PNG)</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="share">' + ico("share-2") + "Share</button>" : "") +
      '</div>' +
      '<button type="button" class="qa-sec btn-tap" data-a="setup">' + ico("sliders-horizontal") + "Change Settings</button></div></div>";

    view.innerHTML = h; icons();
    requestAnimationFrame(function () {
      var fg = $("qa-gauge-fg");
      if (fg) fg.setAttribute("stroke-dashoffset", targetOff.toFixed(1));
    });
  }

  /* ---------- PNG result card ---------- */
  function rr(x, px, y, w, h, r) {
    x.beginPath(); x.moveTo(px + r, y); x.arcTo(px + w, y, px + w, y + h, r); x.arcTo(px + w, y + h, px, y + h, r);
    x.arcTo(px, y + h, px, y, r); x.arcTo(px, y, px + w, y, r); x.closePath();
  }
  function fit(x, text, maxW) { while (text.length > 3 && x.measureText(text).width > maxW) text = text.slice(0, -2) + "…"; return text; }
  function drawCard(r) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1020"); g.addColorStop(1, "#1e1612"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W / 2, 520, 20, W / 2, 520, 620); rg.addColorStop(0, "rgba(249,115,22,.28)"); rg.addColorStop(1, "rgba(249,115,22,0)"); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fb923c"; x.font = "800 40px " + F; x.fillText("QUIZ RESULT", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f8fafc"; x.font = "700 58px " + F; x.fillText(fit(x, r.name, 900), W / 2, 210);
    x.fillStyle = "#94a3b8"; x.font = "500 34px " + F; x.fillText(fit(x, r.label, 900), W / 2, 268);
    var cx = W / 2, cy = 520, rad = 190;
    x.lineWidth = 30; x.lineCap = "round"; x.strokeStyle = "rgba(148,163,184,.25)"; x.beginPath(); x.arc(cx, cy, rad, 0, Math.PI * 2); x.stroke();
    if (r.acc > 0) {
      var ag = x.createLinearGradient(cx - rad, cy, cx + rad, cy); ag.addColorStop(0, "#f97316"); ag.addColorStop(1, "#fbbf24");
      x.strokeStyle = ag; x.beginPath(); x.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * r.acc / 100); x.stroke();
    }
    x.fillStyle = "#f8fafc"; x.font = "800 120px " + F; x.fillText(r.acc + "%", cx, cy + 36);
    x.fillStyle = "#94a3b8"; x.font = "700 30px " + F; x.fillText("ACCURACY", cx, cy + 90);
    x.fillStyle = "#fbbf24"; x.font = "900 150px " + F; x.fillText(String(r.score), cx, 880);
    x.fillStyle = "#94a3b8"; x.font = "600 34px " + F; x.fillText("of " + r.max + " points", cx, 934);
    var stats = [["CORRECT", r.correct + "/" + r.n], ["TIME", fmt(r.ms)], ["STREAK", r.streak + (r.streak === 1 ? " day" : " days")]];
    stats.forEach(function (s, i) {
      var bx = 70 + i * 322, by = 1000, bw = 296, bh = 140;
      rr(x, bx, by, bw, bh, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(251,146,60,.3)"; x.stroke();
      x.fillStyle = "#f8fafc"; x.font = "800 52px " + F; x.fillText(s[1], bx + bw / 2, by + 70);
      x.fillStyle = "#94a3b8"; x.font = "700 26px " + F; x.fillText(s[0], bx + bw / 2, by + 112);
    });
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fb923c"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#94a3b8"; x.font = "500 28px " + F; x.fillText(r.date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), W / 2, 1322);
    return c;
  }
  function cardBlob(cb) { try { drawCard(last).toBlob(cb, "image/png"); } catch (e) { toast("Couldn’t create the image"); } }
  function download() {
    cardBlob(function (b) {
      if (!b) { toast("Couldn’t create the image"); return; }
      var u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = "ITI-CONNECT-Quiz-" + ymd(last.date) + ".png"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast("Result card saved");
    });
  }
  function share() {
    cardBlob(function (b) {
      if (!b) return;
      var f = new File([b], "ITI-CONNECT-Quiz-Result.png", { type: "image/png" });
      navigator.share({ files: [f], title: "ITI CONNECT Quiz Result", text: "I scored " + last.score + "/" + last.max + " on ITI CONNECT Quiz Arena!" }).catch(function () { });
    });
  }

  /* ---------- multiplayer (Firebase Firestore, battles/{roomCode}) ---------- */
  var FB_V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXPIRE_MS = 24 * 3600 * 1000;
  var INVITE_BASE = "https://devit988.github.io/Iti-attendance-/?battle=";
  var MEDAL = ["🥇", "🥈", "🥉", "4️⃣"];
  var M = window.QuizArenaMulti = window.QuizArenaMulti || {};

  function online() { return navigator.onLine !== false; }
  function fbCore() {
    if (FBC) return FBC;
    FBC = Promise.all([import(FB_V + "firebase-app.js"), import(FB_V + "firebase-firestore.js")]).then(function (m) {
      var A = m[0], F = m[1], app;
      if (A.getApps().length) app = A.getApps()[0];
      else {
        var c = typeof window.getActiveFirebaseConfig === "function" ? window.getActiveFirebaseConfig() : null;
        if (!c || !c.projectId) throw { code: "no-config" };
        app = A.initializeApp(c);
      }
      return { F: F, app: app, db: F.getFirestore(app) };
    }).catch(function (e) { FBC = null; throw e; });
    return FBC;
  }
  function loadFb() {
    if (FBP) return FBP;
    FBP = fbCore().then(function (core) {
      return import(FB_V + "firebase-auth.js").then(function (U) {
        var auth = U.getAuth(core.app);
        return (auth.authStateReady ? auth.authStateReady() : Promise.resolve()).then(function () {
          return auth.currentUser || U.signInAnonymously(auth).then(function (cr) { return cr.user; });
        }).then(function (user) { FBR = { F: core.F, db: core.db, uid: user.uid }; return FBR; });
      });
    }).catch(function (e) { FBP = null; throw e; });
    return FBP;
  }
  function fail(e) {
    var c = (e && e.code) || "", m;
    if (c === "nf") m = "Room not found. Check the code.";
    else if (c === "wrong-game") m = "That code is for another Arena game (Ludo, Snakes or Chor Police).";
    else if (c === "started") m = "That match has already started.";
    else if (c === "full") m = "That room is full.";
    else if (c === "no-code") m = "Couldn’t get a free room code. Try again.";
    else if (c === "permission-denied") m = "Not allowed — the room may be full, started or expired.";
    else if (c.indexOf("auth/") === 0) m = "Enable Anonymous sign-in in Firebase Authentication.";
    else m = "Couldn’t reach the live server. Check your internet.";
    toast(m);
  }
  function rankList(room) {
    return Object.keys(room.players).map(function (id) {
      var p = room.players[id]; return { id: id, name: p.name, score: p.score, qIndex: p.qIndex, done: p.done };
    }).sort(function (a, b) { return b.score - a.score || b.qIndex - a.qIndex || (a.name > b.name ? 1 : -1); });
  }
  function strip(room) {
    return rankList(room).map(function (p, i) {
      return '<span class="qa-rk' + (p.id === R.uid ? " me" : "") + '">' + MEDAL[i] + ' <span class="qa-rn">' + esc(p.name) + "</span> " + p.score + "</span>";
    }).join('<span class="qa-t2"> • </span>');
  }
  function updateRank() { var el = $("qa-rank"); if (el && R && R.room) el.innerHTML = strip(R.room); }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      try {
        var a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select();
        var r = document.execCommand("copy"); a.remove(); r ? ok() : no();
      } catch (e) { no(e); }
    });
  }
  function clearInvite() {
    pendingCode = "";
    try { var u = new URL(location.href); if (u.searchParams.has("battle")) { u.searchParams.delete("battle"); history.replaceState(null, "", u.pathname + u.search + u.hash); } } catch (e) { }
  }

  /* --- create / join --- */
  M.createRoom = function (c) {
    if (busy || R) return;
    if (!online()) { toast("Live rooms need an internet connection"); return; }
    var ids = c.questionIds || [], max = c.players, name = (c.name || "Player").slice(0, 16), tug = c.battle === "tug";
    if (tug) max = 2;
    if ([2, 3, 4].indexOf(max) < 0 || COUNTS.indexOf(c.count) < 0 || (tug ? ids.length < c.count : ids.length !== c.count)) { toast("Pick 2–4 players and a valid question count"); return; }
    busy = true; toast("Creating room…");
    loadFb().then(function (f) {
      var tries = 0, F = f.F;
      function attempt() {
        var code = String(1000 + Math.floor(Math.random() * 9000)), ref = F.doc(f.db, "battles", code);
        return F.getDoc(ref).then(function (s) { return s.exists(); }, function () { return true; }).then(function (taken) {
          if (taken) { if (++tries >= 8) throw { code: "no-code" }; return attempt(); }
          var pl = {}; pl[f.uid] = { name: name, score: 0, qIndex: 0, done: false };
          if (tug) { pl[f.uid].streak = 0; pl[f.uid].miss = 0; }
          var docData = {
            status: "waiting", hostId: f.uid, maxPlayers: max, questionCount: c.count, categoryLabel: String(c.label || "").slice(0, 60),
            qIds: ids, startedAt: null, expireAt: F.Timestamp.fromMillis(Date.now() + EXPIRE_MS), players: pl
          };
          if (tug) { docData.battleType = "tug"; docData.rope = 50; docData.roundIndex = 0; docData.roundStartAt = null; docData.lastRes = null; docData.winnerId = null; docData.endReason = null; docData.forfeitId = null; }
          return F.setDoc(ref, docData).then(function () { return { code: code, ref: ref }; }, function (e) {
            if (e && e.code === "permission-denied" && ++tries < 8) return attempt(); throw e;
          });
        });
      }
      return attempt();
    }).then(function (r) { openRoom(r.code, r.ref, true, { main: c.main, sub: c.sub, count: c.count }); })
      .catch(fail).then(function () { busy = false; });
  };
  M.joinRoom = function (code, o) {
    if (busy || R) return;
    if (!online()) { toast("Live rooms need an internet connection"); return; }
    if (bankState !== "ok") { toast("Questions are still loading — try again"); return; }
    var name = ((o && o.name) || S.name || "Player").slice(0, 16);
    busy = true; toast("Joining room " + code + "…");
    loadFb().then(function (f) {
      var F = f.F, ref = F.doc(f.db, "battles", code);
      return F.getDoc(ref).then(function (s) {
        if (!s.exists()) throw { code: "nf" };
        var d = s.data(), me = d.players && d.players[f.uid];
        if (d.gameType) throw { code: "wrong-game" };
        if (d.status !== "waiting") throw { code: "started" };
        if (me) return ref;
        if (Object.keys(d.players).length >= d.maxPlayers) throw { code: "full" };
        var up = {}; up["players." + f.uid] = { name: name, score: 0, qIndex: 0, done: false };
        return F.updateDoc(ref, up).then(function () { return ref; });
      });
    }).then(function (ref) { clearInvite(); openRoom(code, ref, false, null); })
      .catch(fail).then(function () { busy = false; });
  };
  function openRoom(code, ref, isHost, c) {
    R = { code: code, ref: ref, uid: FBR.uid, isHost: isHost, cfg: c, room: null, unsub: null, started: false, starting: false, ending: false, closed: false, final: null, base: 0, startT: 0, endT: 0, cd: 0, watch: 0, resT: 0, resBusy: false, resTry: 0, resSched: -1, tugEndT: 0 };
    R.unsub = FBR.F.onSnapshot(ref, onRoom, function (e) { fail(e); });
  }
  function resetMatch() {
    if (G && G.mp) { stopGame(); G = null; }
    if (!R) return;
    clearInterval(R.cd); clearInterval(R.watch); clearTimeout(R.endT); clearTimeout(R.startT); clearTimeout(R.resT); clearTimeout(R.tugEndT);
    R.started = R.starting = R.ending = false; R.final = null; R.endT = 0; R.resBusy = false; R.resSched = -1; R.resTry = 0; R.tugEndT = 0;
  }
  function teardown() {
    if (!R) return;
    resetMatch(); if (R.unsub) R.unsub(); R = null;
  }

  /* --- live room listener --- */
  function onRoom(snap) {
    if (!R) return;
    if (!snap.exists()) {
      if (screen === "mresult") { R.closed = true; render(); toast("The host closed the room"); return; }
      teardown(); screen = "setup"; render(); toast("Room closed"); return;
    }
    var d = snap.data(); R.room = d;
    if (d.status === "waiting") onWaiting(d);
    else if (d.status === "playing") onPlaying(d);
    else if (d.status === "finished") onFinished(d);
  }
  function onWaiting(d) {
    if (R.started || screen !== "lobby") resetMatch();
    screen = "lobby"; renderLobby();
    var n = Object.keys(d.players).length;
    if (n >= d.maxPlayers && !R.starting) { R.starting = true; R.startT = setTimeout(startMatch, R.isHost ? 800 : 4000); }
  }
  function startMatch() {
    if (!R || !R.room || R.room.status !== "waiting") { if (R) R.starting = false; return; }
    var n = Object.keys(R.room.players).length;
    if (n < 2 || (!R.isHost && n < R.room.maxPlayers)) { R.starting = false; return; }
    R.starting = true;
    var t0 = Date.now() + 3000, up0 = { status: "playing", startedAt: t0 };
    if (tugOn(R.room)) { up0.roundStartAt = t0; up0.roundIndex = 0; up0.rope = 50; }
    FBR.F.updateDoc(R.ref, up0).catch(function (e) {
      if (R) R.starting = false;
      if (R && R.isHost && !(e && e.code === "permission-denied")) fail(e);
    });
  }
  function onPlaying(d) {
    var tug = tugOn(d);
    if (!R.started) {
      R.started = true; R.starting = false; clearTimeout(R.startT);
      var recv = Date.now(), base = Number(d.startedAt) || 0;
      if (Math.abs(base - (recv + 3000)) > 8000) base = recv + 3000;
      R.base = base; R.watch = tug ? setInterval(tugTick, 200) : setInterval(watchTick, 1000);
      runCountdown(base); return;
    }
    if (tug) { tugSync(d); return; }
    updateRank(); if (screen === "mwait") renderWait();
    checkEnd();
  }
  function runCountdown(base) {
    screen = "countdown"; render();
    R.cd = setInterval(function () {
      if (!R) return;
      var ms = base - Date.now(), el = $("qa-cd");
      if (ms <= 0) { clearInterval(R.cd); startMulti(base); return; }
      var n = Math.ceil(ms / 1000);
      if (el && el.textContent !== String(n)) { el.textContent = n; el.classList.remove("qa-bump"); void el.offsetWidth; el.classList.add("qa-bump"); sfx("click"); }
    }, 100);
  }
  function startMulti(base) {
    if (tugOn(R.room)) { startTug(base); return; }
    var byId = {}; baseBank.forEach(function (q) { byId[q.id] = q; }); custom.items.forEach(function (it) { if (it && !checkQ(it)) byId[it.id] = it; }); bank.forEach(function (q) { byId[q.id] = q; });
    var qs = (R.room.qIds || []).map(function (id) { return byId[id]; }).filter(Boolean).map(prep);
    if (qs.length !== R.room.qIds.length) { toast("Question bank is out of date — refresh the app"); leaveRoom(); return; }
    var total = qs.length * SEC_PER_Q * 1000;
    G = { qs: qs, i: 0, score: 0, correct: 0, wrong: 0, combo: 0, bestCombo: 0, total: total, startT: base, endAt: base + total, qStart: Date.now(), locked: false, tick: 0, adv: 0, quitAt: 0, done: false, timeUp: false, mp: true, log: [] };
    screen = "game"; renderGame(); G.tick = setInterval(tick, 250);
  }

  /* --- score sync --- */
  function mpPush(done) {
    if (!R || !G) return;
    var p = "players." + R.uid + ".", up = {};
    up[p + "score"] = G.score; up[p + "qIndex"] = G.correct + G.wrong; up[p + "done"] = !!done;
    FBR.F.updateDoc(R.ref, up).catch(function () { });
  }
  function mpFinish() { mpPush(true); screen = "mwait"; render(); checkEnd(); }
  function leaveMatch() {
    if (G && G.tug) tugForfeit(); else mpPush(true);
    var r = R; teardown(); screen = "setup"; render();
    if (r) toast("You left the match");
  }
  function checkEnd() {
    if (!R || !R.room || R.room.status !== "playing" || !G || !G.done) return;
    var all = Object.keys(R.room.players).every(function (id) { return R.room.players[id].done; });
    if (all) scheduleEnd();
  }
  function scheduleEnd() {
    if (R.endT) return;
    R.endT = setTimeout(endRoom, R.isHost ? 300 : 1500 + Math.random() * 1500);
  }
  function endRoom() {
    if (!R) return; R.endT = 0;
    if (R.ending || !R.room || R.room.status !== "playing") return;
    R.ending = true;
    FBR.F.updateDoc(R.ref, { status: "finished" }).catch(function () { if (R) R.ending = false; });
  }
  function watchTick() {
    if (!R) return;
    if (!root || !document.body.contains(root)) { clearInterval(R.watch); if (G && !G.done) { G.timeUp = true; mpPush(true); } teardown(); return; }
    var left = R.base + R.room.questionCount * SEC_PER_Q * 1000 - Date.now(), t = $("qa-wait-time");
    if (t) t.textContent = fmt(left);
    if (left < -2500 && R.room.status === "playing") { if (G && !G.done) { G.timeUp = true; finish(); } scheduleEnd(); }
  }
  function onFinished(d) {
    if (tugOn(d)) { onTugFinished(d); return; }
    if (!R.started && screen !== "mresult") { resetMatch(); }
    if (G && G.mp) { if (!G.done) stopGame(); }
    clearInterval(R.watch); clearTimeout(R.endT);
    R.final = rankList(d);
    if (screen !== "mresult") { bumpStreak(); sfx("win"); screen = "mresult"; }
    render();
  }

  /* --- leave / rematch --- */
  function leaveRoom() {
    if (!R) return;
    var r = R, d = r.room, F = FBR && FBR.F;
    teardown(); screen = "setup"; render();
    if (!d || !F) return;
    if (r.isHost && d.status !== "playing") F.deleteDoc(r.ref).catch(function () { });
    else if (!r.isHost && d.status !== "playing") { var up = {}; up["players." + r.uid] = F.deleteField(); F.updateDoc(r.ref, up).catch(function () { }); }
  }
  function rematch() {
    if (!R || !R.isHost || busy || !R.room) return;
    var d = R.room, c = R.cfg || { main: S.main, sub: S.sub, count: d.questionCount };
    if (!feasible(d.questionCount, c)) { toast("Not enough questions for a rematch"); return; }
    var tug = tugOn(d), cc = { main: c.main, sub: c.sub, count: d.questionCount };
    var ids = tug ? tugIds(cc) : pick(cc).map(function (q) { return q.id; }), pl = {}, upd;
    Object.keys(d.players).forEach(function (id) {
      if (tug && d.forfeitId && id === d.forfeitId && id !== R.uid) return;
      pl[id] = { name: d.players[id].name, score: 0, qIndex: 0, done: false };
      if (tug) { pl[id].streak = 0; pl[id].miss = 0; pl[id].ans = null; }
    });
    upd = { status: "waiting", qIds: ids, startedAt: null, players: pl };
    if (tug) { upd.rope = 50; upd.roundIndex = 0; upd.roundStartAt = null; upd.lastRes = null; upd.winnerId = null; upd.endReason = null; upd.forfeitId = null; }
    busy = true;
    FBR.F.updateDoc(R.ref, upd).catch(fail).then(function () { busy = false; });
  }

  /* --- lobby / countdown / waiting / podium screens --- */
  function renderLobby() {
    var d = R.room, ids = Object.keys(d.players).sort(function (a, b) { return a === d.hostId ? -1 : b === d.hostId ? 1 : a > b ? 1 : -1; }), n = ids.length, i, h;
    var wa = "https://wa.me/?text=" + encodeURIComponent("Join my ITI CONNECT Quiz Arena battle! 🏆\nRoom code: " + R.code + "\n" + INVITE_BASE + R.code);
    h = '<div class="qa-wrap"><div class="qa-hud"><div class="flex items-center gap-2">' + ico(tugOn(d) ? "zap" : "swords", "qa-ac") + '<span class="text-base font-extrabold">' + (tugOn(d) ? "1v1 Power Clash Room" : "Live Battle Room") + '</span></div>' +
      '<button type="button" class="qa-ic btn-tap" data-a="leave" aria-label="Leave room">' + ico("x") + "</button></div>";

    h += '<div class="qa-glass p-4 text-center mt-3"><div class="qa-lbl">ROOM CODE</div>' +
      '<div class="qa-code-tiles">' + String(R.code).split("").map(function (ch) { return '<span class="qa-code-d">' + esc(ch) + '</span>'; }).join("") + '</div>' +
      '<div class="text-xs qa-t2 mt-3 font-semibold">' + esc(d.categoryLabel) + " · " + d.questionCount + " Questions</div></div>";

    h += '<div class="grid grid-cols-2 gap-2 mt-3"><button type="button" class="qa-sec btn-tap" data-a="copy">' + ico("copy") + "Copy Code</button>" +
      '<a class="qa-sec btn-tap" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + "WhatsApp Invite</a></div>";

    h += '<div class="qa-lbl-row mt-4"><span class="qa-lbl">Players</span><span class="qa-lbl-hint">' + n + " / " + d.maxPlayers + ' joined</span></div><div class="grid gap-2">';
    for (i = 0; i < d.maxPlayers; i++) {
      if (ids[i]) {
        h += '<div class="qa-glass qa-slot"><span class="qa-let">' + (i + 1) + '</span><span class="flex-1 truncate font-bold text-sm">' + esc(d.players[ids[i]].name) + (ids[i] === R.uid ? " (You)" : "") + "</span>" +
          (ids[i] === d.hostId ? '<span class="qa-host-pill">HOST</span>' : "") + "</div>";
      } else {
        h += '<div class="qa-slot qa-empty"><span class="qa-let" style="opacity:.45">' + (i + 1) + '</span><span class="qa-t2 text-xs font-semibold">Waiting for player<span class="qa-dots"><i></i><i></i><i></i></span></span></div>';
      }
    }
    h += "</div>";
    if (R.isHost) {
      h += '<div class="mt-4"><button type="button" class="qa-cta btn-tap" data-a="startnow"' + (n < 2 || R.starting ? " disabled" : "") + ">" + ico("play") + "Start Match Now</button>" +
        '<div class="text-xs qa-t2 mt-2 text-center">' + (n < 2 ? "Need at least 2 players to start" : "Auto-starts as soon as all " + d.maxPlayers + " seats fill") + "</div></div>";
    } else h += '<div class="text-xs qa-t2 mt-4 text-center font-semibold">Waiting for host to launch<span class="qa-dots"><i></i><i></i><i></i></span></div>';
    h += "</div>";
    view.innerHTML = h; icons();
  }

  function renderCountdown() {
    view.innerHTML = '<div class="qa-wrap qa-cd-wrap">' +
      '<div class="qa-lbl">' + (tugOn(R.room) ? "⚡ 1V1 POWER CLASH" : "LIVE QUIZ BATTLE") + '</div>' +
      '<div class="qa-cd-ring"><div class="qa-cd-num qa-bump" id="qa-cd">3</div></div>' +
      '<div class="text-xs qa-t2 mt-5 font-semibold">' + esc(R.room.categoryLabel) + " · " + R.room.questionCount + " Questions</div></div>";
  }

  function renderWait() {
    var d = R.room, rk = rankList(d), me = d.players[R.uid] || { score: 0 }, h;
    h = '<div class="qa-wrap"><div class="qa-glass p-5 text-center">' +
      '<div class="qa-lbl">YOU FINISHED</div><div class="qa-big mt-2">' + me.score + '</div>' +
      '<div class="text-xs qa-t2 mt-2 font-semibold">Waiting for others · max <span id="qa-wait-time">' + fmt(Math.max(0, R.base + d.questionCount * SEC_PER_Q * 1000 - Date.now())) + "</span></div></div>" +
      '<div class="grid gap-2 mt-3">' + rk.map(function (p, i) {
        return '<div class="qa-glass qa-slot"><span class="qa-let">' + (i + 1) + '</span><span class="flex-1 truncate font-bold text-sm">' + esc(p.name) + (p.id === R.uid ? " (You)" : "") + '</span><span class="text-xs qa-t2 font-semibold">' +
          (p.done ? "Done ✓" : "Q " + Math.min(p.qIndex + 1, d.questionCount) + "/" + d.questionCount) + '</span><b class="qa-ac">' + p.score + "</b></div>";
      }).join("") + "</div></div>";
    view.innerHTML = h;
  }

  function renderPodium() {
    if (tugOn(R.room)) { renderTugResult(); return; }
    var rk = R.final, d = R.room, myPos = 0, h, order, hts = [124, 92, 70], ordn = [];
    rk.forEach(function (p, i) { if (p.id === R.uid) myPos = i + 1; });
    h = '<div class="qa-wrap"><div class="qa-glass qa-res-hero">' +
      '<div class="qa-lbl">' + esc(d.categoryLabel) + '</div>' +
      '<div class="text-xl font-black mt-1">Battle Podium</div>' +
      '<div class="mt-2"><span class="qa-win' + (myPos === 1 ? "" : " lose") + '">' + (myPos === 1 ? "🏆 Champion (#1)" : "Finished " + MEDAL[myPos - 1] + " (#" + myPos + ")") + "</span></div>";
    order = rk.length > 2 ? [1, 0, 2] : [1, 0];
    order.forEach(function (i) { if (rk[i]) ordn.push(i); });
    h += '<div class="qa-pod">' + ordn.map(function (i) {
      var p = rk[i];
      return '<div class="qa-pcol">' + (i === 0 ? '<div class="qa-pcrown">👑</div>' : '') +
        '<div class="qa-pn">' + esc(p.name) + '</div><div class="qa-ps">' + p.score + '</div>' +
        '<div class="qa-pbar r' + i + '" style="height:' + hts[i] + 'px">' + (i + 1) + "</div></div>";
    }).join("") + "</div></div>";
    if (rk[3]) h += '<div class="qa-glass qa-slot mt-3"><span class="qa-let">4</span><span class="flex-1 truncate font-bold text-sm">' + esc(rk[3].name) + '</span><b class="qa-ac">' + rk[3].score + "</b></div>";
    h += '<div class="mt-4 grid gap-2.5">';
    if (R.isHost && !R.closed) h += '<button type="button" class="qa-cta btn-tap" data-a="rematch"' + (busy ? " disabled" : "") + ">" + ico("rotate-ccw") + "Rematch (New Questions)</button>";
    else if (!R.closed) h += '<div class="text-xs qa-t2 text-center font-semibold">Waiting for host to start a rematch…</div>';
    h += '<div class="grid ' + (canShareFiles() ? "grid-cols-2" : "grid-cols-1") + ' gap-2">' +
      '<button type="button" class="qa-sec btn-tap" data-a="mdl">' + ico("download") + "Save Podium</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="mshare">' + ico("share-2") + "Share</button>" : "") +
      '</div>' +
      '<button type="button" class="qa-sec btn-tap" data-a="leave">' + ico("log-out") + "Leave Room</button></div></div>";
    view.innerHTML = h; icons();
  }

  /* --- PNG podium card --- */
  function drawPodium(rk, d) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1020"); g.addColorStop(1, "#1e1612"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W / 2, 640, 20, W / 2, 640, 640); rg.addColorStop(0, "rgba(249,115,22,.26)"); rg.addColorStop(1, "rgba(249,115,22,0)"); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fb923c"; x.font = "800 40px " + F; x.fillText("QUIZ BATTLE", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f8fafc"; x.font = "700 52px " + F; x.fillText(fit(x, rk[0].name + " wins!", 900), W / 2, 215);
    x.fillStyle = "#94a3b8"; x.font = "500 34px " + F; x.fillText(fit(x, d.categoryLabel + " · " + d.questionCount + " Qs", 900), W / 2, 272);
    var cols = [{ i: 1, cx: 230, h: 250 }, { i: 0, cx: 540, h: 340 }, { i: 2, cx: 850, h: 190 }], base = 1000, bw = 290;
    var fills = [["#fef08a", "#f59e0b"], ["#f1f5f9", "#94a3b8"], ["#fed7aa", "#c2410c"]];
    cols.forEach(function (col) {
      var p = rk[col.i]; if (!p) return;
      var top = base - col.h, gr = x.createLinearGradient(0, top, 0, base); gr.addColorStop(0, fills[col.i][0]); gr.addColorStop(1, fills[col.i][1]);
      rr(x, col.cx - bw / 2, top, bw, col.h, 24); x.fillStyle = gr; x.fill();
      x.fillStyle = "#1c1100"; x.font = "900 120px " + F; x.fillText(String(col.i + 1), col.cx, top + 140);
      x.fillStyle = "#f8fafc"; x.font = "700 40px " + F; x.fillText(fit(x, p.name, bw), col.cx, top - 84);
      x.fillStyle = "#fbbf24"; x.font = "900 60px " + F; x.fillText(String(p.score), col.cx, top - 20);
    });
    if (rk[3]) {
      rr(x, 70, 1048, 940, 112, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(148,163,184,.3)"; x.stroke();
      x.textAlign = "left"; x.fillStyle = "#94a3b8"; x.font = "900 56px " + F; x.fillText("4", 110, 1124);
      x.fillStyle = "#f8fafc"; x.font = "700 44px " + F; x.fillText(fit(x, rk[3].name, 600), 190, 1121);
      x.textAlign = "right"; x.fillStyle = "#fbbf24"; x.font = "900 52px " + F; x.fillText(String(rk[3].score), 970, 1122); x.textAlign = "center";
    }
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fb923c"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#94a3b8"; x.font = "500 28px " + F; x.fillText(new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), W / 2, 1322);
    return c;
  }
  function podiumBlob(cb) { try { (tugOn(R.room) ? drawTugCard(R.room) : drawPodium(R.final, R.room)).toBlob(cb, "image/png"); } catch (e) { toast("Couldn’t create the image"); } }
  function podiumDownload() {
    podiumBlob(function (b) {
      if (!b) { toast("Couldn’t create the image"); return; }
      var u = URL.createObjectURL(b), a = document.createElement("a");
      a.href = u; a.download = (tugOn(R.room) ? "ITI-CONNECT-Power-Clash-" : "ITI-CONNECT-Podium-") + ymd(new Date()) + ".png"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast(tugOn(R.room) ? "Victory card saved" : "Podium card saved");
    });
  }
  function podiumShare() {
    podiumBlob(function (b) {
      if (!b) return;
      var t = tugOn(R.room), f = new File([b], t ? "ITI-CONNECT-Power-Clash.png" : "ITI-CONNECT-Podium.png", { type: "image/png" });
      navigator.share({ files: [f], title: t ? "ITI CONNECT Power Clash" : "ITI CONNECT Quiz Battle", text: t ? tugShareText() : R.final[0].name + " won the Quiz Arena battle!" }).catch(function () { });
    });
  }

  function cfg() {
    var tug = S.battle === "tug";
    return {
      name: S.name || "Player", players: tug ? 2 : S.players, battle: tug ? "tug" : "classic", count: S.count, main: S.main, sub: S.sub, label: catLabel(), secPerQ: SEC_PER_Q,
      questionIds: tug ? tugIds(S) : pick(S).map(function (q) { return q.id; })
    };
  }

  /* =====================================================================
   *  1v1 HIGH-VOLTAGE TUG OF WAR (battleType: "tug")
   * ===================================================================== */
  function tugOn(d) { return !!d && d.battleType === "tug"; }
  function otherOf(d, id) { var k; for (k in d.players) if (k !== id) return k; return ""; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pctOf(d) { return clamp(Math.round(typeof d.rope === "number" ? d.rope : 50), 0, 100); }
  function myPct(d) { var r = pctOf(d); return d.hostId === R.uid ? r : 100 - r; }
  function setT(id, t) { var e = $(id); if (e && e.textContent !== t) e.textContent = t; }

  function tugIds(c) {
    var ids = pick({ main: c.main, sub: c.sub, count: c.count }).map(function (q) { return q.id; });
    return ids.concat(tugExtra(c, ids));
  }
  function tugExtra(c, ids) {
    var used = {}, have = {}, m, pool, ex, out;
    ids.forEach(function (id) { used[id] = 1; });
    if (c.main === "mix") { m = mixPools(); pool = m.a.concat(m.b); } else pool = poolFor(c.main, c.sub);
    ex = shuffle(pool.filter(function (q) { return !used[q.id]; }));
    if (ex.length < TUG_SD) {
      ex.forEach(function (q) { have[q.id] = 1; });
      ex = ex.concat(shuffle(bank.filter(function (q) { return !used[q.id] && !have[q.id]; })));
    }
    out = ex.slice(0, TUG_SD).map(function (q) { return q.id; });
    if (!out.length && ids.length) out = [ids[Math.floor(Math.random() * ids.length)]];
    return out;
  }
  function roomQs() {
    var byId = {};
    baseBank.forEach(function (q) { byId[q.id] = q; });
    custom.items.forEach(function (it) { if (it && !checkQ(it)) byId[it.id] = it; });
    bank.forEach(function (q) { byId[q.id] = q; });
    var qs = (R.room.qIds || []).map(function (id) { return byId[id]; }).filter(Boolean).map(prep);
    return qs.length === (R.room.qIds || []).length ? qs : null;
  }

  function tugCompute(d, forced) {
    var hid = d.hostId, oid = otherOf(d, hid), A = d.players && d.players[hid], B = oid && d.players[oid];
    if (!A || !B) return null;
    var r = d.roundIndex || 0, n = d.questionCount || 0, sd = r >= n;
    var a = A.ans && A.ans.r === r ? A.ans : null, b = B.ans && B.ans.r === r ? B.ans : null;
    var aOk = !!(a && a.ok), bOk = !!(b && b.ok);
    if (!forced && !(a && b) && !(sd && (aOk || bOk))) return null;
    var rope = typeof d.rope === "number" ? d.rope : 50;
    var nA = aOk ? (A.streak || 0) + 1 : 0, nB = bOk ? (B.streak || 0) + 1 : 0;
    var mA = a ? 0 : (A.miss || 0) + 1, mB = b ? 0 : (B.miss || 0) + 1;
    var win = "", pull = 0, od = "", end = "", winner = "", forfeit = "", base = 0;
    if (sd) {
      if (aOk && bOk) win = a.ms <= b.ms ? hid : oid; else if (aOk) win = hid; else if (bOk) win = oid;
      if (win) { end = "sudden"; winner = win; }
    } else {
      if (aOk !== bOk) { win = aOk ? hid : oid; base = TUG_PULL; }
      else if (aOk && bOk) { win = a.ms <= b.ms ? hid : oid; base = TUG_TIE; }
      if (win) {
        var over = (win === hid ? nA : nB) >= 3;
        pull = Math.round(base * (over ? TUG_OVER : 1)); if (over) od = win;
        rope = clamp(rope + (win === hid ? pull : -pull), 0, 100);
      }
    }
    if (!end) {
      if (rope >= 100) { end = "ko"; winner = hid; }
      else if (rope <= 0) { end = "ko"; winner = oid; }
      else if (mA >= TUG_MISS && mB < TUG_MISS) { end = "forfeit"; winner = oid; forfeit = hid; }
      else if (mB >= TUG_MISS && mA < TUG_MISS) { end = "forfeit"; winner = hid; forfeit = oid; }
      else if (mA >= TUG_MISS && mB >= TUG_MISS) { end = rope === 50 ? "draw" : "points"; winner = rope > 50 ? hid : rope < 50 ? oid : ""; }
      else if (!sd && r >= n - 1 && rope !== 50) { end = "points"; winner = rope > 50 ? hid : oid; }
      else if (sd && r + 1 >= (d.qIds || []).length) { end = "draw"; winner = ""; }
    }
    var up = {};
    up["players." + hid + ".streak"] = nA; up["players." + hid + ".miss"] = mA;
    up["players." + oid + ".streak"] = nB; up["players." + oid + ".miss"] = mB;
    up.rope = rope; up.lastRes = { r: r, w: win, pull: pull, od: od, h: aOk, o: bOk, sd: sd };
    if (end) { up.status = "finished"; up.winnerId = winner; up.endReason = end; up.forfeitId = forfeit; up.finishedAt = Date.now(); }
    else { up.roundIndex = r + 1; up.roundStartAt = Date.now() + TUG_FLASH; }
    return { up: up };
  }
  function tugResolve(round, forced) {
    if (!R || !FBR || R.resBusy) return;
    var now = Date.now(); if (forced && now - R.resTry < 1500) return;
    R.resTry = now; R.resBusy = true;
    var r0 = R, F = FBR.F;
    F.runTransaction(FBR.db, function (tx) {
      return tx.get(r0.ref).then(function (s) {
        if (!s.exists()) return null;
        var d = s.data();
        if (d.status !== "playing" || d.battleType !== "tug" || (d.roundIndex || 0) !== round) return null;
        var res = tugCompute(d, forced); if (!res) return null;
        tx.update(r0.ref, res.up); return res;
      });
    }).catch(function () { }).then(function () { r0.resBusy = false; });
  }
  function tugMaybeResolve(d) {
    if (!R || d.status !== "playing") return;
    var r = d.roundIndex || 0;
    if (R.resSched === r || !tugCompute(d, false)) return;
    R.resSched = r; clearTimeout(R.resT);
    R.resT = setTimeout(function () { if (R) tugResolve(r, false); }, R.isHost ? 120 : 700 + Math.random() * 500);
  }
  function tugForfeit() {
    if (!R || !FBR) return;
    var F = FBR.F, ref = R.ref, me = R.uid;
    F.runTransaction(FBR.db, function (tx) {
      return tx.get(ref).then(function (s) {
        if (!s.exists()) return;
        var d = s.data(); if (d.status !== "playing" || d.battleType !== "tug") return;
        tx.update(ref, { status: "finished", winnerId: otherOf(d, me), endReason: "forfeit", forfeitId: me, finishedAt: Date.now() });
      });
    }).catch(function () { });
  }

  function startTug(base) {
    var qs = roomQs();
    if (!qs) { toast("Question bank is out of date — refresh the app"); leaveRoom(); return; }
    G = { tug: true, mp: true, qs: qs, i: 0, round: -1, phase: "wait", locked: false, picked: -1, roundStart: base, shownAt: base, flash: null, paintKey: "", shake: false,
      tick: 0, adv: 0, quitAt: 0, done: false, finishing: false, timeUp: false, jit: Math.random() * 700, log: [] };
    screen = "tug"; renderTug(); tugSync(R.room);
  }
  function tugFlash(d, fin) {
    var lr = d.lastRes, me = R.uid, iWon = !!lr && lr.w === me, t, s, cls;
    if (fin && d.endReason === "forfeit") return { cls: d.winnerId === me ? "me" : "opp", title: d.winnerId === me ? "Opponent left!" : "Match over", sub: "Victory by forfeit" };
    if (fin && d.endReason === "ko") return { cls: d.winnerId === me ? "me" : "opp", title: "K.O.!", sub: d.winnerId === me ? "You maxed out the power bar" : "The opponent maxed out the power bar" };
    if (!lr) return { cls: "blk", title: "Next round", sub: "" };
    if (lr.sd) {
      if (!lr.w) return { cls: "blk", title: "Surge Blocked!", sub: "Nobody scored — another sudden-death question" };
      return { cls: iWon ? "me" : "opp", title: iWon ? "You strike first!" : "They strike first!", sub: "Sudden death decided" };
    }
    if (!lr.w) return { cls: "blk", title: "Surge Blocked!", sub: "No movement this round" };
    cls = iWon ? "me" : "opp";
    t = lr.od ? "Overdrive ×1.5!" : iWon ? "Power surge!" : "Counter-surge!";
    s = (iWon ? "You pulled the core +" : "Opponent pulled the core +") + lr.pull + "%" + (lr.h && lr.o ? " · faster answer" : "");
    return { cls: cls, title: t, sub: s };
  }
  function tugNewRound(d, r) {
    var prev = G.round, recv = Date.now(), rsa = Number(d.roundStartAt) || 0, want = recv + TUG_FLASH, lr = d.lastRes;
    G.round = r; G.locked = false; G.picked = -1; G.paintKey = "";
    if (prev < 0) { G.roundStart = R.base; G.flash = null; tugShowQ(); return; }
    G.roundStart = Math.abs(rsa - want) <= 600 ? rsa : want;
    G.phase = "wait"; G.flash = tugFlash(d, false);
    if (lr && lr.od) {
      G.shake = true;
      if (lr.od === R.uid) { sfx("six"); try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { } }
    }
  }
  function tugSync(d) {
    if (!G || !G.tug || !R) return;
    var r = d.roundIndex || 0;
    if (d.status === "playing" && G.round !== r) tugNewRound(d, r);
    if (d.status === "finished") { G.phase = "wait"; G.flash = tugFlash(d, true); G.paintKey = ""; }
    tugPaint(); tugMaybeResolve(d);
  }
  function tugShowQ() {
    if (!G || !G.tug) return;
    G.phase = "q"; G.locked = false; G.picked = -1; G.shownAt = G.roundStart; G.paintKey = "";
    tugPaintCard(); tugStatus();
  }
  function tugAnswer(k) {
    if (!G || !G.tug || G.done || G.finishing || G.locked || G.phase !== "q" || !R || !R.room) return;
    var q = G.qs[G.round]; if (!q || !q.o[k]) return;
    G.locked = true; G.picked = k;
    var ok = !!q.o[k].ok, ms = Math.max(0, Date.now() - G.shownAt), up = {}, F = FBR.F, ref = R.ref;
    sfx(ok ? "move" : "error");
    up["players." + R.uid + ".ans"] = { r: G.round, k: k, ok: ok, ms: ms };
    F.updateDoc(ref, up).catch(function () { setTimeout(function () { F.updateDoc(ref, up).catch(function () { }); }, 900); });
    G.paintKey = ""; tugPaintCard(); tugStatus();
  }
  function tugTick() {
    if (!R) return;
    if (!root || !document.body.contains(root)) {
      clearInterval(R.watch);
      if (G && G.tug && !G.done && R.room && R.room.status === "playing") tugForfeit();
      teardown(); return;
    }
    if (!G || !G.tug || G.round < 0 || G.done || G.finishing || !R.room || R.room.status !== "playing") return;
    var now = Date.now(), end = G.roundStart + TUG_SEC * 1000, rem = end - now, chip = $("qa-timechip"), bar = $("qa-ttbar"), tt = $("qa-tt");
    if (G.phase === "wait" && now >= G.roundStart) tugShowQ();
    if (G.phase === "q") {
      setT("qa-ttime", String(Math.max(0, Math.ceil(rem / 1000))));
      if (bar) bar.style.width = clamp(rem / (TUG_SEC * 1000) * 100, 0, 100) + "%";
      if (chip) chip.classList.toggle("low", rem <= 3000);
      if (tt) tt.classList.toggle("low", rem <= 3000);
      if (rem <= 0 && !G.locked) { G.locked = true; G.paintKey = ""; tugPaintCard(); tugStatus(); }
    } else {
      setT("qa-ttime", String(TUG_SEC)); if (bar) bar.style.width = "100%"; if (chip) chip.classList.remove("low"); if (tt) tt.classList.remove("low");
    }
    if (now - end >= (R.isHost ? 1500 : 2400 + G.jit)) tugResolve(G.round, true);
  }
  function onTugFinished(d) {
    clearInterval(R.watch); clearTimeout(R.endT); clearTimeout(R.resT);
    R.final = rankList(d);
    if (screen === "mresult") { render(); return; }
    if (G && G.tug && !G.done && screen === "tug") {
      if (!G.finishing) { G.finishing = true; tugSync(d); clearTimeout(R.tugEndT); R.tugEndT = setTimeout(tugToResult, 2000); }
      return;
    }
    tugToResult();
  }
  function tugToResult() {
    if (!R || screen === "mresult") return;
    R.tugEndT = 0; if (G && G.tug) stopGame();
    bumpStreak(); sfx("win"); screen = "mresult"; render();
  }

  function renderTug() {
    var h = '<div class="qa-wrap"><div class="qa-hud">' +
      '<button type="button" class="qa-ic btn-tap" data-a="quit" aria-label="Forfeit and leave">' + ico("x") + "</button>" +
      '<div class="qa-chip amb">' + ico("zap") + '<span id="qa-trdt">Round 1</span></div>' +
      '<div class="qa-chip" id="qa-timechip">' + ico("clock") + '<span id="qa-ttime">' + TUG_SEC + "</span></div></div>" +
      '<div class="qa-glass qa-tug" id="qa-tug">' +
      '<div class="qa-tug-h">' +
      '<div class="qa-te l"><div class="qa-tn" id="qa-tnl"></div><div class="qa-tp" id="qa-tpl">50%</div><div class="qa-tsub" id="qa-tsl"></div></div>' +
      '<div class="qa-te r"><div class="qa-tn" id="qa-tnr"></div><div class="qa-tp" id="qa-tpr">50%</div><div class="qa-tsub" id="qa-tsr"></div></div></div>' +
      '<div class="qa-beamw"><div class="qa-beam"><div class="qa-bl" id="qa-bl" style="width:50%"></div><div class="qa-br" id="qa-br" style="width:50%"></div>' +
      '<i class="qa-mk" style="left:20%"></i><i class="qa-mk" style="left:80%"></i></div>' +
      '<div class="qa-lane"><div class="qa-core" id="qa-core" style="left:50%"></div></div></div></div>' +
      '<div class="qa-tt" id="qa-tt"><i id="qa-ttbar"></i></div>' +
      '<div class="qa-glass qa-card qa-nosel" id="qa-tcard"></div>' +
      '<div class="qa-opts qa-nosel" id="qa-topts"></div>' +
      '<div class="text-xs qa-t2 text-center mt-3 font-semibold" id="qa-tstat" style="min-height:1rem"></div></div>';
    view.innerHTML = h; icons(); G.paintKey = ""; tugPaint();
  }
  function streakTxt(n) { return n >= 2 ? "⚡ ×1.5 ready" : n === 1 ? "🔥 1 streak" : ""; }
  function tugPaint() {
    if (!G || !G.tug || !R || !R.room || !$("qa-tug")) return;
    var d = R.room, me = d.players[R.uid] || {}, op = d.players[otherOf(d, R.uid)] || {}, n = d.questionCount || 0;
    setT("qa-trdt", G.round >= n && G.round > -1 ? "Sudden Death" : "Round " + Math.max(1, Math.min(G.round + 1, n)) + " / " + n);
    setT("qa-tnl", me.name || "You"); setT("qa-tnr", op.name || "Opponent");
    setT("qa-tsl", streakTxt(me.streak || 0)); setT("qa-tsr", streakTxt(op.streak || 0));
    tugPaintBeam(d); tugPaintCard(); tugStatus();
  }
  function tugPaintBeam(d) {
    var my = myPct(d), l = $("qa-bl"), r = $("qa-br"), c = $("qa-core"), t = $("qa-tug");
    if (l) l.style.width = my + "%"; if (r) r.style.width = (100 - my) + "%"; if (c) c.style.left = my + "%";
    setT("qa-tpl", my + "%"); setT("qa-tpr", (100 - my) + "%");
    if (t) { t.classList.toggle("crit-l", my <= 20); t.classList.toggle("crit-r", my >= 80); }
  }
  function tugPaintCard() {
    var card = $("qa-tcard"), opts = $("qa-topts"); if (!card || !opts || !G) return;
    var key = G.phase + "|" + G.round + "|" + G.picked + "|" + (G.locked ? 1 : 0) + "|" + (G.flash ? G.flash.title : "");
    if (key !== G.paintKey) {
      G.paintKey = key;
      if (G.phase === "q" && G.qs[G.round]) {
        var q = G.qs[G.round], done = G.locked || G.picked > -1;
        card.innerHTML = '<div class="qa-qtag">' + esc(q.tag || "Power Clash") + '</div><p class="qa-q">' + esc(q.q) + "</p>";
        opts.innerHTML = q.o.map(function (o, k) {
          var cls = "qa-opt btn-tap", lt = "ABCD".charAt(k);
          if (done) {
            if (o.ok) { cls += " qa-ok"; lt = "✓"; }
            else if (k === G.picked) { cls += " qa-bad"; lt = "✕"; }
            else { cls += " qa-dim"; }
          }
          return '<button type="button" class="' + cls + '" data-a="opt" data-k="' + k + '"' + (done ? " disabled" : "") + '><span class="qa-let">' + lt + "</span><span>" + esc(o.t) + "</span></button>";
        }).join("");
      } else {
        var f = G.flash || { cls: "blk", title: "Get ready…", sub: "" };
        card.innerHTML = '<div class="qa-fl ' + f.cls + '"><b>' + esc(f.title) + "</b>" + (f.sub ? "<span>" + esc(f.sub) + "</span>" : "") + "</div>";
        opts.innerHTML = "";
      }
    }
    if (G.shake) {
      G.shake = false; card.classList.remove("qa-shake"); void card.offsetWidth; card.classList.add("qa-shake");
      setTimeout(function () { var c = $("qa-tcard"); if (c) c.classList.remove("qa-shake"); }, 500);
    }
  }
  function tugStatus() {
    var el = $("qa-tstat"); if (!el || !G || !R || !R.room) return;
    var d = R.room, op = d.players[otherOf(d, R.uid)], answered = !!(op && op.ans && op.ans.r === G.round), t = "";
    if (!G.finishing && G.phase === "q") {
      if (G.picked > -1) t = answered ? "Both locked in — resolving…" : "Locked in · waiting for opponent…";
      else if (G.locked) t = "Time’s up!";
      else t = G.round >= d.questionCount ? "Sudden death — first correct answer wins!" : "Faster answer wins ties · 3 in a row = ×1.5 pull";
    }
    el.textContent = t;
  }

  function renderTugResult() {
    var d = R.room, me = R.uid, oid = otherOf(d, me), my = myPct(d), won = d.winnerId === me, draw = !d.winnerId, why = d.endReason, line, badge;
    var mn = d.players[me] ? d.players[me].name : "You", on = d.players[oid] ? d.players[oid].name : "Opponent";
    var hostGone = !!d.forfeitId && d.forfeitId === d.hostId && !R.isHost;
    if (why === "ko") line = "Knockout — the power bar maxed out";
    else if (why === "points") line = "Won on points when the questions ran out";
    else if (why === "sudden") line = "Decided in sudden death";
    else if (why === "forfeit") line = (d.forfeitId === me ? "You" : (d.players[d.forfeitId] ? d.players[d.forfeitId].name : "Opponent")) + " left the clash";
    else line = "No winner — dead heat";
    badge = draw ? "🤝 Dead heat" : won ? "🏆 You won!" : "⚡ " + esc(on) + " wins";
    var h = '<div class="qa-wrap"><div class="qa-glass qa-res-hero">' +
      '<div class="qa-lbl">1V1 POWER CLASH</div>' +
      '<div class="text-xs qa-t2 mt-1 font-semibold">' + esc(d.categoryLabel) + "</div>" +
      '<div class="qa-vs mt-3"><span class="a">' + my + '%</span><span class="v">vs</span><span class="b">' + (100 - my) + "%</span></div>" +
      '<div class="flex justify-between gap-3 mt-1 text-xs font-extrabold"><span class="truncate min-w-0" style="color:var(--tgat);max-width:46%">' + esc(mn) + ' (You)</span><span class="truncate min-w-0" style="color:var(--tgbt);max-width:46%">' + esc(on) + "</span></div>" +
      '<div class="qa-beamw" style="margin-top:8px"><div class="qa-beam"><div class="qa-bl" style="width:' + my + '%"></div><div class="qa-br" style="width:' + (100 - my) + '%"></div></div>' +
      '<div class="qa-lane"><div class="qa-core" style="left:' + my + '%"></div></div></div>' +
      '<div class="mt-4"><span class="qa-win' + (won ? "" : " lose") + '">' + badge + "</span></div>" +
      '<div class="text-xs qa-t2 mt-2 font-semibold">' + esc(line) + "</div></div>";
    h += '<div class="mt-4 grid gap-2.5">';
    if (R.isHost && !R.closed) h += '<button type="button" class="qa-cta btn-tap" data-a="rematch"' + (busy ? " disabled" : "") + ">" + ico("rotate-ccw") + "Rematch (New Questions)</button>";
    else if (!R.closed) h += '<div class="text-xs qa-t2 text-center font-semibold">' + (hostGone ? "The host left — leave to start a new room" : "Waiting for host to start a rematch…") + "</div>";
    h += '<div class="grid ' + (canShareFiles() ? "grid-cols-2" : "grid-cols-1") + ' gap-2">' +
      '<button type="button" class="qa-sec btn-tap" data-a="mdl">' + ico("download") + "Save Card</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="mshare">' + ico("share-2") + "Share</button>" : "") +
      '</div>' +
      '<button type="button" class="qa-sec btn-tap" data-a="leave">' + ico("log-out") + "Leave Room</button></div></div>";
    view.innerHTML = h; icons();
  }

  function drawTugCard(d) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var hid = d.hostId, oid = otherOf(d, hid), rope = pctOf(d), winG = !!d.winnerId && d.winnerId === oid;
    var lid = winG ? oid : hid, rid = winG ? hid : oid, lp = winG ? 100 - rope : rope, rp = 100 - lp;
    var ln = d.players[lid] ? d.players[lid].name : "Player", rn = d.players[rid] ? d.players[rid].name : "Opponent";
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1020"); g.addColorStop(1, "#1e1612"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var g1 = x.createRadialGradient(250, 700, 10, 250, 700, 560); g1.addColorStop(0, "rgba(249,115,22,.28)"); g1.addColorStop(1, "rgba(249,115,22,0)"); x.fillStyle = g1; x.fillRect(0, 0, W, H);
    var g2 = x.createRadialGradient(830, 700, 10, 830, 700, 560); g2.addColorStop(0, "rgba(34,211,238,.22)"); g2.addColorStop(1, "rgba(34,211,238,0)"); x.fillStyle = g2; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fb923c"; x.font = "800 40px " + F; x.fillText("POWER CLASH", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "4px";
    x.fillStyle = "#94a3b8"; x.font = "700 28px " + F; x.fillText("1V1 TUG OF WAR", W / 2, 170);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f8fafc"; x.font = "900 104px " + F; x.fillText(d.winnerId ? "VICTORY" : "DEAD HEAT", W / 2, 330);
    x.fillStyle = "#fbbf24"; x.font = "700 54px " + F;
    x.fillText(fit(x, d.winnerId ? (d.players[d.winnerId] ? d.players[d.winnerId].name : "Player") + " wins!" : "Neither side gave way", 900), W / 2, 410);
    x.fillStyle = "#94a3b8"; x.font = "500 32px " + F; x.fillText(fit(x, String(d.categoryLabel || "") + " · " + d.questionCount + " Qs", 900), W / 2, 466);
    x.font = "900 170px " + F; x.fillStyle = "#fbbf24"; x.fillText(lp + "%", 270, 700);
    x.fillStyle = "#22d3ee"; x.fillText(rp + "%", 810, 700);
    x.fillStyle = "#94a3b8"; x.font = "800 44px " + F; x.fillText("VS", W / 2, 670);
    x.font = "700 42px " + F; x.fillStyle = "#fde68a"; x.fillText(fit(x, ln, 440), 270, 772);
    x.fillStyle = "#67e8f9"; x.fillText(fit(x, rn, 440), 810, 772);
    var bx = 100, bw = 880, by = 840, bh = 46, sx = bx + bw * lp / 100, cy = by + bh / 2;
    x.save(); rr(x, bx, by, bw, bh, 23); x.clip();
    x.fillStyle = "rgba(148,163,184,.22)"; x.fillRect(bx, by, bw, bh);
    var ga = x.createLinearGradient(bx, 0, Math.max(sx, bx + 1), 0); ga.addColorStop(0, "#f97316"); ga.addColorStop(1, "#fbbf24"); x.fillStyle = ga; x.fillRect(bx, by, sx - bx, bh);
    var gb = x.createLinearGradient(Math.min(sx, bx + bw - 1), 0, bx + bw, 0); gb.addColorStop(0, "#22d3ee"); gb.addColorStop(1, "#0891b2"); x.fillStyle = gb; x.fillRect(sx, by, bx + bw - sx, bh);
    x.restore();
    x.save(); x.shadowColor = "rgba(255,255,255,.95)"; x.shadowBlur = 44;
    var cg = x.createRadialGradient(sx, cy, 2, sx, cy, 40); cg.addColorStop(0, "#ffffff"); cg.addColorStop(.35, "#fef3c7"); cg.addColorStop(.62, "rgba(249,115,22,.9)"); cg.addColorStop(1, "rgba(34,211,238,0)");
    x.fillStyle = cg; x.beginPath(); x.arc(sx, cy, 40, 0, Math.PI * 2); x.fill(); x.restore();
    x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 4; x.lineCap = "round";
    [35, -35].forEach(function (deg) { var a = deg * Math.PI / 180; x.beginPath(); x.moveTo(sx - Math.cos(a) * 52, cy - Math.sin(a) * 52); x.lineTo(sx + Math.cos(a) * 52, cy + Math.sin(a) * 52); x.stroke(); });
    var rs = { ko: "K.O.", points: "POINTS", sudden: "SUDDEN", forfeit: "FORFEIT", draw: "DRAW" }[d.endReason] || "—";
    var stats = [["RESULT", rs], ["ROUNDS", String(d.lastRes ? d.lastRes.r + 1 : 0)], ["MARGIN", Math.abs(lp - rp) + "%"]];
    stats.forEach(function (s, i) {
      var sbx = 70 + i * 322, sby = 1000, sbw = 296, sbh = 140;
      rr(x, sbx, sby, sbw, sbh, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(148,163,184,.3)"; x.stroke();
      x.fillStyle = "#f8fafc"; x.font = "800 52px " + F; x.fillText(fit(x, s[1], sbw - 30), sbx + sbw / 2, sby + 70);
      x.fillStyle = "#94a3b8"; x.font = "700 26px " + F; x.fillText(s[0], sbx + sbw / 2, sby + 112);
    });
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fb923c"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#94a3b8"; x.font = "500 28px " + F; x.fillText(new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), W / 2, 1322);
    return c;
  }
  function tugShareText() {
    var d = R.room, w = d.winnerId && d.players[d.winnerId] ? d.players[d.winnerId].name : "";
    return (w ? w + " won" : "It ended in a dead heat in") + " a 1v1 Power Clash on ITI CONNECT Quiz Arena (" + myPct(d) + "% vs " + (100 - myPct(d)) + "%)!";
  }

  /* ---------- custom questions: Firestore quiz_meta/custom_questions ---------- */
  var CAT = [
    ["iti", "y1", "ITI Trade · 1st Year"], ["iti", "y2", "ITI Trade · 2nd Year"],
    ["iti", "wcs", "ITI · Workshop Calc & Science"], ["iti", "draw", "ITI · Engineering Drawing"], ["iti", "safe", "ITI · Safety & Tools"],
    ["sci", "phy", "Science · Physics"], ["sci", "chem", "Science · Chemistry"], ["sci", "bio", "Science · Biology"],
    ["gs", "his", "GS · History"], ["gs", "geo", "GS · Geography"], ["gs", "pol", "GS · Polity & Static"], ["gs", "eco", "GS · Indian Economy"], ["gs", "comp", "GS · Computer Basics"],
    ["apt", "math", "Aptitude · Maths"], ["apt", "eng", "Aptitude · English"], ["apt", "reason", "Aptitude · Reasoning"]
  ];
  var GROUPS = { iti: ["y1", "y2", "wcs", "draw", "safe"], sci: ["phy", "chem", "bio"], gs: ["his", "geo", "pol", "eco", "comp"], apt: ["math", "eng", "reason"] };
  var CQ_MAX_BYTES = 900000;

  function checkQ(q) {
    var i, low = [];
    if (!q || typeof q !== "object") return "not a question object";
    if (!GROUPS[q.group]) return "group must be iti, sci, gs or apt";
    if (GROUPS[q.group].indexOf(q.sub) < 0) return "sub “" + q.sub + "” is not valid for group " + q.group;
    if (typeof q.q !== "string" || !q.q.trim()) return "question text is empty";
    if (q.q.length > 400) return "question is over 400 characters";
    if (!Array.isArray(q.opts) || q.opts.length !== 4) return "needs exactly 4 options";
    for (i = 0; i < 4; i++) {
      if (typeof q.opts[i] !== "string" || !q.opts[i].trim()) return "option " + "ABCD".charAt(i) + " is empty";
      if (q.opts[i].length > 150) return "option " + "ABCD".charAt(i) + " is over 150 characters";
      low.push(q.opts[i].trim().toLowerCase());
    }
    for (i = 0; i < 4; i++) if (low.indexOf(low[i]) !== i) return "two options are identical";
    if (q.ans !== 0 && q.ans !== 1 && q.ans !== 2 && q.ans !== 3) return "correct answer must be A–D";
    return "";
  }
  function normQ(s) { return String(s).toLowerCase().replace(/\s+/g, " ").trim(); }
  function dupOf(text, exceptId) {
    var n = normQ(text), i;
    for (i = 0; i < bank.length; i++) if (bank[i].id !== exceptId && normQ(bank[i].q) === n) return bank[i].id;
    return 0;
  }
  function rebuildBank() {
    var map = {}, order = [], has = Object.prototype.hasOwnProperty;
    baseBank.forEach(function (q) { map[q.id] = q; order.push(q.id); });
    custom.items.forEach(function (it) {
      if (!it || typeof it.id !== "number") return;
      var seen = has.call(map, it.id);
      if (it.deleted) { map[it.id] = null; if (!seen) order.push(it.id); return; }
      if (checkQ(it)) return;
      var prev = seen ? map[it.id] : null;
      map[it.id] = { id: it.id, group: it.group, sub: it.sub, q: it.q, opts: it.opts.slice(), ans: it.ans };
      if (prev && prev.mod && prev.sub === it.sub) map[it.id].mod = prev.mod;
      if (!seen) order.push(it.id);
    });
    bank = order.map(function (id) { return map[id]; }).filter(Boolean);
  }
  function nextId(items) {
    var m = 1000;
    baseBank.forEach(function (q) { if (q.id > m && q.id < EXTRA_ID_MIN) m = q.id; });
    items.forEach(function (it) { if (it && typeof it.id === "number" && it.id > m) m = it.id; });
    return m + 1;
  }
  function readCachedCustom() {
    try {
      var d = JSON.parse(ls(LS.custom));
      if (d && Array.isArray(d.items)) custom = { updatedAt: Number(d.updatedAt) || 0, items: d.items.filter(function (it) { return it && typeof it.id === "number"; }) };
    } catch (e) { }
  }
  function applyCustom(d) {
    var items = d && Array.isArray(d.items) ? d.items.filter(function (it) { return it && typeof it.id === "number"; }) : [];
    custom = { updatedAt: Number(d && d.updatedAt) || 0, items: items };
    lsSet(LS.custom, JSON.stringify(custom));
    if (baseBank.length) { rebuildBank(); bankState = bank.length ? "ok" : "error"; ensureCount(); }
    var ae = document.activeElement, typing = ae && root && root.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
    if (screen === "admin") renderAdmin(); else if (screen === "setup" && !typing) renderSetup();
  }
  function syncCustom() {
    if (!online()) return;
    var t = new Promise(function (_, no) { setTimeout(function () { no(new Error("timeout")); }, 8000); });
    var rd = fbCore().then(function (c) { return c.F.getDoc(c.F.doc(c.db, "quiz_meta", "custom_questions")); })
      .then(function (s) { return s.exists() ? s.data() : { updatedAt: 0, items: [] }; });
    Promise.race([rd, t]).then(applyCustom).catch(function () { });
  }
  function writeCustom(mutate) {
    if (!online()) return Promise.reject({ code: "offline" });
    return fbCore().then(function (c) {
      return import(FB_V + "firebase-auth.js").then(function (U) {
        var auth = U.getAuth(c.app);
        return (auth.authStateReady ? auth.authStateReady() : Promise.resolve()).then(function () {
          var u = auth.currentUser;
          if (!u || !u.email || u.isAnonymous) throw { code: "need-admin" };
          var ref = c.F.doc(c.db, "quiz_meta", "custom_questions");
          return c.F.runTransaction(c.db, function (tx) {
            return tx.get(ref).then(function (s) {
              var cur = s.exists() && Array.isArray(s.data().items) ? s.data().items : [];
              var doc = { updatedAt: Date.now(), items: mutate(cur) };
              if (JSON.stringify(doc).length > CQ_MAX_BYTES) throw { code: "too-big" };
              tx.set(ref, doc); return doc;
            });
          });
        });
      });
    });
  }
  function adFail(e) {
    var c = (e && e.code) || "";
    if (c === "offline") toast("Connect to the internet to save");
    else if (c === "need-admin" || c === "permission-denied") toast("Sign in with the admin Google account (Admin settings) — PIN unlock can’t write to Firestore");
    else if (c === "too-big") toast("Custom question list is full (1 MB limit)");
    else toast("Couldn’t save. Check your connection and try again.");
  }

  /* ---------- admin panel ---------- */
  function adminOn() {
    var els = document.querySelectorAll(".admin-only"), i;
    for (i = 0; i < els.length; i++) if (!root.contains(els[i])) return !els[i].classList.contains("hidden");
    return false;
  }
  function emptyForm(cat) { return { id: 0, cat: cat || "iti|y1", q: "", o: ["", "", "", ""], ans: 0 }; }
  function openAdmin() {
    if (!adminOn()) { toast("Admin only"); return; }
    if (bankState !== "ok") { toast("Questions are still loading"); return; }
    AD = AD || { mode: "single", form: emptyForm(), bulk: { cat: "iti|y1", text: "", parsed: null }, search: "", scope: "custom", del: 0, delT: 0, busy: false };
    screen = "admin"; render();
  }
  function adGuard() {
    if (AD && adminOn()) return true;
    toast("Admin session locked"); screen = "setup"; render(); return false;
  }
  function catSel(attr, val) {
    return '<select class="qa-in" data-f="' + attr + '">' + CAT.map(function (c) {
      var v = c[0] + "|" + c[1]; return '<option value="' + v + '"' + (v === val ? " selected" : "") + ">" + esc(c[2]) + "</option>";
    }).join("") + "</select>";
  }
  function renderAdmin() {
    var nCus = custom.items.filter(function (it) { return !it.deleted; }).length, nDel = custom.items.length - nCus, f = AD.form, h;
    h = '<div class="qa-wrap"><div class="qa-hud"><button type="button" class="qa-ic btn-tap" data-a="adback" aria-label="Back">' + ico("arrow-left") + '</button>' +
      '<div class="text-base font-extrabold">Manage Questions</div><div style="width:36px"></div></div>' +
      '<div class="text-xs qa-t2 text-center mt-2 font-semibold">' + baseBank.length + " base · " + nCus + " custom · " + nDel + " hidden · " + bank.length + " active</div>" +
      '<div class="qa-row mt-3">' + [["single", "Add / Edit"], ["bulk", "Bulk Add"], ["list", "Custom List"]].map(function (m) { return pill("admode", m[0], m[1], AD.mode === m[0], false); }).join("") + "</div>";
    if (AD.mode === "single") {
      h += '<div class="qa-glass p-3.5 mt-3 space-y-2.5">' +
        (f.id ? '<div class="flex items-center justify-between"><span class="qa-qtag">Editing #' + f.id + '</span><button type="button" class="qa-pill btn-tap" data-a="adcancel">Cancel edit</button></div>' : "") +
        '<div><div class="qa-lbl" style="margin-bottom:5px">Category</div>' + catSel("cat", f.cat) + '</div>' +
        '<div><div class="qa-lbl" style="margin-bottom:5px">Question</div><textarea class="qa-in" rows="3" maxlength="400" data-f="q" placeholder="Type the question">' + esc(f.q) + "</textarea></div>" +
        '<div><div class="qa-lbl" style="margin-bottom:5px">Options</div>' + [0, 1, 2, 3].map(function (i) {
          return '<div class="flex items-center gap-2 mt-2"><span class="qa-let">' + "ABCD".charAt(i) + '</span><input class="qa-in" type="text" maxlength="150" data-f="o' + i + '" placeholder="Option ' + "ABCD".charAt(i) + '" value="' + esc(f.o[i]) + '"></div>';
        }).join("") + '</div>' +
        '<div><div class="qa-lbl" style="margin-bottom:5px">Correct Answer</div><div class="qa-row">' + [0, 1, 2, 3].map(function (i) { return pill("adans", i, "Option " + "ABCD".charAt(i), f.ans === i, false); }).join("") + "</div></div></div>" +
        '<button type="button" class="qa-cta btn-tap mt-3" data-a="adsave"' + (AD.busy ? " disabled" : "") + ">" + ico("save") + (f.id ? "Update Question" : "Save Question") + "</button>";
    } else if (AD.mode === "bulk") {
      h += '<div class="qa-glass p-3.5 mt-3"><div class="qa-lbl" style="margin-bottom:5px">Bulk Default Category</div>' + catSel("bcat", AD.bulk.cat) +
        '<div class="text-xs qa-t2 mt-2">Used when an item has no group / sub. Paste either format:</div>' +
        '<pre class="qa-pre">Quick lines (one per line):\nQuestion | Option A | Option B | Option C | Option D | C\n(correct = A–D or 1–4)\n\nJSON array:\n[{"q":"…","opts":["a","b","c","d"],"ans":2}]\n(group, sub optional · ans = 0–3)</pre>' +
        '<textarea class="qa-in" rows="8" data-f="btext" spellcheck="false" placeholder="Paste questions here" style="font-family:ui-monospace,Menlo,monospace;font-size:12.5px">' + esc(AD.bulk.text) + "</textarea>" +
        '<div class="grid grid-cols-2 gap-2 mt-3"><button type="button" class="qa-sec btn-tap" data-a="adparse">' + ico("list-checks") + 'Validate</button>' +
        '<button type="button" class="qa-sec btn-tap" data-a="adclear">' + ico("eraser") + "Clear</button></div></div>" +
        '<div id="ad-bres">' + bulkResHtml() + "</div>";
    } else {
      h += '<div class="qa-row mt-3">' + [["custom", "Custom"], ["deleted", "Hidden"], ["all", "All Questions"]].map(function (m) { return pill("adscope", m[0], m[1], AD.scope === m[0], false); }).join("") + "</div>" +
        '<input class="qa-in mt-2" type="search" data-f="search" placeholder="Search text or ID…" value="' + esc(AD.search) + '">' +
        '<div id="ad-list" class="grid gap-2 mt-3">' + adRowsHtml() + "</div>";
    }
    h += "</div>";
    view.innerHTML = h; icons();
  }
  function adField(f, v) {
    var b = AD && AD.bulk;
    if (!AD) return;
    if (f === "cat") AD.form.cat = v;
    else if (f === "q") AD.form.q = v;
    else if (/^o[0-3]$/.test(f)) AD.form.o[+f.charAt(1)] = v;
    else if (f === "bcat") { b.cat = v; b.parsed = null; var r1 = $("ad-bres"); if (r1) r1.innerHTML = ""; }
    else if (f === "btext") { b.text = v; if (b.parsed) { b.parsed = null; var r2 = $("ad-bres"); if (r2) r2.innerHTML = ""; } }
    else if (f === "search") { AD.search = v; renderAdList(); }
  }

  function adSave() {
    if (!adGuard() || AD.busy) return;
    var f = AD.form, cp = f.cat.split("|"), item = { group: cp[0], sub: cp[1], q: f.q.trim(), opts: f.o.map(function (s) { return s.trim(); }), ans: f.ans }, err = checkQ(item), d;
    if (err) { toast(err.charAt(0).toUpperCase() + err.slice(1)); return; }
    d = dupOf(item.q, f.id); if (d) { toast("Same question already exists (#" + d + ")"); return; }
    AD.busy = true; var savedId = f.id, newId = 0; toast("Saving…");
    writeCustom(function (cur) {
      var items = cur.slice(), id = savedId || nextId(items), idx = -1, i;
      for (i = 0; i < items.length; i++) if (items[i].id === id) idx = i;
      newId = id; item.id = id;
      if (idx >= 0) items[idx] = item; else items.push(item);
      return items;
    }).then(function (doc) {
      applyCustom(doc); AD.form = emptyForm(f.cat); toast(savedId ? "Question #" + newId + " updated" : "Question saved as #" + newId);
    }).catch(adFail).then(function () { AD.busy = false; if (screen === "admin") renderAdmin(); });
  }
  function adEdit(id) {
    var q = bank.filter(function (x) { return x.id === id; })[0];
    if (!q) { toast("Question not found"); return; }
    AD.form = { id: id, cat: q.group + "|" + q.sub, q: q.q, o: q.opts.slice(), ans: q.ans };
    AD.mode = "single"; renderAdmin(); window.scrollTo(0, 0);
  }

  function ansLetter(s) {
    s = String(s).trim();
    if (/^[A-Da-d]$/.test(s)) return "abcd".indexOf(s.toLowerCase());
    if (/^[1-4]$/.test(s)) return +s - 1;
    return -1;
  }
  function parseBulk(text, defCat) {
    var dc = defCat.split("|"), ok = [], bad = [], cands = [], t = String(text).trim(), seen = {}, i;
    if (!t) return { ok: [], bad: [{ n: "Input", why: "nothing pasted yet" }] };
    if (t.charAt(0) === "[") {
      var arr;
      try { arr = JSON.parse(t); } catch (e) { return { ok: [], bad: [{ n: "JSON", why: "invalid JSON — " + e.message }] }; }
      if (!Array.isArray(arr)) return { ok: [], bad: [{ n: "JSON", why: "must be an array [ … ]" }] };
      arr.forEach(function (it, k) {
        if (!it || typeof it !== "object") { bad.push({ n: "Item " + (k + 1), why: "not an object" }); return; }
        var a = it.ans;
        if (typeof a === "string") a = /^[A-Da-d]$/.test(a.trim()) ? "abcd".indexOf(a.trim().toLowerCase()) : -1;
        cands.push({ n: "Item " + (k + 1), c: { group: it.group || dc[0], sub: it.sub || dc[1], q: it.q, opts: it.opts, ans: a } });
      });
    } else {
      t.split(/\r?\n/).forEach(function (line, k) {
        if (!line.trim()) return;
        var p = line.split("|").map(function (s) { return s.trim(); }), a;
        if (p.length !== 6) { bad.push({ n: "Line " + (k + 1), why: "expected 6 parts separated by |, found " + p.length }); return; }
        a = ansLetter(p[5]);
        if (a < 0) { bad.push({ n: "Line " + (k + 1), why: "correct answer must be A–D or 1–4" }); return; }
        cands.push({ n: "Line " + (k + 1), c: { group: dc[0], sub: dc[1], q: p[0], opts: p.slice(1, 5), ans: a } });
      });
    }
    for (i = 0; i < cands.length; i++) {
      var c = cands[i].c, err = checkQ(c), d;
      if (err) { bad.push({ n: cands[i].n, why: err }); continue; }
      c.q = c.q.trim(); c.opts = c.opts.map(function (s) { return s.trim(); });
      d = dupOf(c.q, 0);
      if (d) { bad.push({ n: cands[i].n, why: "already exists as #" + d }); continue; }
      if (seen[normQ(c.q)]) { bad.push({ n: cands[i].n, why: "duplicate inside this paste" }); continue; }
      seen[normQ(c.q)] = 1; ok.push({ group: c.group, sub: c.sub, q: c.q, opts: c.opts, ans: c.ans });
    }
    return { ok: ok, bad: bad };
  }
  function bulkResHtml() {
    var r = AD && AD.bulk.parsed, h;
    if (!r) return "";
    h = '<div class="qa-glass p-3 mt-3"><div class="font-extrabold"><span style="color:var(--qa-okc)">✓ ' + r.ok.length + ' valid</span> · <span style="color:' + (r.bad.length ? "var(--qa-bdc)" : "var(--qa-t2)") + '">✗ ' + r.bad.length + " problem" + (r.bad.length === 1 ? "" : "s") + "</span></div>";
    r.bad.slice(0, 15).forEach(function (b) { h += '<div class="text-xs mt-1"><b>' + esc(b.n) + ":</b> " + esc(b.why) + "</div>"; });
    if (r.bad.length > 15) h += '<div class="text-xs qa-t2 mt-1">…and ' + (r.bad.length - 15) + " more</div>";
    r.ok.slice(0, 3).forEach(function (c) { h += '<div class="text-xs qa-t2 mt-2">' + esc(TAGS[c.sub] || c.sub) + " — " + esc(c.q) + " → <b>" + esc(c.opts[c.ans]) + "</b></div>"; });
    if (r.ok.length) h += '<button type="button" class="qa-cta btn-tap mt-3" data-a="adbulksave"' + (AD.busy ? " disabled" : "") + ">" + ico("cloud-upload") + "Save " + r.ok.length + " question" + (r.ok.length === 1 ? "" : "s") + "</button>" +
      (r.bad.length ? '<div class="text-xs qa-t2 mt-2 text-center">Problem items are skipped.</div>' : "");
    return h + "</div>";
  }
  function adParse() {
    if (!adGuard()) return;
    AD.bulk.parsed = parseBulk(AD.bulk.text, AD.bulk.cat);
    var el = $("ad-bres"); if (el) { el.innerHTML = bulkResHtml(); icons(); }
  }
  function adBulkSave() {
    if (!adGuard() || AD.busy || !AD.bulk.parsed || !AD.bulk.parsed.ok.length) return;
    var list = AD.bulk.parsed.ok.slice(), first = 0, last2 = 0;
    AD.busy = true; toast("Saving " + list.length + " questions…");
    writeCustom(function (cur) {
      var items = cur.slice(), id = nextId(items);
      first = id;
      list.forEach(function (c) { items.push({ id: id++, group: c.group, sub: c.sub, q: c.q, opts: c.opts, ans: c.ans }); });
      last2 = id - 1; return items;
    }).then(function (doc) {
      applyCustom(doc); AD.bulk.text = ""; AD.bulk.parsed = null;
      toast("Added " + list.length + " question" + (list.length === 1 ? "" : "s") + " (IDs " + first + (last2 > first ? "–" + last2 : "") + ")");
    }).catch(adFail).then(function () { AD.busy = false; if (screen === "admin") renderAdmin(); });
  }

  function adRows() {
    var s = AD.search.trim().toLowerCase(), rows = [], cm = {};
    custom.items.forEach(function (it) { cm[it.id] = it; });
    if (AD.scope === "all") {
      rows = bank.map(function (q) { return { q: q, flag: cm[q.id] ? (baseById[q.id] ? "edited" : "new") : "base" }; });
    } else {
      custom.items.forEach(function (it) {
        if (AD.scope === "deleted" ? it.deleted : !it.deleted && !checkQ(it)) rows.push({ q: it, flag: it.deleted ? "hidden" : (baseById[it.id] ? "edited" : "new") });
      });
      rows.sort(function (a, b) { return b.q.id - a.q.id; });
    }
    if (s) rows = rows.filter(function (r) { return String(r.q.id) === s || String(r.q.q).toLowerCase().indexOf(s) > -1; });
    return rows;
  }
  function adRowsHtml() {
    var rows = adRows(), h = "";
    if (!rows.length) return '<div class="qa-glass p-4 text-sm qa-t2 text-center">' + (AD.scope === "custom" ? "No custom or edited questions yet." : AD.scope === "deleted" ? "No hidden questions." : "No matches.") + "</div>";
    rows.slice(0, 40).forEach(function (r) {
      var q = r.q, id = q.id, h2 = "";
      if (r.flag === "hidden") {
        if (baseById[id] || !checkQ(q)) h2 = '<button type="button" class="qa-pill btn-tap" data-a="adrestore" data-k="' + id + '">Restore</button>';
      } else {
        h2 = '<button type="button" class="qa-pill btn-tap" data-a="adedit" data-k="' + id + '">' + ico("pencil") + " Edit</button>" +
          '<button type="button" class="qa-pill btn-tap' + (AD.del === id ? " on" : "") + '" data-a="addel" data-k="' + id + '">' + ico("trash-2") + (AD.del === id ? " Tap again" : " Delete") + "</button>" +
          (r.flag === "edited" ? '<button type="button" class="qa-pill btn-tap" data-a="adrestore" data-k="' + id + '">Revert</button>' : "");
      }
      h += '<div class="qa-glass qa-ar"><div class="flex items-center gap-2 flex-wrap"><span class="qa-id">#' + id + '</span><span class="qa-qtag">' + esc(TAGS[q.sub] || q.sub || "") + '</span><span class="text-xs qa-t2">' + r.flag + "</span></div>" +
        '<div class="qa-arq">' + esc(q.q || "") + '</div><div class="qa-row mt-2">' + h2 + "</div></div>";
    });
    if (rows.length > 40) h += '<div class="text-xs qa-t2 text-center">Showing 40 of ' + rows.length + " — search to narrow down</div>";
    return h;
  }
  function renderAdList() { var el = $("ad-list"); if (el) { el.innerHTML = adRowsHtml(); icons(); } }
  function adAfter(msg) { return function (doc) { applyCustom(doc); toast(msg); if (screen === "admin" && AD.mode === "list") renderAdmin(); }; }
  function adDelete(id) {
    if (!adGuard()) return;
    if (AD.del !== id) {
      AD.del = id; renderAdList(); toast("Tap Delete again to confirm");
      clearTimeout(AD.delT); AD.delT = setTimeout(function () { if (AD) { AD.del = 0; if (screen === "admin" && AD.mode === "list") renderAdList(); } }, 3000);
      return;
    }
    AD.del = 0;
    var cur = bank.filter(function (x) { return x.id === id; })[0]; if (!cur) return;
    writeCustom(function (items) {
      var out = items.filter(function (x) { return x.id !== id; });
      out.push({ id: id, group: cur.group, sub: cur.sub, q: cur.q, opts: cur.opts.slice(), ans: cur.ans, deleted: true });
      return out;
    }).then(adAfter("Question #" + id + " deleted")).catch(adFail);
  }
  function adRestore(id) {
    if (!adGuard()) return;
    writeCustom(function (items) {
      var out = [];
      items.forEach(function (x) {
        if (x.id !== id) { out.push(x); return; }
        if (baseById[id]) return;
        var y = {}, k; for (k in x) if (k !== "deleted") y[k] = x[k]; out.push(y);
      });
      return out;
    }).then(adAfter("Question #" + id + " restored")).catch(adFail);
  }

  /* ---------- render + events ---------- */
  function render() {
    if (!view) return;
    if (screen === "game" && G && !G.done) renderGame();
    else if (screen === "tug" && G && G.tug && !G.done && R && R.room) renderTug();
    else if (screen === "admin" && AD && adminOn()) renderAdmin();
    else if (screen === "lobby" && R && R.room) renderLobby();
    else if (screen === "countdown" && R && R.room) renderCountdown();
    else if (screen === "mwait" && R && R.room) renderWait();
    else if (screen === "mresult" && R && R.final) renderPodium();
    else if (screen === "result" && last) renderResult();
    else { screen = "setup"; renderSetup(); }
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-a]"); if (!b || !root.contains(b)) return;
    var a = b.getAttribute("data-a"), k = b.getAttribute("data-k");
    if (a === "mode") { S.mode = k === "multi" ? "multi" : "solo"; if (S.mode === "multi" && [2, 3, 4].indexOf(S.players) < 0) S.players = 2; savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "topic") { var tp = k.split("|"), isE = tp[0] === "iti" && tp[1] === "elec";
      if (isE) { if (elecParts(S.main, S.sub)) elecOpen = !elecOpen; else { S.main = "iti"; S.sub = "elec"; elecOpen = true; } }
      else { S.main = tp[0]; S.sub = tp[1]; elecOpen = false; }
      ensureCount(); savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "yr") { S.main = "iti"; S.sub = k === "y2" ? "y2" : "y1"; elecOpen = true; ensureCount(); savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "mod") { var ep0 = elecParts(S.main, S.sub); if (ep0 && ep0.yr) { S.sub = ep0.yr + (k ? ":" + k : ""); elecOpen = false; ensureCount(); savePrefs(); sfx("click"); renderSetup(); } }
    else if (a === "review") toggleReview();
    else if (a === "players") { S.players = +k; savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "btype") { S.battle = k === "tug" ? "tug" : "classic"; savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "count") { S.count = +k; savePrefs(); sfx("click"); renderSetup(); }
    else if (a === "retry") { loadBank(); }
    else if (a === "start") startSolo();
    else if (a === "create") { if (feasible(S.count)) M.createRoom(cfg()); }
    else if (a === "joinlink") M.joinRoom(pendingCode, { name: S.name || "Player" });
    else if (a === "dismissinv") { clearInvite(); renderSetup(); }
    else if (a === "copy") { copyText(R.code).then(function () { toast("Room code copied"); }, function () { toast("Couldn’t copy — long-press the code"); }); }
    else if (a === "startnow") { startMatch(); renderLobby(); }
    else if (a === "rematch") rematch();
    else if (a === "mdl") podiumDownload();
    else if (a === "mshare") podiumShare();
    else if (a === "leave") leaveRoom();
    else if (a === "join") {
      var code = (($("qa-code") || {}).value || "").replace(/\D/g, "");
      if (code.length !== 4) { toast("Enter the 4-digit room code"); return; }
      M.joinRoom(code, { name: S.name || "Player", players: S.players });
    }
    else if (a === "adopen") openAdmin();
    else if (a.indexOf("ad") === 0 && a !== "again" && !adGuard()) return;
    else if (a === "adback") { screen = "setup"; render(); }
    else if (a === "admode") { AD.mode = k; renderAdmin(); }
    else if (a === "adans") {
      AD.form.ans = +k;
      Array.prototype.forEach.call(root.querySelectorAll('[data-a="adans"]'), function (x) { var on = +x.getAttribute("data-k") === AD.form.ans; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    }
    else if (a === "adsave") adSave();
    else if (a === "adcancel") { AD.form = emptyForm(AD.form.cat); renderAdmin(); }
    else if (a === "adparse") adParse();
    else if (a === "adclear") { AD.bulk.text = ""; AD.bulk.parsed = null; renderAdmin(); }
    else if (a === "adbulksave") adBulkSave();
    else if (a === "adscope") { AD.scope = k; renderAdmin(); }
    else if (a === "adedit") adEdit(+k);
    else if (a === "addel") adDelete(+k);
    else if (a === "adrestore") adRestore(+k);
    else if (a === "opt") { if (G && G.tug) tugAnswer(+k); else answer(+k); }
    else if (a === "quit") {
      var now = Date.now();
      if (G && now - G.quitAt < 2500) { if (G.mp) leaveMatch(); else { stopGame(); screen = "setup"; render(); } }
      else { if (G) G.quitAt = now; toast(G && G.tug ? "Tap ✕ again to forfeit the clash" : G && G.mp ? "Tap ✕ again to leave the match" : "Tap ✕ again to quit"); }
    }
    else if (a === "again") startSolo();
    else if (a === "setup") { screen = "setup"; render(); }
    else if (a === "dl") download();
    else if (a === "share") share();
  }
  function onInput(e) {
    var t = e.target, f = t.getAttribute && t.getAttribute("data-f");
    if (f) { adField(f, t.value); return; }
    if (t.id === "qa-name") { S.name = t.value.slice(0, 16); lsSet(LS.name, S.name); }
    else if (t.id === "qa-code") { t.value = t.value.replace(/\D/g, "").slice(0, 4); codeDraft = t.value; }
  }

  function onKey(e) {
    var tg = screen === "tug";
    if ((screen !== "game" && !tg) || !G || G.locked || G.done || !root || !document.body.contains(root)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tn = t && t.tagName;
    if (tn === "INPUT" || tn === "TEXTAREA" || tn === "SELECT" || (t && t.isContentEditable)) return;
    var k = "1234".indexOf(e.key);
    if (k < 0) k = "abcd".indexOf(String(e.key).toLowerCase());
    var kq = G.qs[tg ? G.round : G.i];
    if (e.key.length !== 1 || k < 0 || !kq || k >= kq.o.length) return;
    e.preventDefault(); if (tg) tugAnswer(k); else answer(k);
  }

  /* ---------- bank + mount ---------- */
  function loadBank() {
    bankState = "loading"; if (screen === "setup") render();
    var extraP = fetch(BANK_EXTRA_URL, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (d) { return Array.isArray(d) ? d : []; }).catch(function () { return []; });
    Promise.all([fetch(BANK_URL, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), extraP])
      .then(function (res) {
        var d = res[0], ex = res[1], seen = {};
        if (!Array.isArray(d)) throw new Error("bad bank");
        d.forEach(function (q) { if (q && typeof q.id === "number") seen[q.id] = 1; });
        d = d.concat(ex.filter(function (q) { return q && typeof q.id === "number" && !seen[q.id]; }));
        baseBank = d.filter(function (q) { return q && q.q && Array.isArray(q.opts) && q.opts.length === 4 && q.ans >= 0 && q.ans < 4; });
        baseById = {}; baseBank.forEach(function (q) { baseById[q.id] = q; });
        readCachedCustom(); rebuildBank();
        bankState = bank.length ? "ok" : "error"; ensureCount();
      }).catch(function () { bankState = "error"; })
      .then(function () { if (screen === "setup") render(); if (bankState === "ok") syncCustom(); });
  }
  function mount() {
    root = document.getElementById("quiz-arena-root");
    if (!root || root.getAttribute("data-qa") === "1") return;
    root.setAttribute("data-qa", "1");
    injectCss(); loadPrefs(); readInvite();
    root.innerHTML = '<div id="qa-view"></div><div id="qa-msg" class="qa-msg" role="status" aria-live="polite"></div>';
    view = root.querySelector("#qa-view"); msgEl = root.querySelector("#qa-msg");
    document.addEventListener("keydown", onKey); root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
    render(); loadBank();
    if (pendingCode) { try { window.dispatchEvent(new CustomEvent("qa:invite", { detail: { code: pendingCode } })); } catch (e) { } }
  }
  function readInvite() {
    try { var c = new URLSearchParams(location.search).get("battle"); if (c && /^\d{4}$/.test(c)) { pendingCode = c; S.mode = "multi"; if (S.players < 2) S.players = 2; } } catch (e) { }
  }
  window.QuizArena = { mount: mount, pick: pick, feasible: feasible, getBank: function () { return bank.slice(); }, getConfig: function () { return JSON.parse(JSON.stringify(S)); }, invite: function () { return pendingCode; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

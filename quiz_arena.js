/*! ITI CONNECT — Quiz Arena (Option A: Ultra-Minimal & Instant + Solo & 2–4P Live Battle)
 *  Mounts into <div id="quiz-arena-root"></div>. Needs ./quiz_bank.json.
 *  Live rooms: Firestore doc battles/{roomCode}, Firebase v10.12.2 (same app as index.html),
 *  anonymous Firebase Auth for the player id. Invite link: ?battle=XXXX
 *  Tug of War (1v1): battleType "tug" rooms - synchronized rounds, High-Voltage power bar (see the TUG section below)
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
  /* seconds per question | pause between rounds (ms) | pull (one right) | pull (both right, faster) | overdrive multiplier | AFK rounds before forfeit | sudden-death reserve questions */
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
  /* ITI ELEC = 1st + 2nd year merged. sub values: "elec" (pick a year) | "y1" / "y2" (Trade Test: every module) | "y1:ohm" (one module) */
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
    if (cfg.main === "iti" && cfg.sub === "elec") return false;   /* choose 1st or 2nd year first */
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

  /* ---------- styles (Option A: Ultra-Minimal glassmorphism matched to index.html) ---------- */
  function injectCss() {
    if (document.getElementById("qa-style")) return;
    var st = document.createElement("style"); st.id = "qa-style";
    st.textContent = `
#quiz-arena-root{--tx:#f5f3ff;--t2:#a5a3c4;--cd:rgba(22,18,52,.50);--cd2:rgba(255,255,255,.06);--bd:rgba(196,181,253,.20);--ac:#c4b5fd;--fl:#8b5cf6;--ac2:#22d3ee;--on:rgba(139,92,246,.26);--onb:rgba(167,139,250,.65);--glow:0 0 0 1px rgba(167,139,250,.18),0 6px 22px -6px rgba(124,58,237,.55);--okb:rgba(16,185,129,.18);--okc:#34d399;--bdb:rgba(244,63,94,.18);--bdc:#fb7185;--sh:0 14px 38px -12px rgba(8,4,32,.6),0 1px 0 0 rgba(255,255,255,.09) inset,0 0 0 1px rgba(255,255,255,.02) inset;color:var(--tx)}
html.bright-mode #quiz-arena-root{--tx:#1e1b4b;--t2:#5b5880;--cd:rgba(255,255,255,.55);--cd2:rgba(255,255,255,.62);--bd:rgba(124,58,237,.18);--ac:#6d28d9;--fl:#7c3aed;--ac2:#0891b2;--on:rgba(124,58,237,.14);--onb:rgba(124,58,237,.55);--glow:0 0 0 1px rgba(124,58,237,.12),0 6px 18px -6px rgba(124,58,237,.35);--okb:#d1fae5;--okc:#059669;--bdb:#ffe4e6;--bdc:#e11d48;--sh:0 14px 34px -12px rgba(76,29,149,.20),0 1px 0 0 rgba(255,255,255,.85) inset}
#quiz-arena-root *{box-sizing:border-box}
#quiz-arena-root button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#quiz-arena-root button:disabled{cursor:not-allowed}
.qa-wrap{max-width:30rem;margin:0 auto}
.qa-t2{color:var(--t2)}.qa-ac{color:var(--ac)}
.qa-i{width:16px;height:16px;flex:none}
.qa-glass{position:relative;background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),radial-gradient(120% 80% at 100% 0%,rgba(139,92,246,.20),transparent 60%),radial-gradient(90% 70% at 0% 100%,rgba(34,211,238,.10),transparent 65%),var(--cd);border:1px solid var(--bd);box-shadow:var(--sh);-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);border-radius:1.4rem}
.qa-inner{background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),var(--cd2);border:1px solid var(--bd);border-radius:1.05rem;-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);box-shadow:0 1px 0 rgba(255,255,255,.07) inset}
.qa-lbl{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t2)}
.qa-in{width:100%;padding:.52rem .8rem;border-radius:999px;font-size:13.5px;font-weight:600;color:var(--tx);background:var(--cd2);border:1px solid var(--bd);outline:none;transition:border-color .2s,box-shadow .2s;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
textarea.qa-in,select.qa-in{border-radius:1rem}
.qa-in:focus{border-color:var(--onb);box-shadow:0 0 0 3px rgba(139,92,246,.22)}
.qa-seg{padding:.5rem .5rem;border-radius:.85rem;font-size:12px;font-weight:800;color:var(--t2);border:1px solid transparent;display:flex;align-items:center;justify-content:center;gap:.38rem;transition:all .2s}
.qa-seg.on{color:var(--tx);background:linear-gradient(135deg,rgba(139,92,246,.42),rgba(99,102,241,.28));border-color:var(--onb);box-shadow:var(--glow);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
html.bright-mode .qa-seg.on{color:#4c1d95;background:linear-gradient(135deg,rgba(139,92,246,.22),rgba(99,102,241,.14))}
.qa-pill{min-height:33px;padding:.34rem .75rem;border-radius:999px;font-size:11.5px;font-weight:700;background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02)),var(--cd2);border:1px solid var(--bd);transition:all .16s;white-space:nowrap;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.qa-pill:active:not(:disabled){transform:scale(.97)}
.qa-pill.on{background:linear-gradient(135deg,rgba(139,92,246,.38),rgba(99,102,241,.22));border-color:var(--onb);color:var(--tx);box-shadow:var(--glow)}
html.bright-mode .qa-pill.on{color:#4c1d95;background:linear-gradient(135deg,rgba(139,92,246,.22),rgba(99,102,241,.12))}
.qa-pill:disabled{opacity:.35;text-decoration:line-through}
.qa-row{display:flex;gap:.4rem;overflow-x:auto;padding-bottom:.15rem;scrollbar-width:none}
.qa-row::-webkit-scrollbar{display:none}
.qa-wrapRow{display:flex;flex-wrap:wrap;gap:.38rem}
.qa-wrapRow.qa-cmp{gap:.3rem}
.qa-cmp .qa-pill{min-height:27px;padding:.14rem .56rem;font-size:10.5px;line-height:1.2}
.qa-cmp .qa-pill .qa-n{margin-left:.22rem;font-size:9px}
.qa-cmp .qa-pill .qa-i{width:12px;height:12px;margin-right:.2rem;vertical-align:-2px}
.qa-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:.45rem;padding:.85rem 1rem;border-radius:1.1rem;font-weight:800;font-size:14px;color:#fff!important;background:linear-gradient(135deg,#8b5cf6,#6366f1 55%,#3b82f6);box-shadow:0 12px 26px -10px rgba(99,102,241,.85),0 1px 0 rgba(255,255,255,.35) inset;border:1px solid rgba(255,255,255,.18);text-shadow:0 1px 2px rgba(30,10,80,.35)}
.qa-cta:active:not(:disabled){transform:scale(.985)}
.qa-cta:disabled{opacity:.45;box-shadow:none}
.qa-sec{display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.68rem .85rem;border-radius:1rem;font-weight:700;font-size:12.5px;background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02)),var(--cd2);border:1px solid var(--bd);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.qa-chip{display:inline-flex;align-items:center;gap:.32rem;padding:.3rem .7rem;border-radius:999px;font-weight:800;font-size:12px;background:var(--cd2);border:1px solid var(--bd);font-variant-numeric:tabular-nums;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.qa-chip.amb{color:var(--ac);border-color:var(--onb);background:var(--on);box-shadow:var(--glow)}.qa-chip.low{color:var(--bdc);border-color:var(--bdc)}
.qa-ic{width:2.3rem;height:2.3rem;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--cd2);border:1px solid var(--bd);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.qa-track{height:7px;border-radius:99px;background:var(--cd2);border:1px solid var(--bd);overflow:hidden;margin-top:.35rem}
.qa-fill{height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#8b5cf6,#6366f1,#22d3ee);box-shadow:0 0 12px rgba(139,92,246,.7);transition:width .28s ease}
.qa-nosel{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.qa-card{position:relative;margin-top:.75rem;padding:1.1rem;min-height:6rem}
.qa-qtag{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ac)}
.qa-q{margin:.4rem 0 0;font-size:16px;font-weight:700;line-height:1.45}
.qa-opt{display:flex;align-items:center;gap:.7rem;width:100%;padding:.78rem .9rem;border-radius:1.1rem;text-align:left;font-size:14px;font-weight:600;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.01)),var(--cd);border:1.5px solid var(--bd);box-shadow:var(--sh);-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);transition:border-color .15s,background-color .15s,transform .12s}
.qa-opt:hover:not(:disabled){border-color:var(--onb)}
.qa-opt:active:not(:disabled){transform:scale(.99)}
.qa-let{flex:none;width:1.75rem;height:1.75rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:800;background:rgba(139,92,246,.22);color:var(--ac)}
.qa-opt.qa-ok{background:var(--okb)!important;border-color:var(--okc)!important}
.qa-opt.qa-ok .qa-let{background:var(--okc);color:#fff}
.qa-opt.qa-bad{background:var(--bdb)!important;border-color:var(--bdc)!important}
.qa-opt.qa-bad .qa-let{background:var(--bdc);color:#fff}
.qa-pop{position:absolute;right:.9rem;top:.75rem;font-weight:800;font-size:13.5px;opacity:0;color:var(--okc)}
.qa-pop.bad{color:var(--bdc)}
.qa-pop.go{animation:qapop .65s ease-out}
@keyframes qapop{0%{opacity:0;transform:translateY(6px)}20%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
.qa-bump{animation:qabump .24s ease}
@keyframes qabump{50%{transform:scale(1.14)}}
.qa-big{font-size:3rem;line-height:1;font-weight:900;background:linear-gradient(135deg,#c4b5fd,#818cf8 50%,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
html.bright-mode .qa-big{background-image:linear-gradient(135deg,#6d28d9,#4f46e5 50%,#0891b2)}
.qa-stat{padding:.7rem .4rem;text-align:center}
.qa-stat b{display:block;font-size:16px;font-weight:800}.qa-stat span{font-size:10px;color:var(--t2);font-weight:700}
.qa-msg{position:fixed;left:50%;bottom:calc(var(--nav-offset,0px) + 6.5rem);transform:translate(-50%,10px);max-width:90%;padding:.55rem .95rem;border-radius:999px;font-size:12.5px;font-weight:700;color:#fff;background:rgba(99,102,241,.78);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.2);opacity:0;pointer-events:none;transition:.25s;z-index:70;text-align:center}
.qa-msg.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.qa-pop.go,.qa-bump{animation:none}.qa-fill{transition:none}}
.qa-rank{display:flex;flex-wrap:wrap;align-items:center;gap:.2rem .35rem;margin-top:.6rem;padding:.45rem .7rem;font-size:11.5px;font-weight:700;border-radius:1rem}
.qa-rk{display:inline-flex;align-items:center;gap:.2rem;white-space:nowrap}.qa-rk.me{color:var(--ac)}
.qa-rn{display:inline-block;max-width:6.5rem;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom}
.qa-code{font-size:3.2rem;line-height:1.1;font-weight:900;letter-spacing:.22em;padding-left:.22em;background:linear-gradient(135deg,#c4b5fd,#818cf8 50%,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-variant-numeric:tabular-nums;margin-top:.25rem;-webkit-user-select:all;user-select:all}
html.bright-mode .qa-code{background-image:linear-gradient(135deg,#6d28d9,#4f46e5 50%,#0891b2)}
.qa-slot{display:flex;align-items:center;gap:.65rem;padding:.62rem .8rem;border-radius:1.1rem}
.qa-empty{border:1.5px dashed var(--bd)}
.qa-pre{margin:.5rem 0;padding:.6rem;border-radius:.9rem;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--cd2);border:1px solid var(--bd);color:var(--t2);font-family:ui-monospace,Menlo,monospace}
textarea.qa-in{resize:vertical;line-height:1.4}
.qa-id{font-size:11px;font-weight:800;padding:.1rem .5rem;border-radius:99px;background:rgba(139,92,246,.22);color:var(--ac)}
.qa-ar{padding:.7rem .8rem}
.qa-arq{margin-top:.4rem;font-size:14px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.qa-pod{display:flex;align-items:flex-end;justify-content:center;gap:.5rem;margin-top:.85rem}
.qa-pcol{flex:1;min-width:0;text-align:center}
.qa-pn{font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qa-ps{font-size:19px;font-weight:900;color:var(--ac);margin-bottom:.2rem}
.qa-pbar{display:flex;align-items:flex-start;justify-content:center;padding-top:.45rem;border-radius:1rem 1rem 0 0;font-size:32px;font-weight:900;color:#1c1100}
.qa-pbar.r0{background:linear-gradient(#fde68a,#f59e0b)}.qa-pbar.r1{background:linear-gradient(#e2e8f0,#94a3b8)}.qa-pbar.r2{background:linear-gradient(#fdba74,#c2410c)}
.qa-rev-item{padding:.75rem;border-radius:1rem;background:var(--cd2);border:1px solid var(--bd)}
.qa-setup{max-width:30rem;margin:0 auto}
.qa-pill .qa-n{margin-left:.3rem;font-size:10px;font-weight:800;opacity:.6;font-variant-numeric:tabular-nums}
.qa-pill.on .qa-n{opacity:.85}
.qa-cnt{display:grid;grid-template-columns:repeat(5,1fr);gap:.35rem}
.qa-cnt .qa-pill{padding:.34rem 0;text-align:center}
.qa-opt .qa-let{transition:background-color .15s,color .15s}
.qa-opt.qa-ok .qa-let,.qa-opt.qa-bad .qa-let{font-size:14px;font-weight:900}
.qa-rv{display:grid;gap:.5rem;margin-top:.6rem}
.qa-rv-q{font-size:13.5px;font-weight:650;line-height:1.4;margin:.3rem 0 .45rem}
.qa-rv-a{display:flex;align-items:flex-start;gap:.45rem;padding:.4rem .6rem;border-radius:.75rem;font-size:12.5px;font-weight:600;line-height:1.35;border:1px solid var(--bd)}
.qa-rv-a+.qa-rv-a{margin-top:.3rem}
.qa-rv-a b{flex:none;font-weight:900}
.qa-rv-a.ok{background:var(--okb);border-color:var(--okc)}.qa-rv-a.ok b{color:var(--okc)}
.qa-rv-a.bad{background:var(--bdb);border-color:var(--bdc)}.qa-rv-a.bad b{color:var(--bdc)}
.qa-rv-a.skip{color:var(--t2)}
.qa-chev{transition:transform .2s}.qa-open .qa-chev{transform:rotate(180deg)}
#quiz-arena-root{--sky:#38bdf8;--skyb:rgba(56,189,248,.55);--skyg:0 0 0 1px rgba(56,189,248,.2),0 4px 14px -4px rgba(14,165,233,.55)}
.qa-wrapRow.qa-cmp{gap:.28rem}
.qa-cmp .qa-pill{min-height:24px;padding:.1rem .2rem .1rem .55rem;font-size:10.5px;font-weight:700;line-height:1.1;display:inline-flex;align-items:center;gap:.28rem;border-radius:999px;background:linear-gradient(180deg,rgba(125,211,252,.16),rgba(125,211,252,.04)),rgba(255,255,255,.05);border:1px solid rgba(125,211,252,.22);-webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6)}
.qa-cmp .qa-pill:not(:has(.qa-n)){padding-right:.55rem}
.qa-cmp .qa-pill .qa-n{margin:0;min-width:1.45rem;padding:.12rem .34rem;border-radius:999px;font-size:8.5px;font-weight:800;text-align:center;opacity:1;color:var(--t2);background:rgba(125,211,252,.16)}
.qa-cmp .qa-pill.on{color:#f0f9ff;background:linear-gradient(135deg,rgba(56,189,248,.50),rgba(14,165,233,.26));border-color:var(--skyb);box-shadow:var(--skyg)}
.qa-cmp .qa-pill.on .qa-n{color:#fff;background:rgba(14,165,233,.55)}
html.bright-mode .qa-cmp .qa-pill{background:linear-gradient(180deg,rgba(186,230,253,.55),rgba(224,242,254,.30)),rgba(255,255,255,.55);border-color:rgba(14,165,233,.25)}
html.bright-mode .qa-cmp .qa-pill .qa-n{color:#0369a1;background:rgba(14,165,233,.14)}
html.bright-mode .qa-cmp .qa-pill.on{color:#0c4a6e;background:linear-gradient(135deg,rgba(56,189,248,.42),rgba(125,211,252,.28));border-color:rgba(2,132,199,.55)}
html.bright-mode .qa-cmp .qa-pill.on .qa-n{color:#fff;background:#0284c7}
.qa-xp{flex:0 0 100%;width:100%;display:grid;grid-template-rows:0fr;opacity:0;margin:-.14rem 0;transition:grid-template-rows .36s cubic-bezier(.4,0,.2,1),opacity .28s ease,margin .36s cubic-bezier(.4,0,.2,1)}
.qa-xp.open{grid-template-rows:1fr;opacity:1;margin:.1rem 0}
.qa-xpi{overflow:hidden;min-height:0}
.qa-xpbox{padding:.65rem;transform:translateY(-6px);transition:transform .36s cubic-bezier(.4,0,.2,1);background:linear-gradient(180deg,rgba(125,211,252,.14),rgba(125,211,252,.03)),var(--cd2);border-color:rgba(125,211,252,.28)}
.qa-xp.open>.qa-xpi>.qa-xpbox{transform:none}
.qa-sub{display:inline-block;max-width:9.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;opacity:.8;font-weight:600}
@media (prefers-reduced-motion:reduce){.qa-xp,.qa-xpbox{transition:none}}
@media (prefers-reduced-motion:reduce){.qa-chev{transition:none}}
/* ===== v2: pill tabs, gap-filling translucent topic pills, glowing ring counters ===== */
.qa-inner[role=tablist]{border-radius:999px;padding:.28rem;gap:.28rem;background:rgba(255,255,255,.04);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.qa-inner[role=tablist] .qa-seg{min-height:46px;border-radius:999px;padding:.4rem .6rem;font-size:13px;white-space:nowrap;flex-wrap:nowrap;gap:.4rem}
.qa-inner[role=tablist] .qa-seg .qa-i{width:17px;height:17px}
.qa-seg .qa-mini{font-size:9.5px;font-weight:800;padding:.08rem .38rem;border-radius:999px;border:1px solid currentColor;opacity:.75;letter-spacing:.02em}
.qa-seg.on{background:linear-gradient(135deg,rgba(139,92,246,.30),rgba(99,102,241,.16));box-shadow:0 0 0 1px rgba(167,139,250,.35),0 0 16px -2px rgba(139,92,246,.55)}
#quiz-arena-root{--rg:#22d3ee;--rgs:rgba(34,211,238,.75)}
.qa-wrapRow.qa-cmp{gap:.32rem}
.qa-cmp .qa-pill{flex:1 1 auto;justify-content:center;min-height:32px;padding:.2rem .35rem .2rem .7rem;gap:.4rem;font-size:11.5px;background:linear-gradient(180deg,rgba(125,211,252,.08),rgba(125,211,252,.015)),rgba(255,255,255,.025);border:1px solid rgba(125,211,252,.14);-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4);box-shadow:none}
.qa-cmp .qa-pill:not(:has(.qa-n)){padding-right:.7rem}
.qa-cmp .qa-pill .qa-n{min-width:1.7rem;height:1.45rem;display:inline-flex;align-items:center;justify-content:center;padding:0 .35rem;border-radius:999px;font-size:9.5px;font-weight:900;color:var(--rg);background:transparent;border:1.5px solid var(--rg);box-shadow:0 0 6px var(--rgs),0 0 12px -2px var(--rgs),inset 0 0 6px -1px var(--rgs);text-shadow:0 0 6px var(--rgs);opacity:1}
.qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(56,189,248,.20),rgba(14,165,233,.07));border-color:rgba(56,189,248,.6);box-shadow:0 0 14px -4px rgba(56,189,248,.65)}
.qa-cmp .qa-pill.on .qa-n{color:#fff;background:rgba(34,211,238,.18);border-color:#67e8f9;box-shadow:0 0 8px #22d3ee,0 0 18px rgba(34,211,238,.7),inset 0 0 8px rgba(34,211,238,.6);text-shadow:0 0 8px #22d3ee}
.qa-cmp .qa-pill:disabled .qa-n{box-shadow:none;text-shadow:none}
html.bright-mode #quiz-arena-root{--rg:#0891b2;--rgs:rgba(8,145,178,.55)}
html.bright-mode .qa-cmp .qa-pill{background:linear-gradient(180deg,rgba(186,230,253,.30),rgba(224,242,254,.12)),rgba(255,255,255,.25);border-color:rgba(14,165,233,.18)}
html.bright-mode .qa-cmp .qa-pill .qa-n{color:#0e7490;background:transparent}
html.bright-mode .qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(56,189,248,.25),rgba(125,211,252,.10));color:#0c4a6e}
html.bright-mode .qa-cmp .qa-pill.on .qa-n{color:#0e7490;background:rgba(8,145,178,.10);border-color:#0891b2}

/* ===== v3: compact (fits one screen), no glow on counters, translucent sky-blue ===== */
.qa-setup.qa-glass{padding:.6rem!important;border-radius:1.2rem}
.qa-setup.space-y-3>:not([hidden])~:not([hidden]){margin-top:.45rem!important}
.qa-setup .qa-lbl{font-size:9px}
.qa-inner[role=tablist]{padding:.2rem}
.qa-inner[role=tablist] .qa-seg{min-height:36px;font-size:12.5px}
.qa-setup .qa-in{padding:.3rem .7rem!important;font-size:13px}
.qa-wrapRow.qa-cmp{gap:.25rem}
.qa-cmp .qa-pill{min-height:27px;padding:.08rem .22rem .08rem .5rem;font-size:10.5px;gap:.28rem;background:linear-gradient(180deg,rgba(56,189,248,.16),rgba(56,189,248,.07));border:1px solid rgba(56,189,248,.28);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.qa-cmp .qa-pill:not(:has(.qa-n)){padding-right:.5rem}
.qa-cmp .qa-pill .qa-n,.qa-cmp .qa-pill.on .qa-n{min-width:1.45rem;height:1.1rem;padding:0 .3rem;font-size:8.5px;color:#7dd3fc;background:rgba(56,189,248,.20);border:1px solid rgba(56,189,248,.45);box-shadow:none!important;text-shadow:none!important}
.qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(56,189,248,.38),rgba(14,165,233,.20));border-color:rgba(56,189,248,.75);box-shadow:none}
.qa-cmp .qa-pill.on .qa-n{color:#fff;background:rgba(14,165,233,.45);border-color:rgba(125,211,252,.8)}
html.bright-mode .qa-cmp .qa-pill{background:linear-gradient(180deg,rgba(56,189,248,.18),rgba(125,211,252,.08));border-color:rgba(14,165,233,.30)}
html.bright-mode .qa-cmp .qa-pill .qa-n{color:#0369a1;background:rgba(56,189,248,.20);border-color:rgba(2,132,199,.40)}
html.bright-mode .qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(56,189,248,.40),rgba(125,211,252,.22));border-color:rgba(2,132,199,.7)}
html.bright-mode .qa-cmp .qa-pill.on .qa-n{color:#fff;background:#0284c7;border-color:#0284c7}
.qa-cnt{gap:.25rem}
.qa-cnt .qa-pill{min-height:28px;padding:.15rem 0;font-size:12px}
.qa-setup .qa-cta{padding:.62rem 1rem;font-size:13.5px}

/* ===== v4: website palette (slate glass + amber accent, same as index.html) ===== */
#quiz-arena-root{--tx:#e2e8f0;--t2:#94a3b8;--cd:rgba(12,19,34,.52);--cd2:rgba(255,255,255,.06);--bd:rgba(148,163,184,.22);--ac:#fbbf24;--fl:#f59e0b;--ac2:#fbbf24;--on:rgba(251,191,36,.16);--onb:rgba(251,191,36,.6);--glow:0 0 0 1px rgba(251,191,36,.18),0 4px 14px -6px rgba(245,158,11,.4);--sh:0 10px 28px -10px rgba(0,0,0,.5),0 1px 0 0 rgba(255,255,255,.06) inset;--rg:#fbbf24;--rgs:transparent}
html.bright-mode #quiz-arena-root{--tx:#1e293b;--t2:#475569;--cd:rgba(255,255,255,.58);--cd2:rgba(255,255,255,.62);--bd:rgba(148,163,184,.4);--ac:#b45309;--fl:#d97706;--ac2:#d97706;--on:rgba(217,119,6,.14);--onb:rgba(217,119,6,.55);--glow:0 0 0 1px rgba(217,119,6,.14),0 4px 12px -6px rgba(217,119,6,.3);--sh:0 10px 28px -10px rgba(15,23,42,.18),0 1px 0 0 rgba(255,255,255,.75) inset;--rg:#b45309}
.qa-glass{background:radial-gradient(120% 80% at 100% 0%,rgba(251,191,36,.07),transparent 60%),linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,0) 42%),var(--cd)}
html.bright-mode .qa-glass{background:radial-gradient(120% 80% at 100% 0%,rgba(217,119,6,.07),transparent 60%),linear-gradient(145deg,rgba(255,255,255,.7),rgba(255,255,255,.1) 42%),var(--cd)}
.qa-inner[role=tablist]{background:rgba(255,255,255,.04)}
.qa-seg.on,.qa-pill.on,html.bright-mode .qa-seg.on,html.bright-mode .qa-pill.on{background:var(--on);border-color:var(--onb);color:var(--tx);box-shadow:none}
html.bright-mode .qa-seg.on,html.bright-mode .qa-pill.on{color:#92400e}
.qa-cta{color:#1f1300!important;text-shadow:none;background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);box-shadow:0 10px 22px -10px rgba(245,158,11,.75),0 1px 0 rgba(255,255,255,.4) inset;border:1px solid rgba(255,255,255,.25)}
.qa-fill{background:linear-gradient(90deg,#f59e0b,#fbbf24);box-shadow:0 0 10px rgba(245,158,11,.55)}
.qa-big,.qa-code{background-image:linear-gradient(135deg,#fde68a,#fbbf24 50%,#f59e0b)}
html.bright-mode .qa-big,html.bright-mode .qa-code{background-image:linear-gradient(135deg,#b45309,#d97706 50%,#f59e0b)}
.qa-let,.qa-id{background:rgba(251,191,36,.16);color:var(--ac)}
.qa-in:focus{border-color:var(--onb);box-shadow:0 0 0 3px rgba(251,191,36,.18)}
.qa-msg{background:rgba(15,23,42,.9);color:#fbbf24;border:1px solid rgba(251,191,36,.4)}
/* topic pills: slate glass, amber when selected */
.qa-cmp .qa-pill,html.bright-mode .qa-cmp .qa-pill{background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),rgba(255,255,255,.03);border-color:rgba(148,163,184,.26);color:var(--tx)}
html.bright-mode .qa-cmp .qa-pill{background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.4));border-color:rgba(148,163,184,.4);color:#1e293b}
.qa-cmp .qa-pill.on,html.bright-mode .qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(251,191,36,.26),rgba(245,158,11,.10));border-color:rgba(251,191,36,.65);color:#fef3c7;box-shadow:none}
html.bright-mode .qa-cmp .qa-pill.on{background:linear-gradient(135deg,rgba(217,119,6,.20),rgba(217,119,6,.06));border-color:rgba(217,119,6,.6);color:#92400e}
.qa-cmp .qa-pill .qa-n{color:#fbbf24;background:rgba(245,158,11,.16);border:1px solid rgba(245,158,11,.4)}
html.bright-mode .qa-cmp .qa-pill .qa-n{color:#92400e;background:rgba(217,119,6,.12);border-color:rgba(217,119,6,.55)}
.qa-cmp .qa-pill.on .qa-n{color:#1f1300;background:#fbbf24;border-color:#fbbf24}
html.bright-mode .qa-cmp .qa-pill.on .qa-n{color:#fff;background:#d97706;border-color:#d97706}
.qa-xpbox{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02)),var(--cd2);border-color:rgba(148,163,184,.26)}

/* ===== v5: website chip shape (rounded-xl, amber bold text) + smooth switching ===== */
.qa-pill,.qa-cmp .qa-pill,.qa-cnt .qa-pill{border-radius:.75rem}
.qa-cmp .qa-pill,.qa-cnt .qa-pill{color:var(--ac);font-weight:700}
html.bright-mode .qa-cmp .qa-pill,html.bright-mode .qa-cnt .qa-pill{color:#b45309}
.qa-cmp .qa-pill.on,.qa-cnt .qa-pill.on{color:#fde68a}
html.bright-mode .qa-cmp .qa-pill.on,html.bright-mode .qa-cnt .qa-pill.on{color:#92400e}
.qa-cmp .qa-pill:disabled{color:var(--t2)}
.qa-inner[role=tablist]{border-radius:.95rem}
.qa-inner[role=tablist] .qa-seg{border-radius:.75rem}
.qa-seg.on{color:var(--ac)}
/* sliding indicator (tabs + question count) */
.qa-slide{position:relative}
.qa-slide>.qa-seg,.qa-slide>.qa-pill{position:relative;z-index:1}
.qa-slide>.qa-seg.on,.qa-slide>.qa-pill.on,html.bright-mode .qa-slide>.qa-seg.on,html.bright-mode .qa-slide>.qa-pill.on{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
.qa-ind{position:absolute;left:0;top:0;width:0;height:0;z-index:0;pointer-events:none;border-radius:.75rem;background:linear-gradient(135deg,rgba(251,191,36,.28),rgba(245,158,11,.12));border:1px solid var(--onb);opacity:0;transition:transform .34s cubic-bezier(.4,0,.2,1),width .34s cubic-bezier(.4,0,.2,1),height .34s cubic-bezier(.4,0,.2,1),opacity .2s}
html.bright-mode .qa-ind{background:linear-gradient(135deg,rgba(217,119,6,.22),rgba(217,119,6,.08))}
/* tap pop on the newly picked pill */
.qa-pill.qa-just{animation:qaJust .42s cubic-bezier(.34,1.4,.64,1)}
@keyframes qaJust{0%{transform:scale(.92);box-shadow:0 0 0 0 rgba(251,191,36,.55)}60%{transform:scale(1.04)}100%{transform:none;box-shadow:0 0 0 9px rgba(251,191,36,0)}}
/* content that appears when switching to Live Battle */
.qa-enter{animation:qaEnter .36s cubic-bezier(.22,1,.36,1) both}
@keyframes qaEnter{from{opacity:0;transform:translateY(-8px) scale(.985)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.qa-ind{transition:none}.qa-pill.qa-just,.qa-enter{animation:none}}

/* ===== v6: 1v1 High-Voltage Tug of War (amber gold vs electric cyan) ===== */
#quiz-arena-root{--tga:#f59e0b;--tga2:#fbbf24;--tgb:#22d3ee;--tgb2:#0891b2;--tgat:#fbbf24;--tgbt:#22d3ee;--tgtr:rgba(148,163,184,.18)}
html.bright-mode #quiz-arena-root{--tgat:#b45309;--tgbt:#0e7490;--tgtr:rgba(100,116,139,.2)}
.qa-gt .qa-pill{font-size:10.5px;white-space:normal;line-height:1.15;padding:.3rem .25rem;min-height:32px}
.qa-gt .qa-pill .qa-i{width:13px;height:13px;margin-right:.22rem;vertical-align:-2px;display:inline-block}
.qa-lock .qa-pill:disabled{text-decoration:none;opacity:.4}
.qa-tug{margin-top:.75rem;padding:.65rem .75rem .75rem}
.qa-tug-h{display:flex;justify-content:space-between;align-items:flex-end;gap:.5rem}
.qa-te{min-width:0;flex:1;padding:.3rem .5rem;border-radius:.85rem;border:1px solid transparent;transition:box-shadow .25s,border-color .25s}
.qa-te.r{text-align:right}
.qa-tn{font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qa-tp{font-size:26px;line-height:1.05;font-weight:900;font-variant-numeric:tabular-nums}
.qa-te.l .qa-tn,.qa-te.l .qa-tp{color:var(--tgat)}
.qa-te.r .qa-tn,.qa-te.r .qa-tp{color:var(--tgbt)}
.qa-tsub{font-size:10px;font-weight:800;color:var(--t2);min-height:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qa-beamw{position:relative;padding:7px 16px;margin-top:.2rem}
.qa-beam{position:relative;height:20px;border-radius:999px;overflow:hidden;background:var(--tgtr);border:1px solid var(--bd);box-shadow:0 0 18px -5px rgba(251,191,36,.4),0 0 18px -5px rgba(34,211,238,.4)}
.qa-bl,.qa-br{position:absolute;top:0;bottom:0;transition:width .6s cubic-bezier(.3,1.25,.5,1)}
.qa-bl{left:0;background:linear-gradient(90deg,var(--tga),var(--tga2))}
.qa-br{right:0;background:linear-gradient(270deg,var(--tgb2),var(--tgb))}
.qa-bl::after,.qa-br::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(110deg,rgba(255,255,255,0) 0 10px,rgba(255,255,255,.3) 10px 14px,rgba(255,255,255,0) 14px 24px);background-size:48px 100%;animation:qaFlow 1s linear infinite}
.qa-br::after{animation-direction:reverse}
@keyframes qaFlow{to{background-position:48px 0}}
.qa-mk{position:absolute;top:4px;bottom:4px;width:1px;background:rgba(255,255,255,.4);z-index:1}
.qa-lane{position:absolute;left:16px;right:16px;top:0;bottom:0;pointer-events:none}
.qa-core{position:absolute;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;z-index:2;background:radial-gradient(circle,#fff 0 18%,#fef3c7 30%,rgba(251,191,36,.92) 48%,rgba(34,211,238,.85) 72%,rgba(34,211,238,0) 100%);box-shadow:0 0 12px 3px rgba(255,255,255,.9),0 0 26px 8px rgba(251,191,36,.55),0 0 34px 10px rgba(34,211,238,.45);transition:left .6s cubic-bezier(.3,1.25,.5,1);animation:qaSpark .5s ease-in-out infinite alternate}
@keyframes qaSpark{from{transform:scale(.88)}to{transform:scale(1.14)}}
.qa-core::before,.qa-core::after{content:"";position:absolute;left:50%;top:50%;width:48px;height:2px;margin:-1px 0 0 -24px;background:linear-gradient(90deg,transparent,#fff,transparent);transform:rotate(35deg);animation:qaZap .35s steps(2) infinite}
.qa-core::after{transform:rotate(-35deg);animation-delay:.17s}
@keyframes qaZap{0%{opacity:1}50%{opacity:.15}100%{opacity:.9}}
.qa-tug.crit-l .qa-te.l,.qa-tug.crit-r .qa-te.r{border-color:var(--bdc);animation:qaCrit .8s ease-in-out infinite}
@keyframes qaCrit{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),inset 0 0 0 0 rgba(251,191,36,0)}50%{box-shadow:0 0 16px 2px rgba(239,68,68,.55),inset 0 0 14px rgba(251,191,36,.35)}}
.qa-tt{height:5px;border-radius:99px;background:var(--cd2);border:1px solid var(--bd);overflow:hidden;margin-top:.6rem}
.qa-tt>i{display:block;height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width .2s linear}
.qa-tt.low>i{background:linear-gradient(90deg,#e11d48,var(--bdc))}
.qa-shake{animation:qaShake .42s cubic-bezier(.36,.07,.19,.97)}
@keyframes qaShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-3px)}40%,60%{transform:translateX(3px)}}
.qa-fl{text-align:center;padding:1.1rem .4rem;animation:qaEnter .3s both}
.qa-fl b{display:block;font-size:26px;line-height:1.15;font-weight:900}
.qa-fl span{display:block;margin-top:.35rem;font-size:12.5px;font-weight:700;color:var(--t2)}
.qa-fl.me b{color:var(--tgat)}.qa-fl.opp b{color:var(--tgbt)}.qa-fl.blk b{color:var(--bdc)}
.qa-vs{font-size:2.7rem;line-height:1;font-weight:900;font-variant-numeric:tabular-nums}
.qa-vs .a{color:var(--tgat)}.qa-vs .b{color:var(--tgbt)}
.qa-vs .v{font-size:1rem;font-weight:800;color:var(--t2);margin:0 .55rem;vertical-align:middle}
.qa-win{display:inline-flex;align-items:center;gap:.4rem;padding:.38rem .9rem;border-radius:999px;font-weight:900;font-size:13px;color:#1f1300;background:linear-gradient(135deg,#fde68a,#fbbf24 55%,#f59e0b);box-shadow:0 6px 18px -8px rgba(245,158,11,.8)}
.qa-win.lose{color:var(--tx);background:var(--cd2);border:1px solid var(--bd);box-shadow:none}
@media (prefers-reduced-motion:reduce){.qa-core,.qa-core::before,.qa-core::after,.qa-bl::after,.qa-br::after,.qa-tug.crit-l .qa-te.l,.qa-tug.crit-r .qa-te.r,.qa-shake,.qa-fl{animation:none}.qa-bl,.qa-br,.qa-core,.qa-tt>i{transition:none}}
`;
    document.head.appendChild(st);
  }

  /* ---------- setup screen (Ultra-Minimal single glass card) ---------- */
  function pill(a, k, label, on, dis) {
    return '<button type="button" class="qa-pill btn-tap' + (on ? " on" : "") + '" data-a="' + a + '" data-k="' + k + '" aria-pressed="' + (on ? "true" : "false") + '"' + (dis ? " disabled" : "") + ">" + label + "</button>";
  }
  /* ---------- ITI ELEC expandable panel (smooth open / close) ---------- */
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
    var h = '<div class="qa-xp' + (xpState.elec ? " open" : "") + '" data-xp="elec"><div class="qa-xpi"><div class="qa-inner qa-xpbox">';
    h += '<div class="qa-lbl" style="margin-bottom:.3rem">Year</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem">' +
      ["y1", "y2"].map(function (y) {
        var n = ready ? availFor("iti", y) : 0;
        return '<button type="button" class="qa-pill btn-tap text-center' + (ep.yr === y ? " on" : "") + '" style="padding:.32rem 0;justify-content:center" data-a="yr" data-k="' + y + '" aria-pressed="' + (ep.yr === y) + '">' + ELEC[y].name + '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
      }).join("") + "</div>";
    if (ep.yr && (wantM || xpState.mods)) {
      h += '<div class="qa-xp' + (xpState.mods ? " open" : "") + '" data-xp="mods"><div class="qa-xpi"><div style="padding-top:.6rem">';
      h += '<div class="qa-lbl" style="margin-bottom:.3rem">Test type</div><div class="qa-wrapRow qa-cmp">';
      h += '<button type="button" class="qa-pill btn-tap' + (!ep.mod ? " on" : "") + '" data-a="mod" data-k="" aria-pressed="' + !ep.mod + '">' + ico("shuffle") + " Trade Test · all modules" + '<span class="qa-n">' + (ready ? availFor("iti", ep.yr) : "…") + "</span></button>";
      ELEC[ep.yr].mods.forEach(function (m) {
        var n = ready ? availFor("iti", ep.yr + ":" + m[0]) : 0, on = ep.mod === m[0];
        h += '<button type="button" class="qa-pill btn-tap' + (on ? " on" : "") + '" data-a="mod" data-k="' + m[0] + '" aria-pressed="' + on + '"' + (ready && !n ? " disabled" : "") + ">" + esc(m[1]) + '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
      });
      h += '</div><div class="text-xs qa-t2" style="margin-top:.4rem">' + (ep.mod ? "Questions only from this module." : "Trade Test: questions are drawn from every module of " + ELEC[ep.yr].name + ".") + "</div></div></div></div>";
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
        if (!want[id]) setTimeout(function () { var e2 = view && view.querySelector('[data-xp="' + id + '"]'); if (e2 && !e2.classList.contains("open")) { if (e2.parentNode) e2.parentNode.removeChild(e2); } }, 420);
      }
    });
  }

  function renderSetup() {
    if (view && !view.querySelector(".qa-setup")) { elecOpen = false; xpState = { elec: false, mods: false }; IND = {}; lastDraw = null; }
    var topicKey = S.main + "|" + (elecParts(S.main, S.sub) ? "elec" : S.sub);
    var modeChg = !!lastDraw && lastDraw.mode !== S.mode, topicChg = !!lastDraw && lastDraw.topic !== topicKey, plChg = !!lastDraw && lastDraw.players !== S.players;
    var enter = modeChg ? " qa-enter" : "";
    var ready = bankState === "ok", st = liveStreak(), multi = S.mode === "multi", tug = multi && S.battle === "tug", h = "";
    var canStart = ready && feasible(S.count);

    h += '<div class="qa-glass qa-setup p-3.5 space-y-3">';

    /* header: title + streak + admin Manage */
    h += '<div class="flex items-center justify-between gap-2">';
    h += '<div class="flex items-center gap-2 min-w-0">' + ico("trophy", "qa-ac") + '<span class="text-base font-extrabold tracking-tight truncate">Quiz Arena</span></div>';
    h += '<div class="flex items-center gap-1.5 shrink-0">';
    h += '<div class="qa-chip' + (st ? " amb" : "") + '" title="Daily streak">' + ico("flame") + "<span>" + st + "d</span></div>";
    h += '<button type="button" class="admin-only' + (adminOn() ? "" : " hidden") + ' qa-pill btn-tap flex items-center gap-1" data-a="adopen" title="Manage questions">' + ico("settings-2") + "<span>Manage</span></button>";
    h += "</div></div>";

    /* Solo | Live Battle tabs */
    h += '<div class="qa-inner qa-slide p-1 grid grid-cols-2 gap-1" role="tablist" aria-label="Quiz mode" data-slide="tabs"><span class="qa-ind" aria-hidden="true"></span>';
    h += '<button type="button" role="tab" aria-selected="' + !multi + '" class="qa-seg btn-tap' + (!multi ? " on" : "") + '" data-a="mode" data-k="solo">' + ico("user") + "<span>Solo</span></button>";
    h += '<button type="button" role="tab" aria-selected="' + multi + '" class="qa-seg btn-tap' + (multi ? " on" : "") + '" data-a="mode" data-k="multi">' + ico("users") + "<span>Live Battle</span><span class=\"qa-mini\">2–4P</span></button>";
    h += "</div>";

    if (multi) {
      /* invite banner */
      if (pendingCode) {
        h += '<div class="qa-inner p-2 flex items-center gap-2' + enter + '" style="border-color:var(--onb)">';
        h += '<button type="button" class="qa-cta btn-tap flex-1" style="padding:.55rem .8rem;font-size:12.5px" data-a="joinlink">' + ico("log-in") + "Join room " + pendingCode + "</button>";
        h += '<button type="button" class="qa-ic btn-tap shrink-0" data-a="dismissinv" aria-label="Dismiss invite">' + ico("x") + "</button></div>";
      }
      /* room code join bar + room size */
      h += '<div class="qa-inner p-2 space-y-2' + enter + '">';
      h += '<div class="flex gap-1.5"><input id="qa-code" class="qa-in" style="width:5.8rem;text-align:center;letter-spacing:.26em;font-weight:800;padding-left:.9rem" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="0000" value="' + esc(codeDraft || pendingCode || "") + '" aria-label="4-digit room code">';
      h += '<button type="button" class="qa-sec btn-tap flex-1 font-extrabold" style="padding:.5rem .7rem" data-a="join">' + ico("log-in") + "Join room</button></div>";
      /* game type: Classic 2-4P race | Tug of War 1v1 (locks the room to 2 players) */
      h += '<div class="flex items-center gap-2"><span class="qa-lbl shrink-0">Game type</span><div class="grid grid-cols-2 gap-1.5 flex-1 qa-gt" role="group" aria-label="Game type">' +
        [["classic", "Classic Battle", "swords"], ["tug", "Tug of War (1v1)", "zap"]].map(function (t) {
          var on = S.battle === t[0];
          return '<button type="button" class="qa-pill btn-tap text-center' + (on ? " on" : "") + '" data-a="btype" data-k="' + t[0] + '" aria-pressed="' + on + '">' + ico(t[2]) + t[1] + "</button>";
        }).join("") + "</div></div>";
      h += '<div class="flex items-center gap-2"><span class="qa-lbl shrink-0">Room size</span><div class="grid grid-cols-3 gap-1.5 flex-1' + (tug ? " qa-lock" : "") + '">' +
        [2, 3, 4].map(function (n) { var on = tug ? n === 2 : S.players === n; return '<button type="button" class="qa-pill btn-tap text-center' + (on ? " on" + (plChg && !tug ? " qa-just" : "") : "") + '" style="padding:.34rem 0" data-a="players" data-k="' + n + '" aria-pressed="' + on + '"' + (tug && n !== 2 ? " disabled" : "") + '>' + n + "P</button>"; }).join("") +
        "</div></div>";
      if (tug) h += '<div class="text-xs qa-t2" style="line-height:1.35">⚡ 1v1 power bar · 10s rounds · both players see the same question · first to knock the bar to 100% wins.</div>';
      h += "</div>";
    }

    /* inline name */
    h += '<div class="flex items-center gap-2"><label for="qa-name" class="qa-lbl shrink-0">Name</label>';
    h += '<input id="qa-name" class="qa-in" style="padding:.4rem .7rem" type="text" maxlength="16" autocomplete="nickname" placeholder="Player" value="' + esc(S.name) + '"></div>';

    /* direct topic pills with question counts; ITI ELEC expands its own year / test-type panel right under its pill */
    var ep = elecParts(S.main, S.sub); if (ep) lastEp = ep;
    var epr = ep || lastEp, wantE = !!(elecOpen && ep), wantM = !!(wantE && ep.yr);
    h += '<div><div class="qa-lbl" style="margin-bottom:.25rem">Topic</div><div class="qa-wrapRow qa-cmp">' + TOPICS.map(function (t) {
      var n = ready ? availFor(t[0], t[1]) : 0, isE = t[1] === "elec" && t[0] === "iti", on = S.main === t[0] && (isE ? !!ep : S.sub === t[1]);
      var lbl = t[2];
      if (isE && ep && ep.yr) lbl += ' <span class="qa-sub">· ' + esc(ELEC[ep.yr].name.replace(" Year", " Yr")) + " · " + esc(ep.mod ? modName(ep.yr, ep.mod) : "Trade Test") + "</span>";
      var btn = '<button type="button" class="qa-pill btn-tap' + (on ? " on" + (topicChg ? " qa-just" : "") : "") + '" data-a="topic" data-k="' + t[0] + "|" + t[1] + '" aria-pressed="' + on + '"' + (isE ? ' aria-expanded="' + wantE + '"' : "") + (ready && !n ? " disabled" : "") + ">" + lbl +
        '<span class="qa-n">' + (ready ? n : "…") + "</span></button>";
      if (isE && epr && (wantE || xpState.elec)) btn += elecPanel(epr, ready, wantM);
      return btn;
    }).join("") + "</div></div>";

    /* 5-column question count */
    h += '<div><div class="qa-lbl" style="margin-bottom:.35rem">Questions</div><div class="qa-cnt qa-slide" data-slide="cnt"><span class="qa-ind" aria-hidden="true"></span>' +
      COUNTS.map(function (c) { return pill("count", c, c, S.count === c, !ready || !feasible(c)); }).join("") + "</div></div>";

    if (bankState === "error") {
      h += '<div class="qa-inner p-2.5 text-xs">Couldn’t load the question bank. Check your connection, then retry.<button type="button" class="qa-sec btn-tap mt-2 w-full" data-a="retry">' + ico("rotate-ccw") + "Retry</button></div>";
    }

    /* single primary CTA */
    h += '<button type="button" class="qa-cta btn-tap' + enter + '" data-a="' + (multi ? "create" : "start") + '"' + (canStart ? "" : " disabled") + ">" +
      ico(multi ? (tug ? "zap" : "plus") : "play") + (multi ? (tug ? "Create Tug of War Room" : "Create Room") : "Start Quiz") + "</button>";
    if (ready && !canStart && !(S.main === "iti" && S.sub === "elec")) h += '<div class="text-xs qa-t2 text-center" style="margin-top:-.3rem">Not enough questions in this topic yet.</div>';
    h += "</div>";
    view.innerHTML = h; icons();
    syncXp({ elec: wantE, mods: wantM });
    slideInd(view.querySelector('[data-slide="tabs"]'), "tabs"); slideInd(view.querySelector('[data-slide="cnt"]'), "cnt");
    lastDraw = { mode: S.mode, topic: topicKey, players: S.players };
  }

  /* ---------- gameplay ---------- */
  function startSolo() {
    if (bankState !== "ok" || !feasible(S.count)) return;
    var qs = pick(S).map(prep), total = qs.length * SEC_PER_Q * 1000, now = Date.now();
    G = { qs: qs, i: 0, score: 0, correct: 0, wrong: 0, total: total, startT: now, endAt: now + total, qStart: now, locked: false, tick: 0, adv: 0, quitAt: 0, done: false, timeUp: false, log: [] };
    screen = "game"; renderGame(); G.tick = setInterval(tick, 250);
  }
  function stopGame() { if (G) { clearInterval(G.tick); clearTimeout(G.adv); G.done = true; } }
  function renderGame() {
    var h = '<div class="qa-wrap">' +
      '<div class="flex items-center justify-between gap-2">' +
      '<button type="button" class="qa-ic btn-tap" data-a="quit" aria-label="Quit quiz">' + ico("x") + "</button>" +
      '<div class="qa-chip" id="qa-timechip">' + ico("clock") + '<span id="qa-time">' + fmt(G.total) + "</span></div>" +
      '<div class="qa-chip amb" id="qa-scorechip">' + ico("trophy") + '<span id="qa-score">0</span></div></div>' +
      (G.mp ? '<div class="qa-glass qa-rank" id="qa-rank">' + strip(R.room) + "</div>" : "") +
      '<div class="flex items-center justify-between text-xs mt-4 qa-t2"><span id="qa-qn" class="font-bold"></span><span>+10 to +15 · faster = more</span></div>' +
      '<div class="qa-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" id="qa-prog"><div class="qa-fill" id="qa-bar"></div></div>' +
      '<div class="qa-glass qa-card qa-nosel" id="qa-card"></div>' +
      '<div class="qa-pop" id="qa-pop"></div>' +
      '<div class="grid gap-2.5 mt-3 qa-nosel" id="qa-opts"></div></div>';
    view.innerHTML = h; icons(); showQ(); tick();
  }
  function showQ() {
    var q = G.qs[G.i], n = G.qs.length; G.locked = false; G.qStart = Date.now();
    $("qa-qn").textContent = "Question " + (G.i + 1) + " of " + n;
    setBar(G.i / n);
    $("qa-card").innerHTML = '<div class="qa-qtag">' + esc(q.tag) + '</div><p class="qa-q">' + esc(q.q) + "</p>";
    $("qa-opts").innerHTML = q.o.map(function (o, k) {
      return '<button type="button" class="qa-opt btn-tap" data-a="opt" data-k="' + k + '"><span class="qa-let">' + "ABCD".charAt(k) + '</span><span>' + esc(o.t) + "</span></button>";
    }).join("");
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
    } else { G.wrong++; try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { } }
    var btns = root.querySelectorAll(".qa-opt");
    Array.prototype.forEach.call(btns, function (b, i) {
      b.disabled = true;
      var lt = b.querySelector(".qa-let");
      if (q.o[i].ok) { b.classList.add("qa-ok"); if (lt) lt.textContent = "✓"; }
      else if (i === k) { b.classList.add("qa-bad"); if (lt) lt.textContent = "✕"; }
    });
    G.log[G.i] = { k: k, ok: ok };
    var sc = $("qa-score"); sc.textContent = G.score;
    var chip = $("qa-scorechip"); chip.classList.remove("qa-bump"); void chip.offsetWidth; if (ok) chip.classList.add("qa-bump");
    var pop = $("qa-pop"); pop.textContent = ok ? "+" + (10 + bonus) : "Wrong"; pop.className = "qa-pop " + (ok ? "" : "bad"); void pop.offsetWidth; pop.className += " go";
    setBar((G.i + 1) / G.qs.length);
    if (G.mp) mpPush(G.i + 1 >= G.qs.length);
    G.adv = setTimeout(next, 700);
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
    last = { review: review,  score: G.score, max: n * (10 + 5), correct: G.correct, wrong: G.wrong, skipped: sk, n: n, acc: Math.round(G.correct / n * 100), ms: el, label: catLabel(), name: S.name || "Player", streak: s.n, best: s.best, timeUp: G.timeUp, date: new Date() };
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
    var r = last, msg = r.acc >= 80 ? "Excellent work!" : r.acc >= 60 ? "Good job!" : r.acc >= 40 ? "Keep practising!" : "Don’t give up — try again!";
    var h = '<div class="qa-wrap">';
    h += '<div class="qa-glass p-5 text-center">' + (r.timeUp ? '<div class="text-xs font-bold" style="color:var(--bdc)">Time’s up!</div>' : "") +
      '<div class="text-sm font-bold qa-t2">' + esc(r.name) + " · " + esc(r.label) + "</div>" +
      '<div class="qa-big mt-3">' + r.score + '<span class="text-base qa-t2 font-bold"> / ' + r.max + "</span></div>" +
      '<div class="mt-2 font-extrabold">' + msg + "</div></div>";
    h += '<div class="grid grid-cols-3 gap-2 mt-3">' +
      '<div class="qa-glass qa-stat"><b>' + r.acc + "%</b><span>Accuracy</span></div>" +
      '<div class="qa-glass qa-stat"><b>' + fmt(r.ms) + "</b><span>Time taken</span></div>" +
      '<div class="qa-glass qa-stat"><b>' + r.correct + "/" + r.n + "</b><span>Correct</span></div></div>";
    h += '<div class="qa-glass mt-3 p-3 flex items-center gap-3">' + ico("flame", "qa-ac") +
      '<div class="flex-1"><div class="font-extrabold">' + r.streak + "-day streak</div><div class=\"text-xs qa-t2\">Best: " + r.best + " day" + (r.best === 1 ? "" : "s") + " · play daily to keep it alive</div></div></div>";
    h += '<div class="qa-glass mt-3 p-2.5' + (reviewOpen ? " qa-open" : "") + '" id="qa-revbox">' +
      '<button type="button" class="qa-sec btn-tap w-full" data-a="review" id="qa-revbtn" aria-expanded="' + reviewOpen + '" aria-controls="qa-rev">' + ico("list-checks") + "<span>Review Answers</span>" + ico("chevron-down", "qa-chev") + "</button>" +
      '<div class="qa-rv" id="qa-rev"' + (reviewOpen ? "" : " hidden") + ">" + reviewHtml(r) + "</div></div>";
    h += '<div class="mt-4 grid gap-2.5">' +
      '<button type="button" class="qa-cta btn-tap" data-a="again">' + ico("rotate-ccw") + "Play Again</button>" +
      '<button type="button" class="qa-sec btn-tap" data-a="dl">' + ico("download") + "Download Result Card (PNG)</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="share">' + ico("share-2") + "Share on WhatsApp</button>" : "") +
      '<button type="button" class="qa-sec btn-tap" data-a="setup">' + ico("sliders-horizontal") + "Change Settings</button></div></div>";
    view.innerHTML = h; icons();
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
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#1e293b"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W / 2, 520, 20, W / 2, 520, 620); rg.addColorStop(0, "rgba(251,191,36,.26)"); rg.addColorStop(1, "rgba(251,191,36,0)"); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fbbf24"; x.font = "800 40px " + F; x.fillText("QUIZ RESULT", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f1f5f9"; x.font = "700 58px " + F; x.fillText(fit(x, r.name, 900), W / 2, 210);
    x.fillStyle = "#94a3b8"; x.font = "500 34px " + F; x.fillText(fit(x, r.label, 900), W / 2, 268);
    var cx = W / 2, cy = 520, R = 190;
    x.lineWidth = 30; x.lineCap = "round"; x.strokeStyle = "rgba(148,163,184,.25)"; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    if (r.acc > 0) { x.strokeStyle = "#fbbf24"; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * r.acc / 100); x.stroke(); }
    x.fillStyle = "#f1f5f9"; x.font = "800 120px " + F; x.fillText(r.acc + "%", cx, cy + 36);
    x.fillStyle = "#94a3b8"; x.font = "700 30px " + F; x.fillText("ACCURACY", cx, cy + 90);
    x.fillStyle = "#fbbf24"; x.font = "900 150px " + F; x.fillText(String(r.score), cx, 880);
    x.fillStyle = "#94a3b8"; x.font = "600 34px " + F; x.fillText("of " + r.max + " points", cx, 934);
    var stats = [["CORRECT", r.correct + "/" + r.n], ["TIME", fmt(r.ms)], ["STREAK", r.streak + (r.streak === 1 ? " day" : " days")]];
    stats.forEach(function (s, i) {
      var bx = 70 + i * 322, by = 1000, bw = 296, bh = 140;
      rr(x, bx, by, bw, bh, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(148,163,184,.3)"; x.stroke();
      x.fillStyle = "#f1f5f9"; x.font = "800 52px " + F; x.fillText(s[1], bx + bw / 2, by + 70);
      x.fillStyle = "#94a3b8"; x.font = "700 26px " + F; x.fillText(s[0], bx + bw / 2, by + 112);
    });
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fbbf24"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
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

  /* ---------- multiplayer (Part 3: Firebase Firestore, battles/{roomCode}) ---------- */
  var FB_V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXPIRE_MS = 24 * 3600 * 1000;
  var INVITE_BASE = "https://devit988.github.io/Iti-attendance-/?battle=";
  var MEDAL = ["🥇", "🥈", "🥉", "4️⃣"];
  var M = window.QuizArenaMulti = window.QuizArenaMulti || {};

  function online() { return navigator.onLine !== false; }
  function fbCore() {            /* app + firestore only (no sign-in): used for public reads */
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
  function loadFb() {            /* core + anonymous player id (live rooms only) */
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
      return '<span class="qa-rk' + (p.id === R.uid ? " me" : "") + '">' + MEDAL[i] + " <span class=\"qa-rn\">" + esc(p.name) + "</span> " + p.score + "</span>";
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
      if (Math.abs(base - (recv + 3000)) > 8000) base = recv + 3000;   /* guards against wrong phone clocks */
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
      if (el && el.textContent !== String(n)) { el.textContent = n; el.classList.remove("qa-bump"); void el.offsetWidth; el.classList.add("qa-bump"); }
    }, 100);
  }
  function startMulti(base) {
    if (tugOn(R.room)) { startTug(base); return; }
    var byId = {}; baseBank.forEach(function (q) { byId[q.id] = q; }); custom.items.forEach(function (it) { if (it && !checkQ(it)) byId[it.id] = it; }); bank.forEach(function (q) { byId[q.id] = q; });
    var qs = (R.room.qIds || []).map(function (id) { return byId[id]; }).filter(Boolean).map(prep);
    if (qs.length !== R.room.qIds.length) { toast("Question bank is out of date — refresh the app"); leaveRoom(); return; }
    var total = qs.length * SEC_PER_Q * 1000;
    G = { qs: qs, i: 0, score: 0, correct: 0, wrong: 0, total: total, startT: base, endAt: base + total, qStart: Date.now(), locked: false, tick: 0, adv: 0, quitAt: 0, done: false, timeUp: false, mp: true, log: [] };
    screen = "game"; renderGame(); G.tick = setInterval(tick, 250);
  }

  /* --- score sync: ONLY this player's nested fields are written --- */
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
    if (!root || !document.body.contains(root)) { clearInterval(R.watch); var r = R; if (G && !G.done) { G.timeUp = true; mpPush(true); } teardown(); return; }
    var left = R.base + R.room.questionCount * SEC_PER_Q * 1000 - Date.now(), t = $("qa-wait-time");
    if (t) t.textContent = fmt(left);
    if (left < -2500 && R.room.status === "playing") { if (G && !G.done) { G.timeUp = true; finish(); } scheduleEnd(); }
  }
  function onFinished(d) {
    if (tugOn(d)) { onTugFinished(d); return; }
    if (!R.started && screen !== "mresult") { resetMatch(); }      /* joined late / missed the start */
    if (G && G.mp) { if (!G.done) stopGame(); }
    clearInterval(R.watch); clearTimeout(R.endT);
    R.final = rankList(d);
    if (screen !== "mresult") { bumpStreak(); screen = "mresult"; }
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
      if (tug && d.forfeitId && id === d.forfeitId && id !== R.uid) return;      /* the player who left is not carried into the rematch */
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
    h = '<div class="qa-wrap"><div class="flex items-center justify-between"><div class="flex items-center gap-2">' + ico("users", "qa-ac") + '<span class="text-lg font-extrabold">Live Room</span></div>' +
      '<button type="button" class="qa-ic btn-tap" data-a="leave" aria-label="Leave room">' + ico("x") + "</button></div>";
    h += '<div class="qa-glass p-5 text-center mt-3"><div class="text-xs font-bold qa-t2">ROOM CODE</div><div class="qa-code">' + R.code + '</div>' +
      '<div class="text-xs qa-t2 mt-1">' + (tugOn(d) ? "⚡ Tug of War · 1v1 · " : "") + esc(d.categoryLabel) + " · " + d.questionCount + " questions</div></div>";
    h += '<div class="grid grid-cols-2 gap-2.5 mt-3"><button type="button" class="qa-sec btn-tap" data-a="copy">' + ico("copy") + "Copy Code</button>" +
      '<a class="qa-sec btn-tap" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + "Invite on WhatsApp</a></div>";
    h += '<div class="qa-lbl">Players · ' + n + " / " + d.maxPlayers + '</div><div class="grid gap-2">';
    for (i = 0; i < d.maxPlayers; i++) {
      if (ids[i]) {
        h += '<div class="qa-glass qa-slot"><span class="qa-let">' + (i + 1) + '</span><span class="flex-1 truncate font-bold">' + esc(d.players[ids[i]].name) + (ids[i] === R.uid ? " (You)" : "") + "</span>" +
          (ids[i] === d.hostId ? '<span class="text-xs qa-ac font-extrabold">HOST</span>' : "") + "</div>";
      } else h += '<div class="qa-slot qa-empty"><span class="qa-let">' + (i + 1) + '</span><span class="qa-t2 text-sm">Waiting for player…</span></div>';
    }
    h += "</div>";
    if (R.isHost) {
      h += '<div class="mt-4"><button type="button" class="qa-cta btn-tap" data-a="startnow"' + (n < 2 || R.starting ? " disabled" : "") + ">" + ico("play") + "Start Now</button>" +
        '<div class="text-xs qa-t2 mt-2 text-center">' + (n < 2 ? "Need at least 2 players to start" : "Starts automatically when all " + d.maxPlayers + " players join") + "</div></div>";
    } else h += '<div class="text-sm qa-t2 mt-4 text-center">Waiting for the host to start…</div>';
    h += "</div>";
    view.innerHTML = h; icons();
  }
  function renderCountdown() {
    view.innerHTML = '<div class="qa-wrap text-center" style="padding-top:18vh"><div class="text-sm font-bold qa-t2">' + (tugOn(R.room) ? "⚡ Power Clash — get ready!" : "Get ready!") + '</div><div class="qa-big qa-bump" id="qa-cd" style="font-size:7rem;margin-top:1rem">3</div>' +
      '<div class="text-xs qa-t2 mt-4">' + esc(R.room.categoryLabel) + " · " + R.room.questionCount + " questions</div></div>";
  }
  function renderWait() {
    var d = R.room, rk = rankList(d), me = d.players[R.uid] || { score: 0 }, h;
    h = '<div class="qa-wrap"><div class="qa-glass p-5 text-center"><div class="text-xs font-bold qa-t2">You finished!</div><div class="qa-big mt-2">' + me.score + '</div>' +
      '<div class="text-xs qa-t2 mt-3">Waiting for others · max <span id="qa-wait-time">' + fmt(Math.max(0, R.base + d.questionCount * SEC_PER_Q * 1000 - Date.now())) + "</span></div></div>" +
      '<div class="grid gap-2 mt-3">' + rk.map(function (p, i) {
        return '<div class="qa-glass qa-slot"><span class="qa-let">' + (i + 1) + '</span><span class="flex-1 truncate font-bold">' + esc(p.name) + (p.id === R.uid ? " (You)" : "") + '</span><span class="text-xs qa-t2">' +
          (p.done ? "Done ✓" : "Q " + Math.min(p.qIndex + 1, d.questionCount) + "/" + d.questionCount) + '</span><b>' + p.score + "</b></div>";
      }).join("") + "</div></div>";
    view.innerHTML = h;
  }
  function renderPodium() {
    if (tugOn(R.room)) { renderTugResult(); return; }
    var rk = R.final, d = R.room, myPos = 0, h, order, hts = [120, 92, 70], ordn = [];
    rk.forEach(function (p, i) { if (p.id === R.uid) myPos = i + 1; });
    h = '<div class="qa-wrap"><div class="qa-glass p-4 text-center"><div class="text-xs font-bold qa-t2">' + esc(d.categoryLabel) + '</div><div class="text-lg font-extrabold mt-1">Battle Results</div>' +
      '<div class="text-sm qa-ac font-bold mt-1">' + (myPos === 1 ? "You won! 🏆" : "You finished " + MEDAL[myPos - 1] + " (#" + myPos + ")") + "</div></div>";
    order = rk.length > 2 ? [1, 0, 2] : [1, 0];
    order.forEach(function (i) { if (rk[i]) ordn.push(i); });
    h += '<div class="qa-pod">' + ordn.map(function (i) {
      var p = rk[i];
      return '<div class="qa-pcol"><div class="qa-pn">' + esc(p.name) + '</div><div class="qa-ps">' + p.score + '</div><div class="qa-pbar r' + i + '" style="height:' + hts[i] + 'px">' + (i + 1) + "</div></div>";
    }).join("") + "</div>";
    if (rk[3]) h += '<div class="qa-glass qa-slot mt-3"><span class="qa-let">4</span><span class="flex-1 truncate font-bold">' + esc(rk[3].name) + '</span><b>' + rk[3].score + "</b></div>";
    h += '<div class="mt-4 grid gap-2.5">';
    if (R.isHost && !R.closed) h += '<button type="button" class="qa-cta btn-tap" data-a="rematch"' + (busy ? " disabled" : "") + ">" + ico("rotate-ccw") + "Rematch (new questions)</button>";
    else if (!R.closed) h += '<div class="text-xs qa-t2 text-center">Waiting for the host to start a rematch…</div>';
    h += '<button type="button" class="qa-sec btn-tap" data-a="mdl">' + ico("download") + "Download Podium Card (PNG)</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="mshare">' + ico("share-2") + "Share on WhatsApp</button>" : "") +
      '<button type="button" class="qa-sec btn-tap" data-a="leave">' + ico("log-out") + "Leave Room</button></div></div>";
    view.innerHTML = h; icons();
  }

  /* --- PNG podium card --- */
  function drawPodium(rk, d) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#1e293b"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W / 2, 640, 20, W / 2, 640, 640); rg.addColorStop(0, "rgba(251,191,36,.22)"); rg.addColorStop(1, "rgba(251,191,36,0)"); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fbbf24"; x.font = "800 40px " + F; x.fillText("QUIZ BATTLE", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f1f5f9"; x.font = "700 52px " + F; x.fillText(fit(x, rk[0].name + " wins!", 900), W / 2, 215);
    x.fillStyle = "#94a3b8"; x.font = "500 34px " + F; x.fillText(fit(x, d.categoryLabel + " · " + d.questionCount + " Qs", 900), W / 2, 272);
    var cols = [{ i: 1, cx: 230, h: 250 }, { i: 0, cx: 540, h: 340 }, { i: 2, cx: 850, h: 190 }], base = 1000, bw = 290;
    var fills = [["#fde68a", "#f59e0b"], ["#e2e8f0", "#94a3b8"], ["#fdba74", "#c2410c"]];
    cols.forEach(function (col) {
      var p = rk[col.i]; if (!p) return;
      var top = base - col.h, gr = x.createLinearGradient(0, top, 0, base); gr.addColorStop(0, fills[col.i][0]); gr.addColorStop(1, fills[col.i][1]);
      rr(x, col.cx - bw / 2, top, bw, col.h, 24); x.fillStyle = gr; x.fill();
      x.fillStyle = "#1c1100"; x.font = "900 120px " + F; x.fillText(String(col.i + 1), col.cx, top + 140);
      x.fillStyle = "#f1f5f9"; x.font = "700 40px " + F; x.fillText(fit(x, p.name, bw), col.cx, top - 84);
      x.fillStyle = "#fbbf24"; x.font = "900 60px " + F; x.fillText(String(p.score), col.cx, top - 20);
    });
    if (rk[3]) {
      rr(x, 70, 1048, 940, 112, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(148,163,184,.3)"; x.stroke();
      x.textAlign = "left"; x.fillStyle = "#94a3b8"; x.font = "900 56px " + F; x.fillText("4", 110, 1124);
      x.fillStyle = "#f1f5f9"; x.font = "700 44px " + F; x.fillText(fit(x, rk[3].name, 600), 190, 1121);
      x.textAlign = "right"; x.fillStyle = "#fbbf24"; x.font = "900 52px " + F; x.fillText(String(rk[3].score), 970, 1122); x.textAlign = "center";
    }
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fbbf24"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
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

  /* room config sent to M.createRoom (tug rooms: 2 players, regular questions + sudden-death reserves) */
  function cfg() {
    var tug = S.battle === "tug";
    return {
      name: S.name || "Player", players: tug ? 2 : S.players, battle: tug ? "tug" : "classic", count: S.count, main: S.main, sub: S.sub, label: catLabel(), secPerQ: SEC_PER_Q,
      questionIds: tug ? tugIds(S) : pick(S).map(function (q) { return q.id; })
    };
  }

  /* =====================================================================
   *  1v1 HIGH-VOLTAGE TUG OF WAR  (battleType: "tug")
   *  Extra fields on battles/{code} (tug rooms only):
   *    battleType:"tug"  rope:50 (the HOST's share of the bar, 0-100; each player sees themself on the left)
   *    roundIndex  roundStartAt(ms)  lastRes{r,w,pull,od,h,o,sd}  winnerId  endReason  forfeitId
   *    players.{uid}: { ans:{r,k,ok,ms}, streak, miss }   (a player only ever writes their OWN ans)
   *    qIds = questionCount regular questions + up to TUG_SD sudden-death reserves
   *  Rounds resolve inside a Firestore transaction guarded by roundIndex, so no matter which
   *  client (or both) tries, exactly one resolution is applied per round.
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
  function tugExtra(c, ids) {          /* sudden-death reserves: same topic first, then anything, then (tiny bank) a repeat */
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

  /* --- pure round resolver (used inside the transaction and as a "is it ready?" dry-run) --- */
  function tugCompute(d, forced) {
    var hid = d.hostId, oid = otherOf(d, hid), A = d.players && d.players[hid], B = oid && d.players[oid];
    if (!A || !B) return null;
    var r = d.roundIndex || 0, n = d.questionCount || 0, sd = r >= n;
    var a = A.ans && A.ans.r === r ? A.ans : null, b = B.ans && B.ans.r === r ? B.ans : null;
    var aOk = !!(a && a.ok), bOk = !!(b && b.ok);
    /* ready when both answered, or (sudden death) someone already got it right, or the timer ran out */
    if (!forced && !(a && b) && !(sd && (aOk || bOk))) return null;
    var rope = typeof d.rope === "number" ? d.rope : 50;
    var nA = aOk ? (A.streak || 0) + 1 : 0, nB = bOk ? (B.streak || 0) + 1 : 0;           /* consecutive-correct streaks */
    var mA = a ? 0 : (A.miss || 0) + 1, mB = b ? 0 : (B.miss || 0) + 1;                    /* consecutive no-answer rounds */
    var win = "", pull = 0, od = "", end = "", winner = "", forfeit = "", base = 0;
    if (sd) {
      if (aOk && bOk) win = a.ms <= b.ms ? hid : oid; else if (aOk) win = hid; else if (bOk) win = oid;
      if (win) { end = "sudden"; winner = win; }
    } else {
      if (aOk !== bOk) { win = aOk ? hid : oid; base = TUG_PULL; }                         /* one right, one wrong: +15 */
      else if (aOk && bOk) { win = a.ms <= b.ms ? hid : oid; base = TUG_TIE; }            /* both right: faster pulls +8 */
      if (win) {
        var over = (win === hid ? nA : nB) >= 3;                                           /* Overdrive: 3rd+ correct in a row */
        pull = Math.round(base * (over ? TUG_OVER : 1)); if (over) od = win;
        rope = clamp(rope + (win === hid ? pull : -pull), 0, 100);
      }
    }
    if (!end) {
      if (rope >= 100) { end = "ko"; winner = hid; }
      else if (rope <= 0) { end = "ko"; winner = oid; }
      else if (mA >= TUG_MISS && mB < TUG_MISS) { end = "forfeit"; winner = oid; forfeit = hid; }      /* opponent vanished */
      else if (mB >= TUG_MISS && mA < TUG_MISS) { end = "forfeit"; winner = hid; forfeit = oid; }
      else if (mA >= TUG_MISS && mB >= TUG_MISS) { end = rope === 50 ? "draw" : "points"; winner = rope > 50 ? hid : rope < 50 ? oid : ""; }
      else if (!sd && r >= n - 1 && rope !== 50) { end = "points"; winner = rope > 50 ? hid : oid; }
      else if (sd && r + 1 >= (d.qIds || []).length) { end = "draw"; winner = ""; }               /* sudden-death reserves used up */
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
        if (d.status !== "playing" || d.battleType !== "tug" || (d.roundIndex || 0) !== round) return null;   /* someone already resolved it */
        var res = tugCompute(d, forced); if (!res) return null;
        tx.update(r0.ref, res.up); return res;
      });
    }).catch(function () { }).then(function () { r0.resBusy = false; });
  }
  function tugMaybeResolve(d) {         /* both answered (or sudden-death hit): resolve right away, host first */
    if (!R || d.status !== "playing") return;
    var r = d.roundIndex || 0;
    if (R.resSched === r || !tugCompute(d, false)) return;
    R.resSched = r; clearTimeout(R.resT);
    R.resT = setTimeout(function () { if (R) tugResolve(r, false); }, R.isHost ? 120 : 700 + Math.random() * 500);
  }
  function tugForfeit() {               /* leaving mid-match: the opponent wins immediately */
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

  /* --- match lifecycle on this device --- */
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
    if (prev < 0) { G.roundStart = R.base; G.flash = null; tugShowQ(); return; }          /* first question: countdown just ended */
    G.roundStart = Math.abs(rsa - want) <= 600 ? rsa : want;                             /* trust the shared start only if clocks agree */
    G.phase = "wait"; G.flash = tugFlash(d, false);
    if (lr && lr.od) {
      G.shake = true;
      if (lr.od === R.uid) { try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { } }
    }
  }
  function tugSync(d) {                 /* every room snapshot lands here while a tug match is on screen */
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
    up["players." + R.uid + ".ans"] = { r: G.round, k: k, ok: ok, ms: ms };
    F.updateDoc(ref, up).catch(function () { setTimeout(function () { F.updateDoc(ref, up).catch(function () { }); }, 900); });
    G.paintKey = ""; tugPaintCard(); tugStatus();
  }
  function tugTick() {                  /* 5x/second: timer, question reveal, timeout resolution, disconnect safety */
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
      if (rem <= 0 && !G.locked) { G.locked = true; G.paintKey = ""; tugPaintCard(); tugStatus(); }       /* time's up: counts as a miss */
    } else {
      setT("qa-ttime", String(TUG_SEC)); if (bar) bar.style.width = "100%"; if (chip) chip.classList.remove("low"); if (tt) tt.classList.remove("low");
    }
    /* timeout / stuck-opponent safety net: whoever is still here resolves the round (host first, guest a bit later) */
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
    bumpStreak(); screen = "mresult"; render();
  }

  /* --- tug screen: shell is built once, then only the changing bits are painted --- */
  function renderTug() {
    var h = '<div class="qa-wrap"><div class="flex items-center justify-between gap-2">' +
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
      '<div class="grid gap-2.5 mt-3 qa-nosel" id="qa-topts"></div>' +
      '<div class="text-xs qa-t2 text-center mt-3" id="qa-tstat" style="min-height:1rem"></div></div>';
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
    if (t) { t.classList.toggle("crit-l", my <= 20); t.classList.toggle("crit-r", my >= 80); }      /* losing side pulses red/amber */
  }
  function tugPaintCard() {
    var card = $("qa-tcard"), opts = $("qa-topts"); if (!card || !opts || !G) return;
    var key = G.phase + "|" + G.round + "|" + G.picked + "|" + (G.locked ? 1 : 0) + "|" + (G.flash ? G.flash.title : "");
    if (key !== G.paintKey) {            /* only rebuild when something visible changed (keeps taps reliable) */
      G.paintKey = key;
      if (G.phase === "q" && G.qs[G.round]) {
        var q = G.qs[G.round], done = G.locked || G.picked > -1;
        card.innerHTML = '<div class="qa-qtag">' + esc(q.tag) + '</div><p class="qa-q">' + esc(q.q) + "</p>";
        opts.innerHTML = q.o.map(function (o, k) {
          var cls = "qa-opt btn-tap", lt = "ABCD".charAt(k);
          if (done) { if (o.ok) { cls += " qa-ok"; lt = "✓"; } else if (k === G.picked) { cls += " qa-bad"; lt = "✕"; } }
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

  /* --- result screen --- */
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
    var h = '<div class="qa-wrap"><div class="qa-glass p-5 text-center">' +
      '<div class="text-xs font-bold qa-t2" style="letter-spacing:.14em">1V1 POWER CLASH</div>' +
      '<div class="text-xs qa-t2 mt-1">' + esc(d.categoryLabel) + "</div>" +
      '<div class="qa-vs mt-3"><span class="a">' + my + '%</span><span class="v">vs</span><span class="b">' + (100 - my) + "%</span></div>" +
      '<div class="flex justify-between gap-3 mt-1 text-xs font-extrabold"><span class="truncate min-w-0" style="color:var(--tgat);max-width:46%">' + esc(mn) + ' (You)</span><span class="truncate min-w-0" style="color:var(--tgbt);max-width:46%">' + esc(on) + "</span></div>" +
      '<div class="qa-beamw" style="margin-top:.5rem"><div class="qa-beam"><div class="qa-bl" style="width:' + my + '%"></div><div class="qa-br" style="width:' + (100 - my) + '%"></div></div>' +
      '<div class="qa-lane"><div class="qa-core" style="left:' + my + '%"></div></div></div>' +
      '<div class="mt-4"><span class="qa-win' + (won ? "" : " lose") + '">' + badge + "</span></div>" +
      '<div class="text-xs qa-t2 mt-2">' + esc(line) + "</div></div>";
    h += '<div class="mt-4 grid gap-2.5">';
    if (R.isHost && !R.closed) h += '<button type="button" class="qa-cta btn-tap" data-a="rematch"' + (busy ? " disabled" : "") + ">" + ico("rotate-ccw") + "Rematch (new questions)</button>";
    else if (!R.closed) h += '<div class="text-xs qa-t2 text-center">' + (hostGone ? "The host left — leave to start a new room" : "Waiting for the host to start a rematch…") + "</div>";
    h += '<button type="button" class="qa-sec btn-tap" data-a="mdl">' + ico("download") + "Download Victory Card (PNG)</button>" +
      (canShareFiles() ? '<button type="button" class="qa-sec btn-tap" data-a="mshare">' + ico("share-2") + "Share on WhatsApp</button>" : "") +
      '<button type="button" class="qa-sec btn-tap" data-a="leave">' + ico("log-out") + "Leave Room</button></div></div>";
    view.innerHTML = h; icons();
  }

  /* --- PNG victory card (same canvas style as drawPodium; the winner is drawn on the amber left side) --- */
  function drawTugCard(d) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var hid = d.hostId, oid = otherOf(d, hid), rope = pctOf(d), winG = !!d.winnerId && d.winnerId === oid;
    var lid = winG ? oid : hid, rid = winG ? hid : oid, lp = winG ? 100 - rope : rope, rp = 100 - lp;
    var ln = d.players[lid] ? d.players[lid].name : "Player", rn = d.players[rid] ? d.players[rid].name : "Opponent";
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#1e293b"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var g1 = x.createRadialGradient(250, 700, 10, 250, 700, 560); g1.addColorStop(0, "rgba(251,191,36,.26)"); g1.addColorStop(1, "rgba(251,191,36,0)"); x.fillStyle = g1; x.fillRect(0, 0, W, H);
    var g2 = x.createRadialGradient(830, 700, 10, 830, 700, 560); g2.addColorStop(0, "rgba(34,211,238,.22)"); g2.addColorStop(1, "rgba(34,211,238,0)"); x.fillStyle = g2; x.fillRect(0, 0, W, H);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    x.fillStyle = "#fbbf24"; x.font = "800 40px " + F; x.fillText("POWER CLASH", W / 2, 120);
    if ("letterSpacing" in x) x.letterSpacing = "4px";
    x.fillStyle = "#94a3b8"; x.font = "700 28px " + F; x.fillText("1V1 TUG OF WAR", W / 2, 170);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#f1f5f9"; x.font = "900 104px " + F; x.fillText(d.winnerId ? "VICTORY" : "DEAD HEAT", W / 2, 330);
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
    var ga = x.createLinearGradient(bx, 0, Math.max(sx, bx + 1), 0); ga.addColorStop(0, "#f59e0b"); ga.addColorStop(1, "#fbbf24"); x.fillStyle = ga; x.fillRect(bx, by, sx - bx, bh);
    var gb = x.createLinearGradient(Math.min(sx, bx + bw - 1), 0, bx + bw, 0); gb.addColorStop(0, "#22d3ee"); gb.addColorStop(1, "#0891b2"); x.fillStyle = gb; x.fillRect(sx, by, bx + bw - sx, bh);
    x.restore();
    x.save(); x.shadowColor = "rgba(255,255,255,.95)"; x.shadowBlur = 44;
    var cg = x.createRadialGradient(sx, cy, 2, sx, cy, 40); cg.addColorStop(0, "#ffffff"); cg.addColorStop(.35, "#fef3c7"); cg.addColorStop(.62, "rgba(251,191,36,.9)"); cg.addColorStop(1, "rgba(34,211,238,0)");
    x.fillStyle = cg; x.beginPath(); x.arc(sx, cy, 40, 0, Math.PI * 2); x.fill(); x.restore();
    x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 4; x.lineCap = "round";
    [35, -35].forEach(function (deg) { var a = deg * Math.PI / 180; x.beginPath(); x.moveTo(sx - Math.cos(a) * 52, cy - Math.sin(a) * 52); x.lineTo(sx + Math.cos(a) * 52, cy + Math.sin(a) * 52); x.stroke(); });
    var rs = { ko: "K.O.", points: "POINTS", sudden: "SUDDEN", forfeit: "FORFEIT", draw: "DRAW" }[d.endReason] || "—";
    var stats = [["RESULT", rs], ["ROUNDS", String(d.lastRes ? d.lastRes.r + 1 : 0)], ["MARGIN", Math.abs(lp - rp) + "%"]];
    stats.forEach(function (s, i) {
      var sbx = 70 + i * 322, sby = 1000, sbw = 296, sbh = 140;
      rr(x, sbx, sby, sbw, sbh, 28); x.fillStyle = "rgba(255,255,255,.07)"; x.fill(); x.lineWidth = 2; x.strokeStyle = "rgba(148,163,184,.3)"; x.stroke();
      x.fillStyle = "#f1f5f9"; x.font = "800 52px " + F; x.fillText(fit(x, s[1], sbw - 30), sbx + sbw / 2, sby + 70);
      x.fillStyle = "#94a3b8"; x.font = "700 26px " + F; x.fillText(s[0], sbx + sbw / 2, sby + 112);
    });
    x.fillStyle = "rgba(148,163,184,.3)"; x.fillRect(140, 1205, W - 280, 2);
    if ("letterSpacing" in x) x.letterSpacing = "10px";
    x.fillStyle = "#fbbf24"; x.font = "900 58px " + F; x.fillText("ITI CONNECT", W / 2, 1278);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#94a3b8"; x.font = "500 28px " + F; x.fillText(new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), W / 2, 1322);
    return c;
  }
  function tugShareText() {
    var d = R.room, w = d.winnerId && d.players[d.winnerId] ? d.players[d.winnerId].name : "";
    return (w ? w + " won" : "It ended in a dead heat in") + " a 1v1 Power Clash on ITI CONNECT Quiz Arena (" + myPct(d) + "% vs " + (100 - myPct(d)) + "%)!";
  }


  /* ---------- custom questions: Firestore quiz_meta/custom_questions (1 read) + merge ---------- */
  var CAT = [
    ["iti", "y1", "ITI Trade · 1st Year"], ["iti", "y2", "ITI Trade · 2nd Year"],
    ["iti", "wcs", "ITI · Workshop Calc & Science"], ["iti", "draw", "ITI · Engineering Drawing"], ["iti", "safe", "ITI · Safety & Tools"],
    ["sci", "phy", "Science · Physics"], ["sci", "chem", "Science · Chemistry"], ["sci", "bio", "Science · Biology"],
    ["gs", "his", "GS · History"], ["gs", "geo", "GS · Geography"], ["gs", "pol", "GS · Polity & Static"], ["gs", "eco", "GS · Indian Economy"], ["gs", "comp", "GS · Computer Basics"],
    ["apt", "math", "Aptitude · Maths"], ["apt", "eng", "Aptitude · English"], ["apt", "reason", "Aptitude · Reasoning"]
  ];
  var GROUPS = { iti: ["y1", "y2", "wcs", "draw", "safe"], sci: ["phy", "chem", "bio"], gs: ["his", "geo", "pol", "eco", "comp"], apt: ["math", "eng", "reason"] };
  var CQ_MAX_BYTES = 900000;   /* Firestore doc limit is 1 MiB */

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
  /* base JSON + custom overrides: same id replaces, deleted hides, new id appended */
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
      if (prev && prev.mod && prev.sub === it.sub) map[it.id].mod = prev.mod;   /* edited question keeps its module */
      if (!seen) order.push(it.id);
    });
    bank = order.map(function (id) { return map[id]; }).filter(Boolean);
  }
  function nextId(items) {     /* never reuses an id: counts base, custom and deleted ids */
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
  function syncCustom() {          /* one Firestore read; localStorage copy stays as the offline fallback */
    if (!online()) return;
    var t = new Promise(function (_, no) { setTimeout(function () { no(new Error("timeout")); }, 8000); });
    var rd = fbCore().then(function (c) { return c.F.getDoc(c.F.doc(c.db, "quiz_meta", "custom_questions")); })
      .then(function (s) { return s.exists() ? s.data() : { updatedAt: 0, items: [] }; });
    Promise.race([rd, t]).then(applyCustom).catch(function () { });
  }
  function writeCustom(mutate) {   /* admin write: read-modify-write in a transaction on the single doc */
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
    h = '<div class="qa-wrap"><div class="flex items-center justify-between"><button type="button" class="qa-ic btn-tap" data-a="adback" aria-label="Back">' + ico("arrow-left") + '</button>' +
      '<div class="text-lg font-extrabold">Manage Questions</div><div style="width:2.4rem"></div></div>' +
      '<div class="text-xs qa-t2 text-center mt-1">' + baseBank.length + " base · " + nCus + " custom · " + nDel + " hidden · " + bank.length + " in play</div>" +
      '<div class="qa-row mt-3">' + [["single", "Add / Edit"], ["bulk", "Bulk Add"], ["list", "Custom List"]].map(function (m) { return pill("admode", m[0], m[1], AD.mode === m[0], false); }).join("") + "</div>";
    if (AD.mode === "single") {
      h += '<div class="qa-glass p-3 mt-3">' +
        (f.id ? '<div class="flex items-center justify-between mb-2"><span class="qa-qtag">Editing #' + f.id + '</span><button type="button" class="qa-pill btn-tap" data-a="adcancel">Cancel edit</button></div>' : "") +
        '<div class="qa-lbl" style="margin-top:0">Category</div>' + catSel("cat", f.cat) +
        '<div class="qa-lbl">Question</div><textarea class="qa-in" rows="3" maxlength="400" data-f="q" placeholder="Type the question">' + esc(f.q) + "</textarea>" +
        '<div class="qa-lbl">Options</div>' + [0, 1, 2, 3].map(function (i) {
          return '<div class="flex items-center gap-2 mt-2"><span class="qa-let">' + "ABCD".charAt(i) + '</span><input class="qa-in" type="text" maxlength="150" data-f="o' + i + '" placeholder="Option ' + "ABCD".charAt(i) + '" value="' + esc(f.o[i]) + '"></div>';
        }).join("") +
        '<div class="qa-lbl">Correct answer</div><div class="qa-row">' + [0, 1, 2, 3].map(function (i) { return pill("adans", i, "ABCD".charAt(i), f.ans === i, false); }).join("") + "</div></div>" +
        '<button type="button" class="qa-cta btn-tap mt-3" data-a="adsave"' + (AD.busy ? " disabled" : "") + ">" + ico("save") + (f.id ? "Update Question" : "Save Question") + "</button>";
    } else if (AD.mode === "bulk") {
      h += '<div class="qa-glass p-3 mt-3"><div class="qa-lbl" style="margin-top:0">Bulk default category</div>' + catSel("bcat", AD.bulk.cat) +
        '<div class="text-xs qa-t2 mt-2">Used when an item has no group / sub. Paste either format:</div>' +
        '<pre class="qa-pre">Quick lines (one per line):\nQuestion | Option A | Option B | Option C | Option D | C\n(correct = A–D or 1–4)\n\nJSON array:\n[{"q":"…","opts":["a","b","c","d"],"ans":2}]\n(group, sub optional · ans = 0–3)</pre>' +
        '<textarea class="qa-in" rows="8" data-f="btext" spellcheck="false" placeholder="Paste questions here" style="font-family:ui-monospace,Menlo,monospace;font-size:13px">' + esc(AD.bulk.text) + "</textarea>" +
        '<div class="grid grid-cols-2 gap-2 mt-3"><button type="button" class="qa-sec btn-tap" data-a="adparse">' + ico("list-checks") + 'Preview &amp; Validate</button>' +
        '<button type="button" class="qa-sec btn-tap" data-a="adclear">' + ico("eraser") + "Clear</button></div></div>" +
        '<div id="ad-bres">' + bulkResHtml() + "</div>";
    } else {
      h += '<div class="qa-row mt-3">' + [["custom", "Custom"], ["deleted", "Hidden"], ["all", "All questions"]].map(function (m) { return pill("adscope", m[0], m[1], AD.scope === m[0], false); }).join("") + "</div>" +
        '<input class="qa-in mt-2" type="search" data-f="search" placeholder="Search text or ID" value="' + esc(AD.search) + '">' +
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

  /* single add / edit */
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

  /* bulk add */
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
    h = '<div class="qa-glass p-3 mt-3"><div class="font-extrabold"><span style="color:var(--okc)">✓ ' + r.ok.length + ' valid</span> · <span style="color:' + (r.bad.length ? "var(--bdc)" : "var(--t2)") + '">✗ ' + r.bad.length + " problem" + (r.bad.length === 1 ? "" : "s") + "</span></div>";
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

  /* custom list */
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
        if (baseById[id]) return;                       /* back to the original question */
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
    if (a === "mode") { S.mode = k === "multi" ? "multi" : "solo"; if (S.mode === "multi" && [2, 3, 4].indexOf(S.players) < 0) S.players = 2; savePrefs(); renderSetup(); }
    else if (a === "topic") { var tp = k.split("|"), isE = tp[0] === "iti" && tp[1] === "elec";
      if (isE) { if (elecParts(S.main, S.sub)) elecOpen = !elecOpen; else { S.main = "iti"; S.sub = "elec"; elecOpen = true; } }
      else { S.main = tp[0]; S.sub = tp[1]; elecOpen = false; }
      ensureCount(); savePrefs(); renderSetup(); }
    else if (a === "yr") { S.main = "iti"; S.sub = k === "y2" ? "y2" : "y1"; elecOpen = true; ensureCount(); savePrefs(); renderSetup(); }
    else if (a === "mod") { var ep0 = elecParts(S.main, S.sub); if (ep0 && ep0.yr) { S.sub = ep0.yr + (k ? ":" + k : ""); elecOpen = false; ensureCount(); savePrefs(); renderSetup(); } }
    else if (a === "review") toggleReview();
    else if (a === "players") { S.players = +k; savePrefs(); renderSetup(); }
    else if (a === "btype") { S.battle = k === "tug" ? "tug" : "classic"; savePrefs(); renderSetup(); }
    else if (a === "count") { S.count = +k; savePrefs(); renderSetup(); }
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
        readCachedCustom(); rebuildBank();           /* offline-safe: last cached custom questions */
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

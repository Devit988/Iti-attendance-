/*! ITI CONNECT — Chor Police (Raja Mantri Chor Sipahi) v1.0
 *  Drop-in Arena module. Load right AFTER ./arena_games.js in index.html.
 *  Plugs into #quiz-arena-root alongside Quiz & Clash, Ludo, and Snakes & Ladders.
 *  Modes: Solo vs Bots | Pass & Play (Hold-to-Peek) | Online Rooms (2–6P + Bot Auto-Fill & 3P Hidden Raja)
 *  Features: Config-driven 3P/4P/5P/6P rules, Two-Stage Double Hunt (Daku + Chor),
 *            Customizable points/names/rounds/timer, Live Bilingual Cards (EN / বাংলা / Both).
 */
(function () {
  "use strict";

  if (window.ChorPoliceArena) return;

  var LS_LANG = "iti_cp_lang_v1";
  var LS_CFG = "iti_cp_cfg_v1";
  var NAME_KEY = "iti_qa_name_v1";
  var FB_V = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXPIRE_MS = 24 * 3600 * 1000;
  var INVITE_BASE = "https://devit988.github.io/Iti-attendance-/?battle=";

  var ROLE_LIB = {
    RAJA:   { id: "RAJA",   en: "Raja",   bn: "রাজা",   emoji: "👑", points: 1000, color: "#f59e0b" },
    RANI:   { id: "RANI",   en: "Rani",   bn: "রানি",   emoji: "👸", points: 900,  color: "#ec4899" },
    MANTRI: { id: "MANTRI", en: "Mantri", bn: "মন্ত্রী", emoji: "📜", points: 800,  color: "#8b5cf6" },
    POLICE: { id: "POLICE", en: "Police", bn: "পুলিশ",  emoji: "👮", points: 500,  color: "#38bdf8" },
    VAKEEL: { id: "VAKEEL", en: "Vakeel", bn: "উকিল",   emoji: "⚖️", points: 600,  color: "#6366f1" },
    BABU:   { id: "BABU",   en: "Babu",   bn: "বাবু",   emoji: "🎩", points: 300,  color: "#10b981" },
    DAKU:   { id: "DAKU",   en: "Daku",   bn: "ডাকাত",  emoji: "🗡️", points: 0,    color: "#ef4444" },
    CHOR:   { id: "CHOR",   en: "Chor",   bn: "চোর",    emoji: "🥷", points: 0,    color: "#f97316" }
  };

  var PRESETS = {
    classic4: {
      id: "classic4",
      name: "Classic 4P",
      bn: "ক্লাসিক (৪ জন)",
      sub: "Raja · Mantri · Police · Chor",
      players: 4,
      revealLeaderFirst: true,
      allowGuesserPick: true,
      defaultGuesser: "MANTRI",
      roles: ["RAJA", "MANTRI", "POLICE", "CHOR"]
    },
    hidden3: {
      id: "hidden3",
      name: "3P Hidden Raja",
      bn: "৩ জন (লুকানো রাজা)",
      sub: "Police guesses Chor vs Raja",
      players: 3,
      revealLeaderFirst: false,
      allowGuesserPick: false,
      defaultGuesser: "POLICE",
      roles: ["RAJA", "POLICE", "CHOR"]
    },
    chaos5: {
      id: "chaos5",
      name: "School Chaos 5P",
      bn: "স্কুল আড্ডা (৫ জন)",
      sub: "+ Rani decoy · 1 in 3 odds",
      players: 5,
      revealLeaderFirst: true,
      allowGuesserPick: true,
      defaultGuesser: "MANTRI",
      roles: ["RAJA", "RANI", "MANTRI", "POLICE", "CHOR"]
    },
    double6: {
      id: "double6",
      name: "Double Hunt 6P",
      bn: "ডাবল হান্ট (৬ জন)",
      sub: "Mantri → Daku · Police → Chor",
      players: 6,
      revealLeaderFirst: true,
      allowGuesserPick: false,
      defaultGuesser: "MANTRI",
      roles: ["RAJA", "RANI", "MANTRI", "POLICE", "DAKU", "CHOR"]
    }
  };
  var PRESET_ORDER = ["classic4", "hidden3", "chaos5", "double6"];

  var BOT_NAMES = ["Rohan", "Aarav", "Priya", "Sneha", "Karan", "Riya", "Kabir", "Ananya"];
  var BLUFFS = [
    { id: "notme", en: "Not me! 😇", bn: "আমি নই! 😇" },
    { id: "inno",  en: "100% innocent!", bn: "আমি একদম নির্দোষ!" },
    { id: "sus",   en: "Look closely 👀", bn: "ভালো করে দেখো 👀" },
    { id: "laugh", en: "Haha wrong 😂", bn: "হাহা ভুল হবে 😂" }
  ];

  var root = null;
  var pane = null;
  var tabBtn = null;
  var mounted = false;
  var activeTab = false;
  var view = "setup"; /* setup | lobby | game | podium */
  var FBP = null;
  var pendingInviteCode = "";

  var lang = loadLang(); /* "en" | "bn" | "both" */
  var cfg = loadCfg();
  var st = null;  /* active match state */
  var rm = null;  /* active online room handle */
  var busy = false;
  var quitAt = 0;
  var gen = 0;
  var timerInt = 0;
  var botTimers = [];
  var toastT = 0;
  var isPeeking = false;
  var passPeeked = false;

  /* ---------- storage & small helpers ---------- */
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function q(sel, el) { return (el || pane).querySelector(sel); }
  function qa(sel, el) { return Array.prototype.slice.call((el || pane).querySelectorAll(sel)); }
  function icons() { try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) { } }
  function ico(n, c) { return '<i data-lucide="' + n + '" class="ag-i ' + (c || "") + '"></i>'; }
  function sfx(t) { try { if (window.ArenaGames && window.ArenaGames.playSfx) window.ArenaGames.playSfx(t); } catch (e) { } }
  function vib(p) { try { if (window.ArenaGames && window.ArenaGames.vibrate) window.ArenaGames.vibrate(p); } catch (e) { } }
  function savedName() { return (ls(NAME_KEY) || "").trim().slice(0, 14) || "Player"; }
  function saveName(n) { var v = String(n || "").trim().slice(0, 14); if (v) lsSet(NAME_KEY, v); }
  function shuffle(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      try {
        var a = document.createElement("textarea");
        a.value = t; a.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(a); a.select();
        var r = document.execCommand("copy"); a.remove();
        r ? ok() : no();
      } catch (e) { no(e); }
    });
  }
  function clearTimers() {
    clearInterval(timerInt); timerInt = 0;
    while (botTimers.length) clearTimeout(botTimers.pop());
  }
  function later(fn, ms) {
    var g = gen;
    var id = setTimeout(function () {
      if (g !== gen) return;
      fn();
    }, ms);
    botTimers.push(id);
    return id;
  }

  function loadLang() {
    var v = ls(LS_LANG);
    return (v === "en" || v === "bn" || v === "both") ? v : "both";
  }
  function setLang(mode) {
    if (mode !== "en" && mode !== "bn" && mode !== "both") return;
    lang = mode;
    lsSet(LS_LANG, mode);
    sfx("click");
    render();
  }

  function defaultCfg() {
    return {
      mode: "solo",       /* solo | local | online */
      preset: "classic4", /* classic4 | hidden3 | chaos5 | double6 */
      rounds: 5,          /* 3 | 5 | 7 | 10 */
      guesser: "MANTRI",  /* MANTRI | POLICE (for 4P/5P) */
      stealOnWrong: true,
      timerSec: 20,       /* 0 | 15 | 20 | 30 */
      customOpen: false,
      customPoints: {},   /* { RAJA: 1000, ... } */
      customNames: {},    /* { RAJA: "Boss", ... } */
      myName: savedName(),
      names: ["You", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"],
      code: ""
    };
  }
  function loadCfg() {
    var d = defaultCfg(), s = null;
    try { s = JSON.parse(ls(LS_CFG) || "null"); } catch (e) { s = null; }
    if (s && typeof s === "object") {
      if (s.mode === "solo" || s.mode === "local" || s.mode === "online") d.mode = s.mode;
      if (PRESETS[s.preset]) d.preset = s.preset;
      if ([3, 5, 7, 10].indexOf(+s.rounds) >= 0) d.rounds = +s.rounds;
      if (s.guesser === "MANTRI" || s.guesser === "POLICE") d.guesser = s.guesser;
      if (typeof s.stealOnWrong === "boolean") d.stealOnWrong = s.stealOnWrong;
      if ([0, 15, 20, 30].indexOf(+s.timerSec) >= 0) d.timerSec = +s.timerSec;
      if (s.customPoints && typeof s.customPoints === "object") d.customPoints = s.customPoints;
      if (s.customNames && typeof s.customNames === "object") d.customNames = s.customNames;
      if (Array.isArray(s.names) && s.names.length >= 6) d.names = s.names.slice(0, 6);
    }
    d.myName = savedName();
    return d;
  }
  function saveCfg() {
    lsSet(LS_CFG, JSON.stringify({
      mode: cfg.mode, preset: cfg.preset, rounds: cfg.rounds,
      guesser: cfg.guesser, stealOnWrong: cfg.stealOnWrong, timerSec: cfg.timerSec,
      customPoints: cfg.customPoints, customNames: cfg.customNames, names: cfg.names
    }));
  }

  /* ---------- bilingual helpers ---------- */
  function roleTitleHTML(role) {
    if (!role) return "";
    if (role.customName) {
      return '<span class="cp-r1">' + esc(role.customName) + '</span>' +
        '<span class="cp-r2">' + esc(lang === "bn" ? role.bn : role.en) + '</span>';
    }
    if (lang === "en") return '<span class="cp-r1">' + esc(role.en) + '</span>';
    if (lang === "bn") return '<span class="cp-r1">' + esc(role.bn) + '</span>';
    return '<span class="cp-r1">' + esc(role.bn) + '</span><span class="cp-r2">' + esc(role.en) + '</span>';
  }
  function roleInline(role) {
    if (!role) return "";
    if (role.customName) return role.customName;
    if (lang === "en") return role.en;
    if (lang === "bn") return role.bn;
    return role.bn + " (" + role.en + ")";
  }
  function langSwitcherHTML() {
    return '<div class="cp-lang" role="group" aria-label="Card language">' +
      [["en", "EN"], ["bn", "বাংলা"], ["both", "Both"]].map(function (it) {
        return '<button type="button" data-cp="lang" data-k="' + it[0] + '"' +
          (lang === it[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + it[1] + '</button>';
      }).join("") + '</div>';
  }

  /* ---------- config-driven rule deck builder ---------- */
  function buildRoomConfig(overridePresetId) {
    var pid = (overridePresetId && PRESETS[overridePresetId]) ? overridePresetId : cfg.preset;
    var pr = PRESETS[pid] || PRESETS.classic4;
    var activeGuesser = pr.allowGuesserPick ? cfg.guesser : pr.defaultGuesser;

    var roles = pr.roles.map(function (rid) {
      var base = ROLE_LIB[rid];
      var pts = cfg.customPoints && typeof cfg.customPoints[rid] === "number" && cfg.customPoints[rid] >= 0
        ? Math.round(cfg.customPoints[rid]) : base.points;
      var cname = cfg.customNames && cfg.customNames[rid] ? String(cfg.customNames[rid]).trim().slice(0, 16) : "";
      var type = "decoy";
      var targetId = null;

      if (pid === "hidden3") {
        if (rid === "POLICE") { type = "guesser"; targetId = "CHOR"; }
        else if (rid === "CHOR") { type = "target"; }
        else { type = "decoy"; }
      } else if (pid === "double6") {
        if (rid === "RAJA") type = "leader";
        else if (rid === "MANTRI") { type = "guesser"; targetId = "DAKU"; }
        else if (rid === "POLICE") { type = "guesser"; targetId = "CHOR"; }
        else if (rid === "DAKU" || rid === "CHOR") type = "target";
        else type = "decoy";
      } else {
        if (rid === "RAJA") type = "leader";
        else if (rid === activeGuesser) { type = "guesser"; targetId = "CHOR"; }
        else if (rid === "CHOR") type = "target";
        else type = "decoy";
      }

      return {
        id: rid,
        en: base.en,
        bn: base.bn,
        customName: cname,
        emoji: base.emoji,
        points: pts,
        color: base.color,
        type: type,
        targetId: targetId
      };
    });

    var guessQueue = roles.filter(function (r) { return r.type === "guesser"; }).map(function (r) { return r.id; });

    return {
      presetId: pid,
      presetName: pr.name,
      presetBn: pr.bn,
      maxPlayers: pr.players,
      totalRounds: cfg.rounds,
      guessTimerSec: cfg.timerSec,
      revealLeaderFirst: pr.revealLeaderFirst,
      stealPointsOnWrong: !!cfg.stealOnWrong,
      guessQueue: guessQueue,
      roles: roles
    };
  }

  function findRole(rc, roleId) {
    if (!rc || !rc.roles) return null;
    for (var i = 0; i < rc.roles.length; i++) if (rc.roles[i].id === roleId) return rc.roles[i];
    return null;
  }

  /* Generic config-driven scoring engine (supports 3P, 4P, 5P, 6P & multi-guesser) */
  function calculateRoundScores(assignedRoles, accusations, rc) {
    var roundPoints = {};
    var outcomes = [];
    var pids = Object.keys(assignedRoles);
    var i, pid, role;

    for (i = 0; i < pids.length; i++) {
      pid = pids[i];
      role = findRole(rc, assignedRoles[pid]);
      roundPoints[pid] = role ? role.points : 0;
    }

    for (i = 0; i < accusations.length; i++) {
      var acc = accusations[i];
      var gRole = findRole(rc, assignedRoles[acc.guesserId]);
      var targetRole = gRole ? findRole(rc, gRole.targetId) : null;
      var accusedRole = findRole(rc, assignedRoles[acc.accusedId]);
      if (!gRole || !targetRole) continue;

      var isCorrect = assignedRoles[acc.accusedId] === gRole.targetId;
      var targetPid = null;
      for (var j = 0; j < pids.length; j++) {
        if (assignedRoles[pids[j]] === gRole.targetId) { targetPid = pids[j]; break; }
      }

      if (!isCorrect) {
        roundPoints[acc.guesserId] = 0;
        if (rc.stealPointsOnWrong && targetPid) {
          roundPoints[targetPid] = (roundPoints[targetPid] || 0) + gRole.points;
        }
      }

      outcomes.push({
        guesserId: acc.guesserId,
        accusedId: acc.accusedId,
        targetId: targetPid,
        guesserRoleId: gRole.id,
        targetRoleId: targetRole.id,
        accusedRoleId: accusedRole ? accusedRole.id : null,
        correct: isCorrect,
        stolenPoints: (!isCorrect && rc.stealPointsOnWrong) ? gRole.points : 0
      });
    }

    return { roundPoints: roundPoints, outcomes: outcomes };
  }

  /* ---------- Firebase helper (shared app + anonymous auth with arena_games.js) ---------- */
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
    if (c === "wrong-game") return "That room is for another Arena game.";
    if (c === "started") return "That match has already started.";
    if (c === "full") return "That room is already full.";
    if (c === "no-code") return "Couldn't generate a room code. Try again.";
    if (c === "permission-denied") return "Room unavailable or expired.";
    return "Connection error. Check your internet.";
  }

  /* ---------- Toast & Floating Bluff Bubbles ---------- */
  function showToast(txt) {
    var el = q("#cp-toast");
    if (!el) return;
    el.textContent = txt;
    el.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("on"); }, 2200);
  }

  function popSeatBubble(pid, txt) {
    var seat = q('[data-cp-seat="' + pid + '"]');
    if (!seat) return;
    var old = seat.querySelector(".cp-bub");
    if (old) old.remove();
    var sp = document.createElement("span");
    sp.className = "cp-bub";
    sp.textContent = txt;
    seat.appendChild(sp);
    setTimeout(function () { if (sp.parentNode) sp.remove(); }, 2000);
  }

  /* ---------- Game Engine (Local: Solo + Pass & Play) ---------- */
  function makePlayers(mode, rc) {
    var players = [];
    var usedBots = shuffle(BOT_NAMES);
    var n = rc.maxPlayers;
    for (var i = 0; i < n; i++) {
      var isBot = mode === "solo" && i > 0;
      var nm;
      if (mode === "solo") {
        nm = i === 0 ? ((cfg.myName || "").trim() || "You") : usedBots[i - 1] + " (Bot)";
      } else {
        nm = (cfg.names[i] || "").trim() || ("Player " + (i + 1));
      }
      players.push({
        id: "p" + i,
        name: nm,
        isBot: isBot,
        score: 0,
        catches: 0,
        escapes: 0,
        ready: false
      });
    }
    return players;
  }

  function dealRoles(players, rc) {
    var deck = shuffle(rc.roles.map(function (r) { return r.id; }));
    var map = {};
    for (var i = 0; i < players.length; i++) {
      map[players[i].id] = deck[i];
    }
    return map;
  }

  function startOfflineMatch() {
    gen++; clearTimers(); rm = null;
    var rc = buildRoomConfig();
    var players = makePlayers(cfg.mode, rc);
    st = {
      mode: cfg.mode, /* solo | local */
      config: rc,
      players: players,
      round: 1,
      phase: "SHUFFLE", /* SHUFFLE | PEEK | GUESS | RESULT */
      roles: {},
      peekIdx: 0,
      stageIdx: 0,
      accusations: [],
      revealedIds: [],
      lastCalc: null,
      guessDeadline: 0
    };
    view = "game";
    beginRoundLocal();
  }

  function beginRoundLocal() {
    if (!st) return;
    clearTimers();
    st.phase = "SHUFFLE";
    st.roles = dealRoles(st.players, st.config);
    st.accusations = [];
    st.stageIdx = 0;
    st.peekIdx = 0;
    st.revealedIds = [];
    st.lastCalc = null;
    st.players.forEach(function (p) { p.ready = false; });
    isPeeking = false; passPeeked = false;
    render();
    sfx("dice");

    later(function () {
      if (!st) return;
      st.phase = "PEEK";
      render();
      if (st.mode === "solo") {
        /* Staggered bot ready indicators */
        st.players.forEach(function (p, idx) {
          if (!p.isBot) return;
          later(function () {
            if (!st || st.phase !== "PEEK") return;
            p.ready = true;
            updatePeekChips();
          }, 600 + idx * 320);
        });
      }
    }, 850);
  }

  function updatePeekChips() {
    if (!st) return;
    st.players.forEach(function (p) {
      var badge = q('[data-cp-ready="' + p.id + '"]');
      if (badge) {
        badge.classList.toggle("ok", !!p.ready);
        badge.textContent = p.ready ? "✓ Ready" : "Peeking…";
      }
    });
  }

  function getActiveGuesserPid(stateObj) {
    var qList = stateObj.config.guessQueue || [];
    var gRoleId = qList[stateObj.stageIdx];
    if (!gRoleId) return null;
    var pids = Object.keys(stateObj.roles);
    for (var i = 0; i < pids.length; i++) {
      if (stateObj.roles[pids[i]] === gRoleId) return pids[i];
    }
    return null;
  }

  function getLeaderPid(stateObj) {
    var pids = Object.keys(stateObj.roles);
    for (var i = 0; i < pids.length; i++) {
      var r = findRole(stateObj.config, stateObj.roles[pids[i]]);
      if (r && r.type === "leader") return pids[i];
    }
    return null;
  }

  function getValidSuspects(stateObj, guesserPid) {
    var revealed = stateObj.revealedIds || [];
    return stateObj.players.filter(function (p) {
      return p.id !== guesserPid && revealed.indexOf(p.id) < 0;
    });
  }

  function enterGuessPhaseLocal() {
    if (!st) return;
    clearTimers();
    st.phase = "GUESS";
    st.revealedIds = [];
    if (st.config.revealLeaderFirst) {
      var lid = getLeaderPid(st);
      if (lid) st.revealedIds.push(lid);
    }
    var gid = getActiveGuesserPid(st);
    if (gid && st.revealedIds.indexOf(gid) < 0) st.revealedIds.push(gid);

    startGuessTimer(function () {
      /* Time's up -> auto-pick a suspect so game keeps moving */
      if (!st || st.phase !== "GUESS") return;
      var activeGid = getActiveGuesserPid(st);
      var suspects = getValidSuspects(st, activeGid);
      if (suspects.length) {
        var pick = suspects[Math.floor(Math.random() * suspects.length)];
        showToast("Time's up! Auto-picked " + pick.name);
        submitAccusationLocal(activeGid, pick.id);
      }
    });

    render();
    sfx("move");
    scheduleBotGuessAndBluffsLocal();
  }

  function scheduleBotGuessAndBluffsLocal() {
    if (!st || st.phase !== "GUESS" || st.mode !== "solo") return;
    var gid = getActiveGuesserPid(st);
    var guesser = st.players.find(function (p) { return p.id === gid; });
    var suspects = getValidSuspects(st, gid);

    /* Bot bluff emotes from hidden suspects */
    suspects.forEach(function (s, idx) {
      if (!s.isBot) return;
      if (Math.random() < 0.65) {
        later(function () {
          if (!st || st.phase !== "GUESS") return;
          var b = BLUFFS[Math.floor(Math.random() * BLUFFS.length)];
          popSeatBubble(s.id, lang === "bn" ? b.bn : b.en);
        }, 700 + idx * 650 + Math.floor(Math.random() * 500));
      }
    });

    /* If active guesser is a bot, auto-accuse after realistic pause */
    if (guesser && guesser.isBot && suspects.length) {
      later(function () {
        if (!st || st.phase !== "GUESS") return;
        var pick = suspects[Math.floor(Math.random() * suspects.length)];
        submitAccusationLocal(gid, pick.id);
      }, 2100 + Math.floor(Math.random() * 900));
    }
  }

  function startGuessTimer(onExpire) {
    clearInterval(timerInt); timerInt = 0;
    if (!st || !st.config.guessTimerSec) {
      if (st) st.guessDeadline = 0;
      return;
    }
    var ms = st.config.guessTimerSec * 1000;
    st.guessDeadline = Date.now() + ms;
    timerInt = setInterval(function () {
      if (!st || st.phase !== "GUESS") { clearInterval(timerInt); timerInt = 0; return; }
      var rem = Math.max(0, st.guessDeadline - Date.now());
      var sec = Math.ceil(rem / 1000);
      var lbl = q("#cp-timer-val");
      var bar = q("#cp-timer-bar");
      if (lbl) lbl.textContent = sec + "s";
      if (bar) {
        bar.style.width = Math.max(0, Math.min(100, (rem / ms) * 100)) + "%";
        bar.classList.toggle("low", sec <= 5);
      }
      if (rem <= 0) {
        clearInterval(timerInt); timerInt = 0;
        if (onExpire) onExpire();
      }
    }, 200);
  }

  function submitAccusationLocal(guesserId, accusedId) {
    if (!st || st.phase !== "GUESS") return;
    if (guesserId !== getActiveGuesserPid(st)) return;

    st.accusations.push({ guesserId: guesserId, accusedId: accusedId });
    sfx("click"); vib(18);

    /* Check if there's another hunt stage (e.g. 6P Double Hunt: Mantri -> Daku, then Police -> Chor) */
    if (st.stageIdx + 1 < st.config.guessQueue.length) {
      /* Reveal the caught villain if correct so Stage 2 doesn't pick them again */
      var gRole = findRole(st.config, st.roles[guesserId]);
      var caught = st.roles[accusedId] === gRole.targetId;
      if (caught && st.revealedIds.indexOf(accusedId) < 0) st.revealedIds.push(accusedId);
      st.stageIdx++;
      var nextGid = getActiveGuesserPid(st);
      if (nextGid && st.revealedIds.indexOf(nextGid) < 0) st.revealedIds.push(nextGid);
      var nextGRole = findRole(st.config, st.roles[nextGid]);
      var nextTarget = nextGRole ? findRole(st.config, nextGRole.targetId) : null;
      showToast((caught ? "Caught! " : "Missed! ") + "Now " + roleInline(nextGRole) + " hunts " + roleInline(nextTarget) + "!");
      clearTimers();
      startGuessTimer(function () {
        if (!st || st.phase !== "GUESS") return;
        var sList = getValidSuspects(st, nextGid);
        if (sList.length) submitAccusationLocal(nextGid, sList[Math.floor(Math.random() * sList.length)].id);
      });
      render();
      scheduleBotGuessAndBluffsLocal();
      return;
    }

    /* Final stage done -> resolve round scores */
    clearTimers();
    var res = calculateRoundScores(st.roles, st.accusations, st.config);
    st.lastCalc = res;
    st.phase = "RESULT";
    st.players.forEach(function (p) {
      p.score += (res.roundPoints[p.id] || 0);
    });
    res.outcomes.forEach(function (o) {
      var gp = st.players.find(function (p) { return p.id === o.guesserId; });
      var tp = st.players.find(function (p) { return p.id === o.targetId; });
      if (o.correct && gp) gp.catches = (gp.catches || 0) + 1;
      if (!o.correct && tp) tp.escapes = (tp.escapes || 0) + 1;
    });

    var anyCorrect = res.outcomes.some(function (o) { return o.correct; });
    sfx(anyCorrect ? "home" : "capture");
    vib(anyCorrect ? [20, 30, 30] : [50, 30, 50]);
    render();
  }

  function advanceFromResultLocal() {
    if (!st) return;
    if (st.round >= st.config.totalRounds) {
      view = "podium";
      sfx("win"); vib([40, 40, 80]);
      render();
    } else {
      st.round++;
      beginRoundLocal();
    }
  }

  /* ---------- Online Multiplayer Rooms (Firestore battles/{code}, gameType: "chorpolice") ---------- */
  function leaveOnline() {
    clearTimers();
    if (!rm) { st = null; view = "setup"; render(); return; }
    var r = rm; rm = null; st = null; gen++;
    if (r.unsub) { try { r.unsub(); } catch (e) { } }
    if (r.isHost && r.data) {
      /* Host leaving closes the room for everyone (guests see "Room closed by host") */
      r.F.deleteDoc(r.ref).catch(function () { });
    } else if (!r.isHost && r.data && r.data.status === "waiting") {
      var up = {}; up["players." + r.uid] = r.F.deleteField();
      r.F.updateDoc(r.ref, up).catch(function () { });
    } else if (!r.isHost && r.data && r.data.status === "playing" && r.data.cp) {
      /* Guest quits mid-match: their seat becomes a bot so the game keeps going */
      var roster = (r.data.cp.roster || []).map(function (p) {
        if (p.id !== r.uid) return p;
        var o = {}; for (var k in p) o[k] = p[k];
        o.isBot = true; o.name = String(p.name || "Player").replace(/ \(Bot\)$/, "") + " (Bot)";
        return o;
      });
      var up2 = { "cp.roster": roster }; up2["players." + r.uid] = r.F.deleteField();
      r.F.updateDoc(r.ref, up2).catch(function () { });
    }
    view = "setup";
    render();
  }

  function createOnlineRoom() {
    if (busy) return;
    var name = (cfg.myName || "").trim() || savedName();
    saveName(name);
    var rc = buildRoomConfig();
    busy = true;
    var msg = q("#cp-net-msg"); if (msg) msg.textContent = "Creating room…";
    loadFb().then(function (f) {
      var tries = 0, F = f.F;
      function attempt() {
        var code = String(1000 + Math.floor(Math.random() * 9000));
        var ref = F.doc(f.db, "battles", code);
        return F.getDoc(ref).then(function (s) { return s.exists(); }, function () { return true; }).then(function (taken) {
          if (taken) { if (++tries >= 8) throw { code: "no-code" }; return attempt(); }
          var pl = {};
          pl[f.uid] = { name: name, joinedAt: Date.now() };
          return F.setDoc(ref, {
            gameType: "chorpolice",
            status: "waiting",
            hostId: f.uid,
            maxPlayers: rc.maxPlayers,
            config: rc,
            expireAt: F.Timestamp.fromMillis(Date.now() + EXPIRE_MS),
            players: pl
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
      var m = q("#cp-net-msg"); if (m) m.textContent = "Enter a valid 4-digit room code.";
      return;
    }
    var name = (cfg.myName || "").trim() || savedName();
    saveName(name);
    busy = true;
    var msg = q("#cp-net-msg"); if (msg) msg.textContent = "Joining room " + code + "…";
    loadFb().then(function (f) {
      var F = f.F, ref = F.doc(f.db, "battles", code);
      return F.getDoc(ref).then(function (s) {
        if (!s.exists()) throw { code: "nf" };
        var d = s.data();
        if (d.gameType !== "chorpolice") throw { code: "wrong-game" };
        if (d.status !== "waiting" && !(d.players && d.players[f.uid])) throw { code: "started" };
        if (!d.players[f.uid] && Object.keys(d.players).length >= d.maxPlayers) throw { code: "full" };
        var up = {}; up["players." + f.uid] = { name: name, joinedAt: Date.now() };
        return F.updateDoc(ref, up).then(function () { return { code: code, ref: ref, f: f }; });
      });
    }).then(function (res) {
      clearInviteUrl();
      attachRoom(res.code, res.ref, res.f, false);
    }).catch(function (e) {
      if (msg) msg.textContent = fbErr(e);
    }).then(function () { busy = false; });
  }

  function clearInviteUrl() {
    pendingInviteCode = "";
    try {
      var u = new URL(location.href);
      if (u.searchParams.get("game") === "chorpolice") {
        u.searchParams.delete("battle");
        u.searchParams.delete("game");
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      }
    } catch (e) { }
  }

  /* Start online match: supports Bot Auto-Fill (for 2–5 humans) OR Pure-Human 3P Hidden Raja */
  function startOnlineMatch(forceHidden3) {
    if (!rm || !rm.isHost || !rm.data) return;
    var d = rm.data;
    var uids = Object.keys(d.players || {}).sort(function (a, b) {
      return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0);
    });
    if (uids.length < 2) { showToast("Need at least 2 players to start"); return; }

    var rc = forceHidden3 ? buildRoomConfig("hidden3") : (d.config || buildRoomConfig());
    var usedBots = shuffle(BOT_NAMES);
    var roster = uids.slice(0, rc.maxPlayers).map(function (u, i) {
      return {
        id: u,
        name: (d.players[u] && d.players[u].name) || ("Player " + (i + 1)),
        isBot: false,
        score: 0,
        catches: 0,
        escapes: 0
      };
    });

    /* Bot Auto-Fill for 2 or 3 online players when lobby has fewer humans than preset size */
    var botIdx = 0;
    while (roster.length < rc.maxPlayers) {
      roster.push({
        id: "bot_" + (botIdx + 1),
        name: usedBots[botIdx % usedBots.length] + " (Bot)",
        isBot: true,
        score: 0,
        catches: 0,
        escapes: 0
      });
      botIdx++;
    }

    var roles = dealRoles(roster, rc);
    var readyMap = {};
    roster.forEach(function (p) { readyMap[p.id] = false; });

    rm.F.updateDoc(rm.ref, {
      status: "playing",
      config: rc,
      cp: {
        round: 1,
        phase: "PEEK",
        roster: roster,
        roles: roles,
        ready: readyMap,
        stageIdx: 0,
        accusations: [],
        revealedIds: [],
        lastCalc: null,
        bluff: null,
        phaseTs: Date.now()
      }
    }).catch(function () { showToast("Couldn't start room. Try again."); });
  }

  function onlineMarkReady() {
    if (!rm || !st || st.phase !== "PEEK") return;
    var up = {}; up["cp.ready." + rm.uid] = true;
    rm.F.updateDoc(rm.ref, up).catch(function () { });
  }

  function onlineSendBluff(bluffObj) {
    if (!rm || !st || st.phase !== "GUESS") return;
    var txt = lang === "bn" ? bluffObj.bn : bluffObj.en;
    popSeatBubble(rm.uid, txt);
    sfx("click");
    rm.F.updateDoc(rm.ref, {
      "cp.bluff": { by: rm.uid, id: bluffObj.id, ts: Date.now() }
    }).catch(function () { });
  }

  function onlineSubmitAccusation(guesserId, accusedId) {
    if (!rm || !st || st.phase !== "GUESS") return;
    if (guesserId !== getActiveGuesserPid(st)) return;
    /* Only the guesser (or the host acting for a bot / timed-out player) writes the accusation */
    var newAcc = (st.accusations || []).concat([{ guesserId: guesserId, accusedId: accusedId }]);
    var rc = st.config;
    var revealed = (st.revealedIds || []).slice();

    if (st.stageIdx + 1 < rc.guessQueue.length) {
      var gRole = findRole(rc, st.roles[guesserId]);
      var caught = st.roles[accusedId] === gRole.targetId;
      if (caught && revealed.indexOf(accusedId) < 0) revealed.push(accusedId);
      var nextStage = st.stageIdx + 1;
      var nextGRoleId = rc.guessQueue[nextStage];
      var nextGid = null;
      Object.keys(st.roles).forEach(function (pid) { if (st.roles[pid] === nextGRoleId) nextGid = pid; });
      if (nextGid && revealed.indexOf(nextGid) < 0) revealed.push(nextGid);

      rm.F.updateDoc(rm.ref, {
        "cp.accusations": newAcc,
        "cp.stageIdx": nextStage,
        "cp.revealedIds": revealed,
        "cp.phaseTs": Date.now()
      }).catch(function () { });
      return;
    }

    var res = calculateRoundScores(st.roles, newAcc, rc);
    var nextRoster = st.players.map(function (p) {
      var o = { id: p.id, name: p.name, isBot: !!p.isBot, score: p.score + (res.roundPoints[p.id] || 0), catches: p.catches || 0, escapes: p.escapes || 0 };
      res.outcomes.forEach(function (oc) {
        if (oc.correct && oc.guesserId === p.id) o.catches++;
        if (!oc.correct && oc.targetId === p.id) o.escapes++;
      });
      return o;
    });

    rm.F.updateDoc(rm.ref, {
      "cp.accusations": newAcc,
      "cp.lastCalc": res,
      "cp.roster": nextRoster,
      "cp.phase": "RESULT",
      "cp.phaseTs": Date.now()
    }).catch(function () { });
  }

  function onlineNextRound() {
    if (!rm || !rm.isHost || !st) return;
    if (st.round >= st.config.totalRounds) {
      rm.F.updateDoc(rm.ref, { status: "finished" }).catch(function () { });
      return;
    }
    var roles = dealRoles(st.players, st.config);
    var readyMap = {};
    st.players.forEach(function (p) { readyMap[p.id] = false; });
    rm.F.updateDoc(rm.ref, {
      "cp.round": st.round + 1,
      "cp.phase": "PEEK",
      "cp.roles": roles,
      "cp.ready": readyMap,
      "cp.stageIdx": 0,
      "cp.accusations": [],
      "cp.revealedIds": [],
      "cp.lastCalc": null,
      "cp.phaseTs": Date.now()
    }).catch(function () { });
  }

  function onlineRematch() {
    if (!rm || !rm.isHost || !rm.data) return;
    rm.F.updateDoc(rm.ref, {
      status: "waiting",
      cp: null
    }).catch(function () { });
  }

  /* Host-Only Bot & Phase Orchestrator (prevents duplicate writes in online rooms) */
  function hostOrchestrateOnline(d) {
    if (!rm || !rm.isHost || !d || d.status !== "playing" || !d.cp) return;
    var cp = d.cp;
    var rc = d.config || buildRoomConfig();
    var botCount = (cp.roster || []).filter(function (p) { return p.isBot; }).length;
    var phaseKey = cp.round + "|" + cp.phase + "|" + cp.stageIdx + "|" + (cp.phaseTs || 0) + "|" + botCount;

    if (cp.phase === "PEEK") {
      /* Safety net: if someone never taps Ready, auto-ready everyone after 30s */
      var peekKey = cp.round + "|" + (cp.phaseTs || 0);
      if (rm.peekTimeoutKey !== peekKey) {
        rm.peekTimeoutKey = peekKey;
        later(function () {
          if (!rm || !rm.data || !rm.data.cp || rm.data.cp.phase !== "PEEK" || (rm.data.cp.phaseTs || 0) + "" !== (cp.phaseTs || 0) + "") return;
          var upd = {};
          (rm.data.cp.roster || []).forEach(function (p) {
            if (!(rm.data.cp.ready && rm.data.cp.ready[p.id])) upd["cp.ready." + p.id] = true;
          });
          if (Object.keys(upd).length) rm.F.updateDoc(rm.ref, upd).catch(function () { });
        }, 30000);
      }
      var unreadyBots = (cp.roster || []).filter(function (p) { return p.isBot && !(cp.ready && cp.ready[p.id]); });
      if (unreadyBots.length && rm.botPeekKey !== phaseKey) {
        rm.botPeekKey = phaseKey;
        later(function () {
          if (!rm || !rm.data || !rm.data.cp || rm.data.cp.phase !== "PEEK") return;
          var up = {};
          unreadyBots.forEach(function (b) { up["cp.ready." + b.id] = true; });
          rm.F.updateDoc(rm.ref, up).catch(function () { });
        }, 1400);
      }

      var allReady = (cp.roster || []).length > 0 && (cp.roster || []).every(function (p) { return cp.ready && cp.ready[p.id]; });
      if (allReady && rm.advKey !== phaseKey) {
        rm.advKey = phaseKey;
        var revealed = [];
        if (rc.revealLeaderFirst) {
          Object.keys(cp.roles || {}).forEach(function (pid) {
            var r = findRole(rc, cp.roles[pid]);
            if (r && r.type === "leader") revealed.push(pid);
          });
        }
        var firstGRole = rc.guessQueue && rc.guessQueue[0];
        if (firstGRole) {
          Object.keys(cp.roles || {}).forEach(function (pid) {
            if (cp.roles[pid] === firstGRole && revealed.indexOf(pid) < 0) revealed.push(pid);
          });
        }
        rm.F.updateDoc(rm.ref, {
          "cp.phase": "GUESS",
          "cp.revealedIds": revealed,
          "cp.phaseTs": Date.now()
        }).catch(function () { rm.advKey = ""; });
      }
    } else if (cp.phase === "GUESS" && rm.botGuessKey !== phaseKey) {
      rm.botGuessKey = phaseKey;
      var fakeState = { config: rc, players: cp.roster || [], roles: cp.roles || {}, stageIdx: cp.stageIdx || 0, revealedIds: cp.revealedIds || [] };
      var gid = getActiveGuesserPid(fakeState);
      var guesser = (cp.roster || []).find(function (p) { return p.id === gid; });
      var suspects = getValidSuspects(fakeState, gid);

      /* Bot bluff emote */
      var botSuspects = suspects.filter(function (s) { return s.isBot; });
      if (botSuspects.length && Math.random() < 0.55) {
        later(function () {
          if (!rm || !rm.data || !rm.data.cp || rm.data.cp.phase !== "GUESS") return;
          var bs = botSuspects[Math.floor(Math.random() * botSuspects.length)];
          var b = BLUFFS[Math.floor(Math.random() * BLUFFS.length)];
          rm.F.updateDoc(rm.ref, { "cp.bluff": { by: bs.id, id: b.id, ts: Date.now() } }).catch(function () { });
        }, 1200);
      }

      var accLen = (cp.accusations || []).length;
      if (guesser && guesser.isBot && suspects.length) {
        later(function () {
          if (!rm || !st || st.phase !== "GUESS") return;
          if (getActiveGuesserPid(st) !== gid) return;
          if ((st.accusations || []).length !== accLen) return;
          var pick = suspects[Math.floor(Math.random() * suspects.length)];
          onlineSubmitAccusation(gid, pick.id);
        }, 2300);
      }
    }
  }

  function attachRoom(code, ref, f, isHost) {
    clearTimers(); gen++;
    rm = {
      code: code, ref: ref, F: f.F, uid: f.uid, isHost: isHost,
      data: null, unsub: null, lastBluffTs: 0, lastPhaseKey: "",
      botPeekKey: "", botGuessKey: "", advKey: ""
    };
    rm.unsub = f.F.onSnapshot(ref, function (snap) {
      if (!rm) return;
      if (!snap.exists()) {
        clearTimers(); rm = null; st = null; view = "setup"; render();
        showToast("Room closed by host");
        return;
      }
      var d = snap.data();
      rm.data = d;
      rm.isHost = d.hostId === rm.uid;

      if (d.status === "waiting") {
        st = null; view = "lobby"; render();
      } else if (d.status === "playing" && d.cp) {
        var cp = d.cp;
        var rc = d.config || buildRoomConfig();
        var prevPhase = st ? st.phase : "";
        var prevKey = rm.lastPhaseKey;
        var curKey = cp.round + "|" + cp.phase + "|" + cp.stageIdx + "|" + (cp.phaseTs || 0);

        st = {
          mode: "online",
          config: rc,
          players: (cp.roster || []).map(function (p) {
            return {
              id: p.id, name: p.name, isBot: !!p.isBot, score: p.score || 0,
              catches: p.catches || 0, escapes: p.escapes || 0,
              ready: !!(cp.ready && cp.ready[p.id])
            };
          }),
          round: cp.round || 1,
          phase: cp.phase || "PEEK",
          roles: cp.roles || {},
          stageIdx: cp.stageIdx || 0,
          accusations: cp.accusations || [],
          revealedIds: cp.revealedIds || [],
          lastCalc: cp.lastCalc || null,
          guessDeadline: 0
        };

        view = "game";
        if (curKey !== prevKey) {
          rm.lastPhaseKey = curKey;
          isPeeking = false;
          clearInterval(timerInt); timerInt = 0;
          if (st.phase === "GUESS") {
            sfx("move");
            startGuessTimer(function () {
              /* Host auto-resolves on timer expiry */
              if (!rm || !rm.isHost || !st || st.phase !== "GUESS") return;
              var gid = getActiveGuesserPid(st);
              var sList = getValidSuspects(st, gid);
              if (sList.length) onlineSubmitAccusation(gid, sList[Math.floor(Math.random() * sList.length)].id);
            });
          } else if (st.phase === "RESULT" && prevPhase === "GUESS") {
            var anyOk = st.lastCalc && st.lastCalc.outcomes && st.lastCalc.outcomes.some(function (o) { return o.correct; });
            sfx(anyOk ? "home" : "capture");
            vib(anyOk ? [20, 30, 30] : [50, 30, 50]);
          }
          render();
        } else {
          /* Lightweight UI refresh (ready checkmarks or bluff bubbles) */
          if (st.phase === "PEEK") updatePeekChips();
        }

        if (cp.bluff && cp.bluff.ts && cp.bluff.ts !== rm.lastBluffTs) {
          rm.lastBluffTs = cp.bluff.ts;
          if (cp.bluff.by !== rm.uid) {
            var bo = BLUFFS.find(function (x) { return x.id === cp.bluff.id; });
            if (bo) popSeatBubble(cp.bluff.by, lang === "bn" ? bo.bn : bo.en);
          }
        }

        hostOrchestrateOnline(d);
      } else if (d.status === "finished" && d.cp) {
        clearTimers();
        if (!st) {
          st = {
            mode: "online",
            config: d.config || buildRoomConfig(),
            players: d.cp.roster || [],
            round: d.cp.round || 1,
            phase: "RESULT"
          };
        } else {
          st.players = d.cp.roster || st.players;
        }
        view = "podium";
        sfx("win");
        render();
      }
    });
  }

  /* ---------- Rendering ---------- */
  function syncPlayingChrome() {
    if (!root || !activeTab) return;
    var wrap = root.querySelector(".ag-wrap");
    var playing = (view === "game" && !!st);
    if (wrap) wrap.classList.toggle("ag-playing", playing);
    document.documentElement.classList.toggle("ag-game-on", playing);
  }

  function renderSetup() {
    var m = cfg.mode;
    var pr = PRESETS[cfg.preset] || PRESETS.classic4;
    var rc = buildRoomConfig();
    var h = '<div class="cp-box">';

    /* Hero banner */
    h += '<div class="cp-hero">' +
      '<i class="cp-orb" style="color:#f97316;width:11px;height:11px;left:52%;top:14%"></i>' +
      '<i class="cp-orb" style="color:#fbbf24;width:8px;height:8px;left:40%;bottom:30%;animation-delay:-2s"></i>' +
      '<i class="cp-orb" style="color:#38bdf8;width:9px;height:9px;right:30%;top:10%;animation-delay:-4s"></i>' +
      '<span class="cp-chit" style="left:60%;top:42%">\uD83D\uDCC4</span>' +
      '<span class="cp-chit" style="left:46%;top:10%;animation-delay:-2.4s">\uD83D\uDCDC</span>' +
      '<div class="cp-hero-top">' +
      '<div><div class="cp-kick">PAPER CHIT CLASSIC</div>' +
      '<div class="cp-title">CHOR <span>POLICE</span></div>' +
      '<div class="cp-sub">' + (lang === "bn" ? "রাজা · মন্ত্রী · পুলিশ · চোর — ব্লাফ, আন্দাজ আর স্কোর!" : "Raja · Mantri · Police · Chor — Peek, Bluff & Catch!") + '</div></div>' +
      '<div class="cp-hero-badge" aria-hidden="true">👑<span>🥷</span></div></div>' +
      '<div class="cp-roles" aria-hidden="true"><b>\uD83D\uDC51</b><b>\uD83D\uDCDC</b><b>\uD83D\uDC6E</b><b>\uD83E\uDD77</b></div>' +
      '<div class="cp-hero-bar"><span class="cp-hero-tag">' + (lang === "bn" ? "চিরকুটের ভাষা" : "Card Language") + '</span>' + langSwitcherHTML() + '</div></div>';

    /* Main setup glass card */
    h += '<div class="ag-glass cp-card">';

    /* Mode selector */
    h += '<div class="cp-lbl">Game mode</div><div class="cp-g3">' + [
      ["solo", "bot", "Solo vs Bots", "Instant play"],
      ["local", "users", "Pass & Play", "1 Phone · Peek"],
      ["online", "wifi", "Online Room", "2–6 Friends"]
    ].map(function (t) {
      return '<button type="button" data-cp="mode" data-k="' + t[0] + '" class="cp-tile' + (m === t[0] ? " on" : "") + '">' +
        '<span class="ic">' + ico(t[1]) + '</span><span class="t">' + t[2] + '</span><span class="s">' + t[3] + '</span></button>';
    }).join("") + '</div>';

    /* Presets (3P / 4P / 5P / 6P) */
    h += '<div class="cp-lbl" style="margin-top:12px">Table preset &amp; extra players</div><div class="cp-g2">' +
      PRESET_ORDER.map(function (pid) {
        var p = PRESETS[pid];
        var label = lang === "bn" ? p.bn : (lang === "both" ? p.name + " · " + p.players + "P" : p.name);
        return '<button type="button" data-cp="preset" data-k="' + pid + '" class="cp-preset' + (cfg.preset === pid ? " on" : "") + '">' +
          '<span class="t">' + esc(label) + '</span><span class="s">' + esc(p.sub) + '</span></button>';
      }).join("") + '</div>';

    /* Live role preview chips for selected preset */
    h += '<div class="cp-deck-prev">' + rc.roles.map(function (r) {
      var nm = r.customName || (lang === "bn" ? r.bn : (lang === "both" ? r.bn + " / " + r.en : r.en));
      return '<span class="cp-rchip" style="--rc:' + r.color + '">' + r.emoji + ' ' + esc(nm) + ' <b>' + r.points + '</b></span>';
    }).join("") + '</div>';

    /* Collapsible Custom Rules Drawer */
    h += '<div class="cp-acc' + (cfg.customOpen ? " open" : "") + '">' +
      '<button type="button" class="cp-acc-h" data-cp="togglecust" aria-expanded="' + (cfg.customOpen ? "true" : "false") + '">' +
      '<span>' + ico("sliders-horizontal") + ' Customize Rules, Points &amp; Names</span>' + ico("chevron-down", "cp-chev") + '</button>';

    if (cfg.customOpen) {
      h += '<div class="cp-acc-b">';
      /* Rounds */
      h += '<div class="cp-lbl" style="margin-top:0">Rounds</div><div class="cp-g4">' +
        [3, 5, 7, 10].map(function (r) {
          return '<button type="button" class="cp-pill' + (cfg.rounds === r ? " on" : "") + '" data-cp="rounds" data-k="' + r + '">' + r + ' Rounds</button>';
        }).join("") + '</div>';

      /* Guesser toggle (when 4P or 5P) */
      if (pr.allowGuesserPick) {
        h += '<div class="cp-lbl" style="margin-top:10px">Who catches the Chor?</div><div class="cp-g2">' +
          '<button type="button" class="cp-pill' + (cfg.guesser === "MANTRI" ? " on" : "") + '" data-cp="guesser" data-k="MANTRI">📜 Mantri (800)</button>' +
          '<button type="button" class="cp-pill' + (cfg.guesser === "POLICE" ? " on" : "") + '" data-cp="guesser" data-k="POLICE">👮 Police (500)</button></div>';
      }

      /* Wrong guess penalty & timer */
      h += '<div class="cp-g2" style="margin-top:10px">' +
        '<div><div class="cp-lbl">Wrong guess</div><div class="cp-g2">' +
        '<button type="button" class="cp-pill' + (cfg.stealOnWrong ? " on" : "") + '" data-cp="steal" data-k="1">Chor steals</button>' +
        '<button type="button" class="cp-pill' + (!cfg.stealOnWrong ? " on" : "") + '" data-cp="steal" data-k="0">0 pts only</button></div></div>' +
        '<div><div class="cp-lbl">Guess timer</div><div class="cp-g4" style="gap:4px">' +
        [15, 20, 30, 0].map(function (sec) {
          return '<button type="button" class="cp-pill' + (cfg.timerSec === sec ? " on" : "") + '" data-cp="timer" data-k="' + sec + '">' + (sec ? sec + "s" : "Off") + '</button>';
        }).join("") + '</div></div></div>';

      /* Custom role points & custom names */
      h += '<div class="cp-lbl" style="margin-top:10px">Edit role points &amp; custom names (optional)</div><div class="cp-role-ed">' +
        rc.roles.map(function (r) {
          return '<div class="cp-re-row">' +
            '<span class="cp-re-em">' + r.emoji + '</span>' +
            '<input type="text" maxlength="16" class="cp-in" data-cp-rname="' + r.id + '" value="' + esc(r.customName) + '" placeholder="' + esc(r.bn + ' / ' + r.en) + '">' +
            '<input type="number" min="0" max="5000" step="50" class="cp-in cp-pts-in" data-cp-rpts="' + r.id + '" value="' + r.points + '" aria-label="' + esc(r.en) + ' points">' +
            '</div>';
        }).join("") + '</div>' +
        '<button type="button" class="cp-reset-sm" data-cp="resetrules">' + ico("rotate-ccw") + ' Reset rules &amp; points</button>';
      h += '</div>';
    }
    h += '</div>';

    /* Player names / Online room join */
    if (m === "online") {
      h += '<div class="cp-lbl" style="margin-top:12px">Your name</div>' +
        '<input class="cp-in" type="text" maxlength="14" data-cp-myname="1" value="' + esc(cfg.myName) + '" placeholder="Player">';
      h += '<div class="cp-note">Tip: With 2 or 3 friends online, you can start immediately with smart Bots or switch to 3P Hidden Raja (no bots).</div>';
      h += '<button type="button" class="cp-cta" style="margin-top:10px" data-cp="create">' + ico("plus") + 'Create Online Room</button>';
      h += '<div class="cp-join-row">' +
        '<input id="cp-code-in" class="cp-in cp-code-in" type="text" inputmode="numeric" maxlength="4" placeholder="0000" value="' + esc(cfg.code || pendingInviteCode) + '">' +
        '<button type="button" class="bg-sec" style="flex:1;border-radius:14px;font-weight:800" data-cp="join">' + ico("log-in") + 'Join Room</button></div>';
      h += '<div id="cp-net-msg" class="cp-net-msg"></div>';
    } else if (m === "solo") {
      h += '<div class="cp-lbl" style="margin-top:12px">Your name</div>' +
        '<input class="cp-in" type="text" maxlength="14" data-cp-myname="1" value="' + esc(cfg.myName) + '" placeholder="You">';
      h += '<button type="button" class="cp-cta" style="margin-top:14px" data-cp="start">' + ico("play") + 'START CHIT GAME (' + pr.players + 'P)</button>';
    } else {
      h += '<div class="cp-lbl" style="margin-top:12px">Player names (' + pr.players + ' players · 1 phone)</div><div class="cp-g2">';
      for (var i = 0; i < pr.players; i++) {
        var val = cfg.names[i] || ("Player " + (i + 1));
        h += '<input class="cp-in" type="text" maxlength="14" data-cp-pname="' + i + '" value="' + esc(val) + '" placeholder="Player ' + (i + 1) + '">';
      }
      h += '</div>';
      h += '<button type="button" class="cp-cta" style="margin-top:14px" data-cp="start">' + ico("play") + 'START PASS &amp; PLAY</button>';
    }

    h += '</div></div>';
    pane.innerHTML = h + '<div id="cp-toast" class="cp-toast" role="status" aria-live="polite"></div>';
    icons();
  }

  function renderLobby() {
    var d = rm.data;
    var rc = d.config || buildRoomConfig();
    var uids = Object.keys(d.players || {}).sort(function (a, b) {
      return a === d.hostId ? -1 : b === d.hostId ? 1 : (d.players[a].joinedAt || 0) - (d.players[b].joinedAt || 0);
    });
    var needBots = Math.max(0, rc.maxPlayers - uids.length);
    var wa = "https://wa.me/?text=" + encodeURIComponent(
      "Join my ITI CONNECT Chor Police room! 👑🥷\nCode: " + rm.code + "\n" + INVITE_BASE + rm.code + "&game=chorpolice"
    );

    var h = '<div class="cp-box"><div class="ag-glass cp-card" style="text-align:center">';
    h += '<div class="cp-top" style="margin-bottom:10px">' +
      '<span class="cp-lob-t">👑 Chor Police Room</span>' +
      langSwitcherHTML() +
      '<button type="button" class="cp-ib" data-cp="leave" aria-label="Leave room">' + ico("x") + '</button></div>';

    h += '<div class="cp-lbl" style="text-align:center">ROOM CODE</div><div class="bg-code">' + esc(rm.code) + '</div>';
    h += '<div class="cp-sub-dim">' + esc(rc.presetName) + ' · ' + rc.totalRounds + ' Rounds · ' + (rc.stealPointsOnWrong ? "Point Steal ON" : "No Steal") + '</div>';

    h += '<div class="cp-g2" style="margin:12px 0">' +
      '<button type="button" class="bg-sec" style="border-radius:14px" data-cp="copy">' + ico("copy") + '<span id="cp-copy-lbl">Copy Code</span></button>' +
      '<a class="bg-sec" style="text-decoration:none;border-radius:14px" target="_blank" rel="noopener" href="' + wa + '">' + ico("send") + 'WhatsApp</a></div>';

    h += '<div class="cp-slots">';
    for (var i = 0; i < rc.maxPlayers; i++) {
      var u = uids[i];
      h += '<div class="cp-slot' + (u === rm.uid ? " me" : "") + '">' +
        '<span class="cp-snum">' + (i + 1) + '</span>' +
        '<span class="cp-sname">' + (u ? esc(d.players[u].name) + (u === rm.uid ? " (You)" : "") : '<span class="cp-wait-t">Empty seat (Bot auto-fill ready)</span>') + '</span>' +
        (u === d.hostId ? '<span class="cp-host-tag">HOST</span>' : '') + '</div>';
    }
    h += '</div>';

    if (rm.isHost) {
      h += '<div class="cp-lob-acts">';
      if (uids.length < 2) {
        h += '<button type="button" class="cp-cta" disabled>' + ico("users") + 'Waiting for at least 1 friend…</button>';
      } else {
        var btnText = needBots > 0
          ? 'Start with ' + needBots + ' Bot' + (needBots > 1 ? 's' : '') + ' (' + uids.length + 'H + ' + needBots + 'B)'
          : 'Start Full Match (' + uids.length + '/' + rc.maxPlayers + ')';
        h += '<button type="button" class="cp-cta" data-cp="onstart">' + ico("play") + btnText + '</button>';
        if (uids.length === 3 && rc.presetId !== "hidden3") {
          h += '<button type="button" class="bg-sec" style="width:100%;border-radius:14px;font-weight:800;margin-top:8px" data-cp="onstart3">' +
            ico("shield") + 'Play 3P Hidden Raja (No Bots)</button>';
        }
      }
      h += '</div>';
    } else {
      h += '<div class="cp-sub-dim" style="margin-top:12px">Waiting for host to start the round…</div>';
    }

    h += '</div></div><div id="cp-toast" class="cp-toast" role="status" aria-live="polite"></div>';
    pane.innerHTML = h;
    icons();
  }

  function renderGame() {
    var rc = st.config;
    var myId = st.mode === "online" ? rm.uid : (st.mode === "solo" ? "p0" : (st.players[st.peekIdx] ? st.players[st.peekIdx].id : "p0"));
    var myRole = findRole(rc, st.roles[myId]);
    var h = '<div class="cp-box cp-game">';

    /* Compact top bar: Quit | Round pill | Language switcher */
    h += '<div class="cp-top">' +
      '<button type="button" class="cp-ib" data-cp="quit" aria-label="Quit game">' + ico("x") + '</button>' +
      '<div class="cp-rpill">Round <b>' + st.round + '</b> / ' + rc.totalRounds + '</div>' +
      langSwitcherHTML() + '</div>';

    /* Mini scoreboard strip */
    var sortedStrip = st.players.slice().sort(function (a, b) { return b.score - a.score; });
    h += '<div class="cp-sbar">' + sortedStrip.map(function (p, idx) {
      var me = (st.mode === "online" && p.id === rm.uid) || (st.mode === "solo" && p.id === "p0");
      return '<span class="cp-sb-it' + (me ? " me" : "") + '">' + (idx === 0 && p.score > 0 ? "👑 " : "") + esc(p.name) + ' <b>' + p.score + '</b></span>';
    }).join("") + '</div>';

    /* PHASE 1: SHUFFLE */
    if (st.phase === "SHUFFLE") {
      h += '<div class="ag-glass cp-stage cp-center">' +
        '<div class="cp-chits-anim">' +
        rc.roles.map(function (_, idx) {
          return '<div class="cp-chit-fold" style="--i:' + idx + '"><span>?</span></div>';
        }).join("") + '</div>' +
        '<div class="cp-st-t">' + (lang === "bn" ? "চিরকুট মেশানো হচ্ছে…" : "Tossing & Shuffling Paper Chits…") + '</div>' +
        '<div class="cp-st-s">' + rc.maxPlayers + ' folded chits dropped on the desk</div></div>';
    }

    /* PHASE 2: PEEK */
    else if (st.phase === "PEEK") {
      if (st.mode === "local") {
        /* Pass & Play: Hold to Peek curtain */
        var curP = st.players[st.peekIdx];
        var curRole = findRole(rc, st.roles[curP.id]);
        h += '<div class="ag-glass cp-stage cp-center">' +
          '<div class="cp-badge-pill">Player ' + (st.peekIdx + 1) + ' of ' + st.players.length + '</div>' +
          '<div class="cp-st-t" style="margin-top:8px">Pass phone to <span class="cp-ac">' + esc(curP.name) + '</span></div>' +
          '<div class="cp-st-s">Make sure no one else is looking at the screen!</div>';

        h += '<div class="cp-peek-card' + (isPeeking ? " open" : "") + '" id="cp-peek-card" style="--rc:' + (curRole ? curRole.color : "#f59e0b") + '">' +
          '<div class="cp-pc-front"><div class="cp-fold-mark">📄</div><div class="cp-fold-txt">' +
          (lang === "bn" ? "চিরকুট দেখতে চেপে ধরে রাখুন" : "Hold button below to peek") + '</div></div>' +
          '<div class="cp-pc-back">' +
          '<div class="cp-r-emoji">' + (curRole ? curRole.emoji : "") + '</div>' +
          '<div class="cp-r-title">' + roleTitleHTML(curRole) + '</div>' +
          '<div class="cp-r-pts">' + (curRole ? curRole.points : 0) + ' PTS</div></div></div>';

        h += '<button type="button" class="cp-hold-btn" id="cp-hold-btn">' + ico("eye") +
          '<span>' + (lang === "bn" ? "চেপে ধরে চিরকুট দেখুন" : "HOLD TO PEEK CHIT") + '</span></button>';

        h += '<button type="button" class="cp-cta" style="margin-top:10px" data-cp="passnext"' + (passPeeked ? "" : " disabled") + '>' +
          ico("check") + (st.peekIdx + 1 < st.players.length ? ('Hide & Pass to ' + esc(st.players[st.peekIdx + 1].name)) : 'Everyone Ready · Reveal!') + '</button>';
        h += '</div>';
      } else {
        /* Solo or Online: Private chit card */
        var meObj = st.players.find(function (p) { return p.id === myId; });
        var iAmReady = !!(meObj && meObj.ready);
        h += '<div class="ag-glass cp-stage cp-center">' +
          '<div class="cp-badge-pill">' + (lang === "bn" ? "আপনার গোপন চিরকুট" : "Your Secret Chit") + '</div>' +
          '<div class="cp-peek-card' + (isPeeking ? " open" : "") + '" id="cp-peek-card" data-cp="toggletap" style="margin-top:10px;--rc:' + (myRole ? myRole.color : "#f59e0b") + '">' +
          '<div class="cp-pc-front"><div class="cp-fold-mark">📄</div><div class="cp-fold-txt">' +
          (lang === "bn" ? "চিরকুট খুলতে ট্যাপ করুন" : "Tap chit to open") + '</div></div>' +
          '<div class="cp-pc-back">' +
          '<div class="cp-r-emoji">' + (myRole ? myRole.emoji : "") + '</div>' +
          '<div class="cp-r-title">' + roleTitleHTML(myRole) + '</div>' +
          '<div class="cp-r-pts">' + (myRole ? myRole.points : 0) + ' PTS</div></div></div>';

        h += '<div class="cp-ready-grid">' + st.players.map(function (p) {
          return '<div class="cp-rstat"><span class="cp-rs-n">' + esc(p.name) + '</span>' +
            '<span class="cp-rs-b' + (p.ready ? " ok" : "") + '" data-cp-ready="' + p.id + '">' + (p.ready ? "✓ Ready" : "Peeking…") + '</span></div>';
        }).join("") + '</div>';

        h += '<button type="button" class="cp-cta" style="margin-top:12px" data-cp="ready"' + ((!isPeeking || iAmReady) ? " disabled" : "") + '>' +
          ico("check") + (iAmReady ? "Waiting for others…" : (isPeeking ? "I'm Ready · Start Hunt" : "Open your chit first")) + '</button>';
        h += '</div>';
      }
    }

    /* PHASE 3: GUESS */
    else if (st.phase === "GUESS") {
      var gid = getActiveGuesserPid(st);
      var guesser = st.players.find(function (p) { return p.id === gid; });
      var gRole = findRole(rc, st.roles[gid]);
      var targetRole = gRole ? findRole(rc, gRole.targetId) : null;
      var leaderPid = rc.revealLeaderFirst ? getLeaderPid(st) : null;
      var leader = leaderPid ? st.players.find(function (p) { return p.id === leaderPid; }) : null;
      var leaderRole = leaderPid ? findRole(rc, st.roles[leaderPid]) : null;
      var suspects = getValidSuspects(st, gid);
      var suspectIds = suspects.map(function (s) { return s.id; });

      var canPickNow = false;
      if (st.mode === "local") canPickNow = true;
      else if (st.mode === "solo") canPickNow = (gid === "p0");
      else if (st.mode === "online") canPickNow = (gid === rm.uid);

      /* Banner & Timer */
      h += '<div class="ag-glass cp-stage">';
      h += '<div class="cp-hunt-head">' +
        '<div class="cp-hunt-call">';
      if (leader && leaderRole) {
        h += '<span class="cp-leader-line">' + leaderRole.emoji + ' <b>' + esc(leader.name) + '</b> is ' + esc(roleInline(leaderRole)) + '!</span>';
      } else {
        h += '<span class="cp-leader-line">🕵️ Hidden Raja Variant!</span>';
      }
      h += '<div class="cp-hunt-main">' + (gRole ? gRole.emoji + ' ' : '') + '<b>' + esc(guesser ? guesser.name : "") + '</b> (' + esc(roleInline(gRole)) + '), catch <span>' + esc(roleInline(targetRole)) + '</span>!</div>';
      if (rc.guessQueue.length > 1) {
        h += '<div class="cp-stage-tag">Stage ' + (st.stageIdx + 1) + ' of ' + rc.guessQueue.length + '</div>';
      }
      h += '</div>';
      if (rc.guessTimerSec > 0) {
        var remSec = st.guessDeadline ? Math.max(0, Math.ceil((st.guessDeadline - Date.now()) / 1000)) : rc.guessTimerSec;
        h += '<div class="cp-tbadge">' + ico("clock") + '<span id="cp-timer-val">' + remSec + 's</span></div>';
      }
      h += '</div>';

      if (rc.guessTimerSec > 0) {
        h += '<div class="cp-tbar"><i id="cp-timer-bar" style="width:100%"></i></div>';
      }

      if (st.mode === "local" && guesser) {
        h += '<div class="cp-pass-hint">Hand phone to <b>' + esc(guesser.name) + '</b> to tap a suspect card below</div>';
      } else if (canPickNow) {
        h += '<div class="cp-pass-hint">Your turn! Tap the suspect you think is <b>' + esc(roleInline(targetRole)) + '</b></div>';
      } else {
        h += '<div class="cp-pass-hint">' + esc(guesser ? guesser.name : "Guesser") + ' is watching faces and choosing…</div>';
      }

      /* Table seats grid */
      h += '<div class="cp-seats">';
      st.players.forEach(function (p) {
        var pRole = findRole(rc, st.roles[p.id]);
        var isRevealed = st.revealedIds.indexOf(p.id) >= 0;
        var isMe = (st.mode === "solo" && p.id === "p0") || (st.mode === "online" && p.id === rm.uid);
        var isSuspect = suspectIds.indexOf(p.id) >= 0;
        var clickable = canPickNow && isSuspect;
        var showFace = isRevealed || isMe;

        h += '<button type="button" class="cp-seat' +
          (isRevealed ? " rev" : "") +
          (clickable ? " pick" : "") +
          (p.id === gid ? " guesser" : "") + '"' +
          ' data-cp-seat="' + p.id + '"' +
          (clickable ? ' data-cp="accuse" data-k="' + p.id + '"' : ' disabled') +
          ' style="--rc:' + (showFace && pRole ? pRole.color : "#94a3b8") + '">';

        h += '<div class="cp-seat-top"><span class="cp-seat-n">' + esc(p.name) + (isMe ? " (You)" : "") + '</span>';
        if (p.id === gid) h += '<span class="cp-tag-g">HUNTER</span>';
        else if (clickable) h += '<span class="cp-tag-p">TAP</span>';
        h += '</div>';

        if (showFace && pRole) {
          h += '<div class="cp-seat-face">' +
            '<span class="cp-sf-em">' + pRole.emoji + '</span>' +
            '<div class="cp-sf-t">' + roleTitleHTML(pRole) + '</div>' +
            '<span class="cp-sf-pts">' + pRole.points + ' pts</span>' +
            (isMe && !isRevealed ? '<span class="cp-secret-lbl">Only you see this</span>' : '') +
            '</div>';
        } else {
          h += '<div class="cp-seat-hide">' +
            '<span class="cp-sh-q">📄</span>' +
            '<span class="cp-sh-l">' + (clickable ? (lang === "bn" ? "সন্দেহভাজন · ট্যাপ করুন" : "Suspect · Tap to Accuse") : (lang === "bn" ? "লুকানো চিরকুট" : "Hidden Chit")) + '</span>' +
            '</div>';
        }
        h += '</button>';
      });
      h += '</div>';

      /* Quick bluff chips for Solo / Online when you're not guessing */
      if (st.mode !== "local" && !canPickNow) {
        h += '<div class="cp-bluffs">' + BLUFFS.map(function (b) {
          return '<button type="button" class="cp-bchip" data-cp="bluff" data-k="' + b.id + '">' + esc(lang === "bn" ? b.bn : b.en) + '</button>';
        }).join("") + '</div>';
      }
      h += '</div>';
    }

    /* PHASE 4: RESULT (Round Reveal & Score Swap) */
    else if (st.phase === "RESULT" && st.lastCalc) {
      var res = st.lastCalc;
      h += '<div class="ag-glass cp-stage">';
      /* Outcomes banner */
      h += '<div class="cp-outcomes">' + res.outcomes.map(function (o) {
        var gp = st.players.find(function (p) { return p.id === o.guesserId; });
        var ap = st.players.find(function (p) { return p.id === o.accusedId; });
        var tp = st.players.find(function (p) { return p.id === o.targetId; });
        var gr = findRole(rc, o.guesserRoleId);
        var tr = findRole(rc, o.targetRoleId);
        if (o.correct) {
          return '<div class="cp-out ok"><b>🎉 CAUGHT!</b> ' + esc(gp ? gp.name : "") + ' (' + esc(roleInline(gr)) + ') caught <b>' + esc(tp ? tp.name : "") + '</b> (' + esc(roleInline(tr)) + ')!</div>';
        }
        return '<div class="cp-out bad"><b>😈 ESCAPED!</b> ' + esc(gp ? gp.name : "") + ' accused ' + esc(ap ? ap.name : "") + '. <b>' + esc(tp ? tp.name : "") + '</b> (' + esc(roleInline(tr)) + ')' +
          (o.stolenPoints > 0 ? ' stole <b>+' + o.stolenPoints + ' pts</b>!' : ' survived!') + '</div>';
      }).join("") + '</div>';

      /* Revealed all cards + round deltas */
      h += '<div class="cp-res-list">';
      var ranked = st.players.slice().sort(function (a, b) { return b.score - a.score; });
      ranked.forEach(function (p) {
        var r = findRole(rc, st.roles[p.id]);
        var delta = res.roundPoints[p.id] || 0;
        h += '<div class="cp-res-row" style="--rc:' + (r ? r.color : "#94a3b8") + '">' +
          '<span class="cp-rr-em">' + (r ? r.emoji : "📄") + '</span>' +
          '<div class="cp-rr-mid">' +
          '<div class="cp-rr-n">' + esc(p.name) + '</div>' +
          '<div class="cp-rr-r">' + roleTitleHTML(r) + '</div></div>' +
          '<div class="cp-rr-sc">' +
          '<span class="cp-rr-d' + (delta > 0 ? " pos" : " zero") + '">+' + delta + '</span>' +
          '<span class="cp-rr-tot">' + p.score + ' total</span></div></div>';
      });
      h += '</div>';

      var isLast = st.round >= rc.totalRounds;
      if (st.mode === "online" && !rm.isHost) {
        h += '<div class="cp-sub-dim" style="text-align:center;margin-top:12px">Waiting for host to start ' + (isLast ? 'final podium' : 'next round') + '…</div>';
      } else {
        h += '<button type="button" class="cp-cta" style="margin-top:12px" data-cp="nextround">' +
          ico(isLast ? "trophy" : "shuffle") + (isLast ? "Show Final Podium" : "Next Round (" + (st.round + 1) + "/" + rc.totalRounds + ")") + '</button>';
      }
      h += '</div>';
    }

    h += '</div><div id="cp-toast" class="cp-toast" role="status" aria-live="polite"></div>';
    pane.innerHTML = h;
    icons();

    /* Wire pointer hold-to-peek for Pass & Play */
    if (st.phase === "PEEK" && st.mode === "local") {
      var holdBtn = q("#cp-hold-btn");
      var card = q("#cp-peek-card");
      if (holdBtn && card) {
        var startHold = function (ev) {
          ev.preventDefault();
          isPeeking = true;
          card.classList.add("open");
          if (!passPeeked) {
            passPeeked = true;
            var nxt = q('[data-cp="passnext"]');
            if (nxt) nxt.disabled = false;
          }
          vib(12);
        };
        var endHold = function () {
          if (!isPeeking) return;
          isPeeking = false;
          card.classList.remove("open");
        };
        holdBtn.addEventListener("pointerdown", startHold);
        holdBtn.addEventListener("pointerup", endHold);
        holdBtn.addEventListener("pointerleave", endHold);
        holdBtn.addEventListener("pointercancel", endHold);
      }
    }
  }

  function renderPodium() {
    var ranked = (st.players || []).slice().sort(function (a, b) { return b.score - a.score; });
    var medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"];
    var maxScore = Math.max(1, ranked[0] ? ranked[0].score : 1);

    /* Fun match awards */
    var bestChor = ranked.slice().sort(function (a, b) { return (b.escapes || 0) - (a.escapes || 0); })[0];
    var bestCop = ranked.slice().sort(function (a, b) { return (b.catches || 0) - (a.catches || 0); })[0];

    var h = '<div class="cp-box"><div class="cp-podium">';
    h += '<div class="cp-pod-tr">🏆</div>' +
      '<div class="cp-pod-k">CHOR POLICE CHAMPION</div>' +
      '<div class="cp-pod-w">' + esc(ranked[0] ? ranked[0].name : "Winner") + '</div>' +
      '<div class="cp-pod-sub">' + (ranked[0] ? ranked[0].score : 0) + ' Points · ' + (st.config ? st.config.totalRounds : cfg.rounds) + ' Rounds</div>';

    if ((bestChor && bestChor.escapes > 0) || (bestCop && bestCop.catches > 0)) {
      h += '<div class="cp-awards">';
      if (bestCop && bestCop.catches > 0) {
        h += '<span class="cp-aw">🕵️ Top Detective: <b>' + esc(bestCop.name) + '</b> (' + bestCop.catches + ')</span>';
      }
      if (bestChor && bestChor.escapes > 0) {
        h += '<span class="cp-aw">🥷 Master Chor: <b>' + esc(bestChor.name) + '</b> (' + bestChor.escapes + ')</span>';
      }
      h += '</div>';
    }

    h += '<div class="cp-rk-list">' + ranked.map(function (p, i) {
      var pct = Math.round((p.score / maxScore) * 100);
      return '<div class="cp-rk' + (i === 0 ? " first" : "") + '">' +
        '<span class="cp-rk-m">' + (medals[i] || (i + 1)) + '</span>' +
        '<div class="cp-rk-b"><div class="cp-rk-t"><span>' + esc(p.name) + '</span><b>' + p.score + ' pts</b></div>' +
        '<div class="cp-rk-bar"><i style="width:' + pct + '%"></i></div></div></div>';
    }).join("") + '</div>';

    h += '<div class="cp-g2" style="margin-top:14px">';
    if (rm) {
      if (rm.isHost) {
        h += '<button type="button" class="cp-cta" data-cp="onrematch">' + ico("rotate-ccw") + 'Rematch</button>' +
          '<button type="button" class="bg-sec cp-pod-sec" data-cp="leave">' + ico("log-out") + 'Leave Room</button>';
      } else {
        h += '<button type="button" class="cp-cta" style="grid-column:span 2" data-cp="leave">' + ico("log-out") + 'Leave Room</button>';
      }
    } else {
      h += '<button type="button" class="cp-cta" data-cp="start">' + ico("rotate-ccw") + 'Play Again</button>' +
        '<button type="button" class="bg-sec cp-pod-sec" data-cp="setup">' + ico("sliders-horizontal") + 'Setup</button>';
    }
    h += '</div></div></div><div id="cp-toast" class="cp-toast" role="status" aria-live="polite"></div>';
    pane.innerHTML = h;
    icons();
  }

  function render() {
    if (!pane) return;
    syncPlayingChrome();
    if (view === "lobby" && rm && rm.data) renderLobby();
    else if (view === "game" && st) renderGame();
    else if (view === "podium" && st) renderPodium();
    else { view = "setup"; renderSetup(); }
  }

  /* ---------- Event Delegation ---------- */
  function onPaneClick(e) {
    var b = e.target.closest && e.target.closest("[data-cp]");
    if (!b || !pane.contains(b)) return;
    var a = b.getAttribute("data-cp"), k = b.getAttribute("data-k");

    if (a === "lang") { setLang(k); return; }
    if (a === "mode") { cfg.mode = k; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "preset") { cfg.preset = k; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "togglecust") { cfg.customOpen = !cfg.customOpen; sfx("click"); renderSetup(); return; }
    if (a === "rounds") { cfg.rounds = +k; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "guesser") { cfg.guesser = k; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "steal") { cfg.stealOnWrong = k === "1"; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "timer") { cfg.timerSec = +k; saveCfg(); sfx("click"); renderSetup(); return; }
    if (a === "resetrules") {
      cfg.rounds = 5; cfg.guesser = "MANTRI"; cfg.stealOnWrong = true; cfg.timerSec = 20;
      cfg.customPoints = {}; cfg.customNames = {};
      saveCfg(); sfx("click"); renderSetup(); showToast("Rules reset to classic defaults");
      return;
    }
    if (a === "start") { sfx("click"); startOfflineMatch(); return; }
    if (a === "setup") { clearTimers(); st = null; view = "setup"; sfx("click"); render(); return; }
    if (a === "create") { sfx("click"); createOnlineRoom(); return; }
    if (a === "join") { sfx("click"); joinOnlineRoom((q("#cp-code-in") || {}).value); return; }
    if (a === "onstart") { sfx("click"); startOnlineMatch(false); return; }
    if (a === "onstart3") { sfx("click"); startOnlineMatch(true); return; }
    if (a === "onrematch") { sfx("click"); onlineRematch(); return; }
    if (a === "leave") { sfx("click"); leaveOnline(); return; }
    if (a === "copy" && rm) {
      copyText(rm.code).then(function () {
        sfx("click");
        var lb = q("#cp-copy-lbl");
        if (lb) { lb.textContent = "Copied!"; setTimeout(function () { lb.textContent = "Copy Code"; }, 1400); }
      });
      return;
    }

    /* In-game actions */
    if (a === "toggletap" && st && st.phase === "PEEK" && st.mode !== "local") {
      isPeeking = !isPeeking;
      sfx("click"); vib(10);
      render();
      return;
    }
    if (a === "ready" && st && st.phase === "PEEK") {
      if (st.mode === "online") {
        onlineMarkReady();
        sfx("click");
      } else if (st.mode === "solo") {
        st.players[0].ready = true;
        st.players.forEach(function (p) { p.ready = true; });
        enterGuessPhaseLocal();
      }
      return;
    }
    if (a === "passnext" && st && st.phase === "PEEK" && st.mode === "local") {
      isPeeking = false; passPeeked = false;
      sfx("click");
      if (st.peekIdx + 1 < st.players.length) {
        st.peekIdx++;
        render();
      } else {
        enterGuessPhaseLocal();
      }
      return;
    }
    if (a === "accuse" && st && st.phase === "GUESS") {
      var gid = getActiveGuesserPid(st);
      if (st.mode === "online") onlineSubmitAccusation(gid, k);
      else submitAccusationLocal(gid, k);
      return;
    }
    if (a === "bluff" && st && st.phase === "GUESS") {
      var bo = BLUFFS.find(function (x) { return x.id === k; });
      if (!bo) return;
      if (st.mode === "online") onlineSendBluff(bo);
      else { popSeatBubble("p0", lang === "bn" ? bo.bn : bo.en); sfx("click"); }
      return;
    }
    if (a === "nextround" && st && st.phase === "RESULT") {
      sfx("click");
      if (st.mode === "online") onlineNextRound();
      else advanceFromResultLocal();
      return;
    }
    if (a === "quit") {
      var now = Date.now();
      if (now - quitAt < 2500) {
        gen++; clearTimers();
        if (rm) leaveOnline();
        else { st = null; view = "setup"; render(); }
      } else {
        quitAt = now;
        showToast("Tap ✕ again to quit match");
      }
    }
  }

  function onPaneInput(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-cp-myname")) {
      cfg.myName = t.value.slice(0, 14);
      saveName(cfg.myName);
    } else if (t.id === "cp-code-in") {
      t.value = t.value.replace(/\D/g, "").slice(0, 4);
      cfg.code = t.value;
    } else if (t.getAttribute("data-cp-pname") != null) {
      var idx = +t.getAttribute("data-cp-pname");
      cfg.names[idx] = t.value.slice(0, 14);
      saveCfg();
    } else if (t.getAttribute("data-cp-rname")) {
      var rid = t.getAttribute("data-cp-rname");
      var v = t.value.trim().slice(0, 16);
      if (v) cfg.customNames[rid] = v; else delete cfg.customNames[rid];
      saveCfg();
    } else if (t.getAttribute("data-cp-rpts")) {
      var rid2 = t.getAttribute("data-cp-rpts");
      var num = parseInt(t.value, 10);
      if (!isNaN(num) && num >= 0) {
        cfg.customPoints[rid2] = Math.min(5000, num);
        saveCfg();
      }
    }
  }

  /* ---------- Tab Activation & Integration into #quiz-arena-root ---------- */
  function activateTab() {
    if (!root || !pane || !tabBtn) return;
    activeTab = true;
    /* Deactivate existing arena_games.js tabs & panes */
    Array.prototype.forEach.call(root.querySelectorAll(".ag-bar .ag-tab"), function (el) {
      el.classList.remove("on");
      el.setAttribute("aria-selected", "false");
    });
    tabBtn.classList.add("on");
    tabBtn.setAttribute("aria-selected", "true");

    Array.prototype.forEach.call(root.querySelectorAll(".ag-pane"), function (el) {
      el.classList.add("ag-off");
    });
    pane.classList.remove("ag-off");

    var cz = root.querySelector("#ag-cz");
    if (cz) cz.classList.add("ag-off");

    sfx("tab");
    render();
  }

  function deactivateTab() {
    if (!activeTab) return;
    activeTab = false;
    if (tabBtn) {
      tabBtn.classList.remove("on");
      tabBtn.setAttribute("aria-selected", "false");
    }
    if (pane) pane.classList.add("ag-off");
    clearInterval(timerInt); timerInt = 0;
  }

  /* ---------- Scoped Styles (Dark + Bright Glassmorphism, Amber/Orange Accents) ---------- */
  function injectCss() {
    if (document.getElementById("cp-style")) return;
    var R = "#ag-pane-chorpolice ";
    var css = [
      R + "{--cp-ac:#f97316;--cp-ac2:#fbbf24;--cp-tx:var(--ag-tx,#e2e8f0);--cp-t2:var(--ag-t2,#94a3b8);--cp-bg:var(--ag-bg,rgba(15,23,42,.64));--cp-bg2:var(--ag-bg2,rgba(30,41,59,.56));--cp-bd:var(--ag-bd,rgba(148,163,184,.24));color:var(--cp-tx)}",
      "html.bright-mode " + R + "{--cp-ac:#ea580c;--cp-ac2:#d97706}",
      R + "*{box-sizing:border-box}",
      R + "button," + R + "input{font:inherit;color:inherit}",
      R + "button{cursor:pointer;-webkit-tap-highlight-color:transparent}",
      R + "button:disabled{opacity:.48;cursor:not-allowed}",
      R + ".cp-box{max-width:30rem;margin:0 auto;display:flex;flex-direction:column;gap:10px}",

      /* Hero */
      R + ".cp-hero{position:relative;overflow:hidden;border-radius:20px;padding:15px 15px 12px;color:#fff;border:1px solid rgba(255,255,255,.15);background:radial-gradient(110% 90% at 92% -10%,rgba(249,115,22,.45),transparent 58%),radial-gradient(90% 90% at -10% 110%,rgba(251,191,36,.28),transparent 55%),linear-gradient(155deg,#1f140d,#0b1020);box-shadow:0 16px 34px -16px rgba(0,0,0,.68),inset 0 1px 0 rgba(255,255,255,.15)}",
      R + ".cp-hero-top{display:flex;align-items:center;justify-content:space-between;gap:10px}",
      R + ".cp-kick{font-size:9.5px;font-weight:800;letter-spacing:.26em;color:#fdba74}",
      R + ".cp-title{font-size:34px;line-height:.98;font-weight:900;letter-spacing:.03em;margin-top:3px;color:#fff}",
      R + ".cp-title span{color:#fb923c}",
      R + ".cp-sub{font-size:11.5px;font-weight:600;color:#cbd5e1;margin-top:5px}",
      R + ".cp-hero-badge{position:relative;width:62px;height:62px;border-radius:18px;display:grid;place-items:center;font-size:32px;background:rgba(255,255,255,.08);border:1px solid rgba(251,146,60,.45);flex:none}",
      R + ".cp-hero-badge span{position:absolute;right:-6px;bottom:-6px;font-size:22px;background:#0f172a;border-radius:50%;padding:2px;border:1px solid rgba(255,255,255,.25)}",
      R + ".cp-hero-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;padding-top:9px;border-top:1px solid rgba(255,255,255,.12)}",
      R + ".cp-hero-tag{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fed7aa}",
      R + ".cp-title span{background:linear-gradient(95deg,#fb923c,#fde68a 45%,#f97316 70%,#fb923c);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:cpShimmer 4.5s linear infinite}",
      R + ".cp-hero-top,"+R+".cp-hero-bar,"+R+".cp-roles{position:relative;z-index:2}",
      R + ".cp-orb{position:absolute;z-index:1;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,currentColor 58%);box-shadow:0 0 16px currentColor;animation:cpDrift 6s ease-in-out infinite}",
      R + ".cp-chit{position:absolute;z-index:1;pointer-events:none;font-size:20px;line-height:1;opacity:.28;animation:cpChit 5s ease-in-out infinite}",
      R + ".cp-hero-badge{animation:cpBadge 3.6s ease-in-out infinite;box-shadow:0 0 26px -6px rgba(249,115,22,.75)}",
      R + ".cp-hero-badge span{animation:cpNinja 2.8s ease-in-out infinite}",
      R + ".cp-roles{display:flex;gap:6px;margin-top:12px}",
      R + ".cp-roles b{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:5px 2px;border-radius:12px;font-size:11px;font-weight:800;color:#fed7aa;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);animation:cpRole 4s ease-in-out infinite}",
      R + ".cp-roles b:nth-child(2){animation-delay:1s}",
      R + ".cp-roles b:nth-child(3){animation-delay:2s}",
      R + ".cp-roles b:nth-child(4){animation-delay:3s}",
      "@keyframes cpShimmer{0%{background-position:0% 50%}100%{background-position:220% 50%}}",
      "@keyframes cpDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}",
      "@keyframes cpChit{0%,100%{transform:translateY(0) rotate(-12deg)}50%{transform:translateY(-10px) rotate(10deg)}}",
      "@keyframes cpBadge{0%,100%{transform:rotate(-4deg) scale(1)}50%{transform:rotate(4deg) scale(1.06)}}",
      "@keyframes cpNinja{0%,100%{transform:translate(0,0)}50%{transform:translate(-4px,-4px)}}",
      "@keyframes cpRole{0%,70%,100%{transform:none;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);box-shadow:none}15%,30%{transform:translateY(-3px) scale(1.06);background:rgba(249,115,22,.32);border-color:rgba(251,146,60,.85);box-shadow:0 8px 16px -8px rgba(249,115,22,.9)}}",
      "@media(prefers-reduced-motion:reduce){"+R+".cp-title span,"+R+".cp-orb,"+R+".cp-chit,"+R+".cp-hero-badge,"+R+".cp-hero-badge span,"+R+".cp-roles b{animation:none}}",

      /* Language pill switcher */
      R + ".cp-lang{display:inline-flex;gap:3px;padding:3px;border-radius:999px;background:rgba(15,23,42,.65);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}",
      "html.bright-mode " + R + ".cp-top .cp-lang{background:rgba(255,255,255,.78);border-color:rgba(148,163,184,.45)}",
      R + ".cp-lang button{border:0;background:transparent;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;color:#e2e8f0;transition:background .18s,color .18s}",
      "html.bright-mode " + R + ".cp-top .cp-lang button{color:#334155}",
      R + ".cp-lang button.on{background:#f97316;color:#fff!important}",

      /* Setup cards & grids */
      R + ".cp-card{padding:14px}",
      R + ".cp-lbl{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--cp-t2);margin:0 0 6px;text-align:left}",
      R + ".cp-g2{display:grid;grid-template-columns:1fr 1fr;gap:7px}",
      R + ".cp-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}",
      R + ".cp-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
      R + ".cp-tile," + R + ".cp-preset{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 5px;border-radius:14px;background:var(--cp-bg2);border:1.5px solid var(--cp-bd);text-align:center;transition:border-color .18s,background .18s,transform .12s}",
      R + ".cp-tile:active," + R + ".cp-preset:active{transform:scale(.97)}",
      R + ".cp-tile .ic{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(249,115,22,.16);color:#fb923c}",
      "html.bright-mode " + R + ".cp-tile .ic{color:#ea580c}",
      R + ".cp-tile .t," + R + ".cp-preset .t{font-size:11.5px;font-weight:800;line-height:1.2}",
      R + ".cp-tile .s," + R + ".cp-preset .s{font-size:9.8px;font-weight:600;color:var(--cp-t2);line-height:1.2}",
      R + ".cp-tile.on," + R + ".cp-preset.on{border-color:#f97316;background:rgba(249,115,22,.14);box-shadow:0 0 0 1px rgba(249,115,22,.4)}",

      /* Role preview pills */
      R + ".cp-deck-prev{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}",
      R + ".cp-rchip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:10.5px;font-weight:700;background:var(--cp-bg2);border:1px solid var(--cp-bd);border-left:3px solid var(--rc,#f97316)}",
      R + ".cp-rchip b{color:var(--cp-ac2)}",

      /* Customizer accordion */
      R + ".cp-acc{margin-top:11px;border-radius:14px;background:var(--cp-bg2);border:1px solid var(--cp-bd);overflow:hidden}",
      R + ".cp-acc-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;background:transparent;border:0;font-size:11.5px;font-weight:800}",
      R + ".cp-acc-h span{display:inline-flex;align-items:center;gap:6px}",
      R + ".cp-chev{transition:transform .22s ease;color:var(--cp-t2)}",
      R + ".cp-acc.open .cp-chev{transform:rotate(180deg)}",
      R + ".cp-acc-b{padding:10px 11px 12px;border-top:1px solid var(--cp-bd)}",
      R + ".cp-pill{padding:6px 4px;border-radius:10px;font-size:11px;font-weight:800;background:var(--cp-bg);border:1px solid var(--cp-bd);text-align:center;transition:all .16s}",
      R + ".cp-pill.on{background:rgba(249,115,22,.18);border-color:#f97316;color:#fb923c}",
      "html.bright-mode " + R + ".cp-pill.on{color:#c2410c}",
      R + ".cp-role-ed{display:flex;flex-direction:column;gap:6px}",
      R + ".cp-re-row{display:flex;align-items:center;gap:6px}",
      R + ".cp-re-em{font-size:18px;width:24px;text-align:center;flex:none}",
      R + ".cp-pts-in{width:76px!important;text-align:center;flex:none}",
      R + ".cp-reset-sm{display:inline-flex;align-items:center;gap:5px;margin-top:10px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;background:transparent;border:1px solid var(--cp-bd);color:var(--cp-t2)}",

      /* Inputs & buttons */
      R + ".cp-in{width:100%;min-width:0;padding:.52rem .75rem;border-radius:12px;font-size:13px;font-weight:700;background:var(--cp-bg2);border:1.5px solid var(--cp-bd);outline:none}",
      R + ".cp-in:focus{border-color:#f97316}",
      R + ".cp-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:.82rem 1rem;border-radius:15px;font-weight:900;font-size:13.5px;color:#fff!important;background:linear-gradient(135deg,#f97316,#ea580c);border:1px solid rgba(255,255,255,.25);box-shadow:0 10px 22px -10px rgba(249,115,22,.75);transition:transform .12s}",
      R + ".cp-cta:active:not(:disabled){transform:scale(.98)}",
      R + ".cp-join-row{display:flex;gap:8px;margin-top:9px}",
      R + ".cp-code-in{width:6.2rem;text-align:center;letter-spacing:.22em;font-weight:900}",
      R + ".cp-note{font-size:11px;color:var(--cp-t2);margin-top:7px;line-height:1.4}",
      R + ".cp-net-msg{font-size:11.5px;font-weight:700;text-align:center;color:#fb923c;margin-top:7px;min-height:1rem}",
      R + ".cp-sub-dim{font-size:11.5px;font-weight:600;color:var(--cp-t2);margin-top:4px}",

      /* Lobby */
      R + ".cp-lob-t{font-size:13px;font-weight:900}",
      R + ".cp-slots{display:flex;flex-direction:column;gap:6px;text-align:left}",
      R + ".cp-slot{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:12px;background:var(--cp-bg2);border:1.5px solid var(--cp-bd);font-size:12.5px;font-weight:800}",
      R + ".cp-slot.me{border-color:#f97316;background:rgba(249,115,22,.12)}",
      R + ".cp-snum{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;background:rgba(249,115,22,.18);color:#fb923c;flex:none}",
      R + ".cp-sname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".cp-wait-t{font-weight:600;color:var(--cp-t2);font-size:11.5px}",
      R + ".cp-host-tag{font-size:9.5px;font-weight:900;padding:2px 7px;border-radius:999px;background:#f97316;color:#fff}",
      R + ".cp-lob-acts{margin-top:12px}",

      /* Game HUD */
      R + ".cp-top{display:flex;align-items:center;justify-content:space-between;gap:8px}",
      R + ".cp-ib{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--cp-bg2);border:1px solid var(--cp-bd);flex:none}",
      R + ".cp-rpill{padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;background:var(--cp-bg2);border:1px solid var(--cp-bd)}",
      R + ".cp-rpill b{color:#fb923c}",
      R + ".cp-sbar{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}",
      R + ".cp-sbar::-webkit-scrollbar{display:none}",
      R + ".cp-sb-it{flex:none;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:var(--cp-bg2);border:1px solid var(--cp-bd);white-space:nowrap}",
      R + ".cp-sb-it.me{border-color:#f97316;background:rgba(249,115,22,.14)}",
      R + ".cp-sb-it b{color:var(--cp-ac2);margin-left:3px}",

      /* Stage & Shuffle */
      R + ".cp-stage{padding:15px}",
      R + ".cp-center{display:flex;flex-direction:column;align-items:center;text-align:center}",
      R + ".cp-badge-pill{padding:3px 10px;border-radius:999px;font-size:10.5px;font-weight:800;background:rgba(249,115,22,.16);border:1px solid rgba(249,115,22,.45);color:#fb923c}",
      "html.bright-mode " + R + ".cp-badge-pill{color:#c2410c}",
      R + ".cp-st-t{font-size:16px;font-weight:900;margin-top:6px}",
      R + ".cp-st-s{font-size:11.5px;color:var(--cp-t2);margin-top:3px}",
      R + ".cp-ac{color:#fb923c}",
      "html.bright-mode " + R + ".cp-ac{color:#ea580c}",
      R + ".cp-chits-anim{display:flex;gap:10px;justify-content:center;padding:24px 0 14px}",
      R + ".cp-chit-fold{width:46px;height:58px;border-radius:10px;display:grid;place-items:center;font-weight:900;font-size:20px;color:#ea580c;background:linear-gradient(145deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;box-shadow:0 8px 18px -6px rgba(0,0,0,.45);animation:cpToss .7s cubic-bezier(.2,1.2,.4,1) both;animation-delay:calc(var(--i)*70ms)}",
      "@keyframes cpToss{0%{opacity:0;transform:translateY(-36px) rotate(-18deg) scale(.8)}65%{opacity:1;transform:translateY(4px) rotate(6deg) scale(1.04)}100%{opacity:1;transform:none}}",

      /* Peek Card (3D Flip / Hold to Peek) */
      R + ".cp-peek-card{position:relative;width:210px;height:175px;margin:14px auto;cursor:pointer;perspective:700px;user-select:none;-webkit-user-select:none}",
      R + ".cp-pc-front," + R + ".cp-pc-back{position:absolute;inset:0;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .36s cubic-bezier(.22,1,.36,1)}",
      R + ".cp-pc-front{background:linear-gradient(145deg,rgba(255,251,235,.95),rgba(254,243,199,.88));color:#78350f;border:2px dashed #f59e0b;box-shadow:0 12px 26px -10px rgba(0,0,0,.45);transform:rotateY(0deg)}",
      R + ".cp-pc-back{background:linear-gradient(150deg,rgba(15,23,42,.92),rgba(30,41,59,.94));color:#fff;border:2px solid var(--rc,#f97316);box-shadow:0 0 24px -6px var(--rc,#f97316),0 14px 28px -10px rgba(0,0,0,.55);transform:rotateY(180deg)}",
      "html.bright-mode " + R + ".cp-pc-back{background:linear-gradient(150deg,#ffffff,#fff7ed);color:#0f172a}",
      R + ".cp-peek-card.open .cp-pc-front{transform:rotateY(-180deg)}",
      R + ".cp-peek-card.open .cp-pc-back{transform:rotateY(0deg)}",
      R + ".cp-fold-mark{font-size:40px;line-height:1}",
      R + ".cp-fold-txt{font-size:11.5px;font-weight:800;margin-top:8px;color:#92400e}",
      R + ".cp-r-emoji{font-size:42px;line-height:1}",
      R + ".cp-r-title{display:flex;flex-direction:column;align-items:center;margin-top:6px;line-height:1.15}",
      R + ".cp-r1{font-size:19px;font-weight:900}",
      R + ".cp-r2{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fb923c;margin-top:2px}",
      "html.bright-mode " + R + ".cp-r2{color:#ea580c}",
      R + ".cp-r-pts{margin-top:8px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:900;background:rgba(249,115,22,.18);color:#fbbf24}",
      "html.bright-mode " + R + ".cp-r-pts{color:#c2410c}",
      R + ".cp-hold-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 14px;border-radius:15px;font-weight:900;font-size:13px;background:rgba(249,115,22,.16);border:2px solid #f97316;color:#fb923c;user-select:none;-webkit-user-select:none;touch-action:none}",
      "html.bright-mode " + R + ".cp-hold-btn{color:#c2410c;background:rgba(249,115,22,.12)}",
      R + ".cp-hold-btn:active{background:#f97316;color:#fff!important}",
      R + ".cp-ready-grid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}",
      R + ".cp-rstat{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 9px;border-radius:10px;background:var(--cp-bg2);border:1px solid var(--cp-bd);font-size:11px;font-weight:700}",
      R + ".cp-rs-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".cp-rs-b{font-size:10px;font-weight:800;color:var(--cp-t2);flex:none}",
      R + ".cp-rs-b.ok{color:#34d399}",
      "html.bright-mode " + R + ".cp-rs-b.ok{color:#059669}",

      /* Guess phase */
      R + ".cp-hunt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}",
      R + ".cp-leader-line{display:block;font-size:11.5px;font-weight:700;color:var(--cp-ac2)}",
      R + ".cp-hunt-main{font-size:14.5px;font-weight:800;line-height:1.3;margin-top:2px}",
      R + ".cp-hunt-main span{color:#fb923c}",
      "html.bright-mode " + R + ".cp-hunt-main span{color:#ea580c}",
      R + ".cp-stage-tag{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;background:rgba(139,92,246,.2);color:#c4b5fd}",
      "html.bright-mode " + R + ".cp-stage-tag{color:#6d28d9}",
      R + ".cp-tbadge{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:900;background:var(--cp-bg2);border:1px solid var(--cp-bd);flex:none;font-variant-numeric:tabular-nums}",
      R + ".cp-tbar{height:5px;border-radius:999px;background:var(--cp-bg2);overflow:hidden;margin:9px 0 6px}",
      R + ".cp-tbar i{display:block;height:100%;background:linear-gradient(90deg,#fbbf24,#f97316);transition:width .2s linear}",
      R + ".cp-tbar i.low{background:#ef4444}",
      R + ".cp-pass-hint{font-size:11.5px;font-weight:700;color:var(--cp-t2);margin:6px 0 10px}",

      /* Suspect Seats Grid */
      R + ".cp-seats{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
      R + ".cp-seat{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:112px;padding:9px;border-radius:16px;background:var(--cp-bg2);border:1.5px solid var(--cp-bd);text-align:left;transition:transform .15s,border-color .18s,box-shadow .18s;opacity:1!important}",
      R + ".cp-seat.rev{border-color:var(--rc,#f97316);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(0,0,0,.04))}",
      R + ".cp-seat.guesser{box-shadow:0 0 0 1px var(--rc,#f97316)}",
      R + ".cp-seat.pick{border-color:#f97316;box-shadow:0 0 0 1px rgba(249,115,22,.45),0 8px 18px -10px rgba(249,115,22,.6);cursor:pointer!important}",
      R + ".cp-seat.pick:active{transform:scale(.96)}",
      R + ".cp-seat-top{display:flex;align-items:center;justify-content:space-between;gap:4px;width:100%}",
      R + ".cp-seat-n{font-size:11.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".cp-tag-g{font-size:8.5px;font-weight:900;padding:2px 6px;border-radius:999px;background:#f97316;color:#fff;flex:none}",
      R + ".cp-tag-p{font-size:8.5px;font-weight:900;padding:2px 6px;border-radius:999px;background:rgba(249,115,22,.22);color:#fb923c;border:1px solid #f97316;flex:none}",
      "html.bright-mode " + R + ".cp-tag-p{color:#c2410c}",
      R + ".cp-seat-face," + R + ".cp-seat-hide{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;flex:1;padding-top:6px}",
      R + ".cp-sf-em{font-size:26px;line-height:1}",
      R + ".cp-sf-t{display:flex;flex-direction:column;align-items:center;margin-top:3px;line-height:1.1}",
      R + ".cp-sf-t .cp-r1{font-size:14px}",
      R + ".cp-sf-t .cp-r2{font-size:9px}",
      R + ".cp-sf-pts{font-size:10px;font-weight:800;color:var(--cp-t2);margin-top:3px}",
      R + ".cp-secret-lbl{font-size:9px;font-weight:700;color:#34d399;margin-top:2px}",
      "html.bright-mode " + R + ".cp-secret-lbl{color:#059669}",
      R + ".cp-sh-q{font-size:28px;line-height:1}",
      R + ".cp-sh-l{font-size:10.5px;font-weight:700;color:var(--cp-t2);margin-top:5px}",

      /* Bluff chips & floating bubble */
      R + ".cp-bluffs{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;justify-content:center}",
      R + ".cp-bchip{padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;background:var(--cp-bg2);border:1px solid var(--cp-bd)}",
      R + ".cp-bchip:active{transform:scale(.95)}",
      R + ".cp-bub{position:absolute;left:50%;top:-12px;transform:translateX(-50%);padding:4px 9px;border-radius:999px;font-size:10.5px;font-weight:800;white-space:nowrap;background:#0f172a;color:#fde68a;border:1px solid #f59e0b;box-shadow:0 6px 14px rgba(0,0,0,.45);z-index:8;pointer-events:none;animation:cpBub 2s ease-out forwards}",
      "@keyframes cpBub{0%{opacity:0;transform:translate(-50%,8px) scale(.85)}15%{opacity:1;transform:translate(-50%,-4px) scale(1)}80%{opacity:1;transform:translate(-50%,-10px)}100%{opacity:0;transform:translate(-50%,-18px)}}",

      /* Round result */
      R + ".cp-outcomes{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}",
      R + ".cp-out{padding:9px 11px;border-radius:12px;font-size:12px;line-height:1.35;font-weight:600;border:1px solid transparent}",
      R + ".cp-out.ok{background:rgba(16,185,129,.16);border-color:rgba(52,211,153,.45);color:#a7f3d0}",
      R + ".cp-out.bad{background:rgba(244,63,94,.16);border-color:rgba(251,113,133,.45);color:#fecdd3}",
      "html.bright-mode " + R + ".cp-out.ok{background:#d1fae5;border-color:#34d399;color:#065f46}",
      "html.bright-mode " + R + ".cp-out.bad{background:#ffe4e6;border-color:#fb7185;color:#9f1239}",
      R + ".cp-res-list{display:flex;flex-direction:column;gap:6px}",
      R + ".cp-res-row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:12px;background:var(--cp-bg2);border:1px solid var(--cp-bd);border-left:4px solid var(--rc,#94a3b8)}",
      R + ".cp-rr-em{font-size:22px;flex:none}",
      R + ".cp-rr-mid{flex:1;min-width:0}",
      R + ".cp-rr-n{font-size:12.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      R + ".cp-rr-r{display:flex;align-items:baseline;gap:5px;margin-top:1px}",
      R + ".cp-rr-r .cp-r1{font-size:11.5px;font-weight:800;color:var(--cp-t2)}",
      R + ".cp-rr-r .cp-r2{font-size:9.5px;margin-top:0}",
      R + ".cp-rr-sc{text-align:right;flex:none}",
      R + ".cp-rr-d{display:block;font-size:13.5px;font-weight:900;font-variant-numeric:tabular-nums}",
      R + ".cp-rr-d.pos{color:#34d399}",
      "html.bright-mode " + R + ".cp-rr-d.pos{color:#059669}",
      R + ".cp-rr-d.zero{color:var(--cp-t2)}",
      R + ".cp-rr-tot{display:block;font-size:10px;font-weight:700;color:var(--cp-t2)}",

      /* Final podium */
      R + ".cp-podium{border-radius:22px;padding:20px 14px 16px;text-align:center;color:#fff;border:1px solid rgba(255,255,255,.16);background:radial-gradient(100% 70% at 50% -5%,rgba(249,115,22,.42),transparent 60%),linear-gradient(170deg,#1f140d,#0b1020);box-shadow:0 18px 40px -16px rgba(0,0,0,.72)}",
      R + ".cp-pod-tr{font-size:56px;line-height:1}",
      R + ".cp-pod-k{font-size:10px;font-weight:800;letter-spacing:.32em;color:#fdba74;margin-top:6px}",
      R + ".cp-pod-w{font-size:26px;font-weight:900;margin-top:2px}",
      R + ".cp-pod-sub{font-size:12px;font-weight:700;color:#cbd5e1;margin-top:2px}",
      R + ".cp-awards{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}",
      R + ".cp-aw{padding:4px 10px;border-radius:999px;font-size:10.5px;font-weight:700;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}",
      R + ".cp-rk-list{display:flex;flex-direction:column;gap:7px;margin-top:14px;text-align:left}",
      R + ".cp-rk{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:13px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}",
      R + ".cp-rk.first{background:linear-gradient(135deg,rgba(249,115,22,.32),rgba(255,255,255,.08));border-color:rgba(251,146,60,.7)}",
      R + ".cp-rk-m{font-size:20px;flex:none}",
      R + ".cp-rk-b{flex:1;min-width:0}",
      R + ".cp-rk-t{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:800}",
      R + ".cp-rk-t b{color:#fde68a;flex:none}",
      R + ".cp-rk-bar{height:5px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden;margin-top:4px}",
      R + ".cp-rk-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#fbbf24,#f97316)}",
      R + ".cp-pod-sec{border-radius:15px;color:#fff!important;background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.25)!important}",

      /* Toast */
      R + ".cp-toast{position:fixed;left:50%;bottom:calc(var(--nav-offset,0px) + 5.8rem);transform:translate(-50%,10px);max-width:90%;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:800;color:#fff;background:rgba(15,23,42,.92);border:1px solid rgba(249,115,22,.55);opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;z-index:80;text-align:center}",
      R + ".cp-toast.on{opacity:1;transform:translate(-50%,0)}"
    ];
    var stEl = document.createElement("style");
    stEl.id = "cp-style";
    stEl.textContent = css.join("\n");
    document.head.appendChild(stEl);
  }

  /* ---------- Mount into #quiz-arena-root ---------- */
  function boot(tries) {
    if (mounted) return;
    tries = tries || 0;
    root = document.getElementById("quiz-arena-root");
    var bar = root && root.querySelector(".ag-bar");
    if (!bar) {
      if (tries < 60) setTimeout(function () { boot(tries + 1); }, 80);
      return;
    }
    mounted = true;
    injectCss();

    /* Check URL invite ?battle=XXXX&game=chorpolice */
    try {
      var sp = new URLSearchParams(location.search);
      var bCode = window.__cpInvite || sp.get("battle"), gType = window.__cpInvite ? "chorpolice" : sp.get("game");
      if (bCode && /^\d{4}$/.test(bCode) && gType === "chorpolice") {
        pendingInviteCode = bCode;
        cfg.mode = "online";
        cfg.code = bCode;
      }
    } catch (e) { }

    /* Add 4th tab button to Arena bar */
    tabBtn = document.createElement("button");
    tabBtn.type = "button";
    tabBtn.setAttribute("role", "tab");
    tabBtn.className = "ag-tab";
    tabBtn.setAttribute("data-cp-tab", "1");
    tabBtn.setAttribute("aria-selected", "false");
    tabBtn.innerHTML = ico("shield") + "<span>Chor Police</span>";
    bar.appendChild(tabBtn);

    /* Add Chor Police pane into #quiz-arena-root */
    pane = document.createElement("div");
    pane.id = "ag-pane-chorpolice";
    pane.className = "ag-pane ag-off";
    root.appendChild(pane);

    tabBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      activateTab();
    });
    pane.addEventListener("click", onPaneClick);
    pane.addEventListener("input", onPaneInput);

    /* Deactivate Chor Police whenever user switches back to Quiz, Ludo, or Snakes */
    window.addEventListener("ag:change", function (ev) {
      if (ev && ev.detail && ev.detail.key === "tab") deactivateTab();
    });
    root.addEventListener("click", function (e) {
      var agTab = e.target.closest && e.target.closest('[data-ag="tab"]');
      if (agTab) deactivateTab();
    });

    icons();

    if (pendingInviteCode) {
      try { if (typeof window.switchTab === "function") window.switchTab("quiz"); } catch (e) { }
      activateTab();
    }
  }

  window.ChorPoliceArena = {
    version: "1.0.0",
    open: activateTab,
    setLang: setLang,
    getLang: function () { return lang; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(0); });
  } else {
    boot(0);
  }
})();

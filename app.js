/* SOLLI-GAMES — app.js v6 (solo + realtime multiplayer servers) */
"use strict";

/* ======= PASTE YOUR SUPABASE KEYS HERE (auth + multiplayer + leaderboard) ======= */
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL";        // https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeW9oZHVieXFiendyZnViaXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzQ0NTIsImV4cCI6MjEwNzcxMDQ1Mn0.R89dAAB9FDKnjIGGtoLXm5V73JLA-erXd_WjWsAg4dU";
/* =============================================================================== */

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
function read(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function remove(k) { try { localStorage.removeItem(k); } catch {} }
function escapeHTML(v) { return String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function shuffle(arr) { const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = rand(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; }
const timers = new Set();
function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }
function timeAgo(ts) {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  return new Date(ts).toLocaleDateString();
}

/* ---------- SI Coin ---------- */
function coin(size = 16) {
  return `<svg class="coin" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#f6b73c"/><stop offset="1" stop-color="#d98e04"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#cg${size})" stroke="#8a5a00" stroke-width="1.4"/><circle cx="12" cy="12" r="7.4" fill="none" stroke="#8a5a00" stroke-opacity=".45" stroke-width=".8"/><text x="12" y="16.4" text-anchor="middle" font-family="Arial Black,Arial" font-size="11" font-weight="900" fill="#7a4a00">J</text></svg>`;
}

/* ---------- Data ---------- */
const GAMES = [
  {id:"bluelock", title:"Blue Lock: Striker Duel", category:"football", tag:"STRIKER SHOWDOWN", symbol:"⚽", d1:"🔥", d2:"🏆", description:"6 strikers, Flow State and a 5-round duel vs the keeper AI.", a:"#0d2f55", b:"#0a1428", glow:"rgba(59,130,246,.5)"},
  {id:"geometry", title:"Neon Dash: Geometry Rush", category:"arcade", tag:"RHYTHM RUNNER", symbol:"▲", d1:"🎵", d2:"✨", description:"Jump spikes and blocks in this glowing rhythm runner.", a:"#152f55", b:"#422080", glow:"rgba(34,211,238,.45)"},
  {id:"flappy",   title:"Sky Flap",                category:"arcade", tag:"ONE-TAP FLYER", symbol:"🐦", d1:"☁️", d2:"🪽", description:"Tap to flap through neon gates. One touch and it's over.", a:"#0d3a52", b:"#123055", glow:"rgba(103,232,249,.45)"},
  {id:"merge2048",title:"2048 Merge Mania",        category:"puzzle", tag:"TILE MERGE",    symbol:"🔢", d1:"➡️", d2:"💫", description:"Swipe, merge matching tiles and chase the legendary 2048.", a:"#4a3315", b:"#2b1a3e", glow:"rgba(251,191,36,.4)"},
  {id:"mole",     title:"Mole Smash",              category:"arcade", tag:"WHACK-A-MOLE",  symbol:"🔨", d1:"🕳️", d2:"💥", description:"Smash moles, dodge bombs. 30 seconds of chaos.", a:"#1c3a24", b:"#152a1e", glow:"rgba(74,222,128,.4)"},
  {id:"snake",    title:"Serpentix",               category:"arcade", tag:"NEON SNAKE",    symbol:"🐍", d1:"🍏", d2:"⚡", description:"Grow your glowing snake and eat every orb without crashing.", a:"#0d3a2a", b:"#101b30", glow:"rgba(74,222,128,.4)"},
  {id:"simon",    title:"Echo Pulse",              category:"arcade", tag:"MEMORY PATTERN", symbol:"♫", d1:"🎧", d2:"🔊", description:"Watch the glowing, sounding pattern — then repeat it perfectly.", a:"#3a2a0d", b:"#151730", glow:"rgba(251,191,36,.4)"},
  {id:"memory",   title:"Mind Matrix",             category:"puzzle", tag:"MEMORY",        symbol:"◆", d1:"🃏", d2:"✨", description:"Flip tiles and match all eight pairs in as few moves as possible.", a:"#123745", b:"#101b30", glow:"rgba(34,211,238,.35)"},
  {id:"reaction", title:"Reflex Storm",            category:"arcade", tag:"SPEED TEST",    symbol:"⚡", d1:"⏱️", d2:"💨", description:"Wait for green, then strike faster than a blink.", a:"#482047", b:"#21152e", glow:"rgba(244,114,182,.4)"},
  {id:"number",   title:"Cipher Hunt",             category:"puzzle", tag:"NUMBER QUEST",  symbol:"?", d1:"🔍", d2:"❓", description:"Crack the secret code before your seven guesses run out.", a:"#28204e", b:"#15152d", glow:"rgba(167,139,250,.4)"},
  {id:"math",     title:"Math Blaze",              category:"puzzle", tag:"BRAIN TRAINING", symbol:"∑", d1:"➕", d2:"✖️", description:"Ten burning-fast maths challenges. How many can you land?", a:"#193d38", b:"#11262b", glow:"rgba(74,222,128,.35)"},
  {id:"rps",      title:"RPS Showdown",            category:"arcade", tag:"CLASSIC DUEL",  symbol:"✂", d1:"✊", d2:"🔥", description:"Five rounds of rock-paper-scissors mind games vs the machine.", a:"#48301b", b:"#201b27", glow:"rgba(251,191,36,.35)"},
  {id:"tictactoe",title:"Tic Tac Tactics",         category:"puzzle", tag:"STRATEGY",      symbol:"×", d1:"❌", d2:"⭕", description:"Outsmart the CPU (easy/hard) or duel a friend locally.", a:"#29284e", b:"#15172c", glow:"rgba(129,140,248,.35)"},
  {id:"scramble", title:"Word Forge",              category:"puzzle", tag:"WORD GAME",     symbol:"✎", d1:"🔤", d2:"✨", description:"Forge the scrambled letters back into words.", a:"#0d3a3a", b:"#12182b", glow:"rgba(34,211,238,.35)"}
];
const GAME_SYMBOLS = Object.fromEntries(GAMES.map(g => [g.id, g.symbol]));
const MP_GAMES = { ttt:"Tic-Tac-Toe Duel", rps:"RPS Duel", reaction:"Reaction Duel", bluelock:"Penalty Duel" };
const PAGE_LABELS = { home:"Gaming Universe", games:"Solo Arcade", multi:"Multiplayer Arena", leaderboard:"Leaderboard", shop:"SI Coin Shop", profile:"Player Profile", settings:"Settings", admin:"Admin Control" };
const ACCENTS = { purple:["#a78bfa","167,139,250"], cyan:["#22d3ee","34,211,238"], pink:["#f472b6","244,114,182"], green:["#4ade80","74,222,128"] };
const AVATAR_EMOJIS = ["🦊","🐼","🐸","🚀","👾","🎮","⚡","🌟"];
const WORDS = ["PLANET","GAMER","NEON","ROCKET","PUZZLE","ARCADE","LEVEL","SCORE","SHIELD","WIZARD","JUNGLE","LASER","NINJA","PIXEL","TURBO","ROBOT","GHOST","DRAGON","COMET","SPARK","CIPHER","ORBIT"];
const SHOP = {
  passes: [
    {id:"double", name:"Golden Multiplier", desc:"Earn 2× SI Coins from every game — forever.", price:500, icon:"🪙"},
    {id:"shield", name:"Cube Guardian",     desc:"Neon Dash: survive your first crash each run.", price:300, icon:"🛡️"},
    {id:"slow",   name:"Time Warp",         desc:"Serpentix: the game speeds up more slowly.", price:300, icon:"⏳"},
    {id:"peek",   name:"Third Eye",         desc:"Mind Matrix: glimpse every tile at round start.", price:250, icon:"👁️"}
  ],
  consumables: [
    {id:"boost", name:"Coin Surge",  desc:"Your next game pays double SI Coins.", price:100, icon:"⚡"},
    {id:"life",  name:"Spare Heart", desc:"Serpentix: one free continue when you crash.", price:150, icon:"❤️"}
  ]
};

/* ---------- Supabase ---------- */
const urlOK = /^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(SUPABASE_URL);
const keyOK = SUPABASE_ANON_KEY.length > 30;
const sb = (urlOK && keyOK && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
if (SUPABASE_URL !== "PASTE_YOUR_SUPABASE_URL" && !sb)
  later(() => toast("⚠️ Supabase keys look invalid — URL must be https://xxxx.supabase.co and the anon key pasted fully."), 900);

/* ---------- State ---------- */
let user = read("sgUser", null);
let sessionUser = null;
let scores = {};
let settings = Object.assign({ mode:"dark", accent:"purple", compact:false, motion:true, sound:true }, read("sgSettings", {}));
let currentPage = "home", currentFilter = "all", searchText = "", currentGame = null, authMode = "signin", gameCleanup = null;
let pmId = null;
let mpTimer = null;

function activeUser() { return sessionUser || user; }
function scoresKey() { const u = activeUser(); return u?.id ? "sgScores_" + u.id : "sgScores_guest"; }
function loadScores() {
  const base = { played:0, best:{}, history:[], coins:0, passes:[], inv:{ boost:0, life:0 } };
  scores = Object.assign(base, read(scoresKey(), {}));
  scores.inv = Object.assign({ boost:0, life:0 }, scores.inv);
}
function saveScores() { write(scoresKey(), scores); }
loadScores();
function bestScore(id) { return Math.max(0, Number(scores.best[id]) || 0); }
function overallBest() { return Math.max(0, ...Object.values(scores.best || {}).map(Number)); }
function hasPass(id) { return (scores.passes || []).includes(id); }

/* ---------- Sound ---------- */
const Sound = {
  ctx: null,
  play(f = 440, d = .08, type = "square", g = .05) {
    if (!settings.sound) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const o = this.ctx.createOscillator(), gn = this.ctx.createGain();
      o.type = type; o.frequency.value = f;
      gn.gain.setValueAtTime(g, this.ctx.currentTime);
      gn.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + d);
      o.connect(gn).connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
    } catch {}
  },
  win() { this.play(523, .09); setTimeout(() => this.play(784, .14), 90); },
  lose() { this.play(196, .25, "sawtooth", .04); }
};

/* ---------- Toast ---------- */
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  $("#toastContainer").appendChild(t);
  later(() => { t.style.opacity = "0"; later(() => t.remove(), 250); }, 3000);
}

/* ---------- Avatars ---------- */
function paintAvatar(el) {
  if (!el) return;
  const u = activeUser();
  if (u?.avatar) el.innerHTML = `<img class="avatar-img" src="${u.avatar}" alt="Profile picture">`;
  else if (u?.emoji) el.textContent = u.emoji;
  else el.textContent = (u?.name || "S").trim().charAt(0).toUpperCase() || "S";
}
function miniAvatarHTML() {
  const u = activeUser();
  if (u?.avatar) return `<img class="avatar-img" src="${u.avatar}" alt="">`;
  if (u?.emoji) return escapeHTML(u.emoji);
  return escapeHTML((u?.name || "S").charAt(0).toUpperCase());
}
 $("#uploadAvatarBtn").addEventListener("click", () => $("#avatarInput").click());
 $("#avatarInput").addEventListener("change", (e) => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file || !file.type.startsWith("image/")) return toast("Choose an image file.");
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const S = 128, cv = document.createElement("canvas");
      cv.width = cv.height = S;
      const side = Math.min(img.width, img.height);
      cv.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      const u = activeUser() || { id:"local:guest", name:"Guest Player", email:"" };
      u.avatar = cv.toDataURL("image/jpeg", .85); u.emoji = null;
      if (sessionUser) sessionUser = u; else user = u;
      persistUser(); updateAccountUI(); toast("Profile picture updated");
    };
    img.onerror = () => toast("Could not read that image.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
 $("#removeAvatarBtn").addEventListener("click", () => {
  const u = activeUser(); if (!u || (!u.avatar && !u.emoji)) return toast("Nothing to remove.");
  u.avatar = null; u.emoji = null;
  if (sessionUser) sessionUser = u; else user = u;
  persistUser(); updateAccountUI(); toast("Profile picture removed");
});
function persistUser() { if (!sessionUser && user) write("sgUser", user); }
function buildEmojiRow() {
  const row = $("#emojiRow");
  row.innerHTML = AVATAR_EMOJIS.map(em => `<button class="emoji-btn" type="button" data-emoji="${em}" aria-label="Use ${em}">${em}</button>`).join("");
  row.addEventListener("click", (e) => {
    const b = e.target.closest("[data-emoji]"); if (!b) return;
    const u = activeUser() || { id:"local:guest", name:"Guest Player", email:"" };
    u.emoji = b.dataset.emoji; u.avatar = null;
    if (sessionUser) sessionUser = u; else user = u;
    persistUser(); updateAccountUI(); toast("Avatar updated");
  });
}

/* ---------- Accounts, bans, online sync ---------- */
function registerAccount(u) {
  if (!u?.id) return;
  const reg = read("sgAccounts", {});
  reg[u.id] = { name:u.name, email:u.email || "", provider:u.provider || "demo",
    vip:reg[u.id]?.vip || false, joined:reg[u.id]?.joined || Date.now(), lastLogin:Date.now(), updated:Date.now() };
  write("sgAccounts", reg);
}
function isBanned(u) {
  if (!u) return false;
  const bans = read("sgBans", {});
  return !!(bans[u.id] || (u.email && bans[u.email.toLowerCase()]));
}
function pushOnline() {
  if (!sb || !sessionUser) return;
  sb.from("scores").upsert({
    user_id: sessionUser.id, name: sessionUser.name,
    best: scores.best, coins: scores.coins || 0, total_best: overallBest()
  }).then(({ error }) => { if (error) console.warn("Online sync failed:", error.message); });
}
function applySession(session) {
  const u = session.user;
  const candidate = {
    id: u.id,
    name: u.user_metadata?.name || u.user_metadata?.full_name || (u.email || "Player").split("@")[0],
    email: u.email || "",
    avatar: u.user_metadata?.avatar_url || null,
    emoji: null,
    provider: u.app_metadata?.provider || "email"
  };
  if (isBanned(candidate)) { toast("Your account is banned from this arcade."); sb.auth.signOut(); return; }
  sessionUser = candidate; user = null; remove("sgUser");
  registerAccount(sessionUser);
  loadScores(); updateAccountUI(); closeModal("authModal");
  toast(`Welcome, ${sessionUser.name}!`);
}
if (sb) {
  sb.auth.getSession().then(({ data }) => { if (data.session) applySession(data.session); });
  sb.auth.onAuthStateChange((_e, session) => {
    if (session) { if (sessionUser?.id !== session.user.id) applySession(session); }
    else if (sessionUser) { sessionUser = null; loadScores(); updateAccountUI(); }
  });
}

/* ---------- Auth UI ---------- */
function setAuthMode(mode) {
  authMode = mode === "signup" ? "signup" : "signin";
  $$(".auth-tab").forEach(b => {
    const on = b.dataset.authMode === authMode;
    b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on));
  });
  const up = authMode === "signup";
  $("#nameField").classList.toggle("hidden", !up);
  $("#authName").required = up;
  $("#authPassword").autocomplete = up ? "new-password" : "current-password";
  $("#authTitle").innerHTML = up ? 'Create your <span class="gradient-text">player card</span>' : 'Ready to <span class="gradient-text">play?</span>';
  $("#authSubmit").textContent = sb ? (up ? "Create account ↗" : "Sign in ↗") : "Start demo session ↗";
  $("#authError").classList.add("hidden");
}
 $$("[data-auth-mode]").forEach(b => b.addEventListener("click", () => setAuthMode(b.dataset.authMode)));
 $("#passwordEye").addEventListener("click", () => {
  const pw = $("#authPassword"), show = pw.type === "password";
  pw.type = show ? "text" : "password";
  $("#passwordEye").textContent = show ? "🙈" : "👁"; pw.focus();
});
async function googleSignIn() {
  if (!sb) return toast("Google sign-in needs your Supabase keys — paste SUPABASE_URL + SUPABASE_ANON_KEY at the top of app.js, then run via Live Server (http://), not file://.");
  const { error } = await sb.auth.signInWithOAuth({ provider: "google" });
  if (error) toast("Google sign-in failed: " + error.message);
}
 $("#googleBtn").addEventListener("click", googleSignIn);
 $("#googleBtn2").addEventListener("click", googleSignIn);

 $("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#authError");
  const fail = (m) => { err.textContent = m; err.classList.remove("hidden"); };
  const name = $("#authName").value.trim();
  const email = $("#authEmail").value.trim();
  const pass = $("#authPassword").value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.");
  if (pass.length < 6) return fail("Password must be at least 6 characters.");
  if (authMode === "signup" && name.length < 2) return fail("Enter a player name (2+ characters).");
  if (sb) {
    const { error } = authMode === "signup"
      ? await sb.auth.signUp({ email, password: pass, options: { data: { name } } })
      : await sb.auth.signInWithPassword({ email, password: pass });
    if (error) return fail(error.message.includes("confirmed") ? "Check your inbox — confirm your email first, then sign in." : error.message);
    $("#authForm").reset();
    if (authMode === "signup") toast("Account created! Check your inbox if email confirmation is on.");
    return;
  }
  const id = "local:" + email.toLowerCase();
  if (isBanned({ id, email })) return fail("This account is banned from the arcade.");
  user = { id, name: authMode === "signup" ? name : (email.split("@")[0] || "Player").slice(0, 24), email, avatar: user?.avatar || null, emoji: user?.emoji || null, provider: "demo" };
  registerAccount(user);
  persistUser(); loadScores(); updateAccountUI();
  $("#authForm").reset(); closeModal("authModal");
  toast(`Welcome, ${user.name}! (demo mode)`);
});
async function signOut() {
  if (!activeUser()) { toast("You are not signed in."); return; }
  if (mp.code) leaveRoom();
  if (sb && sessionUser) await sb.auth.signOut();
  sessionUser = null; user = null; remove("sgUser");
  loadScores(); updateAccountUI(); renderAll();
  toast("Signed out. Guest progress is kept.");
}
 $("#signOutBtn").addEventListener("click", signOut);
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-auth-btn]");
  if (!b) return;
  activeUser() ? signOut() : (openModal("authModal"), setAuthMode("signin"));
});

/* ---------- Modals ---------- */
let lastFocus = null;
function openModal(id) {
  lastFocus = document.activeElement;
  const m = document.getElementById(id); if (!m) return;
  m.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  m.querySelector(".modal-close")?.focus();
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m || m.classList.contains("hidden")) return;
  m.classList.add("hidden");
  if (!$$(".modal-backdrop:not(.hidden)").length) document.body.style.overflow = "";
  if (id === "gameModal") {
    clearTimers(); stopRunner();
    if (gameCleanup) { gameCleanup(); gameCleanup = null; }
    currentGame = null; $("#gameMount").innerHTML = "";
  }
  lastFocus?.focus?.(); lastFocus = null;
}
 $$("[data-close-modal]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.closeModal)));
 $$(".modal-backdrop").forEach(m => m.addEventListener("click", (e) => { if (e.target === m) closeModal(m.id); }));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $$(".modal-backdrop:not(.hidden)").forEach(m => closeModal(m.id));
});

/* ---------- Admin ---------- */
let adminBuf = "";
document.addEventListener("keydown", (e) => {
  if (e.key.length !== 1) return;
  adminBuf = (adminBuf + e.key).slice(-6);
  if (adminBuf === "/admin") {
    adminBuf = "";
    if (sessionStorage.getItem("sgAdmin") === "1") goPage("admin");
    else { $("#adminPass").value = ""; $("#adminError").classList.add("hidden"); openModal("adminModal"); }
  }
});
 $("#adminForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = read("sgAdminPass", "solli-admin");
  if ($("#adminPass").value === pass) {
    sessionStorage.setItem("sgAdmin", "1");
    $("#adminNavBtn").classList.remove("hidden");
    closeModal("adminModal"); goPage("admin"); toast("Admin panel unlocked ⛨");
  } else { $("#adminError").textContent = "Wrong password."; $("#adminError").classList.remove("hidden"); }
});
 $("#adSavePass").addEventListener("click", () => {
  const v = $("#adNewPass").value.trim();
  if (v.length < 4) return toast("Use at least 4 characters.");
  write("sgAdminPass", v); $("#adNewPass").value = ""; toast("Admin password updated");
});
function targetScores(id) { return read("sgScores_" + id, {}) || {}; }
function renderAdmin() {
  const reg = read("sgAccounts", {});
  const bans = read("sgBans", {});
  const rows = Object.entries(reg).map(([id, a]) => {
    const s = targetScores(id);
    return { id, ...a, coins: s.coins || 0, played: s.played || 0, best: Math.max(0, ...Object.values(s.best || {}).map(Number)) };
  }).sort((a, b) => b.best - a.best);
  $("#adAccounts").textContent = rows.length;
  $("#adCoins").textContent = rows.reduce((t, r) => t + r.coins, 0).toLocaleString();
  $("#adRounds").textContent = rows.reduce((t, r) => t + r.played, 0);
  $("#adBanned").textContent = Object.keys(bans).length;
  $("#adminRows").innerHTML = rows.length ? rows.map(r => {
    const banned = !!(bans[r.id] || bans[r.email?.toLowerCase?.()]);
    return `<tr data-pid="${r.id}">
      <td><div class="player-cell"><span class="mini-avatar">${escapeHTML((r.name || "?").charAt(0).toUpperCase())}</span>
        <span><strong>${escapeHTML(r.name)}</strong><br><small style="color:var(--muted)">${escapeHTML(r.email || "no email")} · ${escapeHTML(r.provider)}</small></span></div></td>
      <td>${coin(14)} ${r.coins.toLocaleString()} · ${r.played} rounds · best ${r.best.toLocaleString()}</td>
      <td>${banned ? '<span class="status-pill pill-danger">BANNED</span> ' : ""}${r.vip ? '<span class="owned-pill">VIP</span>' : ""}</td>
      <td><button class="btn btn-small btn-primary" data-manage="${r.id}">Manage ▸</button></td></tr>`;
  }).join("") : `<tr><td colspan="4"><div class="empty-state">No accounts yet — sign-ins appear here.</div></td></tr>`;
}
function openPlayerModal(id) {
  pmId = id;
  const reg = read("sgAccounts", {}), acc = reg[id] || {};
  const bans = read("sgBans", {});
  const s = targetScores(id);
  const banned = !!(bans[id] || bans[acc.email?.toLowerCase?.()]);
  $("#pmAvatar").textContent = (acc.name || "?").charAt(0).toUpperCase();
  $("#pmName").textContent = acc.name || "Unknown";
  $("#pmMeta").textContent = `${acc.email || "no email"} · ${acc.provider || "demo"} · joined ${acc.joined ? new Date(acc.joined).toLocaleDateString() : "unknown"}`;
  $("#pmFlags").innerHTML = (banned ? '<span class="status-pill pill-danger">BANNED</span> ' : "") + (acc.vip ? '<span class="owned-pill">VIP</span>' : "") + ` <small style="color:var(--muted)">Last login: ${timeAgo(acc.lastLogin)}</small>`;
  $("#pmCoins").innerHTML = `${coin(15)} ${(s.coins || 0).toLocaleString()}`;
  $("#pmBest").textContent = Math.max(0, ...Object.values(s.best || {}).map(Number)).toLocaleString();
  $("#pmPlayed").textContent = s.played || 0;
  $("#pmSeen").textContent = timeAgo(s.history?.[0]?.date || acc.lastLogin);
  $("#pmPassSel").innerHTML = SHOP.passes.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join("");
  $("#pmVip").textContent = acc.vip ? "Remove VIP" : "Make VIP";
  $("#pmBan").textContent = banned ? "Unban" : "Ban";
  openModal("playerModal");
}
function mutateTarget(fn) {
  const s = targetScores(pmId); fn(s); write("sgScores_" + pmId, s);
  if (activeUser()?.id === pmId) { loadScores(); renderAll(); }
  renderAdmin(); openPlayerModal(pmId);
}
 $("#adminRows").addEventListener("click", (e) => {
  const m = e.target.closest("[data-manage]");
  const row = e.target.closest("tr[data-pid]");
  if (m) return openPlayerModal(m.dataset.manage);
  if (row) openPlayerModal(row.dataset.pid);
});
 $("#pmGift").addEventListener("click", () => {
  const amt = Math.max(1, Math.round(Number($("#pmGiftAmt").value) || 0));
  mutateTarget((s) => { s.coins = (s.coins || 0) + amt; });
  toast(`Gift sent: ${amt} SI Coins`);
});
 $("#pmGrant").addEventListener("click", () => {
  const pass = $("#pmPassSel").value;
  mutateTarget((s) => { s.passes = s.passes || []; if (!s.passes.includes(pass)) s.passes.push(pass); });
  toast("Game pass granted 🎁");
});
 $("#pmRevoke").addEventListener("click", () => {
  const pass = $("#pmPassSel").value;
  mutateTarget((s) => { s.passes = (s.passes || []).filter(p => p !== pass); });
  toast("Pass revoked");
});
 $("#pmVip").addEventListener("click", () => {
  const reg = read("sgAccounts", {});
  if (reg[pmId]) { reg[pmId].vip = !reg[pmId].vip; write("sgAccounts", reg); toast(reg[pmId].vip ? "VIP granted ⭐" : "VIP removed"); renderAdmin(); openPlayerModal(pmId); }
});
 $("#pmBan").addEventListener("click", () => {
  const reg = read("sgAccounts", {}), bans = read("sgBans", {});
  const banned = !!(bans[pmId] || bans[reg[pmId]?.email?.toLowerCase?.()]);
  if (banned) {
    delete bans[pmId]; if (reg[pmId]) delete bans[reg[pmId].email.toLowerCase()];
    write("sgBans", bans); toast("Player unbanned");
  } else {
    bans[pmId] = true; if (reg[pmId]?.email) bans[reg[pmId].email.toLowerCase()] = true;
    write("sgBans", bans);
    if (activeUser()?.id === pmId) signOut();
    toast("Player banned 🚫");
  }
  renderAdmin(); openPlayerModal(pmId);
});
if (sessionStorage.getItem("sgAdmin") === "1") $("#adminNavBtn").classList.remove("hidden");

/* ============================================================
   MULTIPLAYER — Supabase Realtime rooms
   ============================================================ */
let mp = { code:null, ch:null, host:false, name:"", players:[], game:null, chosen:null, oppName:"" };
let mpRound = 0, mpMine = 0, mpOpp = 0, mpMsg = null, mpPicks = {}, mpGoAt = 0;

function mpTeardown(notify) {
  if (mp.ch) { try { mp.ch.untrack(); sb?.removeChannel(mp.ch); } catch {} }
  if (mp.code && mp.host && sb) sb.from("rooms").delete().eq("code", mp.code);
  if (notify && mp.code) sendRaw("leave", { name: mp.name });
  mp = { code:null, ch:null, host:false, name:"", players:[], game:null, chosen:null, oppName:"" };
  mpRound = 0; mpMine = 0; mpOpp = 0; mpPicks = {};
  if (currentPage === "multi") renderMultiPage();
}
function sendRaw(type, data = {}) {
  try { mp.ch?.send({ type:"broadcast", event:"msg", payload:{ type, ...data } }); } catch {}
}
function mpUpdateRow(fields) {
  if (sb && mp.code) sb.from("rooms").update(fields).eq("code", mp.code).then(() => refreshServerList());
}
function createRoom() {
  if (!sb) return toast("Multiplayer needs your Supabase keys in app.js + the rooms SQL.");
  const code = Array.from({ length:4 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[rand(0, 30)]).join("");
  const name = activeUser()?.name || "Guest";
  sb.from("rooms").insert({ code, host:name, players:1, status:"lobby" }).then(({ error }) => {
    if (error) return toast("Could not create server: " + error.message);
    joinRoom(code, true);
  });
}
function joinRoom(code, isHost = false) {
  code = (code || "").toUpperCase().trim();
  if (!sb) return toast("Multiplayer needs your Supabase keys in app.js + the rooms SQL.");
  if (!code) return toast("Enter a server code first.");
  if (mp.code) mpTeardown(false);
  const name = activeUser()?.name || "Guest";
  mp = { code, ch:null, host:isHost, name, players:[], game:null, chosen:null, oppName:"" };
  mp.ch = sb.channel("sg-room-" + code, { config:{ broadcast:{ self:false }, presence:{ key: name + "-" + rand(1000, 9999) } } })
    .on("presence", { event:"sync" }, () => {
      const state = mp.ch.presenceState();
      const seen = new Set();
      mp.players = [];
      Object.values(state).forEach(arr => {
        const p = arr[0];
        if (p?.name && !seen.has(p.key)) { seen.add(p.key); mp.players.push(p.name); }
      });
      mp.oppName = mp.players.find(n => n !== mp.name) || mp.oppName;
      mpUpdateRow({ players: mp.players.length });
      renderRoomUI();
    })
    .on("broadcast", { event:"msg" }, ({ payload }) => handleMpMsg(payload))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        mp.ch.track({ name, key: mp.ch.presenceKey || name });
        mp.ch.track({ name });
        toast(isHost ? `Server ${code} created — share the code!` : `Joined server ${code}!`);
        renderRoomUI();
      }
    });
  renderMultiPage();
}
function startMpGame(game) {
  if (!mp.host) return;
  mp.game = game; mpRound = 1; mpMine = 0; mpOpp = 0; mpPicks = {};
  mpUpdateRow({ status:"playing" });
  sendRaw("start", { game });
  renderMpGame();
}
function endMpGame() {
  mp.game = null; mpPicks = {};
  mpUpdateRow({ status:"lobby" });
  $("#mpHostControls")?.classList.remove("hidden");
  $("#mpWaiting")?.classList.remove("hidden");
  if ($("#mpStage")) $("#mpStage").innerHTML = "";
  renderRoomUI();
}
function handleMpMsg(m) {
  switch (m.type) {
    case "start":
      mp.game = m.game; mpRound = 1; mpMine = 0; mpOpp = 0; mpPicks = {};
      renderMpGame(); break;
    case "end": endMpGame(); break;
    case "leave": toast(`${m.name || "Your opponent"} left the server.`); mpTeardown(false); break;
    case "ttt": mpTTTRemote(m.i); break;
    case "rps": mpPicks[m.host ? "host" : "guest"] = m.pick; mpRPSResolve(); break;
    case "go": mpGoAt = performance.now(); mpReactionShowGo(); break;
    case "ms": mpPicks[m.host ? "host" : "guest"] = m.ms; mpReactionResolve(); break;
    case "atk": mpPicks.atk = m; mpBLResolve(); break;
    case "dive": mpPicks.dive = m; mpBLResolve(); break;
  }
}
function renderRoomUI() {
  if (!mp.code) return;
  $("#mpCodeBox").textContent = mp.code;
  const chips = mp.players.map(n =>
    `<span class="pchip"><span class="dot"></span>${n === mp.name ? "👑 " : ""}${escapeHTML(n)}${n === mp.name ? ' <span class="crown">(you)</span>' : ""}</span>`).join("");
  $("#mpPlayers").innerHTML = chips || '<span class="empty-state">Connecting…</span>';
  const hostCtl = $("#mpHostControls"), waiting = $("#mpWaiting");
  if (mp.game) { hostCtl?.classList.add("hidden"); waiting?.classList.add("hidden"); }
  else if (mp.host) { hostCtl?.classList.remove("hidden"); waiting?.classList.add("hidden"); }
  else { hostCtl?.classList.add("hidden"); waiting?.classList.remove("hidden"); }
  const startBtn = $("#mpStart");
  if (startBtn) startBtn.disabled = !(mp.players.length >= 2 && mp.chosen);
}
function renderMultiPage() {
  const setup = $("#mpSetup"), lobby = $("#mpLobby"), room = $("#mpRoom");
  if (!setup) return;
  if (!sb) { setup.classList.remove("hidden"); lobby.classList.add("hidden"); room.classList.add("hidden"); return; }
  setup.classList.add("hidden");
  if (mp.code) { lobby.classList.add("hidden"); room.classList.remove("hidden"); renderRoomUI(); }
  else { lobby.classList.remove("hidden"); room.classList.add("hidden"); refreshServerList(); }
}
async function refreshServerList() {
  const box = $("#serverList");
  if (!box || !sb || mp.code) return;
  const { data, error } = await sb.from("rooms").select("*").order("created_at", { ascending:false }).limit(20);
  if (error) { box.innerHTML = '<div class="server-empty">Could not load servers — check the rooms SQL.</div>'; return; }
  const fresh = (data || []).filter(r => Date.now() - new Date(r.created_at).getTime() < 2 * 3600 * 1000);
  box.innerHTML = fresh.length ? fresh.map(r =>
    `<div class="server-row">
      <div><span class="server-code">${escapeHTML(r.code)}</span> <span class="server-meta">host ${escapeHTML(r.host || "?")} · ${r.players || 1}/2 · ${escapeHTML(r.status || "lobby")}</span></div>
      <button class="btn btn-small ${r.players >= 2 || r.status === "playing" ? "" : "btn-primary"}" data-joinroom="${escapeHTML(r.code)}" ${r.players >= 2 || r.status === "playing" ? "disabled" : ""}>${r.players >= 2 ? "FULL" : r.status === "playing" ? "IN GAME" : "Join ▸"}</button>
    </div>`).join("") : '<div class="server-empty">No open servers right now — create one!</div>';
}
 $("#mpCreate").addEventListener("click", createRoom);
 $("#mpJoinBtn").addEventListener("click", () => joinRoom($("#mpJoinCode").value, false));
 $("#mpJoinCode").addEventListener("keydown", (e) => { if (e.key === "Enter") joinRoom($("#mpJoinCode").value, false); });
 $("#serverRefresh").addEventListener("click", refreshServerList);
 $("#serverList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-joinroom]");
  if (b) joinRoom(b.dataset.joinroom, false);
});
 $("#mpLeave").addEventListener("click", () => mpTeardown(true));
 $("#mpGamePick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mpgame]");
  if (!b) return;
  mp.chosen = b.dataset.mpgame;
  $$("#mpGamePick .filter-btn").forEach(x => x.classList.toggle("active", x === b));
  renderRoomUI();
});
 $("#mpStart").addEventListener("click", () => { if (mp.chosen) startMpGame(mp.chosen); });

/* ----- MP game: Tic-Tac-Toe ----- */
let ttt = null;
function renderMpGame() {
  const stage = $("#mpStage");
  if (!stage) return;
  if (mp.game === "ttt") return mpTTTInit(stage);
  if (mp.game === "rps") return mpRPSInit(stage);
  if (mp.game === "reaction") return mpReactionInit(stage);
  if (mp.game === "bluelock") return mpBLInit(stage);
}
function mpFrame(title, inner) {
  return `<div class="panel"><div class="setting-name" style="text-align:center;font-size:15px;margin-bottom:4px">${title}</div>
    <div class="mp-status" id="mpStatus"></div>${inner}
    <p class="game-status" style="text-align:center;margin-top:10px">You: <b>${escapeHTML(mp.name)}</b>${mp.oppName ? ` · Opponent: <b>${escapeHTML(mp.oppName)}</b>` : ""}</p></div>`;
}
function mpTTTInit(stage) {
  ttt = { b:Array(9).fill(""), turn:"X", done:false, my:mp.host ? "X" : "O", line:null };
  stage.innerHTML = mpFrame("❌ Tic-Tac-Toe Duel — you are <b>" + ttt.my + "</b>", `
    <div class="mp-ttt" id="mpTTT"></div>
    <div class="game-controls hidden" id="mpAgain"><button class="btn btn-primary" id="mpEndBtn">Back to lobby ↩</button></div>`);
  mpTTTDraw();
  $("#mpEndBtn").addEventListener("click", () => { if (mp.host) { sendRaw("end"); endMpGame(); } });
}
function mpTTTDraw() {
  const st = $("#mpStatus");
  const myTurn = ttt.turn === ttt.my && !ttt.done;
  st.innerHTML = ttt.done ? (ttt.msg || "") : myTurn ? "Your turn — you are " + ttt.my : "Waiting for " + escapeHTML(mp.oppName || "opponent") + "…";
  $("#mpTTT").innerHTML = ttt.b.map((v, i) =>
    `<button class="board-cell${ttt.line?.includes(i) ? " win-cell" : ""}" data-i="${i}" ${v || ttt.done || !myTurn ? "disabled" : ""}>${v}</button>`).join("");
}
function mpTTTLine(bd) {
  const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const l of L) { const [x,y,z] = l; if (bd[x] && bd[x] === bd[y] && bd[x] === bd[z]) return { p:bd[x], line:l }; }
  return bd.every(Boolean) ? { p:"draw", line:[] } : null;
}
function mpTTTEnd(w) {
  ttt.done = true; ttt.line = w.line || [];
  const meWon = w.p === ttt.my, draw = w.p === "draw";
  ttt.msg = draw ? "🤝 Draw!" : meWon ? `🏆 You win vs ${escapeHTML(mp.oppName)}!` : `💀 ${escapeHTML(mp.oppName)} wins!`;
  meWon ? Sound.win() : draw ? Sound.play(440, .15) : Sound.lose();
  recordScore("tictactoe", draw ? 30 : meWon ? 100 : 0, draw ? `PvP draw vs ${mp.oppName}` : meWon ? `PvP win vs ${mp.oppName}` : `PvP loss vs ${mp.oppName}`);
  if (mp.host) $("#mpAgain").classList.remove("hidden");
  mpTTTDraw();
}
function mpTTTClick(i) {
  if (ttt.done || ttt.b[i] || ttt.turn !== ttt.my) return;
  ttt.b[i] = ttt.my; Sound.play(520, .06);
  sendRaw("ttt", { i });
  const w = mpTTTLine(ttt.b);
  if (w) return mpTTTEnd(w);
  ttt.turn = ttt.turn === "X" ? "O" : "X";
  mpTTTDraw();
}
function mpTTTRemote(i) {
  if (!ttt || ttt.done || ttt.b[i]) return;
  ttt.b[i] = ttt.my === "X" ? "O" : "X"; Sound.play(390, .06);
  const w = mpTTTLine(ttt.b);
  if (w) return mpTTTEnd(w);
  ttt.turn = ttt.my;
  mpTTTDraw();
}
document.addEventListener("click", (e) => {
  if (mp.game !== "ttt") return;
  const c = e.target.closest("#mpTTT [data-i]");
  if (c) mpTTTClick(Number(c.dataset.i));
});

/* ----- MP game: RPS ----- */
function mpRPSInit(stage) {
  mpPicks = {};
  stage.innerHTML = mpFrame("✊ RPS Duel — best of 5", `
    <div class="mp-bigscore">YOU <b id="mpRPSme">0</b><span>—</span><b id="mpRPSopp">0</b> ${escapeHTML(mp.oppName)}</div>
    <div class="mp-picks">
      <button class="mp-pick" data-rpsm="rock">✊</button>
      <button class="mp-pick" data-rpsm="paper">✋</button>
      <button class="mp-pick" data-rpsm="scissors">✌</button>
    </div>
    <div class="mp-reveal" id="mpRPSRev"></div>
    <div class="game-controls hidden" id="mpAgain"><button class="btn btn-primary" id="mpEndBtn">Back to lobby ↩</button></div>`);
  $("#mpStatus").textContent = "Round " + mpRound + " of 5 — pick your move!";
  $("#mpEndBtn").addEventListener("click", () => { if (mp.host) { sendRaw("end"); endMpGame(); } });
}
function mpRPSResolve() {
  if (mp.game !== "rps" || !mpPicks.host || !mpPicks.guest) return;
  const h = mpPicks.host, g = mpPicks.guest;
  const beats = (a, b) => (a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
  const mine = mp.host ? h : g, theirs = mp.host ? g : h;
  const emoji = { rock:"✊", paper:"✋", scissors:"✌" };
  $("#mpRPSRev").innerHTML = `<span>${emoji[mine]}</span><small style="font-size:14px;align-self:center">vs</small><span>${emoji[theirs]}</span>`;
  if (mine === theirs) { $("#mpStatus").textContent = "Draw this round!"; Sound.play(440, .1); }
  else if (beats(mine, theirs)) { mpMine++; Sound.win(); $("#mpStatus").textContent = "You win the round!"; }
  else { mpOpp++; Sound.lose(); $("#mpStatus").textContent = "They win the round!"; }
  $("#mpRPSme").textContent = mpMine; $("#mpRPSopp").textContent = mpOpp;
  mpPicks = {};
  mpRound++;
  if (mpRound > 5) {
    const meWon = mpMine > mpOpp, draw = mpMine === mpOpp;
    $("#mpStatus").innerHTML = draw ? "🤝 Match drawn!" : meWon ? `🏆 You win the match ${mpMine}-${mpOpp}!` : `💀 They win ${mpOpp}-${mpMine}.`;
    recordScore("rps", meWon ? 80 : draw ? 40 : 20, `PvP ${mpMine}-${mpOpp} vs ${mp.oppName}`);
    if (mp.host) $("#mpAgain").classList.remove("hidden");
  } else {
    later(() => {
      if (mp.game !== "rps") return;
      $("#mpRPSRev").innerHTML = "";
      $("#mpStatus").textContent = "Round " + mpRound + " of 5 — pick your move!";
    }, 1300);
  }
}
document.addEventListener("click", (e) => {
  if (mp.game !== "rps") return;
  const b = e.target.closest("[data-rpsm]");
  if (!b || mpPicks[mp.host ? "host" : "guest"]) return;
  sendRaw("rps", { pick: b.dataset.rpsm, host: mp.host });
  mpPicks[mp.host ? "host" : "guest"] = b.dataset.rpsm;
  $("#mpStatus").textContent = "Locked in! Waiting for " + escapeHTML(mp.oppName) + "…";
  mpRPSResolve();
});

/* ----- MP game: Reaction Duel ----- */
function mpReactionInit(stage) {
  mpPicks = {};
  stage.innerHTML = mpFrame("⚡ Reaction Duel — 3 rounds, lowest ms wins", `
    <div class="mp-bigscore">YOU <b id="mpRTme">0</b><span>—</span><b id="mpRTopp">0</b> ${escapeHTML(mp.oppName)}</div>
    <div class="game-controls"><button class="btn btn-primary mp-go-btn" id="mpGoBtn">${mp.host ? "Start the round ⚡" : "Waiting for host…"}</button></div>
    <p class="game-result" id="mpRTResult" aria-live="polite"></p>
    <div class="game-controls hidden" id="mpAgain"><button class="btn btn-primary" id="mpEndBtn">Back to lobby ↩</button></div>`);
  if (!mp.host) $("#mpGoBtn").disabled = true;
  $("#mpGoBtn").addEventListener("click", () => {
    if (!mp.host) return;
    $("#mpGoBtn").disabled = true;
    $("#mpGoBtn").textContent = "Get ready…";
    later(() => { if (mp.game === "reaction") sendRaw("go", {}); }, rand(1500, 4000));
  });
  $("#mpEndBtn").addEventListener("click", () => { if (mp.host) { sendRaw("end"); endMpGame(); } });
  $("#mpStatus").textContent = "Click the big button the instant it flashes GO!";
}
function mpReactionShowGo() {
  const btn = $("#mpGoBtn");
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = "GO! CLICK!";
  btn.style.background = "linear-gradient(115deg,#4ade80,#22d3ee)";
  Sound.play(880, .1);
  $("#mpStatus").textContent = "NOW! Click!";
  btn.onclick = () => {
    const ms = Math.max(1, Math.round(performance.now() - mpGoAt));
    btn.disabled = true; btn.textContent = `${ms} ms — sent`;
    sendRaw("ms", { ms, host: mp.host });
    mpPicks[mp.host ? "host" : "guest"] = ms;
    mpReactionResolve();
  };
}
function mpReactionResolve() {
  if (mp.game !== "reaction" || mpPicks.host === undefined || mpPicks.guest === undefined) return;
  const h = mpPicks.host, g = mpPicks.guest;
  const mine = mp.host ? h : g, theirs = mp.host ? g : h;
  let pts;
  if (mine < theirs) { mpMine++; pts = 40; $("#mpRTResult").textContent = `You reacted in ${mine} ms vs ${theirs} ms — round won! +40 SI base`; Sound.win(); }
  else if (mine > theirs) { mpOpp++; pts = 10; $("#mpRTResult").textContent = `${theirs} ms vs your ${mine} ms — they were faster. +10 SI base`; Sound.lose(); }
  else { pts = 20; $("#mpRTResult").textContent = "Perfect tie! +20 SI base"; Sound.play(440, .15); }
  $("#mpRTme").textContent = mpMine; $("#mpRTopp").textContent = mpOpp;
  recordScore("reaction", pts, `Duel ${mine}ms vs ${mp.oppName} (${theirs}ms)`);
  mpPicks = {};
  const btn = $("#mpGoBtn");
  btn.style.background = ""; btn.textContent = "Next round ▸"; btn.disabled = !mp.host;
  btn.onclick = () => { if (!mp.host) return; btn.disabled = true; btn.textContent = "Get ready…"; later(() => { if (mp.game === "reaction") sendRaw("go", {}); }, rand(1500, 4000)); };
}

/* ----- MP game: Blue Lock Penalty Duel ----- */
function mpBLInit(stage) {
  mpPicks = {};
  stage.innerHTML = mpFrame("⚽ Penalty Duel vs " + escapeHTML(mp.oppName) + " — 5 rounds, roles swap", `
    <div class="mp-bigscore">YOU <b id="mpBLme">0</b><span>—</span><b id="mpBLopp">0</b> ${escapeHTML(mp.oppName)}</div>
    <div id="mpBLBody"></div>
    <p class="game-result" id="mpBLResult" aria-live="polite"></p>
    <div class="game-controls hidden" id="mpAgain"><button class="btn btn-primary" id="mpEndBtn">Back to lobby ↩</button></div>`);
  mpBLRound();
  $("#mpEndBtn").addEventListener("click", () => { if (mp.host) { sendRaw("end"); endMpGame(); } });
}
function mpBLRound() {
  mpPicks = {};
  const attackerIsHost = mpRound % 2 === 1;
  const iAttack = attackerIsHost === mp.host;
  $("#mpStatus").innerHTML = `Round ${mpRound}/5 — <b>${iAttack ? "you SHOOT" : "you DEFEND"}</b>`;
  const body = $("#mpBLBody");
  if (iAttack) {
    body.innerHTML = `<p class="game-status" style="text-align:center">Pick a corner, then stop the meter in the green.</p>
      <div class="zone-row">${["left","centre","right"].map(z => `<button class="zone-btn" data-blzone="${z}">${z.toUpperCase()}</button>`).join("")}</div>
      <div class="meter hidden" id="blMeter"><span class="m-green" id="mGreen"></span><span class="m-needle" id="mNeedle" style="left:0%"></span></div>
      <div class="game-controls hidden" id="mStopWrap"><button class="btn btn-primary" id="mStop">⚡ STRIKE!</button></div>`;
    body.querySelectorAll("[data-blzone]").forEach(b => b.addEventListener("click", () => {
      body.querySelectorAll("[data-blzone]").forEach(x => (x.disabled = true));
      const meter = $("#blMeter"); meter.classList.remove("hidden");
      $("#mStopWrap").classList.remove("hidden");
      const g = $("#mGreen");
      g.style.left = "58%"; g.style.width = "28%";
      let pos = 0, dir = 1, raf = 0;
      (function step() {
        if (mp.game !== "bluelock") return cancelAnimationFrame(raf);
        pos += dir * 1.05;
        if (pos >= 100) { pos = 100; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; }
        $("#mNeedle").style.left = pos + "%";
        raf = requestAnimationFrame(step);
      })();
      $("#mStop").addEventListener("click", () => {
        cancelAnimationFrame(raf);
        const perfect = Math.abs(pos - 72) <= 14;
        $("#mStopWrap").classList.add("hidden");
        $("#mpStatus").textContent = "Shot taken — waiting for the keeper…";
        sendRaw("atk", { zone: b.dataset.blzone, perfect, host: mp.host });
        mpPicks.atk = { zone: b.dataset.blzone, perfect, host: mp.host };
        mpBLResolve();
      }, { once:true });
    }));
  } else {
    body.innerHTML = `<p class="game-status" style="text-align:center">${escapeHTML(mp.oppName)} shoots — pick your dive!</p>
      <div class="zone-row">${["left","centre","right"].map(z => `<button class="zone-btn" data-bldive="${z}">${z.toUpperCase()}</button>`).join("")}</div>`;
    body.querySelectorAll("[data-bldive]").forEach(b => b.addEventListener("click", () => {
      body.querySelectorAll("[data-bldive]").forEach(x => (x.disabled = true));
      $("#mpStatus").textContent = "Dive locked — waiting for the shot…";
      sendRaw("dive", { zone: b.dataset.bldive, host: mp.host });
      mpPicks.dive = { zone: b.dataset.bldive, host: mp.host };
      mpBLResolve();
    }, { once:true }));
  }
}
function mpBLResolve() {
  if (mp.game !== "bluelock" || !mpPicks.atk || !mpPicks.dive) return;
  const { atk, dive } = mpPicks;
  const iWasAttacker = atk.host === mp.host;
  const goal = atk.perfect && atk.zone !== dive.zone;
  const L = { left:"⬅ LEFT", centre:"⬆ CENTRE", right:"RIGHT ➡" };
  const res = $("#mpBLResult");
  if (goal) {
    if (iWasAttacker) { mpMine++; res.textContent = `⚽ GOAL! Your perfect ${L[atk.zone]} beat their dive. +60 SI base`; recordScore("bluelock", 60, `PvP goal vs ${mp.oppName}`); }
    else { mpOpp++; res.textContent = `💀 They scored past your ${L[dive.zone]} dive.`; recordScore("bluelock", 0, `Conceded vs ${mp.oppName}`); }
    Sound.win();
  } else {
    if (iWasAttacker) { res.textContent = atk.perfect ? `🧤 SAVED! They read your ${L[atk.zone]}.` : `😬 Off target!`; recordScore("bluelock", 0, `Missed vs ${mp.oppName}`); }
    else { mpMine++; res.textContent = `🧤 WHAT A SAVE! You read their ${L[atk.zone]} shot. +45 SI base`; recordScore("bluelock", 45, `Save vs ${mp.oppName}`); }
    Sound.play(goal ? 660 : 300, .12);
  }
  $("#mpBLme").textContent = mpMine; $("#mpBLopp").textContent = mpOpp;
  mpPicks = {};
  later(() => {
    if (mp.game !== "bluelock") return;
    if (mpRound >= 5) {
      const meWon = mpMine > mpOpp, draw = mpMine === mpOpp;
      $("#mpBLResult").innerHTML = draw ? "🤝 Full time: draw!" : meWon ? `🏆 Full time: you win ${mpMine}-${mpOpp}! +100 SI base` : `💀 Full time: they win ${mpOpp}-${mpMine}.`;
      recordScore("bluelock", meWon ? 100 : draw ? 40 : 0, `PvP ${mpMine}-${mpOpp} vs ${mp.oppName}`);
      if (mp.host) $("#mpAgain").classList.remove("hidden");
    } else { mpRound++; mpBLRound(); }
  }, 1500);
}

/* ---------- Navigation ---------- */
function goPage(name) {
  if (!PAGE_LABELS[name]) return;
  if (name === "admin" && sessionStorage.getItem("sgAdmin") !== "1") return goPage("home");
  if (currentPage === "multi" && name !== "multi" && mp.code) { sendRaw("leave", { name: mp.name }); mpTeardown(false); }
  if (mpTimer) { clearInterval(mpTimer); mpTimer = null; }
  currentPage = name;
  $$(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + name));
  $$(".nav-btn[data-page]").forEach(b => {
    const on = b.dataset.page === name;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  $("#breadcrumb").textContent = PAGE_LABELS[name];
  if (name === "games") renderGames();
  if (name === "profile") renderProfile();
  if (name === "shop") renderShop();
  if (name === "admin") renderAdmin();
  if (name === "leaderboard") renderLeaderboard();
  if (name === "multi") {
    renderMultiPage();
    mpTimer = setInterval(() => { if (currentPage === "multi" && !mp.code) refreshServerList(); }, 6000);
  }
  if (window.matchMedia("(max-width:720px)").matches) setDrawer(false);
  window.scrollTo({ top: 0, behavior: settings.motion ? "smooth" : "auto" });
}
document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-page]");
  if (p) { e.preventDefault(); goPage(p.dataset.page); return; }
  const play = e.target.closest("[data-play]");
  if (play) openGame(play.dataset.play);
});
function setCollapsed(c) { document.body.classList.toggle("collapsed", c); $("#collapseBtn").textContent = c ? "›" : "‹"; write("sgCollapsed", c); }
 $("#collapseBtn").addEventListener("click", () => setCollapsed(!document.body.classList.contains("collapsed")));
if (read("sgCollapsed", false)) setCollapsed(true);
function setDrawer(open) {
  $("#sidebar").classList.toggle("open", open);
  $("#sidebarBackdrop").classList.toggle("hidden", !open);
  $("#menuBtn").setAttribute("aria-expanded", String(open));
}
 $("#menuBtn").addEventListener("click", () => setDrawer(!$("#sidebar").classList.contains("open")));
 $("#sidebarBackdrop").addEventListener("click", () => setDrawer(false));

/* ---------- Cards / search ---------- */
function cardHTML(g, i) {
  const rare = g.id === "bluelock" ? "S TIER" : (["geometry", "flappy", "merge2048"].includes(g.id) ? "HOT" : "");
  return `<article class="game-card" style="animation-delay:${i * 40}ms">
    <div class="card-art" style="--art1:${g.a};--art2:${g.b};--glow:${g.glow}">
      <span class="card-float" style="top:16%;left:12%">${g.d1}</span>
      <span class="card-float" style="bottom:18%;right:14%;animation-delay:${(i % 3) * .8}s">${g.d2}</span>
      <span class="card-tag">${escapeHTML(g.tag)}</span>
      ${rare ? `<span class="card-rarity">${rare}</span>` : ""}
      <span class="card-symbol">${escapeHTML(g.symbol)}</span>
      <span class="card-number">${String(i + 1).padStart(2, "0")}</span>
      <span class="card-shine"></span>
    </div>
    <div class="card-body">
      <div class="card-title-line"><h3>${escapeHTML(g.title)}</h3><span class="category-pill">${escapeHTML(g.category)}</span></div>
      <p>${escapeHTML(g.description)}</p>
      <div class="card-footer">
        <div><span class="best-label">PERSONAL BEST</span><span class="best-score">${bestScore(g.id).toLocaleString()}</span></div>
        <button class="play-btn" data-play="${g.id}">PLAY ↗</button>
      </div>
    </div></article>`;
}
function renderGames() {
  const q = searchText.trim().toLowerCase();
  const list = GAMES.filter(g => (currentFilter === "all" || g.category === currentFilter) &&
    (!q || `${g.title} ${g.description} ${g.category} ${g.tag}`.toLowerCase().includes(q)));
  $("#allGames").innerHTML = list.map(cardHTML).join("");
  $("#noGames").classList.toggle("hidden", list.length > 0);
  $$(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === currentFilter));
}
function renderFeatured() {
  $("#featuredGrid").innerHTML = GAMES.filter(g => ["bluelock", "merge2048", "flappy"].includes(g.id)).map(cardHTML).join("");
}
 $("#searchInput").addEventListener("input", (e) => {
  searchText = e.target.value;
  if (searchText && currentPage !== "games") goPage("games"); else renderGames();
});
 $$(".filter-btn").forEach(b => b.addEventListener("click", () => { currentFilter = b.dataset.filter; renderGames(); }));
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); $("#searchInput").focus(); }
});

/* ---------- Coins / scores ---------- */
function recordScore(id, points, result) {
  const game = GAMES.find(g => g.id === id); if (!game) return;
  const pts = Math.max(0, Math.round(Number(points) || 0));
  const isPB = pts > bestScore(id);
  let mult = hasPass("double") ? 2 : 1, surge = false;
  if (pts > 0 && scores.inv.boost > 0) { scores.inv.boost--; mult *= 2; surge = true; }
  const earned = pts * mult;
  scores.played = (scores.played || 0) + 1;
  scores.best[id] = Math.max(bestScore(id), pts);
  scores.coins = (scores.coins || 0) + earned;
  scores.history.unshift({ id, title: game.title, points: pts, coins: earned, result: String(result || "Round completed"), date: Date.now() });
  scores.history = scores.history.slice(0, 30);
  saveScores(); pushOnline(); renderAll();
  if (isPB && pts > 0) Sound.win(); else Sound.play(600, .06);
  toast(`${game.title}: +${earned.toLocaleString()} SI Coins${isPB && pts > 0 ? " · 🏆 NEW BEST!" : ""}${surge ? " (Coin Surge used)" : ""}`);
}
function activityHTML() {
  if (!scores.history.length)
    return `<div class="activity-row"><div class="activity-icon">✦</div><div class="activity-details"><strong>No games played yet</strong><span>Pick a game to start earning SI Coins.</span></div></div>`;
  return scores.history.slice(0, 6).map(it =>
    `<div class="activity-row"><div class="activity-icon">${escapeHTML(GAME_SYMBOLS[it.id] || "✦")}</div>
     <div class="activity-details"><strong>${escapeHTML(it.title)}</strong><span>${escapeHTML(it.result)} · ${new Date(it.date).toLocaleDateString()}</span></div>
     <div class="activity-score">+${Number(it.coins ?? it.points) || 0} SI</div></div>`).join("");
}
function renderAll() {
  renderFeatured(); renderGames(); renderShop();
  $("#statCoins").innerHTML = `${coin(20)} ${(scores.coins || 0).toLocaleString()}`;
  $("#statBest").textContent = overallBest().toLocaleString();
  $("#statGames").textContent = GAMES.length;
  $("#topCoins").innerHTML = `${coin(17)} ${(scores.coins || 0).toLocaleString()} SI`;
  $("#homeActivity").innerHTML = activityHTML();
  renderProfile(); renderLeaderboard();
}
function renderProfile() {
  const u = activeUser();
  $("#profileName").textContent = u ? u.name : "Guest Player";
  $("#profileEmail").textContent = u ? `${u.email || "local profile"} · ${u.provider === "google" ? "Google sign-in" : u.provider === "demo" ? "demo profile" : "email account"}` : "You are playing as a guest.";
  $("#profileCoins").innerHTML = `${coin(20)} ${(scores.coins || 0).toLocaleString()}`;
  $("#profileBest").textContent = overallBest().toLocaleString();
  $("#profilePlayed").textContent = scores.played || 0;
  $("#profileActivity").innerHTML = activityHTML();
  ["topAvatar", "profileAvatar", "editorAvatar", "sidebarAvatar"].forEach(id => paintAvatar(document.getElementById(id)));
  $("#sidebarPlayerName").textContent = u ? u.name : "Guest Player";
  $("#sidebarPlayerStatus").textContent = u ? `${(scores.coins || 0).toLocaleString()} SI Coins · ${u.name}'s card` : "Earn SI Coins, buy passes, climb the board.";
}
async function renderLeaderboard() {
  const reg = read("sgAccounts", {});
  let rows = [
    { name:"NovaPlayer", score:1260, status:"TOP PLAYER" },
    { name:"PixelFox",   score:1010, status:"ON A STREAK" },
    { name:"NeonWolf",   score:875,  status:"RISING STAR" },
    { name:"ByteKnight", score:740,  status:"PLAYER" }
  ];
  let online = false;
  if (sb && sessionUser) {
    try {
      const { data, error } = await sb.from("scores").select("name,total_best,coins").order("total_best", { ascending: false }).limit(12);
      if (!error && data && data.length) {
        online = true;
        rows = data.map(d => ({ name: d.name || "Player", score: d.total_best || 0, status: `${(d.coins || 0).toLocaleString()} SI` }));
      }
    } catch {}
  }
  const me = activeUser();
  if (me && overallBest() > 0) rows.push({ name: me.name, score: overallBest(), me: true, vip: reg[me.id]?.vip, status: "YOU" });
  rows.sort((a, b) => b.score - a.score);
  $("#lbSub").textContent = online ? "LIVE global leaderboard — synced via Supabase." : "Example players — sign in with Supabase keys added to go live.";
  $("#lbNote").textContent = online ? "Scores upload automatically when you finish a game." : "Named entries are examples until online sync is configured.";
  $("#leaderRows").innerHTML = rows.map((p, i) =>
    `<tr class="${p.me ? "me-row" : ""}">
      <td class="rank-tag">#${i + 1}</td>
      <td><div class="player-cell"><span class="mini-avatar">${p.me ? miniAvatarHTML() : escapeHTML(p.name.charAt(0).toUpperCase())}</span><strong>${escapeHTML(p.name)}</strong>${p.vip ? ' <span class="owned-pill">VIP</span>' : ""}</div></td>
      <td><strong>${p.score.toLocaleString()}</strong></td>
      <td>${p.me ? '<span class="status-pill">YOU</span>' : escapeHTML(p.status || "")}</td>
    </tr>`).join("");
}

/* ---------- Shop ---------- */
function renderShop() {
  $("#shopCoins").innerHTML = `${coin(20)} ${(scores.coins || 0).toLocaleString()}`;
  $("#shopPasses").textContent = (scores.passes || []).length;
  $("#shopPlayed").textContent = scores.played || 0;
  const item = (it, kind) => {
    const ownedPass = kind === "pass" && hasPass(it.id);
    const count = kind === "consumable" ? (scores.inv[it.id] || 0) : 0;
    return `<div class="shop-item">
      <span class="si-icon">${it.icon}</span>
      <span class="si-name">${escapeHTML(it.name)}</span>
      <span class="si-desc">${escapeHTML(it.desc)}</span>
      <span class="si-foot">
        ${ownedPass ? '<span class="owned-pill">OWNED</span>' : count > 0 ? `<span class="count-pill">×${count}</span>` : `<span class="price">${coin(14)} ${it.price}</span>`}
        <button class="btn btn-small ${ownedPass ? "" : "btn-primary"}" data-buy="${it.id}" data-kind="${kind}" ${ownedPass ? "disabled" : ""}>${ownedPass ? "Active" : "Buy"}</button>
      </span></div>`;
  };
  $("#shopGrid").innerHTML =
    `<h3 style="grid-column:1/-1;margin:4px 0 0">Game passes <small style="color:var(--muted);font-weight:600">(permanent)</small></h3>` +
    SHOP.passes.map(it => item(it, "pass")).join("") +
    `<h3 style="grid-column:1/-1;margin:8px 0 0">Consumables <small style="color:var(--muted);font-weight:600">(used automatically)</small></h3>` +
    SHOP.consumables.map(it => item(it, "consumable")).join("");
}
 $("#shopGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-buy]"); if (!b) return;
  const kind = b.dataset.kind;
  const it = (kind === "pass" ? SHOP.passes : SHOP.consumables).find(x => x.id === b.dataset.buy);
  if (!it) return;
  if (kind === "pass" && hasPass(it.id)) return;
  if ((scores.coins || 0) < it.price) { Sound.lose(); return toast(`Not enough SI Coins — you need ${it.price}.`); }
  scores.coins -= it.price;
  if (kind === "pass") { scores.passes.push(it.id); toast(`${it.icon} ${it.name} unlocked — permanent!`); }
  else { scores.inv[it.id] = (scores.inv[it.id] || 0) + 1; toast(`${it.icon} ${it.name} added to your inventory.`); }
  Sound.win(); saveScores(); pushOnline(); renderAll();
});

/* ---------- Settings / themes ---------- */
const mq = window.matchMedia("(prefers-color-scheme: dark)");
mq.addEventListener("change", () => { if (settings.mode === "system") applySettings(); });
function applySettings() {
  const light = settings.mode === "light" || (settings.mode === "system" && !mq.matches);
  document.body.classList.toggle("light", light);
  document.body.classList.toggle("compact", settings.compact);
  document.body.classList.toggle("no-motion", !settings.motion);
  const a = ACCENTS[settings.accent] || ACCENTS.purple;
  document.documentElement.style.setProperty("--accent", a[0]);
  document.documentElement.style.setProperty("--accent-rgb", a[1]);
  document.documentElement.style.setProperty("--accent2", settings.accent === "cyan" ? "#a78bfa" : "#22d3ee");
  $$(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === settings.mode));
  $("#compactToggle").checked = settings.compact;
  $("#motionToggle").checked = settings.motion;
  $("#soundToggle").checked = settings.sound;
  $$(".accent-choice").forEach(b => b.classList.toggle("active", b.dataset.color === settings.accent));
}
function saveSettings() { write("sgSettings", settings); applySettings(); }
 $$(".seg-btn").forEach(b => b.addEventListener("click", () => { settings.mode = b.dataset.mode; saveSettings(); }));
 $("#compactToggle").addEventListener("change", (e) => { settings.compact = e.target.checked; saveSettings(); });
 $("#motionToggle").addEventListener("change", (e) => { settings.motion = e.target.checked; saveSettings(); });
 $("#soundToggle").addEventListener("change", (e) => { settings.sound = e.target.checked; saveSettings(); if (settings.sound) Sound.play(660, .1); });
 $("#testSound").addEventListener("click", () => Sound.win());
 $$(".accent-choice").forEach(b => b.addEventListener("click", () => { settings.accent = b.dataset.color; saveSettings(); toast("Accent colour updated"); }));
 $("#resetAppearance").addEventListener("click", () => {
  settings = { mode:"dark", accent:"purple", compact:false, motion:true, sound:true };
  saveSettings(); toast("Default appearance restored");
});
 $("#resetScores").addEventListener("click", () => {
  if (!confirm("Reset this profile's SI Coins, passes and scores?")) return;
  scores = { played:0, best:{}, history:[], coins:0, passes:[], inv:{ boost:0, life:0 } };
  saveScores(); pushOnline(); renderAll(); toast("Progress reset");
});
 $("#exportBtn").addEventListener("click", () => {
  const data = JSON.stringify({ app:"solli-games", version:6, scores, settings, user: activeUser() }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "solli-games-progress.json"; a.click();
  URL.revokeObjectURL(a.href);
  toast("Progress exported ⬇");
});
 $("#importBtn").addEventListener("click", () => $("#importInput").click());
 $("#importInput").addEventListener("change", (e) => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (d.scores) { scores = d.scores; saveScores(); }
      if (d.settings) { settings = Object.assign(settings, d.settings); saveSettings(); }
      if (d.user && !sessionUser) { user = d.user; persistUser(); }
      loadScores(); applySettings(); updateAccountUI(); renderAll();
      toast("Progress imported ✔");
    } catch { toast("That file could not be read."); }
  };
  reader.readAsText(file);
});

/* ---------- Solo game registry ---------- */
const RUNNERS = { bluelock:gameBlueLock, geometry:gameGeometry, snake:gameSnake, simon:gameSimon, memory:gameMemory, reaction:gameReaction, number:gameNumber, math:gameMath, rps:gameRPS, tictactoe:gameTicTacToe, scramble:gameScramble, merge2048:game2048, flappy:gameFlappy, mole:gameMole };
function openGame(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g || !RUNNERS[id]) return;
  clearTimers();
  currentGame = id;
  $("#modalTitle").textContent = g.title;
  $("#modalIntro").textContent = g.description;
  $("#gameMount").innerHTML = "";
  openModal("gameModal");
  RUNNERS[id]();
}

/* ---------- Blue Lock: Striker Duel (solo) ---------- */
const BL_CARDS = [
  { id:"isagi",   name:"Yoichi Isagi",   role:"Spatial Vision",   icon:"◎", rarity:"A", win:14, speed:1.0,  goal:60, save:40, color:"#3b82f6", desc:"Balanced with a wide strike zone." },
  { id:"bachira", name:"Meguru Bachira", role:"Dribble Chaos",    icon:"✦", rarity:"S", win:18, speed:1.18, goal:60, save:40, color:"#a78bfa", desc:"Fast meter, biggest zone. Wild." },
  { id:"nagi",    name:"Seishiro Nagi",  role:"Perfect Trap",     icon:"◇", rarity:"A", win:10, speed:0.78, goal:60, save:40, color:"#22d3ee", desc:"Slow, precise meter for calm aimers." },
  { id:"rin",     name:"Rin Itoshi",     role:"Complete Striker", icon:"♜", rarity:"S", win:10, speed:1.0,  goal:85, save:45, color:"#fb7185", desc:"Tight zone, huge rewards. Elite." },
  { id:"chigiri", name:"Hyoma Chigiri",  role:"Blazing Speed",    icon:"➤", rarity:"A", win:12, speed:1.35, goal:65, save:38, color:"#34d399", desc:"Blistering meter speed. Blink and miss." },
  { id:"kunigami",name:"Rensuke Kunigami",role:"Power Shot",      icon:"✹", rarity:"B", win:12, speed:0.95, goal:75, save:42, color:"#f59e0b", desc:"Heavy shots with a big payout." }
];
const BL_RIVAL = ["Team Z", "Barou XI", "The Ubers", "PxG"];
const BL_MULT = { S:1.25, A:1.0, B:0.9 };
function gameBlueLock() {
  let card = null, round = 1, goals = 0, saves = 0, conceded = 0, earned = 0;
  let phase = "select", raf = 0, pos = 0, mdir = 1, hist = [], streak = 0, rival = BL_RIVAL[rand(0, 3)];
  const mount = $("#gameMount");
  mount.innerHTML = `<div class="bl-stage">
    <div class="bl-top"><span id="blRound">CHOOSE YOUR STRIKER</span><span id="blFlowWrap"></span><span id="blScore"></span></div>
    <div class="bl-scorebar" id="blBar"></div>
    <div id="blStage"></div><p class="bl-log" id="blLog">Blue Lock inspired fan game — pick a striker to begin.</p></div>`;
  gameCleanup = () => cancelAnimationFrame(raf);
  const stage = () => $("#blStage"), log = () => $("#blLog"), scoreEl = () => $("#blScore"), roundEl = () => $("#blRound"), bar = () => $("#blBar"), flowEl = () => $("#blFlowWrap");
  const flowOn = () => streak >= 3;
  function refreshHUD() {
    scoreEl().innerHTML = `GOALS ${goals} · SAVES ${saves}`;
    bar().innerHTML = `<span>YOU</span><b>${goals}</b><span class="vs">VS</span><b>${conceded}</b><span>${escapeHTML(rival)}</span>`;
    flowEl().innerHTML = flowOn() ? '<span class="bl-flow">FLOW STATE ×1.5</span>' : (streak > 0 ? `<small style="color:#94a3b8">streak ${streak}/3</small>` : "");
  }
  function selectScreen() {
    roundEl().textContent = "CHOOSE YOUR STRIKER"; refreshHUD();
    const saved = read("sgBLCard", null);
    stage().innerHTML = `<div class="game-choice-list" style="grid-template-columns:repeat(3,1fr)">${BL_CARDS.map(c =>
      `<button class="game-choice${saved === c.id ? " selected" : ""}" data-bl="${c.id}"><span class="choice-emoji" style="color:${c.color}">${c.icon}</span>${c.name}<span class="rarity-mini">${c.rarity} TIER</span><br><small style="color:var(--muted);font-weight:600">${c.desc}</small></button>`).join("")}</div>`;
    stage().querySelectorAll("[data-bl]").forEach(b => b.addEventListener("click", () => {
      card = BL_CARDS.find(c => c.id === b.dataset.bl);
      write("sgBLCard", card.id);
      round = 1; goals = 0; saves = 0; conceded = 0; earned = 0; hist = []; streak = 0;
      log().textContent = `${card.name} locked in (${card.rarity} tier, ×${BL_MULT[card.rarity]} coins). 5 rounds vs ${rival}.`;
      refreshHUD(); shootPhase();
    }));
  }
  function shootPhase() {
    phase = "pick";
    roundEl().textContent = `ROUND ${round}/5 · ${card.name.toUpperCase()} — SHOOT`;
    stage().innerHTML = `<p class="game-status" style="text-align:center">Pick your corner, then stop the meter in the green zone.</p>
      <div class="zone-row">${["left","centre","right"].map(z => `<button class="zone-btn" data-zone="${z}">${z.toUpperCase()}</button>`).join("")}</div>
      <div class="meter hidden" id="blMeter"><span class="m-green" id="mGreen"></span><span class="m-needle" id="mNeedle" style="left:0%"></span></div>
      <div class="game-controls hidden" id="mStopWrap"><button class="btn btn-primary" id="mStop">⚡ STRIKE!</button></div>`;
    stage().querySelectorAll("[data-zone]").forEach(b => b.addEventListener("click", () => startMeter(b.dataset.zone)));
    refreshHUD();
  }
  function startMeter(zone) {
    phase = "meter";
    stage().querySelectorAll("[data-zone]").forEach(b => (b.disabled = true));
    $("#blMeter").classList.remove("hidden");
    $("#mStopWrap").classList.remove("hidden");
    const win = card.win * (flowOn() ? 1.5 : 1);
    const g = $("#mGreen");
    g.style.left = (72 - win) + "%"; g.style.width = (win * 2) + "%";
    pos = 0; mdir = 1;
    const step = () => {
      if (currentGame !== "bluelock" || phase !== "meter") return;
      pos += mdir * 0.9 * card.speed;
      if (pos >= 100) { pos = 100; mdir = -1; } if (pos <= 0) { pos = 0; mdir = 1; }
      $("#mNeedle").style.left = pos + "%";
      raf = requestAnimationFrame(step);
    };
    step();
    $("#mStop").addEventListener("click", () => {
      cancelAnimationFrame(raf); phase = "result";
      resolveShot(zone, Math.abs(pos - 72), win);
    }, { once: true });
  }
  function aiDive(myZone) {
    hist.push(myZone);
    const freq = {}; hist.forEach(z => (freq[z] = (freq[z] || 0) + 1));
    const common = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
    const readProb = Math.min(0.7, 0.4 + hist.length * 0.06);
    return Math.random() < readProb ? common : ["left", "centre", "right"][rand(0, 2)];
  }
  function resolveShot(zone, acc, win) {
    const dive = aiDive(zone);
    const L = { left:"⬅ LEFT", centre:"⬆ CENTRE", right:"RIGHT ➡" };
    const gain = Math.round(card.goal * BL_MULT[card.rarity] * (flowOn() ? 1.5 : 1));
    if (acc <= win && dive !== zone) {
      goals++; earned += gain; streak++;
      Sound.win();
      log().innerHTML = `<span class="bl-goal">GOAL! Perfect strike ${L[zone]} — keeper dove ${L[dive]}. +${gain} SI base${flowOn() ? " (FLOW ×1.5)" : ""}</span>`;
    } else if (acc <= win && dive === zone) {
      streak = 0;
      log().innerHTML = `<span class="bl-miss">SAVED! The keeper read your ${L[zone]} — he's studying your pattern.</span>`;
    } else if (acc <= win + 10) {
      streak = 0;
      log().innerHTML = `<span class="bl-miss">Weak shot — easily handled.</span>`;
    } else {
      streak = 0;
      log().innerHTML = `<span class="bl-miss">Off target! Your aim wobbled (${Math.round(acc)} off).</span>`;
    }
    refreshHUD();
    later(() => { if (currentGame !== "bluelock") return; keepPhase(); }, 1400);
  }
  function keepPhase() {
    phase = "keep";
    roundEl().textContent = `ROUND ${round}/5 · DEFEND YOUR GOAL`;
    stage().innerHTML = `<p class="game-status" style="text-align:center">${rival} shoots — pick your dive!</p>
      <div class="zone-row">${["left","centre","right"].map(z => `<button class="zone-btn" data-dive="${z}">${z.toUpperCase()}</button>`).join("")}</div>`;
    const shot = ["left", "centre", "right"][rand(0, 2)];
    const blaster = Math.random() < 0.12;
    stage().querySelectorAll("[data-dive]").forEach(b => b.addEventListener("click", () => {
      phase = "result";
      const L = { left:"⬅ LEFT", centre:"⬆ CENTRE", right:"RIGHT ➡" };
      if (blaster) { conceded++; log().innerHTML = `<span class="bl-miss">UNSTOPPABLE BLAST! Nobody saves that.</span>`; }
      else if (b.dataset.dive === shot) {
        saves++;
        const gain = Math.round(card.save * BL_MULT[card.rarity]);
        earned += gain; Sound.win();
        log().innerHTML = `<span class="bl-save">WHAT A SAVE! You read the ${L[shot]} shot. +${gain} SI base</span>`;
      } else { conceded++; log().innerHTML = `<span class="bl-miss">Goal conceded — you dove ${L[b.dataset.dive]}, shot went ${L[shot]}.</span>`; }
      refreshHUD();
      later(() => {
        if (currentGame !== "bluelock") return;
        if (round >= 5) finish();
        else { round++; shootPhase(); }
      }, 1400);
    }, { once: true }));
    refreshHUD();
  }
  function finish() {
    const win = goals > conceded, draw = goals === conceded;
    const bonus = win ? 120 : draw ? 40 : 0;
    const total = Math.round(earned) + bonus;
    log().innerHTML += `<br><b>Full time:</b> ${goals} goals · ${saves} saves · ${conceded} conceded — ${win ? "🏆 YOU WIN vs " + escapeHTML(rival) + " (+" + bonus + " bonus)" : draw ? "🤝 Draw (+" + bonus + ")" : "💀 " + escapeHTML(rival) + " wins"}`;
    stage().innerHTML = `<div class="game-controls"><button class="btn btn-primary" id="blAgain">Play again ↻</button><button class="btn" data-page="shop">Spend SI Coins ◈</button></div>`;
    roundEl().textContent = "FULL TIME";
    recordScore("bluelock", total, `${goals}G · ${saves}S · ${win ? "W" : draw ? "D" : "L"} vs ${rival} as ${card.name.split(" ").slice(-1)[0]}`);
    $("#blAgain").addEventListener("click", () => { cancelAnimationFrame(raf); gameBlueLock(); });
  }
  selectScreen();
}

/* ---------- Cipher Hunt ---------- */
function gameNumber() {
  const target = rand(1, 50); let left = 7, done = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="nStatus">The secret number is between 1 and 50. Seven attempts.</p>
    <form class="game-controls" id="nForm">
      <input class="game-input" id="nGuess" type="number" min="1" max="50" required placeholder="1–50" aria-label="Your guess">
      <button class="btn btn-primary" type="submit">Guess</button>
    </form>
    <p class="game-result" id="nResult" aria-live="polite"></p>
    <div class="game-controls"><button class="btn hidden" id="nRestart">Play again ↻</button></div>`;
  const input = $("#nGuess"), status = $("#nStatus"), result = $("#nResult");
  $("#nForm").addEventListener("submit", (e) => {
    e.preventDefault(); if (done) return;
    const g = Number(input.value);
    if (!Number.isInteger(g) || g < 1 || g > 50) { status.textContent = "Pick a whole number from 1 to 50."; return; }
    left--; input.value = "";
    if (g === target) {
      done = true;
      const pts = Math.max(10, 100 - (6 - left) * 12);
      status.textContent = "You cracked the cipher!";
      result.textContent = `Correct — it was ${target}. +${pts} SI base`;
      recordScore("number", pts, "Cracked the cipher");
      $("#nRestart").classList.remove("hidden"); return;
    }
    if (left <= 0) {
      done = true; Sound.lose();
      status.textContent = `Out of guesses — it was ${target}.`;
      result.textContent = "Better luck next round!";
      recordScore("number", 0, "Ran out of guesses");
      $("#nRestart").classList.remove("hidden"); return;
    }
    Sound.play(g < target ? 400 : 320, .05);
    status.textContent = (g < target ? "Too low!" : "Too high!") + ` ${left} attempt${left === 1 ? "" : "s"} left.`;
  });
  $("#nRestart").addEventListener("click", () => gameNumber());
  input.focus();
}

/* ---------- Mind Matrix ---------- */
function gameMemory() {
  const symbols = shuffle(["◆","●","★","▲","✦","♥","☀","✿","◆","●","★","▲","✦","♥","☀","✿"]);
  const revealed = Array(16).fill(false), matched = Array(16).fill(false);
  let open = [], moves = 0, pairs = 0, done = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="mStatus">Moves: 0 · Pairs: 0/8</p>
    <div class="game-board memory-board" id="mBoard" aria-label="Memory board"></div>
    <p class="game-result" id="mResult" aria-live="polite"></p>
    <div class="game-controls"><button class="btn" id="mRestart">Shuffle & restart ↻</button></div>`;
  const board = $("#mBoard"), status = $("#mStatus"), result = $("#mResult");
  function draw() {
    board.innerHTML = symbols.map((s, i) => {
      const show = revealed[i] || matched[i];
      return `<button class="game-tile${matched[i] ? " correct" : ""}" data-i="${i}" ${matched[i] || done ? "disabled" : ""} aria-label="${show ? escapeHTML(s) : "Hidden tile"}">${show ? escapeHTML(s) : "?"}</button>`;
    }).join("");
    status.textContent = `Moves: ${moves} · Pairs: ${pairs}/8`;
  }
  if (hasPass("peek")) {
    for (let i = 0; i < 16; i++) revealed[i] = true;
    draw(); status.textContent = "👁 Third Eye — memorise fast!";
    later(() => {
      if (currentGame !== "memory") return;
      for (let i = 0; i < 16; i++) revealed[i] = matched[i];
      draw(); status.textContent = "Moves: 0 · Pairs: 0/8";
    }, 1400);
  } else draw();
  board.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (!b || done || open.length >= 2) return;
    const i = Number(b.dataset.i);
    if (matched[i] || revealed[i]) return;
    Sound.play(500, .05);
    revealed[i] = true; open.push(i); draw();
    if (open.length < 2) return;
    moves++;
    const [a, c] = open;
    if (symbols[a] === symbols[c]) {
      matched[a] = matched[c] = true; open = []; pairs++; draw();
      if (pairs === 8) {
        done = true;
        const pts = Math.max(10, 100 - moves * 4);
        result.textContent = `All pairs found in ${moves} moves! +${pts} SI base`;
        recordScore("memory", pts, `Cleared in ${moves} moves`);
      } else result.textContent = "Nice match!";
      return;
    }
    status.textContent = "Not a pair — remember them!";
    later(() => {
      if (currentGame !== "memory") return;
      revealed[a] = revealed[c] = false; open = [];
      result.textContent = ""; draw();
    }, 750);
  });
  $("#mRestart").addEventListener("click", () => gameMemory());
}

/* ---------- Reflex Storm ---------- */
function gameReaction() {
  let phase = "idle", t = 0, id = null;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="rStatus">Wait for green, then click as fast as you can.</p>
    <div class="game-controls"><button class="btn btn-primary reaction-btn" id="rBtn">Start round ⚡</button></div>
    <p class="game-result" id="rResult" aria-live="polite"></p>`;
  const btn = $("#rBtn"), status = $("#rStatus"), result = $("#rResult");
  const paint = (bg, fg) => { btn.style.background = bg; btn.style.color = fg; };
  function start() {
    phase = "waiting"; result.textContent = "";
    status.textContent = "Wait for green… don't click early!";
    btn.textContent = "Wait for it…"; paint("#7f1d3a", "#ffe4e6");
    id = later(() => {
      if (currentGame !== "reaction" || phase !== "waiting") return;
      phase = "ready"; t = performance.now();
      Sound.play(880, .1); btn.textContent = "CLICK NOW!"; paint("#14532d", "#dcfce7");
      status.textContent = "GO GO GO!";
    }, rand(1200, 3200));
  }
  btn.addEventListener("click", () => {
    if (phase === "idle" || phase === "done" || phase === "early") return start();
    if (phase === "waiting") {
      clearTimeout(id); timers.delete(id); phase = "early"; Sound.lose();
      status.textContent = "Too early!";
      result.textContent = "Wait for the green signal, then click.";
      btn.textContent = "Try again"; paint("", ""); return;
    }
    const ms = Math.max(1, Math.round(performance.now() - t));
    const pts = Math.max(1, 1000 - ms);
    phase = "done";
    status.textContent = `Reaction time: ${ms} ms`;
    result.textContent = `+${pts} SI base`;
    btn.textContent = "Play another round"; paint("", "");
    recordScore("reaction", pts, `${ms} ms reaction`);
  });
}

/* ---------- Math Blaze ---------- */
function gameMath() {
  let n = 0, score = 0, correct = 0, answer = 0, done = false, lock = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="qProg">Question 1 of 10</p>
    <h3 class="math-prompt" id="qText"></h3>
    <form class="game-controls" id="qForm">
      <input class="game-input" id="qAns" type="number" required placeholder="Your answer" aria-label="Your answer">
      <button class="btn btn-primary" id="qGo" type="submit">Answer</button>
    </form>
    <p class="game-result" id="qFeed" aria-live="polite"></p>
    <div class="game-controls"><button class="btn hidden" id="qRestart">Play again ↻</button></div>`;
  const prompt = $("#qText"), prog = $("#qProg"), feed = $("#qFeed"), input = $("#qAns"), go = $("#qGo");
  function next() {
    n++;
    const op = rand(1, 3); let a, b;
    if (op === 1) { a = rand(2, 50); b = rand(2, 50); answer = a + b; prompt.textContent = `${a} + ${b} = ?`; }
    else if (op === 2) { a = rand(10, 60); b = rand(1, a); answer = a - b; prompt.textContent = `${a} − ${b} = ?`; }
    else { a = rand(2, 12); b = rand(2, 12); answer = a * b; prompt.textContent = `${a} × ${b} = ?`; }
    prog.textContent = `Question ${n} of 10 · Score ${score}`;
    input.value = ""; input.disabled = false; go.disabled = false; input.focus();
  }
  $("#qForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (done || lock || input.value.trim() === "") return;
    lock = true; input.disabled = true; go.disabled = true;
    if (Number(input.value) === answer) { correct++; score += 10; Sound.play(700, .06); feed.textContent = "Correct! +10"; }
    else { Sound.play(220, .12); feed.textContent = `Not quite — it was ${answer}.`; }
    if (n >= 10) later(() => {
      done = true;
      prog.textContent = `Done: ${correct}/10 correct`;
      prompt.textContent = "Challenge complete!";
      feed.textContent = `+${score} SI base`;
      $("#qRestart").classList.remove("hidden");
      recordScore("math", score, `${correct}/10 correct`);
    }, 550);
    else later(() => { if (currentGame !== "math" || done) return; lock = false; feed.textContent = ""; next(); }, 650);
  });
  $("#qRestart").addEventListener("click", () => gameMath());
  next();
}

/* ---------- RPS Showdown ---------- */
function gameRPS() {
  const opts = [{id:"rock",name:"Rock",s:"✊"},{id:"paper",name:"Paper",s:"✋"},{id:"scissors",name:"Scissors",s:"✌"}];
  let played = 0, w = 0, l = 0, d = 0, done = false;
  const beats = (a, b) => (a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
  $("#gameMount").innerHTML = `
    <p class="game-status" id="pStatus">Round 1 of 5 · Best of five!</p>
    <div class="game-choice-list">${opts.map(o => `<button class="game-choice" data-rps="${o.id}"><span class="choice-emoji">${o.s}</span>${o.name}</button>`).join("")}</div>
    <p class="game-result" id="pResult" aria-live="polite">Make your first choice.</p>
    <div class="game-controls"><button class="btn hidden" id="pRestart">Play again ↻</button></div>`;
  const status = $("#pStatus"), result = $("#pResult");
  $$("[data-rps]").forEach(btn => btn.addEventListener("click", () => {
    if (done) return;
    const mine = btn.dataset.rps, theirs = opts[rand(0, 2)].id;
    played++;
    if (mine === theirs) d++; else if (beats(mine, theirs)) w++; else l++;
    Sound.play(beats(mine, theirs) ? 660 : mine === theirs ? 440 : 240, .07);
    const nm = (x) => opts.find(o => o.id === x).name;
    result.textContent = `You: ${nm(mine)} · CPU: ${nm(theirs)} — ${mine === theirs ? "Draw!" : beats(mine, theirs) ? "You win!" : "CPU wins!"}`;
    if (played >= 5) {
      done = true;
      const pts = w * 20 + d * 5;
      status.textContent = `Final — You ${w} · CPU ${l} · Draws ${d}`;
      result.textContent += ` +${pts} SI base.`;
      $$("[data-rps]").forEach(b => (b.disabled = true));
      $("#pRestart").classList.remove("hidden");
      recordScore("rps", pts, `${w}W ${l}L ${d}D`);
    } else status.textContent = `Round ${played + 1} of 5 · W ${w} · L ${l} · D ${d}`;
  }));
  $("#pRestart").addEventListener("click", () => gameRPS());
}

/* ---------- Tic Tac Tactics ---------- */
function gameTicTacToe() {
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let mode = "cpu", diff = "hard", b = Array(9).fill(""), turn = "X", done = false, winLine = null;
  const mount = $("#gameMount");
  mount.innerHTML = `
    <div class="chip-row" id="tModes">
      <button class="filter-btn active" data-tmode="cpu">🤖 vs Computer</button>
      <button class="filter-btn" data-tmode="2p">👥 2 Players</button>
      <span id="tDiffWrap" style="display:inline-flex;gap:8px">
        <button class="filter-btn" data-tdiff="easy">Easy</button>
        <button class="filter-btn active" data-tdiff="hard">Hard</button>
      </span>
    </div>
    <p class="game-status" id="tStatus">You are X. Get three in a row!</p>
    <div class="game-board ttt-board" id="tBoard"></div>
    <p class="game-result" id="tResult" aria-live="polite"></p>
    <div class="game-controls"><button class="btn hidden" id="tRestart">Play again ↻</button></div>`;
  const board = $("#tBoard"), status = $("#tStatus"), result = $("#tResult");
  const winOf = (bd) => {
    for (const L of LINES) { const [x, y, z] = L; if (bd[x] && bd[x] === bd[y] && bd[x] === bd[z]) return { p: bd[x], line: L }; }
    return bd.every(Boolean) ? { p: "draw", line: [] } : null;
  };
  function aiMove() {
    if (diff === "easy" && Math.random() < .6) {
      const open = b.map((v, i) => (v ? null : i)).filter(v => v !== null);
      return open[rand(0, open.length - 1)];
    }
    for (const p of ["O", "X"]) for (const L of LINES) {
      const v = L.map(i => b[i]);
      if (v.filter(x => x === p).length === 2 && v.includes("")) return L[v.indexOf("")];
    }
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter(i => !b[i]);
    if (corners.length) return corners[rand(0, corners.length - 1)];
    const open = b.map((v, i) => (v ? null : i)).filter(v => v !== null);
    return open[rand(0, open.length - 1)];
  }
  function draw() {
    board.innerHTML = b.map((v, i) =>
      `<button class="board-cell${winLine?.includes(i) ? " win-cell" : ""}" data-i="${i}" ${v || done ? "disabled" : ""}>${v}</button>`).join("");
  }
  function end(w) {
    done = true; winLine = w.line; draw();
    if (w.p === "draw") { status.textContent = "Draw!"; Sound.play(440, .15); if (mode === "cpu") { result.textContent = "+30 SI base."; recordScore("tictactoe", 30, "Draw"); } else result.textContent = "Well matched!"; }
    else if (w.p === "X" && mode === "cpu") { status.textContent = "You win! 🎉"; result.textContent = "+100 SI base"; Sound.win(); recordScore("tictactoe", 100, "Victory"); }
    else if (mode === "2p") { status.textContent = `Player ${w.p} wins! 🎉`; result.textContent = "Duel complete — no score recorded."; Sound.win(); }
    else { status.textContent = "Computer wins this one."; result.textContent = "No coins — try again!"; Sound.lose(); recordScore("tictactoe", 0, "Defeat"); }
    $("#tRestart").classList.remove("hidden");
  }
  function place(i) {
    b[i] = turn; Sound.play(520, .06); draw();
    let w = winOf(b);
    if (w) return end(w);
    turn = turn === "X" ? "O" : "X";
    if (mode === "cpu" && turn === "O") {
      status.textContent = "Computer thinking…";
      later(() => {
        if (currentGame !== "tictactoe" || done) return;
        b[aiMove()] = "O"; draw();
        w = winOf(b);
        if (w) end(w); else { turn = "X"; status.textContent = "Your turn."; }
      }, 420);
    } else status.textContent = mode === "2p" ? `Player ${turn}'s turn.` : "Your turn.";
  }
  board.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-i]");
    if (!cell || done) return;
    const i = Number(cell.dataset.i);
    if (b[i] || (mode === "cpu" && turn === "O")) return;
    place(i);
  });
  mount.addEventListener("click", (e) => {
    const m = e.target.closest("[data-tmode]");
    if (m) {
      mode = m.dataset.tmode;
      $$("#tModes [data-tmode]").forEach(x => x.classList.toggle("active", x === m));
      $("#tDiffWrap").style.display = mode === "cpu" ? "inline-flex" : "none";
      b = Array(9).fill(""); turn = "X"; done = false; winLine = null;
      status.textContent = mode === "cpu" ? "You are X. Get three in a row!" : "Player X starts. Take turns!";
      result.textContent = ""; $("#tRestart").classList.add("hidden"); draw(); return;
    }
    const d = e.target.closest("[data-tdiff]");
    if (d) {
      diff = d.dataset.tdiff;
      $$("#tModes [data-tdiff]").forEach(x => x.classList.toggle("active", x === d));
      b = Array(9).fill(""); turn = "X"; done = false; winLine = null;
      status.textContent = `Difficulty: ${diff}. Your move!`;
      result.textContent = ""; $("#tRestart").classList.add("hidden"); draw();
    }
  });
  $("#tRestart").addEventListener("click", () => {
    b = Array(9).fill(""); turn = "X"; done = false; winLine = null;
    result.textContent = ""; $("#tRestart").classList.add("hidden"); draw();
  });
  draw();
}

/* ---------- Word Forge ---------- */
function gameScramble() {
  const words = shuffle(WORDS).slice(0, 5);
  let round = 0, score = 0, current = "", solved = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="wStatus">Round 1 of 5 · Score 0</p>
    <div class="scramble-word" id="wTiles"></div>
    <form class="game-controls" id="wForm">
      <input class="game-input" id="wGuess" type="text" autocomplete="off" spellcheck="false" placeholder="Your answer" aria-label="Unscrambled word">
      <button class="btn btn-primary" type="submit">Solve</button>
      <button class="btn" type="button" id="wSkip">Skip</button>
    </form>
    <p class="game-result" id="wResult" aria-live="polite"></p>
    <div class="game-controls"><button class="btn hidden" id="wRestart">Play again ↻</button></div>`;
  const tiles = $("#wTiles"), status = $("#wStatus"), result = $("#wResult"), input = $("#wGuess");
  const scrambleWord = (w) => { let s = w, g = 0; while (s === w && g++ < 20) s = shuffle(w.split("")).join(""); return s; };
  function nextWord() {
    if (round >= 5) return finish();
    solved = false;
    current = words[round];
    tiles.innerHTML = scrambleWord(current).split("").map((ch, i) => `<span class="letter" style="animation-delay:${i * 50}ms">${ch}</span>`).join("");
    status.textContent = `Round ${round + 1} of 5 · Score ${score} · ${current.length} letters`;
    result.textContent = ""; input.value = ""; input.disabled = false; input.focus();
  }
  function finish() {
    input.disabled = true;
    status.textContent = "Forge complete!";
    result.textContent = `+${score} SI base`;
    $("#wRestart").classList.remove("hidden");
    recordScore("scramble", score, `${score / 20}/5 words`);
  }
  $("#wForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (solved) return;
    if (input.value.trim().toUpperCase() === current) {
      solved = true; score += 20; Sound.play(720, .1);
      result.textContent = `Correct! "${current}" +20`;
      round++;
      later(() => { if (currentGame === "scramble") nextWord(); }, 900);
    } else { Sound.play(240, .1); result.textContent = "Not that word — try again!"; }
  });
  $("#wSkip").addEventListener("click", () => {
    if (solved) return;
    result.textContent = `The word was "${current}".`;
    round++;
    later(() => { if (currentGame === "scramble") nextWord(); }, 900);
  });
  $("#wRestart").addEventListener("click", () => gameScramble());
  nextWord();
}

/* ---------- Echo Pulse ---------- */
function gameSimon() {
  const PADS = [
    { color:"#22d3ee", freq:329.63 }, { color:"#fb7185", freq:261.63 },
    { color:"#4ade80", freq:392.00 }, { color:"#fbbf24", freq:440.00 }
  ];
  let seq = [], idx = 0, accepting = false, over = false;
  $("#gameMount").innerHTML = `
    <p class="simon-level" id="sLevel">Level 1</p>
    <p class="game-status" id="sStatus">Press start to watch the pattern.</p>
    <div class="simon-grid" id="sGrid">
      ${PADS.map((p, i) => `<button class="pad" data-pad="${i}" style="background:${p.color};color:${p.color}" aria-label="Pad ${i + 1}"></button>`).join("")}
    </div>
    <p class="game-result" id="sResult" aria-live="polite"></p>
    <div class="game-controls">
      <button class="btn btn-primary" id="sStart">Start</button>
      <button class="btn hidden" id="sRestart">Play again ↻</button>
    </div>`;
  const grid = $("#sGrid"), status = $("#sStatus"), level = $("#sLevel"), result = $("#sResult");
  function flash(i, dur = 380) {
    const pad = grid.querySelector(`[data-pad="${i}"]`);
    pad.classList.add("lit");
    Sound.play(PADS[i].freq, dur / 1000, "sine", .07);
    later(() => pad.classList.remove("lit"), dur);
  }
  function playback() {
    accepting = false;
    status.textContent = "Watch the pattern…";
    seq.forEach((p, i) => later(() => { if (currentGame === "simon" && !over) flash(p); }, 620 * (i + 1)));
    later(() => {
      if (currentGame !== "simon" || over) return;
      accepting = true; idx = 0;
      status.textContent = "Your turn — repeat it!";
    }, 620 * (seq.length + 1));
  }
  function nextLevel() { seq.push(rand(0, 3)); level.textContent = `Level ${seq.length}`; playback(); }
  function fail() {
    over = true; accepting = false; Sound.lose();
    const pts = (seq.length - 1) * 10;
    status.textContent = `Wrong pad! You reached level ${seq.length}.`;
    result.textContent = pts > 0 ? `+${pts} SI base` : "Try again!";
    $("#sRestart").classList.remove("hidden");
    recordScore("simon", pts, `Reached level ${seq.length}`);
  }
  grid.addEventListener("click", (e) => {
    const pad = e.target.closest("[data-pad]");
    if (!pad || !accepting) return;
    const i = Number(pad.dataset.pad);
    flash(i, 250);
    if (i !== seq[idx]) return fail();
    idx++;
    if (idx === seq.length) {
      accepting = false;
      result.textContent = "Perfect! Level up…";
      later(() => { if (currentGame === "simon" && !over) { result.textContent = ""; nextLevel(); } }, 900);
    }
  });
  $("#sStart").addEventListener("click", () => { if (!seq.length || over) { over = false; seq = []; result.textContent = ""; $("#sRestart").classList.add("hidden"); nextLevel(); } });
  $("#sRestart").addEventListener("click", () => gameSimon());
}

/* ---------- Serpentix ---------- */
function gameSnake() {
  $("#gameMount").innerHTML = `
    <div class="runner-wrap">
      <canvas id="snakeCanvas" width="400" height="400" aria-label="Snake game"></canvas>
      <div class="snake-score" id="snakeScore">SCORE: 0</div>
      <div class="runner-actions"><button class="runner-btn" id="snakeStart">START</button></div>
      <div class="dpad" aria-label="Direction controls">
        <span class="dp-blank"></span><button data-dir="up" aria-label="Up">▲</button><span class="dp-blank"></span>
        <button data-dir="left" aria-label="Left">◀</button><button data-dir="down" aria-label="Down">▼</button><button data-dir="right" aria-label="Right">▶</button>
      </div>
      <p class="runner-hint">Arrows / WASD / D-pad · eat orbs, dodge walls and yourself.</p>
    </div>`;
  const cv = $("#snakeCanvas"), ctx = cv.getContext("2d");
  const COLS = 20, ROWS = 20, CELL = 20;
  let snake, dir, nextDir, food, score, dead, speed, started = false, timer = null;
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a78bfa";
  const maxSpeed = () => hasPass("slow") ? 95 : 75;
  function spawnFood() {
    let f;
    do { f = { x: rand(0, COLS - 1), y: rand(0, ROWS - 1) }; } while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  }
  function scoreText() {
    const hearts = scores.inv.life ? ` · ❤${scores.inv.life}` : "";
    $("#snakeScore").textContent = `SCORE: ${score}${hearts}`;
  }
  function reset() {
    snake = [{x:8,y:10},{x:7,y:10},{x:6,y:10}];
    dir = {x:1,y:0}; nextDir = dir;
    score = 0; dead = false; speed = 150; started = true;
    food = spawnFood(); scoreText(); draw(); loop();
  }
  function setDir(d) {
    const map = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
    const nd = map[d];
    if (!nd || (nd.x === -dir.x && nd.y === -dir.y)) return;
    nextDir = nd;
  }
  function die() {
    if (scores.inv.life > 0) {
      scores.inv.life--; saveScores();
      toast("❤️ Spare Heart used — continue!");
      snake = [{x:8,y:10},{x:7,y:10},{x:6,y:10}];
      dir = {x:1,y:0}; nextDir = dir; dead = false;
      scoreText(); draw(); loop(); return;
    }
    dead = true; started = false; Sound.lose();
    recordScore("snake", score, `${score / 10} orbs eaten`);
    ctx.fillStyle = "rgba(5,8,22,.75)"; ctx.fillRect(0, 0, 400, 400);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 26px Segoe UI,Arial";
    ctx.fillText("GAME OVER", 200, 190);
    ctx.fillStyle = "#a5b4fc"; ctx.font = "14px Segoe UI,Arial";
    ctx.fillText(`Score: ${score} — press START to go again`, 200, 220);
  }
  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) return die();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10; food = spawnFood();
      speed = Math.max(maxSpeed(), speed - 3);
      Sound.play(660, .05); scoreText();
    } else snake.pop();
    draw();
  }
  function loop() {
    clearTimeout(timer);
    timer = setTimeout(() => { if (!dead && started && currentGame === "snake") { tick(); loop(); } }, speed);
  }
  function draw() {
    ctx.fillStyle = "#0a0f22"; ctx.fillRect(0, 0, 400, 400);
    ctx.strokeStyle = "rgba(90,110,180,.12)"; ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
    }
    ctx.shadowBlur = 14; ctx.shadowColor = "#fb7185"; ctx.fillStyle = "#fb7185";
    ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2); ctx.fill();
    snake.forEach((s, i) => {
      ctx.shadowBlur = i === 0 ? 16 : 6;
      ctx.shadowColor = accent;
      ctx.fillStyle = i === 0 ? accent : `rgba(120,140,255,${Math.max(.35, 1 - i * .04)})`;
      ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
    });
    ctx.shadowBlur = 0;
  }
  $("#snakeStart").addEventListener("click", () => reset());
  $("#gameMount").addEventListener("click", (e) => {
    const d = e.target.closest("[data-dir]");
    if (d && started && !dead) setDir(d.dataset.dir);
  });
  const abort = new AbortController();
  window.addEventListener("keydown", (e) => {
    if (currentGame !== "snake") return;
    const keys = { ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down", ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right" };
    if (keys[e.code]) { e.preventDefault(); if (!started || dead) reset(); else setDir(keys[e.code]); }
  }, { signal: abort.signal });
  gameCleanup = () => { clearTimeout(timer); abort.abort(); };
  draw();
  ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 26px Segoe UI,Arial";
  ctx.fillText("SERPENTIX", 200, 185);
  ctx.fillStyle = "#a5b4fc"; ctx.font = "14px Segoe UI,Arial";
  ctx.fillText("Press START to begin", 200, 215);
}

/* ---------- Neon Dash ---------- */
let runnerRAF = 0, runnerAbort = null;
function stopRunner() {
  runnerAbort?.abort(); runnerAbort = null;
  if (runnerRAF) cancelAnimationFrame(runnerRAF);
  runnerRAF = 0;
}
function gameGeometry() {
  $("#gameMount").innerHTML = `
    <div class="runner-wrap">
      <canvas id="runnerCanvas" width="760" height="300" aria-label="Neon runner game"></canvas>
      <div class="runner-score" id="runnerScore">DISTANCE: 0</div>
      <div class="runner-actions">
        <button class="runner-btn" id="runnerStart">START RUN</button>
        <button class="btn" id="runnerRestart">RESTART ↻</button>
      </div>
      <p class="runner-hint">SPACE / ↑ / W / TAP to jump · dodge the glowing obstacles.</p>
    </div>`;
  const canvas = $("#runnerCanvas"), ctx = canvas.getContext("2d");
  const st = { x:100, y:224, size:25, vy:0, ground:224, obs:[], dist:0, speed:4.4, started:false, over:false, frame:0, spawn:0, shieldUsed:false };
  function reset() {
    Object.assign(st, { x:100, y:224, vy:0, obs:[], dist:0, speed:4.4, started:true, over:false, frame:0, spawn:0, shieldUsed:false });
    $("#runnerScore").textContent = "DISTANCE: 0";
  }
  function gameOver() {
    if (st.over) return;
    st.over = true; st.started = false; Sound.lose();
    recordScore("geometry", Math.floor(st.dist * 10), "Runner distance");
  }
  function jump() {
    if (!st.started || st.over) { reset(); return; }
    if (st.y >= st.ground - 1) { st.vy = -11.5; Sound.play(500, .06, "sine"); }
  }
  $("#runnerStart").addEventListener("click", () => { if (!st.started || st.over) reset(); else jump(); });
  $("#runnerRestart").addEventListener("click", () => { stopRunner(); gameGeometry(); });
  canvas.addEventListener("click", jump);
  runnerAbort = new AbortController();
  window.addEventListener("keydown", (e) => {
    if (currentGame !== "geometry") return;
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); jump(); }
  }, { signal: runnerAbort.signal });
  stopRunner();
  (function loop() {
    if (currentGame !== "geometry") return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#111a3a"); bg.addColorStop(1, "#090d1b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#24345e"; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 38) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = "#10172b"; ctx.fillRect(0, 250, w, 50);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(w, 250); ctx.stroke();
    if (st.started && !st.over) {
      st.frame++; st.dist += st.speed * 0.08;
      st.speed = Math.min(8.2, 4.4 + st.dist * 0.009);
      st.vy += 0.55; st.y += st.vy;
      if (st.y > st.ground) { st.y = st.ground; st.vy = 0; }
      if (--st.spawn <= 0) {
        const spike = Math.random() > 0.35;
        st.obs.push({ x: w + 10, y: spike ? 222 : 208, w: spike ? 27 : 25, h: spike ? 28 : 42, spike });
        st.spawn = rand(55, 100);
      }
      st.obs.forEach(o => (o.x -= st.speed));
      st.obs = st.obs.filter(o => o.x + o.w > 0);
      for (const o of st.obs) {
        if (st.x + st.size - 4 > o.x + 3 && st.x + 4 < o.x + o.w - 3 && st.y + st.size - 3 > o.y + 3 && st.y + 4 < o.y + o.h) {
          if (hasPass("shield") && !st.shieldUsed) {
            st.shieldUsed = true;
            st.obs = st.obs.filter(x => x !== o);
            Sound.play(300, .12, "sine", .06);
            toast("🛡️ Cube Guardian absorbed the hit!");
          } else gameOver();
          break;
        }
      }
      $("#runnerScore").textContent = `DISTANCE: ${Math.floor(st.dist * 10)}`;
    }
    st.obs.forEach(o => {
      ctx.shadowBlur = 13; ctx.shadowColor = "#fb7185"; ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      if (o.spike) { ctx.moveTo(o.x, o.y + o.h); ctx.lineTo(o.x + o.w / 2, o.y); ctx.lineTo(o.x + o.w, o.y + o.h); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.shadowBlur = 0;
    });
    ctx.save();
    ctx.translate(st.x + st.size / 2, st.y + st.size / 2);
    ctx.rotate(st.frame * 0.055);
    ctx.shadowBlur = 20; ctx.shadowColor = "#22d3ee"; ctx.fillStyle = "#22d3ee";
    ctx.fillRect(-st.size / 2, -st.size / 2, st.size, st.size);
    ctx.shadowBlur = 0; ctx.fillStyle = "#080b16";
    ctx.fillRect(-8, -6, 4, 7); ctx.fillRect(4, -6, 4, 7);
    ctx.beginPath(); ctx.arc(0, 5, 4.5, 0, Math.PI); ctx.lineWidth = 2.4; ctx.strokeStyle = "#080b16"; ctx.stroke();
    ctx.strokeStyle = "#e0fcff"; ctx.lineWidth = 2;
    ctx.strokeRect(-st.size / 2 + 3, -st.size / 2 + 3, st.size - 6, st.size - 6);
    ctx.restore();
    if (!st.started) {
      ctx.fillStyle = "#050816b8"; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 27px Segoe UI,Arial";
      ctx.fillText(st.over ? "RUN OVER" : "NEON DASH", w / 2, 115);
      ctx.fillStyle = "#a5b4fc"; ctx.font = "14px Segoe UI,Arial";
      ctx.fillText(st.over ? `Distance: ${Math.floor(st.dist * 10)} — press START RUN to go again` : "Press START RUN to begin", w / 2, 148);
    }
    runnerRAF = requestAnimationFrame(loop);
  })();
}

/* ---------- 2048 Merge Mania ---------- */
function game2048() {
  const COLORS = {2:"#3c4a6b",4:"#4a5d8a",8:"#5b74c4",16:"#7c8ef0",32:"#a78bfa",64:"#f472b6",128:"#fb7185",256:"#fb923c",512:"#fbbf24",1024:"#a3e635",2048:"#4ade80"};
  let grid, score = 0, done = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="gStatus">Join the numbers to reach <b>2048</b>! Arrow keys / WASD / D-pad.</p>
    <div class="m2048-board" id="gBoard"></div>
    <p class="game-result" id="gResult" aria-live="polite"></p>
    <div class="dpad" aria-label="Direction controls">
      <span class="dp-blank"></span><button data-dir="up" aria-label="Up">▲</button><span class="dp-blank"></span>
      <button data-dir="left" aria-label="Left">◀</button><button data-dir="down" aria-label="Down">▼</button><button data-dir="right" aria-label="Right">▶</button>
    </div>
    <div class="game-controls" style="margin-top:12px"><button class="btn hidden" id="gRestart">Play again ↻</button></div>`;
  const board = $("#gBoard"), status = $("#gStatus"), result = $("#gResult");
  function addTile() {
    const empty = grid.map((v, i) => (v ? null : i)).filter(v => v !== null);
    if (!empty.length) return;
    grid[empty[rand(0, empty.length - 1)]] = Math.random() < 0.9 ? 2 : 4;
  }
  function reset() { grid = Array(16).fill(0); score = 0; done = false; addTile(); addTile(); draw(); result.textContent = ""; $("#gRestart").classList.add("hidden"); }
  function draw() {
    board.innerHTML = grid.map(v => `<div class="m2-cell" style="${v ? `background:${COLORS[v] || "#4ade80"};color:${v <= 4 ? "#dfe6ff" : "#fff"};font-size:${v >= 1024 ? "15px" : v >= 128 ? "17px" : "20px"}` : ""}">${v || ""}</div>`).join("");
    status.innerHTML = `Score: <b>${score}</b> · Join tiles to reach <b>2048</b>!`;
  }
  function lineTo(idx) { return idx === 0 ? [0,1,2,3] : idx === 1 ? [4,5,6,7] : idx === 2 ? [8,9,10,11] : [12,13,14,15]; }
  function move(dir) {
    if (done) return;
    const before = grid.join(",");
    const get = (r, c) => dir === "left" ? lineTo(r)[c] : dir === "right" ? lineTo(r)[3 - c] : dir === "up" ? lineTo(c)[r] : lineTo(c)[3 - r];
    for (let row = 0; row < 4; row++) {
      let vals = [];
      for (let c = 0; c < 4; c++) { const v = grid[get(row, c)]; if (v) vals.push(v); }
      for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i] === vals[i + 1]) { vals[i] *= 2; score += vals[i]; vals.splice(i + 1, 1); Sound.play(520 + Math.log2(vals[i]) * 30, .06); }
      }
      while (vals.length < 4) vals.push(0);
      for (let c = 0; c < 4; c++) grid[get(row, c)] = vals[c];
    }
    if (grid.join(",") === before) return;
    addTile(); draw();
    if (grid.includes(2048)) { done = true; result.textContent = `🏆 2048 REACHED! +${score} SI base`; Sound.win(); recordScore("merge2048", score, "Made 2048!"); $("#gRestart").classList.remove("hidden"); return; }
    const moves = ["left","right","up","down"].some(d => canMove(d));
    if (!moves) {
      done = true; Sound.lose();
      result.textContent = `No moves left! +${score} SI base`;
      recordScore("merge2048", score, `Merged to ${Math.max(...grid)}`);
      $("#gRestart").classList.remove("hidden");
    }
  }
  function canMove(dir) {
    const test = [...grid];
    const get = (r, c) => dir === "left" ? lineTo(r)[c] : dir === "right" ? lineTo(r)[3 - c] : dir === "up" ? lineTo(c)[r] : lineTo(c)[3 - r];
    for (let row = 0; row < 4; row++) {
      let vals = [];
      for (let c = 0; c < 4; c++) { const v = test[get(row, c)]; if (v) vals.push(v); }
      for (let i = 0; i < vals.length - 1; i++) if (vals[i] === vals[i + 1]) { vals[i] *= 2; vals.splice(i + 1, 1); }
      while (vals.length < 4) vals.push(0);
      for (let c = 0; c < 4; c++) test[get(row, c)] = vals[c];
    }
    return test.join(",") !== grid.join(",");
  }
  $("#gameMount").addEventListener("click", (e) => {
    const d = e.target.closest("[data-dir]");
    if (d) move(d.dataset.dir);
  });
  const abort = new AbortController();
  window.addEventListener("keydown", (e) => {
    if (currentGame !== "merge2048") return;
    const keys = { ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right", ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down" };
    if (keys[e.code]) { e.preventDefault(); move(keys[e.code]); }
  }, { signal: abort.signal });
  gameCleanup = () => abort.abort();
  $("#gRestart").addEventListener("click", reset);
  reset();
}

/* ---------- Sky Flap ---------- */
function gameFlappy() {
  $("#gameMount").innerHTML = `
    <div class="runner-wrap">
      <canvas id="flappyCanvas" width="360" height="480" aria-label="Flappy flying game"></canvas>
      <div class="flap-score" id="flapScore">GATES: 0</div>
      <div class="runner-actions"><button class="runner-btn" id="flapStart">FLY ▸</button></div>
      <p class="runner-hint">SPACE / CLICK / TAP to flap · glide through the neon gates.</p>
    </div>`;
  const cv = $("#flappyCanvas"), ctx = cv.getContext("2d");
  const W = 360, H = 480, GRAV = 0.45, FLAP = -7.6, GAP = 135, PIPE_W = 56;
  let bird, pipes, score, started, over, frame, raf = 0;
  function reset() {
    bird = { x: 90, y: H / 2, vy: 0 };
    pipes = []; score = 0; started = true; over = false; frame = 0;
    $("#flapScore").textContent = "GATES: 0";
    loop();
  }
  function flap() {
    if (!started || over) { cancelAnimationFrame(raf); reset(); return; }
    bird.vy = FLAP; Sound.play(600, .05, "sine");
  }
  function die() {
    over = true; started = false; Sound.lose();
    recordScore("flappy", score * 20, `${score} gates cleared`);
    ctx.fillStyle = "rgba(5,8,22,.75)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 26px Segoe UI,Arial";
    ctx.fillText("DOWN!", W / 2, H / 2 - 10);
    ctx.fillStyle = "#a5b4fc"; ctx.font = "14px Segoe UI,Arial";
    ctx.fillText(`${score} gates — press FLY to retry`, W / 2, H / 2 + 20);
  }
  function loop() {
    cancelAnimationFrame(raf);
    if (!started && !over) return;
    if (started && !over) {
      frame++;
      bird.vy += GRAV; bird.y += bird.vy;
      if (frame % 95 === 0) pipes.push({ x: W + PIPE_W, gy: rand(90, H - 90 - GAP), passed: false });
      pipes.forEach(p => (p.x -= 2.4));
      pipes = pipes.filter(p => p.x + PIPE_W > 0);
      for (const p of pipes) {
        if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; Sound.play(760, .07); $("#flapScore").textContent = `GATES: ${score}`; }
        if (bird.x + 12 > p.x && bird.x - 12 < p.x + PIPE_W && (bird.y - 12 < p.gy || bird.y + 12 > p.gy + GAP)) return die();
      }
      if (bird.y + 12 > H - 8 || bird.y - 12 < 0) return die();
    }
    ctx.fillStyle = "#0a1128"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(90,110,180,.14)"; ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.shadowBlur = 14; ctx.shadowColor = "#22d3ee";
    for (const p of pipes) {
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(p.x, 0, PIPE_W, p.gy);
      ctx.fillRect(p.x, p.gy + GAP, PIPE_W, H - p.gy - GAP);
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(p.x, p.gy - 6, PIPE_W, 6);
      ctx.fillRect(p.x, p.gy + GAP, PIPE_W, 6);
    }
    ctx.shadowColor = "#fbbf24"; ctx.fillStyle = "#fbbf24";
    ctx.beginPath(); ctx.arc(bird.x, bird.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#080b16";
    ctx.beginPath(); ctx.arc(bird.x + 5, bird.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fb7185";
    ctx.beginPath(); ctx.moveTo(bird.x + 10, bird.y); ctx.lineTo(bird.x + 18, bird.y + 3); ctx.lineTo(bird.x + 10, bird.y + 6); ctx.fill();
    if (!started) {
      ctx.fillStyle = "rgba(5,8,22,.6)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 26px Segoe UI,Arial";
      ctx.fillText("SKY FLAP", W / 2, H / 2 - 30);
      ctx.fillStyle = "#a5b4fc"; ctx.font = "14px Segoe UI,Arial";
      ctx.fillText("Press FLY or tap to begin", W / 2, H / 2);
    }
    raf = requestAnimationFrame(loop);
  }
  $("#flapStart").addEventListener("click", flap);
  cv.addEventListener("click", flap);
  const abort = new AbortController();
  window.addEventListener("keydown", (e) => {
    if (currentGame !== "flappy") return;
    if (["Space", "ArrowUp"].includes(e.code)) { e.preventDefault(); flap(); }
  }, { signal: abort.signal });
  gameCleanup = () => { cancelAnimationFrame(raf); abort.abort(); };
  started = false; over = false; bird = { x: 90, y: H / 2, vy: 0 }; pipes = []; score = 0; frame = 0;
  loop();
}

/* ---------- Mole Smash ---------- */
function gameMole() {
  let time = 30, score = 0, up = Array(9).fill(null), spawnT = null, tickT = null, running = false;
  $("#gameMount").innerHTML = `
    <p class="game-status" id="moStatus">Time: 30s · Score: 0 — smash 🦔 moles, avoid 💣 bombs!</p>
    <div class="mole-grid" id="moGrid">
      ${Array.from({ length: 9 }, (_, i) => `<button class="mole-hole" data-hole="${i}" aria-label="Hole ${i + 1}"></button>`).join("")}
    </div>
    <p class="game-result" id="moResult" aria-live="polite"></p>
    <div class="game-controls">
      <button class="btn btn-primary" id="moStart">START · 30s</button>
      <button class="btn hidden" id="moRestart">Play again ↻</button>
    </div>`;
  const holes = $$("#moGrid .mole-hole"), status = $("#moStatus"), result = $("#moResult");
  function paint(i, emoji, bomb) {
    holes[i].textContent = emoji || "";
    holes[i].classList.toggle("up", !!emoji);
    holes[i].classList.toggle("bomb", !!bomb);
  }
  function spawn() {
    const free = up.map((v, i) => (v ? null : i)).filter(v => v !== null);
    if (!free.length) return;
    const i = free[rand(0, free.length - 1)];
    const bomb = Math.random() < 0.22;
    up[i] = bomb ? "bomb" : "mole";
    paint(i, bomb ? "💣" : "🦔", bomb);
    later(() => { if (up[i]) { up[i] = null; paint(i); } }, rand(600, 1000));
  }
  function stop() {
    running = false;
    clearTimeout(spawnT); clearInterval(tickT);
    up.forEach((_, i) => { up[i] = null; paint(i); });
    holes.forEach(h => (h.disabled = true));
    result.textContent = `Time! Final score: ${score} SI base`;
    recordScore("mole", Math.max(0, score), `${score} points in 30s`);
    $("#moRestart").classList.remove("hidden");
  }
  function start() {
    time = 30; score = 0; running = true;
    holes.forEach(h => (h.disabled = false));
    result.textContent = ""; $("#moRestart").classList.add("hidden");
    status.textContent = `Time: ${time}s · Score: ${score}`;
    clearInterval(tickT); clearTimeout(spawnT);
    tickT = setInterval(() => {
      time--; status.textContent = `Time: ${time}s · Score: ${score}`;
      if (time <= 0) stop();
    }, 1000);
    (function spawnLoop() {
      if (!running) return;
      spawn(); spawnT = setTimeout(spawnLoop, rand(450, 850));
    })();
  }
  holes.forEach((h, i) => h.addEventListener("click", () => {
    if (!running || !up[i]) return;
    if (up[i] === "bomb") {
      score = Math.max(0, score - 15); Sound.play(150, .18, "sawtooth");
      result.textContent = "💥 Bomb! -15";
    } else {
      score += 10; Sound.play(700, .06);
      result.textContent = "+10!";
    }
    up[i] = null; paint(i);
    status.textContent = `Time: ${time}s · Score: ${score}`;
  }));
  $("#moStart").addEventListener("click", start);
  $("#moRestart").addEventListener("click", () => { holes.forEach(h => (h.disabled = false)); start(); });
}

/* ---------- Account UI & init ---------- */
function updateAccountUI() {
  const u = activeUser();
  $$("[data-auth-btn]").forEach(b => (b.textContent = u ? "Sign out" : "Sign in"));
  $("#sessionInfo").textContent = u ? `${u.name} · ${u.email || "local"} · ${u.provider === "google" ? "Google" : u.provider === "email" ? "email" : "demo"}` : "Guest session on this device.";
  renderProfile(); renderLeaderboard();
  $("#accountStatus").textContent = u ? `Signed in as ${u.name}.` : "You are playing as a guest.";
  $("#accountProvider").textContent = u?.provider === "google" ? "Google account" : u?.provider === "email" ? "Email account" : u ? "Local demo" : "Not signed in";
  $("#authNote").textContent = sb ? "Real accounts via Supabase — Google, email & multiplayer servers. Staff? Type /admin." : "Demo mode: paste your Supabase keys in app.js to enable accounts & multiplayer. Staff? Type /admin.";
  $("#authSubmit").textContent = sb ? (authMode === "signup" ? "Create account ↗" : "Sign in ↗") : "Start demo session ↗";
}
buildEmojiRow();
applySettings();
updateAccountUI();
renderAll();

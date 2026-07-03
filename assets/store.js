/* ============================================================
   FORTNITE SURVIVOR — store.js
   Single source of truth for game state.

   Backends:
   - LocalBackend: browser localStorage only (works on one device,
     great for testing the rules before you wire up real sync)
   - SheetsBackend: reads/writes a single JSON blob to a Google
     Sheet through a tiny Apps Script web app (see /apps-script).
     Enable it by setting SURVIVOR_CONFIG.sheetsWebAppUrl in
     assets/config.js. All four players' browsers then poll the
     same sheet, so everyone's screen updates together.
   ============================================================ */

const MISSION_POOL = [
  // IRL social missions
  { text: "Pants somebody — that person takes a shot 🧲",                                      chooseTarget: false },
  { text: "Get someone to try your drink — that person takes a shot 🍺",                      chooseTarget: false },
  { text: "Convince someone to touch the floor — that person takes a shot 🙇",                chooseTarget: false },
  { text: "Give up a Golden Gun to another player — that person takes a shot 🔫",             chooseTarget: false },
  { text: "Get someone to respond to a knock knock joke — you pick who takes a shot 🚪",      chooseTarget: true  },
  { text: "Get someone with a Joe Mama or Deez Nuts joke 😂 — you pick who takes a shot",    chooseTarget: true  },
  { text: "Get someone to pass you something from the fridge 🧊 — that person takes a shot", chooseTarget: false },
  { text: "Give someone a wedgie — that person takes a shot 👡",                              chooseTarget: false },
  { text: "Get someone to have one of your drinks you brought — that person takes a shot 🍻", chooseTarget: false },
  // Fortnite in-game missions
  { text: "Get a Fortnite kill with a pickaxe — you pick who takes a shot ⛏️",              chooseTarget: true  },
  { text: "Win a game using NO shields 🚫🛡️ — you pick who takes a shot",       chooseTarget: true  },
  { text: "Open a Vault in Fortnite 🏦 — you pick who takes a shot",                         chooseTarget: true  },
  { text: "Get BOTH Boss Mythic Weapons in a single game 👑 — you pick who takes a shot",    chooseTarget: true  },
  { text: "Find a Party Piñata in Fortnite 🎉 — you pick who takes a shot",             chooseTarget: true  },
  { text: "Die and get a teammate to revive you within the first 3 minutes — you pick who takes a shot ⏱️", chooseTarget: true },
  { text: "Get a kill with a grenade 💥 — you pick who takes a shot",                        chooseTarget: true  },
];



const PUNISHMENTS = [
  { id: "40hands", emoji: "💪", title: "Edward 40 Hands",      desc: "Two 40s taped to your hands. Tomorrow. You can’t put them down until they’re both empty. No bathroom breaks until it’s done." },
  { id: "loko",    emoji: "🍺", title: "Shotgun a 4 Loko",     desc: "Full can of 4 Loko, shotgunned. Tomorrow. Pick your flavour wisely because you’re finishing it." },
  { id: "edible",  emoji: "🟢", title: "100mg Edible Soda",    desc: "100mg edible mixed into a soda of the group’s choosing. Tomorrow. Enjoy the ride." },
  { id: "nudie",   emoji: "🏃", title: "Nudie Run",             desc: "Naked lap. Full sprint around the block. Everyone comes outside to watch. No skipping." },
   { id: "icyhot",   emoji: "🏃", title: "Icy Hot",             desc: "Put Icy Hot on your Balls. Punishment is fast, but pain lasts forever" },
   { id: "glizzy",   emoji: "🏃", title: "Glizzy Glaze",             desc: "Your beach outfit tomorrow is a Hot Dog Costume and a Speedo. What could be more American" },
];

const PLAYER_NAMES = ["Brock", "Tyler", "Danny", "Aldo"];

const PRESET = { names: ["Brock", "Tyler", "Danny", "Aldo"], rounds: 6 };

const DEFAULT_STATE = () => ({
  meta: {
    version: 1,
    started: false,
    finished: false,
    round: 1,
    endCondition: { type: "games", value: 6 }, // 'games' | 'wins' | 'time' | 'manual'
    endTimestamp: null, // ms epoch, used when type === 'time'
    updatedAt: Date.now(),
  },
  players: [1, 2, 3, 4].map((id) => ({
    id,
    name: PLAYER_NAMES[id - 1] || `Player ${id}`,
    totalVotes: 0,
    totalKills: 0,
    wins: 0,
    roundKills: null, // null = not submitted yet this round
    roundDistributed: false,
    allocations: {}, // { targetId: count } for the current round
    pendingDrinks: [], // [{id, fromName, count, round, done}]
    missions: [], // [{id, text, completed, target}] for current round
    missionRerolls: 0, // how many times this player has rerolled (max 3)
    seenMissions: [], // texts already seen — avoided on reroll where possible
  })),
  history: [], // [{round, kills:{id:n}, votes:{id:n}, winnerId}]
});

function pickMissions(count, exclude = []) {
  const pool = MISSION_POOL.filter((m) => !exclude.includes(m.text));
  const picks = [];
  const copy = [...pool];
  for (let i = 0; i < count && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picks.push(copy.splice(idx, 1)[0]);
  }
  return picks.map((m, i) => ({
    id: `${Date.now()}-${i}-${Math.floor(Math.random() * 9999)}`,
    text: m.text,
    chooseTarget: m.chooseTarget,
    completed: false,
    target: null,
  }));
}

/* ---------------- Backends ---------------- */

class LocalBackend {
  constructor() {
    this.key = "fortniteSurvivorState";
  }
  async load() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  }
  async save(state) {
    localStorage.setItem(this.key, JSON.stringify(state));
    return true;
  }
  get mode() {
    return "local";
  }
}

class SheetsBackend {
  constructor(url) {
    this.url = url;
  }
  async load() {
    const res = await fetch(this.url, { method: "GET", cache: "no-store" });
    const text = await res.text();
    if (!text || text === "{}") return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Bad JSON from sheet:", text);
      return null;
    }
  }
  async save(state) {
    await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
      body: JSON.stringify(state),
    });
    return true;
  }
  get mode() {
    return "sheets";
  }
}

/* ---------------- Store ---------------- */

const Store = {
  backend: null,
  state: null,
  listeners: [],
  pollHandle: null,

  init() {
    const cfg = window.SURVIVOR_CONFIG || {};
    this.backend =
      cfg.sheetsWebAppUrl && cfg.sheetsWebAppUrl.trim()
        ? new SheetsBackend(cfg.sheetsWebAppUrl.trim())
        : new LocalBackend();
    return this.refresh().then(() => {
      if (this.backend.mode === "sheets") {
        this.pollHandle = setInterval(() => this.refresh(), 4000);
      }
    });
  },

  onChange(fn) {
    this.listeners.push(fn);
  },

  notify() {
    this.listeners.forEach((fn) => fn(this.state));
  },

  async refresh() {
    try {
      const loaded = await this.backend.load();
      this.state = loaded || DEFAULT_STATE();
      this.notify();
    } catch (e) {
      console.error("Failed to load state", e);
      if (!this.state) this.state = DEFAULT_STATE();
    }
    return this.state;
  },

  async commit() {
    this.state.meta.updatedAt = Date.now();
    this.notify();
    try {
      await this.backend.save(this.state);
    } catch (e) {
      console.error("Failed to save state", e);
    }
  },

  async reset() {
    this.state = DEFAULT_STATE();
    await this.commit();
  },

  /* ---- setup ---- */
  async setPlayerNames(names) {
    names.forEach((n, i) => {
      if (n && n.trim()) this.state.players[i].name = n.trim();
    });
    await this.commit();
  },

  async setEndCondition(type, value, endTimestamp) {
    this.state.meta.endCondition = { type, value: value || null };
    this.state.meta.endTimestamp = endTimestamp || null;
    await this.commit();
  },

  /* ---- single-commit setup + start (used by setup.html to avoid race conditions) ---- */
  async setupAndStart(names, endType, endValue, endTimestamp) {
    // Apply names
    names.forEach((n, i) => {
      if (n && n.trim()) this.state.players[i].name = n.trim();
    });
    // Apply end condition
    this.state.meta.endCondition = { type: endType, value: endValue || null };
    this.state.meta.endTimestamp = endTimestamp || null;
    // Apply start
    this.state.meta.started = true;
    this.state.meta.finished = false;
    this.state.meta.round = 1;
    this.state.meta.roundWinner = null;
    this.state.meta.punishment = null;
    this.state.meta.punishmentRevealed = false;
    this.state.players.forEach((p) => {
      p.totalVotes = 0;
      p.totalKills = 0;
      p.wins = 0;
      p.roundKills = null;
      p.roundDistributed = false;
      p.allocations = {};
      p.pendingDrinks = [];
      p.missionSetCount = 1;
      p.seenMissions = [];
      p.missions = pickMissions(3, []);
      p.seenMissions = p.missions.map((m) => m.text);
    });
    this.state.history = [];

    // Single commit — one POST to the sheet
    await this.commit();

    // For sheets backend, verify the write landed before the caller redirects
    if (this.backend.mode === "sheets") {
      let attempts = 0;
      while (attempts < 4) {
        await new Promise((r) => setTimeout(r, 700));
        try {
          const check = await this.backend.load();
          if (check && check.meta && check.meta.started) return true; // confirmed
        } catch (_) {}
        // Write may not have landed yet — try once more
        if (attempts === 1) await this.commit();
        attempts++;
      }
    }
    return true;
  },

  async startGame() {
    this.state.meta.started = true;
    this.state.meta.finished = false;
    this.state.meta.round = 1;
    this.state.players.forEach((p) => {
      p.totalVotes = 0;
      p.totalKills = 0;
      p.wins = 0;
      p.roundKills = null;
      p.roundDistributed = false;
      p.allocations = {};
      p.pendingDrinks = [];
      p.missionSetCount = 1;
      p.seenMissions = [];
      p.missions = pickMissions(3, []);
      p.seenMissions = p.missions.map(m => m.text);
    });
    this.state.history = [];
    await this.commit();
  },

  /* ---- missions ---- */
  async completeMission(playerId, missionId, targetId) {
    const player = this.state.players.find((p) => p.id === playerId);
    const mission = player.missions.find((m) => m.id === missionId);
    if (!mission || mission.completed) return;
    mission.completed = true;
    mission.target = targetId;
    const target = this.state.players.find((p) => p.id === targetId);
    target.totalVotes += 3;
    target.pendingDrinks.push({
      id: `${Date.now()}-mission`,
      fromName: player.name,
      count: 3,
      round: this.state.meta.round,
      done: false,
      note: "secret challenge",
    });
    // Auto-deal: if all 3 missions are now done, immediately deal a fresh set
    if (player.missions.every((m) => m.completed)) {
      player.missions.forEach((m) => {
        if (!player.seenMissions.includes(m.text)) player.seenMissions.push(m.text);
      });
      // Reset seen list if pool would be exhausted (keeps variety going)
      const stillFresh = MISSION_POOL.filter((m) => !player.seenMissions.includes(m.text));
      if (stillFresh.length < 3) player.seenMissions = [];
      const next = pickMissions(3, player.seenMissions);
      player.missions = next;
      next.forEach((m) => player.seenMissions.push(m.text));
      player.missionSetCount = (player.missionSetCount || 1) + 1;
    }

    await this.commit();
  },

  /* ---- round kills & drink distribution ---- */
  async submitKills(playerId, kills) {
    const player = this.state.players.find((p) => p.id === playerId);
    player.roundKills = Math.max(0, parseInt(kills, 10) || 0);
    player.allocations = {};
    player.roundDistributed = player.roundKills === 0; // no kills = nothing to distribute
    await this.commit();
  },

  async setAllocation(playerId, targetId, count) {
    const player = this.state.players.find((p) => p.id === playerId);
    player.allocations[targetId] = Math.max(0, count);
    await this.commit();
  },

  allocatedTotal(player) {
    return Object.values(player.allocations || {}).reduce((a, b) => a + b, 0);
  },

  async confirmDistribution(playerId) {
    const player = this.state.players.find((p) => p.id === playerId);
    const total = this.allocatedTotal(player);
    if (total !== player.roundKills) return false; // must give out exactly the kills earned
    Object.entries(player.allocations).forEach(([targetId, count]) => {
      if (count <= 0) return;
      const target = this.state.players.find((p) => p.id === Number(targetId));
      target.totalVotes += count;
      target.pendingDrinks.push({
        id: `${Date.now()}-${targetId}`,
        fromName: player.name,
        count,
        round: this.state.meta.round,
        done: false,
      });
    });
    player.totalKills = (player.totalKills || 0) + (player.roundKills || 0);
    player.roundDistributed = true;
    await this.commit();
    return true;
  },

  /* ---- round lifecycle ---- */
  allSubmitted() {
    return this.state.players.every((p) => p.roundKills !== null && p.roundDistributed);
  },

  async setRoundWinner(playerId) {
    const prevId = this.state.meta.roundWinner;
    if (prevId) {
      const prev = this.state.players.find((pl) => pl.id === prevId);
      if (prev) prev.wins = Math.max(0, prev.wins - 1);
    }
    this.state.meta.roundWinner = playerId;
    if (playerId) {
      const p = this.state.players.find((pl) => pl.id === playerId);
      p.wins += 1;
    }
    await this.commit();
  },

  async closeRound() {
    const kills = {};
    const votes = {};
    this.state.players.forEach((p) => {
      kills[p.id] = p.roundKills || 0;
      votes[p.id] = p.totalVotes;
    });
    this.state.history.push({
      round: this.state.meta.round,
      kills,
      votes,
      winnerId: this.state.meta.roundWinner || null,
    });

    const finished = this.checkEndCondition();

    if (!finished) {
      this.state.meta.round += 1;
      this.state.meta.roundWinner = null;
      this.state.players.forEach((p) => {
        p.roundKills = null;
        p.roundDistributed = false;
        p.allocations = {};
        const usedTexts = p.missions.map((m) => m.text);
        p.missionSetCount = 1;
        p.seenMissions = [...(p.seenMissions || []), ...usedTexts];
        p.missions = pickMissions(3, p.seenMissions);
      });
    } else {
      this.state.meta.finished = true;
      this.assignPunishment();
    }
    await this.commit();
  },

  async revealPunishment() {
    this.state.meta.punishmentRevealed = true;
    await this.commit();
  },

  checkEndCondition() {
    const cond = this.state.meta.endCondition;
    if (cond.type === "games") {
      return this.state.meta.round >= cond.value;
    }
    if (cond.type === "wins") {
      return this.state.players.some((p) => p.wins >= cond.value);
    }
    if (cond.type === "time") {
      return this.state.meta.endTimestamp && Date.now() >= this.state.meta.endTimestamp;
    }
    return false; // 'manual' only ends via endGameNow()
  },

  assignPunishment() {
    if (this.state.meta.punishment) return; // already assigned
    const idx = Math.floor(Math.random() * PUNISHMENTS.length);
    this.state.meta.punishment = PUNISHMENTS[idx];
    this.state.meta.punishmentRevealed = false;
  },

  async endGameNow() {
    this.state.meta.finished = true;
    this.assignPunishment();
    await this.commit();
  },

  async toggleDrinkDone(playerId, drinkId) {
    const player = this.state.players.find((p) => p.id === playerId);
    const drink = player.pendingDrinks.find((d) => d.id === drinkId);
    if (drink) drink.done = !drink.done;
    await this.commit();
  },

  leaderboard() {
    return [...this.state.players].sort((a, b) => b.totalVotes - a.totalVotes);
  },

  loser() {
    if (!this.state.meta.finished) return null;
    return this.leaderboard()[0];
  },
};

window.Store = Store;
window.MISSION_POOL = MISSION_POOL;
window.PUNISHMENTS = PUNISHMENTS;
window.PRESET = PRESET;

import { loadLocalSongsCsv } from "./data.js";
import { getYoutubeID } from "./playerUtility.js";

/* =========================
   Global State
========================= */

let songs = [];
let tournament = null;
let leftSong = null;
let rightSong = null;
let currentlyPlaying = null;
let player;

/* =========================
   YouTube Player Setup
========================= */

let playerReadyPromise = new Promise((resolve) => {
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("player", {
      playerVars: { controls: 1 },
      events: {
        onReady: () => resolve(player),
        onError: (e) => console.error("YT Error", e)
      }
    });
  };
});

/* =========================
   Utilities
========================= */

function shuffle(arr) {
  return [...arr]
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v);
}

function getBattleEligibleSongs(allSongs) {
  return allSongs.filter(song =>
    song.categories &&
    !song.categories.some(c =>
      c.toLowerCase().includes("jingle")
    )
  );
}

/* =========================
   Tournament Logic
========================= */

function createTournament(allSongs, size = 32) {
  const pool = shuffle(getBattleEligibleSongs(allSongs)).slice(0, size);
  const matches = [];

  for (let i = 0; i < pool.length; i += 2) {
    matches.push([pool[i], pool[i + 1]]);
  }

  return {
    round: 1,
    matches,
    winners: [],
    currentMatchIndex: 0,
    rounds: [matches],           // store rounds for bracket
    winnersByRound: [[]]         // winners for each round
  };
}



function loadCurrentMatch() {
  const [a, b] = tournament.matches[tournament.currentMatchIndex];
  leftSong = a;
  rightSong = b;
  renderBattleUI(a, b);
  loadSong(a);
}

function pickWinner(song) {
  tournament.winners.push(song);
  tournament.currentMatchIndex++;

  if (tournament.currentMatchIndex >= tournament.matches.length) {
    advanceRound();
  } else {
    loadCurrentMatch();
  }
}

function advanceRound() {
  if (tournament.winners.length === 1) {
    // mark winners for this round
    tournament.winnersByRound[tournament.round - 1] = [...tournament.winners];
    showChampion(tournament.winners[0]);
    return;
  }

  // mark winners for this round
  tournament.winnersByRound[tournament.round - 1] = [...tournament.winners];

  tournament.round++;
  tournament.matches = [];
  tournament.currentMatchIndex = 0;

  for (let i = 0; i < tournament.winners.length; i += 2) {
    tournament.matches.push([tournament.winners[i], tournament.winners[i + 1]]);
  }

  tournament.rounds.push([...tournament.matches]); // save new round
  tournament.winners = [];
  loadCurrentMatch();
}

/* =========================
   Player Control
========================= */
async function loadSong(song) {
  currentlyPlaying = song;

  const id = getYoutubeID(song.youtube);
  await playerReadyPromise;

  player.stopVideo();          // important
  player.loadVideoById(id);
  player.playVideo();
  player.setVolume(10);
}


/* =========================
   UI Rendering
========================= */

function renderBattleUI(left, right) {
  document.getElementById("left-title").textContent =
    `${left.game} – ${left.title}`;
  document.getElementById("right-title").textContent =
    `${right.game} – ${right.title}`;

  document.getElementById("left-meta").textContent =
    left.categories?.join(", ") ?? "";
  document.getElementById("right-meta").textContent =
    right.categories?.join(", ") ?? "";

  document.getElementById("round-info").textContent =
    `Round ${tournament.round} · Match ${tournament.currentMatchIndex + 1}/${tournament.matches.length}`;
}

function showChampion(song) {
  const container = document.querySelector(".music-container");
  document.querySelector(".battle-container").style.display = "none";

  const roundInfo = document.getElementById("round-info");
  roundInfo.textContent = "🏆 CHAMPION 🏆";
  roundInfo.style.color = "#ffd866";

  const champContainer = document.createElement("div");
  champContainer.classList.add("champion-container");
  champContainer.style.display = "flex";
  champContainer.style.flexDirection = "column";
  champContainer.style.alignItems = "center";
  champContainer.style.gap = "12px";
  champContainer.style.marginTop = "20px";

  champContainer.innerHTML = `
    <div class="champion-card" style="text-align:center;">
      <h2 class="champion-title">${song.game}</h2>
      <h3 class="champion-song">${song.title}</h3>
      <p class="champion-meta">${song.categories?.join(" • ") ?? ""}</p>
    </div>
  `;

  container.appendChild(champContainer);

  // Show tournament size menu after champion
  showTournamentSizeMenu(container);

  loadSong(song);
  renderBracket(container);
}




/* =========================
   Event Wiring
========================= */

function wireUI() {
  document.getElementById("left-song").onclick = (e) => {
    if (!e.target.classList.contains("pick-btn")) {
      loadSong(leftSong);
    }
  };

  document.getElementById("right-song").onclick = (e) => {
    if (!e.target.classList.contains("pick-btn")) {
      loadSong(rightSong);
    }
  };

  document.getElementById("pick-left").onclick = () => pickWinner(leftSong);
  document.getElementById("pick-right").onclick = () => pickWinner(rightSong);
}

/* =========================
   Boot
========================= */

function startBattleMode(size = 16) {
  tournament = createTournament(songs, size);
  wireUI();
  loadCurrentMatch();
}


loadLocalSongsCsv().then((res) => {
  songs = res;
  const container = document.querySelector(".music-container");
  showTournamentSizeMenu(container); // user must pick size first
});


function renderBracket(container) {
  const oldBracket = document.querySelector(".bracket-container");
  if (oldBracket) oldBracket.remove();

  const bracketContainer = document.createElement("div");
  bracketContainer.classList.add("bracket-container");
  container.appendChild(bracketContainer);

  tournament.rounds.forEach((roundMatches, roundIdx) => {
    const column = document.createElement("div");
    column.classList.add("bracket-column");

    // Add round label
    const roundLabel = document.createElement("div");
    roundLabel.classList.add("round-label");
    roundLabel.textContent = `Round ${roundIdx + 1}`;
    column.appendChild(roundLabel);

    // Add matches
    roundMatches.forEach((match) => {
      const [a, b] = match;
      const matchCard = document.createElement("div");
      matchCard.classList.add("match-card");

      const winner =
        tournament.winnersByRound?.[roundIdx]?.find(
          (s) => s.title === a.title || s.title === b.title
        ) || null;

      matchCard.innerHTML = `
        <div class="song ${winner === a ? "winner" : ""}">${a.game} – ${a.title}</div>
        <div class="song ${winner === b ? "winner" : ""}">${b.game} – ${b.title}</div>
      `;

      // Click to play
      matchCard.querySelectorAll(".song").forEach((el, idx) => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          loadSong(idx === 0 ? a : b);
        });
      });

      column.appendChild(matchCard);
    });

    bracketContainer.appendChild(column);
  });
}

/* =========================
   Tournament Size UI
========================= */

function showTournamentSizeMenu(container) {
  const menu = document.createElement("div");
  menu.classList.add("champion-container"); // reuse styling
  menu.style.gap = "12px";
  menu.style.marginTop = "20px";
  menu.innerHTML = `<h2 style="color:#f5c542; text-align:center;">Select Tournament Size</h2>`;
  
  const sizes = [8, 16, 32, 64]; // available options
  sizes.forEach(size => {
    const btn = document.createElement("button");
    btn.classList.add("pick-btn");
    btn.textContent = `Top ${size}`;
    btn.onclick = () => {
      menu.remove();
      startBattleMode(size);
    };
    menu.appendChild(btn);
  });

  container.appendChild(menu);
}

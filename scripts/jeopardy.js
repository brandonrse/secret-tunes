import {
  loadLocalSongsCsv,
  gifs
} from './data.js';

import { 
  getAllCategories,
  getAllSeries,
  getRandInt,
  getRandomSong,
  getRandomSongByDifficultyCategorySeries,
  getSongsByCategories,
  getSongsByCategory,
  getSongsByCategoryOrSeries,
  getSongsByMultipleSeries,
  getYoutubeID,
 } from './playerUtility.js';

const settingsContainer = document.querySelector('.settings');
const categorySelects = document.querySelector('.category-select-div');
const seriesCheckDiv = document.querySelector('.series-check-div');
const playerCount = document.getElementById('playerCount');
const playerSelectContainer = document.querySelector('.player-select-div');
const newBoardButton = document.querySelector('.new-board-btn');

const gameContainer = document.querySelector('.game-container');
const backToBoard = document.getElementById('backToBoard');

const questionContainer = document.querySelector('.question-container');
const songTitleSpan = document.getElementById('span-name');
const songGameSpan = document.getElementById('span-game');
const revealSong = document.getElementById('revealSong');
const hintDiv = document.getElementById('hint-div');
const revealHint = document.getElementById('reveal-hint');
const categoryLabel = document.getElementById('category-difficulty');
const reroll = document.getElementById('reroll');

const colors = [
  'rgb(87, 4, 58)',
  'rgb(30, 30, 30)',
  'rgb(10, 30, 60)',
  'rgb(50, 5, 100)',
  'rgb(100, 20, 20)',
  'rgb(44, 107, 35)'
];


var allSongs;
var filteredSongs;
var filteredSongsBySeries;
var categories;
var selectedCategories = ['Adversary', 'Aquatic', 'Battle', 'Boss', 'Character'];
var series;
var selectedSeries = new Set();
var contestants = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8',];

loadLocalSongsCsv().then(
  (songs) => {
    setupData(songs)
  }
);

async function setupData(res) {
  allSongs = [...res];
  filteredSongs = [...res];
  categories = getAllCategories([...res]).sort();
  await setupCategories(categories);

  series = getAllSeries([...res]).sort();
  await setupSeries([...res]);
}

const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('navbarMenu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
});

let timerIndex = 0;

setInterval(() => {
  timerIndex = (timerIndex + 1) % colors.length;
  questionContainer.style.backgroundColor = colors[timerIndex];
}, 5000); // Change every 5 seconds

//#region YOUTUBE

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
    } else {
      // Inject script
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

      // Set up the global callback
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    }
  });
}

let player;

const playerReadyPromise = loadYouTubeAPI().then(() => {
  return new Promise((resolve) => {
    player = new YT.Player('player', {
      height: '0',
      width: '0',
      videoId: 'XUmufRvgXGk',
      playerVars: { controls: 1, loop: 1, playlist: 'XUmufRvgXGk' },
      events: {
        onReady: () => {
          console.log("Player is ready!");
          resolve(player);
        },
        onError: onPlayerError
      }
    });
  });
});

let playerListenersInitialized = false;

document.getElementById('play').addEventListener('click', () => {
  playerReadyPromise.then((player) => {
    if (!playerListenersInitialized) {
      monitorForLikelyAd(player);

      player.addEventListener('onStateChange', (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          const ct = player.getCurrentTime();
          if (ct < 1) {
            player.seekTo(1);
          }
        }
      });

      playerListenersInitialized = true;
    }

    player.playVideo(); // optional: auto-play
  });
});


document.getElementById('pause').addEventListener('click', () => player.pauseVideo());

document.getElementById('volume-slider').addEventListener('input', (event) => {
  const volume = event.target.value;
  player.setVolume(volume); // Set volume (0 to 100)
});

// If video gives an error, generate a random one
function onPlayerError(event) {
  const errorCode = event.data;
  console.log('Error: ', event);
  console.log('Error loading video: ' + errorCode);  
  console.log('Loading new random song...');
  loadSong(getRandomSong(filteredSongs));
}

let adMonitorIntervalStarted = false;

function monitorForLikelyAd(player) {
  if (adMonitorIntervalStarted) return;
  adMonitorIntervalStarted = true;

  let lastTime = 0;
  let stuckCounter = 0;

  setInterval(() => {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    const currentTime = player.getCurrentTime();

    if (currentTime === lastTime && currentTime < 2 && player.getPlayerState() === YT.PlayerState.PLAYING) {
      stuckCounter++;
    } else {
      stuckCounter = 0;
    }

    lastTime = currentTime;

    showAdWarning(stuckCounter >= 2);
  }, 1000);
}


function showAdWarning(show) {
  const el = document.getElementById('ad-warning');
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  el.textContent = show ? 'An ad is likely playing...' : '';
}


//#endregion

//#region SETTINGS

async function setupCategories(cat) {
  for (let i = 1; i < 6; i++) {
    let selectDiv = document.createElement('div');
    selectDiv.className = 'category-div';

    let selectLabel = document.createElement('label');
    selectLabel.htmlFor = `cat${i}`;
    selectLabel.innerHTML = `Category ${i}`;
    
    let select = document.createElement('select');
    select.className = 'form-select';
    select.id = `cat${i}`;

    cat.forEach(c => {
      let option = document.createElement('option');
      option.value = c;
      option.innerHTML = c;
      select.appendChild(option);
    });

    // Default value
    select.value = categories[i-1];

    select.addEventListener('change', (e) => {
      const selectedCategory = e.target.value;
      selectedCategories[i-1] = selectedCategory;
      filteredSongs = getSongsByCategories(allSongs, selectedCategories);
      setupSeries(filteredSongs);
    });

    selectDiv.appendChild(selectLabel);
    selectDiv.appendChild(select);
    categorySelects.appendChild(selectDiv);

    filteredSongs = getSongsByCategories(allSongs, selectedCategories);
    setupSeries(allSongs);
  }
}


async function setupSeries(songs) {
  const filteredSeries = getAllSeries(songs).sort();
  selectedSeries.clear();
  seriesCheckDiv.innerHTML = '';

  filteredSeries.forEach(s => {
    let checkDiv = document.createElement('div');
    checkDiv.className = 'form-check form-switch';
    let checkInput = document.createElement('input');
    checkInput.className = 'form-check-input series-input';
    checkInput.type = 'checkbox';
    checkInput.role = 'switch';
    checkInput.id = 'switchCheckSeries';
    checkInput.checked = true;
    let checkLabel = document.createElement('label');
    checkLabel.className = 'form-check-label';
    checkLabel.textContent = s;
    
    selectedSeries.add(s);

    checkInput.addEventListener('change', (e) => {
      const checked = e.target.checked;
      
      if (checked) {
        selectedSeries.add(s);
      }
      else {
        selectedSeries.delete(s);
      }
      filteredSongsBySeries = getSongsByMultipleSeries(songs, selectedSeries);

    });

    filteredSongsBySeries = getSongsByMultipleSeries(songs, selectedSeries);

    checkDiv.appendChild(checkInput);
    checkDiv.appendChild(checkLabel);
    seriesCheckDiv.appendChild(checkDiv);
  });
}

playerCount.addEventListener('change', (e) => {
  playerSelectContainer.innerHTML = '';
  const playerNum = e.target.valueAsNumber;

  for (let i = 1; i <= playerNum; i++) {
    let playerInput = document.createElement('input');
    playerInput.type = 'text';
    playerInput.className = 'form-control player-name player-name' + i;
    playerInput.id = 'playerName playerName' + i;
    playerInput.placeholder = 'Player ' + i;
    
    playerSelectContainer.appendChild(playerInput);
  }
});

newBoardButton.addEventListener('click', (e) => {
  e.preventDefault();
  gameContainer.innerHTML = '';

  // Category Titles
  const categoriesDiv = document.createElement('div');
  categoriesDiv.className = 'category-headers row';
  for (let i = 0; i < selectedCategories.length; i++) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'col-2 category-title';
    categoryDiv.innerHTML = selectedCategories[i];
    categoriesDiv.appendChild(categoryDiv);
  }
  gameContainer.appendChild(categoriesDiv);

  // Difficulties
  const gameButtonsDiv = document.createElement('div');
  gameButtonsDiv.className = 'game-buttons';

  for (let i = 0; i < selectedCategories.length; i++) {
    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'songs row mt-4';
    
    for (let j = 0; j < 5; j++) {
      const buttonDiv = document.createElement('div');
      const button = document.createElement('button');

      let buttonDifficulty = 'Easy';
      let buttonCategory = 'Battle';
      
      switch (i) {
        case 0:
          buttonDiv.className = 'col-2 song easy';
          button.className = `btn btn-easy btn-cat${j+1}`;
          button.innerHTML = 'Easy';
          buttonDifficulty = 'Easy';
          buttonCategory = selectedCategories[j];
          break;

        case 1:
          buttonDiv.className = 'col-2 song normal';
          button.className = `btn btn-normal btn-cat${j+1}`;
          button.innerHTML = 'Normal';
          buttonDifficulty = 'Normal';
          buttonCategory = selectedCategories[j];
          break;

        case 2:
          buttonDiv.className = 'col-2 song tough';
          button.className = `btn btn-tough btn-cat${j+1}`;
          button.innerHTML = 'Tough';
          buttonDifficulty = 'Tough';
          buttonCategory = selectedCategories[j];
          break;

        case 3:
          buttonDiv.className = 'col-2 song lunatic';
          button.className = `btn btn-lunatic btn-cat${j+1}`;
          button.innerHTML = 'Lunatic';
          buttonDifficulty = 'Lunatic';
          buttonCategory = selectedCategories[j];
          break;

        case 4:
          buttonDiv.className = 'col-2 song merciless';
          button.className = `btn btn-merciless btn-cat${j+1}`;
          button.innerHTML = 'Merciless';
          buttonDifficulty = 'Merciless';
          buttonCategory = selectedCategories[j];
          break;       

        default:
          buttonDiv.className = 'col-2 song easy';
          button.className = `btn btn-easy btn-cat${j+1}`;
          button.innerHTML = 'Easy';
          buttonDifficulty = 'Easy';
          buttonCategory = selectedCategories[j];
          break;
      }

      button.addEventListener('click', (e) => {
        resetSongInfo();
        setCategoryLabel(buttonCategory, buttonDifficulty);
        changeGif();
        gameContainer.classList.remove('show');
        questionContainer.classList.add('show');
        questionContainer.scrollIntoView({behavior: 'smooth'});
        chooseSong(buttonDifficulty, buttonCategory);
        button.style.display = 'none';
      });

      buttonDiv.appendChild(button);
      buttonsRow.appendChild(buttonDiv);
    }
    gameButtonsDiv.appendChild(buttonsRow);
  }
  gameContainer.appendChild(gameButtonsDiv);

  setupPlayers();

  gameContainer.classList.add('show');
  gameContainer.scrollIntoView({behavior: 'smooth'});
});

//#endregion

//#region GAME
revealHint.addEventListener('click', handleRevealHintClick);

// Go back to the jeopardy board
document.getElementById('backToBoard').addEventListener('click', () => {
  // questionScreen.classList.add('d-none');
  questionContainer.classList.remove('show');
  gameContainer.classList.add('show');
  gameContainer.scrollIntoView({behavior: 'smooth'});
  document.getElementById('span-game').textContent = '';
  document.getElementById('span-name').textContent = '???';
  player.pauseVideo();
});

function chooseSong(difficulty, category) {
  // console.log("Filtered Songs", filteredSongs);
  // console.log("Category:", category);
  const randomSong = getRandomSongByDifficultyCategorySeries(filteredSongs, difficulty, category, category);
  // console.log(randomSong);

  if (randomSong === null) {
    loadRandomSongByCategory(filteredSongs, category);
  }
  else {
    loadSong(randomSong)
    removeSong(filteredSongs, randomSong);
  }
}

async function loadSong(song) {
  setupSongInfo(song);
  const youtubeId = getYoutubeID(song.youtube);
  await playerReadyPromise;
  player.setVolume(10);
  player.loadPlaylist(youtubeId);
  player.loadVideoById(youtubeId);
}

async function loadRandomSongByCategory(songs, category) {
  const songsByCategory = getSongsByCategoryOrSeries(songs, category, category);
  let randomSong = getRandomSong(songsByCategory);

  setCategoryLabel(category, randomSong.difficulty);

  // If still no random song
  if (randomSong === null || randomSong === '' || randomSong === undefined) {
    randomSong = getRandomSong(allSongs);
    setCategoryLabel(randomSong.categories[0], randomSong.difficulty);
  }
  // console.log('Random song was null; new random song:', randomSong);
  loadSong(randomSong);
  removeSong(filteredSongs, randomSong);
}

function removeSong(songs, song) {
  const index = songs.indexOf(song);
  if (index !== -1) {
    songs.splice(index, 1);
  } else {
    console.log(`${song} does not exist in array ${songs}`);
  }
}

function setupSongInfo(song) {
  hintDiv.innerHTML = song.hints;

  // Enable or disable the hint button
  revealHint.disabled = !song.hints;

  // Reset to default state
  hintDiv.classList.add('d-none');
  revealHint.textContent = 'Reveal Hint';

  // Reveal song logic
  revealSong.onclick = () => {
    const [songGame, songTitle] = song.title.split(' ~ ');
    songGameSpan.textContent = songGame;
    songTitleSpan.textContent = songTitle;
  };

  // Reroll logic
  reroll.onclick = () => {
    resetSongInfo();
    changeGif();
    loadRandomSongByCategory(filteredSongs, song.categories[0]);
  };
}


function handleRevealHintClick(e) {
  e.preventDefault();
  if (revealHint.textContent === 'Reveal Hint') {
    hintDiv.classList.remove('d-none');
    revealHint.textContent = 'Hide Hint';
  }
  else {
    hintDiv.classList.add('d-none');
    revealHint.textContent = 'Reveal Hint';
  }
}

function resetSongInfo() {
  songTitleSpan.textContent = '???';
  songGameSpan.textContent = '';

  hintDiv.classList.add('d-none');
  revealHint.textContent = 'Reveal Hint';
}

function setCategoryLabel(category, difficulty) {
  categoryLabel.textContent = `${category}: ${difficulty}`;
}

function setupPlayers() {
  const contestantsDiv = document.createElement('div');
  contestantsDiv.className = 'container contestant-container';

  for (let i = 0; i < playerSelectContainer.children.length; i++) {
    let playerName = playerSelectContainer.children[i].value;
    if (playerName !== '') {
      contestants[i] = playerName;
    }
    else {
      playerName = contestants[i] || `Player ${i}`;
    }
    
    const contestantDiv = document.createElement('div');
    contestantDiv.className = 'contestant'; 

    const contestantName = document.createElement('p');
    contestantName.textContent = playerName;
    contestantName.className = 'contestant-name';

    const contestantScore = document.createElement('input');
    contestantScore.type = 'number';
    contestantScore.id = 'contestantScore';
    contestantScore.className = 'form-control';

    contestantDiv.appendChild(contestantName);
    contestantDiv.appendChild(contestantScore);
    contestantsDiv.appendChild(contestantDiv);
  }
  gameContainer.appendChild(contestantsDiv);
  
}

function changeGif() {
  questionContainer.style.backgroundImage = gifs[getRandInt(0, gifs.length)];
}

//#endregion

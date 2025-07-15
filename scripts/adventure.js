import { 
  loadLocalSongsCsv,
  loadLocalAdventureCsv
} from "./data.js";
import { 
  getRandInt,
  getRandomSong,
  getSongsByDifficulty,
  getYoutubeID,
  hasDuplicateSongName,
  getSongName,
  getUnplayedSongs,
  getSongsByCategory,
  getSongsBySeries,
  getCharactersByCategories,
  getCharactersByDifficulty, 
  getCharactersBySeries,
  getGameName,
  getSongsWithoutCategory
} from "./playerUtility.js";

var songs;
var characters;
var characterUrl = './assets/images/adventure/enemies/';
var chosenSong;
var chosenProperty;
var chosenCharacter;
var gameOver;
var nextStage;
var chosenMacguffin = '';

const songsDataList = document.getElementById('songDataListOptions');
const adventureBackground = document.querySelector('.adventure-background');
const adventureOptionsDiv = document.querySelector('.adventure-options');
const adventureTextBox = document.querySelector('.adventure-text-box');
const guessBtn = document.querySelector('.guess-btn');
const categoryLabel = document.querySelector('.category-label');
const musicDiv = document.querySelector('.music-container');
const stickerContainer = document.querySelector('.sticker-container');
const macguffinContainer = document.querySelector('.macguffin-container');
const levelLabel = document.querySelector('.level-label');

const macguffinsUrl = '../assets/images/adventure/items/';
const macguffins = [
  'Ancient Debris',
  'Attorney\'s Badge',
  'Blue-Eyes White Dragon',
  'Chaos Emeralds',
  'Core Crystal',
  'Cosmic Drive Key',
  'Fire Emblem',
  'Franklin Badge',
  'Gold Nugget',
  'Jiggy',
  'Judgement Arcana',
  'Master Ball',
  'Materia',
  'Oathkeeper & Oblivion',
  'Power Moon',
  'Power Seal',
  'Real Knife',
  'Screw Attack',
  'Solar Flare',
  'Star Rod',
  'Strawberry',
  'Sunken Scroll',
  'Thievius Racoonus',
  'Triforce',
  'Wii Remote'
];

const appearanceTexts = [
  'appears!',
  'draws near!',
  'attacks!',
  'approaches.',
  'stares at you.',
  'questions your existence.',
  'glares.',
  'grinds their teeth.',
  'scratches their cheek.',
  'is antsy.',
  'brandishes their weapon.',
  'nods.',
  'takes a deep breath.',
  'looks at you with understanding.',
  'braces themselves.'
];


let playerState = {
  level: 1,
  exp: 0,
  inventory: {
    retry: 0,
    letterReveal: 0,
    hintReveal: 0,
    reroll: 0,
    doubleExp: 0
  },
  obtainedMacguffins: [],
  defeatedCharacters: [],
  playedSongs: []
}

loadLocalSongsCsv().then(
  (songs) => {
    loadLocalAdventureCsv().then(
      (ent) => {
        setup(songs, ent);
      }
    )
  }
);

function setup(res, entities) {
  songs = res;
  characters = entities;
  // console.log(songs);
  // console.log(entities);
  if (localStorage.getItem('playerState')) {
    playerState = JSON.parse(localStorage.getItem('playerState'));
    levelLabel.innerHTML = `Level: ${playerState.level} <br />Exp: ${playerState.exp}`;
  }
  loadAllStickers(playerState.defeatedCharacters);
  loadAllMacguffins(playerState.obtainedMacguffins);
  setupDataList(songs);
  setupStages();
}

function reset() {
  resetPlayerState();
  stickerContainer.innerHTML = '';
  macguffinContainer.innerHTML = '';
  setupStages();
}

function resetPlayerState() {
  playerState = {
    level: 1,
    exp: 0,
    inventory: {
      retry: 0,
      letterReveal: 0,
      hintReveal: 0,
      reroll: 0,
      doubleExp: 0
    },
    obtainedMacguffins: [],
    defeatedCharacters: [],
    playedSongs: []
  };
  levelLabel.innerHTML = `Level: ${playerState.level} <br />Exp: ${playerState.exp}`;
}

let player;

let playerReadyPromise = new Promise((resolve) => {
  window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('player', {
    height: '0', // Hide the video
    width: '0',  // Hide the video
    videoId: 'XUmufRvgXGk', // Replace with video ID
    playerVars: { 'controls': 0, 'loop': 1, 'playlist':'XUmufRvgXGk' },
    events: {
      'onError': onPlayerError,
      'onReady': (event) => {
        console.log('player ready');
        resolve(player);
      }
    }
  });
  }
});

// Add event listeners for custom controls
document.getElementById('play').addEventListener('click', () => {
  playerReadyPromise.then(() => {
    player.playVideo();
  })
});
document.getElementById('pause').addEventListener('click', () => player.pauseVideo());

document.getElementById('volume-slider').addEventListener('input', (event) => {
  const volume = event.target.value;
  player.setVolume(volume); // Set volume (0 to 100)
});

// If video gives an error, generate a random one
function onPlayerError(event) {
  const errorCode = event.data;
  playerState.playedSongs.push(chosenSong.title);
  console.log('Error: ', event);
  console.log('Error loading video: ' + errorCode);  
  console.log('Loading new random song...');
  loadAnotherRandomSong(songs);
}

guessBtn.addEventListener('click', function() {
  const songInput = document.getElementById('songDataList');
  const songInputValue = songInput.value;
  const characterImg = document.querySelector('.adventure-character');

  if (gameOver) {
    reset();
    return;
  }
  if (nextStage) {
    setupStages();
    return;
  }

  let chosenSongName = '';
  if (hasDuplicateSongName(songs, getSongName(chosenSong.title))) {
    chosenSongName = chosenSong.title;
  } else {
    chosenSongName = getSongName(chosenSong.title)
  }
  // console.log('chosen song name', chosenSongName);
  // console.log('chosen song', chosenSong);
  // console.log('inputted', songInputValue);
  
  if (chosenSongName === songInputValue) {
    console.log('correct!');
    playerState.playedSongs.push(chosenSong.title);

    playerState.exp += getExpByDifficulty(chosenSong.difficulty);
    levelUp();

    levelLabel.innerHTML = `Level: ${playerState.level} <br />Exp: ${playerState.exp}`;
    if (chosenMacguffin !== '') {
      changeTextBoxText(`You successfully guessed the song <span class="song-title">${getSongName(chosenSong.title)}</span> from <span class="game-title">${getGameName(chosenSong.title)}</span> and defeated <span class="character-name">${chosenCharacter.title}</span>! In addition, you've obtained the <span class="macguffin-title">${chosenMacguffin}!</span>`);
      playerState.obtainedMacguffins.push(chosenMacguffin);
      addMacguffin(chosenMacguffin);
      chosenMacguffin = '';
    } else {
      changeTextBoxText(`You successfully guessed the song <span class="song-title">${getSongName(chosenSong.title)}</span> from <span class="game-title">${getGameName(chosenSong.title)}</span> and defeated <span class="character-name">${chosenCharacter.title}</span>!`);
    }
    characterImg.classList.add('defeated');
    guessBtn.textContent = 'Next';
    nextStage = true;
    songInput.value = '';
    playerState.defeatedCharacters.push(chosenCharacter.title);
    addSticker(chosenCharacter.title);
    localStorage.setItem('playerState', JSON.stringify(playerState));

  } else {
    console.log('wrong');
    changeTextBoxText(`You failed to guess the song ${getSongName(chosenSong.title)} from ${getGameName(chosenSong.title)}... GAME OVER.`);
    guessBtn.textContent = 'Restart';
    gameOver = true;
    localStorage.clear();
  }
})

function setupDataList(songs) {
  songs.forEach(song => {
    let songOption = document.createElement('option');
    if (hasDuplicateSongName(songs, getSongName(song.title))) {
      songOption.value = song.title;
    } else {
      songOption.value = getSongName(song.title);
    }
    songsDataList.appendChild(songOption);
  });
}

function setupStages() {
  guessBtn.textContent = 'Submit';
  document.getElementById('songDataList').textContent = '';
  const adventureOptions = document.querySelectorAll('.adventure-option');
  chosenSong = '';
  chosenProperty = '';
  chosenCharacter = '';
  gameOver = false;
  nextStage = false;
  categoryLabel.innerHTML = '';
  musicDiv.classList.add('d-none');
  adventureOptionsDiv.classList.remove('d-none');    
  changeTextBoxText('Pick a stage!');

  // Remove old character if any
  if (adventureBackground.firstChild) {
    adventureBackground.removeChild(adventureBackground.firstChild);
  }


  adventureOptions.forEach((opt) => {
    opt.classList.remove('slide-right');
    opt.innerHTML = '';
    opt.style.pointerEvents = 'auto';
  });

  adventureOptions.forEach((opt) => {
    let randomDifficulty = pickDifficulty(playerState.level);
    let randomSong;
   
    const songsByDifficulty = getSongsByDifficulty(songs, randomDifficulty);
    const unplayedSongs = getUnplayedSongs(songsByDifficulty, playerState.playedSongs);

    let randomSongProperty;
    if (playerState.obtainedMacguffins.length % 10 === 0 && playerState.obtainedMacguffins.length !== 0) {
      randomSongProperty = 'Final Boss';
      const finalBossSongs = getSongsByCategory(unplayedSongs, 'Final Boss');
      randomSong = getRandomSong(finalBossSongs);
    } else {
      const nonFinalBossSongs = getSongsWithoutCategory(unplayedSongs, 'Final Boss');
      randomSong = getRandomSong(nonFinalBossSongs);
      randomSongProperty = getRandomSongProperty(randomSong);
    }

    // Display option text
    const songTitleP = document.createElement('p');
    songTitleP.textContent = randomSongProperty === 'Pokemon' ? correctPokemonSpelling() : randomSongProperty;
    opt.appendChild(songTitleP);

    const songDifficultyP = document.createElement('p');
    songDifficultyP.textContent = randomDifficulty;
    songDifficultyP.className = 'option-' + randomDifficulty.toLowerCase();
    opt.appendChild(songDifficultyP);

    // Remove previous click listeners if any (defensive)
    const newOpt = opt.cloneNode(true);
    opt.replaceWith(newOpt);

    newOpt.addEventListener('click', () => {
      // Disable all options
      document.querySelectorAll('.adventure-option').forEach((el) => {
        el.classList.add('slide-right');
        el.style.pointerEvents = 'none';
      });

      newOpt.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
          adventureOptionsDiv.classList.add('d-none');    
          chosenProperty = randomSongProperty;    
          chosenSong = randomSong;

          if (chosenSong.difficulty === 'Lunatic' || chosenSong.difficulty === 'Merciless' && getRandInt(0, 2) < 1) {
            const remainingMacguffins = macguffins.filter(m => !playerState.obtainedMacguffins.includes(m));

            if (remainingMacguffins.length === 0) {
              chosenMacguffin = '';
            } else {
              chosenMacguffin = remainingMacguffins[getRandInt(0, remainingMacguffins.length)];
            }
          }

          loadSong(randomSong);    
          categoryLabel.innerHTML = newOpt.innerHTML;
          setupRandomCharacter(randomSong);
          musicDiv.classList.remove('d-none');
        }
      }, { once: true });
    });
  });
}


function setupRandomCharacter(song) {
  let filteredCharactersDifficulty = getCharactersByDifficulty(characters, song.difficulty);
  let filteredCharacters = filteredCharactersDifficulty.filter((c) => !playerState.defeatedCharacters.includes(c.title));
  let randomCharacter;
  const randNum = getRandInt(0, 2); 
  if (randNum < 1) {
    let randomCategory = song.categories[getRandInt(0, song.categories.length)];
    let randomCharacterByCategory = getCharactersByCategories(filteredCharacters, randomCategory);
    if (randomCharacterByCategory.length > 0) {
      randomCharacter = randomCharacterByCategory[getRandInt(0, randomCharacterByCategory.length)];
    } else {
      randomCharacter = filteredCharacters[getRandInt(0, filteredCharacters.length)];
    }
  } else {
    let randomSeries = song.series[getRandInt(0, song.series.length)];
    let randomCharacterBySeries = getCharactersBySeries(filteredCharacters, randomSeries);
    if (randomCharacterBySeries.length > 0) {
      randomCharacter = randomCharacterBySeries[getRandInt(0, randomCharacterBySeries.length)];
    } else {
      randomCharacter = filteredCharacters[getRandInt(0, filteredCharacters.length)];
    }
  }
  chosenCharacter = randomCharacter;

  const characterImg = document.createElement('img');
  characterImg.src = characterUrl + randomCharacter.title + '.webp';
  characterImg.alt = randomCharacter.title;
  characterImg.classList.add('adventure-character');

  adventureBackground.insertBefore(characterImg, adventureBackground.firstChild);
  const appearanceMsg = appearanceTexts[getRandInt(0, appearanceTexts.length)];
  changeTextBoxText(randomCharacter.title + ' ' + appearanceMsg);
}

function changeTextBoxText(text) {
  adventureTextBox.innerHTML = text;
}

/**
 * Returns exp gained based on the difficulty
 * @param {string} difficulty 
 * @returns number
 */
function getExpByDifficulty(difficulty) {
  let exp = 0;
  switch (difficulty) {
    case 'Easy':
      exp = Math.max(Math.floor(100 / (1 + playerState.level * 0.1)), 5);
      break;
    case 'Normal':
      exp = Math.max(Math.floor(150 / (1 + playerState.level * 0.1)), 5);
      break;
    case 'Tough':
      exp = Math.max(Math.floor(180 / (1 + playerState.level * 0.1)), 5);
      break;
    case 'Lunatic':
      exp = Math.max(Math.floor(220 / (1 + playerState.level * 0.1)), 5);
      break;
    case 'Merciless':
      exp = Math.max(Math.floor(300 / (1 + playerState.level * 0.1)), 5);
      break;
    default:
      break;
  }
  return exp;
}

function getDifficultyWeights(level) {
  const lvl = Math.min(level, 100);

  const weights = {
    Easy: Math.max(100 - lvl * 2, 0),         // Drops fast
    Normal: Math.max(100 - lvl * 1.5, 5),     // Drops slower
    Tough: Math.min(lvl * 1.2, 100),          // Rises
    Lunatic: Math.max(0, lvl - 10),           // Starts appearing after level 10
    Merciless: Math.max(0, lvl - 20) * 1.5    // Starts appearing after level 20
  };

  return weights;
}

function pickDifficulty(level) {
  const weights = getDifficultyWeights(level);
  const entries = Object.entries(weights);

  const totalWeight = entries.reduce((sum, [_, w]) => sum + w, 0);

  let rand = Math.random() * totalWeight;

  for (const [difficulty, weight] of entries) {
    if (rand < weight) return difficulty;
    rand -= weight;
  }

  return "Easy"; // fallback
}

function getRandomDifficulty() {
  let randNum = getRandInt(0, 100);
  let difficulty = 'Normal';
  // 0-4
  if (randNum < 5) {
    difficulty = 'Merciless';
  } 
  // 5-19
  else if (randNum < 19) { 
    difficulty = 'Lunatic';
  }
  // 20-39
  else if (randNum < 39) {
    difficulty = 'Tough';
  }
  // 40-74
  else if (randNum < 64) {
    difficulty = 'Normal';
  }
  else {
    difficulty = 'Easy';
  }
  return difficulty;
}

function levelUp() {
  let expNeeded = Math.pow(playerState.level + 1, 3);
  while (playerState.exp > expNeeded) {
    playerState.level += 1;
    expNeeded = Math.pow(playerState.level + 1, 3);
  }
}

function getRandomSongProperty(song) {
  let randPropertyValue = '';
  let randProperty = getRandInt(0, 2);
  if (randProperty < 1) {
    randPropertyValue = song.categories[getRandInt(0, song.categories.length)];
  } else {
    randPropertyValue = song.series[getRandInt(0, song.series.length)];
  }
  return randPropertyValue;
}

function getRandomPropertyName() {
  let randPropertyValue = '';
  let randProperty = getRandInt(0, 2);
  if (randProperty < 1) {
    randPropertyValue = 'categories';
  } else {
    randPropertyValue = 'series';
  }
  return randPropertyValue;
}

function correctPokemonSpelling() {
  return 'Pokémon';
}

async function loadSong(song) {
  // console.log('song loaded: ', song);
  const youtubeId = getYoutubeID(song.youtube);
  await playerReadyPromise;
  player.setVolume(10);
  player.loadPlaylist(youtubeId);
  player.loadVideoById(youtubeId);
}

async function loadRandomSong(songs) {
  const unplayedSongs = getUnplayedSongs(songs, playerState.playedSongs);
  chosenSong = getRandomSong(unplayedSongs);
  const youtubeId = getYoutubeID(chosenSong.youtube);
  await playerReadyPromise;
  player.setVolume(10);
  player.loadPlaylist(youtubeId);
  player.loadVideoById(youtubeId);
}

async function loadAnotherRandomSong(songs) {
  const unplayedSongs = getUnplayedSongs(songs, playerState.playedSongs);
  const songsByDifficulty = getSongsByDifficulty(unplayedSongs, chosenSong.difficulty);
  let filteredSongs = getSongsByCategory(songsByDifficulty, chosenProperty);
  if (filteredSongs.length === 0) {
    filteredSongs = getSongsBySeries(songs, chosenProperty);
  }
  const randomSong = getRandomSong(filteredSongs);
  chosenSong = randomSong;
  loadSong(randomSong);
}

function loadAllStickers(stickers) {
  if (stickers.length === 0) { return; } 
  stickers.forEach((c) => {
    const img = document.createElement('img');
    img.className = 'sticker-img';
    img.src = characterUrl + c + '.webp';
    img.alt = c;
    stickerContainer.appendChild(img);
  });
}

function addSticker(name) {
  const img = document.createElement('img');
  img.className = 'sticker-img';
  img.src = characterUrl + name + '.webp';
  img.alt = name;
  stickerContainer.appendChild(img);
}


function loadAllMacguffins(macguffins) {
  if (macguffins.length === 0) { return; } 
  macguffins.forEach((c) => {
    const img = document.createElement('img');
    img.className = 'macguffin-img';
    img.src = macguffinsUrl + c + '.webp';
    img.alt = c;
    macguffinContainer.appendChild(img);
  });
}

function addMacguffin(name) {
  const img = document.createElement('img');
  img.className = 'macguffin-img';
  img.src = macguffinsUrl + name + '.webp';
  img.alt = name;
  macguffinContainer.appendChild(img);
}

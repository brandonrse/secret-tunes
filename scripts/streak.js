import { 
  getRandInt, 
  getYoutubeID, 
  getSongName, 
  getRandomSong, 
  getUnplayedSongs, 
  isSongInArrayByTitle, 
  hasDuplicateSongName,
  getGameName
} from "./playerUtility.js";

var songsCsv = []; // CSV songs array
var songsData = [];
var songCategories = [];
var songSeries = [];
let player; // The youtube video player
let randomSong;
let score = 0;
var playedSongs = new Set();
let gameOver = false;
let unplayedSongs = [];

const songsDataList = document.getElementById('songDataListOptions');
const container = document.querySelector('.song-container');
const streakBtn = document.querySelector('.streak-btn');
const scoreText = document.querySelector('.score');
const highScoreText = document.querySelector('.high-score');
const songGameText = document.querySelector('.song-game');
const songTitleText = document.querySelector('.song-title');
const resultText = document.querySelector('.result');


const colors = [
  'rgb(87, 4, 58)',
  'rgb(30, 30, 30)',
  'rgb(10, 30, 60)',
  'rgb(50, 5, 100)',
  'rgb(100, 20, 20)',
  'rgb(44, 107, 35)'
];

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
})
// function onYouTubeIframeAPIReady() {
//   player = new YT.Player('player', {
//     height: '0', // Hide the video
//     width: '0',  // Hide the video
//     videoId: 'XUmufRvgXGk', // Replace with video ID
//     playerVars: { 'controls': 0, 'loop': 1, 'playlist':'XUmufRvgXGk' },
//     events: {
//       'onError': onPlayerError,
//       'onReady': onPlayerReady
//     }
//   });
// }


const timerElement = document.getElementById('timer');
function startCountdown(duration, displayElement, callback) {
  let timeLeft = duration;
  displayElement.textContent = timeLeft;
  const countdown = setInterval(() => {
    timeLeft -= 1;
    displayElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      if (typeof callback === 'function') {
        callback();
      }
    }
  }, 1000)
}

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

// Load the YouTube IFrame API script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

// If video gives an error, generate a random one
function onPlayerError(event) {
  const errorCode = event.data;
  playedSongs.add(randomSong.title);
  console.log('Error loading video: ' + errorCode);  
  console.log('Loading new random song...');
  loadRandomSong(songsCsv);
}

let index = 0;

setInterval(() => {
  index = (index + 1) % colors.length;
  container.style.backgroundColor = colors[index];
}, 5000); // Change every 5 seconds

streakBtn.addEventListener('click', streakFormSubmit);

// Reads the inputted csv file
document.getElementById('songsCsv').addEventListener('change', async function(event) {
  // const file = event.target.files[0];
  const file = await fetch('./Songs Spreadsheet - Songs.csv');

  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const text = e.target.result;
          songsCsv = parseCSV(text); 
          songsData = structuredClone(songsCsv); // Copies the csv into songs data
          setupSongs(songsCsv); 
          setupDataList(songsCsv);
      };
      reader.readAsText(file);
  }
});
loadLocalCsv();
async function loadLocalCsv() {
  const response = await fetch('./Songs Spreadsheet - Songs.csv');
  const file = await response.text();
  if (file) {
      songsCsv = parseCSV(file); 
      console.log('songs', songsCsv);
      songsData = structuredClone(songsCsv); 
      setupSongs(songsCsv); 
      setupDataList(songsCsv);
      loadRandomSong(songsCsv);
      highScoreText.innerHTML = 'High Score: ' + getHighScore();
  };
}

function parseCSV(csvString) {
  const rows = csvString.trim().split('\n'); // Split rows
  const dataRows = rows.slice(1); // Skip the first row
  return dataRows.map(row => {
      const fields = parseRow(row);
      return {
          title: fields[0]?.trim() || '',
          categories: fields[1] ? parseArray(fields[1]) : [],
          difficulty: fields[2]?.trim() || '',
          hints: fields[3]?.trim() || null,
          series: fields[4] ? parseArray(fields[4]) : [],
          youtube: fields[5]?.trim() || '',
      };
  });
}
// Helper function for parseCSV
function parseRow(row) {
  // Regex to split CSV respecting quoted fields
  const regex = /"(.*?)"|([^,]+)|(?<=,)(?=,)/g;
  const matches = [...row.matchAll(regex)];
  return matches.map(match => (match[1] || match[2] || '').trim());
}
// Helper function for parseCSV(csvString)
function parseArray(value) {
  return value.split(',').map(item => item.trim());
}

function setupSongs(songs) {
  songCategories = [...new Set(songs.flatMap(s => s.categories))].sort();
  songSeries = [...new Set(songs.flatMap(s => s.series))].sort();
}

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

async function loadRandomSong(songs) {
  const unplayedSongs = getUnplayedSongs(songs, playedSongs);
  randomSong = getRandomSong(unplayedSongs);
  // console.log('random song:', randomSong);
  const youtubeId = getYoutubeID(randomSong.youtube);
  await playerReadyPromise;
  player.setVolume(10);
  player.loadPlaylist(youtubeId);
  player.loadVideoById(youtubeId);
}

function streakFormSubmit(event) {
  if (gameOver) {
    restart();
    gameOver = false;
    return;
  }
  if (playedSongs.size === songsCsv.length) {
    resultText.textContent = 'Congratulations! You\'ve guessed every available song!';
    gameOver = true;
    streakBtn.textContent = 'Restart'
    return;
  }
  const songInput = document.getElementById('songDataList');
  const songInputValue = songInput.value;
  let randomSongName = '';
  songTitleText.innerHTML = getSongName(randomSong.title);
  songGameText.innerHTML = getGameName(randomSong.title);
  if (hasDuplicateSongName(songsCsv, getSongName(randomSong.title))) {
    randomSongName = randomSong.title;
  } else {
    randomSongName = getSongName(randomSong.title)
  }
  if (randomSongName === songInputValue) {
    streakBtn.disabled = true;
    console.log('Correct! Choosing next song...');
    resultText.innerHTML = '✔️';
    songInput.innerHTML = '';
    songInput.value = '';
    score += 1;
    scoreText.innerHTML = 'Score: ' + score;
    if (score > getHighScore()) {
      highScoreText.innerHTML = 'High Score: ' + score;
      localStorage.setItem('highScore', score);
    }
    playedSongs.add(randomSong.title);
    timerElement.style.display = 'block';
    
    startCountdown(5, timerElement, () => {
      songTitleText.innerHTML = '???'
      songGameText.innerHTML = '?????'
      resultText.textContent = '';
      timerElement.textContent = '';
      loadRandomSong(songsCsv);
      streakBtn.disabled = false;
      timerElement.style.display = 'none';
    });
    
  } else {
    console.log('Game Over! Try again.');
    gameOver = true;
    resultText.textContent = '❌'
    scoreText.textContent = 'Score: ' + score;
    streakBtn.textContent = 'Restart'
    if (score > getHighScore()) {
      highScoreText.value = 'High Score: ' + score;
      localStorage.setItem('highScore', score);
    }

  }
}

function getHighScore() {
  return parseInt(localStorage.getItem('highScore')) || 0;
}

function restart() {
  playedSongs.clear();
  score = 0;
  scoreText.textContent = 'Score: ' + score;
  songTitleText.innerHTML = '???';
  songGameText.innerHTML = '?????';
  resultText.textContent = '';
  streakBtn.textContent = 'Submit';
  document.getElementById('songDataList').value = '';
  loadRandomSong(songsCsv);
}
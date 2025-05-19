var songsJson = []; // Old Json array of the songs
var songsCsv = []; // CSV songs array
var songsData = [];
var songCategories = []; // All the categories in the csv
var songSeries = []; // All the series in the csv
var player; // The youtube video player
var chosenSong; // The chosen song to play
var songsByCategory; // The songs by their category
var playerCount = 0;

const buttons = document.querySelectorAll('.songs button');
var categories = document.querySelectorAll('.category-title');
const questionScreen = document.getElementById('questionScreen');
const questionText = document.getElementById('questionText');
const backToBoard = document.getElementById('backToBoard');
const gameContainer = document.querySelector('.game-container');

var chosenDifficulty;
var chosenCategory;
var chosenSeries = [];
var videoUnavailable = false;
var rerollAny = false;

const container = document.querySelector('.question-container');

const colors = [
  'rgb(87, 4, 58)',
  'rgb(30, 30, 30)',
  'rgb(10, 30, 60)',
  'rgb(50, 5, 100)',
  'rgb(100, 20, 20)',
  'rgb(44, 107, 35)'
];

let index = 0;

setInterval(() => {
  index = (index + 1) % colors.length;
  container.style.backgroundColor = colors[index];
}, 5000); // Change every 5 seconds

// Reads the inputted csv file
document.getElementById('songsCsv').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const text = e.target.result;
          songsCsv = parseCSV(text); // Call a parseCSV function (see below)
          songsData = structuredClone(songsCsv); // Copies the csv into songs data
          setupSongs(songsCsv); // sets up the categories, series, and chosen series
          setupSelects(songCategories, songSeries)
          setupSelectChecks(songSeries); // Sets up the switches
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
      songsData = structuredClone(songsCsv); 
      setupSongs(songsCsv); 
      setupSelects(songCategories, songSeries)
      setupSelectChecks(songSeries); // Sets up the switches
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

document.getElementById('reset-btn').addEventListener('click', () => {
  buttons.forEach(b => {
    b.style.display = '';
  });  
});

document.getElementById('backToBoard').addEventListener('click', () => {
  // questionScreen.classList.add('d-none');
  gameContainer.scrollIntoView({behavior: 'smooth'});
  document.getElementById('span-game').textContent = '';
  document.getElementById('span-name').textContent = '???';
  player.pauseVideo();
});

document.getElementById('reroll').addEventListener('click', () => {
  videoUnavailable = false;

  if (songsByCategory.length <= 0 || rerollAny) {
    chosenSong = getRandomSong(songsData);
  } else {
    chosenSong = getRandomSong(songsByCategory);
  }
  resetHintButtons();

  if (chosenSong.hints == null) {
    document.getElementById('reveal-hint').disabled = true;
    document.getElementById('reveal-hint').style.cursor = 'not-allowed';
  } else {
    document.getElementById('reveal-hint').disabled = false;
    document.getElementById('reveal-hint').style.cursor = 'pointer';
  }

  document.getElementById('category-difficulty').textContent = chosenSong.categories[0] + ': ' + chosenSong.difficulty;
  let youtubeId = getYoutubeID(chosenSong.youtube);
  document.getElementById('span-game').textContent = '';
  document.getElementById('span-name').textContent = '???';
  player.loadVideoById(youtubeId);
  // console.log("REROLLED SONG", chosenSong);
  // window.alert('Title: ' + chosenSong.title + '\nDifficulty: ' + chosenSong.difficulty + '\nSeries: ' + chosenSong.series + '\nCategories: ' + chosenSong.categories);
  // console.log('Title: ' + chosenSong.title + '\nDifficulty: ' + chosenSong.difficulty + '\nSeries: ' + chosenSong.series + '\nCategories: ' + chosenSong.categories);
});

document.getElementById('rerollAny').addEventListener('change', (e) => { 
  rerollAny = e.target.checked; 
  console.log("Reroll is now set to", rerollAny);
})

document.getElementById('revealSong').addEventListener('click', () => {
  let songTitleSplit = chosenSong.title.split(' ~ ');
  let songGame = songTitleSplit[0];
  let songName = songTitleSplit[1];
  document.getElementById('span-game').textContent = songGame;
  document.getElementById('span-name').textContent = songName;
});

document.getElementById('reveal-hint').addEventListener('click', () => {
  let hintDiv = document.getElementById('hint-div')
  let hintBtn = document.getElementById('reveal-hint');
  if (hintBtn.textContent == 'Reveal Hint') {
    hintDiv.innerHTML = chosenSong.hints;
    hintDiv.classList.remove('d-none');
    hintBtn.textContent = 'Hide Hint';
  }
  else {
    hintDiv.classList.add('d-none');
    hintBtn.textContent = 'Reveal Hint';
  }
});

buttons.forEach(button => {
  button.addEventListener('click', () => {
    button.style.display = 'none';

    // Reset Hint Buttons
    resetHintButtons();

    document.getElementById('span-game').textContent = '';
    document.getElementById('span-name').textContent = '???';
    // questionScreen.classList.remove('d-none');

    chosenDifficulty = getButtonDifficulty(button);
    chosenCategory = getButtonCategory(button);

    setChosenSong();
  });
});

function resetHintButtons() {
  let hintDiv = document.getElementById('hint-div');
  hintDiv.classList.add('d-none');
  
  let hintBtn = document.getElementById('reveal-hint');
  hintBtn.textContent = 'Reveal Hint';
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '0', // Hide the video
    width: '0',  // Hide the video
    videoId: 'XUmufRvgXGk', // Replace with video ID
    playerVars: { 'controls': 0, 'loop': 1, 'playlist':'XUmufRvgXGk' },
    events: {
      'onError': onPlayerError,
      'onReady': onPlayerReady
    }
  });
}

// Add event listeners for custom controls
document.getElementById('play').addEventListener('click', () => player.playVideo());
document.getElementById('pause').addEventListener('click', () => player.pauseVideo());

document.getElementById('volume-slider').addEventListener('input', (event) => {
  const volume = event.target.value;
  player.setVolume(volume); // Set volume (0 to 100)
});

// Load the YouTube IFrame API script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

// NO LONGER USING
document.getElementById('series-select').addEventListener('change' , () => {
  let seriesValue = document.getElementById('series-select').value;
  // console.log('seriesvalue', seriesValue);
  if (seriesValue == 'All') {
    songsData = structuredClone(songsCsv);
  }
  else {
    songsData = songsCsv.filter(s => s.series.includes(seriesValue));
  }
  setupSongs(songsData);
});

document.getElementById('switchCheckAll').addEventListener('change', () => {
  let seriesCheckAll = document.getElementById('switchCheckAll');
  let allChecks = document.querySelectorAll('.form-check-input');
  
  if (!seriesCheckAll.checked) {
    allChecks.forEach(c => {
      c.disabled = false;
      c.checked = true;
    });
    
    allChecks[1].checked = false;
  } else {
    allChecks.forEach(c => {
      c.disabled = true;
      c.checked = true;
    });
    songsData = structuredClone(songsCsv);
    
    allChecks[1].checked = true;
    allChecks[1].disabled = false;
  }
});

document.getElementById('playerCount').addEventListener('change', (e) => {
  e.preventDefault();
  let value = e.target.valueAsNumber;
  playerCount = value;

  let contestantCountDiv = document.getElementById('players-select-div');
  contestantCountDiv.innerHTML = '';
  
  let gameContestants = document.getElementById('players-div');
  gameContestants.innerHTML = '';

  for (let i = 1; i <= value; i++) {
    let playerLabel = document.createElement('label');
    playerLabel.className = 'form-label';
    let playerInput = document.createElement('input');
    playerInput.type = 'text';
    playerInput.className = 'form-control player-name player-name' + i;
    playerInput.id = 'playerName playerName' + i;
    playerInput.placeholder = 'Player ' + i;

    playerInput.addEventListener('change', (e) => {
      for (let i = 1; i <= 4; i++) {
        if (e.target.classList.contains('player-name' + i)) {
          let contestant = document.getElementsByClassName('contestant-name')[i-1];
          contestant.textContent = e.target.value;
          break;
        }
      }
    });

    contestantCountDiv.appendChild(playerLabel);
    contestantCountDiv.appendChild(playerInput);

    // Game Board players
    let contestantDiv = document.createElement('div');
    contestantDiv.className = 'contestant';
    let contestantP = document.createElement('p');
    contestantP.className = 'contestant-name';
    contestantP.textContent = 'Player ' + i;
    let contestantScore = document.createElement('input');
    contestantScore.type = 'number';
    contestantScore.id = 'playerScore';
    contestantScore.className = 'form-control';

    contestantDiv.appendChild(contestantP);
    contestantDiv.appendChild(contestantScore);
    gameContestants.appendChild(contestantDiv);
  }
});

// Category dropdowns on change
document.getElementById('cat1').addEventListener('change' , () => {
  categories[0].textContent = document.getElementById('cat1').value;
});
document.getElementById('cat2').addEventListener('change' , () => {
  categories[1].textContent = document.getElementById('cat2').value;
});
document.getElementById('cat3').addEventListener('change' , () => {
  categories[2].textContent = document.getElementById('cat3').value;
});
document.getElementById('cat4').addEventListener('change' , () => {
  categories[3].textContent = document.getElementById('cat4').value;
});
document.getElementById('cat5').addEventListener('change' , () => {
  categories[4].textContent = document.getElementById('cat5').value;
});

function getRandomSong(songs) {
  return songs[Math.floor(Math.random() * songs.length)];
}

function getButtonDifficulty(button) {
  switch (button.classList[1]) {
    case 'btn-easy':
      return 'Easy';
    case 'btn-normal':
      return 'Normal';
    case 'btn-tough':
      return 'Tough';
    case 'btn-lunatic':
      return 'Lunatic';
    case 'btn-merciless':
      return 'Merciless';
  
    default:
      return 'Easy';
  }
}

function getButtonCategory(button) {
  let category = '';
  buttons.forEach(b => {
    if (button == b) {
      category = button.classList[2];
    }
  });
  switch (category) {
    case 'btn-cat1':
      return document.querySelectorAll('.category-title')[0].textContent;
    case 'btn-cat2':
      return document.querySelectorAll('.category-title')[1].textContent;
    case 'btn-cat3':
      return document.querySelectorAll('.category-title')[2].textContent;
    case 'btn-cat4':
      return document.querySelectorAll('.category-title')[3].textContent;
    case 'btn-cat5':
      return document.querySelectorAll('.category-title')[4].textContent;
  
    default:
      return document.querySelectorAll('.category-title')[0].textContent;
  }
}

function filterSongsByDifficulty(songs, difficulty) {
//   songsEasy = songsEasy = songsJson.filter(a => a.difficulty == 
//   songsNormal = songsJson.filter(a => a.difficulty == 'Normal');
//   songsTough = songsJson.filter(a => a.difficulty == 'Tough');
//   songsLunatic = songsJson.filter(a => a.difficulty == 'Lunatic');
//   songsMerciless = songsJson.filter(a => a.difficulty == 'Merciless');
//   console.log(songsEasy);
//   console.log(songsNormal);
//   console.log(songsTough);
//   console.log(songsLunatic);
//   console.log(songsMerciless);
  return songs.filter(a => a.difficulty == difficulty); 
}

function filterSongsByCategory(songs, category) {
  return songs.filter(a => a.categories.includes(category));
}

function getYoutubeID(url) {
  const urlObj = new URL(url);
  if (url.startsWith('https://youtu.be')) {
    return url.split('/')[3];
  }
  return urlObj.searchParams.get('v');
}

function setupSongs(songs) {
  songCategories = [...new Set(songs.flatMap(s => s.categories))].sort();
  songSeries = [...new Set(songs.flatMap(s => s.series))].sort();
  chosenSeries = [...new Set(songs.flatMap(s => s.series))].sort();
}

function setupSelects(songCategories, songSeries) {
  let selectDiv = document.getElementById('select-cat-div');
  let selectCats = selectDiv.querySelectorAll('select');

  selectCats.forEach(s => {
    songCategories.forEach(c => {
      let option = document.createElement('option');
      option.value = c;
      option.innerHTML = c;
      s.appendChild(option)
    });
  });
  categories[0].innerHTML = songCategories[0];
  categories[1].innerHTML = songCategories[1];
  categories[2].innerHTML = songCategories[2];
  categories[3].innerHTML = songCategories[3];
  categories[4].innerHTML = songCategories[4];

  // let selectSeries = document.getElementById('series-select');
  // songSeries.forEach(s => {
  //   let option = document.createElement('option');
  //   option.value = s;
  //   option.innerHTML = s;
  //   selectSeries.appendChild(option)
  // });
}

function setupSelectChecks(songSeries) {
  let seriesCheckDiv = document.getElementById('series-check-div');
  songSeries.forEach(s => {
    let checkDiv = document.createElement('div');
    checkDiv.className = 'form-check form-switch';
    let checkInput = document.createElement('input');
    checkInput.className = 'form-check-input';
    checkInput.type = 'checkbox';
    checkInput.role = 'switch';
    checkInput.id = 'switchCheckSeries';
    checkInput.checked = true;
    checkInput.disabled = true;
    let checkLabel = document.createElement('label');
    checkLabel.className = 'form-check-label';
    checkLabel.textContent = s;

    checkDiv.appendChild(checkInput);
    checkDiv.appendChild(checkLabel);
    seriesCheckDiv.appendChild(checkDiv);

    checkInput.addEventListener('change', () => {
      if (checkInput.checked) {
        chosenSeries.push(s);
        chosenSeries.sort();
      } else {
        let seriesIndex = chosenSeries.indexOf(s);
        if (seriesIndex != -1) {
          chosenSeries.splice(seriesIndex, 1);
        }
      }
      filterSongsByChosenSeries();
    });
  });
}

function filterSongsByChosenSeries() {
  // console.log(chosenSeries);
  songsData = songsCsv.filter(s => s.series.every(series => chosenSeries.includes(series)));
  // console.log(songsData);
}

// NO LONGER USED
document.getElementById('series-select').addEventListener('change' , () => {
  let seriesValue = document.getElementById('series-select').value;
  // console.log('seriesvalue', seriesValue);
  if (seriesValue == 'All') {
    songsData = structuredClone(songsCsv);
  }
  else {
    songsData = songsCsv.filter(s => s.series.includes(seriesValue));
  }
  setupSongs(songsData);
});

// If video gives an error, generate a random one
function onPlayerError(event) {
  const errorCode = event.data;
  videoUnavailable = true;
  console.log('Error loading video: ' + errorCode);
  setChosenSong()
}

function onPlayerReady(event) {
  videoUnavailable = false;
}

function setChosenSong() {
  document.getElementById('category-difficulty').textContent = chosenCategory + ': ' + chosenDifficulty;
  let songsByDifficulty = filterSongsByDifficulty(songsData, chosenDifficulty);
  songsByCategory = filterSongsByCategory(songsByDifficulty, chosenCategory);
  // console.log(songsByDifficulty);
  // console.log(songsByCategory);

  if (songsByCategory.length <= 0 || videoUnavailable) {
    console.log('Video is unavailable or there is no song that meets the criteria of: ' + chosenCategory + ': ' + chosenDifficulty);
    chosenSong = getRandomSong(songsData);
    document.getElementById('category-difficulty').textContent = chosenSong.categories[0] + ': ' + chosenSong.difficulty;
  } else {
    chosenSong = getRandomSong(songsByCategory);
    document.getElementById('category-difficulty').textContent = chosenSong.categories[0] + ': ' + chosenSong.difficulty;
  }

  if (chosenSong.hints == null) {
    document.getElementById('reveal-hint').disabled = true;
    document.getElementById('reveal-hint').style.cursor = 'not-allowed';
  } else {
    document.getElementById('reveal-hint').disabled = false;
    document.getElementById('reveal-hint').style.cursor = 'pointer';
  }
  videoUnavailable = false;
  let youtubeId = getYoutubeID(chosenSong.youtube);
  // console.log(chosenSong, youtubeId);
  player.setVolume(10);
  // player.playerVars.playlist = youtubeId;
  player.loadPlaylist(youtubeId);
  player.loadVideoById(youtubeId);
  questionScreen.scrollIntoView({behavior: "smooth"});
  // window.alert('Title: ' + chosenSong.title + '\nDifficulty: ' + chosenSong.difficulty + '\nSeries: ' + chosenSong.series + '\nCategories: ' + chosenSong.categories);
  // console.log('Title: ' + chosenSong.title + '\nDifficulty: ' + chosenSong.difficulty + '\nSeries: ' + chosenSong.series + '\nCategories: ' + chosenSong.categories);
}
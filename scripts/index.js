console.log("hello");

fetch('data.json')
  .then(r => r.json())
  .then(json => {
    console.log(json)
    let audio = document.createElement('audio');
    audio.src = './audio/music/DP%20Rival.mp3'; // Replace spaces with %20
    audio.controls = true; // Add controls to make it playable
    document.body.appendChild(audio);
    console.log(audio);

  });

// let audio = new Audio('./audio/music/DP Rival.mp3');

let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '0', // Hide the video
    width: '0',  // Hide the video
    videoId: 'c0y9SDiihBY', // Replace with your video ID
    playerVars: { 'controls': 0 },
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

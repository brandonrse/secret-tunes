import { 
  loadLocalSongsCsv
} from "./data.js";
import { 
  getRandomSongsEfficient,
  getYoutubeID
} from "./playerUtility.js";

const playlistBtn = document.querySelector('.btn-playlist');

var songs;

loadLocalSongsCsv().then(
  (songs) => {
    setup(songs);
  }
);

function setup(res) {
  songs = res;
  playlistBtn.addEventListener('click', () => {
    const randomSongs = getRandomSongsEfficient(songs, 50);
    const videoIDs = randomSongs.map(song => getYoutubeID(song.youtube)).filter(Boolean);
    const playlistURL = `https://www.youtube.com/watch_videos?video_ids=${videoIDs.join(",")}`;
    window.open(playlistURL, "_blank");
  });
}
export function getYoutubeID(url) {
  const urlObj = new URL(url);
  if (url.startsWith('https://youtu.be')) {
    return url.split('/')[3];
  }
  return urlObj.searchParams.get('v');
}


export function getSongName(songTitle) {
  return songTitle.split(' ~ ')[1]
}

export function getGameName(songTitle) {
  return songTitle.split(' ~ ')[0];
}

export function getRandInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
} 

export function getRandomSong(songs) {
  return songs[getRandInt(0, songs.length)];
}

export function getUnplayedSongs(songs, playedSongsTitles) {
  return songs.filter((s) => !playedSongsTitles.has(s.title));
}

export function isSongInArrayByTitle(songs, title) {
  return songs.some(s => s.title === title);
}

export function hasDuplicateSongName(songs, name) {
  const count = songs.reduce((acc, song) => {
    return acc + (getSongName(song.title) === name ? 1 : 0);
  }, 0);
  return count > 1;
}
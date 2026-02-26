export function getYoutubeID(url) {
  const match = url.match(
    /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&?/]+)/i
  );
  // const match = 'https://youtu.be/20dDREZRS9g?si=Q4LWh76EHzU_f0Fe'.match(
  //    /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&?/]+)/i
  // );
  return match ? match[1] : null;
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

export function getRandomSongs(songs, count = 50) {
  const filtered = songs.filter(song => 
    !song.categories.includes("Jingles")
  );

  const shuffled = [...filtered];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomSongsEfficient(songs, count = 50) {
  const filtered = songs.filter(song => 
    !song.categories.includes("Jingles")
  );

  const result = [];
  const used = new Set();

  while (result.length < count && used.size < filtered.length) {
    const index = Math.floor(Math.random() * filtered.length);
    if (!used.has(index)) {
      used.add(index);
      result.push(filtered[index]);
    }
  }

  return result;
}

export function getUnplayedSongs(songs, playedSongsTitles) {
  return songs.filter((s) => !playedSongsTitles.includes(s.title));
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

export function songHasCategory(song, category) {
  return song.categories.includes(category);
}

export function getSongsByDifficulty(songs, difficulty) {
  return songs.filter((s) => s.difficulty === difficulty);
}

export function getSongsByCategory(songs, category) {
  return songs.filter((s) => s.categories.includes(category));
}

export function getSongsBySeries(songs, series) {
  return songs.filter((s) => s.series.includes(series));
}

export function getSongsByCategoryOrSeries(songs, category, seriesName) {
  return songs.filter((s) => s.categories.includes(category) || s.series.includes(seriesName));
}

export function getSongsWithoutCategory(songs, category) {
  return songs.filter((s) => !s.categories.includes(category));
}

export function getSongsWithoutDifficulty(songs, difficulty) {
  return songs.filter((s) => s.difficulty !== difficulty);
}

export function getAllCategories(songs) {
  return [...new Set(songs.flatMap(song => song.categories))];
}

export function getAllSeries(songs) {
  return [...new Set(songs.flatMap(song => song.series))];
}

export function getSongsByCategories(songs, chosenCategories) {
  return songs.filter(song => song.categories.some(category => chosenCategories.includes(category)));
}

export function getSongsByMultipleSeries(songs, chosenSeries) {
  return songs.filter(song => 
    song.series.length > 0 && song.series.every(s => chosenSeries.has(s))
  );
}


export function getSongsByDifficultyCategorySeries(songs, difficulty, category, seriesName) {
  return songs.filter(song => 
    song.difficulty === difficulty &&
    (song.categories.includes(category) ||
    song.series.includes(seriesName))
  );
}

export function getRandomSongByDifficultyCategorySeries(songs, difficulty, category, seriesName) {
  const filtered = getSongsByDifficultyCategorySeries(songs, difficulty, category, seriesName);

  if (filtered.length === 0) { return null; }
  const rand = Math.floor(Math.random() * filtered.length);
  return filtered[rand];
}

//#region ADVENTURE CHARACTERS

export function getCharactersByDifficulty(characters, difficulty) {
  return characters.filter((c) => c.difficulty === difficulty);
}

export function getCharactersBySeries(characters, series) {
  return characters.filter((c) => c.series.includes(series));
}

export function getCharactersByCategories(characters, category) {
  return characters.filter((c) => c.categories.includes(category));
}

//#endregion
export const gifs = [
  'url("./assets/images/gifs/mariorpg.gif")',
  'url("./assets/images/gifs/naoto.gif")',
  'url("./assets/images/gifs/narukami.gif")',
  'url("./assets/images/gifs/splatoon.gif")',
  'url("./assets/images/gifs/toothless.gif")',
  'url("./assets/images/gifs/miraidon.gif")',
  'url("./assets/images/gifs/zekrom.gif")',
  'url("./assets/images/gifs/fridaynight.gif")',
  'url("./assets/images/gifs/dance-ghirahim.gif")',
  'url("./assets/images/gifs/blastoise-water.gif")',
  'url("./assets/images/gifs/ghost-trick-lamp.gif")',
  'url("./assets/images/gifs/greavard-dance.gif")',
];

export async function loadOldLocalSongsCsv() {
  const response = await fetch('./oldsongs.csv');
  const file = await response.text();
  let songs = [];
  if (file) {
    songs = parseSongsCSV(file); 
    return songs;
  };
}

export async function loadLocalSongsCsv() {
  const response = await fetch('./Songs Spreadsheet - Songs.csv');
  const file = await response.text();
  let songs = [];
  if (file) {
    songs = parseSongsCSV(file); 
    return songs;
  };
}

export async function loadLocalAdventureCsv() {
  const response = await fetch('./Songs Spreadsheet - Adventure Mode Entities.csv');
  const file = await response.text();
  let entities = [];
  if (file) {
    entities = parseAdventureCSV(file); 
    return entities;
  };
}


function parseSongsCSV(csvString) {
  const rows = csvString.trim().split('\n'); // Split rows
  const dataRows = rows.slice(1); // Skip the first row
  return dataRows.map(row => {
      const fields = parseRow(row);
      return {
          game: fields[0]?.trim() || '',
          title: fields[1]?.trim() || '',
          categories: fields[2] ? parseArray(fields[2]) : [],
          difficulty: fields[3]?.trim() || '',
          hints: fields[4]?.trim() || null,
          series: fields[5] ? parseArray(fields[5]) : [],
          youtube: fields[6]?.trim() || '',
      };
  });
}
function parseAdventureCSV(csvString) {
  const rows = csvString.trim().split('\n'); // Split rows
  const dataRows = rows.slice(1); // Skip the first row
  return dataRows.map(row => {
      const fields = parseRow(row);
      return {
          title: fields[0]?.trim() || '',
          categories: fields[1] ? parseArray(fields[1]) : [],
          difficulty: fields[2]?.trim() || '',
          series: fields[3] ? parseArray(fields[3]) : []
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

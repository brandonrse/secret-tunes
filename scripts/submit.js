import {
  loadLocalSongsCsv
} from "./data.js";

import {
  getRandInt,
  getSongName,
  getGameName,
  getAllSeries,
  getAllCategories,
} from "./playerUtility.js";

var songs;
var categories;
var series;

loadLocalSongsCsv().then(
  (songs) => {
    setup(songs);
  }
).then(
  () => setupForm()
);

function setup(res) {
  songs = res;
  categories = getAllCategories(res).sort();
  series = getAllSeries(res).sort();
}
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('navbarMenu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
});

function setupForm() {
  // Categories
  const categoriesFieldset = document.getElementById('categoriesFieldset');
  categoriesFieldset.classList.add('pill-group'); // Add grid class
  categories.forEach(c => {
    const div = document.createElement('div');
    div.className = 'chip-checkbox';
    div.innerHTML = `
      <input type="checkbox" name="categories" value="${c}" id="cat-${c}">
      <label for="cat-${c}">${c}</label>
    `;
    categoriesFieldset.appendChild(div);
  });

  // Series
  const seriesFieldset = document.getElementById('seriesFieldset');
  seriesFieldset.classList.add('pill-group'); // Add grid class
  series.forEach(s => {
    const div = document.createElement('div');
    div.className = 'chip-checkbox';
    div.innerHTML = `
      <input type="checkbox" name="series" value="${s}" id="ser-${s}">
      <label for="ser-${s}">${s}</label>
    `;
    seriesFieldset.appendChild(div);
  });

  // Difficulty (radios)
  const difficultyFieldset = document.getElementById('difficultyFieldset');
  difficultyFieldset.classList.add('pill-group');
  const radios = difficultyFieldset.querySelectorAll('input[type="radio"]');
  radios.forEach(r => {
    const parent = r.parentElement;
    parent.className = 'chip-radio';
    const label = parent.querySelector('label');
    label.setAttribute('for', r.id || r.name + '-' + r.value);
    r.id = r.id || r.name + '-' + r.value;
  });
}

const form = document.getElementById('songForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

form.addEventListener('submit', e => {
  e.preventDefault();

  submitBtn.disabled = true;
  btnText.textContent = "Submitting...";
  btnSpinner.style.display = "inline-block";
  document.body.style.cursor = "wait";

  const formData = new FormData(form);
  const data = {
    title: formData.get('title'),
    game: formData.get('game'),
    youtube: formData.get('youtube'),
    hints: formData.get('hints'),
    difficulty: formData.get('difficulty'),
    categories: formData.getAll('categories').join(', '),
    series: formData.getAll('series').join(', ')
  };

  fetch('https://script.google.com/macros/s/AKfycbx31AIFNQnIQciVt11_hFxcS2-ZnnRUkgh0u4qw83BXSQVo1mjfvsm7_XBSdZXY9qFFqQ/exec', {
    method: 'POST',
    body: new URLSearchParams(data)
  })
  .then(res => res.json())
  .then(response => {
    console.log(response);
    alert('Song submitted successfully!');
    form.reset();
  })
  .catch(err => {
    console.error(err);
    alert('Submission failed. Please try again.');
  })
  .finally(() => {
    // Re-enable button and reset spinner/cursor
    submitBtn.disabled = false;
    btnText.textContent = "Submit";
    btnSpinner.style.display = "none";
    document.body.style.cursor = "default";
  });
});
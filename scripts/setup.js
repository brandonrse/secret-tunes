var songArray = [];

document.getElementById('clearAll').addEventListener('click', function() {
  const form = document.getElementById('songForm');
  form.reset();
});

document.getElementById('songForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const form = event.target;
  let song = {
    title: form[0].value,
    youtube: form[1].value,
    category: form[2].value,
    difficulty: form[3].value,
    hints: [form[4].value, form[5].value, form[6].value, form[7].value]
  }
  songArray.push(song);
  arrayToTable();
  console.log(event.target);
  console.log(song);
});

document.getElementById('download').addEventListener('click', function() {
  var JsonObject = JSON.stringify(songArray, null, 2);
  var blob = new Blob([JsonObject], {type: 'application/json'});
  var url = URL.createObjectURL(blob);

  var a = document.createElement('a');
  a.href = url;
  a.download = 'songs.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function arrayToTable() {
  let songTbody = document.getElementById('tbody-song');
  songTbody.innerHTML = '';
  for (let i = 0; i < songArray.length; i++) {
    let tr = document.createElement('tr');
    let thNum = document.createElement('th');
    thNum.scope = 'row';
    thNum.textContent = i + 1;
    let tdTitle = document.createElement('td');
    tdTitle.textContent = songArray[i].title;
    let tdCat = document.createElement('td');
    tdCat.textContent = songArray[i].category;
    let tdDiff = document.createElement('td');
    tdDiff.textContent = songArray[i].difficulty;
    let tdHint1 = document.createElement('td');
    tdHint1.textContent = songArray[i].hints[0];
    let tdHint2 = document.createElement('td');
    tdHint2.textContent = songArray[i].hints[1];
    let tdHint3 = document.createElement('td');
    tdHint3.textContent = songArray[i].hints[2];
    let tdHint4 = document.createElement('td');
    tdHint4.textContent = songArray[i].hints[3];
    let tdURL = document.createElement('td');
    tdURL.textContent = songArray[i].youtube;

    tr.appendChild(thNum);
    tr.appendChild(tdTitle);
    tr.appendChild(tdCat);
    tr.appendChild(tdDiff);
    tr.appendChild(tdHint1);
    tr.appendChild(tdHint2);
    tr.appendChild(tdHint3);
    tr.appendChild(tdHint4);
    tr.appendChild(tdURL);

    songTbody.append(tr);
  }
}

document.getElementById('loadSongs').addEventListener('click', () => {
  const fileInput = document.getElementById('songsFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a JSON file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      songArray = Array.isArray(data) ? data : [data];
      arrayToTable();
      console.log('Uploaded JSON:', songArray);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
});
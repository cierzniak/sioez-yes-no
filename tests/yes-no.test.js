const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const script = fs.readFileSync(path.join(__dirname, '../scripts/yes-no.js'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8');
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// Ładuje content script na pustą stronę i „otwiera modal” tak jak SIOEZ: wstrzyknięcie formularza + klasa modal-open.
const openModal = async ({ modalOpen = true } = {}) => {
  const { window } = new JSDOM('<body></body>', { runScripts: 'outside-only' });
  window.eval(script);
  const { document } = window;
  document.body.innerHTML = fixture;
  if (modalOpen) {
    document.body.classList.add('modal-open');
  }
  await tick();
  return document;
};

const checked = (document, value) =>
  [...document.querySelectorAll(`form input[name][value="${value}"]:checked`)].map((i) => i.name).sort();

const containers = (document) =>
  [...document.querySelectorAll('[id^="mass-toggle-container"]')].map((el) => el.id);

const press = (document, containerId, answer, nth = 0) =>
  document.querySelectorAll(`#${containerId}`)[nth].querySelector(`.radio.${answer} input`).click();

test('nie robi nic, dopóki modal nie jest otwarty', async () => {
  const document = await openModal({ modalOpen: false });
  assert.deepEqual(containers(document), []);
});

test('dodaje przyciski globalne i per rezultat w każdej sekcji, usuwa <hr>', async () => {
  const document = await openModal();
  assert.deepEqual(containers(document), [
    'mass-toggle-container', 'mass-toggle-container-R1', 'mass-toggle-container-R2', 'mass-toggle-container-P1',
    'mass-toggle-container', 'mass-toggle-container-R1', 'mass-toggle-container-R2',
  ]);
  assert.equal(document.querySelectorAll('hr').length, 0);
  assert.equal(document.querySelector('.modal-body').style.maxHeight, '80vh');
});

test('globalne Tak zaznacza wszystko tylko w swojej sekcji', async () => {
  const document = await openModal();
  press(document, 'mass-toggle-container', 'yes');
  assert.deepEqual(checked(document, '1'), ['P1_1', 'R1_1', 'R1_2', 'R2_1']);
  assert.deepEqual(checked(document, '2'), []);
});

test('Nie dla rezultatu zaznacza tylko ten rezultat, także dla prefiksu SE', async () => {
  const document = await openModal();
  press(document, 'mass-toggle-container-R1', 'no');
  press(document, 'mass-toggle-container-R1', 'no', 1);
  assert.deepEqual(checked(document, '2'), ['R1_1', 'R1_2', 'SER1_1']);
});

test('zapis usuwa przyciski, a OK w alercie błędu dodaje je z powrotem', async () => {
  const document = await openModal();
  document.querySelector('#submitExaminerPrw').click();
  assert.deepEqual(containers(document), []);
  document.querySelector('#PrettyAlertOk').click();
  assert.equal(containers(document).length, 7);
});

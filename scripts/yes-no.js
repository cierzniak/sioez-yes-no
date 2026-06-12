const FORM_SELECTOR = '#CandidatePracticeResultAddForm, #CandidateExaminerPracticePrwResultAddForm';
const SAVE_BUTTON_SELECTOR = '.btn-custom-save, #submitExaminerPrw';

const findSections = (node) => node.querySelectorAll('#content');

const findResultPrefixes = (node) => [
  ...new Set(
    Array
      .from(node.querySelectorAll('label'))
      .map(l => l.textContent.trim())
      .filter(l => /[PR]\d+_\d+/.test(l))
      .map(l => l.split('_')[0])
  )
];

const clickRadiosInContainers = (nodes, selector) => {
  const nodeList = Array.isArray(nodes) || nodes instanceof NodeList ? nodes : [nodes];
  nodeList.forEach(node => node.querySelectorAll(selector).forEach(i => i.querySelector('input')?.click()));
};

const createButton = (className = '', callback = undefined) => {
  const outerDiv = document.createElement('div');
  outerDiv.className = `radio ${className}`;

  const innerDiv = document.createElement('div');
  innerDiv.className = 'radioContainer';

  const input = document.createElement('input');
  input.type = 'radio';
  input.className = 'customRadioButton';
  input.onclick = (e) => {
    if (callback) {
      callback();
    }
    setTimeout(() => {
      e.target.checked = false;
    }, 400);
  };

  innerDiv.appendChild(input);
  outerDiv.appendChild(innerDiv);

  return outerDiv;
};

const createContainer = (result, children) => {
  const elements = document.createElement('div');
  elements.id = `mass-toggle-container${result === '' ? '' : '-'}${result}`;
  elements.style = 'display: flex; border: 2px solid limegreen; height: 2.5rem; margin: 1.1rem 0 0.4rem;';

  const fragment = document.createDocumentFragment();

  const label = document.createElement('label');
  fragment.appendChild(label);

  children.forEach(child => fragment.appendChild(child));

  const info = document.createElement('div');
  info.innerHTML = result === '' ? 'Wszystkie<br/>rezultaty' : `<br/>Rezultat&nbsp;${result}`;
  info.style = 'font-size: 0.7rem;';
  fragment.appendChild(info);

  elements.appendChild(fragment);

  return elements;
};

const removeHorizontalLines = (node) => {
  node.querySelectorAll('hr').forEach((el) => el.remove());
};

const addGlobalYesNo = (node) => {
  node.prepend(createContainer('', [
    createButton('yes', () => clickRadiosInContainers(node, '.radio.yes')),
    createButton('no', () => clickRadiosInContainers(node, '.radio.no')),
  ]));
};

const addLocalYesNo = (node, prefix) => {
  const inputs = Array.from(node.querySelectorAll(`input[name^="${prefix}_"], input[name^="SE${prefix}_"], input[name^="L${prefix}_"]`));
  if (inputs.length === 0) {
    return;
  }

  const parentDivs = [...new Set(inputs.map(i => i.closest('div[style*="display:block"]')).filter(Boolean))];

  const controlContainer = createContainer(prefix, [
    createButton('yes', () => clickRadiosInContainers(parentDivs, '.radio.yes')),
    createButton('no', () => clickRadiosInContainers(parentDivs, '.radio.no')),
  ]);

  const wrapper = inputs[0].closest('div[style*="display:block"]') || inputs[0].closest('div');
  if (wrapper && wrapper.parentNode) {
    wrapper.parentNode.insertBefore(controlContainer, wrapper);
  }
};

const runCommand = (formContainer) => {
  if (document.querySelector('#mass-toggle-container')) {
    return;
  }

  const modal = document.querySelector('.modal-body');
  if (modal) {
    modal.style.maxHeight = '80vh';
  }

  removeHorizontalLines(formContainer);
  findSections(formContainer).forEach((section) => addGlobalYesNo(section));
  findSections(formContainer).forEach((section) => findResultPrefixes(section).forEach((prefix) => addLocalYesNo(section, prefix)));
};

const waitForModal = () => {
  const observer = new MutationObserver(() => {
    const form = document.querySelector(FORM_SELECTOR);
    if (false === (document.body.classList.contains('modal-open') && form)) {
      return;
    }

    runCommand(form);
    observer.disconnect();

    form.querySelector(SAVE_BUTTON_SELECTOR)?.addEventListener('click', (e) => {
      e.preventDefault();
      form.querySelectorAll('[id^="mass-toggle-container"]').forEach((el) => el.remove());
    });

    document.querySelector('#PrettyAlertOk')?.addEventListener('click', (e) => {
      e.preventDefault();
      runCommand(form);
    });

    form.querySelector('.btn-custom-return')?.addEventListener('click', waitForModal, {once: true});
  });

  observer.observe(document.body, {childList: true, subtree: true});
};

waitForModal();

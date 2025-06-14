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
  nodeList.forEach(node => {
    node.querySelectorAll(selector).forEach(i => {
      const input = i.querySelector('input');
      if (input?.click) {
        input.click();
      }
    });
  });
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
    createButton('yes', () => clickRadiosInContainers(document, '.radio.yes')),
    createButton('no', () => clickRadiosInContainers(document, '.radio.no')),
  ]));
};

const addLocalYesNo = (prefix) => {
  const inputs = Array.from(document.querySelectorAll(`input[name^="${prefix}_"]`));
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

const runCommand = () => {
  if (document.querySelector('#mass-toggle-container')) {
    return;
  }

  const content = document.querySelector('#content');
  if (content) {
    removeHorizontalLines(content);
    addGlobalYesNo(content);
    findResultPrefixes(content).forEach((prefix) => addLocalYesNo(prefix));
  }
};

const waitForModal = () => {
  const observer = new MutationObserver(() => {
    if (document.body.classList.contains('modal-open')) {
      runCommand();
      observer.disconnect();

      const confirmBtn = document.querySelector('.btn-custom-save');
      const cancelBtn = document.querySelector('.btn-custom-return');

      const handleClose = () => {
        waitForModal();
      };

      if (confirmBtn) {
        confirmBtn.addEventListener('click', handleClose, {once: true});
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', handleClose, {once: true});
      }
    }
  });

  observer.observe(document.body, {childList: true, subtree: true});
};

waitForModal();

const createButton = (className = '') => {
  const outerDiv = document.createElement('div');
  outerDiv.className = `radio ${className}`;

  const innerDiv = document.createElement('div');
  innerDiv.className = 'radioContainer';

  const input = document.createElement('input');
  input.type = 'radio';
  input.className = 'customRadioButton';
  input.onclick = (e) => {
    document.querySelectorAll(`.radio.${className}`).forEach((f) => {
      f.querySelector('input').click();
    });
    setTimeout(() => {
      e.target.checked = false;
    }, 400);
  };

  innerDiv.appendChild(input);
  outerDiv.appendChild(innerDiv);

  return outerDiv;
}

const runCommand = () => {
  if (document.querySelector('#mass-toggle-container')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'mass-toggle-container';
  container.style = 'display: flex; border: 2px solid limegreen; height: 2.5rem;';
  container.appendChild(document.createElement('label'));
  container.appendChild(createButton('yes'));
  container.appendChild(createButton('no'));

  const info = document.createElement('div');
  info.textContent = 'Wszystkie rezultaty';
  info.style = 'font-size: 0.7rem;';
  container.appendChild(info);

  const content = document.querySelector('#content');
  if (content) {
    content.prepend(container);
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

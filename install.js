(() => {
  const appModes = ['standalone', 'fullscreen'].map(mode => matchMedia('(display-mode: ' + mode + ')'));
  let pendingPrompt = null;
  let installedThisSession = false;
  let waitingForChoice = false;

  function inApp() {
    return navigator.standalone === true || appModes.some(query => query.matches);
  }

  function updateControl() {
    const button = document.getElementById('install-app');
    if (!button) return;
    const launched = inApp();
    button.hidden = installedThisSession || launched;
    button.disabled = waitingForChoice;
    const info = document.getElementById('install-info');
    if (launched) info.textContent = 'TEO security открыто как отдельное приложение.';
    else if (installedThisSession) info.textContent = 'Приложение установлено. Запускайте TEO security с иконки.';
    else info.textContent = 'Добавьте TEO security на главный экран, чтобы открывать въезд с иконки.';
  }

  function showInstructions() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let steps;
    if (ios) {
      steps = ['Откройте эту страницу в Safari и нажмите «Поделиться».',
        'Выберите «На экран „Домой“». Если видите переключатель «Открывать как веб-приложение», включите его.',
        'Нажмите «Добавить» и откройте TEO security с появившейся иконки.'];
    } else if (/Android/i.test(navigator.userAgent)) {
      steps = ['Откройте эту страницу в Chrome на телефоне.',
        'В меню ⋮ выберите «Установить приложение» или «Добавить на главный экран». Если доступны установка и ярлык, выберите установку.',
        'Подтвердите установку и запустите TEO security с иконки.'];
    } else {
      steps = ['Чтобы установить приложение на телефон, откройте эту же ссылку в Safari на iPhone или Chrome на Android.',
        'Перейдите в «Пользователь» и нажмите «Установить на телефон».'];
    }
    show('Установка TEO security');
    const list = document.createElement('ol');
    list.className = 'install-steps';
    for (const step of steps) {
      const item = document.createElement('li');
      item.textContent = step;
      list.append(item);
    }
    document.getElementById('modal-body').append(list);
  }

  async function install() {
    if (waitingForChoice || inApp() || installedThisSession) return;
    const promptEvent = pendingPrompt;
    if (!promptEvent) { showInstructions(); return; }
    pendingPrompt = null;
    waitingForChoice = true;
    updateControl();
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      if (!installedThisSession && !inApp()) showInstructions();
    } finally {
      waitingForChoice = false;
      updateControl();
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingPrompt = event;
    updateControl();
  });
  window.addEventListener('appinstalled', () => {
    installedThisSession = true;
    pendingPrompt = null;
    updateControl();
  });
  for (const query of appModes) query.addEventListener?.('change', updateControl);
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('install-app').addEventListener('click', install);
    updateControl();
  });
})();

(() => {
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#firebaseDialog');
  const input = $('#firebaseConfigInput');
  const status = $('#firebaseConfigStatus');
  const storageKey = 'gwenNicolasFirebaseConfig';

  function currentConfig() {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
    catch { return null; }
  }

  function normalize(raw) {
    let value = raw.trim();
    value = value.replace(/^const\s+firebaseConfig\s*=\s*/, '').replace(/;\s*$/, '');
    value = value.replace(/([,{]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
    value = value.replace(/'/g, '"');
    return JSON.parse(value);
  }

  function validate(config) {
    const required = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
    const missing = required.filter((key) => !config?.[key] || String(config[key]).includes('REMPLACEZ'));
    if (missing.length) throw new Error(`Champs manquants : ${missing.join(', ')}`);
    return required.reduce((result, key) => ({...result, [key]: String(config[key]).trim()}), {});
  }

  function openDialog() {
    const saved = currentConfig();
    input.value = saved ? JSON.stringify(saved, null, 2) : '';
    status.textContent = saved ? 'Une configuration est déjà enregistrée sur cet appareil.' : '';
    dialog.showModal();
  }

  ['#firebaseSetupHome','#firebaseSetupOnline','#firebaseSetupDrawer'].forEach((selector) => {
    const button = $(selector);
    if (button) button.addEventListener('click', openDialog);
  });

  $('#saveFirebaseConfig')?.addEventListener('click', () => {
    try {
      const config = validate(normalize(input.value));
      localStorage.setItem(storageKey, JSON.stringify(config));
      status.textContent = 'Configuration valide. Rechargement…';
      status.className = 'config-status success';
      setTimeout(() => location.reload(), 450);
    } catch (error) {
      status.textContent = error.message || 'Configuration invalide.';
      status.className = 'config-status error';
    }
  });

  $('#clearFirebaseConfig')?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    input.value = '';
    status.textContent = 'Configuration supprimée. Rechargement…';
    setTimeout(() => location.reload(), 450);
  });
})();

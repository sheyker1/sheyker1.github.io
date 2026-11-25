(() => {
  const buttons = document.querySelectorAll('.email-copy, [data-email-copy]');
  if (!buttons.length) return;
  const status = document.createElement('div');
  status.className = 'email-copy-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  document.body.append(status);
  let statusTimer;
  const announce = (message, duration) => {
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => { status.textContent = ''; }, duration);
  };
  function fallbackCopy(email) {
    const field = document.createElement('textarea');
    field.value = email;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
    const focused = document.activeElement;
    document.body.append(field);
    let copied;
    try {
      field.select();
      field.setSelectionRange(0, email.length);
      copied = document.execCommand('copy');
    } finally {
      field.remove();
      if (focused && focused.focus) focused.focus({ preventScroll: true });
    }
    if (!copied) throw new Error('Copy failed');
  }
  buttons.forEach(button => {
    let resetTimer;
    let pending = false;
    button.addEventListener('click', async () => {
      if (pending) return;
      pending = true;
      clearTimeout(resetTimer);
      button.classList.remove('is-copied');
      try {
        const email = button.dataset.email;
        if (navigator.clipboard && window.isSecureContext) {
          try { await navigator.clipboard.writeText(email); }
          catch { fallbackCopy(email); }
        } else { fallbackCopy(email); }
        button.classList.add('is-copied');
        announce('Email скопирован', 1500);
        resetTimer = setTimeout(() => {
          button.classList.remove('is-copied');
        }, 1500);
      } catch {
        announce('Не удалось скопировать. Email: ' + button.dataset.email, 6000);
      } finally { pending = false; }
    });
  });
})();

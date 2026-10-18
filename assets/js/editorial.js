(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.menu-toggle');
  const closeMenu = (restore = false) => {
    header?.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.textContent = 'Menu';
    if (restore) toggle?.focus();
  };
  toggle?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  });
  header?.querySelector('.site-nav')?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header?.classList.contains('menu-open')) closeMenu(true);
  });
  matchMedia('(min-width:701px)').addEventListener('change', () => closeMenu());

  let dialog = document.querySelector('#image-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'image-dialog'; dialog.className = 'image-dialog';
    dialog.setAttribute('aria-label', 'Expanded project image');
    dialog.innerHTML = '<button type="button" aria-label="Close image">Close</button><img alt="">';
    document.body.append(dialog);
  }
  const expanded = dialog.querySelector('img');
  const close = dialog.querySelector('button');
  let trigger = null;
  const openImage = (image, origin) => {
    if (!image || dialog.open) return;
    trigger = origin || image;
    expanded.src = image.currentSrc || image.src;
    expanded.alt = image.alt || 'Project artwork';
    if (image.naturalWidth) { expanded.width = image.naturalWidth; expanded.height = image.naturalHeight; }
    dialog.showModal(); dialog.scrollTop = 0; close.focus();
  };
  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  const enhance = () => {
    document.querySelectorAll('img[data-lightbox]:not([data-enhanced])').forEach(image => {
      image.dataset.enhanced = 'true';
      if (image.closest('button, a')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'artwork-expand';
      button.setAttribute('aria-label', `Enlarge ${image.alt || 'project artwork'}`);
      image.before(button); button.append(image);
      button.addEventListener('click', () => openImage(image, button));
    });
    document.querySelectorAll('video:not([data-playback-ready])').forEach(video => {
      video.dataset.playbackReady = 'true'; video.controls = true;
      video.autoplay = false; video.removeAttribute('autoplay'); video.pause();
      video.preload = 'metadata';
    });
  };
  document.addEventListener('click', event => {
    const image = event.target.closest('img[data-lightbox]');
    if (image && !image.closest('.artwork-expand')) {
      event.preventDefault(); openImage(image, image.closest('button') || image);
    }
  });
  enhance();
  document.addEventListener('portfolio:media-ready', enhance);
  document.addEventListener('portfolio:preservation-ready', enhance);
  new MutationObserver(enhance).observe(document.querySelector('main'), { childList: true, subtree: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change', () => {
    if (reduced.matches) document.querySelectorAll('video').forEach(video => video.pause());
  });

  document.querySelectorAll('[data-preview-browser]').forEach(browser => {
    const panel = browser.querySelector('[data-preview-panel]');
    const image = panel?.querySelector('[data-preview-image]');
    const link = panel?.querySelector('[data-preview-link]');
    const title = panel?.querySelector('[data-preview-title]');
    const category = panel?.querySelector('[data-preview-category]');
    const choices = [...browser.querySelectorAll('a[data-preview-src]')];
    if (!image || !choices.length) return;
    let revision = 0;
    const select = choice => {
      const request = ++revision;
      const preview = new Image();
      preview.src = choice.dataset.previewSrc;
      const display = () => {
        if (request !== revision) return;
        image.src = preview.src;
        image.alt = choice.dataset.previewAlt || '';
        link.href = choice.href;
        title.textContent = choice.dataset.previewTitle || '';
        category.textContent = choice.dataset.previewCategory || '';
        choices.forEach(item => item.toggleAttribute('data-current', item === choice));
      };
      if (preview.complete) display();
      else preview.addEventListener('load', display, { once: true });
    };
    choices.forEach(choice => {
      choice.addEventListener('pointerenter', () => select(choice));
      choice.addEventListener('focus', () => select(choice));
    });
  });

})();

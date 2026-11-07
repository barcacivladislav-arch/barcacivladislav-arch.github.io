(() => {
  const section = document.querySelector('#black-friday');
  const api = window.PortfolioExperience;
  if (!section || !api) return;
  const root = document.body.dataset.assetRoot;
  const folder = 'assets/portfolio/sope/black-friday/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previewEnabled = !reduced.matches;
  const previews = new Map();
  section.querySelectorAll('details').forEach((panel) => {
    panel.addEventListener('toggle', () => {
      if (!panel.open) panel.querySelectorAll('video').forEach((video) => video.pause());
    });
  });
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    return element;
  };
  const artwork = (file, title, width, height, eager = false) => {
    const img = node('img');
    img.src = root + folder + file;
    img.alt = title;
    img.width = width;
    img.height = height;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    return img;
  };
  const setMotion = (art, email, enabled) => {
    art.querySelectorAll('.sope-bf-reader__motion').forEach((img) => img.remove());
    if (!enabled) return;
    for (const slot of email.motion) {
      const img = artwork(slot.file, slot.alt, slot.width, slot.height);
      img.className = 'sope-bf-reader__motion';
      img.style.left = (slot.x / 600 * 100) + '%';
      img.style.top = (slot.y / email.designHeight * 100) + '%';
      img.style.width = (slot.width / 600 * 100) + '%';
      img.addEventListener('error', () => img.remove(), {once: true});
      art.append(img);
    }
  };
  const renderEmail = (email, index, assetRoot, options) => {
    const reader = node('div');
    reader.className = 'sope-bf-reader';
    const art = node('div');
    art.className = 'sope-bf-reader__art';
    art.setAttribute('role', 'img');
    art.setAttribute('aria-label', options.displayAlt);
    const parts = email.slices.length ? email.slices : [email];
    parts.forEach((part, index) => art.append(artwork(part.file, '', part.width, part.height, Boolean(options.eager && index === 0))));
    if (!options.controls || !email.motion.length) {
      if (email.motion.length) {
        previews.set(art, email);
        setMotion(art, email, previewEnabled);
      }
      reader.append(art);
      return reader;
    }
    let enabled = previewEnabled;
    const toggle = node('button');
    toggle.className = 'button-link';
    toggle.type = 'button';
    const update = () => {
      toggle.textContent = enabled ? 'Pause GIFs' : 'Play GIFs';
      setMotion(art, email, enabled);
    };
    reader.append(toggle, art);
    toggle.addEventListener('click', () => { enabled = !enabled; update(); });
    update();
    return reader;
  };
  fetch(root + folder + 'media.json?v=20261107-gift-stack').then((response) => {
    if (!response.ok) throw new Error('Campaign inventory unavailable');
    return response.json();
  }).then(({website, groups, emails}) => {
    api.website(section.querySelector('[data-bf-website]'), website);
    window.PortfolioMediaComponents.renderAdvertisingSystem(
      section.querySelector('[data-bf-ads]'),
      groups.flatMap((group) => group.assets),
      {root, groups, expanded: true}
    );
    const issues = emails.map((email) => ({
      ...email, src: folder + email.file, displayTitle: email.title
    }));
    const gallery = section.querySelector('[data-bf-emails]');
    const playback = node('button');
    playback.className = 'artwork-motion-control';
    playback.type = 'button';
    const updatePreviews = () => {
      playback.textContent = previewEnabled ? 'Pause newsletter GIFs' : 'Play newsletter GIFs';
      previews.forEach((email, art) => {
        if (art.isConnected) setMotion(art, email, previewEnabled);
        else previews.delete(art);
      });
    };
    playback.textContent = previewEnabled ? 'Pause newsletter GIFs' : 'Play newsletter GIFs';
    playback.addEventListener('click', () => { previewEnabled = !previewEnabled; updatePreviews(); });
    reduced.addEventListener('change', () => { previewEnabled = !reduced.matches; updatePreviews(); });
    gallery.before(playback);
    window.PortfolioMediaComponents.renderNewsletterLibrary(
      gallery,
      issues,
      {root, groups: [{label: 'Black Friday newsletters', assets: issues}], expanded: true, renderIssue: renderEmail}
    );
  }).catch(() => {
    const status = section.querySelector('[data-bf-status]');
    status.textContent = 'The campaign previews could not load. Reload the page to try again.';
    status.hidden = false;
  });
})();

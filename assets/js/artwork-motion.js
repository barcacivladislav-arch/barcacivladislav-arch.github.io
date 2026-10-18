/* Original GIFs keep their authored motion, with faithful stills and one shared pause control. */
(() => {
  'use strict';
  const payload = document.querySelector('#motion-poster-data');
  let inventory = {};
  try { inventory = payload ? JSON.parse(payload.textContent) : {}; }
  catch (error) { console.warn('Animated artwork posters could not be read.', error); }
  inventory = inventory.posters || inventory;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const registrations = new Map();
  const posterSources = new Map();
  let paused = reduced.matches;
  let userChoice = null;
  let control = null;
  let home = null;
  let frame = 0;
  const absolute = source => {
    try { return new URL(source, document.baseURI).href; }
    catch { return source; }
  };
  const keyFor = source => {
    try {
      const pathname = decodeURIComponent(new URL(source, document.baseURI).pathname);
      const index = pathname.indexOf('/assets/portfolio/');
      return index >= 0 ? pathname.slice(index + 1) : '';
    } catch { return ''; }
  };
  const posterFor = (original, entry) => {
    const url = new URL(original, document.baseURI);
    const prefix = url.pathname.slice(0, url.pathname.indexOf('/assets/portfolio/'));
    return new URL(`${prefix}/${entry.poster.replace(/^\//, '')}`, url.origin).href;
  };
  Object.entries(inventory).forEach(([key, entry]) => {
    if (!entry?.poster) return;
    posterSources.set(entry.poster.replace(/^\//, ''), key);
  });
  const originalForPoster = source => {
    let pathname = '';
    try { pathname = decodeURIComponent(new URL(source, document.baseURI).pathname); } catch { return null; }
    const index = pathname.indexOf('/assets/motion-posters/');
    if (index < 0) return null;
    const key = posterSources.get(pathname.slice(index + 1));
    if (!key) return null;
    const url = new URL(source, document.baseURI);
    return new URL(`${url.pathname.slice(0, index)}/${key}`, url.origin).href;
  };
  const forget = image => {
    registrations.delete(image);
    delete image.dataset.motionOriginal;
    delete image.dataset.motionPoster;
    delete image.dataset.motionKey;
  };
  const choiceFor = record => paused ? record.poster : record.original;
  const prepare = (image, originalSource) => {
    if (!image || !originalSource) return originalSource;
    const key = keyFor(originalSource);
    const entry = inventory[key];
    if (!entry || !/\.gif(?:[?#]|$)/i.test(originalSource)) {
      forget(image);
      return originalSource;
    }
    const record = {image, key, original: originalSource, poster: posterFor(originalSource, entry), srcset: image.getAttribute('srcset') || ''};
    registrations.set(image, record);
    image.dataset.motionOriginal = originalSource;
    image.dataset.motionPoster = record.poster;
    image.dataset.motionKey = key;
    if (paused && record.srcset) image.removeAttribute('srcset');
    requestRefresh();
    return choiceFor(record);
  };
  const apply = record => {
    const choice = choiceFor(record);
    if (absolute(record.image.getAttribute('src')) !== absolute(choice)) record.image.src = choice;
    if (paused && record.image.hasAttribute('srcset')) record.image.removeAttribute('srcset');
    else if (!paused && record.srcset && record.image.getAttribute('srcset') !== record.srcset) record.image.setAttribute('srcset', record.srcset);
  };
  const connected = () => [...registrations.values()].filter(record => record.image.isConnected);
  const syncControl = () => {
    const images = connected();
    const main = document.querySelector('main');
    if (!main) return;
    if (!control && images.length) {
      control = document.createElement('button');
      control.type = 'button';
      control.className = 'artwork-motion-control';
      control.dataset.artworkMotionControl = '';
      home = document.createComment('Animated artwork playback control');
      const contents = document.querySelector('[data-project-contents]');
      if (contents) contents.after(home, control);
      else main.prepend(home, control);
      control.addEventListener('click', () => {
        paused = !paused;
        userChoice = paused;
        connected().forEach(apply);
        syncControl();
      });
    }
    if (!control) return;
    control.hidden = !images.length;
    const label = `${paused ? 'Play' : 'Pause'} animated artwork`;
    if (control.textContent !== label) control.textContent = label;
    control.setAttribute('aria-label', label);
    control.setAttribute('aria-pressed', String(!paused));
    control.dataset.motionPaused = String(paused);
    // The same single control stays reachable while a GIF is enlarged in a modal.
    const modal = [...document.querySelectorAll('dialog[open]')].reverse()
      .find(dialog => images.some(record => dialog.contains(record.image)));
    if (modal && !modal.contains(control)) {
      const heading = modal.querySelector('.media-reader__head');
      if (heading) heading.append(control);
      else modal.insertBefore(control, modal.querySelector('img') || null);
    } else if (!modal && home?.isConnected && home.nextSibling !== control) home.after(control);
  };
  const refresh = () => {
    frame = 0;
    document.querySelectorAll('img[src]').forEach(image => {
      const source = image.getAttribute('src');
      let record = registrations.get(image);
      if (record && ![absolute(record.original), absolute(record.poster)].includes(absolute(source))) {
        // A shared lightbox image may now display another, non-animated artwork.
        forget(image);
        record = null;
      }
      if (!record) {
        const original = /\.gif(?:[?#]|$)/i.test(source) ? source : originalForPoster(source);
        if (original) prepare(image, original);
        record = registrations.get(image);
      }
      if (record) apply(record);
    });
    registrations.forEach((record, image) => { if (!image.isConnected) registrations.delete(image); });
    syncControl();
  };
  function requestRefresh() { if (!frame) frame = requestAnimationFrame(refresh); }
  reduced.addEventListener('change', () => {
    if (reduced.matches) { paused = true; userChoice = null; }
    else paused = userChoice === null ? false : userChoice;
    connected().forEach(apply);
    syncControl();
  });
  const start = () => {
    // Observe parsing as well as later rendering: direct HTML GIFs receive their still
    // at the next mutation checkpoint, rather than waiting for the complete page.
    const surface = document.documentElement || document.body;
    if (!surface) return;
    new MutationObserver(requestRefresh).observe(surface, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'open']
    });
    document.addEventListener('close', requestRefresh, true);
    ['portfolio:media-ready', 'portfolio:preservation-ready'].forEach(name => document.addEventListener(name, requestRefresh));
    refresh();
  };
  window.PortfolioArtworkMotion = {prepare, refresh: requestRefresh, get paused() { return paused; }, get count() { return connected().length; }};
  start();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', requestRefresh, {once: true});
})();

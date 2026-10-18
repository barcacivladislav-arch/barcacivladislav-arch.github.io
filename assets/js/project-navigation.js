/* Project chapters remain ordinary links; this adds orientation and campaign anchors. */
(() => {
  'use strict';

  const navigation = document.querySelector('[data-project-contents]');
  const main = document.querySelector('main');
  if (!navigation || !main) return;
  const toggle = navigation.querySelector('[data-project-contents-toggle], button');
  const list = navigation.querySelector('[data-project-contents-list], ol');
  if (!toggle || !list) return;

  const project = location.pathname.match(/\/work\/([^/]+)/)?.[1] || 'project';
  const current = toggle.querySelector('[data-current-chapter]');
  let entries = [];
  let positions = [];
  let activeId = '';
  let measureFrame = 0;
  let paintFrame = 0;
  let refreshFrame = 0;
  let offset = 80;
  let restoredHash = '';
  let familySignature = '';

  const plain = value => String(value || '').replace(/\s+/g, ' ').trim();
  const slug = value => plain(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 62) || 'campaign';
  const sourceHash = value => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  };
  const targetFor = link => {
    try { return document.getElementById(decodeURIComponent(link.hash.slice(1))); }
    catch { return null; }
  };
  const mediaIdentity = family => {
    const sources = [...family.querySelectorAll('img[src], video[src], video source[src]')]
      .map(media => {
        try { return decodeURIComponent(new URL(media.getAttribute('src'), document.baseURI).pathname); }
        catch { return media.getAttribute('src') || ''; }
      }).filter(Boolean).sort();
    return sources[0] || family.querySelector('[data-asset-hash]')?.dataset.assetHash || plain(family.textContent);
  };
  const setOpen = (open, restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    list.hidden = !open;
    if (restoreFocus) toggle.focus({preventScroll: true});
  };

  list.id ||= 'project-contents-list';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', list.id);
  navigation.classList.add('is-enhanced');
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  navigation.addEventListener('focusout', event => {
    if (event.relatedTarget && !navigation.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!navigation.contains(event.target)) setOpen(false);
  });
  list.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = targetFor(link);
    setOpen(false);
    if (!target) return;
    // Keep native anchor/Lenis handling intact, while keyboard focus follows the destination.
    requestAnimationFrame(() => {
      const heading = target.matches('h1,h2,h3,h4,h5,h6') ? target : target.querySelector('h2,h3,h4,h5,h6');
      const destination = heading || target;
      if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
      destination.focus({preventScroll: true});
    });
  });

  const paint = () => {
    paintFrame = 0;
    if (!entries.length) return;
    const cursor = window.scrollY + offset;
    let index = 0;
    positions.forEach((position, candidate) => { if (position <= cursor) index = candidate; });
    const entry = entries[index];
    if (!entry || activeId === entry.target.id) return;
    activeId = entry.target.id;
    entries.forEach(candidate => {
      if (candidate === entry) candidate.link.setAttribute('aria-current', 'location');
      else candidate.link.removeAttribute('aria-current');
    });
    if (current) current.textContent = entry.label;
    navigation.dataset.currentChapter = activeId;
  };
  const measure = () => {
    measureFrame = 0;
    const stickyTop = Math.max(0, Number.parseFloat(getComputedStyle(navigation).top) || 0);
    offset = Math.ceil(stickyTop + toggle.getBoundingClientRect().height + 20);
    // Root styles use this token for anchor clearance, including keyboard destinations.
    document.documentElement.style.setProperty('--project-contents-offset', `${offset}px`);
    positions = entries.map(entry => entry.target.getBoundingClientRect().top + window.scrollY);
    paint();
  };
  const requestMeasure = () => {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  };

  const refresh = () => {
    refreshFrame = 0;
    const supporting = main.querySelector(':scope > #complete-project-library');
    if (supporting && !list.querySelector('a[href="#complete-project-library"]')) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#complete-project-library';
      link.textContent = 'More from the project';
      item.append(link);
      list.append(item);
    }
    const major = [...list.querySelectorAll('a[href^="#"]')]
      .filter(link => !link.closest('[data-project-contents-families]'))
      .map(link => ({link, target: targetFor(link), label: plain(link.textContent)}))
      .filter(entry => entry.target && !navigation.contains(entry.target));
    const families = [...main.querySelectorAll('.ad-category, .newsletter-campaign')]
      .filter(family => !navigation.contains(family) && !family.closest('dialog'))
      .map(family => {
        const label = plain(family.querySelector('.media-component__head h4, h3, h4')?.textContent
          || family.getAttribute('aria-label'));
        const owner = major.filter(entry => entry.target.contains(family)).at(-1);
        if (!label || !owner) return null;
        if (!family.id) family.id = `campaign-${slug(project)}-${slug(label)}-${sourceHash(mediaIdentity(family))}`;
        return {target: family, label, owner};
      }).filter(Boolean);
    const signature = families.map(family => `${family.owner.target.id}|${family.target.id}|${family.label}`).join('\n');
    if (signature !== familySignature || !navigation.dataset.initialized) {
      // Rebuild only generated links. Existing static chapters and their ordinary URLs survive.
      list.querySelectorAll('[data-project-contents-families]').forEach(group => group.remove());
      const groups = new Map();
      families.forEach(family => {
        let group = groups.get(family.owner);
        if (!group) {
          group = document.createElement('ol');
          group.className = 'project-contents__families';
          group.dataset.projectContentsFamilies = '';
          family.owner.link.closest('li')?.append(group);
          groups.set(family.owner, group);
        }
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${family.target.id}`;
        link.textContent = family.label;
        item.append(link);
        group.append(item);
      });
      familySignature = signature;
    }
    entries = [...list.querySelectorAll('a[href^="#"]')]
      .map(link => ({link, target: targetFor(link), label: plain(link.textContent)}))
      .filter(entry => entry.target && !navigation.contains(entry.target));
    const seen = new Set();
    entries = entries.filter(entry => {
      if (seen.has(entry.target.id)) return false;
      seen.add(entry.target.id);
      return true;
    });
    entries.sort((a, b) => a.target === b.target ? 0
      : a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    activeId = '';
    navigation.dataset.initialized = 'true';
    navigation.dataset.chapterCount = String(major.length);
    navigation.dataset.campaignCount = String(families.length);
    requestMeasure();

    // A campaign anchor may not exist until the asynchronous media inventory has rendered.
    // Restore that initial deep link once; ordinary later anchor navigation remains native.
    if (location.hash && restoredHash !== location.hash) {
      let hashTarget = null;
      try { hashTarget = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch {}
      if (hashTarget && families.some(family => family.target === hashTarget)) {
        restoredHash = location.hash;
        requestAnimationFrame(() => hashTarget.scrollIntoView({behavior: 'instant', block: 'start'}));
      }
    }
  };
  const requestRefresh = () => {
    if (!refreshFrame) refreshFrame = requestAnimationFrame(refresh);
  };
  window.addEventListener('scroll', () => {
    if (!paintFrame) paintFrame = requestAnimationFrame(paint);
  }, {passive: true});
  window.addEventListener('resize', requestMeasure, {passive: true});
  window.addEventListener('pageshow', requestRefresh);
  window.addEventListener('hashchange', () => { setOpen(false); requestMeasure(); });
  ['portfolio:media-ready', 'portfolio:preservation-ready'].forEach(name => document.addEventListener(name, requestRefresh));
  if ('ResizeObserver' in window) new ResizeObserver(requestMeasure).observe(main);
  document.fonts?.ready.then(requestMeasure);
  refresh();
})();

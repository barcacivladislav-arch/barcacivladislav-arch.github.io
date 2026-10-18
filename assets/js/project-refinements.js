/* Connect the existing design decisions to supplied project evidence. */
(() => {
  'use strict';

  const slug = location.pathname.match(/\/work\/([^/]+)/)?.[1];
  const plans = {
    medicam3: [
      {
        source: 'medicaM3/landing page/dektop.jpg',
        label: 'Homepage · Category and product structure',
        alt: 'MedicaM3 desktop homepage showing categories, product groups and catalogue navigation',
        kind: 'screen'
      },
      {
        source: 'medicaM3/website banners/Website Banners July 9/04. Kerr Partner/kerr-desktop.jpg',
        label: 'Kerr · Professional product communication',
        alt: 'MedicaM3 and Kerr campaign banner with clinical imagery, product benefits and a clear call to action',
        kind: 'artwork'
      },
      {
        source: 'medicaM3/newsletters/general/NoGag.jpg',
        label: 'NoGag · Campaign newsletter',
        alt: 'Complete MedicaM3 NoGag newsletter carrying product information and commercial hierarchy into email',
        kind: 'newsletter'
      }
    ],
    chariot: [
      {
        source: 'Chariot/campaign/New Arrivals Email 7.jpg',
        label: 'New Arrivals · Campaign newsletter',
        alt: 'Chariot New Arrivals newsletter using fashion imagery to introduce the product selection',
        kind: 'newsletter'
      },
      {
        source: 'Chariot/campaign/SYNTHETICS is whats keeping you cold this winter.jpg',
        label: 'Material Story · Product education',
        alt: 'Chariot newsletter explaining clothing materials through editorial imagery and supporting detail',
        kind: 'newsletter'
      },
      {
        source: 'Chariot/flows/cart abandoned flow 2 A.jpg',
        label: 'Cart Recovery · Lifecycle email',
        alt: 'Chariot abandoned cart email with product reminders and a primary return-to-cart action',
        kind: 'newsletter'
      }
    ],
    etic: [
      {
        source: 'etic/website pitch/home/Home Page - Desktop.jpg',
        label: 'Homepage · Collection direction',
        alt: 'Etic desktop homepage introducing the fashion collection before the product catalogue',
        kind: 'screen'
      },
      {
        source: 'etic/website pitch/collection/Collection - Desktop.jpg',
        label: 'Collection · Product discovery',
        alt: 'Etic collection page with a consistent product grid and filtering controls',
        kind: 'screen'
      },
      {
        source: 'etic/website pitch/product/Product Page - Desktop.jpg',
        label: 'Product · Detail and purchase',
        alt: 'Etic product page bringing garment imagery, variation and purchase information together',
        kind: 'screen'
      }
    ]
  };
  if (!plans[slug]) return;

  const enhanceDecisions = async () => {
    const grid = document.querySelector('.flagship-decisions .decision-grid');
    const assets = window.PROJECT_MANIFEST?.assets;
    if (!grid || !assets || grid.dataset.evidenceReady) return;
    const cards = [...grid.children].filter((node) => node.tagName === 'ARTICLE');
    const selections = plans[slug].map((plan) => ({
      ...plan,
      asset: assets.find((asset) => (asset.source || '').replace(/\\/g, '/') === plan.source)
    }));
    // Leave the authored copy intact if this project does not supply every
    // selected example. Never substitute another project's artwork.
    if (cards.length !== selections.length || selections.some((selection) => !selection.asset)) return;

    const root = document.body.dataset.assetRoot || '../../';
    if (slug === 'chariot' && window.PortfolioMediaComponents?.renderNewsletterLibrary) {
      // These are selected examples, not another complete campaign collection.
      // Let the primary inventory finish before adding the three reading aids.
      grid.dataset.evidenceReady = 'pending';
      await window.PortfolioPreservation?.finish();
      const library = document.createElement('div');
      library.id = 'chariot-decision-evidence';
      library.className = 'decision-story decision-story--newsletters';
      const examples = selections.map(({asset, label, alt}) => ({...asset, displayTitle: label, alt}));
      grid.before(library);
      window.PortfolioMediaComponents.renderNewsletterLibrary(library, examples, {
        root, showIntro: false,
        groups: [{label: 'Design decisions', assets: examples}]
      });
      const previews = [...library.querySelectorAll('.newsletter-card')];
      cards.forEach((card, index) => {
        const copy = document.createElement('div');
        copy.className = 'evidence-card__copy';
        copy.append(...card.childNodes);
        const title = copy.querySelector('h3');
        if (title) {
          title.id = `chariot-decision-${index + 1}`;
          previews[index].setAttribute('aria-labelledby', title.id);
        }
        previews[index].append(copy);
      });
      grid.remove();
      library.dataset.evidenceReady = 'true';
      document.dispatchEvent(new Event('portfolio:media-ready'));
      return;
    }
    const story = document.createElement('div');
    story.className = 'decision-story';
    const controls = document.createElement('div');
    controls.className = 'decision-story__controls';
    const instruction = document.createElement('p');
    instruction.className = 'decision-story__instruction';
    instruction.textContent = 'Explore the decisions through the work.';
    const position = document.createElement('span');
    position.className = 'decision-story__position';
    position.setAttribute('role', 'status');
    position.setAttribute('aria-live', 'polite');
    position.setAttribute('aria-atomic', 'true');
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'decision-story__previous';
    previous.textContent = '←';
    previous.setAttribute('aria-label', 'Previous design decision');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'decision-story__next';
    next.textContent = '→';
    next.setAttribute('aria-label', 'Next design decision');

    grid.id = `${slug}-decision-evidence`;
    grid.classList.remove('decision-grid');
    grid.classList.add('evidence-rail');
    grid.dataset.evidenceReady = 'true';
    grid.tabIndex = 0;
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-label', 'Design decisions illustrated by project work');
    previous.setAttribute('aria-controls', grid.id);
    next.setAttribute('aria-controls', grid.id);

    cards.forEach((card, index) => {
      const selection = selections[index];
      const asset = selection.asset;
      card.classList.add('evidence-card');
      const copy = document.createElement('div');
      copy.className = 'evidence-card__copy';
      copy.append(...card.childNodes);
      const title = copy.querySelector('h3');
      if (title) {
        title.id = `${slug}-decision-${index + 1}`;
        card.setAttribute('aria-labelledby', title.id);
      }
      const figure = document.createElement('figure');
      figure.className = 'evidence-card__figure';
      const viewport = document.createElement('div');
      viewport.className = `evidence-card__viewport evidence-card__viewport--${selection.kind}`;
      if (selection.kind !== 'artwork') {
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', `${selection.label}. Scroll to inspect the complete ${selection.kind === 'newsletter' ? 'email' : 'page'}.`);
      }
      const image = document.createElement('img');
      image.src = root + asset.src;
      image.alt = selection.alt;
      image.width = asset.width;
      image.height = asset.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.dataset.lightbox = 'true';
      const caption = document.createElement('figcaption');
      caption.className = 'evidence-card__caption';
      caption.textContent = selection.label;
      viewport.append(image);
      figure.append(viewport, caption);
      card.append(figure, copy);
    });

    controls.append(instruction, position, previous, next);
    grid.before(story);
    story.append(controls, grid);

    let current = 0;
    let pendingFrame = 0;
    const positions = () => cards.map((card) => card.offsetLeft - cards[0].offsetLeft);
    const update = () => {
      pendingFrame = 0;
      const offsets = positions();
      const left = grid.scrollLeft;
      const max = Math.max(0, grid.scrollWidth - grid.clientWidth);
      current = offsets.reduce((selected, offset, index) => Math.abs(offset - left) < Math.abs(offsets[selected] - left) ? index : selected, 0);
      if (max > 0 && max - left < 2) current = cards.length - 1;
      const label = `${current + 1} / ${cards.length}`;
      if (position.textContent !== label) position.textContent = label;
      previous.disabled = left <= 2;
      next.disabled = max - left <= 2;
      controls.hidden = max <= 2;
    };
    const queueUpdate = () => {
      if (!pendingFrame) pendingFrame = requestAnimationFrame(update);
    };
    const moveTo = (index) => {
      const target = Math.max(0, Math.min(cards.length - 1, index));
      grid.scrollTo({
        left: positions()[target],
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    };
    previous.addEventListener('click', () => moveTo(current - 1));
    next.addEventListener('click', () => moveTo(current + 1));
    grid.addEventListener('keydown', (event) => {
      if (event.target !== grid) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        moveTo(current + (event.key === 'ArrowLeft' ? -1 : 1));
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        moveTo(event.key === 'Home' ? 0 : cards.length - 1);
      }
    });
    grid.addEventListener('scroll', queueUpdate, { passive: true });
    grid.addEventListener('load', queueUpdate, true);
    if ('ResizeObserver' in window) new ResizeObserver(queueUpdate).observe(grid);
    else window.addEventListener('resize', queueUpdate, { passive: true });
    queueUpdate();
    document.dispatchEvent(new Event('portfolio:media-ready'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceDecisions, { once: true });
  else enhanceDecisions();
})();

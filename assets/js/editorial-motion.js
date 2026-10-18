/* Lenis 1.3.27 API: https://github.com/darkroomengineering/lenis/tree/v1.3.27 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const nativeRegions = 'dialog,[data-native-scroll],[data-lenis-prevent],.website-screen,.device__viewport,.newsletter-card__viewport,.media-reader__viewport,.reader-scroll,.media-scroller__track,.newsletter-rail,.reel-track,.evidence-rail,.evidence-card__viewport,.behance-contents,.project-contents,.discipline-menu';
  let controller = null;
  let resizeFrame = 0;
  const playing = new Set();
  const observed = new WeakSet();

  const syncModal = () => {
    if (!controller) return;
    if (document.hidden || document.querySelector('dialog[open]')) controller.stop();
    else if (controller.isStopped) controller.start();
  };
  const refresh = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => controller?.resize());
  };
  const syncScroll = () => {
    if (reduced.matches || !finePointer.matches || typeof window.Lenis !== 'function') {
      controller?.destroy();
      controller = null;
      return;
    }
    if (!controller) {
      try {
        controller = new window.Lenis({
          autoRaf: true,
          lerp: .12,
          smoothWheel: true,
          syncTouch: false,
          anchors: true,
          allowNestedScroll: true,
          respectReducedMotion: true,
          stopInertiaOnNavigate: true,
          prevent: node => node instanceof Element && !!node.closest(nativeRegions),
          virtualScroll: ({event}) => event.type === 'wheel' && !event.ctrlKey && !event.metaKey && !event.shiftKey
        });
      } catch {
        controller = null;
      }
    }
    syncModal();
  };
  const trackAnimation = animation => {
    playing.add(animation);
    animation.finished.catch(() => {}).finally(() => playing.delete(animation));
  };
  const draw = sketch => {
    if (sketch.dataset.drawn) return;
    sketch.dataset.drawn = 'true';
    if (reduced.matches) return;
    [...sketch.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect')].forEach((stroke, index) => {
      if (typeof stroke.getTotalLength !== 'function' || getComputedStyle(stroke).stroke === 'none') return;
      let length = 0;
      try { length = stroke.getTotalLength(); } catch { return; }
      if (!length) return;
      trackAnimation(stroke.animate([
        {strokeDasharray: `${length} ${length}`, strokeDashoffset: length},
        {strokeDasharray: `${length} ${length}`, strokeDashoffset: 0}
      ], {duration: 720, delay: Math.min(index * 45, 120), easing: 'cubic-bezier(.2,.65,.3,1)'}));
    });
  };
  const sketchObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      draw(entry.target);
      sketchObserver.unobserve(entry.target);
    });
  }, {threshold: .2}) : null;
  const registerSketches = () => {
    document.querySelectorAll('.note-sketch').forEach(sketch => {
      if (observed.has(sketch)) return;
      observed.add(sketch);
      if (sketchObserver && !reduced.matches) sketchObserver.observe(sketch);
      else draw(sketch);
    });
  };
  const syncPreference = () => {
    if (reduced.matches) {
      playing.forEach(animation => animation.cancel());
      playing.clear();
      document.querySelectorAll('.note-sketch').forEach(draw);
    }
    syncScroll();
  };
  reduced.addEventListener('change', syncPreference);
  finePointer.addEventListener('change', syncScroll);
  document.addEventListener('visibilitychange', syncModal);
  document.addEventListener('close', syncModal, true);
  new MutationObserver(records => {
    syncModal();
    if (records.some(record => record.addedNodes.length)) registerSketches();
  }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open']});
  ['portfolio:media-ready', 'portfolio:preservation-ready'].forEach(name => document.addEventListener(name, () => {
    refresh();
    registerSketches();
  }));
  window.addEventListener('pagehide', () => {
    controller?.destroy();
    controller = null;
  });
  window.addEventListener('pageshow', syncScroll);
  syncScroll();
  registerSketches();
  const hero = document.querySelector('.portfolio-hero');
  if (hero && !reduced.matches) trackAnimation(hero.animate([{opacity: .88}, {opacity: 1}], {duration: 360, easing: 'ease-out'}));
  window.PortfolioMotion = {refresh, scrollTo(target) { if(controller) controller.scrollTo(target,{duration:.8}); else window.scrollTo({top:target,behavior:reduced.matches?'instant':'smooth'}); }, get scrollController() { return controller; }};
})();

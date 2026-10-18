(() => {
  const api = window.PortfolioExperience;
  const assets = window.PROJECT_MANIFEST?.assets || [];
  if (!api) return;
  const sixth = assets.filter((asset) => asset.group === "sixth-wave");
  const campaign = (folder) => sixth.filter((asset) => new RegExp(`Product Images/${folder}/0[1-5]\\.webp$`, "i").test(asset.source));
  const host = document.querySelector("[data-sixth-wave-campaigns]");
  if (host) api.reel(host, [
    { label: "Classic edition", title: "One launch world across five hero compositions", copy: "Product scale, material textures and compressed typography give the core edition several campaign moments without changing its recognition cues.", assets: campaign("666g") },
    { label: "MAXXI edition", title: "The same system at a larger scale", copy: "MAXXI keeps the visual grammar but changes proportion and product emphasis, allowing the larger format to feel related without becoming a duplicate.", assets: campaign("MAXXI") }
  ]);

  const flavourNames = ["Blueberry", "Coconut", "Double-Apple", "Gum-Mint", "Hawaii", "Kiwi", "Lady-Killer", "Love66", "Mango-Ice", "Passion-fruit", "Pineapple", "Strawberry-Kiwi-Ice", "Strawberry", "Tequila-Apple", "Watermelon"];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-flavour-sequence]").forEach((figure) => {
    const family = figure.dataset.flavourSequence;
    const image = figure.querySelector("img");
    if (!image) return;
    const paths = flavourNames.map((name) => `../../assets/portfolio/cdl/sixth-wave/Sixth Wave/Product Images/Flavors/${family}/${name}.webp`);
    let index = Math.max(0, paths.findIndex((path) => image.src.endsWith(encodeURI(path.replace(/^\.\.\/\.\.\//, "")))));
    const edition = family === "666" ? "Classic" : "MAXXI";
    const controls = document.createElement("div");
    controls.className = "flavour-controls";
    let isPlaying = false;
    let isVisible = !("IntersectionObserver" in window);
    let timer = 0;
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", `Previous ${edition} flavour`);
    const label = document.createElement("span");
    label.setAttribute("aria-live", "polite");
    label.setAttribute("aria-atomic", "true");
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", `Next ${edition} flavour`);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "flavour-controls__toggle";
    toggle.setAttribute("aria-pressed", "false");
    image.id = `sixth-wave-flavour-${family}`;
    image.dataset.lightbox = "true";
    [previous, next, toggle].forEach((button) => button.setAttribute("aria-controls", image.id));
    const syncPlayback = () => {
      toggle.disabled = reducedMotion.matches;
      toggle.textContent = reducedMotion.matches ? "Slideshow off" : isPlaying ? "Pause slideshow" : "Play slideshow";
      toggle.setAttribute("aria-label", reducedMotion.matches
        ? `${edition} automatic slideshow disabled by reduced motion preference`
        : `${isPlaying ? "Pause" : "Play"} ${edition} flavour slideshow`);
      toggle.setAttribute("aria-pressed", String(isPlaying));
      label.setAttribute("aria-live", isPlaying ? "off" : "polite");
      figure.dataset.slideshowPlaying = String(isPlaying);
    };
    const pause = () => {
      window.clearTimeout(timer);
      timer = 0;
      isPlaying = false;
      syncPlayback();
    };
    const select = (offset = 0) => {
      index = (index + offset + paths.length) % paths.length;
      const flavour = flavourNames[index].replace(/-/g, " ");
      image.src = paths[index];
      image.alt = `${edition} edition packaging: ${flavour}`;
      image.closest(".artwork-expand")?.setAttribute("aria-label", `Enlarge ${image.alt}`);
      label.textContent = `${flavour} · ${index + 1} / ${paths.length}`;
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (!isPlaying || !isVisible || document.hidden || reducedMotion.matches) return;
      timer = window.setTimeout(() => {
        if (!isPlaying || !isVisible || document.hidden || reducedMotion.matches) return;
        select(1);
        schedule();
      }, 5000);
    };
    previous.addEventListener("click", () => { pause(); select(-1); });
    next.addEventListener("click", () => { pause(); select(1); });
    toggle.addEventListener("click", () => {
      if (isPlaying) { pause(); return; }
      if (reducedMotion.matches || document.hidden || !isVisible) return;
      isPlaying = true;
      syncPlayback();
      schedule();
    });
    figure.addEventListener("pointerdown", (event) => { if (!toggle.contains(event.target)) pause(); });
    figure.addEventListener("focusin", (event) => { if (!toggle.contains(event.target)) pause(); });
    figure.addEventListener("wheel", pause, { passive: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
    reducedMotion.addEventListener("change", () => { pause(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (!isVisible) pause();
      }, { threshold: .2 }).observe(figure);
    }
    controls.append(previous, label, next, toggle);
    figure.append(controls);
    select();
    syncPlayback();
    window.PortfolioPreservation?.registerPrimaryAssets?.(figure, paths.map((src) => ({ src })), "flavour sequence");
  });
})();

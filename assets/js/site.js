(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteConfig = window.PORTFOLIO_SITE_CONFIG || {};
  const canonicalBaseUrl = String(siteConfig.canonicalBaseUrl || "").replace(/\/$/, "");
  if (/^https:\/\/[^/]+/.test(canonicalBaseUrl)) {
    const route = location.pathname.replace(/\/index\.html$/, "/");
    const canonicalUrl = `${canonicalBaseUrl}${route}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
    let openGraphUrl = document.querySelector('meta[property="og:url"]');
    if (!openGraphUrl) {
      openGraphUrl = document.createElement("meta");
      openGraphUrl.setAttribute("property", "og:url");
      document.head.append(openGraphUrl);
    }
    openGraphUrl.content = canonicalUrl;
  }
  if (!document.querySelector('meta[name="robots"]')) {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "index, follow";
    document.head.append(robots);
  }
  if (!document.querySelector('link[rel~="icon"]')) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.href = `${document.body?.dataset.assetRoot || ""}assets/favicon.svg`;
    document.head.append(favicon);
  }
  const pageTitle = document.title;
  const pageDescription = document.querySelector('meta[name="description"]')?.content || "";
  const socialMeta = [
    ["property", "og:type", "website"],
    ["property", "og:title", pageTitle],
    ["property", "og:description", pageDescription],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", pageTitle],
    ["name", "twitter:description", pageDescription]
  ];
  socialMeta.forEach(([attribute, key, content]) => {
    if (!content || document.querySelector(`meta[${attribute}="${key}"]`)) return;
    const meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    meta.content = content;
    document.head.append(meta);
  });

  const assetRoot = document.body.dataset.assetRoot || "";
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    const syncHeaderHeight = () => document.documentElement.style.setProperty("--site-header-height", `${siteHeader.offsetHeight}px`);
    syncHeaderHeight();
    new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  }
  const data = window.PORTFOLIO_ASSETS || { galleries: {}, overview: {} };
  document.querySelectorAll('[data-herbaris-website][aria-label]:not([role])')
    .forEach((element) => element.setAttribute('role', 'region'));

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const key = gallery.dataset.gallery;
    const images = data.galleries[key] || [];
    images.forEach((item, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = assetRoot + item.src;
      image.width = item.width;
      image.height = item.height;
      image.loading = index < 2 ? "eager" : "lazy";
      image.decoding = "async";
      image.alt = `${key.replaceAll("-", " ")} — selected design ${String(index + 1).padStart(2, "0")}`;
      image.dataset.lightbox = "true";
      figure.append(image);
      gallery.append(figure);
    });
  });

  const dialog = document.querySelector("#image-dialog");
  const dialogImage = dialog?.querySelector("img");
  let imageTrigger = null;
  const openImage = (image) => {
    if (!dialog || !dialogImage || dialog.open) return;
    imageTrigger = image;
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt;
    dialog.showModal();
    dialog.scrollTop = 0;
  };
  document.addEventListener("click", (event) => {
    const image = event.target.closest("img[data-lightbox]");
    if (!image || !dialog || !dialogImage) return;
    openImage(image);
  });
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("img[data-lightbox]")) {
      event.preventDefault();
      openImage(event.target);
    }
  });
  dialog?.addEventListener("close", () => imageTrigger?.focus({ preventScroll: true }));
  const enhanceMedia = () => {
    document.querySelectorAll('img[data-lightbox]:not([tabindex])').forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `Enlarge ${image.alt || "artwork"}`);
    });
    document.querySelectorAll('.project-gallery--horizontal, .sixth-wave-product-trio, .sixth-wave-editorial').forEach((gallery, index) => {
      if (gallery.dataset.controlsReady) return;
      gallery.dataset.controlsReady = "true";
      gallery.id ||= `scroll-gallery-${index}`;
      gallery.tabIndex = 0;
      const controls = document.createElement("div");
      controls.className = "gallery-controls";
      controls.setAttribute("aria-label", "Gallery navigation");
      const buttons = [-1, 1].map((direction) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = direction < 0 ? "← Previous" : "Next →";
        button.setAttribute("aria-controls", gallery.id);
        button.addEventListener("click", () => gallery.scrollBy({ left: direction * gallery.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
        controls.append(button);
        return button;
      });
      gallery.after(controls);
      const sync = () => {
        controls.hidden = gallery.scrollWidth <= gallery.clientWidth + 2;
        buttons[0].disabled = gallery.scrollLeft <= 1;
        buttons[1].disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2;
      };
      gallery.addEventListener("scroll", sync, { passive: true });
      new ResizeObserver(sync).observe(gallery);
      sync();
    });
  };
  enhanceMedia();
  document.addEventListener("portfolio:media-ready", enhanceMedia);
  dialog?.querySelector("button")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const projectOrder = [
    ["herbaris", "Herbaris"],
    ["cdl", "CDL"],
    ["klintensiv", "Klintensiv"],
    ["elite-homes", "Elite Homes"],
    ["capodopera", "Capodopera 12"],
    ["intergasses", "Intergasses"],
    ["snus", "CDL SNUS"],
    ["ark-development", "Ark Development"],
    ["coreleaf", "CoreLeaf"],
    ["bioc", "BioC"],
    ["medicam3", "MedicaM3"],
    ["comod", "COMOD"],
    ["chariot", "Chariot"],
    ["etic", "Etic"],
    ["emma-red", "Emma Red Estate"],
    ["like-coffee", "Like Coffee"],
    ["ark-capital", "Ark Capital"],
    ["sope", "SOPE"]
  ];

  const smallProjectSlugs = new Set([
    "snus", "ark-development", "coreleaf", "bioc", "medicam3", "comod",
    "chariot", "etic", "emma-red", "like-coffee", "ark-capital", "sope"
  ]);
  const routeSlug = location.pathname.match(/\/work\/([^/]+)\/?(?:index\.html)?$/)?.[1];
  const isSmallProject = smallProjectSlugs.has(routeSlug);
  if (routeSlug && !isSmallProject) document.body.classList.add("big-project-template");
  if (isSmallProject) document.body.classList.add("small-project-template");

  const installSmallProjectStory = () => {
    if (!isSmallProject || document.querySelector(".small-project-story")) return;
    const main = document.querySelector("#case-main");
    const intro = main?.querySelector(":scope > .case-intro");
    const result = main?.querySelector(":scope > .result-panel");
    const snusStory = main?.querySelector(":scope > .snus-story");
    const chapters = snusStory
      ? [...snusStory.querySelectorAll(":scope > .snus-block")]
      : [...(main?.querySelectorAll(":scope > .case-section") || [])];
    const storyNodes = snusStory ? [snusStory] : chapters;
    if (!main || !intro || !storyNodes.length) return;

    document.body.classList.add("small-project-template");
    intro.id ||= "context";
    if (result) result.id ||= "outcome";
    if (main.querySelector(".behance-story-shell")) return;

    const story = document.createElement("section");
    story.className = "small-project-story wrap reveal";
    story.setAttribute("aria-label", "Project story");
    const rail = document.createElement("nav");
    rail.className = "story-rail";
    rail.setAttribute("aria-label", "Project contents");
    const railTitle = document.createElement("span");
    railTitle.className = "story-rail__title";
    railTitle.textContent = "Contents";
    rail.append(railTitle);
    const surface = document.createElement("div");
    surface.className = "small-project-story__surface";
    storyNodes[0].before(story);
    story.append(rail, surface);
    storyNodes.forEach((node) => surface.append(node));

    const targets = [intro, ...chapters, ...(result ? [result] : [])];
    const links = targets.map((target, index) => {
      target.id ||= `story-${index}`;
      const heading = target.querySelector(".snus-phase strong")
        || target.querySelector(".case-section__copy h3")
        || target.querySelector(".snus-block__head .section-label")
        || target.querySelector(".section-label")
        || target.querySelector("h2, h3");
      const link = document.createElement("a");
      link.href = `#${target.id}`;
      link.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${heading?.textContent?.trim() || `Chapter ${index + 1}`}</strong>`;
      rail.append(link);
      return link;
    });

    if ("IntersectionObserver" in window) {
      const railObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const activeIndex = targets.indexOf(entry.target);
          links.forEach((link, index) => {
            const active = index === activeIndex;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
          const activeLink = links[activeIndex];
          if (activeLink && rail.scrollWidth > rail.clientWidth) {
            rail.scrollTo({
              left: activeLink.offsetLeft - (rail.clientWidth - activeLink.offsetWidth) / 2,
              behavior: reducedMotion ? "auto" : "smooth"
            });
          }
        });
      }, { rootMargin: "-20% 0px -68%", threshold: 0 });
      targets.forEach((target) => railObserver.observe(target));
    }
    links[0]?.classList.add("is-active");
    links[0]?.setAttribute("aria-current", "location");
  };
  // Only authored Behance exports use the Figma contents rail. Typed website,
  // advertising, banner and newsletter projects keep their dedicated viewers.

  const facts = [...document.querySelectorAll(".case-facts > div")];
  const factByName = (name) => facts.find((fact) => fact.querySelector("dt")?.textContent.trim() === name)?.querySelector("dd");
  const role = factByName("Role");
  const responsibilities = factByName("Scope");
  const resultPanel = document.querySelector(".result-panel");
  const outcome = resultPanel?.querySelector("h2");
  role?.setAttribute("data-content-slot", "exact-role");
  responsibilities?.setAttribute("data-content-slot", "responsibilities");
  resultPanel?.setAttribute("data-content-slot", "verified-outcomes");

  const overview = document.querySelector(".case-overview");
  const hero = document.querySelector(".case-hero");
  const figmaHeroCovers = {
    herbaris: "assets/portfolio/home-covers/herbaris.webp",
    cdl: "assets/portfolio/home-covers/cdl.webp",
    capodopera: "assets/portfolio/home-covers/capodopera.webp",
    intergasses: "assets/portfolio/home-covers/intergasses.webp",
    snus: "assets/portfolio/home-covers/snus.webp",
    "ark-development": "assets/portfolio/home-covers/ark-development.webp",
    coreleaf: "assets/portfolio/home-covers/coreleaf.webp",
    bioc: "assets/portfolio/home-covers/bioc.webp",
    medicam3: "assets/portfolio/home-covers/medicam3.webp",
    comod: "assets/portfolio/home-covers/comod.webp",
    chariot: "assets/portfolio/home-covers/chariot.webp",
    etic: "assets/portfolio/home-covers/etic.webp",
    "emma-red": "assets/portfolio/home-covers/emma-red.webp",
    "like-coffee": "assets/portfolio/home-covers/like-coffee.webp",
    "ark-capital": "assets/portfolio/home-covers/ark-capital.webp",
    sope: "assets/portfolio/home-covers/sope.webp",
    klintensiv: "assets/portfolio/home-covers/klintensiv.webp",
    "elite-homes": "assets/portfolio/home-covers/elite-homes.webp"
  };
  const installHeroMedia = () => {
    if (!hero || hero.querySelector(".case-hero__media")) return;
    const source = document.querySelector(".case-overview img, main .project-media img, main .board-image, main img");
    const attachedHero = figmaHeroCovers[routeSlug];
    if (!attachedHero && !source?.src) return;
    const media = document.createElement("img");
    media.className = "case-hero__media";
    media.src = attachedHero ? `${document.body.dataset.assetRoot || ""}${attachedHero}?v=20261008-1` : source.currentSrc || source.src;
    media.alt = "";
    media.setAttribute("aria-hidden", "true");
    media.loading = "eager";
    hero.prepend(media);
    hero.classList.add("case-hero--media");
  };
  installHeroMedia();
  document.addEventListener("portfolio:media-ready", installHeroMedia);
  if (overview && role && responsibilities && outcome) {
    const snapshot = document.createElement("section");
    snapshot.className = "case-snapshot wrap reveal";
    snapshot.setAttribute("aria-label", "Project role and outcome summary");
    snapshot.innerHTML = `
      <div><span class="section-label">Role</span><p>${role.textContent}</p></div>
      <div><span class="section-label">Responsibilities</span><p>${responsibilities.textContent}</p></div>
      <div class="case-snapshot__outcome"><span class="section-label">Outcome</span><p>${outcome.textContent}</p></div>`;
    overview.insertAdjacentElement("afterend", snapshot);
  }

  const currentIndex = projectOrder.findIndex(([slug]) => location.pathname.includes(`/work/${slug}/`));
  const footer = document.querySelector(".site-footer");
  if (currentIndex >= 0 && footer) {
    const position = `${String(currentIndex + 1).padStart(2, "0")} / ${projectOrder.length}`;
    const headerPosition = document.querySelector(".site-header .header-meta");
    const caseLabel = document.querySelector(".case-hero .section-label");
    if (headerPosition) headerPosition.textContent = position;
    if (caseLabel) caseLabel.textContent = `Case study ${String(currentIndex + 1).padStart(2, "0")}`;
    document.querySelectorAll("main > .next-project").forEach((legacyNext) => legacyNext.remove());
    const previous = projectOrder[(currentIndex - 1 + projectOrder.length) % projectOrder.length];
    const next = projectOrder[(currentIndex + 1) % projectOrder.length];
    const switcher = document.createElement("nav");
    switcher.className = "project-switcher wrap reveal";
    switcher.setAttribute("aria-label", "Browse portfolio projects");
    switcher.innerHTML = `
      <a class="project-switcher__link" href="../${previous[0]}/"><span class="section-label">← Previous</span><strong>${previous[1]}</strong></a>
      <a class="project-switcher__index" href="../../#work"><span class="section-label">All work</span><strong>${String(currentIndex + 1).padStart(2, "0")} / ${projectOrder.length}</strong></a>
      <a class="project-switcher__link" href="../${next[0]}/"><span class="section-label">Next →</span><strong>${next[1]}</strong></a>`;
    footer.insertAdjacentElement("beforebegin", switcher);
  }

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 })
    : null;

  document.querySelectorAll(".reveal").forEach((item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains("reveal"));
    const index = siblings.indexOf(item);
    item.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 55}ms`);
    if (observer) observer.observe(item);
    else item.classList.add("is-visible");
  });

  const header = document.querySelector(".site-header");
  const nav = header?.querySelector('.site-nav');
  if (nav) {
    nav.id ||= 'main-navigation';
    const toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.type = 'button';
    toggle.textContent = 'Menu';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', 'false');
    const closeMenu = () => { header.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.before(toggle);
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && header.classList.contains('menu-open')) { closeMenu(); toggle.focus(); } });
  }
  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.type = "button";
  backToTop.setAttribute("aria-label", "Back to top");
  backToTop.textContent = "↑";
  document.body.append(backToTop);
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const syncHeader = () => {
    header?.classList.toggle("is-compact", window.scrollY > 48);
    backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 1.25);
    const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    document.documentElement.style.setProperty("--page-progress", String(Math.min(1, window.scrollY / available)));
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".work-tile").forEach((tile) => {
      tile.addEventListener("pointermove", (event) => {
        const bounds = tile.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - .5) * -12;
        const y = ((event.clientY - bounds.top) / bounds.height - .5) * -12;
        tile.style.setProperty("--mx", `${x}px`);
        tile.style.setProperty("--my", `${y}px`);
      });
      tile.addEventListener("pointerleave", () => {
        tile.style.setProperty("--mx", "0px");
        tile.style.setProperty("--my", "0px");
      });
    });
  }

  const clarityHero = document.querySelector("[data-clarity-hero]");
  const clarityCanvas = clarityHero?.querySelector("[data-clarity-canvas]");
  if (clarityHero && clarityCanvas && !reducedMotion) {
    const context = clarityCanvas.getContext("2d");
    const marker = clarityHero.querySelector("[data-clarity-marker]");
    const pointCount = 72;
    const random = (index, salt = 0) => {
      const value = Math.sin(index * 91.733 + salt * 37.119) * 43758.5453;
      return value - Math.floor(value);
    };
    const points = Array.from({ length: pointCount }, (_, index) => {
      const branch = index % 6;
      const step = Math.floor(index / 6);
      const targetX = .54 + step * .034;
      const branchY = [.18, .31, .43, .57, .69, .82][branch];
      const curve = Math.sin((step / 11) * Math.PI) * (branch - 2.5) * .014;
      return {
        fromX: .46 + (random(index, 1) - .5) * .46,
        fromY: .5 + (random(index, 2) - .5) * .72,
        toX: targetX,
        toY: branchY + curve,
        size: index % 12 === 0 ? 3.2 : 1.35 + random(index, 3) * 1.5,
        branch,
        step,
      };
    });
    let width = 0;
    let height = 0;
    let target = .72;
    let progress = .18;
    let frame = 0;
    const resizeClarity = () => {
      const bounds = clarityHero.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      clarityCanvas.width = Math.round(width * ratio);
      clarityCanvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const interpolate = (from, to, amount) => from + (to - from) * amount;
    const drawClarity = () => {
      context.clearRect(0, 0, width, height);
      progress += (target - progress) * .045;
      clarityHero.style.setProperty("--clarity", `${Math.round(progress * 100)}%`);
      context.strokeStyle = "rgba(243,234,223,.055)";
      context.lineWidth = 1;
      for (let x = width * .48; x < width; x += Math.max(74, width / 15)) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
      }
      for (let y = 0; y < height; y += Math.max(74, height / 10)) {
        context.beginPath(); context.moveTo(width * .48, y); context.lineTo(width, y); context.stroke();
      }
      const positions = points.map((point) => ({
        x: interpolate(point.fromX, point.toX, progress) * width,
        y: interpolate(point.fromY, point.toY, progress) * height,
      }));
      context.lineWidth = 1;
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        if (point.step === 0) continue;
        const previous = positions[index - 6];
        const current = positions[index];
        context.strokeStyle = `rgba(243,234,223,${.035 + progress * .22})`;
        context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(current.x, current.y); context.stroke();
      }
      positions.forEach((position, index) => {
        const point = points[index];
        const highlight = point.step === 11 || (point.step === 0 && point.branch % 2 === 0);
        context.fillStyle = highlight ? `rgba(48,39,242,${.45 + progress * .55})` : `rgba(243,234,223,${.18 + progress * .65})`;
        context.beginPath(); context.arc(position.x, position.y, point.size + progress * .8, 0, Math.PI * 2); context.fill();
      });
      frame = requestAnimationFrame(drawClarity);
    };
    clarityHero.addEventListener("pointermove", (event) => {
      const bounds = clarityHero.getBoundingClientRect();
      target = Math.max(.05, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    });
    clarityHero.addEventListener("pointerleave", () => { target = .72; });
    new ResizeObserver(resizeClarity).observe(clarityHero);
    resizeClarity();
    frame = requestAnimationFrame(drawClarity);
    window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
  }

  const growthLab = document.querySelector("[data-growth-lab] .growth-lab");
  if (growthLab) {
    const growthSteps = [...growthLab.querySelectorAll("[data-growth-step]")];
    const growthTitle = growthLab.querySelector("[data-growth-title]");
    const growthCount = growthLab.querySelector("[data-growth-count]");
    const growthTitles = ["Find the real problem", "Define the working logic", "Connect every touchpoint", "Build for continued growth"];
    let growthTimer;
    const activateGrowthStep = (index, restart = true) => {
      growthLab.dataset.stage = String(index);
      growthSteps.forEach((step, stepIndex) => {
        const active = stepIndex === index;
        step.classList.toggle("is-active", active);
        step.setAttribute("aria-selected", String(active));
      });
      if (growthTitle) growthTitle.textContent = growthTitles[index];
      if (growthCount) growthCount.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
      if (restart && !reducedMotion) {
        clearTimeout(growthTimer);
        growthTimer = setTimeout(() => activateGrowthStep((index + 1) % growthSteps.length, true), 2600);
      }
    };
    growthSteps.forEach((step, index) => {
      step.addEventListener("mouseenter", () => activateGrowthStep(index));
      step.addEventListener("focus", () => activateGrowthStep(index));
      step.addEventListener("click", () => activateGrowthStep(index));
    });
    growthLab.addEventListener("mouseleave", () => activateGrowthStep(Number(growthLab.dataset.stage || 0)));
    activateGrowthStep(0);
  }

  const systemDemo = document.querySelector("[data-system-demo]");
  if (systemDemo) {
    const triggers = [...systemDemo.querySelectorAll("[data-system-trigger]")];
    const panels = [...systemDemo.querySelectorAll("[data-system-panel]")];
    const counter = systemDemo.querySelector("[data-system-count]");
    const activateSystemPanel = (index) => {
      panels.forEach((panel, panelIndex) => panel.classList.toggle("is-active", panelIndex === index));
      triggers.forEach((trigger, triggerIndex) => {
        const active = triggerIndex === index;
        trigger.classList.toggle("is-active", active);
        trigger.setAttribute("aria-selected", String(active));
      });
      if (counter) counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(panels.length).padStart(2, "0")}`;
    };
    triggers.forEach((trigger, index) => {
      trigger.addEventListener("mouseenter", () => activateSystemPanel(index));
      trigger.addEventListener("focus", () => activateSystemPanel(index));
      trigger.addEventListener("click", () => activateSystemPanel(index));
    });
  }

  const projectPath = location.pathname.match(/\/work\/[^/]+\/?$/);
  if (projectPath && !isSmallProject && document.body.dataset.caseJourney === "true") {
    const sections = [...document.querySelectorAll("main > .project-chapter, main > .case-section")]
      .filter((section) => section.querySelector("h2"));
    if (sections.length >= 2) {
      const journey = document.createElement("nav");
      journey.className = "case-journey";
      journey.setAttribute("aria-label", "Case study journey");
      const label = document.createElement("span");
      label.className = "case-journey__label";
      label.textContent = "Case journey";
      journey.append(label);
      const links = sections.map((section, index) => {
        if (!section.id) section.id = `chapter-${index + 1}`;
        const link = document.createElement("a");
        link.href = `#${section.id}`;
        const heading = section.querySelector(".project-chapter__copy h3, .case-section__copy h3, h2");
        link.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span>${heading?.textContent?.trim() || `Chapter ${index + 1}`}`;
        journey.append(link);
        return link;
      });
      const firstSection = sections[0];
      firstSection.parentNode.insertBefore(journey, firstSection);
      const syncJourneyHeight = () => {
        document.documentElement.style.setProperty("--case-journey-height", `${Math.ceil(journey.getBoundingClientRect().height)}px`);
      };
      syncJourneyHeight();
      if ("ResizeObserver" in window) new ResizeObserver(syncJourneyHeight).observe(journey);
      window.addEventListener("resize", syncJourneyHeight, { passive: true });
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = sections.indexOf(entry.target);
          links.forEach((link, linkIndex) => link.classList.toggle("is-active", linkIndex === index));
          const activeLink = links[index];
          if (activeLink) journey.scrollTo({
            left: activeLink.offsetLeft - (journey.clientWidth - activeLink.offsetWidth) / 2,
            behavior: reducedMotion ? "auto" : "smooth"
          });
        });
      }, { rootMargin: "-22% 0px -65%", threshold: 0 });
      sections.forEach((section) => observer.observe(section));
      links[0]?.classList.add("is-active");
    }
  }

  const mission = document.querySelector(".mission-section");
  const missionWord = mission?.querySelector(".mission-word");
  const missionProgress = mission?.querySelector(".mission-progress span");
  const missionSteps = [...(mission?.querySelectorAll(".mission-step") || [])];
  let missionFrame = 0;

  const syncMission = () => {
    missionFrame = 0;
    if (!mission || reducedMotion || window.innerWidth <= 800) return;
    const bounds = mission.getBoundingClientRect();
    const travel = Math.max(1, mission.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / travel));
    if (missionWord) missionWord.style.transform = `translate3d(${-progress * 24}vw, 0, 0)`;
    if (missionProgress) missionProgress.style.transform = `scaleY(${progress})`;
    const activeIndex = Math.min(missionSteps.length - 1, Math.floor(progress * missionSteps.length));
    missionSteps.forEach((step, index) => step.classList.toggle("is-active", index === activeIndex));
  };

  const requestMissionSync = () => {
    if (!missionFrame) missionFrame = requestAnimationFrame(syncMission);
  };

  syncMission();
  window.addEventListener("scroll", requestMissionSync, { passive: true });
  window.addEventListener("resize", requestMissionSync, { passive: true });

  const workIndex = document.querySelector("[data-work-index]");
  if (workIndex) {
    const cards = [...workIndex.querySelectorAll(".work-index__card")];
    const details = workIndex.querySelector(".work-index__details");
    const link = details?.querySelector("[data-work-stage]");
    const title = details?.querySelector("[data-stage-title]");
    const sector = details?.querySelector("[data-stage-sector]");
    const description = details?.querySelector("[data-stage-description]");
    const counter = details?.querySelector("[data-stage-index]");
    let activeWork = -1;
    let workFrame = 0;

    const activateWork = (index) => {
      if (!details || index === activeWork || !cards[index]) return;
      activeWork = index;
      const card = cards[index];
      cards.forEach((candidate, candidateIndex) => {
        candidate.classList.toggle("is-active", candidateIndex === index);
      });
      details.classList.add("is-changing");
      window.setTimeout(() => {
        link.href = card.href;
        title.textContent = card.dataset.title;
        sector.textContent = card.dataset.sector;
        description.textContent = card.dataset.description;
        counter.textContent = card.dataset.index;
        details.classList.remove("is-changing");
      }, reducedMotion ? 0 : 180);
    };

    const syncActiveWork = () => {
      workFrame = 0;
      const target = window.innerHeight * .5;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, index) => {
        const bounds = card.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height / 2 - target);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      activateWork(closestIndex);
    };

    const requestWorkSync = () => {
      if (!workFrame) workFrame = requestAnimationFrame(syncActiveWork);
    };

    cards.forEach((card, index) => {
      card.addEventListener("mouseenter", () => activateWork(index));
      card.addEventListener("focus", () => activateWork(index));
      card.addEventListener("keydown", event => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 :
          (index + (event.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length;
        cards[nextIndex].focus({ preventScroll: true });
        cards[nextIndex].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        activateWork(nextIndex);
      });
    });
    activateWork(0);
    window.addEventListener("scroll", requestWorkSync, { passive: true });
    window.addEventListener("resize", requestWorkSync, { passive: true });
  }

  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });
})();

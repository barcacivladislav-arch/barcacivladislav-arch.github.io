(() => {
  const manifest = window.PROJECT_MANIFEST?.assets || [];
  const root = document.body.dataset.assetRoot || "";
  const shared = window.PortfolioMediaComponents;
  if (shared) {
    const websiteHost = document.querySelector("[data-commerce-experience]");
    const campaignHost = document.querySelector("[data-campaign-reel]");
    const newsletterHost = document.querySelector("[data-campaign-inbox]");
    const websiteAssets = manifest.filter((asset) => asset.group === "website" && /(?:home page|man's collection|product page)/i.test(asset.source));
    const websitePages = [
      { label: "Home", match: /home page/i },
      { label: "Collection", match: /man's collection/i },
      { label: "Product", match: /product page/i }
    ].map((page) => ({
      ...page,
      desktop: websiteAssets.find((asset) => page.match.test(asset.source) && /1440w/i.test(asset.source)),
      mobile: websiteAssets.find((asset) => page.match.test(asset.source) && /390w/i.test(asset.source))
    }));
    const adAssets = manifest.filter((asset) => asset.group === "ads");
    const campaignGroups = [
      { label: "Collection stories", title: "Lead with the product world", purpose: "Awareness", copy: "Editorial compositions introduce brands, seasonal collections and the store’s point of view before price becomes the focus.", assets: adAssets.slice(0, 5) },
      { label: "Designer offers", title: "Make the offer direct", purpose: "Consideration", copy: "Product-led sale creatives give each designer item enough visual authority while keeping the commercial hierarchy immediate.", assets: adAssets.slice(5, 9) },
      { label: "Seasonal sale", title: "Build energy across the sale", purpose: "Campaign", copy: "A more expressive visual language carries summer messaging without losing the retailer’s premium tone.", assets: adAssets.slice(9, 16) },
      { label: "Conversion", title: "Turn selection into a reason to click", purpose: "Conversion", copy: "Brand pairings, category edits and catalogue-like layouts move shoppers toward a specific choice.", assets: adAssets.slice(16, 23) }
    ];
    const newsletterAssets = manifest.filter((asset) => asset.group === "newsletters");
    const newsletterGroups = [
      { label: "Black Friday", match: /black friday/i },
      { label: "Christmas", match: /christmass/i },
      { label: "Editorial", match: /general/i },
      { label: "Valentine’s", match: /valentines day/i }
    ].map((group) => ({ ...group, assets: newsletterAssets.filter((asset) => group.match.test(asset.source)) }));
    if (websiteHost) shared.renderWebsiteViewer(websiteHost, websiteAssets, { root, pages: websitePages });
    if (campaignHost) shared.renderAdvertisingSystem(campaignHost, adAssets, { root, groups: campaignGroups });
    if (newsletterHost) shared.renderNewsletterLibrary(newsletterHost, newsletterAssets, { root, groups: newsletterGroups });
    document.querySelector("#newsletter-reader")?.remove();
    return;
  }
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fileName = (asset) => asset.source.replace(/\\/g, "/").split("/").pop().replace(/\.[^.]+$/, "");
  const makeImage = (asset, eager = false) => {
    const image = new Image();
    image.src = root + asset.src;
    image.alt = fileName(asset).replace(/[-_]/g, " ");
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    if (asset.width) image.width = asset.width;
    if (asset.height) image.height = asset.height;
    return image;
  };
  const makeTabs = (items, onSelect, className) => {
    const tabs = document.createElement("div");
    tabs.className = className;
    tabs.setAttribute("role", "tablist");
    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
        onSelect(item, index);
      });
      tabs.append(button);
    });
    return tabs;
  };
  const enableDrag = (track) => {
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      dragging = true;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      track.scrollLeft = startScroll - (event.clientX - startX);
    });
    const stop = () => { dragging = false; };
    track.addEventListener("pointerup", stop);
    track.addEventListener("pointercancel", stop);
    track.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || track.scrollWidth <= track.clientWidth) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    }, { passive: false });
  };

  const websiteAssets = manifest.filter((asset) => asset.group === "website" && /(?:home page|man's collection|product page)/i.test(asset.source));
  const websitePages = [
    { label: "Home", match: /home page/i },
    { label: "Collection", match: /man's collection/i },
    { label: "Product", match: /product page/i }
  ].map((page) => ({
    ...page,
    desktop: websiteAssets.find((asset) => page.match.test(asset.source) && /1440w/i.test(asset.source)),
    mobile: websiteAssets.find((asset) => page.match.test(asset.source) && /390w/i.test(asset.source))
  }));
  const experience = document.querySelector("[data-commerce-experience]");
  if (experience) {
    const bar = document.createElement("div");
    bar.className = "commerce-stage__bar";
    const tabsHost = document.createElement("div");
    const hint = document.createElement("p");
    hint.className = "commerce-stage__hint";
    hint.textContent = "Hover, then scroll inside either screen";
    const controls = document.createElement("div");
    controls.className = "commerce-stage__controls";
    const tour = document.createElement("button");
    tour.type = "button";
    tour.className = "experience-tour";
    tour.textContent = "Auto tour";
    controls.append(hint, tour);
    bar.append(tabsHost, controls);
    const stage = document.createElement("div");
    stage.className = "device-stage";
    const devices = ["desktop", "mobile"].map((type) => {
      const device = document.createElement("div");
      device.className = `device device--${type === "mobile" ? "phone" : "desktop"}`;
      device.innerHTML = `<div class="device__chrome">${type === "desktop" ? "<i></i><i></i><i></i><span>capodopera12.ro</span>" : ""}</div><div class="device__viewport"></div>`;
      stage.append(device);
      return device.querySelector(".device__viewport");
    });
    const setPage = (page) => {
      devices.forEach((viewport, index) => {
        viewport.replaceChildren(makeImage(index ? page.mobile : page.desktop, true));
        viewport.scrollTop = 0;
      });
    };
    tabsHost.append(makeTabs(websitePages, setPage, "experience-tabs"));
    experience.append(bar, stage);
    setPage(websitePages[0]);
    let tourFrame = 0;
    tour.addEventListener("click", () => {
      if (tourFrame) {
        cancelAnimationFrame(tourFrame);
        tourFrame = 0;
        tour.textContent = "Auto tour";
        return;
      }
      devices.forEach((viewport) => { viewport.scrollTop = 0; });
      tour.textContent = "Stop tour";
      let last = performance.now();
      const step = (now) => {
        const delta = now - last;
        last = now;
        let active = false;
        devices.forEach((viewport) => {
          if (viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 2) {
            viewport.scrollTop += delta * .12;
            active = true;
          }
        });
        if (active) tourFrame = requestAnimationFrame(step);
        else { tourFrame = 0; tour.textContent = "Auto tour"; }
      };
      tourFrame = requestAnimationFrame(step);
    });
  }

  const adAssets = manifest.filter((asset) => asset.group === "ads");
  const campaigns = [
    { label: "Collection stories", title: "Lead with the product world", copy: "Editorial compositions introduce brands, seasonal collections and the store’s point of view before price becomes the focus.", assets: adAssets.slice(0, 5) },
    { label: "Designer offers", title: "Make the offer direct, not generic", copy: "Product-led sale creatives give each designer item enough visual authority while keeping the commercial hierarchy immediate.", assets: adAssets.slice(5, 9) },
    { label: "Seasonal sale", title: "Build energy across a promotional period", copy: "A more expressive visual language carries broader summer messaging without losing the retailer’s premium tone.", assets: adAssets.slice(9, 16) },
    { label: "Conversion", title: "Turn selection into a reason to click", copy: "Brand pairings, category edits and catalogue-like layouts help shoppers move from a general promotion toward a specific choice.", assets: adAssets.slice(16, 23) }
  ];
  const reel = document.querySelector("[data-campaign-reel]");
  if (reel) {
    const head = document.createElement("div");
    head.className = "reel-head";
    const copy = document.createElement("div");
    copy.className = "reel-copy";
    const tabsHost = document.createElement("div");
    head.append(copy, tabsHost);
    const track = document.createElement("div");
    track.className = "reel-track";
    track.tabIndex = 0;
    const progress = document.createElement("div");
    progress.className = "reel-progress";
    const instruction = document.createElement("p");
    instruction.className = "reel-instruction";
    instruction.textContent = "Drag or scroll horizontally";
    const renderCampaign = (campaign) => {
      copy.innerHTML = `<h3>${campaign.title}</h3><p>${campaign.copy}</p>`;
      track.replaceChildren(...campaign.assets.map((asset, index) => {
        const figure = document.createElement("figure");
        figure.className = "reel-card";
        const image = makeImage(asset, index < 4);
        image.dataset.lightbox = "true";
        figure.append(image);
        return figure;
      }));
      track.scrollLeft = 0;
      reel.style.setProperty("--reel-progress", "0%");
      document.dispatchEvent(new Event("portfolio:media-ready"));
    };
    tabsHost.append(makeTabs(campaigns, renderCampaign, "reel-tabs"));
    track.addEventListener("scroll", () => {
      const range = track.scrollWidth - track.clientWidth;
      reel.style.setProperty("--reel-progress", `${range > 0 ? Math.min(100, track.scrollLeft / range * 100) : 100}%`);
    }, { passive: true });
    reel.append(head, track, progress, instruction);
    enableDrag(track);
    renderCampaign(campaigns[0]);
  }

  const newsletterAssets = manifest.filter((asset) => asset.group === "newsletters");
  const newsletterGroups = [
    { label: "Black Friday", match: /black friday/i },
    { label: "Christmas", match: /christmass/i },
    { label: "Editorial", match: /general/i },
    { label: "Valentine’s", match: /valentines day/i }
  ].map((group) => ({ ...group, assets: newsletterAssets.filter((asset) => group.match.test(asset.source)) }));
  const inbox = document.querySelector("[data-campaign-inbox]");
  const reader = document.querySelector("#newsletter-reader");
  if (inbox && reader) {
    const readerImage = reader.querySelector("img");
    const readerTitle = reader.querySelector("[data-reader-title]");
    const head = document.createElement("div");
    head.className = "inbox-head";
    head.innerHTML = "<h3>Campaign inbox.</h3><p>Every newsletter remains available, organised by retail moment. Hover a preview to read through it, or open it for a focused view.</p>";
    const tabsHost = document.createElement("div");
    const rail = document.createElement("div");
    rail.className = "newsletter-rail";
    const animations = new WeakMap();
    const stopPreview = (viewport) => cancelAnimationFrame(animations.get(viewport));
    const playPreview = (viewport) => {
      if (reducedMotion) return;
      stopPreview(viewport);
      const distance = viewport.scrollHeight - viewport.clientHeight;
      if (distance <= 0) return;
      const from = viewport.scrollTop;
      const start = performance.now();
      const duration = Math.max(5000, (distance - from) * 7);
      const step = (time) => {
        const progress = Math.min(1, (time - start) / duration);
        viewport.scrollTop = from + (distance - from) * progress;
        if (progress < 1) animations.set(viewport, requestAnimationFrame(step));
      };
      animations.set(viewport, requestAnimationFrame(step));
    };
    const openReader = (asset) => {
      readerTitle.textContent = fileName(asset);
      readerImage.replaceWith(makeImage(asset, true));
      reader.querySelector(".reader-scroll").scrollTop = 0;
      reader.showModal();
    };
    const renderGroup = (group) => {
      rail.replaceChildren(...group.assets.map((asset) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "newsletter-card";
        const viewport = document.createElement("span");
        viewport.className = "newsletter-card__viewport";
        viewport.append(makeImage(asset));
        const label = document.createElement("span");
        label.textContent = fileName(asset);
        card.append(viewport, label);
        card.addEventListener("pointerenter", () => playPreview(viewport));
        card.addEventListener("pointerleave", () => stopPreview(viewport));
        card.addEventListener("focus", () => playPreview(viewport));
        card.addEventListener("blur", () => stopPreview(viewport));
        card.addEventListener("click", () => openReader(asset));
        return card;
      }));
      rail.scrollLeft = 0;
    };
    tabsHost.append(makeTabs(newsletterGroups, renderGroup, "inbox-tabs"));
    inbox.append(head, tabsHost, rail);
    enableDrag(rail);
    renderGroup(newsletterGroups[0]);
    reader.querySelector(".reader-close").addEventListener("click", () => reader.close());
    reader.addEventListener("click", (event) => { if (event.target === reader) reader.close(); });
  }
})();

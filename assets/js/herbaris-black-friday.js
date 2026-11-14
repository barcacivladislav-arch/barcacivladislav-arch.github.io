(() => {
  const chapter = document.querySelector(".herbaris-bf");
  const api = window.PortfolioMediaComponents;
  if (!chapter || !api) return;
  const root = document.body.dataset.assetRoot;
  const folder = "assets/portfolio/herbaris/black-friday-2026/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const previews = new Map();
  let playing = !reduced.matches;

  function image(asset) {
    const img = document.createElement("img");
    img.src = root + asset.src;
    img.width = asset.width;
    img.height = asset.height;
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    return img;
  }

  function setMotion(art, issue, enabled) {
    art.querySelectorAll(".herbaris-bf-motion").forEach((gif) => gif.remove());
    if (!enabled) return;
    for (const [file, y, width, height, x] of issue.motion) {
      const gif = image({ src: folder + file, width, height });
      gif.className = "herbaris-bf-motion";
      gif.style.top = (y / issue.height * 100) + "%";
      gif.style.left = (x / issue.width * 100) + "%";
      gif.style.width = (width / issue.width * 100) + "%";
      gif.style.aspectRatio = `${width} / ${height}`;
      gif.addEventListener("error", () => gif.remove(), { once: true });
      art.append(gif);
    }
  }

  function renderIssue(issue, index, assetRoot, options) {
    const reader = document.createElement("div");
    reader.className = "herbaris-bf-mail";
    const art = document.createElement("div");
    art.className = "herbaris-bf-mail__art";
    art.setAttribute("role", "img");
    art.setAttribute("aria-label", options.displayAlt);
    art.append(...issue.slices.map(image));
    if (issue.motion.length && options.controls) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button-link";
      let openedPlaying = playing;
      const update = () => {
        button.textContent = openedPlaying ? "Pause GIF" : "Play GIF";
        setMotion(art, issue, openedPlaying);
      };
      update();
      button.addEventListener("click", () => { openedPlaying = !openedPlaying; update(); });
      reader.append(button);
    } else if (issue.motion.length) {
      previews.set(art, issue);
      setMotion(art, issue, playing);
    }
    reader.append(art);
    return reader;
  }

  fetch(root + folder + "media.json?v=20261114-gift-progress")
    .then((response) => {
      if (!response.ok) throw new Error("Herbaris campaign media unavailable.");
      return response.json();
    })
    .then(({ ads, emails, pages, stickers, videos }) => {
      api.renderAdvertisingSystem(chapter.querySelector("[data-herbaris-bf-ads]"),
        ads.flatMap((group) => group.assets), { root, groups: ads });
      api.renderAdvertisingSystem(chapter.querySelector("[data-herbaris-bf-video]"), videos,
        { root, groups: [{ label: "Video ads", copy: "Launch, gifting and last-days edits.", assets: videos }] });
      const gallery = chapter.querySelector("[data-herbaris-bf-email]");
      const groups = [
        { label: "Creative newsletters and welcome", assets: emails.creative },
        { label: "Letters and announcements", assets: emails.letters }
      ];
      api.renderNewsletterLibrary(gallery, groups.flatMap((group) => group.assets),
        { root, groups, showIntro: false, renderIssue });
      if (groups.some((group) => group.assets.some((issue) => issue.motion.length))) {
        const button = document.createElement("button");
        button.className = "artwork-motion-control";
        button.type = "button";
        const update = () => {
          button.textContent = playing ? "Pause newsletter GIFs" : "Play newsletter GIFs";
          previews.forEach((issue, art) => {
            if (art.isConnected) setMotion(art, issue, playing);
            else previews.delete(art);
          });
        };
        gallery.before(button);
        update();
        button.addEventListener("click", () => { playing = !playing; update(); });
        reduced.addEventListener("change", () => { playing = !reduced.matches; update(); });
      }
      const families = {
        store: ["closed", "countdown", "gift-tab", "gift-list", "cart", "pdp-early", "pdp-public", "menu"],
        banners: ["hero", "laundry-banner", "cleaning-banner", "care-banner", "sets-banner"],
        popups: ["split-signup", "split-confirmation", "quiz-start", "quiz-choice", "quiz-scratch", "quiz-confirmation"]
      };
      for (const [family, keys] of Object.entries(families)) {
        api.renderWebsiteViewer(chapter.querySelector(`[data-herbaris-bf-site="${family}"]`),
          [], { root, pages: keys.map((key) => pages.find((page) => page.key === key)) });
      }
      const sticker = chapter.querySelector("[data-herbaris-bf-stickers]");
      const artwork = image(stickers);
      artwork.alt = stickers.displayTitle;
      artwork.dataset.lightbox = "true";
      sticker.prepend(artwork);
      sticker.hidden = false;
    })
    .catch((error) => {
      console.error(error);
      chapter.querySelectorAll("[data-herbaris-bf-ads], [data-herbaris-bf-email], [data-herbaris-bf-site]").forEach((host) => {
        if (!host.children.length) host.textContent = "Campaign media could not load. Reload to try again.";
      });
    });
})();

(() => {
  const media = window.PortfolioMediaComponents;
  if (!media) return;
  const root = document.body.dataset.assetRoot;
  const folder = "assets/portfolio/klintensiv/campaigns-2026/";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let autoplay = !reduce.matches;
  const previews = new Map();

  function makeImage(src, width, height, eager = false) {
    const image = document.createElement("img");
    image.src = root + src;
    image.width = width;
    image.height = height;
    image.alt = "";
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    return image;
  }

  function setMotion(art, issue, enabled) {
    art.querySelector(".klint-email-art__motion")?.remove();
    if (!enabled) return;
    const gif = makeImage(folder + issue.motion, issue.motionWidth, issue.motionHeight);
    gif.className = "klint-email-art__motion";
    gif.style.top = (issue.motionY / issue.height * 100) + "%";
    gif.style.width = (issue.motionWidth / issue.width * 100) + "%";
    gif.addEventListener("error", () => gif.remove(), { once: true });
    art.append(gif);
  }

  function renderEmail(issue, index, assetRoot, options) {
    const reader = document.createElement("div");
    reader.className = "klint-email";
    const art = document.createElement("div");
    art.className = "klint-email-art";
    art.setAttribute("role", "img");
    art.setAttribute("aria-label", options.displayAlt);
    issue.slices.forEach((slice, i) => {
      art.append(makeImage(slice.src, slice.width, slice.height, options.eager && i === 0));
    });
    if (issue.motion && options.controls) {
      const control = document.createElement("button");
      control.type = "button";
      control.className = "button-link";
      let playing = autoplay;
      const update = () => {
        control.textContent = playing ? "Pause GIF" : "Play GIF";
        setMotion(art, issue, playing);
      };
      control.addEventListener("click", () => { playing = !playing; update(); });
      update();
      reader.append(control);
    } else if (issue.motion) {
      previews.set(art, issue);
      setMotion(art, issue, autoplay);
    }
    reader.append(art);
    return reader;
  }

  const oldIssues = (window.PROJECT_MANIFEST?.assets || []).filter((asset) => asset.group === "newsletters");
  if (oldIssues.length) {
    media.renderNewsletterLibrary(document.querySelector("[data-klintensiv-inbox]"), oldIssues,
      { root, groups: [{ label: "Klintensiv newsletters", assets: oldIssues }] });
  }
  fetch(root + folder + "media.json?v=20261114-1")
    .then((response) => {
      if (!response.ok) throw new Error("Campaign media could not be loaded.");
      return response.json();
    })
    .then(({ groups, articles, emails }) => {
      for (const [name, families] of Object.entries(groups)) {
        const host = document.querySelector(`[data-klint-new-ads="${name}"]`);
        const assets = families.flatMap((family) => family.assets);
        media.renderAdvertisingSystem(host, assets, { root, groups: families, expanded: false });
      }
      media.renderWebsiteViewer(document.querySelector("[data-klint-listicles]"), [],
        { root, pages: articles });
      const gallery = document.querySelector("[data-klint-bf-emails]");
      const playback = document.createElement("button");
      playback.type = "button";
      playback.className = "artwork-motion-control";
      const updatePreviews = () => {
        playback.textContent = autoplay ? "Pause newsletter GIFs" : "Play newsletter GIFs";
        previews.forEach((issue, art) => {
          if (art.isConnected) setMotion(art, issue, autoplay);
          else previews.delete(art);
        });
      };
      playback.addEventListener("click", () => { autoplay = !autoplay; updatePreviews(); });
      reduce.addEventListener("change", () => { autoplay = !reduce.matches; updatePreviews(); });
      gallery.before(playback);
      const issues = emails.map((email) => ({ ...email, displayTitle: email.title }));
      media.renderNewsletterLibrary(gallery, issues, {
        root, groups: [{ label: "KlinFriday creative sends", assets: issues }], showIntro: false, renderIssue: renderEmail
      });
      updatePreviews();
    })
    .catch((error) => {
      console.error(error);
      for (const host of document.querySelectorAll("[data-klint-new-ads], [data-klint-listicles], [data-klint-bf-emails]")) {
        if (!host.children.length) host.textContent = "The campaign previews could not load. Reload to try again.";
      }
    });
})();

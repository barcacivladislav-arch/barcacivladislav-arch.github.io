(() => {
  const root = document.body.dataset.assetRoot || "";
  const mediaComponents = window.PortfolioMediaComponents;
  if (!mediaComponents) {
    console.error("Shared media components failed to load.");
    document.documentElement.classList.add("project-assets-error");
    return;
  }
  const projectSlug = location.pathname.match(/\/work\/([^/]+)/)?.[1];
  const manifestSlugs = { coreleaf: "core-leaf", "elite-homes": "elite-homes", "emma-red": "emma-red-estate", snus: "snus-behance" };
  const manifestPath = document.body.dataset.projectManifest || (projectSlug ? `assets/portfolio/${manifestSlugs[projectSlug] || projectSlug}/manifest.json` : "");
  if (!manifestPath) return;
  const galleryGroups = {
    "capodopera-ads": ["ads"], "capodopera-newsletters": ["newsletters"],
    "cdl-black-cobra": ["black-cobra"], "cdl-snus-system": ["snus"], "cdl-snus-concepts": [], "cdl-sixth-wave": ["sixth-wave"], "cdl-vape": [],
    "elite-brand": ["identity"], "elite-web": ["website"],
    "klintensiv-web": ["brand-positioning"], "klintensiv-packaging": ["category-campaign"], "klintensiv-ads": ["mouthwash-campaign", "spring-campaign", "summer-campaign", "campaign-system"],
    "ark-development": ["other"], coreleaf: ["identity", "packaging"], bioc: ["other"], medicam3: ["landing-page", "campaigns", "newsletters"], comod: ["identity"], chariot: ["campaign", "flows"], etic: ["website", "newsletters"], "emma-red": ["other"], "like-coffee": ["other"], "ark-capital": ["other"],
    "intergasses-web": ["website"], "intergasses-story": ["graphics"], "snus-behance": ["behance"]
  };
  const galleryLimits = {};
  // Behance exports are kept in the same module order as the published case.
  // Each exported module already contains any intended internal row composition.
  const behanceOrders = {
    "ark-capital": "7692c8,e7dd62,d3eda9,7a0249,a98fb4,a75950,25f6a4,519048,7a154d,aefd24,d203a9,9b4067,653853,8717a1,93b1f2,8d14c1,487027".split(","),
    "ark-development": "2d242d,4397cd,2aaa56,13022d,250943,483a85,fbb4a1,1a986b,9ed0e4,8cb9f1,eb4890,7bf864,2585dd,75e076,85c772,a055d3,a35382,8e5661,29faab,04fdac,7aa670,46545b,65ac2c,73b3e7,4bfe9c,e6bd45,747915,b59474,fa8105,1fb3b6".split(","),
    "emma-red": "5721dd,a54994,8ac7bb,ba7051,fa44b0,bf6a8f,d22ee6,0e87f9,71f879,55a0db,34e53e,303eeb,1fb991,004e48,bcdf95".split(","),
    "elite-brand": "b3d963,58b65f,53807e,12a0ff,4a152b,1db71a,7a3ebc,22b140,b16418,a30c0c,19f0d4,a81617,0f91e9,6c3945,5882b9,8a62e0,d86ebc,48bce1,15808b,4cb685,6e3531,c63635,d07905,b0d821".split(","),
    "comod": "17b88f,d015e1,3965bc,429979,613d36,5c79d4,f1ca09,ac4a4f,9aac0e,9e8a39,2cde82".split(","),
    "like-coffee": "d304ab,3e9d07,6caa69,1e75d9,13883d,52f71d,83975a,6ce89c,e19cf8,1cf0b5".split(","),
    "coreleaf": "448a3c,9ec9b4,d2beb5,948412,e2a928,ff8012,72b01b,624fa5,ee8013,fd6012,82dc75,b01eac,e09f81,fecfa0,edfdca".split(",")
  };
  const sortLikeBehance = (assets, key) => {
    if (key === "bioc") {
      const sequenceNumber = (asset) => Number(asset.source.replace(/\\/g, "/").split("/").pop().match(/^\d+/)?.[0] || 9999);
      return [...assets].sort((a, b) => sequenceNumber(a) - sequenceNumber(b));
    }
    const order = behanceOrders[key];
    if (!order) return assets;
    return [...assets].sort((a, b) => {
      const aName = a.source.replace(/\\/g, "/").split("/").pop().toLowerCase();
      const bName = b.source.replace(/\\/g, "/").split("/").pop().toLowerCase();
      const ai = order.findIndex((prefix) => aName.startsWith(prefix));
      const bi = order.findIndex((prefix) => bName.startsWith(prefix));
      return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
    });
  };
  const behancePairs = {
    "emma-red": [["13.", "14."]],
    "elite-brand": [["8a62e0", "d86ebc"]],
    comod: [["ac4a4f", "9aac0e"]],
    "like-coffee": [["83975a", "6ce89c"]],
    coreleaf: [
      ["ee8013", "fd6012"],
      ["094493", "112b57"],
      ["120b33", "206e65"],
      ["a9311b", "b86e06", "e63afe"],
      ["c3e0ad", "d323ef", "de695c"]
    ],
    bioc: [["5.", "6."], ["14.", "15."], ["18.", "19."]]
  };
  const authoredBehanceProjects = new Set(["ark-capital", "ark-development", "bioc", "comod", "coreleaf", "emma-red", "intergasses", "like-coffee", "snus"]);
  const renderBehanceSequence = (gallery, assets, key) => {
    mediaComponents.renderBehanceComposition(gallery, assets, key, {
      root,
      pairs: behancePairs[key] || [],
      storyShell: gallery.dataset.storyShell === "false" ? false : authoredBehanceProjects.has(projectSlug)
    });
  };
  const groupLabels = {
    website: "Website",
    "landing-page": "Website",
    newsletters: "Newsletters",
    campaign: "Campaign newsletters",
    flows: "Automated email flows",
    campaigns: "Website campaign banners",
    ads: "Advertising",
    social: "Social and campaign work",
    identity: "Identity",
    packaging: "Packaging",
    graphics: "Brand applications"
  };
  const namedSelections = {
    "cdl-black-cobra-bento": [/Black Cobra\/Background\+Shadow\.png/i, /Black Cobra\/Container\.png/i, /Black Cobra\/Background\+Shadow-1\.png/i, /Black Cobra\/Background\+Shadow-2\.png/i, /Black Cobra\/blueberry-regular/i, /Black Cobra\/passion-fruit-regular/i, /Black Cobra\/pineapple-regular/i, /Black Cobra\/Gradient\.png/i],
    "herbaris-animal-care": [/Animal Care Top Funnel\/1080x1080/i, /Animal Middle Funnel Gif 1\/1080 X 1080/i],
    "herbaris-bundle": [/Boundle V2\/1080x1080 cream/i, /Boundle V2\/1080x1080 green/i],
    "herbaris-dont-buy": [/Don_t buy this product\/1080x1080/i],
    "herbaris-gpt": [/GPT\/1080x1080/i],
    "herbaris-lavanda": [/Lavanda\/1080x1080/i, /Lavanda 2\/1080x1080/i],
    "herbaris-problem": [/Problem - Solution V1\/1080x1080/i],
    "herbaris-reviews": [/Reviews Ads\/1080x1080/i],
    "herbaris-search": [/Search Bars\/Artboard 1 copy 42/i, /Search Bars\/Artboard 1 copy 43/i, /Search Bars\/Artboard 1-1/i, /Search Bars\/Artboard 1-2/i],
    "herbaris-personal": [/Shampoo\/1080x1080/i, /Soap Gift\/1080x1080 cream/i, /Soaps V1\/1080x1080/i],
    "herbaris-summer-top-landscape": [/Top Funnel\/Google 1200x628\/Artboard 2 copy@/i, /Top Funnel\/Google 1200x628\/Artboard 2@/i],
    "herbaris-summer-top-square": [/Top Funnel\/Meta 1080x1080\/Artboard 1 copy 2@/i, /Top Funnel\/Meta 1080x1080\/Artboard 4 copy 8@/i],
    "herbaris-summer-middle": [/Middle Funnel\//i],
    "herbaris-summer-bottom": [/Bottom Funnel\/1080x1080\/Artboard 12 copy 29/i, /Bottom Funnel\/1080x1080\/Artboard 4 copy 14/i, /Bottom Funnel\/1080x1080\/Artboard 4 copy 17/i]
  };
  if (!document.body.classList.contains("snus-case")) {
    document.querySelectorAll('.case-overview, .board-stack').forEach((legacyOverview) => legacyOverview.remove());
  }
  const labelFromPath = (value) => value.replace(/\\/g, "/").split("/").slice(-2, -1)[0]?.replace(/[-_]/g, " ") || "Selected work";
  const familyFromPath = (asset) => {
    const parts = asset.source.replace(/\\/g, "/").split("/");
    const group = asset.group;
    let marker = -1;
    if (group === "evergreen-ads") marker = parts.findIndex((part, index) => part.toLowerCase() === "ads" && parts[index - 1]?.toLowerCase() === "evergreen");
    if (group === "summer-campaign") marker = parts.findIndex((part) => part.toLowerCase() === "ad creatives");
    const raw = marker >= 0 ? parts[marker + 1] : parts.at(-2);
    return (raw || "Selected work").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };
  const isPreferredAdSize = (asset) => {
    const name = asset.source.toLowerCase();
    if (asset.kind === "video") return !name.includes("1080 x 1920");
    if (name.includes("1200x628") || name.includes("1200 x 628") || name.includes("1080x1080") || name.includes("1080 x 1080")) return true;
    return !/\d{3,4}\s*x\s*\d{3,4}/.test(name);
  };
  const createMedia = (asset, index) => {
    return mediaComponents.createMedia(asset, index, root);
  };
  const isMobileScreen = (asset) => /mobile|390w|phone/i.test(asset.source) || (asset.width > 0 && asset.width < 1000);
  const sectionTitle = (asset) => {
    const parts = asset.source.replace(/\\/g, "/").split("/");
    return (parts.at(-2) || "Website").replace(/[-_]/g, " ");
  };
  const makeFamilyHead = (title, note = "") => {
    const head = document.createElement("div");
    head.className = "campaign-family__head";
    const heading = document.createElement("h4");
    heading.textContent = title;
    head.append(heading);
    if (note) {
      const count = document.createElement("span");
      count.textContent = note;
      head.append(count);
    }
    return head;
  };
  const renderWebsitePairs = (gallery, assets) => {
    if (projectSlug === "intergasses") {
      const byPath = (pattern) => assets.find((asset) => pattern.test((asset.source || "").replace(/\\/g, "/")));
      const pages = [
        {
          label: "Landing Page",
          desktop: byPath(/Landing Page\/Home Page\.jpg$/i),
          mobile: byPath(/Landing Page\/Home Page-1\.jpg$/i)
        },
        {
          label: "Collection Pages",
          desktop: byPath(/Collection Pages\/Category\.jpg$/i),
          mobile: byPath(/Collection Pages\/Category-1\.jpg$/i)
        },
        {
          label: "Product Page",
          desktop: byPath(/Product Page\/Product Page\.jpg$/i),
          mobile: byPath(/Product Page\/Home Page\.jpg$/i)
        },
        {
          label: "Contact Us",
          desktop: byPath(/Contact Us\/Contact Us\.jpg$/i),
          mobile: byPath(/Contact Us\/Contact Us-1\.jpg$/i)
        },
      ].filter((page) => page.desktop || page.mobile);
      mediaComponents.renderWebsiteViewer(gallery, assets, { root, pages });
      return;
    }
    mediaComponents.renderWebsiteViewer(gallery, assets, { root });
  };
  const isNewsletterGroup = (group) => group === "newsletters" || (projectSlug === "chariot" && (group === "campaign" || group === "flows"));
  const isAdvertisingGroup = (group) => [
    "ads", "campaigns", "social", "evergreen-ads", "summer-campaign", "credibility", "categories",
    "mouth-awareness", "mouth-conversion", "objections", "posters-final", "summer-awareness",
    "summer-collections", "summer-conversion", "spring-web", "summer-web"
  ].includes(group);
  const renderSeparatedGroups = (gallery, assets, groups) => {
    gallery.classList.add("project-gallery--families", "project-gallery--typed");
    groups.forEach((group) => {
      const groupAssets = assets.filter((asset) => asset.group === group);
      if (!groupAssets.length) return;
      const section = document.createElement("section");
      section.className = "campaign-family project-type-section";
      section.append(makeFamilyHead(groupLabels[group] || group.replace(/[-_]/g, " "), `${groupAssets.length} pieces`));
      const body = document.createElement("div");
      if (group === "website" || group === "landing-page") {
        renderWebsitePairs(body, groupAssets);
      } else if (isNewsletterGroup(group)) {
        mediaComponents.renderNewsletterLibrary(body, groupAssets, { root });
      } else if (isAdvertisingGroup(group)) {
        body.dataset.gallery = "klintensiv-ads";
        renderFamilies(body, groupAssets);
      } else {
        body.className = `project-gallery ${isNewsletterGroup(group) ? "project-gallery--newsletters-uniform" : "project-gallery--uniform"}`;
        if (projectSlug === "chariot" || projectSlug === "etic") body.classList.add("project-gallery--five");
        groupAssets.forEach((asset, index) => body.append(createMedia(asset, index)));
      }
      section.append(body);
      gallery.append(section);
    });
  };
  const curateAssets = (gallery, assets) => {
    if (projectSlug === "herbaris" && gallery.dataset.assetGroup === "packaging") {
      return assets.filter((asset) => !/herbaris0001 1/i.test(asset.source));
    }
    if (projectSlug === "herbaris" && gallery.dataset.assetGroup === "website") {
      const picks = [
        /evergreen\/website\/1440w/i,
        /evergreen\/website\/390w/i
      ];
      return picks.map((pattern) => assets.find((asset) => pattern.test(asset.source))).filter(Boolean);
    }
    return assets;
  };
  const renderFamilies = (gallery, assets) => {
    mediaComponents.renderAdvertisingSystem(gallery, assets, { root, familyFromPath });
  };
  const manifestRequest = window.PROJECT_MANIFEST
    ? Promise.resolve(window.PROJECT_MANIFEST)
    : fetch(root + manifestPath).then((response) => {
        if (!response.ok) throw new Error(`Asset manifest failed: ${response.status}`);
        return response.json();
      });
  manifestRequest.then((manifest) => {
    if (!document.querySelector('link[href*="project.css"]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = `${root}assets/css/project.css`;
      document.head.append(stylesheet);
    }
    document.querySelectorAll("[data-asset-group], [data-gallery], .compact-case .asset-grid").forEach((gallery) => {
      const galleryKey = gallery.dataset.gallery || projectSlug;
      const limit = Number(gallery.dataset.assetLimit || galleryLimits[galleryKey] || Infinity);
      const groups = gallery.dataset.assetGroup ? [gallery.dataset.assetGroup] : galleryGroups[gallery.dataset.gallery || projectSlug];
      if (!groups || !groups.length) {
        gallery.remove();
        return;
      }
      let assets = manifest.assets.filter((asset) => groups.includes(asset.group));
      if (projectSlug === "klintensiv" && galleryKey === "klintensiv-ads") assets = assets.filter((asset) => asset.kind !== "video");
      if (gallery.dataset.sourcePrefix) assets = assets.filter((asset) => asset.source.toLowerCase().startsWith(gallery.dataset.sourcePrefix.toLowerCase()));
      if (gallery.dataset.selection) {
        const patterns = namedSelections[gallery.dataset.selection];
        if (!patterns) {
          console.error(`Unknown curated selection: ${gallery.dataset.selection}`);
          assets = [];
        } else {
          // Keep the deliberately curated sequence declared above instead of
          // falling back to the manifest's alphabetical file order.
          assets = patterns.flatMap((pattern) => assets.filter((asset) => pattern.test(asset.source)));
        }
      }
      if (gallery.dataset.dedupeAds === "true") assets = assets.filter(isPreferredAdSize);
      assets = curateAssets(gallery, assets);
      if (gallery.classList.contains("behance-sequence")) assets = sortLikeBehance(assets, galleryKey);
      if (projectSlug === "herbaris" && gallery.dataset.sourcePrefix?.toLowerCase().includes("summer sale/newsletters")) {
        assets = assets.filter((asset) => !/pop[ -]?up/i.test(asset.source));
      }
      if (projectSlug === "klintensiv" && groups.includes("newsletters")) {
        assets = assets.filter((asset) => /klintensiv\/newsletters\//i.test(asset.source));
      }
      let selected = assets.slice(0, limit);
      if (galleryKey === "cdl-black-cobra") {
        const containedPackaging = new Set([1, 4, 5, 6]);
        selected = selected.map((asset, index) => containedPackaging.has(index) ? { ...asset, fit: "contain" } : asset);
      }
      gallery.replaceChildren();
      gallery.classList.add(...groups.map((group) => `asset-group--${group}`));
      if (!selected.length) {
        gallery.hidden = true;
        const section = gallery.closest(".case-section, .project-chapter, .snus-block");
        if (section && !section.querySelector("img, video, [data-asset-group]:not([hidden]), [data-gallery]:not([hidden])")) section.hidden = true;
        gallery.dataset.assetCount = "0";
        return;
      }
      if (gallery.classList.contains("behance-sequence")) renderBehanceSequence(gallery, selected, galleryKey);
      else if (groups.length > 1) renderSeparatedGroups(gallery, selected, groups);
      else if (groups[0] === "website" || groups[0] === "landing-page") renderWebsitePairs(gallery, selected);
      else if (isNewsletterGroup(groups[0])) {
        mediaComponents.renderNewsletterLibrary(gallery, selected, { root });
      }
      else if (isAdvertisingGroup(groups[0]) || gallery.dataset.groupByFolder === "true" || galleryKey === "klintensiv-ads") renderFamilies(gallery, selected);
      else selected.forEach((asset, index) => gallery.append(createMedia(asset, index)));
      gallery.dataset.assetCount = String(Math.min(assets.length, limit));
    });
    document.documentElement.classList.add("project-assets-ready");
    document.dispatchEvent(new Event("portfolio:media-ready"));
  }).catch((error) => {
    console.error(error);
    document.documentElement.classList.add("project-assets-error");
  });
})();

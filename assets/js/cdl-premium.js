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
})();

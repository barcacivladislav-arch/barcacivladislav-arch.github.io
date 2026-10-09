(() => {
  const api = window.PortfolioExperience;
  const assets = window.PROJECT_MANIFEST?.assets || [];
  if (!api) return;

  const fromGroup = (group) => assets.filter((asset) => asset.group === group);
  const adGroups = [
    {
      label: "Product hooks",
      title: "Make the product and its attitude immediate",
      copy: "Editorial photography, oversized type and clear product close-ups introduce SOPE and its body-care range without relying on a generic beauty language.",
      assets: fromGroup("collection-hooks")
    },
    {
      label: "Scent stories",
      title: "Turn fragrance notes into a visual appetite",
      copy: "Dessert-led imagery translates abstract scent notes into familiar textures, flavours and moods that can be understood in a second.",
      assets: fromGroup("scent-stories")
    },
    {
      label: "Conversion",
      title: "Move from desire to a specific reason to buy",
      copy: "Best-seller, bundle and offer creative reduce the decision while keeping the same editorial tone.",
      assets: fromGroup("conversion")
    },
    {
      label: "Customer proof",
      title: "Let customers describe the product in their own language",
      copy: "Review-led ads turn texture, scent and everyday use into direct proof while lifestyle imagery keeps the communication personal.",
      assets: fromGroup("social-proof")
    }
  ];

  const adHost = document.querySelector("[data-sope-ads]");
  if (adHost) api.reel(adHost, adGroups);

  const newsletterAssets = fromGroup("newsletters");
  const inbox = document.querySelector("[data-sope-inbox]");
  const reader = document.querySelector("#newsletter-reader");
  if (inbox && reader) api.inbox(inbox, [{ label: "SOPE campaigns", assets: newsletterAssets }], reader);
})();

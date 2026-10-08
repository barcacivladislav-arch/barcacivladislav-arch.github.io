# Vladislav Barcaci — portfolio site

This folder is ready to use as the root of a GitHub Pages repository. It is a static site with no build step.

## Publish

1. Upload every file and folder here to the root of a GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Keep the `.nojekyll` file in the repository root.

## Edit

- Main page: `index.html`
- Every project page: `work/<project>/index.html`
- About page: `about/index.html`
- Design system: `assets/css/tokens.css`, `base.css`, `components.css`, `home.css`, `project.css`, and `assets/css/themes/`
- Curated project manifests and media: `assets/portfolio`
- Shared project renderer: `assets/js/project-assets.js`
- Narrative and asset-order guide: `CONTENT-STRUCTURE.md`

The paths are relative, so the portfolio can be published on a user site or under a repository subpath.

## Add future media

Prepare new media inside the relevant folder under `assets/portfolio`, then update that project's `manifest.json`. Replacing an existing prepared file with the same filename updates it without changing the HTML.

The current layouts are type-specific: campaigns use three or four pieces per row, newsletters use four (or five where the set benefits from it), and responsive websites pair a larger desktop view with its mobile counterpart.

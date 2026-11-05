# HBA — Human Bridge Ambassador

Website for **[hba-story.org](https://hba-story.org)**.
*Everyone has a story. Listen. Connect. Bridge.*

Static site (plain HTML/CSS/JS, no build step).

```
index.html            single-page site (English text lives here)
assets/js/i18n.js     Korean translations (keys match data-i18n attributes)
assets/js/main.js     language toggle, menu, gallery lightbox, forms
assets/css/style.css  styles (navy / gold / cream brand palette)
assets/img/           optimized images (webp)
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (add `?lang=ko` for Korean).

## Editing text

- English: edit the text directly in `index.html`.
- Korean: edit the matching key in `assets/js/i18n.js`.
- Contact email: `CONTACT_EMAIL` in `assets/js/main.js` and the `mailto:` link in `index.html`.

# ZoneZine

Independent English-language Fortnite reference site. The first release includes a Wiki-style homepage and five Kasane Teto guides, illustrated unlock steps, a reward checklist, a 360-degree Outfit preview and a four-song player.

## Published website

- Live production site: https://zonezine.org
- Cloudflare Pages fallback: https://zonezine.pages.dev
- Cloudflare Pages project: zonezine
- Production branch: main
- Initial deployed website commit: 5d4f29083e89b9ae3a05f56d9321ca6fec068312
- Custom domain: zonezine.org (active; HTTPS verified)

## Custom-domain DNS

The proxied CNAME for zonezine.org (name @) points to zonezine.pages.dev with automatic TTL. The domain is associated with this Pages project. Cloudflare domain validation, HTTPS and all six public pages were verified on November 14, 2026.

## Publishing updates

This project uses Cloudflare Pages Direct Upload. GitHub stores the source files; pushes to GitHub do not currently trigger automatic Cloudflare deployments. Upload the updated static files as a new production deployment after committing changes.

This repository contains the deployable static site. The local-only image editor and preview server are not included. Media attribution is retained in captions and the assets source records. Third-party media playback depends on its provider.

## Guide update — November 15, 2026

The five guides now include focused sections and FAQs, current XP and Crew access guidance, a screenshot-labelled pass deadline, direct contextual links and concise page metadata. Tutorial and gallery pictures are included in the initial HTML; controls enhance that content without depending on a JSON request. Original creator credits and source links remain attached to screenshots and videos.

## Leekcapper page maintenance

The published guide uses static HTML with external media, CSS and JavaScript under `assets/leekcapper/`. Keep the HTML below 100 KB and all article content in the initial response. Large Base64 media must not be reintroduced ahead of the article.

After importing output from the older single-file generator, run `node maintenance/optimize-leekcapper.cjs` from this repository, or pass the static directory as its first argument. The helper preserves an already optimized page and its modification date on unchanged reruns. Copy the HTML, stylesheet, script, map, promotional image and audio files together when preparing the deployment directory. The existing homepage, weapon thumbnail and other five guides remain separate files.

# ZoneZine

Independent English-language Fortnite reference site. The first release includes a Wiki-style homepage and five Kasane Teto guides, illustrated unlock steps, a reward checklist, a 360-degree Outfit preview and a four-song player.

## Published website

- Live production site: https://zonezine.pages.dev
- Cloudflare Pages project: zonezine
- Production branch: main
- Initial deployed website commit: 5d4f29083e89b9ae3a05f56d9321ca6fec068312
- Intended custom domain: zonezine.org (registered with the Pages project; DNS validation pending)

## Custom-domain DNS

Create a proxied CNAME for zonezine.org (name @) pointing to zonezine.pages.dev, with automatic TTL. The domain must also remain associated with this Pages project. Verify domain status and HTTPS after the record is added.

## Publishing updates

This project uses Cloudflare Pages Direct Upload. GitHub stores the source files; pushes to GitHub do not currently trigger automatic Cloudflare deployments. Upload the updated static files as a new production deployment after committing changes.

This repository contains the deployable static site. The local-only image editor and preview server are not included. Media attribution is retained in captions and the assets source records. Third-party media playback depends on its provider.

# Profile Stats Card

A small, dependency-free Vercel function that renders GitHub profile statistics as an SVG card. It keeps the URL shape used by `kgnio-profile-card`:

```text
/api/card?user=SpringTsuki&theme=cupcake
```

## Recommended: GitHub Actions

No server, domain, Vercel account, or personal access token is required. The included workflow generates `public/card.svg` on every relevant push and once per day using the repository's built-in `GITHUB_TOKEN`.

Embed the generated card in a README:

```md
![GitHub Profile Stats](https://raw.githubusercontent.com/SpringTsuki/profile-stats-card/main/public/card.svg)
```

To update it immediately, open **Actions → Generate profile card → Run workflow**. Change `CARD_USERNAME` or `CARD_THEME` in `.github/workflows/generate-card.yml` when needed.

## Deploy on Vercel

1. Push this folder to a new GitHub repository.
2. Import the repository in Vercel; no build settings are required.
3. Add `GITHUB_TOKEN` in **Settings → Environment Variables**.
4. Redeploy, then open `/api/card?user=SpringTsuki&theme=cupcake`.

The token is optional but strongly recommended. Use a fine-grained token with read-only access to public repositories. It raises GitHub API limits and must never be committed.

Embed the result in a README:

```md
![GitHub Profile Stats](https://YOUR-PROJECT.vercel.app/api/card?user=SpringTsuki&theme=cupcake)
```

Available themes: `cupcake`, `midnight`, `azure-noir`, `cyber-city`, `darker-than-black`, `ice`, `sunset`, and `pine-tree`.

## Local check

```sh
npm test
npx vercel dev
```

## Notes

- Statistics use GitHub's REST API and include public repositories.
- Stars and forks are summed over the first 100 most recently updated owned repositories.
- Responses are cached at the CDN for six hours with stale-while-revalidate enabled.
- Avatars are embedded in the SVG so GitHub's image proxy can render them reliably.

## License

MIT

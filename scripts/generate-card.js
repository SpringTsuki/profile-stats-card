const fs = require("node:fs/promises");
const path = require("node:path");
const { loadProfile, renderCard, THEMES } = require("../api/card.js")._internal;

async function main() {
  const username = process.env.CARD_USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
  const requestedTheme = String(process.env.CARD_THEME || "cupcake").toLowerCase();
  const theme = THEMES[requestedTheme] ? requestedTheme : "cupcake";

  if (!username) {
    throw new Error("Set CARD_USERNAME or run this script inside GitHub Actions.");
  }

  const profile = await loadProfile(username);
  const svg = renderCard(profile, theme);
  const outputDirectory = path.join(__dirname, "..", "public");
  const outputFile = path.join(outputDirectory, "card.svg");

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(outputFile, svg, "utf8");
  console.log(`Generated ${outputFile} for ${username} with theme ${theme}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

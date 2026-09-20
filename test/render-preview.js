const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { renderCard } = require("../api/card.js")._internal;

const svg = renderCard({
  login: "SpringTsuki",
  name: "SpringTsuki",
  bio: "DevOps · Minecrafter · 偶尔写些妙妙小工具",
  avatar: "https://avatars.githubusercontent.com/u/56472690?v=4",
  followers: 18,
  repos: 27,
  stars: 86,
  forks: 14,
  joined: 2019,
  languages: [
    { name: "mcfunction", color: "#62B47A" },
    { name: "Python", color: "#3572A5" },
    { name: "JavaScript", color: "#f1e05a" }
  ]
}, "cupcake");

const output = path.join(os.tmpdir(), "profile-stats-card-cupcake.svg");
fs.writeFileSync(output, svg);
console.log(output);

const assert = require("node:assert/strict");
const handler = require("../api/card.js");
const { renderCard, renderError, THEMES } = handler._internal;

const profile = {
  login: "SpringTsuki",
  name: "Spring Tsuki",
  bio: "DevOps · Minecrafter · 偶尔写些妙妙小工具",
  avatar: "https://avatars.githubusercontent.com/u/1?v=4",
  followers: 42,
  repos: 18,
  stars: 120,
  forks: 9,
  joined: 2019,
  languages: [
    { name: "TypeScript", color: "#3178c6" },
    { name: "Python", color: "#3572A5" }
  ]
};

for (const theme of Object.keys(THEMES)) {
  const svg = renderCard(profile, theme);
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /SpringTsuki/);
  assert.match(svg, /width="760"/);
  assert.doesNotMatch(svg, /undefined/);
}

assert.match(renderError("test & retry", "cupcake"), /test &amp; retry/);

async function testHandler() {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes("/users/SpringTsuki/repos")) {
      return new Response(JSON.stringify([
        { fork: false, stargazers_count: 12, forks_count: 3, language: "TypeScript" },
        { fork: false, stargazers_count: 5, forks_count: 1, language: "Python" }
      ]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/users/SpringTsuki")) {
      return new Response(JSON.stringify({
        login: "SpringTsuki", name: "Spring Tsuki", bio: "Hello & <world>",
        avatar_url: "https://avatars.example/test.png", followers: 42,
        public_repos: 18, created_at: "2019-01-01T00:00:00Z"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("avatars.example")) {
      return new Response(Uint8Array.from([137, 80, 78, 71]), {
        status: 200, headers: { "content-type": "image/png" }
      });
    }
    return new Response("not found", { status: 404 });
  };

  let statusCode;
  let body;
  const headers = {};
  const response = {
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    status(value) { statusCode = value; return this; },
    send(value) { body = value; return this; }
  };
  await handler({ query: { user: "SpringTsuki", theme: "cupcake" } }, response);
  global.fetch = originalFetch;

  assert.equal(statusCode, 200);
  assert.equal(headers["content-type"], "image/svg+xml; charset=utf-8");
  assert.match(headers["cache-control"], /s-maxage=21600/);
  assert.match(body, /data:image\/png;base64/);
  assert.match(body, /Hello &amp; &lt;world&gt;/);
  assert.match(body, /Stars earned/);
}

testHandler()
  .then(() => console.log(`ok - rendered ${Object.keys(THEMES).length} themes and full handler response`))
  .catch((error) => { console.error(error); process.exitCode = 1; });

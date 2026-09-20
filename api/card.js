const THEMES = {
  cupcake: {
    bg: "#fff7f1", panel: "#ffffff", border: "#eaded7", title: "#291f26",
    text: "#695c66", muted: "#9a8995", accent: "#ff7fa7", accent2: "#72c7bd",
    chip: "#fff0f5", chipText: "#8a4960", shadow: "#dcbfc8"
  },
  midnight: {
    bg: "#090e1a", panel: "#111827", border: "#263249", title: "#f8fafc",
    text: "#cbd5e1", muted: "#8492a8", accent: "#8b5cf6", accent2: "#22d3ee",
    chip: "#1e293b", chipText: "#c4b5fd", shadow: "#020617"
  },
  "azure-noir": {
    bg: "#071523", panel: "#0c2134", border: "#173f5f", title: "#e6f6ff",
    text: "#a9c9dc", muted: "#6d94ac", accent: "#38bdf8", accent2: "#60a5fa",
    chip: "#102f49", chipText: "#7dd3fc", shadow: "#020b12"
  },
  "cyber-city": {
    bg: "#10071d", panel: "#1a0c2d", border: "#4f1f69", title: "#fff4ff",
    text: "#e9c9f2", muted: "#a77eb5", accent: "#f43fdf", accent2: "#31f6c8",
    chip: "#321044", chipText: "#ff9af2", shadow: "#050209"
  },
  "darker-than-black": {
    bg: "#050505", panel: "#0d0d0d", border: "#282828", title: "#ffffff",
    text: "#c7c7c7", muted: "#777777", accent: "#f1f1f1", accent2: "#9ca3af",
    chip: "#191919", chipText: "#e5e5e5", shadow: "#000000"
  },
  ice: {
    bg: "#eef8ff", panel: "#ffffff", border: "#c9e5f5", title: "#16364a",
    text: "#476b80", muted: "#7f9faf", accent: "#4aa8d8", accent2: "#76c9c2",
    chip: "#e5f5ff", chipText: "#28799f", shadow: "#bad7e7"
  },
  sunset: {
    bg: "#24111c", panel: "#321724", border: "#613044", title: "#fff4e9",
    text: "#e9c9bb", muted: "#b78d83", accent: "#ff7b72", accent2: "#f6bd60",
    chip: "#4a2131", chipText: "#ffb4a7", shadow: "#12070d"
  },
  "pine-tree": {
    bg: "#0e1b17", panel: "#14251f", border: "#294b3d", title: "#effbf4",
    text: "#b8d7c7", muted: "#769b88", accent: "#6cc49a", accent2: "#c6d86d",
    chip: "#1c372c", chipText: "#91ddb8", shadow: "#07100d"
  }
};

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883",
  Go: "#00ADD8", Rust: "#dea584", "C#": "#178600", C: "#555555",
  "C++": "#f34b7d", Shell: "#89e051", PowerShell: "#012456",
  Kotlin: "#A97BFF", Swift: "#F05138", Ruby: "#701516", PHP: "#4F5D95"
};

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function compactNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(Number(value) || 0);
}

function parseLinkHeader(value) {
  const links = {};
  for (const part of (value || "").split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) links[match[2]] = match[1];
  }
  return links;
}

async function githubFetch(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "profile-stats-card",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    const message = response.status === 403
      ? "GitHub API limit reached. Configure GITHUB_TOKEN."
      : `GitHub API returned ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response;
}

async function loadProfile(username) {
  const [userResponse, reposResponse] = await Promise.all([
    githubFetch(`/users/${encodeURIComponent(username)}`),
    githubFetch(`/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=1`)
  ]);
  const user = await userResponse.json();
  const repos = await reposResponse.json();
  const totals = repos.reduce((acc, repo) => {
    if (!repo.fork) {
      acc.stars += repo.stargazers_count || 0;
      acc.forks += repo.forks_count || 0;
      if (repo.language) acc.languages[repo.language] = (acc.languages[repo.language] || 0) + 1;
    }
    return acc;
  }, { stars: 0, forks: 0, languages: {} });

  const topLanguages = Object.entries(totals.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count, color: LANGUAGE_COLORS[name] || "#8b949e" }));

  let avatarData = user.avatar_url;
  try {
    const avatarResponse = await fetch(user.avatar_url, { headers: { "User-Agent": "profile-stats-card" } });
    if (avatarResponse.ok) {
      const contentType = avatarResponse.headers.get("content-type") || "image/png";
      const bytes = Buffer.from(await avatarResponse.arrayBuffer());
      avatarData = `data:${contentType};base64,${bytes.toString("base64")}`;
    }
  } catch (_) {
    // The public avatar URL remains a useful fallback outside strict SVG renderers.
  }

  return {
    login: user.login,
    name: user.name || user.login,
    bio: user.bio || "Building things, one commit at a time.",
    avatar: avatarData,
    followers: user.followers,
    repos: user.public_repos,
    stars: totals.stars,
    forks: totals.forks,
    joined: new Date(user.created_at).getUTCFullYear(),
    languages: topLanguages
  };
}

function stat(x, label, value, icon, theme) {
  return `<g transform="translate(${x} 190)">
    <rect width="142" height="70" rx="16" fill="${theme.panel}" stroke="${theme.border}"/>
    <text x="18" y="29" class="statIcon">${icon}</text>
    <text x="48" y="31" class="statValue">${escapeXml(compactNumber(value))}</text>
    <text x="18" y="53" class="statLabel">${escapeXml(label)}</text>
  </g>`;
}

function renderCard(profile, themeName) {
  const t = THEMES[themeName] || THEMES.cupcake;
  const languages = profile.languages.length ? profile.languages : [{ name: "Explorer", color: t.accent2 }];
  let languageX = 226;
  const languageChips = languages.map((language) => {
    const width = Math.min(112, 34 + language.name.length * 7.1);
    const result = `<g transform="translate(${languageX} 135)">
      <rect width="${width}" height="29" rx="14.5" fill="${t.chip}" stroke="${t.border}"/>
      <circle cx="15" cy="14.5" r="4" fill="${language.color}"/>
      <text x="26" y="19" class="chip">${escapeXml(language.name)}</text>
    </g>`;
    languageX += width + 8;
    return result;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="290" viewBox="0 0 760 290" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(profile.login)} GitHub profile statistics</title>
  <desc id="desc">${escapeXml(profile.repos)} repositories, ${escapeXml(profile.stars)} stars, ${escapeXml(profile.followers)} followers and ${escapeXml(profile.forks)} forks.</desc>
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity=".15"/>
      <stop offset=".55" stop-color="${t.bg}" stop-opacity="0"/>
      <stop offset="1" stop-color="${t.accent2}" stop-opacity=".16"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="${t.shadow}" flood-opacity=".28"/>
    </filter>
    <clipPath id="avatarClip"><circle cx="104" cy="105" r="54"/></clipPath>
    <style>
      text { font-family: ui-rounded, "SF Pro Rounded", "Segoe UI", sans-serif; }
      .name { fill:${t.title}; font-size:25px; font-weight:750; letter-spacing:-.4px; }
      .handle { fill:${t.accent}; font-size:14px; font-weight:650; }
      .bio { fill:${t.text}; font-size:14px; }
      .meta { fill:${t.muted}; font-size:12px; font-weight:550; }
      .chip { fill:${t.chipText}; font-size:11px; font-weight:650; }
      .statValue { fill:${t.title}; font-size:21px; font-weight:760; }
      .statLabel { fill:${t.muted}; font-size:11px; font-weight:600; letter-spacing:.35px; text-transform:uppercase; }
      .statIcon { fill:${t.accent}; font-size:17px; }
    </style>
  </defs>
  <rect x="8" y="8" width="744" height="274" rx="25" fill="${t.bg}" stroke="${t.border}" filter="url(#shadow)"/>
  <rect x="8" y="8" width="744" height="274" rx="25" fill="url(#wash)"/>
  <circle cx="710" cy="43" r="35" fill="${t.accent}" opacity=".08"/>
  <circle cx="688" cy="64" r="9" fill="${t.accent2}" opacity=".18"/>
  <path d="M35 47c9 0 9-12 9-12s0 12 9 12c-9 0-9 12-9 12s0-12-9-12Z" fill="${t.accent}" opacity=".7"/>
  <circle cx="104" cy="105" r="60" fill="${t.panel}" stroke="${t.border}" stroke-width="2"/>
  <image href="${escapeXml(profile.avatar)}" x="50" y="51" width="108" height="108" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>
  <circle cx="146" cy="145" r="12" fill="${t.panel}"/>
  <circle cx="146" cy="145" r="8" fill="${t.accent2}"/>
  <text x="194" y="73" class="name">${escapeXml(profile.name)}</text>
  <text x="194" y="99" class="handle">@${escapeXml(profile.login)}</text>
  <text x="194" y="124" class="bio">${escapeXml(profile.bio.length > 63 ? `${profile.bio.slice(0, 60)}…` : profile.bio)}</text>
  ${languageChips}
  <text x="631" y="151" class="meta">Since ${escapeXml(profile.joined)}</text>
  ${stat(32, "Repositories", profile.repos, "⌘", t)}
  ${stat(182, "Stars earned", profile.stars, "★", t)}
  ${stat(332, "Followers", profile.followers, "●", t)}
  ${stat(482, "Total forks", profile.forks, "⑂", t)}
  <g transform="translate(640 190)">
    <rect width="80" height="70" rx="16" fill="${t.accent}" opacity=".12" stroke="${t.accent}"/>
    <path d="M27 25c5-8 21-8 26 0M27 42c5 8 21 8 26 0" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="27" cy="33.5" r="4" fill="${t.accent2}"/><circle cx="53" cy="33.5" r="4" fill="${t.accent}"/>
  </g>
</svg>`;
}

function renderError(message, themeName) {
  const t = THEMES[themeName] || THEMES.cupcake;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="180" viewBox="0 0 760 180" role="img">
    <rect x="8" y="8" width="744" height="164" rx="24" fill="${t.bg}" stroke="${t.border}"/>
    <circle cx="76" cy="90" r="35" fill="${t.chip}"/><text x="76" y="101" text-anchor="middle" font-size="30">☁</text>
    <text x="130" y="78" fill="${t.title}" font-family="Segoe UI, sans-serif" font-size="20" font-weight="700">Card temporarily unavailable</text>
    <text x="130" y="108" fill="${t.text}" font-family="Segoe UI, sans-serif" font-size="13">${escapeXml(message)}</text>
  </svg>`;
}

module.exports = async function handler(req, res) {
  const username = String(req.query?.user || req.query?.username || "").trim();
  const themeName = String(req.query?.theme || "cupcake").toLowerCase();
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(400).send(renderError("Use ?user=YOUR_GITHUB_USERNAME", themeName));
  }

  try {
    const profile = await loadProfile(username);
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).send(renderCard(profile, themeName));
  } catch (error) {
    const status = error.status === 404 ? 404 : 503;
    res.setHeader("Cache-Control", status === 404 ? "public, max-age=300" : "no-store");
    return res.status(status).send(renderError(error.message, themeName));
  }
};

module.exports._internal = { renderCard, renderError, loadProfile, THEMES, escapeXml };

import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "cors",
  "dotenv",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "pg",
  "postgres",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  const { writeFile } = await import("fs/promises");
  const distProxyContent = `// Proxy to compiled production bundle\nmodule.exports = require('./index.cjs');\n`;
  await writeFile("dist/app.js", distProxyContent);
  await writeFile("dist/server.js", distProxyContent);
  await writeFile("dist/index.js", distProxyContent);

  const rootEntryContent = `// Entry point for CWP Node.js Manager (CentOS Web Panel)\nrequire('./dist/index.cjs');\n`;
  await writeFile("app.js", rootEntryContent);
  await writeFile("server.js", rootEntryContent);

  const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Allow API, attached_assets, and uploads to pass directly to Node.js backend
  RewriteCond %{REQUEST_URI} ^/(api|attached_assets|uploads)/ [NC]
  RewriteRule ^ - [L]

  # 2. Serve static files directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Fallback SPA routes to index.html
  RewriteRule ^ index.html [L]
</IfModule>
`;
  await writeFile("dist/.htaccess", htaccessContent);
  await writeFile("dist/public/.htaccess", htaccessContent);

  console.log("✓ CWP server entry points (app.js, server.js, index.js, .htaccess) generated successfully.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

import nextra from "nextra";

const withNextra = nextra({});

export default withNextra({
  // Static HTML in out/, served by Caddy in production (docs.<domain>)
  output: "export",
  // Required by static export: there is no server to optimize images on demand
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.tsx",
    },
  },
});

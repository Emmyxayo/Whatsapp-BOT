/** @type {import('next').NextConfig} */

// Server Actions enforce that the forwarded host matches the request origin
// (CSRF protection). Behind the GitHub Codespaces port proxy the browser uses
// the public `<codespace>-<port>.app.github.dev` host while the server sees
// `localhost`, so the check aborts the action. Whitelist the Codespaces host —
// derived from the env vars Codespaces injects, so it survives a rebuild — plus
// localhost for local dev.
const codespaceName = process.env.CODESPACE_NAME;
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

const allowedOrigins = ["localhost:3000"];
if (codespaceName && forwardingDomain) {
  allowedOrigins.push(`${codespaceName}-3000.${forwardingDomain}`);
}

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;

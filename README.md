# Shipr — Deploy Frontend Projects to Your Own Subdomain

[![License](https://img.shields.io/github/license/callmegautam/shipr)](LICENSE)
[![Issues](https://img.shields.io/github/issues/callmegautam/shipr)](https://github.com/yourusername/shipr/issues)

Shipr is a self-hosted, open-source platform that lets you deploy frontend projects (e.g., React, Vue, Svelte) directly from a GitHub repository to a custom subdomain, like **`myapp.shipr.com`** automatically.

Think of it as your own mini Vercel or Netlify, but fully in your control.

---

## Features

-   **GitHub Integration** — Deploy directly from any public GitHub repo.
-   **Wildcard Subdomains** — `*.shipr.com` routing out of the box.
-   **Automated Builds** — Clone → Install → Build → Deploy — all in an isolated environment.
-   **Secure Sandboxing** — Builds run inside isolated containers with resource limits.
-   **Extensible** — Modular architecture for adding new deployment backends or build strategies.
-   **Self-hostable** — Own your infrastructure and data.

---

## Architecture

```

┌──────────────┐      ┌───────────────┐      ┌─────────────┐
│ API Server   │ ───> │ Build Server  │ ───> │ Artifact    │
│ (Control)    │      │ (Worker)      │      │ Storage     │
└──────┬───────┘      └──────┬────────┘      └─────┬───────┘
       │                     │                     │
       ▼                     ▼                     ▼
User submits repo    Build is sandboxed    Reverse proxy serves

```

-   **Domain** : Subdomain & deployed site at subdomain.shipr.com
-   **API Server** : Accepts deployment requests, stores metadata, triggers builds.
-   **Build Server** : Executes builds in isolated containers.
-   **Reverse Proxy** : Routes incoming traffic to the correct deployed site.
-   **Storage** : Stores build artifacts i.e S3

---

## Tech Stack

-   **Backend** — Node.js + TypeScript
-   **Builds** — Docker-based isolated environments
-   **Reverse Proxy** — Custom reverse proxy using http-proxy
-   **Storage** — S3
-   **Package Manager** — pnpm
-   **I/O Server** — Socket.io
-   **Logging** — Redis

---

## Quickstart (Development)

### Prerequisites

-   Node.js >= 18
-   pnpm
-   Docker & Docker Compose

### Clone the Repo

```bash
git clone https://github.com/callmegautam/Shipr.git
cd Shipr
```

### Environment Setup

Copy `.env.example` in each service and update values:

```bash
cp api-server/.env.example api-server/.env
cp build-server/.env.example build-server/.env
cp reverse-proxy/.env.example reverse-proxy/.env
```

-   API server at `http://localhost:3000`
-   Reverse proxy serving deployed apps
-   Build server workers

---

## Deployment (Production)

For production, you’ll need:

-   A domain with wildcard DNS (`*.yourdomain.com` → server IP)
-   Persistent storage for artifacts

Coming soon: **Helm charts for Kubernetes**.

---

## Contributing

We welcome contributions! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Support

-   File an issue in the [GitHub Issues](https://github.com/callmegautam/shipr/issues) page.
-   Discussions & Q\&A in [GitHub Discussions](https://github.com/callmegautam/shipr/discussions).

---

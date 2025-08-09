# Contributing to Shipr

Thank you for your interest in contributing to **Shipr**!

Whether it’s reporting a bug, suggesting a feature, improving documentation, or submitting code , your help makes this project better.

---

## 📋 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [How Can I Contribute?](#-how-can-i-contribute)
3. [Development Setup](#-development-setup)
4. [Coding Guidelines](#-coding-guidelines)
5. [Commit Message Guidelines](#-commit-message-guidelines)
6. [Submitting Changes](#-submitting-changes)

---

## 📜 Code of Conduct

Please read and follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).  
By participating, you are expected to uphold this code.

---

## 🤝 How Can I Contribute?

-   **Report bugs** via [GitHub Issues](https://github.com/callmegautam/shipr/issues).
-   **Suggest features** by opening a feature request issue.
-   **Improve documentation** in `README.md` or inline comments.
-   **Submit code** for new features, bug fixes, or performance improvements.
-   **Review pull requests** and give constructive feedback.

---

## 🛠 Development Setup

Shipr is split into three separate Node.js + TypeScript services:

-   `api-server/`
-   `build-server/`
-   `reverse-proxy/`

### 1. Fork & Clone

```bash
git clone https://github.com/callmegautam/shipr.git
cd shipr
```

### 2. Install Dependencies

Go into each service directory and install dependencies with **pnpm**:

```bash
cd api-server && pnpm install
cd ../build-server && pnpm install
cd ../reverse-proxy && pnpm install
```

### 3. Environment Setup

Each service has its own `.env.example`. Copy and configure:

```bash
cp .env.example .env
```

Do this inside each service directory.

### 4. Run Services

Run each service separately in its own terminal:

```bash
# API server
cd api-server
pnpm dev

# Reverse proxy
cd ../reverse-proxy
pnpm dev
```

---

## 🎯 Coding Guidelines

-   **Language**: TypeScript (Node.js)
-   **Formatting**: Prettier is enforced.
-   **Linting**: ESLint must pass with no errors.
-   **Structure**: Keep features modular and isolated per service.
-   **Security**: Never hardcode secrets, validate all user input.

---

## 📝 Commit Message Guidelines

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

Format:

```
<type>(scope): <short summary>
```

Examples:

```
feat(api): add deploy endpoint
fix(build): handle yarn projects
docs(readme): update setup instructions
```

Types:

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation only changes
-   `style`: Code style changes (no logic impact)
-   `refactor`: Code change that neither fixes a bug nor adds a feature
-   `perf`: Performance improvement
-   `chore`: Maintenance

---

## 📤 Submitting Changes

1. Fork the repo and create a new branch:

    ```bash
    git checkout -b feat/my-feature
    ```

2. Make your changes and commit them using Conventional Commits.
3. Push to your fork and create a Pull Request to `main`.
4. Fill out the PR template with context and screenshots if applicable.

---

## 💡 Tips for First-Time Contributors

-   Start with **"good first issue"** or **"help wanted"** labels.
-   Join discussions on issues before working on them.
-   Keep PRs small and focused for easier review.

---

Thanks again for contributing to Shipr!

---

# Contributing to Spotify MCP Server

Thank you for your interest in contributing! We're excited to have you here. This project thrives on community contributions, and we welcome developers of all skill levels.

## 🌟 Our Philosophy

We believe in:
- **Kindness first** - Be respectful, supportive, and welcoming to all contributors
- **Quality code** - Ensure tests pass and code is clean
- **Open collaboration** - Share ideas, ask questions, and help each other grow

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/spotify-mcp.git
cd spotify-mcp
npm install
```

### 2. Set Up Your Environment

Follow the [Local Development](README.md#local-development) guide in the README to:
- Create a Spotify app and get credentials
- Set up your `.env` file
- Build and test the project

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## ✅ Before Submitting

Please ensure your contribution passes all checks:

### Required Checks

```bash
# 1. Build must succeed
npm run build

# 2. All tests must pass
npm test

# 3. Linting must pass
npm run lint

# Optional: Auto-fix linting issues
npm run lint:fix
```

### Code Quality

- Write clear, readable code
- Add tests for new features
- Update documentation if needed
- Follow existing code patterns
- Keep commits focused and descriptive

## 📝 Commit Messages

We use descriptive commit messages. Here are some examples:

```
feat: Add shuffle control to playback tools
fix: Handle expired tokens gracefully
chore: Update dependencies
docs: Improve authentication setup guide
test: Add tests for playlist management
```

## 🔄 Pull Request Process

1. **Push your changes** to your fork
2. **Open a Pull Request** against the `main` branch
3. **Fill out the PR template** with details about your changes
4. **Wait for review** - we'll review as soon as possible!
5. **Address feedback** if any changes are requested
6. **Celebrate** when it's merged! 🎉

## 🐛 Reporting Bugs

Found a bug? Please [open an issue](https://github.com/darrenjaworski/spotify-mcp/issues/new/choose) using the bug report template. Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, etc.)

## 💡 Suggesting Features

Have an idea? We'd love to hear it! [Open a feature request](https://github.com/darrenjaworski/spotify-mcp/issues/new/choose) and tell us:
- What problem does it solve?
- How would it work?
- Why would it be useful?

## ❓ Questions

Not sure about something? No problem!
- Open a [discussion](https://github.com/darrenjaworski/spotify-mcp/discussions) or issue
- We're here to help and learn together

## 🎯 Areas We'd Love Help With

Check out our [ROADMAP.md](ROADMAP.md) for planned features! Some great areas to contribute:

- **New Spotify API features** - Podcasts, queue management, audio features
- **Testing** - Expand test coverage
- **Documentation** - Improve guides and examples
- **Bug fixes** - Check open issues

## 🤝 Code of Conduct

**TL;DR: Be kind, be respectful, be welcoming.**

We're committed to providing a friendly, safe, and welcoming environment for all. Please:
- Be respectful and considerate in your communication
- Welcome newcomers and help them learn
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

Unacceptable behavior includes harassment, discrimination, trolling, or any conduct that makes others feel unsafe or unwelcome.

If you experience or witness unacceptable behavior, please report it by contacting the project maintainers.

## 📚 Development Tips

### Testing Your Changes

```bash
# Run tests in watch mode while developing
npm run test:watch

# Test with MCP Inspector
npm run build
npx @modelcontextprotocol/inspector node build/bin.js
```

### TypeScript Guidelines

We follow a pragmatic approach to TypeScript (see [CLAUDE.md](CLAUDE.md)):
- Use `any` when it makes sense (third-party APIs, quick prototyping)
- Keep public function signatures typed
- Don't spend hours fighting the type system

### Project Structure

- `src/tools/` - MCP tool implementations
- `src/spotify/` - Spotify API client and auth
- `src/utils/` - Shared utilities
- `src/types.ts` - TypeScript type definitions
- `src/index.ts` - Entry point and server setup

## 🙏 Thank You!

Every contribution, no matter how small, makes this project better. Whether you're fixing a typo, adding a feature, or helping others in discussions - **thank you for being part of this community!**

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Questions?** Feel free to reach out by opening an issue. We're here to help! 💙

# Contributing

Thanks for your interest in contributing. This project follows standard open-source practices.

## How to contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run the build to check for errors (`npm run build`)
5. Commit your changes (`git commit -m "feat: add your feature"`)
6. Push to your fork (`git push origin feature/your-feature`)
7. Open a Pull Request

## Code standards

This project follows strict code conventions. Before submitting a PR, please review [AGENTS.md](AGENTS.md) for the full code style guide.

Key rules:
- No `export default` in non-page files
- All API calls go through typed modules in `src/lib/api/`
- No server actions — all mutations use API routes
- No silent catch blocks — every `catch {}` must log the error
- Error responses use `{ error: { message, code } }` shape

## Pull request guidelines

- Keep PRs focused — one feature or bug fix per PR
- Write a clear PR description explaining what and why
- Link related issues if applicable
- Ensure the build passes before requesting review

# Contributing to UI Thing CLI

First off, thank you for considering contributing to UI Thing CLI! It's people like you that make UI Thing CLI such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct: be respectful, inclusive, and considerate in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed and what you expected
- Include your environment details (OS, Node version, package version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any alternatives you've considered

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing code style
5. Write a clear commit message

## Development Setup

1. Clone your fork of the repository

```bash
git clone https://github.com/YOUR_USERNAME/ui-thing-cli.git
cd ui-thing-cli
```

2. Install dependencies

```bash
npm install
```

3. Build the project

```bash
npm run build
```

4. Run tests

```bash
npm run test
```

## Project Structure

- `src/commands/` - CLI command implementations
- `src/templates/` - File and code templates
- `src/utils/` - Shared utility functions
- `tests/` - Unit tests (mirrors src/ structure)

## Coding Guidelines

- Write TypeScript with proper type annotations
- Follow the existing code style (check `eslint.config.ts`)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Testing

- Add tests to the `tests/` directory
- Run `npm run test` to execute all tests
- Ensure all tests pass before submitting a PR

## Need Help?

If you need help or have questions, feel free to:

- Open an issue
- Reach out via email: behon.baker@yahoo.com

Thank you for your contributions! 🎉

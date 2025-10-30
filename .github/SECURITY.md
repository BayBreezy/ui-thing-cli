# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2.0 | :x:                |

## Reporting a Vulnerability

We take the security of UI Thing CLI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

- Email your findings to **behon.baker@yahoo.com**
- Provide as much information as possible about the vulnerability:
  - Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
  - Full paths of source file(s) related to the manifestation of the issue
  - The location of the affected source code (tag/branch/commit or direct URL)
  - Any special configuration required to reproduce the issue
  - Step-by-step instructions to reproduce the issue
  - Proof-of-concept or exploit code (if possible)
  - Impact of the issue, including how an attacker might exploit it

### What to Expect:

- You will receive a response within 48 hours acknowledging your report
- We will investigate and keep you updated on the progress
- Once the vulnerability is confirmed, we will work on a fix and release a security patch
- We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using UI Thing CLI:

- Always use the latest version of the package
- Review generated code before committing to your repository
- Be cautious when running CLI commands with elevated privileges
- Keep your Node.js and npm/pnpm/yarn up to date

## Contact

For any security-related questions or concerns, please contact:
**Behon Baker** - behon.baker@yahoo.com

Thank you for helping keep UI Thing CLI and its users safe!

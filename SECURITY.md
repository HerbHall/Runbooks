# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x | Yes |

## Reporting a Vulnerability

Please report security vulnerabilities through GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/HerbHall/Runbooks/security/advisories)
2. Click **Report a vulnerability**
3. Fill out the form with details about the issue

**Do not open a public issue for security vulnerabilities.**

## Response Timeline

- **Acknowledgment:** within 7 days
- **Status update:** within 30 days
- **Fix timeline:** depends on severity and complexity

## Scope

This extension runs Docker CLI commands on behalf of the user through the Docker Desktop Extension SDK. Security-relevant areas include:

- Command injection via runbook command fields
- Import/export file handling
- localStorage data integrity

# Security Policy

## Supported Versions

The following versions of New World Crafting Calculator are currently being supported with security updates:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.1.x   | :white_check_mark: | Current stable release |
| 1.0.x   | :white_check_mark: | Previous stable (until 2025-12-31) |
| 0.8.x   | :x:                | End of life |
| < 0.8   | :x:                | End of life |

## Security Considerations

### Desktop Application (Electron)

- The desktop application runs with elevated permissions for global hotkeys and screen capture
- OCR functionality requires screen access permissions
- Configuration data is stored in the user's AppData directory
- No network requests are made except for initial app updates (if enabled)

### Web Application

- Runs entirely in the browser with no server-side components
- Uses localStorage for configuration persistence
- OCR processing is performed locally using Tesseract.js
- No user data is transmitted to external services

### Data Privacy

- **No telemetry**: The application does not collect or transmit usage data
- **Local processing**: All OCR and calculations are performed locally
- **No authentication**: No user accounts or personal information required
- **Configuration privacy**: Settings are stored locally and never shared

## Reporting a Vulnerability

### Where to Report

Please report security vulnerabilities by:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Security tab](https://github.com/involvex/newworld-dailycraft-calc/security) of the repository
   - Click "Report a vulnerability"
   - Provide detailed information about the issue

2. **Email** (For sensitive issues)
   - Contact: [Create a GitHub issue](https://github.com/involvex/newworld-dailycraft-calc/issues) with the label "security"
   - For highly sensitive issues, mention in the issue that you need private communication

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: What could an attacker accomplish with this vulnerability
- **Environment**: Operating system, application version, and browser (if applicable)
- **Screenshots/Videos**: If applicable, include visual evidence
- **Suggested fix**: If you have ideas for how to fix the issue

### Response Timeline

- **Initial response**: Within 48 hours of report
- **Preliminary assessment**: Within 1 week
- **Regular updates**: Every 1-2 weeks until resolution
- **Fix timeline**: Critical issues within 30 days, others within 90 days

### What to Expect

- **Acknowledged vulnerabilities**: We will work with you to understand and reproduce the issue
- **Declined reports**: If we determine an issue is not a security vulnerability, we'll explain why
- **Credit**: Valid vulnerability reports will be credited in release notes (unless you prefer to remain anonymous)
- **Responsible disclosure**: We ask that you don't publicly disclose the vulnerability until we've had a chance to fix it

## Security Best Practices for Users

### Desktop Application

- **Download only from official sources**: GitHub releases or official website
- **Verify signatures**: Check file integrity when possible
- **Keep updated**: Install security updates promptly
- **Review permissions**: Understand what permissions the app requests

### General Security

- **Scan downloaded files**: Use antivirus software to scan downloaded executables
- **Use official releases**: Avoid unofficial builds or modified versions
- **Report suspicious behavior**: Contact us if the app behaves unexpectedly
- **Regular updates**: Keep your operating system and browsers updated

## Security Features

### Application Security

- **Sandboxed execution**: Electron app runs in a secure context
- **No remote code execution**: Application doesn't execute code from remote sources
- **Input validation**: All user inputs are validated and sanitized
- **Secure storage**: Configuration files use safe file system operations

### Privacy Protection

- **Local-only processing**: No data leaves your device during normal operation
- **No tracking**: Application doesn't track user behavior or collect analytics
- **Optional features**: All data-sharing features (like OCR) are opt-in
- **Clear permissions**: App clearly explains what permissions it needs and why

## Third-Party Dependencies

We regularly audit our dependencies for security vulnerabilities:

- **Automated scanning**: Dependabot and security advisories
- **Regular updates**: Dependencies are updated promptly when security issues are discovered
- **Minimal dependencies**: We keep the dependency tree as small as possible
- **Trusted sources**: Only use well-maintained, popular libraries

## Compliance and Standards

- **No PCI/HIPAA requirements**: Application doesn't handle payment or health data
- **GDPR compliance**: No personal data collection means minimal GDPR obligations
- **Open source transparency**: All code is publicly auditable
- **Security by design**: Security considerations are built into the development process

## Contact Information

- **GitHub Issues**: [Report a bug or security concern](https://github.com/involvex/newworld-dailycraft-calc/issues)
- **Security Advisories**: [Private security reports](https://github.com/involvex/newworld-dailycraft-calc/security)
- **Project Maintainer**: [@involvex](https://github.com/involvex)

## Acknowledgments

We appreciate the security research community and welcome responsible disclosure of security vulnerabilities. Valid security reports help make the application safer for everyone.

---

*This security policy is effective as of July 12, 2025, and applies to all supported versions of New World Crafting Calculator.*

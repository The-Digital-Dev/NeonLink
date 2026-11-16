# Security policy

## Supported versions

Security fixes go into the latest release. Please run the newest image tag.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem. Use GitHub's private vulnerability
reporting instead: on the repository, open **Security → Report a vulnerability**. Include the
version or image digest, your configuration (without secrets), the steps to reproduce and the
impact you expect.

You can expect an acknowledgement within a week. Once a fix is ready we publish a release and a
security advisory, and credit you if you wish.

## Scope

NeonLink renders operator-supplied configuration for anonymous visitors. In scope: escaping and
URL filtering of configured values, the Content-Security-Policy, path handling for static and media
files, and the container image. Out of scope: vulnerabilities that need control of the operator's
environment variables or media folder, and third-party analytics scripts you choose to enable.

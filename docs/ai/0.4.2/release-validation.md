# Published 0.4.2 validation

API SHA-256 and npm tarball integrity are checked during package preparation.
The standalone MCP package smoke checks all three versions, retrieves Select
and DatePicker with the official SDK and exercises the delivered Vue form.
Run check:mcp-package and the versioned AI-docs commands for current results.

Coverage remains sample for all six adapters. Validation results are recorded
with their actual input hashes; historical 0.4.1 evidence is not copied as
0.4.2 evidence. Desktop integrations, Linux and minimum-Node checks must be
reported separately from the local SDK and browser smoke.

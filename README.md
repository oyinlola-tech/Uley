# Student Accommodation Platform API

Fastify backend scaffold following the Ansofra layered architecture and CQRS service organization.

## Initial setup

1. Install Node.js dependencies after the package manifest is added.
2. Copy `.env.example` to `.env` and configure PostgreSQL.
3. Start the API using the configured development command.

The current implementation includes app startup, PostgreSQL connectivity, a health route, shared domain constants/errors, and initial auth/property/complaint command and query contracts. Business workflows and persistence migrations are not implemented yet.

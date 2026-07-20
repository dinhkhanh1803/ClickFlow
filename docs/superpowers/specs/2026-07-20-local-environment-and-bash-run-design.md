# Local Environment and Bash Run Design

## Goal

Make the existing ClickFlow web and API applications straightforward to run on Windows from a Bash terminal using the already-installed local PostgreSQL service, without committing secrets or requiring Docker.

## Options considered

1. **Local PostgreSQL (recommended):** use the running PostgreSQL 18 service and configure a Git-ignored root `.env`. This has no extra installation cost and matches the API's Prisma/PostgreSQL runtime.
2. **Docker Compose PostgreSQL:** add Docker and run an isolated database container. This is reproducible but requires installing Docker Desktop and does not use the existing service.
3. **In-memory API mode:** run without a database. This cannot support the integrated persisted workflows and is unsuitable as the default development path.

## Chosen design

- Keep `.env.example` as the committed, complete reference file.
- Create a root `.env`, already excluded by `.gitignore`, containing development-safe defaults. `DATABASE_URL` keeps the PostgreSQL password as a placeholder, so no credential is stored in source control.
- Use local PostgreSQL database `clickflow` at `localhost:5432`. The database setup command prompts for the PostgreSQL password rather than putting it in shell history or documentation.
- Update the root, web, and API run instructions so they describe the present integrated architecture, not the obsolete mock-only Phase 1 state.
- Document Bash commands for installing dependencies, exporting the PostgreSQL binary directory into `PATH` for the current shell, creating the database if needed, generating Prisma Client, running migrations, then starting API and web in separate terminals.

## Boundaries and validation

- Do not add Docker or change production application behavior.
- Do not commit database, Google, SMTP, Cloudinary, or JWT secrets.
- Verify documentation examples are syntactically valid Bash and confirm `.env` remains ignored.
- Run the focused configuration/environment tests and relevant type/lint checks after the documentation and configuration changes.

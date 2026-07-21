# ClickFlow

ClickFlow is a product-management workspace for freelancers and small teams. It includes a Next.js web app, NestJS API, and PostgreSQL persistence.

## Run locally with Git Bash

PostgreSQL 18 is already installed on this machine. Copy the environment templates, then replace `<POSTGRES_PASSWORD>` in `apps/api/.env` with the password of the local `postgres` user. Do not commit either local environment file.

```bash
cp .env.example apps/api/.env
printf 'NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1\n' > apps/web/.env.local
export PATH="/c/Program Files/PostgreSQL/18/bin:$PATH"
psql -U postgres -h localhost -p 5432 -d postgres -c 'CREATE DATABASE clickflow;'
pnpm install
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

If the database already exists, skip the `CREATE DATABASE` command.

Start the API in one Git Bash terminal:

```bash
pnpm dev:api
```

Start the web app in another Git Bash terminal:

```bash
pnpm dev
```

Open the web app at `http://localhost:3000/dashboard`. The API health endpoint is `http://localhost:3001/api/v1/health/live`, and Swagger is available at `http://localhost:3001/api/docs`.

Google login, SMTP delivery, and Cloudinary uploads are optional. Configure their values in `apps/api/.env` or `apps/web/.env.local` only when needed; never expose a client secret, mail password, or Cloudinary secret through a `NEXT_PUBLIC_*` variable.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter web exec playwright test
```
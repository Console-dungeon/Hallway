# Uruchomienie lokalne

Jak postawić Hallway na własnym komputerze. Zasady pracy i wzorce: [`AGENTS.md`](../AGENTS.md) i pozostałe przewodniki w [`docs/`](.); wdrożenia: [`deploy/README.md`](../deploy/README.md).

## Wymagania

- Node.js 24 (wersja z `.nvmrc`), pnpm przez corepack (`corepack enable`)
- Docker z Docker Compose
- Windows: WSL2, repozytorium w systemie plików Linuksa (nie w `/mnt/c/...`)

## Uruchomienie

```bash
pnpm install
cp .env.example .env
docker compose up -d --wait   # Postgres, Mailpit, Azurite
pnpm db:migrate
pnpm dev                      # web, api, docs
```

To samo przez [just](https://just.systems): `just setup`, potem `just dev`. `just` bez argumentów wypisuje wszystkie komendy.

| Usługa       | Adres                          |
| ------------ | ------------------------------ |
| Web          | http://localhost:3000          |
| API (docs)   | http://localhost:3000/api/docs |
| Dokumentacja | http://localhost:3002          |
| Mailpit      | http://localhost:8025          |

Postgres słucha na `127.0.0.1:5432`. Dane zostają w wolumenach Dockera; `docker compose down -v` (albo `just db-reset`) usuwa je.

## Komendy

| Komenda                                     | Co robi                                     |
| ------------------------------------------- | ------------------------------------------- |
| `pnpm lint`, `pnpm typecheck`, `pnpm build` | sprawdzenia uruchamiane też w CI            |
| `pnpm format`                               | Prettier                                    |
| `pnpm test:e2e`                             | testy end-to-end (Playwright)               |
| `pnpm db:generate`, `pnpm db:migrate`       | nowa migracja po zmianie schematu, migracje |
| `pnpm db:studio`                            | przeglądarka bazy                           |

## Struktura

| Katalog           | Zawartość                                         |
| ----------------- | ------------------------------------------------- |
| `apps/web`        | interfejs (Next.js)                               |
| `apps/api`        | API (Fastify, oRPC)                               |
| `apps/docs`       | dokumentacja projektu (Nextra)                    |
| `apps/e2e`        | testy end-to-end                                  |
| `packages/shared` | kontrakt API i wspólne schematy                   |
| `packages/db`     | schemat bazy i migracje                           |
| `packages/config` | wspólna konfiguracja TypeScript, ESLint, Prettier |
| `deploy`          | wdrożenie na serwer                               |
| `docs`            | przewodniki dla programistów i asystentów AI      |

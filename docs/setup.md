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

To samo przez [just](https://just.systems) (`justfile` w katalogu głównym): `just setup`, potem `just dev`. Pozostałe skróty: `just up`, `just migrate`, `just generate <nazwa>`, `just check`, `just test`, `just db-reset`; `just` bez argumentów wypisuje wszystkie. Receptury tylko wołają skrypty `pnpm` z tabeli poniżej.

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

Lokalnie w Dockerze (`docker-compose.yml`) działają tylko usługi: PostgreSQL, Azurite (emulator Azure Blob Storage) i Mailpit (przechwytuje e-maile). Aplikacje działają natywnie przez `pnpm dev`. Pakiety `shared` i `db` kompilują się do `dist/` – Turbo buduje je przed aplikacjami (`dependsOn: ["^build"]`).

## Kontrola jakości

- **Przy commicie** (Husky): lint-staged uruchamia ESLint i Prettier na zmienionych plikach, commitlint sprawdza wiadomość (Conventional Commits). Nie omijaj hooków (`--no-verify`) bez powodu.
- **CI** (`.github/workflows/ci.yml`) na każdym PR do `dev` i `main`: `format:check`, `lint`, `typecheck`, `build` oraz testy e2e.
- TypeScript w trybie `strict` z `noUncheckedIndexedAccess`.

## Wersje i obejścia

- **Node 24 (LTS)** z `.nvmrc`, pnpm przez corepack (wersja w `devEngines.packageManager`; npm jest zablokowany).
- **TypeScript ~6.0** – `typescript-eslint` nie obsługuje jeszcze TS 7.
- **ESLint 9** – pluginy z `eslint-config-next` nie deklarują jeszcze ESLint 10. lint-staged używa flagi `v10_config_lookup_from_file`; po przejściu na ESLint 10 flagę usuwamy.
- **Zod 4.3 tylko dla Nextry** (`overrides` w `pnpm-workspace.yaml`) – obejście błędu [nextra#4989](https://github.com/shuding/nextra/issues/4989); usunąć po poprawce.
- **Postgres 18** – wolumen montowany w `/var/lib/postgresql` (nowa ścieżka od v18).

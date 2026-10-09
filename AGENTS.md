# AGENTS.md – Hallway

Zasady pracy w tym repozytorium – dla zespołu i dla asystentów AI. Krótko: architektura, podejście i dobre praktyki. Plik rozwijamy razem z projektem.

**Hallway** to system do zarządzania wspólnotą mieszkaniową i zgłoszeniami mieszkańców.

## Architektura

Monorepo: **pnpm workspaces + Turborepo**.

| Workspace         | Co to jest                                                 | Port lokalnie |
| ----------------- | ---------------------------------------------------------- | ------------- |
| `apps/web`        | Next.js (App Router), shadcn/ui, Tailwind – interfejs      | 3000          |
| `apps/api`        | Fastify + oRPC – API pod `/api` (REST + RPC), OpenAPI      | 3001          |
| `apps/docs`       | Nextra – dokumentacja projektu, eksport statyczny          | 3002          |
| `packages/shared` | kontrakt oRPC, schematy Zod, enumy – wspólne dla api i web | –             |
| `packages/db`     | Drizzle: schemat bazy, klient, migracje SQL                | –             |
| `packages/config` | wspólne tsconfig, ESLint, Prettier                         | –             |

- **Zależności tylko w jedną stronę:** aplikacje → pakiety. `web` nie importuje `db` – z bazą rozmawia wyłącznie API.
- **Jeden origin:** web na `<domena>`, API na `<domena>/api` (bez CORS), docs na `docs.<domena>`. QA: `dev.<domena>` i `docs-dev.<domena>`.
- **Usługi lokalne w Dockerze** (`docker-compose.yml`): PostgreSQL, Azurite (emulator Azure Blob Storage), Mailpit (przechwytuje e-maile). Aplikacje działają natywnie przez `pnpm dev`.
- **Pakiety `shared` i `db` są kompilowane do `dist/`** – Turbo buduje je przed aplikacjami (`dependsOn: ["^build"]`).

## Uruchomienie

```bash
pnpm install
cp .env.example .env
docker compose up -d        # raz; potem kontenery wstają same po restarcie Dockera
pnpm db:migrate
pnpm dev                    # web, api, docs
```

Przydatne: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format`, `pnpm db:generate`, `pnpm db:studio`.

## Przepływ pracy (Git)

```
HAL-xx-opis ──PR──▶ dev ──merge──▶ deploy na QA
                    dev ──PR (po testach na QA)──▶ main ──merge──▶ deploy na produkcję
```

- **Branch** zaczyna się od klucza Jiry wielkimi literami: `HAL-12-ticket-list`. Odgałęziamy od `dev`, wracamy do `dev` przez PR.
- **Commity:** Conventional Commits **bez** klucza Jiry (`feat: add ticket list`) – powiązanie z Jirą daje nazwa brancha. Pilnuje tego commitlint.
- **`dev` i `main` są chronione:** tylko PR z review i zielonym CI. Do `main` trafia wyłącznie PR z `dev`.
- **Produkcja dostaje ten sam obraz Dockera, który był testowany na QA** – nie budujemy go drugi raz.

## Wdrożenie

- Obrazy `web`, `api`, `docs` budują się w GitHub Actions (`.github/workflows/deploy.yml`) i trafiają do GHCR z tagiem `sha-<commit>`. Na serwerze nic nie budujemy.
- Merge do `dev` → QA (`dev.<domena>`); merge `dev` → `main` → po zatwierdzeniu produkcja (`<domena>`) z **tymi samymi obrazami**.
- Migracje bazy uruchamiają się automatycznie przed startem nowej wersji API (`node dist/migrate.js`).
- Szczegóły, konfiguracja serwera i rollback: `deploy/README.md`.

## Jakość

- **Przy commicie** (Husky): lint-staged uruchamia ESLint i Prettier na zmienionych plikach, commitlint sprawdza wiadomość. Nie omijaj hooków (`--no-verify`) bez powodu.
- **CI** (`.github/workflows/ci.yml`) na każdym PR do `dev` i `main`: `format:check`, `lint`, `typecheck`, `build`.
- TypeScript w trybie `strict` (z `noUncheckedIndexedAccess`) – nie używamy `any`, nie wyciszamy błędów bez komentarza.

## Dobre praktyki

**Kod**

- Kod, nazwy i komentarze po angielsku; dokumentacja i README po polsku.
- Dane z zewnątrz (body, query, params, zmienne środowiskowe) walidujemy Zodem na granicy aplikacji.
- Typ lub schemat używany przez api i web trafia do `@hallway/shared` – nie kopiujemy go.

**API**

- **oRPC, contract-first.** Procedura najpierw trafia do kontraktu w `packages/shared/src/orpc.ts` (ścieżka HTTP z `.route()`, schematy Zod `.input()`/`.output()`, typowane błędy `.errors()`), potem implementujemy ją w `apps/api/src/procedures/` i dopinamy w `router.ts`.
- Z kontraktu powstają: REST pod `/api/*`, dokumentacja `/api/docs` (specyfikacja `/api/openapi.json`) i typowany klient weba (`apps/web/src/lib/orpc.ts`, protokół RPC pod `/api/rpc/*`). Web nie woła API przez ręczny `fetch`.
- Odpowiedź poprawna ma status 2xx/3xx – sytuacje błędne opisujemy jako typowane błędy w `.errors()`.
- Trasy spoza oRPC (np. Better Auth pod `/api/auth/*`) rejestrujemy jako zwykłe trasy Fastify.
- Trasy rejestrujemy pod prefiksem `/api`.

**Baza danych**

- Zmiana schematu: edytujesz `packages/db/src/schema.ts` → `pnpm db:generate` → commitujesz wygenerowany plik SQL z `packages/db/migrations`.
- **Nigdy `drizzle-kit push`** i nigdy ręczna edycja zastosowanych już migracji.

**Konfiguracja i sekrety**

- Nowa zmienna środowiskowa: dodaj ją do schematu w `apps/api/src/env.ts` (jeśli używa jej API) **i** do `.env.example` z bezpieczną wartością dev.
- Żadnych sekretów w repo. Prawdziwe wartości: lokalny `.env` (w `.gitignore`) i GitHub Secrets.

**Zależności**

- Tylko `pnpm` (npm jest zablokowany przez `devEngines`). Zależność instalujemy w pakiecie, który jej używa (`pnpm --filter <pakiet> add ...`).
- Nowa biblioteka spoza ustalonego stacku – najpierw uzgodnij z zespołem.
- Wersje narzędzi szybko się zmieniają: zanim użyjesz API biblioteki lub flagi CLI, sprawdź dokumentację **zainstalowanej** wersji.

## Ważne decyzje i obejścia

- **Node 24 (LTS)** z `.nvmrc`, pnpm przez corepack (wersja w `devEngines.packageManager`).
- **TypeScript ~6.0** – `typescript-eslint` nie obsługuje jeszcze TS 7.
- **ESLint 9** – pluginy z `eslint-config-next` nie deklarują jeszcze ESLint 10. lint-staged używa flagi `v10_config_lookup_from_file`; po przejściu na ESLint 10 flagę usuwamy.
- **Zod 4.3 tylko dla Nextry** (`overrides` w `pnpm-workspace.yaml`) – obejście błędu [nextra#4989](https://github.com/shuding/nextra/issues/4989); usunąć po poprawce.
- **Postgres 18** – wolumen montowany w `/var/lib/postgresql` (nowa ścieżka od v18).

## Dla asystentów AI

- Pracuj małymi krokami; przed operacjami nieodwracalnymi (usuwanie, przepisywanie historii, force push) pytaj.
- Nie zmieniaj stacku ani powyższych decyzji bez zgody zespołu.
- Po zmianie uruchom `pnpm lint && pnpm typecheck && pnpm build`.
- `apps/web/AGENTS.md` zawiera dodatkowe wskazówki dla Next.js.

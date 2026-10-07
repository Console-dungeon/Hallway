# AGENTS.md – Hallway

Zasady pracy w tym repozytorium – dla zespołu i dla asystentów AI. Krótko: architektura, podejście i dobre praktyki. Plik rozwijamy razem z projektem.

**Hallway** to system do zarządzania wspólnotą mieszkaniową i zgłoszeniami mieszkańców.

## Architektura

Monorepo: **pnpm workspaces + Turborepo**.

| Workspace         | Co to jest                                                 | Port lokalnie |
| ----------------- | ---------------------------------------------------------- | ------------- |
| `apps/web`        | Next.js (App Router), shadcn/ui, Tailwind – interfejs      | 3000          |
| `apps/api`        | Fastify + Zod – REST API pod `/api`, dokumentacja OpenAPI  | 3001          |
| `apps/docs`       | Nextra – dokumentacja projektu, eksport statyczny          | 3002          |
| `packages/shared` | kontrakty: schematy Zod, enumy, typy wspólne dla api i web | –             |
| `packages/db`     | Drizzle: schemat bazy, klient, migracje SQL                | –             |
| `packages/config` | wspólne tsconfig, ESLint, Prettier                         | –             |

- **Zależności tylko w jedną stronę:** aplikacje → pakiety. `web` nie importuje `db` – z bazą rozmawia wyłącznie API.
- **Jeden origin:** web na `app.<domena>`, API na `app.<domena>/api` (bez CORS), docs na `docs.<domena>`.
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

- Każda trasa ma schemat Zod dla wejścia i odpowiedzi – z niego powstaje walidacja i dokumentacja OpenAPI (`/api/docs`).
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

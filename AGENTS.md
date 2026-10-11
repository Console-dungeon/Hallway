# AGENTS.md – Hallway

Zasady pracy w tym repozytorium – dla zespołu i dla asystentów AI. Krótko: architektura, podejście i dobre praktyki. Plik rozwijamy razem z projektem.

> [!IMPORTANT]
> **Zanim zaczniesz jakąkolwiek pracę – dwa kroki obowiązkowe:**
>
> 1. **Przeczytaj przewodnik z `docs/`** dla obszaru, w którym będziesz pracować (`docs/web.md`, `docs/api.md`, `docs/database.md`, `docs/shared.md`, `docs/e2e.md`, `docs/infrastructure.md`, `docs/permissions.md`). Ten plik to tylko skrót; wzorce, których trzeba się trzymać, są opisane tam.
> 2. **Sprawdź, czy w katalogu głównym istnieje `AGENTS.local.md`. Jeśli tak, przeczytaj go i zastosuj.** To lokalne ustalenia dewelopera na tej maszynie (plik jest w `.gitignore`, nie ma go w repo). Gdy są sprzeczne z tym plikiem, pierwszeństwo ma `AGENTS.local.md`.

**Hallway** to system do zarządzania wspólnotą mieszkaniową i zgłoszeniami mieszkańców.

## Linki

- **Repozytorium:** https://github.com/Console-dungeon/Hallway
- **Jira (projekt `HAL`):** https://hallway.atlassian.net/browse/HAL
- **Figma – makiety:** https://www.figma.com/design/3I3oNLmzV2Ih1Zx03RqdDL/ – strona „Aktualne – zaimplementowane” odwzorowuje ekrany z aplikacji, „Makiety v1 (faza 0)” to pierwotny projekt.
- **Środowiska:** produkcja https://hallway.pl, QA https://dev.hallway.pl, dokumentacja https://docs.hallway.pl

## Architektura

Monorepo: **pnpm workspaces + Turborepo**.

| Workspace         | Co to jest                                                  | Port lokalnie |
| ----------------- | ----------------------------------------------------------- | ------------- |
| `apps/web`        | Next.js (App Router), shadcn/ui, Tailwind – interfejs       | 3000          |
| `apps/api`        | Fastify + oRPC – API pod `/api` (REST + RPC), OpenAPI       | 3001          |
| `apps/docs`       | Nextra – dokumentacja projektu, eksport statyczny           | 3002          |
| `apps/e2e`        | Playwright – testy end-to-end, wzorzec dla kolejnych testów | –             |
| `packages/shared` | kontrakt oRPC, schematy Zod, enumy – wspólne dla api i web  | –             |
| `packages/db`     | Drizzle: schemat bazy, klient, migracje SQL                 | –             |
| `packages/config` | wspólne tsconfig, ESLint, Prettier                          | –             |

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

Skróty przez [just](https://just.systems) (`justfile` w katalogu głównym, `just` wypisuje listę): `just setup`, `just dev`, `just up`, `just migrate`, `just generate <nazwa>`, `just check`, `just test`, `just db-reset`. Receptury tylko wołają poniższe skrypty.

Przydatne: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format`, `pnpm test:e2e`, `pnpm db:generate`, `pnpm db:studio`.

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
- **Testy e2e** (`apps/e2e`, Playwright) chodzą w CI na każdym PR. Nowe testy piszemy według wzorca: obiekt strony w `pages/`, fixture w `fixtures/index.ts`, plik w `tests/<funkcja>/`, dane tworzone przez test (konta `e2e-…@example.com`). Wzorzec i instrukcja: `docs/e2e.md`.
- TypeScript w trybie `strict` (z `noUncheckedIndexedAccess`) – nie używamy `any`, nie wyciszamy błędów bez komentarza.

## Dobre praktyki

**Kod**

- Kod, nazwy i komentarze po angielsku; dokumentacja i README po polsku.
- Dane z zewnątrz (body, query, params, zmienne środowiskowe) walidujemy Zodem na granicy aplikacji.
- Typ lub schemat używany przez api i web trafia do `@hallway/shared` – nie kopiujemy go.

**API i web**

- **Contract-first (oRPC):** kontrakt w `packages/shared`, implementacja w `apps/api/src/modules/<moduł>/`, typowany klient w webie. Web nie woła API ręcznym `fetch`.
- **Warstwy w API:** procedura (kontroler) → serwis (reguły, transakcje) → zapytania (Drizzle). Uprawnienia sprawdzamy w API.
- **Strona w webie:** `page.tsx` (serwer: dane) + `Client.tsx` (komponent `Client`: widok) + `useController.ts` (hook `useController`: logika).
- **Najpierw Figma, potem kod** dla każdej zmiany interfejsu.
- Szczegóły i przykłady: patrz „Przewodniki szczegółowe” poniżej.

**Baza danych**

- Zmiana schematu: `packages/db/src/schema.ts` → `pnpm db:generate` → commit wygenerowanego SQL z `packages/db/migrations`.
- Klucze główne z prefiksem tabeli (`user_3f2a…`); tabela zaczyna się od `...baseColumns.id("<nazwa>")` i kończy na `...baseColumns.timestamps`.
- **Nigdy `drizzle-kit push`** i nigdy ręczna edycja zastosowanych już migracji.

**Konfiguracja i sekrety**

- Nowa zmienna środowiskowa: dodaj ją do schematu w `apps/api/src/config/env.ts` (jeśli używa jej API) **i** do `.env.example` z bezpieczną wartością dev.
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

## Przewodniki szczegółowe (`docs/`)

Ten plik zawiera to, co potrzebne w każdej sesji. Szczegóły są w folderze `docs/` w katalogu głównym – zanim zmienisz coś w danym obszarze, przeczytaj jego przewodnik:

| Obszar                      | Plik                     | Co opisuje                                                                             |
| --------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| Interfejs (Next.js)         | `docs/web.md`            | wzorzec strony (`page` / `Client` / `useController`), dane, formularze, sesja, wygląd  |
| API                         | `docs/api.md`            | układ `src/`, nowy endpoint krok po kroku, warstwy, auth, maile, env                   |
| Baza danych                 | `docs/database.md`       | konwencje schematu, klucze z prefiksem, migracje                                       |
| Kontrakt i wspólne schematy | `docs/shared.md`         | układ modułów, kontrakt oRPC, schematy Zod, enumy                                      |
| Testy e2e                   | `docs/e2e.md`            | obiekty stron, fixtures, wspólna sesja, dane testowe                                   |
| Infrastruktura i wdrożenia  | `docs/infrastructure.md` | środowiska, sieć Dockera, zmienne na serwerze, pułapki                                 |
| Uprawnienia                 | `docs/permissions.md`    | role, macierz uprawnień, przejścia statusów zgłoszeń – źródło prawdy dla polityk w API |

`docs/` to przewodniki dla asystentów AI i zespołu, pisane zwięźle. Dokumentacja projektu dla ludzi (strona WWW) to osobna rzecz: `apps/docs` (Nextra) – pisana językiem nietechnicznym, bez kodu. **Obie rozwijamy równolegle:** zmiana tego, co widzi lub może użytkownik (nowa funkcja, zasada, uprawnienie), trafia w tym samym tickecie do `docs/` i do odpowiedniej strony w Nextrze. Źródłem prawdy dla reguł jest `docs/`; Nextra je opisuje. `apps/web/AGENTS.md` zawiera tylko blok generowany przez Next.js.

## Dla asystentów AI

- Pracuj małymi krokami; przed operacjami nieodwracalnymi (usuwanie, przepisywanie historii, force push) pytaj.
- Nie zmieniaj stacku ani powyższych decyzji bez zgody zespołu.
- Po zmianie uruchom `pnpm lint && pnpm typecheck && pnpm build`.
- Na początku sesji: przewodnik z `docs/` dla danego obszaru i `AGENTS.local.md`, jeśli istnieje (patrz ramka na górze). Gdy ustalamy nową zasadę, dopisz ją do właściwego przewodnika, a tutaj tylko wtedy, gdy dotyczy każdej sesji.

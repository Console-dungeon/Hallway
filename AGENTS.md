# AGENTS.md – Hallway

**Hallway** to system do zarządzania wspólnotą mieszkaniową i zgłoszeniami mieszkańców. Ten plik zawiera tylko to, co potrzebne w każdej sesji – szczegóły są w przewodnikach `docs/`.

> [!IMPORTANT]
> **Zanim zaczniesz pracę:**
>
> 1. Przeczytaj przewodnik z `docs/` dla obszaru, w którym pracujesz (tabela niżej). Wzorce, których trzeba się trzymać, są opisane tam.
> 2. Jeśli w katalogu głównym jest `AGENTS.local.md` (lokalne ustalenia, poza repo), przeczytaj go i zastosuj. Ma pierwszeństwo przed tym plikiem.

## Linki

- **Repozytorium:** https://github.com/Console-dungeon/Hallway
- **Jira (projekt `HAL`):** https://hallway.atlassian.net/browse/HAL
- **Figma:** https://www.figma.com/design/jxEk1VeK3aiFcbBfiUNSdD/ – „Aktualne – zaimplementowane” odwzorowuje aplikację, „Makiety v1 (faza 0)” to pierwotny projekt.
- **Środowiska:** produkcja https://hallway.pl, QA https://dev.hallway.pl, dokumentacja https://docs.hallway.pl

## Architektura

Monorepo **pnpm workspaces + Turborepo**: `apps/web` (Next.js, :3000), `apps/api` (Fastify + oRPC pod `/api`, :3001), `apps/docs` (Nextra, :3002), `apps/e2e` (Playwright), `packages/shared` (kontrakt oRPC, Zod, enumy), `packages/db` (Drizzle, migracje), `packages/config`.

- **Zależności tylko w jedną stronę:** aplikacje → pakiety. `web` nie importuje `db` – z bazą rozmawia wyłącznie API.
- **Jeden origin:** web na `<domena>`, API na `<domena>/api` (bez CORS), docs na `docs.<domena>`.

## Przewodniki (`docs/`)

| Obszar                      | Plik                     | Co opisuje                                                                       |
| --------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Uruchomienie i narzędzia    | `docs/setup.md`          | wymagania, komendy, `just`, adresy usług, hooki i CI, wersje i obejścia          |
| Interfejs (Next.js)         | `docs/web.md`            | wzorzec strony (`page` / `Client` / `useController`), dane, formularze, wygląd   |
| API                         | `docs/api.md`            | układ `src/`, nowy endpoint krok po kroku, warstwy, auth, maile, env             |
| Baza danych                 | `docs/database.md`       | konwencje schematu, klucze z prefiksem, migracje                                 |
| Kontrakt i wspólne schematy | `docs/shared.md`         | układ modułów, kontrakt oRPC, schematy Zod, enumy                                |
| Testy e2e                   | `docs/e2e.md`            | obiekty stron, fixtures, wspólna sesja, dane testowe                             |
| Uprawnienia                 | `docs/permissions.md`    | role, macierz uprawnień, przejścia statusów – źródło prawdy dla polityk w API    |
| Infrastruktura i wdrożenia  | `docs/infrastructure.md` | środowiska, deploy, zmienne na serwerze, pułapki (szczegóły: `deploy/README.md`) |

## Git

- **Branch** od `dev`, z kluczem Jiry wielkimi literami: `HAL-12-ticket-list`. Wraca do `dev` przez PR; do `main` trafia wyłącznie PR z `dev`. `dev` i `main` są chronione (review + zielone CI).
- **Commity:** Conventional Commits **bez** klucza Jiry (`feat: add ticket list`) – pilnuje tego commitlint. Nie omijaj hooków.
- Merge do `dev` wdraża QA, merge do `main` – produkcję (te same obrazy).

## Zasady

- Kod, nazwy i komentarze po angielsku; dokumentacja po polsku.
- TypeScript `strict` – bez `any`, bez wyciszania błędów bez komentarza.
- Dane z zewnątrz (body, query, params, env) walidujemy Zodem na granicy aplikacji. Typ lub schemat wspólny dla api i web trafia do `@hallway/shared`.
- **Contract-first (oRPC):** kontrakt w `packages/shared`, implementacja w `apps/api/src/modules/<moduł>/` (procedura → serwis → zapytania), typowany klient w webie – bez ręcznego `fetch`. Uprawnienia sprawdzamy w API.
- **Najpierw Figma, potem kod** dla każdej zmiany interfejsu.
- **Baza:** zmiana w `packages/db/src/schema.ts` → `pnpm db:generate` → commit wygenerowanego SQL. Nigdy `drizzle-kit push` ani edycji zastosowanych migracji.
- **Env:** nowa zmienna do `apps/api/src/config/env.ts` (jeśli używa jej API) i do `.env.example`. Żadnych sekretów w repo.
- **Zależności:** tylko `pnpm`, instalowane w pakiecie, który ich używa. Nowa biblioteka spoza stacku – najpierw uzgodnij z zespołem. Przed użyciem API biblioteki sprawdź dokumentację **zainstalowanej** wersji.
- **Testy:** tylko e2e (Playwright) według `docs/e2e.md`.

## Dokumentacja

Zmiana tego, co użytkownik widzi lub może (funkcja, zasada, uprawnienie), trafia w tym samym tickecie do `docs/` (zwięźle, źródło prawdy) **i** do Nextry (`apps/docs`, język nietechniczny, bez kodu). Każdą decyzję projektową dopisujemy od razu do `apps/docs/src/content/decyzje.mdx`: numer, data, decyzja, jednozdaniowe „dlaczego”. Nową zasadę dopisz do właściwego przewodnika, a tutaj tylko wtedy, gdy dotyczy każdej sesji.

## Dla asystentów AI

- Pracuj małymi krokami; przed operacjami nieodwracalnymi (usuwanie, przepisywanie historii, force push) pytaj.
- Nie zmieniaj stacku ani ustalonych decyzji bez zgody zespołu.
- Po zmianie uruchom `pnpm lint && pnpm typecheck && pnpm build`.

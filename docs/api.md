# API – jak budujemy endpointy (`apps/api`)

Fastify jako serwer HTTP, oRPC (contract-first) jako warstwa API, Better Auth do logowania, Drizzle do bazy. Wszystko pod prefiksem `/api`.

## Układ `apps/api/src/`

```
server.ts            # start serwera
migrate.ts           # migracje przed startem nowej wersji
app.ts               # buildApp(env): składa bazę, mailer, auth i trasy
config/env.ts        # walidacja zmiennych środowiskowych (Zod)
orpc/context.ts      # ApiContext + `os` (implement(orpc))
orpc/plugin.ts       # podpięcie /api/* (REST + OpenAPI) i /api/rpc/*
orpc/router.ts       # składa procedury modułów
auth/                # Better Auth: konfiguracja, trasa /api/auth/*, szablony maili
mail/                # Mailer (SMTP) i wspólny layout maili
orpc/middleware.ts   # requireAuth, requireCommunity
policies/            # reguły uprawnień (czyste funkcje)
modules/<moduł>/     # funkcje dla użytkownika
scripts/             # skrypty uruchamiane ręcznie (create-superadmin)
```

W katalogu głównym `src/` zostają tylko `server.ts`, `migrate.ts` i `app.ts` – odwołują się do nich Dockerfile i skrypt wdrożeniowy.

## Nowy endpoint krok po kroku

1. **Kontrakt** w `packages/shared/src/<moduł>/`: `oc.route({ method, path, tags, summary })`, `.input()`, `.output()`, `.errors()`; dopnij w `packages/shared/src/orpc.ts`. Zbuduj pakiet (`pnpm --filter @hallway/shared build`) albo miej włączone `pnpm dev`.
2. **Procedura** w `apps/api/src/modules/<moduł>/<moduł>.procedures.ts`: `os.<moduł>.<nazwa>.handler(...)`.
3. **Router**: dopnij w `apps/api/src/orpc/router.ts`.
4. Sprawdź `/api/docs` i wywołanie REST.

Ścieżka kontraktu nie może zaczynać się od `/auth/` – `/api/auth/*` należy do Better Auth.

## Warstwy w module

| Plik              | Rola                                                               | Nie wie o  |
| ----------------- | ------------------------------------------------------------------ | ---------- |
| `*.procedures.ts` | kontroler: sesja, uprawnienia, wywołanie serwisu, mapowanie błędów | SQL        |
| `*.service.ts`    | reguły biznesowe i transakcje; rzuca błędy domenowe                | HTTP, oRPC |
| `*.queries.ts`    | zapytania Drizzle; funkcje przyjmują `db` albo `tx`                | reguły     |

Serwis i zapytania tworzymy, gdy jest logika – prosta procedura (np. `health`) może zostać w jednym pliku. Wzorcem pełnego modułu jest `modules/structure/` (budynki, klatki, lokale): procedura woła serwis, serwis pilnuje reguł i woła zapytania przyjmujące `DbOrTx`.

## Zasady

- **Kontekst** (`ApiContext`): `db`, `env`, `log`, `auth`, `headers`; po `requireAuth` także `user` i `session`. Zależności bierzemy z kontekstu, nie z globalnych importów.
- **Błędy:** odpowiedź poprawna to 2xx/3xx. Sytuacje błędne to typowane błędy z kontraktu (`throw errors.NAZWA(...)`). Serwis rzuca błąd domenowy, procedura tłumaczy go na błąd kontraktu.
- **Uprawnienia** sprawdzamy w API, w kontekście konkretnej wspólnoty, zgodnie z macierzą w `docs/permissions.md` (jedna reguła = jeden wiersz) – patrz „Ochrona procedur i uprawnienia”.
- **Transakcje** dla operacji, które muszą udać się razem (`db.transaction`).
- **Trasy spoza oRPC** (Better Auth) to zwykłe trasy Fastify pod `/api`.
- Importy względne z rozszerzeniem `.js` (ESM, `nodenext`).

## Ochrona procedur i uprawnienia

Są dwa rodzaje chronionych procedur. Oba to jedna linijka `.use(...)`; w handlerze nie piszemy własnych `if`-ów o role.

| Procedura                                           | Kontrakt zaczyna się od | Middleware                  | Kontekst w handlerze        |
| --------------------------------------------------- | ----------------------- | --------------------------- | --------------------------- |
| wymaga tylko zalogowania (np. `GET /me`)            | `protectedContract`     | `requireAuth`               | `user`, `session`           |
| działa wewnątrz wspólnoty (`communityId` w adresie) | `communityContract`     | `requireCommunity("akcja")` | `user`, `session`, `access` |

```ts
export const get = os.communities.get
  .use(requireCommunity("structure.view"))
  .handler(({ context, input }) => …);
```

`requireCommunity` (w `orpc/middleware.ts`) sprawdza po kolei: sesję (401), czy wspólnota istnieje i nie jest usunięta (404), czy użytkownik może wykonać akcję (403).

**Jak dodać nowe uprawnienie:**

1. Wiersz w macierzy `docs/permissions.md`.
2. Nazwa akcji w `packages/shared/src/communities/actions.ts`.
3. Reguła w `apps/api/src/policies/community.ts` – bez niej kod się nie skompiluje.
4. `.use(requireCommunity("nowa.akcja"))` na procedurze.

- Reguły są czystymi funkcjami `can(access, akcja)`: nie sięgają do bazy ani do żądania. `access` (`CommunityAccess`) mówi, kim użytkownik jest w tej wspólnocie: rola, jego lokale, czy jest superadminem.
- `GET /communities/{id}` zwraca pole `actions` – listę akcji dozwolonych dla oglądającego. Web chowa według niej przyciski; API i tak sprawdza każde wywołanie.
- **ID z adresu zawsze sprawdzamy razem ze wspólnotą.** Zapytania `find…(db, communityId, id)` zwracają zasób tylko wtedy, gdy należy do tej wspólnoty; cudze ID daje 404.
- Błędy `communityContract`: `NOT_FOUND` (404), `CONFLICT` (409, zajęta nazwa lub numer), `UNIT_HAS_MEMBERS` (409, w lokalu są przypisane osoby).
- Serwis rzuca błąd domenowy (`StructureError("CONFLICT")`), procedura zamienia go na błąd kontraktu jedną funkcją (`answer` w `structure.procedures.ts`).
- Zajętą nazwę wykrywa baza (UNIQUE): serwis łapie ją przez `isUniqueViolation` z `@hallway/db`, bez wcześniejszego sprawdzania.
- Zablokowane konto nie ma sesji (Better Auth kończy jego sesje), więc dostaje 401 jak niezalogowany.
- Zachowanie chronionych endpointów sprawdzają testy e2e w `apps/e2e/tests/api/`. Testów jednostkowych reguł nie piszemy.

## Auth (Better Auth)

- Konfiguracja w `auth/auth.ts` (fabryka `createAuth`), trasa w `auth/plugin.ts`.
- E-mail + hasło z obowiązkową weryfikacją; GitHub włącza się, gdy są `GH_CLIENT_ID` i `GH_CLIENT_SECRET`.
- Nieudane przekierowania wracają na `<BETTER_AUTH_URL>/login?error=<kod>`.
- Limit prób: `AUTH_RATE_LIMIT_ENABLED` (domyślnie włączony, lokalnie i w e2e wyłączony).
- Identyfikatory generuje baza (`generateId: false`), patrz `docs/database.md`.

## Maile

- `mail/mailer.ts`: interfejs `Mailer` + adapter SMTP (lokalnie Mailpit, na serwerach Resend).
- Treść maila to osobny plik przy tym, kto go wysyła (`auth/email-templates/`, później `modules/<moduł>/email-templates/`), na wspólnym `mail/layout.ts`.
- Maile auth wysyłamy w tle, bez czekania na wynik.

## Zmienne środowiskowe

Nowa zmienna: schemat w `config/env.ts`, bezpieczna wartość w `.env.example`, wpis w `deploy/docker-compose.yml` i tabeli w `deploy/README.md`. Zmienna wymagana na serwerze musi tam być **przed** merge'em do `dev`.

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
orpc/middleware.ts   # requireAuth, requireCommunity, requireUnit
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

Moduły `invitations/` (link z zaproszenia: podgląd, rejestracja, przyjęcie; wysyłka zaproszeń) i `members/` (członkowie wspólnoty i osoby w lokalach) pokazują moduł z szablonem maila (`modules/invitations/email-templates/`) i procedury jednego modułu wołające serwis drugiego: zaproszenia wysyłają procedury z `members.procedures.ts`, ale robi to `invitations.service.ts`.

## Zasady

- **Kontekst** (`ApiContext`): `db`, `env`, `log`, `auth`, `mailer`, `headers`; po `requireAuth` także `user` i `session`. Zależności bierzemy z kontekstu, nie z globalnych importów.
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
| dotyczy jednego lokalu, reguła zależy od lokalu     | `communityContract`     | `requireUnit("akcja")`      | `user`, `session`, `access` |

```ts
export const get = os.communities.get
  .use(requireCommunity("structure.view"))
  .handler(({ context, input }) => …);
```

`requireCommunity` (w `orpc/middleware.ts`) sprawdza po kolei: sesję (401), czy wspólnota istnieje i nie jest usunięta (404), czy użytkownik może wykonać akcję (403). `requireUnit` (wejście z `communityId` i `unitId`) sprawdza to samo, a przed uprawnieniem jeszcze, czy lokal należy do tej wspólnoty (404).

Procedura bez `.use(...)` jest publiczna – tak działają `invitations.get` i `invitations.register`, gdzie jedynym poświadczeniem jest token z linku.

**Jak dodać nowe uprawnienie:**

1. Wiersz w macierzy `docs/permissions.md`.
2. Nazwa akcji w `packages/shared/src/communities/actions.ts`.
3. Reguła w `apps/api/src/policies/community.ts` – bez niej kod się nie skompiluje.
4. `.use(requireCommunity("nowa.akcja"))` na procedurze.

**Jak dodać akcję w lokalu** (gdy odpowiedź zależy od konkretnego lokalu, np. osoby lokalu widzą się nawzajem):

1. Wiersz w macierzy `docs/permissions.md` z dopiskiem, że to akcja w lokalu.
2. Nazwa w `unitActions` w `packages/shared/src/communities/actions.ts`.
3. Reguła w `unitRules` w `apps/api/src/policies/community.ts` (`(access, unitId) => …`); sprawdza ją `canInUnit`. Może korzystać z reguł wspólnoty (`can(access, "members.list") || access.unitIds.includes(unitId)`).
4. `.use(requireUnit("nowa.akcja"))` na procedurze.

- Reguły są czystymi funkcjami `can(access, akcja)`: nie sięgają do bazy ani do żądania. `access` (`CommunityAccess`) mówi, kim użytkownik jest w tej wspólnocie: rola, jego lokale, czy jest superadminem.
- `GET /communities/{id}` zwraca pole `actions` – listę akcji dozwolonych dla oglądającego. Web chowa według niej przyciski; API i tak sprawdza każde wywołanie.
- **ID z adresu zawsze sprawdzamy razem ze wspólnotą.** Zapytania `find…(db, communityId, id)` zwracają zasób tylko wtedy, gdy należy do tej wspólnoty; cudze ID daje 404.
- Błędy `communityContract`: `NOT_FOUND` (404), `CONFLICT` (409, zajęta nazwa lub numer), `UNIT_HAS_MEMBERS` (409, w lokalu są przypisane osoby).
- Błędy dopisane w kontraktach konkretnych procedur:

  | Kod                  | Status | Kiedy                                                                            |
  | -------------------- | ------ | -------------------------------------------------------------------------------- |
  | `MAIL_FAILED`        | 502    | nie udało się wysłać zaproszenia; zaproszenie nie zostaje zapisane               |
  | `LAST_ADMIN`         | 409    | usunięcie lub zmiana roli ostatniego administratora wspólnoty                    |
  | `INVITATION_INVALID` | 404    | nieznany, cofnięty albo zużyty token, usunięta wspólnota                         |
  | `INVITATION_EXPIRED` | 410    | minęło 7 dni od wysłania                                                         |
  | `EMAIL_MISMATCH`     | 403    | zalogowane konto ma inny adres niż zaproszenie                                   |
  | `ACCOUNT_EXISTS`     | 409    | rejestracja z zaproszenia, a konto z tym adresem już jest (trzeba się zalogować) |

- Serwis rzuca błąd domenowy (`StructureError("CONFLICT")`), procedura zamienia go na błąd kontraktu jedną funkcją (`answer` w `structure.procedures.ts`). W `invitations` i `members` `answer` dostaje mapę `errors` procedury (kod domenowy → błąd kontraktu): każda procedura obsługuje tylko błędy ze swojego kontraktu, a kod spoza mapy zostaje 500, bo oznacza błąd w kodzie. `answer` w `members.procedures.ts` zna kody obu serwisów (`MembersError`, `InvitationError`) i zapisuje w logu przyczynę (np. dlaczego mail nie wyszedł).
- **Ostatni administrator:** zmiana roli i usunięcie członka blokują w transakcji wiersze administratorów wspólnoty (`lockAdmins`), więc dwóch administratorów działających naraz nie zostawi wspólnoty bez żadnego.
- Zajętą nazwę wykrywa baza (UNIQUE): serwis łapie ją przez `isUniqueViolation` z `@hallway/db`, bez wcześniejszego sprawdzania.
- Zablokowane konto nie ma sesji (Better Auth kończy jego sesje), więc dostaje 401 jak niezalogowany.
- Zachowanie chronionych endpointów sprawdzają testy e2e w `apps/e2e/tests/api/`. Testów jednostkowych reguł nie piszemy.

## Auth (Better Auth)

- Konfiguracja w `auth/auth.ts` (fabryka `createAuth`), trasa w `auth/plugin.ts`.
- E-mail + hasło z obowiązkową weryfikacją; GitHub włącza się, gdy są `GH_CLIENT_ID` i `GH_CLIENT_SECRET`.
- **Wyjątek – rejestracja z zaproszenia** (`invitations.register`): serwer sprawdza token, bierze adres z zaproszenia (nigdy od klienta) i zakłada konto od razu potwierdzone przez `auth.api.createUser` z pluginu admin (`data: { emailVerified: true }`; wywołane bez sesji nie wymaga admina i nie wysyła maila). Potem przyjmuje zaproszenie; gdy to się nie uda, nowe konto jest usuwane. Rejestracji przez GitHub z zaproszenia nie ma.
- Nieudane przekierowania wracają na `<BETTER_AUTH_URL>/login?error=<kod>`.
- Limit prób: `AUTH_RATE_LIMIT_ENABLED` (domyślnie włączony, lokalnie i w e2e wyłączony).
- Identyfikatory generuje baza (`generateId: false`), patrz `docs/database.md`.

## Maile

- `mail/mailer.ts`: interfejs `Mailer` + adapter SMTP (lokalnie Mailpit, na serwerach Resend).
- Treść maila to osobny plik przy tym, kto go wysyła (`auth/email-templates/`, `modules/invitations/email-templates/`), na wspólnym `mail/layout.ts`.
- `actionEmail` (layout) przyjmuje zwykły tekst i w wersji HTML **escapuje wszystkie pola** – w treści bywa to, co wpisali użytkownicy (nazwa wspólnoty, imię). Opcjonalne `ignoreNote` zmienia ostatnią linijkę („Jeśli to nie Ty…”).
- Mailer jest w kontekście (`context.mailer`); serwis dostaje go w zależnościach, nie importuje.
- **Maile auth wysyłamy w tle**, bez czekania na wynik.
- **Mail z zaproszeniem wysyłamy z czekaniem, wewnątrz transakcji** zapisującej zaproszenie: błąd wysyłki wycofuje zapis i zwraca `MAIL_FAILED`. Zaproszenie bez maila byłoby bezużyteczne, bo tokenu nie da się odtworzyć (w bazie jest tylko skrót).

## Zmienne środowiskowe

Nowa zmienna: schemat w `config/env.ts`, bezpieczna wartość w `.env.example`, wpis w `deploy/docker-compose.yml` i tabeli w `deploy/README.md`. Zmienna wymagana na serwerze musi tam być **przed** merge'em do `dev`.

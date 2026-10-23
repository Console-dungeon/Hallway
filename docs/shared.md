# Kontrakt i wspólne schematy (`packages/shared`)

Jedyne miejsce na to, czego używają jednocześnie API i web: kontrakt oRPC, schematy Zod, enumy i typy. Niczego stąd nie kopiujemy do aplikacji.

## Układ `packages/shared/src/`

```
orpc.ts              # tylko składa kontrakty modułów w jeden obiekt `orpc`
index.ts             # eksportuje wszystko
<moduł>/             # te same nazwy co apps/api/src/modules/
  contract.ts        # procedury: oc.route(...).input(...).output(...).errors(...)
  schemas.ts         # schematy Zod wejścia i wyjścia + typy z z.infer
  roles.ts           # enumy jako tablice `as const` + schemat + typ
```

Mały moduł może być jednym plikiem (`system/health.ts`). Moduł `communities/` jest wzorcem pełnego modułu: `contract.ts`, `schemas.ts` (osobny schemat na każdy krok kreatora i jeden złożony z nich dla API), `actions.ts` (nazwy akcji z macierzy uprawnień) oraz enumy z polskimi etykietami (`roles.ts`, `location-types.ts`). Moduł `structure/` pokazuje kontrakt z parametrami w adresie: schemat formularza rozszerzamy o parametry ścieżki (`staircaseSchema.extend({ communityId, buildingId })`).

Moduły `invitations/` i `members/`:

- `invitations/` – link z zaproszenia: `invitations.get` (publiczny podgląd: `state` `valid` / `expired` / `invalid`, `alreadyMember`, `accountExists`, szczegóły albo `null`), `invitations.register` (publiczny), `invitations.accept` (`protectedContract`). W `schemas.ts` formularze zaproszeń (`communityInvitationSchema`, `unitInvitationSchema`), `INVITATION_VALID_DAYS` (7) i `invitationEmailSchema`, który przycina i zamienia adres na małe litery. Kody błędów linku są w `invitationErrors`, a błąd wysyłki w `sendInvitationErrors` (`MAIL_FAILED`), żeby kontrakty `members/` mogły je dołączyć.
- `members/` – trzy kontrakty w jednym module: `members` (lista, zmiana roli, usunięcie członka wspólnoty; `LAST_ADMIN`), `communityMembers` (zaproszenie do wspólnoty) i `unitMembers` (zaproszenie do lokalu, lista, zmiana roli, usunięcie osoby z lokalu). Nazwy kontraktów odpowiadają nazwom akcji w `communities/actions.ts`.
- `invitationSignUpSchema` (rejestracja z zaproszenia) to `signUpSchema.pick({ name, password })` – adres pochodzi z zaproszenia, nie z formularza.

## Zasady

- Typy wyprowadzamy ze schematów (`z.infer`), nigdy odwrotnie.
- Komunikaty walidacji piszemy w schemacie, po polsku – pokazują je formularze w webie.
- Enum to tablica `as const` (`userRoles`), z niej schemat (`z.enum`) i typ; baza buduje z tej samej tablicy `pgEnum`.
- Każda procedura kontraktu ma `.route({ method, path })`, bo z kontraktu powstaje też REST i OpenAPI. Błędy opisujemy w `.errors()` ze statusem.
- Kontrakt zaczyna się od `oc` (publiczny), `protectedContract` (wymaga zalogowania) albo `communityContract` (działa wewnątrz wspólnoty, ma `communityId` w adresie) – patrz `errors.ts`.
- Reguła obejmująca kilka pól (np. „do” nie mniejsze niż „od”) to funkcja dla `superRefine` eksportowana obok pól (`unitSeriesShape` + `checkUnitSeries`), żeby ten sam zestaw dało się złożyć z parametrami ścieżki. Drugi przykład: `communityInvitationShape` + `checkCompanyName` (wykonawca musi mieć nazwę firmy, inne role nie mogą) – ta sama funkcja sprawdza formularz zaproszenia, kontrakt z `communityId` i zmianę roli członka (`communityMemberRoleShape`).
- Nazwy akcji z macierzy uprawnień są w `communities/actions.ts`: `communityActions` (zależą tylko od wspólnoty, reguła `can`) i `unitActions` (zależą od konkretnego lokalu, reguła `canInUnit`; na razie `unitMembers.list`). Patrz `docs/api.md`, „Ochrona procedur i uprawnienia”.
- Nowy plik dopisz do `index.ts`, nowy kontrakt do `orpc.ts`.
- Pakiet kompiluje się do `dist/`. Po zmianie potrzebny jest build (`pnpm --filter @hallway/shared build`) albo działające `pnpm dev`, inaczej api i web widzą starą wersję.
- Importy względne z rozszerzeniem `.js`.

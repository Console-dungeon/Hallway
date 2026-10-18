# Testy end-to-end (`apps/e2e`)

Testy klikają w działającą aplikację jak użytkownik. Są wzorcem: nowy test powstaje przez analogię do istniejących. Opis dla osób nietechnicznych (co jest sprawdzane): dokumentacja → „Testy”.

## Układ `apps/e2e/`

```
playwright.config.ts   # adres aplikacji, start `pnpm dev`, projekty setup + chromium
global-teardown.ts     # usuwa konta testowe po wszystkich testach
fixtures/index.ts      # `test` i `expect` – importuj stąd, nie z "@playwright/test"
pages/<ekran>.page.ts  # obiekt strony: lokatory i akcje jednego ekranu
support/               # konta testowe, Mailpit, ścieżki
tests/auth.setup.ts    # loguje się raz i zapisuje sesję (.auth/user.json)
tests/<funkcja>/*.spec.ts
tests/api/*.spec.ts    # testy samego API przez `request` (kody odpowiedzi, uprawnienia)
```

## Zasady

- **Obiekt strony zamiast selektorów w teście.** Lokatory po etykiecie, roli albo tekście (`getByLabel`, `getByRole`, `getByText`), nie po klasach CSS.
- **Fixtures:** `account` (nowe zweryfikowane konto dla testu), `createAccount({ name })` (kolejne takie konta, np. dla osoby zapraszanej), `mailpit` (`linkFrom({ to, subject })`, `invitationFrom({ to, communityName })`, `subjectsTo(to)`), obiekty stron. Nowy obiekt strony dopisz w interfejsie `Fixtures` i w `base.extend`.
- **Dane przez API zamiast klikania:** gdy test potrzebuje czegoś, co nie jest jego tematem, przygotuj to przez API – `foundCommunity(request)` z `support/communities.ts` zakłada wspólnotę jako ten, kto jest zalogowany w `request` (`page.request` to sesja przeglądarki testu).
- **Zaproszenia** (`support/invitations.ts`): `invite(admin, mailpit, community, { email, role, unitId? })` wysyła zaproszenie przez API i zwraca link z e-maila (`{ path, token }`; token jest tylko w mailu, baza trzyma jego skrót). `acceptInvitation(request, link)` przyjmuje je jako zalogowany w `request`, a `addMember(...)` robi obie rzeczy naraz – najszybszy sposób, żeby dać komuś rolę albo lokal. Lokal do zaproszenia: `addUnit(request, communityId, "1")` z `support/communities.ts`.
- **Wygasły link:** `expireInvitations(email)` przestawia w bazie (`@hallway/db`) termin ważności zaproszeń na ten adres w przeszłość – nie czekamy 7 dni i nie dodajemy do tego endpointu.
- **Druga osoba w teście:** `signedInRequest(playwright, baseURL, account)` z `support/accounts.ts` daje klienta API zalogowanego jako inne konto, np. administratora wspólnoty, do której bohater testu nie należy.
- **Testy startują zalogowane** wspólną sesją. Test wylogowanej aplikacji: `test.use({ storageState: SIGNED_OUT })`. Test, który wylogowuje się albo zmienia hasło, loguje się własnym `account` – nie psuje wspólnej sesji.
- **Każdy test tworzy własne dane**; działają równolegle i w dowolnej kolejności. Konta testowe mają adres `e2e-…@example.com` i znikają w `global-teardown.ts` razem z założonymi przez nie wspólnotami i zaproszeniami wysłanymi na adresy testowe.
- **Wspólne konto nie należy do żadnej wspólnoty** i tak ma zostać: po zalogowaniu trafia na `/welcome`. Test, który zakłada wspólnotę albo przyjmuje zaproszenie, loguje się własnym `account`. Wspólne konto nadaje się na „osobę z innym adresem e-mail” – jego próby przyjęcia zaproszenia są odrzucane i niczego nie zmieniają. Nie klika „Wyloguj” (także „Wyloguj się i zaloguj na właściwe konto”): wylogowanie kończy sesję na serwerze.
- Nazwy testów po polsku, z punktu widzenia użytkownika. Trzy części: przygotowanie, akcja, sprawdzenie.
- Plików `*.setup.ts` i `*.spec.ts` nie importujemy do innych testów; wspólne rzeczy idą do `support/`.
- Po dodaniu lub usunięciu scenariuszy zaktualizuj listę na stronie „Testy” w dokumentacji (`apps/docs/src/content/testy.mdx`): opisuje zwykłym językiem, co jest sprawdzane.

## Uruchamianie

- `pnpm test:e2e` z katalogu głównego (albo `just test`); `E2E_BROWSER_CHANNEL=chrome` używa zainstalowanego Chrome.
- Wymaga: `docker compose up -d`, migracji, `AUTH_RATE_LIMIT_ENABLED=false` i SMTP ustawionego na Mailpit w `.env`.
- Po zmianie interfejsu uruchom testy przed commitem; w CI chodzą na każdym PR.
- `.auth/`, `playwright-report/` i `test-results/` są w `.gitignore` – nie commitujemy ich.

Przydatne komendy (z katalogu `apps/e2e`):

| Komenda                               | Co robi                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| `pnpm e2e`                            | wszystkie testy                                          |
| `pnpm e2e:ui`                         | tryb interaktywny: podgląd każdego kroku, ponawianie     |
| `pnpm e2e tests/auth/login.spec.ts`   | jeden plik                                               |
| `pnpm e2e -g "błędne hasło"`          | testy o pasującej nazwie                                 |
| `pnpm e2e --headed`                   | z widocznym oknem przeglądarki                           |
| `pnpm report`                         | raport HTML z ostatniego uruchomienia                    |
| `E2E_BROWSER_CHANNEL=chrome pnpm e2e` | testy w zainstalowanym Chrome zamiast pobranego Chromium |

## Jak dodać test nowej funkcji

Wzorzec: testy zakładania wspólnoty (`tests/communities/create.spec.ts`).

1. **Obiekt strony.** Skopiuj `pages/community-create.page.ts` do `pages/<ekran>.page.ts`. Zmień pola, przyciski i akcje na te z nowego ekranu.
2. **Fixture.** W `fixtures/index.ts` dopisz obiekt strony w dwóch miejscach: w interfejsie `Fixtures` i w `base.extend` (obok `communityCreatePage`).
3. **Plik testu.** Utwórz `tests/<funkcja>/<co>.spec.ts`:

   ```ts
   import { expect, test } from "../../fixtures";

   test.describe("zakładanie wspólnoty", () => {
     test("krok z budynkiem można pominąć", async ({
       communityCreatePage,
       dashboardPage,
     }) => {
       await communityCreatePage.goto();
       await communityCreatePage.fillDetails(community);
       await communityCreatePage.skipBuilding.click();

       await communityCreatePage.create.click();
       await communityCreatePage.openCommunity.click();

       await expect(dashboardPage.community(community.name)).toBeVisible();
     });
   });
   ```

4. **Uruchom** `pnpm e2e:ui` i dopracuj test, patrząc na kroki.

Dobry test ma trzy części oddzielone pustą linią: przygotowanie, akcja, sprawdzenie. Nazwa opisuje zachowanie z punktu widzenia użytkownika, po polsku.

## Co testować

- **Ścieżkę szczęśliwą** każdej funkcji: użytkownik robi to, po co przyszedł.
- **Najważniejsze błędy:** walidacja formularza, brak uprawnień, zajęta nazwa.
- **Uprawnienia:** osoba bez roli nie widzi akcji i nie wejdzie na adres wpisany ręcznie.
- **Uprawnienia każdego nowego endpointu wspólnoty** w `tests/api/`: osoba spoza wspólnoty dostaje 403, zasób z innej wspólnoty 404, brak sesji 401 (wzorzec: `tests/api/structure.spec.ts`; wiele endpointów naraz: `tests/api/members.spec.ts`).

Nie testujemy tu szczegółów wyglądu ani każdej kombinacji danych. Do tego służą testy jednostkowe.

## Gdy test nie przechodzi

- **„e-mail … to …” timeout:** mail nie doszedł do Mailpita. Sprawdź `SMTP_HOST` w `.env` i `http://localhost:8025`.
- **„Sign-up failed: 403” w pomocniku:** konto zakładane z kontekstu, który jest już zalogowany (potwierdzenie e-maila loguje). Każde konto zakładaj w świeżym kontekście – tak robią `account` i `createAccount`.
- **Komunikat „Zbyt wiele prób”:** w `.env` brakuje `AUTH_RATE_LIMIT_ENABLED=false`, zrestartuj `pnpm dev`.
- **Test przechodzi sam, a pada z innymi:** korzysta z cudzych danych albo psuje wspólną sesję (zasady 3 i 4).
- **Nie wiesz, co się stało:** `pnpm e2e:ui` albo `pnpm report` pokażą każdy krok ze zrzutem ekranu.

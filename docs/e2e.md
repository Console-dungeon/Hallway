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
```

## Zasady

- **Obiekt strony zamiast selektorów w teście.** Lokatory po etykiecie, roli albo tekście (`getByLabel`, `getByRole`, `getByText`), nie po klasach CSS.
- **Fixtures:** `account` (nowe zweryfikowane konto dla testu), `mailpit` (`linkFrom({ to, subject })`), obiekty stron. Nowy obiekt strony dopisz w interfejsie `Fixtures` i w `base.extend`.
- **Testy startują zalogowane** wspólną sesją. Test wylogowanej aplikacji: `test.use({ storageState: SIGNED_OUT })`. Test, który wylogowuje się albo zmienia hasło, loguje się własnym `account` – nie psuje wspólnej sesji.
- **Każdy test tworzy własne dane**; działają równolegle i w dowolnej kolejności. Konta testowe mają adres `e2e-…@example.com` i znikają w `global-teardown.ts`.
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

Przykład: testy zakładania wspólnoty.

1. **Obiekt strony.** Skopiuj `pages/login.page.ts` do `pages/community-create.page.ts`. Zmień pola, przyciski i akcje na te z nowego ekranu.
2. **Fixture.** W `fixtures/index.ts` dopisz obiekt strony w dwóch miejscach: w interfejsie `Fixtures` i w `base.extend` (obok `loginPage`).
3. **Plik testu.** Utwórz `tests/communities/create.spec.ts`:

   ```ts
   import { expect, test } from "../../fixtures";

   test.describe("zakładanie wspólnoty", () => {
     test("zalogowana osoba zakłada wspólnotę i zostaje jej administratorem", async ({
       page,
       communityCreatePage,
     }) => {
       await communityCreatePage.goto();
       await communityCreatePage.create({ name: "Zielone Wzgórze" });

       await expect(page.getByText("Zielone Wzgórze")).toBeVisible();
     });
   });
   ```

4. **Uruchom** `pnpm e2e:ui` i dopracuj test, patrząc na kroki.

Dobry test ma trzy części oddzielone pustą linią: przygotowanie, akcja, sprawdzenie. Nazwa opisuje zachowanie z punktu widzenia użytkownika, po polsku.

## Co testować

- **Ścieżkę szczęśliwą** każdej funkcji: użytkownik robi to, po co przyszedł.
- **Najważniejsze błędy:** walidacja formularza, brak uprawnień, zajęta nazwa.
- **Uprawnienia:** osoba bez roli nie widzi akcji i nie wejdzie na adres wpisany ręcznie.

Nie testujemy tu szczegółów wyglądu ani każdej kombinacji danych. Do tego służą testy jednostkowe.

## Gdy test nie przechodzi

- **„e-mail … to …” timeout:** mail nie doszedł do Mailpita. Sprawdź `SMTP_HOST` w `.env` i `http://localhost:8025`.
- **Komunikat „Zbyt wiele prób”:** w `.env` brakuje `AUTH_RATE_LIMIT_ENABLED=false`, zrestartuj `pnpm dev`.
- **Test przechodzi sam, a pada z innymi:** korzysta z cudzych danych albo psuje wspólną sesję (zasady 3 i 4).
- **Nie wiesz, co się stało:** `pnpm e2e:ui` albo `pnpm report` pokażą każdy krok ze zrzutem ekranu.

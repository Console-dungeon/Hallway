# Testy end-to-end (`apps/e2e`)

Testy klikają w działającą aplikację jak użytkownik. Są wzorcem: nowy test powstaje przez analogię do istniejących. Instrukcja dla ludzi: dokumentacja → „Testy e2e”.

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

## Uruchamianie

- `pnpm test:e2e` z katalogu głównego (albo `just test`); `E2E_BROWSER_CHANNEL=chrome` używa zainstalowanego Chrome.
- Wymaga: `docker compose up -d`, migracji, `AUTH_RATE_LIMIT_ENABLED=false` i SMTP ustawionego na Mailpit w `.env`.
- Po zmianie interfejsu uruchom testy przed commitem; w CI chodzą na każdym PR.
- `.auth/`, `playwright-report/` i `test-results/` są w `.gitignore` – nie commitujemy ich.

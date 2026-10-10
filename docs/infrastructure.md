# Infrastruktura i wdrożenia (`deploy/`)

Pełna instrukcja dla ludzi (konfiguracja serwera, rollback, DNS): `deploy/README.md`. Tu jest to, o czym trzeba pamiętać przy zmianach.

## Jak to działa

- Jeden VPS, Docker Compose. Dwa stosy aplikacji z tego samego `deploy/docker-compose.yml`: `qa` (`dev.hallway.pl`) i `prod` (`hallway.pl`), każdy w `/srv/hallway/<stos>/` z własnym `.env` i własną bazą.
- Osobny stos `edge` z Caddym (`deploy/edge/`): TLS i routing. `/api/*` idzie do API, reszta do weba, `docs.` i `docs-dev.` do dokumentacji.
- Obrazy buduje GitHub Actions (`.github/workflows/deploy.yml`) i wypycha do GHCR z tagiem `sha-<commit>`. Na serwerze nic nie budujemy.
- Merge do `dev` wdraża QA. PR `dev` → `main` (merge commit, nie squash) wdraża produkcję po zatwierdzeniu, z **tymi samymi obrazami**.
- `deploy/remote-deploy.sh`: pobiera obrazy, uruchamia migracje (`node dist/migrate.js`), potem startuje nową wersję.

## Pułapki

- **Wspólna sieć `edge`.** Oba stosy są do niej podpięte, więc nazwa usługi (`api`, `web`) wskazuje w niej na kontenery obu środowisk. Do połączeń między kontenerami używaj aliasu z nazwą stosu: `${STACK}-api`, `${STACK}-web` (tak jest ustawione `API_INTERNAL_URL` i routing Caddy'ego). Użycie samego `api` łączy QA z produkcją.
- **Nowa wymagana zmienna środowiskowa** musi trafić do `/srv/hallway/<stos>/.env` na serwerze przed merge'em, inaczej wdrożenie się zatrzyma (stara wersja działa dalej). Dopisz ją w `docker-compose.yml` (`${NAZWA:?komunikat}` dla wymaganych, `${NAZWA:-}` dla opcjonalnych) i w tabeli w `README.md`.
- **Pliki `.env` na serwerze są ręczne** – nie ma ich w repo ani w GitHub Secrets. Sekrety różne dla QA i produkcji.
- **Migracje są jednokierunkowe.** Rollback obrazu ich nie cofa, więc poprzednia wersja aplikacji musi działać na nowym schemacie.
- **Rewrite `/api` w Next działa tylko w `next dev`.** Na serwerze robi to Caddy; web po stronie serwera łączy się z API przez `API_INTERNAL_URL`.
- **OAuth GitHuba:** przy odmowie GitHub wraca na pierwszy zarejestrowany adres aplikacji OAuth, więc każde środowisko powinno mieć własną aplikację.

## Zmienne środowiskowe stosu aplikacji

Wymagane: `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SMTP_HOST`, `SMTP_FROM`. Opcjonalne: `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASSWORD`, `GH_CLIENT_ID`, `GH_CLIENT_SECRET`, `LOG_LEVEL`. `STACK` i `IMAGE_TAG` ustawia skrypt wdrożeniowy.

## Po wdrożeniu

Sprawdź `/api/health` i `/api/auth/ok` na danym środowisku oraz stronę `/login` (przycisk GitHuba pojawia się tylko wtedy, gdy web poprawnie rozmawia ze swoim API).

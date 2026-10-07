# Wdrożenie (QA i produkcja)

Aplikacja działa na VPS w Dockerze. Obrazy budują się w GitHub Actions i trafiają do GHCR – **na serwerze nic nie budujemy**.

```
merge do dev  ──▶ build obrazów (sha-<commit>) ──▶ GHCR ──▶ SSH ──▶ /srv/hallway/qa    (qa.<domena>)
merge do main ──▶ te same obrazy, bez budowania ──▶ zatwierdzenie ──▶ /srv/hallway/prod  (app.<domena>)
```

## Pliki

| Plik                                 | Rola                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| `apps/{web,api,docs}/Dockerfile`     | obrazy aplikacji (budowane z roota repo)                              |
| `deploy/docker-compose.yml`          | stos aplikacji: web, api, docs, Postgres – ten sam dla QA i produkcji |
| `deploy/edge/`                       | Caddy: HTTPS (Let's Encrypt) i routing subdomen dla obu środowisk     |
| `deploy/remote-deploy.sh`            | uruchamiany na serwerze: pull obrazów → migracje → restart            |
| `.github/workflows/deploy.yml`       | workflow wdrożenia                                                    |
| `.github/scripts/deploy-over-ssh.sh` | kopiuje `deploy/` na serwer i uruchamia `remote-deploy.sh`            |

## Adresy

| Środowisko | Aplikacja + API                             | Dokumentacja               |
| ---------- | ------------------------------------------- | -------------------------- |
| QA         | `https://qa.<domena>`, `/api`, `/api/docs`  | `https://qa-docs.<domena>` |
| Produkcja  | `https://app.<domena>`, `/api`, `/api/docs` | `https://docs.<domena>`    |

QA wysyła nagłówek `X-Robots-Tag: noindex`, żeby nie trafiło do wyszukiwarek.

## Jednorazowa konfiguracja serwera

Zakładamy przygotowany serwer: użytkownik `deploy` w grupie `docker`, katalogi `/srv/hallway/{edge,qa,prod}` należące do `deploy`, sieć `docker network create edge`, rekordy DNS `app`, `docs`, `qa`, `qa-docs` → IP serwera.

Pliki `.env` tworzymy **ręcznie na serwerze** – nie ma ich w repo ani w GitHubie:

```bash
# Caddy
sudo -u deploy tee /srv/hallway/edge/.env > /dev/null <<'EOF'
DOMAIN=<domena>
ACME_EMAIL=<twój e-mail do powiadomień Let's Encrypt>
EOF

# QA i produkcja – KAŻDE z innym hasłem
for stack in qa prod; do
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" | sudo -u deploy tee /srv/hallway/$stack/.env > /dev/null
done
sudo chmod 600 /srv/hallway/{edge,qa,prod}/.env
```

| Plik        | Zmienna             | Opis                                                                  |
| ----------- | ------------------- | --------------------------------------------------------------------- |
| `edge/.env` | `DOMAIN`            | domena bez subdomeny, np. `hallway.pl`                                |
| `edge/.env` | `ACME_EMAIL`        | e-mail do Let's Encrypt (ostrzeżenia o certyfikatach)                 |
| `qa/.env`   | `POSTGRES_PASSWORD` | hasło bazy QA – `openssl rand -hex 32` (hex, bo trafia do URL-a bazy) |
| `prod/.env` | `POSTGRES_PASSWORD` | hasło bazy produkcji – inne niż QA                                    |
| `*/.env`    | `LOG_LEVEL`         | opcjonalnie, domyślnie `info`                                         |

> Hasła **nie zmieniamy** po pierwszym starcie – Postgres zapisuje je przy inicjalizacji wolumenu.

## Wdrożenie

- **QA:** merge PR-a do `dev` → zakładka **Actions → Deploy**.
- **Produkcja:** PR `dev` → `main`, merge przez **Create a merge commit** → w **Actions** kliknij **Review deployments → Approve**. Produkcja dostaje obrazy z ostatniego commita `dev` – te same, które były na QA.
- **Ponowne wdrożenie** bez zmian w kodzie: **Actions → Deploy → Run workflow** na wybranym branchu.

## Na serwerze

Po każdym udanym wdrożeniu skrypt dopisuje do `.env` środowiska klucze `COMPOSE_PROJECT_NAME`, `STACK` i `IMAGE_TAG` (aktualnie działająca wersja). Dzięki temu wystarczy wejść do katalogu:

```bash
cd /srv/hallway/qa                 # albo prod
docker compose ps                  # stan kontenerów
docker compose logs -f api         # logi API
grep IMAGE_TAG .env                # która wersja działa

cd /srv/hallway/edge && docker compose logs caddy   # certyfikaty / routing
```

### Wycofanie wersji (rollback)

Każdy build ma niezmienny tag `sha-<commit>`. Żeby szybko wrócić do poprzedniej wersji, na serwerze:

```bash
cd /srv/hallway/qa                 # albo prod
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=sha-<poprzedni-commit>/' .env
docker compose pull && docker compose up -d --wait
```

Docelowo poprawkę wprowadzamy normalnie: revert w PR do `dev` (i release do `main`).

Uwaga: rollback kodu nie cofa migracji bazy – migracje piszemy tak, żeby poprzednia wersja aplikacji dalej działała.

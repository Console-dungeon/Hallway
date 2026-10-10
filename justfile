# Najczęstsze komendy projektu Hallway. `just` bez argumentów wypisuje tę listę.
# Instalacja just: https://just.systems (Debian/Ubuntu: `sudo apt install just`).
# Receptury tylko wołają skrypty pnpm i Dockera – źródłem prawdy są package.json i docker-compose.yml.

set shell := ["bash", "-cu"]

# Lista komend
default:
    @just --list --unsorted

# ---------- Start ----------

# Pierwsze uruchomienie: zależności, .env, kontenery, migracje
setup: install env up migrate
    @echo "Gotowe. Uruchom aplikacje: just dev"

# Instaluje zależności
install:
    pnpm install

# Tworzy .env z .env.example (nie nadpisuje istniejącego)
env:
    @if [ -f .env ]; then echo ".env już istnieje – bez zmian"; else cp .env.example .env && echo "Utworzono .env"; fi

# Uruchamia web (3000), api (3001) i docs (3002)
dev:
    pnpm dev

# ---------- Usługi w Dockerze ----------

# Startuje Postgresa, Mailpita i Azurite i czeka, aż będą gotowe
up:
    docker compose up -d --wait

# Zatrzymuje kontenery (dane zostają)
down:
    docker compose down

# Stan kontenerów
ps:
    docker compose ps

# Logi kontenerów, np. `just logs postgres`
logs *service:
    docker compose logs -f --tail=100 {{ service }}

# ---------- Baza danych ----------

# Nakłada migracje na lokalną bazę
migrate:
    pnpm db:migrate

# Generuje migrację po zmianie schema.ts, np. `just generate add_communities`
generate name:
    pnpm --filter @hallway/db exec drizzle-kit generate --name {{ name }}

# Drizzle Studio – przeglądarka bazy
studio:
    pnpm db:studio

# Konsola psql w kontenerze Postgresa
psql:
    docker compose exec postgres psql -U hallway -d hallway

# KASUJE lokalną bazę i maile, potem stawia wszystko od zera
db-reset:
    @read -r -p "To usunie WSZYSTKIE lokalne dane (baza, maile, pliki). Wpisz 'tak', aby kontynuować: " answer && [ "$answer" = "tak" ]
    docker compose down -v
    docker compose up -d --wait
    pnpm db:migrate

# Nadaje rolę superadmina istniejącemu kontu, np. `just superadmin jan@example.com`
superadmin email:
    pnpm --filter @hallway/api create-superadmin {{ email }}

# ---------- Jakość ----------

# Lint
lint:
    pnpm lint

# Sprawdzenie typów
typecheck:
    pnpm typecheck

# Build wszystkich aplikacji
build:
    pnpm build

# Formatowanie Prettierem
format:
    pnpm format

# To samo, co sprawdza CI: format, lint, typy, build
check:
    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm build

# ---------- Testy e2e (Playwright) ----------

# Testy e2e; argumenty trafiają do Playwrighta, np. `just test -g "logowanie"`
test *args:
    pnpm --filter @hallway/e2e e2e {{ args }}

# Testy e2e w trybie interaktywnym
test-ui:
    pnpm --filter @hallway/e2e e2e:ui

# Raport HTML z ostatniego uruchomienia testów
test-report:
    pnpm --filter @hallway/e2e report

# Pobiera przeglądarkę dla testów (raz)
test-install:
    pnpm --filter @hallway/e2e exec playwright install chromium

# ---------- Adresy ----------

# Wypisuje lokalne adresy aplikacji i narzędzi
urls:
    @echo "Web:      http://localhost:3000"
    @echo "API docs: http://localhost:3000/api/docs"
    @echo "Docs:     http://localhost:3002"
    @echo "Mailpit:  http://localhost:8025"

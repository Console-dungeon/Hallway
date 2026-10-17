# Baza danych – schemat i migracje (`packages/db`)

Drizzle ORM + PostgreSQL 18. Pakiet kompiluje się do `dist/`; używa go tylko API (web nigdy).

## Konwencje schematu (`packages/db/src/schema.ts`)

- Tabele w liczbie mnogiej, kolumny `snake_case` (robi to opcja `casing`, w kodzie piszemy `camelCase`).
- Każda tabela encji zaczyna się od `...baseColumns.id("<nazwa w liczbie pojedynczej>")` i kończy na `...baseColumns.timestamps`:

  ```ts
  export const buildings = pgTable("buildings", {
    ...baseColumns.id("building"),
    communityId: text()
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    name: text().notNull(),
    ...baseColumns.timestamps,
  });
  ```

- **Klucz główny** to `text` z prefiksem tabeli (`building_3f2a…`), generowany przez Postgresa. Klucze obce są więc typu `text`.
- `created_at` i `updated_at` to `timestamptz` i zawsze ostatnie kolumny.
- Enumy Postgresa tworzymy z tablic w `@hallway/shared` (`pgEnum("user_role", userRoles)`).
- Tabela, która nie pasuje (klucz naturalny, brak `updated_at`), definiuje własne kolumny.
- Tabele Better Auth (`users`, `sessions`, `accounts`, `verifications`) mają nazwy pól wymagane przez bibliotekę – nie zmieniaj ich.

## Tabele

| Tabela                                           | Co przechowuje                                             | Unikalność                      |
| ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------- |
| `users`, `sessions`, `accounts`, `verifications` | konta i logowanie (Better Auth)                            | `users.email`                   |
| `communities`                                    | wspólnoty (`name`, `address`, `created_by`, `archived_at`) | –                               |
| `buildings`                                      | budynki wspólnoty                                          | nazwa w obrębie wspólnoty       |
| `staircases`                                     | klatki budynku (budynek z jednym wejściem ma jedną)        | nazwa w obrębie budynku         |
| `units`                                          | lokale klatki (`number` jako tekst, `floor` opcjonalne)    | numer w obrębie klatki          |
| `locations`                                      | części wspólne wspólnoty, budynku albo klatki              | –                               |
| `community_members`                              | rola osoby we wspólnocie: `admin`, `worker`, `contractor`  | jedna rola na osobę i wspólnotę |
| `unit_members`                                   | właściciele i mieszkańcy lokalu: `owner`, `resident`       | jedna rola na osobę i lokal     |
| `invitations`                                    | zaproszenia e-mail; w bazie tylko skrót tokenu             | `token_hash`                    |

Reguły pilnowane przez bazę (CHECK):

- `locations`: klatka wymaga budynku (`staircase_id` tylko razem z `building_id`).
- `invitations`: rola `owner` lub `resident` wymaga `unit_id`, pozostałe role go nie mają.

Unikalność nazw i numerów egzekwuje baza; API zamienia jej błąd na czytelną odpowiedź (`isUniqueViolation`, `isForeignKeyViolation` z `@hallway/db`). Reguł, których baza nie umie wyrazić, pilnuje API: wspólnota ma co najmniej jednego administratora, a zaproszenie przyjmuje konto o tym samym adresie e-mail.

### Zaproszenia (`invitations`)

- **Token jest tylko w linku** (`<BETTER_AUTH_URL>/invitations/<token>`, 32 losowe bajty w base64url). W `token_hash` zapisujemy jego skrót SHA-256 (hex) i po nim szukamy zaproszenia – wyciek tabeli nie otwiera żadnego zaproszenia.
- `email` zapisujemy małymi literami (jak Better Auth w `users.email`) i tak porównujemy.
- `expires_at` = chwila wysłania + 7 dni.
- `accepted_at` i `accepted_by` ustawia przyjęcie. Zaproszenie przyjęte raz nie daje niczego drugi raz.
- `company_name` tylko dla wykonawcy.
- `revoked_at` na razie nie jest używane (zaproszeń nie da się cofnąć); ustawione oznaczałoby nieważny link.

### Usuwanie

| Usuwane                      | Skutek                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| wspólnota                    | znikają budynki, klatki, lokale, części wspólne, członkostwa i zaproszenia                        |
| budynek / klatka             | znika struktura pod spodem i jej części wspólne                                                   |
| lokal z przypisanymi osobami | **odmowa** (`unit_members.unit_id` to `RESTRICT`), także gdy usuwany jest rodzic lokalu           |
| lokal bez osób               | znika razem z zaproszeniami do niego                                                              |
| konto                        | znikają jego członkostwa i przypisania; `created_by`, `invited_by`, `accepted_by` stają się puste |

Tabela opisuje zachowanie bazy. Z aplikacji wspólnoty i konta nie są usuwane, tylko oznaczane jako nieaktywne (`docs/permissions.md`). Usunięta wspólnota ma ustawione `communities.archived_at`; każde zapytanie pokazujące wspólnoty użytkownikowi filtruje `archived_at is null`.

Budynek, klatkę i lokal administrator usuwa trwale, razem z tym, co jest pod spodem. API odmawia wcześniej, z czytelnym komunikatem (`UNIT_HAS_MEMBERS`), gdy w usuwanym lokalu albo pod usuwanym budynkiem lub klatką są przypisane osoby. `RESTRICT` w bazie to druga linia obrony.

## Migracje

1. Zmień `packages/db/src/schema.ts`.
2. `pnpm db:generate` (albo `just generate <nazwa>`).
3. Przejrzyj wygenerowany SQL w `packages/db/migrations/` i zacommituj go razem ze snapshotem w `migrations/meta/`.
4. `pnpm db:migrate` lokalnie.

- **Nigdy `drizzle-kit push`.**
- **Nie edytuj migracji, która jest już na `dev`** – trafiła na QA. Poprawka to nowa migracja.
- Kolejność kolumn ustala się przy tworzeniu tabeli; kolumna dodana później ląduje na końcu.
- Zmianę niekompatybilną (zmiana nazwy lub typu kolumny) rób w dwóch wdrożeniach: najpierw dodaj nowe, potem usuń stare. Rollback obrazu nie cofa migracji.
- Gdy dwie osoby wygenerują migrację równolegle, ta mergowana później generuje ją od nowa na aktualnym `dev`.
- `drizzle-kit generate` pyta interaktywnie, gdy w jednej zmianie znika tabela i pojawia się nowa (pytanie o zmianę nazwy). Bez terminala się wywróci – wtedy generuj w dwóch krokach.

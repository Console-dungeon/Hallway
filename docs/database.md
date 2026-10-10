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

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

Mały moduł może być jednym plikiem (`system/health.ts`). Moduł `communities/` jest wzorcem pełnego modułu: `contract.ts`, `schemas.ts` (osobny schemat na każdy krok kreatora i jeden złożony z nich dla API) oraz enumy z polskimi etykietami (`roles.ts`, `location-types.ts`).

## Zasady

- Typy wyprowadzamy ze schematów (`z.infer`), nigdy odwrotnie.
- Komunikaty walidacji piszemy w schemacie, po polsku – pokazują je formularze w webie.
- Enum to tablica `as const` (`userRoles`), z niej schemat (`z.enum`) i typ; baza buduje z tej samej tablicy `pgEnum`.
- Każda procedura kontraktu ma `.route({ method, path })`, bo z kontraktu powstaje też REST i OpenAPI. Błędy opisujemy w `.errors()` ze statusem.
- Nowy plik dopisz do `index.ts`, nowy kontrakt do `orpc.ts`.
- Pakiet kompiluje się do `dist/`. Po zmianie potrzebny jest build (`pnpm --filter @hallway/shared build`) albo działające `pnpm dev`, inaczej api i web widzą starą wersję.
- Importy względne z rozszerzeniem `.js`.

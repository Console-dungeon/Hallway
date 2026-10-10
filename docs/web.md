# Web – jak budujemy interfejs (`apps/web`)

Next.js (App Router), shadcn/ui (styl `base-nova`, Base UI), Tailwind 4, TanStack Query, klient oRPC, klient Better Auth. Interfejs i komunikaty po polsku, kod po angielsku.

## Wzorzec strony

Folder strony ma do trzech plików. Nazwy są identyczne na każdej stronie – o którą stronę chodzi, mówi folder.

```
apps/web/src/app/(auth)/login/
  page.tsx           # Server Component: sesja, dane z API, parametry adresu
  Client.tsx         # "use client"; export function Client – cały widok strony
  useController.ts   # export function useController – cała logika strony
```

- `page.tsx` pobiera dane i renderuje `<Client … />`. Nie ma stanu ani obsługi zdarzeń.
- `Client.tsx` renderuje widok z propsów i z tego, co zwraca `useController`. **Nie importuje** `useMutation`, `useRouter` ani klienta API.
- `useController.ts` trzyma walidację, wywołania API, nawigację i toasty. Nie zawiera JSX.
- Strona bez interakcji ma tylko `page.tsx`.

Szkielet nowej strony:

```tsx
// page.tsx
import { Client } from "./Client";

export default async function ExamplePage() {
  const data = await client.example.list(); // dane startowe po stronie serwera
  return <Client items={data} />;
}
```

```ts
// useController.ts
export function useController() {
  const [errors, setErrors] = useState<FieldErrors<ExampleInput>>({});
  const create = useMutation(orpc.example.create.mutationOptions());

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(exampleSchema, event.currentTarget);
    setErrors(errors ?? {});
    if (data) create.mutate(data);
  }

  return {
    errors,
    formError: create.error?.message,
    isPending: create.isPending,
    onSubmit,
  };
}
```

```tsx
// Client.tsx
"use client";

export function Client({ items }: ClientProps) {
  const { errors, formError, isPending, onSubmit } = useController();
  return (
    <form onSubmit={onSubmit} noValidate>
      …
    </form>
  );
}
```

Kontroler formularza zwraca zawsze te same nazwy: `errors` (komunikat na pole), `formError` (błąd wysłania, po polsku), `isPending`, `onSubmit`. Dodatkowe akcje pod własną nazwą (`github.signIn`, `resend`).

## Gdzie co leży

| Miejsce                        | Co tam trafia                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(auth)/`              | strony dla niezalogowanych (logowanie, rejestracja, reset hasła)                                                                    |
| `src/app/(app)/`               | strony za logowaniem; `layout.tsx` sprawdza sesję w API                                                                             |
| `src/app/<grupa>/_components/` | widoki wspólne dla kilku stron grupy; sterowane propsami, bez logiki                                                                |
| `src/components/ui/`           | komponenty shadcn – dodajemy przez `pnpm exec shadcn add <nazwa>`                                                                   |
| `src/lib/`                     | klienci i funkcje pomocnicze (nie hooki): `orpc.ts`, `auth-client.ts`, `session.ts`, `form.ts`, `auth-errors.ts`, `auth-actions.ts` |
| `src/proxy.ts`                 | dawne middleware Nexta: przekierowanie na `/login` bez ciasteczka sesji                                                             |

## Dane i API

- **Server Components** wołają `client` z `lib/orpc.ts` bezpośrednio (`await client.x.y()`).
- **Kontrolery** używają TanStack Query przez `orpc`: `useQuery(orpc.x.y.queryOptions())`, `useMutation(orpc.x.y.mutationOptions())`, unieważnianie po `orpc.x.key()`.
- Nie piszemy ręcznego `fetch` do API. Wyjątek: `lib/session.ts` (sesja Better Auth).
- Auth (logowanie, rejestracja…) idzie przez `authClient` z `lib/auth-client.ts`; wynik `{ error }` zamieniamy na `throw new AuthError(error)`.
- Wspólne wywołania używane na kilku stronach to zwykłe funkcje w `lib/` (np. `signInWithGithub`), wołane z kontrolera przez `useMutation`.

## Formularze i komunikaty

- Walidacja schematem Zod z `@hallway/shared` (ten sam co w API) przez `parseForm(schema, form)`; komunikaty błędów są w schemacie, po polsku.
- Błąd pola wyświetla `TextField` pod polem; błąd wysłania `FormAlert` nad formularzem.
- Komunikat o czymś, co stało się przed wejściem na stronę (przekierowanie), pokazujemy toastem (`sonner`, prawy dolny róg) i czyścimy parametr z adresu.
- Kody błędów Better Auth tłumaczy `lib/auth-errors.ts`.

## Sesja i ochrona tras

- `proxy.ts` tylko sprawdza obecność ciasteczka – to wygoda, nie zabezpieczenie.
- Prawdziwe sprawdzenie: `getSession()` z `lib/session.ts` w `(app)/layout.tsx` i na stronach, które mają przekierować zalogowanego.
- Ukrycie przycisku według roli to UX; decyzja o uprawnieniach zapada w API.
- Po stronie serwera web woła API pod `API_INTERNAL_URL` (`lib/api-origin.ts`), w przeglądarce pod `/api` na tym samym originie.

## Wygląd

- Najpierw Figma, potem kod: brakujący ekran dodajemy do pliku makiet (strona „Aktualne – zaimplementowane”), dopiero potem implementujemy. Link do ramki trafia do ticketu.
- Kolory i zaokrąglenia tylko z tokenów (`bg-primary`, `text-muted-foreground`, `rounded-lg`) – bez wartości wpisanych ręcznie.
- Formularze auth: pola i przyciski `h-12`, tekst `text-base`; od `2xl` większe (`2xl:h-14 2xl:text-lg`).
- Po zmianie wyglądu sprawdź stronę w przeglądarce na szerokim ekranie i na telefonie.

## Nowa strona krok po kroku

1. Makieta w Figmie i link w tickecie.
2. Jeśli strona potrzebuje nowych danych: kontrakt w `packages/shared`, procedura w `apps/api`.
3. Folder strony z `page.tsx`, a przy interakcji `Client.tsx` i `useController.ts`.
4. Test e2e w `apps/e2e` (obiekt strony + plik testu).
5. `pnpm lint && pnpm typecheck && pnpm build`, potem `pnpm test:e2e`.

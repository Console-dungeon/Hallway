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
  const data = await serverClient.example.list(); // dane startowe po stronie serwera
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

| Miejsce                        | Co tam trafia                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(auth)/`              | strony dla niezalogowanych (logowanie, rejestracja, reset hasła)                                                                                               |
| `src/app/(app)/`               | strony za logowaniem, z nagłówkiem aplikacji; `layout.tsx` sprawdza sesję, a konto bez wspólnoty odsyła na `/welcome`                                          |
| `src/app/(onboarding)/`        | ekrany na całą stronę, bez nawigacji aplikacji: pierwsze kroki (`/welcome`) i kreator wspólnoty (`/communities/new`)                                           |
| `src/app/<grupa>/_components/` | widoki wspólne dla kilku stron grupy; sterowane propsami, bez logiki                                                                                           |
| `src/components/ui/`           | komponenty shadcn – dodajemy przez `pnpm exec shadcn add <nazwa>`                                                                                              |
| `src/components/`              | widoki wspólne dla kilku grup: `FormCard`, `TextField`, `FormAlert`, `AppHeader`, `SignOutButton`                                                              |
| `src/lib/`                     | klienci i funkcje pomocnicze (nie hooki): `orpc.ts`, `orpc-server.ts`, `me.ts`, `auth-client.ts`, `session.ts`, `form.ts`, `auth-errors.ts`, `auth-actions.ts` |
| `src/proxy.ts`                 | dawne middleware Nexta: przekierowanie na `/login` bez ciasteczka sesji                                                                                        |

## Dane i API

- **Server Components** wołają `serverClient` z `lib/orpc-server.ts` (`await serverClient.x.y()`). Przekazuje on ciasteczka odwiedzającego, więc chronione procedury widzą jego sesję. `client` z `lib/orpc.ts` jest dla przeglądarki.
- **Zalogowana osoba z jej wspólnotami i lokalami:** `getMe()` z `lib/me.ts` (jedno zapytanie na żądanie, `null` bez sesji).
- **Kontrolery** używają TanStack Query przez `orpc`: `useQuery(orpc.x.y.queryOptions())`, `useMutation(orpc.x.y.mutationOptions())`, unieważnianie po `orpc.x.key()`.
- Nie piszemy ręcznego `fetch` do API. Wyjątek: `lib/session.ts` (sesja Better Auth).
- Auth (logowanie, rejestracja…) idzie przez `authClient` z `lib/auth-client.ts`; wynik `{ error }` zamieniamy na `throw new AuthError(error)`.
- Wspólne wywołania używane na kilku stronach to zwykłe funkcje w `lib/` (np. `signInWithGithub`), wołane z kontrolera przez `useMutation`.

## Formularze i komunikaty

- Walidacja schematem Zod z `@hallway/shared` (ten sam co w API) przez `parseForm(schema, form)`; komunikaty błędów są w schemacie, po polsku.
- Błąd pola wyświetla `TextField` pod polem; błąd wysłania `FormAlert` nad formularzem.
- Wartości spoza pól formularza (np. lista w stanie) waliduje `parseValues(schema, values)`.
- Formularz w kilku krokach (kreator wspólnoty) to jedna strona: kontroler trzyma krok i dane, a każdy krok jest widokiem w `_components/` strony.
- Komunikat o czymś, co stało się przed wejściem na stronę (przekierowanie), pokazujemy toastem (`sonner`, prawy dolny róg) i czyścimy parametr z adresu.
- Kody błędów Better Auth tłumaczy `lib/auth-errors.ts`.

## Sesja i ochrona tras

- `proxy.ts` tylko sprawdza obecność ciasteczka – to wygoda, nie zabezpieczenie.
- Prawdziwe sprawdzenie: `getMe()` w layoutach `(app)` i `(onboarding)`; `getSession()` z `lib/session.ts` na stronach auth, które mają przekierować zalogowanego.
- Konto, które nie należy do żadnej wspólnoty ani lokalu, zaczyna na `/welcome`; gdy już gdzieś należy, `/welcome` odsyła na pulpit.
- Ukrycie przycisku według roli to UX; decyzja o uprawnieniach zapada w API.
- Po stronie serwera web woła API pod `API_INTERNAL_URL` (`lib/api-origin.ts`), w przeglądarce pod `/api` na tym samym originie.

## Wygląd

- Najpierw Figma, potem kod: brakujący ekran dodajemy do pliku makiet (strona „Aktualne – zaimplementowane”), dopiero potem implementujemy. Link do ramki trafia do ticketu.
- Kolory i zaokrąglenia tylko z tokenów (`bg-primary`, `text-muted-foreground`, `rounded-lg`) – bez wartości wpisanych ręcznie. Potwierdzenie sukcesu ma tokeny `success`, `success-muted`, `success-border` (te same kolory co toast sukcesu).
- Formularze: pola i przyciski `h-12`, tekst `text-base`; od `2xl` większe (`2xl:h-14 2xl:text-lg`). Nic klikalnego nie jest niższe niż `h-10`.
- Bardzo szerokie ekrany mają własny próg `3xl` (1920 px, `globals.css`): nagłówek, ekran pierwszych kroków i pulpit rosną na nim jeszcze raz.
- Po zmianie wyglądu sprawdź stronę w przeglądarce na szerokim ekranie i na telefonie.

## Nowa strona krok po kroku

1. Makieta w Figmie i link w tickecie.
2. Jeśli strona potrzebuje nowych danych: kontrakt w `packages/shared`, procedura w `apps/api`.
3. Folder strony z `page.tsx`, a przy interakcji `Client.tsx` i `useController.ts`.
4. Test e2e w `apps/e2e` (obiekt strony + plik testu).
5. `pnpm lint && pnpm typecheck && pnpm build`, potem `pnpm test:e2e`.

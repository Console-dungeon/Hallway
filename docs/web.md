# Web – jak budujemy interfejs (`apps/web`)

Next.js (App Router), shadcn/ui (styl `base-nova`, Base UI), Tailwind 4, TanStack Query, klient oRPC, klient Better Auth. Interfejs i komunikaty po polsku, kod po angielsku. `apps/web/AGENTS.md` zawiera tylko blok generowany przez Next.js – zasady są tutaj.

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

| Miejsce                         | Co tam trafia                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(auth)/`               | strony dla niezalogowanych (logowanie, rejestracja, reset hasła)                                                                                                                                                           |
| `src/app/(app)/`                | strony za logowaniem, z nagłówkiem aplikacji; `layout.tsx` sprawdza sesję, a konto bez wspólnoty odsyła na `/welcome`                                                                                                      |
| `src/app/(onboarding)/`         | ekrany na całą stronę, bez nawigacji aplikacji: pierwsze kroki (`/welcome`), kreator wspólnoty (`/communities/new`), wklejenie linku z zaproszenia (`/join`)                                                               |
| `src/app/(invitation)/`         | strony z linku w e-mailu, dla zalogowanych i niezalogowanych (`/invitations/[token]`); patrz „Sesja i ochrona tras”                                                                                                        |
| `src/app/<grupa>/_components/`  | widoki wspólne dla kilku stron grupy; sterowane propsami, bez logiki                                                                                                                                                       |
| `src/components/ui/`            | komponenty shadcn – dodajemy przez `pnpm exec shadcn add <nazwa>`                                                                                                                                                          |
| `src/components/`               | widoki wspólne dla kilku grup: `FormCard`, `FormDialog`, `TextField`, `FormAlert`, `SegmentedControl`, `StaircaseChips`, `AppHeader`, `AuthShell`/`OnboardingShell` (`page-shell.tsx`), `SignOutButton`, `NotFoundMessage` |
| `src/app/<strona>/_components/` | widoki jednej strony: jej karty i okna dialogowe (np. `communities/[communityId]/_components/`)                                                                                                                            |
| `src/lib/`                      | klienci i funkcje pomocnicze (nie hooki): `orpc.ts`, `orpc-server.ts`, `me.ts`, `auth-client.ts`, `session.ts`, `form.ts`, `auth-errors.ts`, `auth-actions.ts`                                                             |
| `src/proxy.ts`                  | dawne middleware Nexta: przekierowanie na `/login` bez ciasteczka sesji                                                                                                                                                    |

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

## Strona z listą i oknami dialogowymi

Wzorzec: strona wspólnoty (`(app)/communities/[communityId]/`).

- `page.tsx` pobiera dane na serwerze (`getCommunity` z `lib/communities.ts`); brak dostępu i brak zasobu kończą się tym samym `notFound()`.
- Kontroler trzyma dane przez `useQuery(orpc.x.get.queryOptions({ input, initialData }))`, więc strona jest od razu wyrenderowana, a po zmianie sama się odświeża.
- **Jedno otwarte okno to jeden stan** `dialog` (unia z polem `type` i tym, czego okno dotyczy). `open(...)` czyści błędy, `close()` zamyka.
- **Jedna mutacja `change` na wszystkie zmiany:** dostaje funkcję, która woła API i zwraca zdanie dla toastu. Po sukcesie unieważnia dane strony, zamyka okno i pokazuje toast. Nowa akcja to nowy typ okna, funkcja `on…Submit` i komponent okna – bez nowej obsługi sukcesu i błędów.
- Okna to komponenty widoku w `_components/` zbudowane na `FormDialog`; wspólne kształty: `NameDialog` (jedno pole), `ConfirmDialog` (pytanie przed usunięciem albo sama informacja).
- Zajęta nazwa (`CONFLICT`) trafia pod pole, odmowa (`UNIT_HAS_MEMBERS`) dostaje własne okno, pozostałe błędy pokazuje `FormAlert` w oknie.
- To, co użytkownik może zrobić, bierzemy z `community.actions` (`canManage`); bez uprawnienia przyciski w ogóle się nie renderują.
- Odmiana liczebników: `plural(n, LOKAL)` z `lib/plural.ts` („1 lokal”, „3 lokale”, „12 lokali”).
- **Zakładki w adresie** (`?tab=members`): kontroler czyta zakładkę z `useSearchParams()` i zmienia ją przez `window.history.replaceState` (bez przeładowania; Next synchronizuje `useSearchParams`). Zakładki i wybór jednej z kilku opcji w formularzu (rola, tryb) to `SegmentedControl` – `kind="tabs"` albo `kind="radio"`.
- **Ustawienia wspólnoty** (`(app)/communities/[communityId]/settings/`) widzi tylko administrator (`community.update`); inni dostają `notFound()`. Usunięcie wspólnoty to okno, w którym przycisk jest aktywny dopiero, gdy wpisana nazwa jest identyczna z nazwą wspólnoty. Po usunięciu: pulpit z toastem albo `/welcome`, gdy to była jedyna wspólnota.
- Komunikat o czymś, co stało się przed wejściem na stronę (przekierowanie), pokazujemy toastem (`sonner`, prawy dolny róg) i czyścimy parametr z adresu.
- Kody błędów Better Auth tłumaczy `lib/auth-errors.ts`.

## Sesja i ochrona tras

- `proxy.ts` tylko sprawdza obecność ciasteczka – to wygoda, nie zabezpieczenie.
- Prawdziwe sprawdzenie: `getMe()` w layoutach `(app)` i `(onboarding)`; `getSession()` z `lib/session.ts` na stronach auth, które mają przekierować zalogowanego.
- Konto, które nie należy do żadnej wspólnoty ani lokalu, zaczyna na `/welcome`; gdy już gdzieś należy, `/welcome` odsyła na pulpit.
- **Strona dla zalogowanych i niezalogowanych** (link z e-maila) leży w osobnej grupie, `(invitation)`: jej prefiks jest w `publicPrefixes` w `proxy.ts`, a layout wybiera wygląd przez `getMe()` – `OnboardingShell` z nagłówkiem albo `AuthShell` z logo. Nie trafia do `(app)`, bo tamten layout wymaga sesji i odsyła konto bez wspólnoty na `/welcome`.
- Powrót po logowaniu budujemy sami z tokenu (`/login?invitation=<token>` → `invitationPath(token)` z `lib/invitation-links.ts`); adresu z parametru nigdy nie używamy wprost (open redirect).
- Ukrycie przycisku według roli to UX; decyzja o uprawnieniach zapada w API.
- Po stronie serwera web woła API pod `API_INTERNAL_URL` (`lib/api-origin.ts`), w przeglądarce pod `/api` na tym samym originie.

## Wygląd

- Najpierw Figma, potem kod: brakujący ekran dodajemy do pliku makiet (strona „Aktualne – zaimplementowane”), dopiero potem implementujemy. Link do ramki trafia do ticketu.
- Kolory i zaokrąglenia tylko z tokenów (`bg-primary`, `text-muted-foreground`, `rounded-lg`) – bez wartości wpisanych ręcznie. Potwierdzenie sukcesu ma tokeny `success`, `success-muted`, `success-border` (te same kolory co toast sukcesu).
- Ikony bierzemy z `lucide-react` (`import { LogOut } from "lucide-react"`), rozmiar klasą `size-*`. Nie dodajemy innych zestawów ikon ani własnych SVG.
- Formularze: pola i przyciski `h-12`, tekst `text-base`; od `2xl` większe (`2xl:h-14 2xl:text-lg`). Nic klikalnego nie jest niższe niż `h-10`.
- Szerokie ekrany mają jeden próg powiększenia: `2xl` (1536 px). Wyżej (1920, 2560 px) rozmiary już nie rosną – nie dodajemy własnych progów ani klas `3xl:`. Na 2560 px tytuł strony ma ok. 36 px, a przycisk główny 56 px wysokości. Nagłówek aplikacji zostaje skromny.
- Po zmianie wyglądu sprawdź stronę w przeglądarce na szerokim ekranie i na telefonie.

## Nowa strona krok po kroku

1. Makieta w Figmie i link w tickecie.
2. Jeśli strona potrzebuje nowych danych: kontrakt w `packages/shared`, procedura w `apps/api`.
3. Folder strony z `page.tsx`, a przy interakcji `Client.tsx` i `useController.ts`.
4. Test e2e w `apps/e2e` (obiekt strony + plik testu).
5. `pnpm lint && pnpm typecheck && pnpm build`, potem `pnpm test:e2e`.

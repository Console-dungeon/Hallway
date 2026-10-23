# Macierz uprawnień i przejścia statusów

Źródło prawdy dla uprawnień. Każda reguła w `apps/api/src/policies/` odpowiada jednemu wierszowi tej macierzy. Powstała z dokumentu „Hallway – macierz uprawnień” (faza 0, wersja 0.1) i została dostosowana do decyzji z jego rozdziału 6: **każdy użytkownik może założyć wspólnotę i być jej administratorem**, a administratorem całej platformy jest tylko operator.

Wersja dla osób nietechnicznych: strona „Role i uprawnienia” w dokumentacji (`apps/docs/src/content/role-i-uprawnienia.mdx`) – przy zmianie macierzy aktualizujemy obie.

Sekcje 3.3–3.6 i rozdział 4 dotyczą funkcji z faz 3–5 (zgłoszenia, komentarze, ogłoszenia, statystyki). Zostają tu, żeby nie zgubić ustaleń.

## 1. Role

| Rola                    | Gdzie zapisana                        | Opis                                                                                                                               |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Superadmin              | `users.role = superadmin`             | Operator platformy (developer). Widzi wszystkie wspólnoty w trybie odczytu, zarządza kontami. Nie zarządza cudzymi wspólnotami.    |
| Administrator wspólnoty | `community_members.role = admin`      | Zarządza swoją wspólnotą: strukturą, członkami, zaproszeniami, zgłoszeniami. Każdy zalogowany może założyć wspólnotę i nim zostać. |
| Pracownik               | `community_members.role = worker`     | Pracownik wspólnoty. Widzi wszystkie zgłoszenia swojej wspólnoty, realizuje przypisane.                                            |
| Wykonawca               | `community_members.role = contractor` | Zewnętrzna firma. Widzi i realizuje wyłącznie zgłoszenia przypisane do siebie.                                                     |
| Właściciel              | `unit_members.role = owner`           | Właściciel lokalu we wspólnocie.                                                                                                   |
| Mieszkaniec             | `unit_members.role = resident`        | Osoba mieszkająca w lokalu. Ma te same uprawnienia co właściciel.                                                                  |

- Jeden użytkownik może mieć kilka ról jednocześnie, także w różnych wspólnotach. Uprawnienia sumują się, ale zawsze **w kontekście konkretnej wspólnoty**.
- Wspólnota ma zawsze co najmniej jednego administratora: ostatniego nie można usunąć ani zdegradować.
- Konto bez żadnego przypisania widzi tylko swój profil i ekran „załóż wspólnotę / poczekaj na zaproszenie”.

## 2. Legenda

| Symbol | Znaczenie                                                           |
| ------ | ------------------------------------------------------------------- |
| ✓      | Pełny dostęp                                                        |
| O      | Tylko odczyt, we wszystkich wspólnotach (superadmin)                |
| W      | Tylko w swojej wspólnocie (wspólnotach), do których jest przypisany |
| P      | Tylko zgłoszenia przypisane do użytkownika                          |
| S      | Tylko własne zasoby (utworzone przez użytkownika lub jego konto)    |
| –      | Brak dostępu                                                        |

## 3. Macierz uprawnień

### 3.1. Konto i użytkownicy

| Akcja                                          | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| ---------------------------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Rejestracja (e-mail, GitHub)                   | ✓          | ✓     | ✓         | ✓         | ✓          | ✓           |
| Edycja własnego profilu i ustawień powiadomień | ✓          | ✓     | ✓         | ✓         | ✓          | ✓           |
| Lista użytkowników systemu                     | ✓          | –     | –         | –         | –          | –           |
| Blokowanie / odblokowanie konta                | ✓          | –     | –         | –         | –          | –           |
| Nadawanie roli superadmina                     | ✓          | –     | –         | –         | –          | –           |
| Usunięcie konta                                | –          | –     | –         | –         | –          | –           |

Kont nie usuwamy. Konto może tylko zablokować operator platformy (stan nieaktywny); jego dane zostają w bazie. Interfejs może informować, że konto nieaktywne przez 30 dni zostanie usunięte, ale takiego usuwania nie implementujemy – to pomysł na daleką przyszłość.

### 3.2. Wspólnota, struktura i członkowie (faza 2)

| Akcja                                                    | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| -------------------------------------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Założenie wspólnoty (twórca zostaje jej administratorem) | ✓          | ✓     | ✓         | ✓         | ✓          | ✓           |
| Edycja danych wspólnoty                                  | –          | W     | –         | –         | –          | –           |
| Usunięcie wspólnoty (ukrycie, dane zostają w bazie)      | –          | W     | –         | –         | –          | –           |
| Dodawanie, edycja i usuwanie budynków, klatek, lokali    | –          | W     | –         | –         | –          | –           |
| Zarządzanie częściami wspólnymi (lokalizacje)            | –          | W     | –         | –         | –          | –           |
| Zapraszanie i przypisywanie osób do lokali               | –          | W     | –         | –         | –          | –           |
| Zapraszanie administratorów, pracowników i wykonawców    | –          | W     | –         | –         | –          | –           |
| Zmiana roli i usuwanie członków oraz osób z lokali       | –          | W     | –         | –         | –          | –           |
| Podgląd listy członków wspólnoty                         | O          | W     | –         | –         | –          | –           |
| Podgląd osób przypisanych do lokalu                      | O          | W     | –         | –         | S          | S           |
| Podgląd struktury wspólnoty                              | O          | W     | W         | –         | W          | W           |
| Podgląd swoich lokali                                    | –          | –     | –         | –         | S          | S           |

Nazwy akcji (`packages/shared/src/communities/actions.ts`) i ich reguły (`apps/api/src/policies/community.ts`), w kolejności wierszy powyżej od „Edycja danych wspólnoty”: `community.update`, `community.delete`, `structure.manage`, `locations.manage`, `unitMembers.invite`, `communityMembers.invite`, `members.manage`, `members.list`, `unitMembers.list`, `structure.view`, `units.viewOwn`. Założenie wspólnoty wymaga tylko zalogowania.

`unitMembers.list` to **akcja w lokalu** (`unitActions` w tym samym pliku): odpowiedź zależy od konkretnego lokalu, nie tylko od wspólnoty. Regułę sprawdza `canInUnit(access, akcja, unitId)` = `can(access, "members.list")` albo lokal jest na liście lokali użytkownika; „S” to więc tylko własny lokal. Pracownik i wykonawca nie widzą osób w lokalach.

Działające już endpointy:

| Akcja                     | Endpointy                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `structure.view`          | `GET /communities/{id}` (wspólnota ze strukturą i częściami wspólnymi)                                       |
| `community.update`        | `PATCH /communities/{id}` (nazwa i adres)                                                                    |
| `community.delete`        | `DELETE /communities/{id}` (ukrycie: ustawia `archived_at`)                                                  |
| `structure.manage`        | dodawanie, edycja i usuwanie budynków, klatek i lokali                                                       |
| `locations.manage`        | `POST /communities/{id}/locations`, `PATCH`, `DELETE /communities/{id}/locations/{locationId}`               |
| `communityMembers.invite` | `POST /communities/{id}/invitations`                                                                         |
| `unitMembers.invite`      | `POST /communities/{id}/units/{unitId}/invitations`                                                          |
| `members.list`            | `GET /communities/{id}/members` (administratorzy, pracownicy, wykonawcy)                                     |
| `members.manage`          | `PATCH`, `DELETE /communities/{id}/members/{userId}` i `/communities/{id}/units/{unitId}/members/{userId}`   |
| `unitMembers.list`        | `GET /communities/{id}/units/{unitId}/members`                                                               |
| bez wspólnoty             | `GET /invitations/{token}`, `POST /invitations/{token}/register` (publiczne), `POST …/accept` (wymaga sesji) |

Osoba bez prawa do akcji dostaje 403, a nieistniejąca lub usunięta wspólnota to 404 (także lokal spoza tej wspólnoty).

- **Usunięcie wspólnoty to ukrycie (soft delete):** wspólnota znika z interfejsu dla wszystkich, a jej rekord i dane zostają w bazie oznaczone jako nieaktywne (`communities.archived_at`). Potem każdy endpoint wspólnoty zwraca 404, a linki z zaproszeń do niej są nieprawidłowe (`INVITATION_INVALID`). Administrator robi to na stronie ustawień wspólnoty (`/communities/{id}/settings`); przycisk usuwania działa dopiero po wpisaniu dokładnej nazwy wspólnoty – to tylko reguła interfejsu, `DELETE` nie przyjmuje treści.
- **Edycja danych wspólnoty** (nazwa i adres) na tej samej stronie ustawień, z tą samą walidacją co w kreatorze.
- **Części wspólne** (`locations`) należą do wspólnoty, budynku albo klatki i mają tylko nazwę (1–120 znaków), unikalną na swoim poziomie (zajęta → `CONFLICT`). Klatka wymaga budynku (400), budynek lub klatka spoza wspólnoty to 404. Edycja zmienia tylko nazwę – części wspólnej nie przenosi się na inny poziom. Widzi je każdy z `structure.view`, razem ze strukturą; znikają razem ze swoim budynkiem lub klatką.
- **Budynki, klatki i lokale usuwamy trwale**, razem z tym, co jest pod spodem. Lokalu z przypisanymi osobami usunąć się nie da, także razem z klatką lub budynkiem – najpierw trzeba usunąć z niego osoby (`docs/database.md`).
- **Lokale dodaje się pojedynczo albo serią** (numery od–do, najwyżej 200 naraz); numery, które już są w klatce, seria pomija.
- **Zaproszenia tylko się tworzy.** Nie ma listy oczekujących, cofania ani ponownego wysyłania. Kolumna `invitations.revoked_at` na razie nie jest używana; ustawiona oznaczałaby nieważny link.
- **Zaproszenie istnieje tylko wtedy, gdy e-mail wyszedł.** Zapis i wysyłka są w jednej transakcji; błąd wysyłki ją wycofuje (`MAIL_FAILED`).
- **Link jest ważny 7 dni** (`INVITATION_VALID_DAYS`) i działa raz. Po przyjęciu prowadzi już tylko do wspólnoty, dopóki osoba ma to, co dało zaproszenie; usuniętej osobie stary link nic nie da (nieprawidłowy).
- **Zaproszenie dla kogoś, kto już ma to, co ono daje**, nie jest odrzucane przy wysyłce. Przyjęcie kończy się sukcesem bez żadnej zmiany (bez zmiany roli), a interfejs tylko przekierowuje: z sesją na pulpit, bez sesji na logowanie. „Już ma” znaczy: dowolną rolę we wspólnocie (dowolny wiersz `community_members`) przy zaproszeniu na administratora, pracownika lub wykonawcę – pracownik zaproszony jako administrator zostaje pracownikiem, rolę zmienia `members.update`; dowolne przypisanie do tego lokalu przy zaproszeniu na właściciela lub mieszkańca. Administrator może więc zostać zaproszony jako mieszkaniec lokalu.
- **Rejestracja z zaproszenia bez osobnego potwierdzenia e-maila.** Osoba bez konta zakłada je na stronie zaproszenia; adres bierzemy z zaproszenia (serwer, nigdy z formularza), a konto od razu jest potwierdzone, bo link dowodzi, że adres należy do niej. Rejestracji przez GitHub z zaproszenia nie ma – mogłaby utworzyć konto z innym adresem. Istniejące konto (także z GitHuba) loguje się i przyjmuje zaproszenie, jeśli adres się zgadza.
- **Wykonawca ma nazwę firmy** (wymagana przy zaproszeniu i zmianie roli na wykonawcę); inne role jej nie mają.
- **Usunięcie ze wspólnoty zabiera rolę we wspólnocie**; przypisania do lokali zostają i usuwa się je osobno w lokalu.

### 3.3. Zgłoszenia (faza 3)

| Akcja                                    | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| ---------------------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Tworzenie zgłoszenia                     | –          | W     | W         | –         | W          | W           |
| Lista i szczegóły zgłoszeń               | O          | W     | W         | P         | W          | W           |
| Dodawanie zdjęć                          | –          | W     | W         | P         | S          | S           |
| Usuwanie zdjęć (tylko w statusie „nowe”) | –          | W     | –         | –         | S          | S           |
| Edycja opisu (tylko w statusie „nowe”)   | –          | W     | –         | –         | S          | S           |
| Zmiana priorytetu i kategorii            | –          | W     | W         | –         | –          | –           |
| Przypisanie pracownika / wykonawcy       | –          | W     | –         | –         | –          | –           |
| Zmiana statusu (szczegóły w rozdz. 4)    | –          | W     | P         | P         | –          | –           |
| „Dotyczy mnie też”                       | –          | –     | –         | –         | W          | W           |
| Usunięcie zgłoszenia                     | –          | –     | –         | –         | –          | –           |

Zgłoszenia nie da się usunąć ręcznie: niepotrzebne dostaje status „odrzucone”. Zgłoszenia znikają trwale tylko razem z usuwanym budynkiem, klatką lub częścią wspólną, której dotyczą – nie przechowujemy ich osobno. Zdjęcie usuwa się w ramach edycji zgłoszenia, na tych samych warunkach co opis.

### 3.4. Komentarze i obserwowanie (faza 3)

| Akcja                                     | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| ----------------------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Dodawanie komentarzy                      | –          | W     | W         | P         | W          | W           |
| Edycja i usuwanie własnych komentarzy     | –          | S     | S         | S         | S          | S           |
| Usuwanie dowolnych komentarzy (moderacja) | –          | W     | –         | –         | –          | –           |
| Obserwowanie zgłoszenia                   | –          | W     | W         | P         | W          | W           |

### 3.5. Ogłoszenia (faza 4)

| Akcja                                   | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| --------------------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Publikowanie, edycja, usuwanie ogłoszeń | –          | W     | –         | –         | –          | –           |
| Czytanie ogłoszeń wspólnoty             | O          | W     | W         | –         | W          | W           |
| Czytanie ogłoszeń budynku / klatki      | O          | W     | W         | –         | S          | S           |

Dla właściciela i mieszkańca „S” oznacza ogłoszenia budynków i klatek, w których ma lokal.

### 3.6. Statystyki i logi (faza 5)

| Akcja                      | Superadmin | Admin | Pracownik | Wykonawca | Właściciel | Mieszkaniec |
| -------------------------- | ---------- | ----- | --------- | --------- | ---------- | ----------- |
| Statystyki zgłoszeń        | O          | W     | –         | –         | –          | –           |
| Audit log (logi aplikacji) | O          | W     | –         | –         | –          | –           |

Audit log i historię statusów można tylko czytać – wpisów nikt nie edytuje ani nie usuwa.

## 4. Przejścia statusów zgłoszenia (faza 3)

„Przypisany” oznacza pracownika lub wykonawcę ustawionego w `issues.assignee_id`. „Admin” to administrator wspólnoty, do której należy zgłoszenie. Każde przejście zapisuje wpis w `issue_status_history` i `audit_logs` oraz zleca e-mail do obserwujących.

| Z                   | Na           | Kto może          | Warunki                                   |
| ------------------- | ------------ | ----------------- | ----------------------------------------- |
| nowe                | przyjęte     | Admin             | –                                         |
| nowe                | odrzucone    | Admin             | Wymagany komentarz z powodem              |
| przyjęte            | w realizacji | Admin, przypisany | Zgłoszenie musi mieć przypisaną osobę     |
| w realizacji        | oczekuje     | Admin, przypisany | Zalecany komentarz (na co czeka)          |
| oczekuje            | w realizacji | Admin, przypisany | –                                         |
| w realizacji        | zakończone   | Admin, przypisany | Ustawia `resolved_at`                     |
| przyjęte / oczekuje | odrzucone    | Admin             | Wymagany komentarz, ustawia `resolved_at` |
| zakończone          | w realizacji | Admin             | Ponowne otwarcie, czyści `resolved_at`    |

Wszystkie pozostałe przejścia są niedozwolone, a API zwraca błąd. Statusy końcowe to zakończone i odrzucone.

## 5. Reguły dodatkowe

- Każde sprawdzenie uprawnień odbywa się w API (middleware oRPC). Ukrycie przycisku na frontendzie nie jest zabezpieczeniem.
- Zaproszenie można przyjąć tylko z konta o tym samym adresie e-mail, na który zostało wysłane (porównanie bez wielkości liter, inne konto dostaje `EMAIL_MISMATCH`). Konto zakładane z zaproszenia dostaje adres z zaproszenia i nie wymaga potwierdzenia e-maila.
- Wspólnota ma zawsze co najmniej jednego administratora: usunięcie lub zmiana roli ostatniego kończy się `LAST_ADMIN` (409).
- Właściciele i mieszkańcy widzą osoby przypisane do swojego lokalu (imię, e-mail, rola), ale nie listę członków wspólnoty.
- Autor zgłoszenia i osoby, które kliknęły „dotyczy mnie też”, są automatycznie dodawani do obserwujących.
- Zgłoszenia dotyczą części wspólnych, dlatego wszyscy członkowie wspólnoty widzą jej zgłoszenia – to warunek działania funkcji „dotyczy mnie też” zamiast duplikatów.
- Zablokowany użytkownik nie może się zalogować; jego dotychczasowe zgłoszenia i komentarze pozostają widoczne.
- E-mail o zmianie statusu dostają tylko obserwujący z włączonymi powiadomieniami; autor zmiany nie dostaje maila o własnej akcji.

## 6. Ustalenia i pytania otwarte

**Ustalone (odpowiedzi z dokumentu z fazy 0):**

- Administrator nie jest jeden dla całego systemu: każdy użytkownik może być administratorem własnej wspólnoty (jednej lub kilku), a „głównym” administratorem jest operator platformy.
- Właściciel i mieszkaniec mają te same uprawnienia.
- Pracownik nie zmienia statusu zgłoszeń, które nie są do niego przypisane.
- Wykonawca może dodawać zdjęcia do przypisanych zgłoszeń.

**Zmienione względem wersji 0.1 przy dostosowaniu do tego modelu (do potwierdzenia):**

- Kolumna „Admin” oznacza administratora wspólnoty i wszędzie ma zakres „W” zamiast pełnego dostępu.
- Doszła kolumna „Superadmin”: zarządzanie kontami oraz odczyt wspólnot, zgłoszeń, ogłoszeń, statystyk i logów; bez zmian w cudzych wspólnotach.
- „Tworzenie wspólnoty” jest dostępne dla każdego zalogowanego.
- Doszły wiersze fazy 2, których wersja 0.1 nie miała: edycja danych wspólnoty, zmiana roli i usuwanie członków, podgląd listy członków.
- Rejestracja: e-mail i GitHub. Wersja 0.1 wymieniała też Google, którego nie wdrażamy.
- Tabela ról pracowników nazywa się `community_members` (wersja 0.1: `community_staff`) i obejmuje też administratorów.

**Rozstrzygnięte 2026-10-11:**

- Pracownik nie widzi listy członków wspólnoty (dane osobowe mieszkańców).
- Mieszkańcy i właściciele widzą zgłoszenia całej wspólnoty, nie tylko swojego budynku – dzięki temu mogą dołączyć się do istniejącego zgłoszenia.
- Jedna osoba ma we wspólnocie jedną rolę (administrator, pracownik albo wykonawca). Niezależnie od niej może być właścicielem lub mieszkańcem lokali – np. administrator, który ma w kamienicy własne lokale. „Swoje lokale” widzi ten, kto jest przypisany do lokalu.
- Przegląd operacji (tworzenie, odczyt, edycja, usuwanie) dla każdego zasobu: wspólnotę administrator usuwa przez ukrycie, strukturę trwale, kont nie usuwamy, zgłoszenia znikają tylko razem ze strukturą, zaproszenia mają tylko tworzenie, zdjęcie zgłoszenia można usunąć przy jego edycji.

**Rozstrzygnięte 2026-10-23 (HAL-19):**

- Część wspólna ma tylko nazwę, unikalną na swoim poziomie (wspólnota, budynek, klatka); kategorię rozważymy przy zgłoszeniach.
- Usunięcie wspólnoty wymaga wpisania jej nazwy w interfejsie.

**Rozstrzygnięte 2026-10-17 (HAL-18):**

- Właściciele i mieszkańcy widzą osoby przypisane do swojego lokalu – tylko swojego, bez listy członków wspólnoty (nowy wiersz w 3.2).
- Rejestracja z zaproszenia nie wymaga potwierdzenia e-maila, bo link z zaproszenia dowodzi adresu; to wyjątek od obowiązkowej weryfikacji (decyzja 10 w dzienniku decyzji).
- Zaproszenie dla osoby, która już ma to, co ono daje, niczego nie zmienia; link tylko przekierowuje.

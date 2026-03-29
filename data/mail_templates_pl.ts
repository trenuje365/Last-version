
import { MailType } from '../types';

export interface MailTemplate {
  id: string;
  type: MailType;
  sender: string;
  role: string;
  subject: string;
  body: string;
}

export const MAIL_TEMPLATES: MailTemplate[] = [
  // --- WELCOME MESSAGES ---
  {
    id: 'board_welcome_elite',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Objęcie stanowiska Pierwszego Trenera — oczekiwania Zarządu',
    body: 'Szanowny Panie Managerze,\n\nW imieniu Zarządu {CLUB} formalnie witamy Pana na stanowisku Pierwszego Trenera i wyrażamy zadowolenie z podjętej decyzji o współpracy.\n\nPragnę jednak od razu nakreślić ramy, w jakich będziemy oceniać naszą współpracę. {CLUB} jest klubem o ugruntowanej pozycji i ogólnopolskiej rozpoznawalności. Oczekiwania Zarządu oraz kibiców są jednoznaczne: Mistrzostwo Polski i Puchar Polski to cele, które traktujemy jako obowiązek, nie aspirację. Dysponuje Pan kadrą o najwyższym potencjale w lidze — jej odpowiednie wykorzystanie leży wyłącznie w Pana gestii.\n\nJesteśmy do dyspozycji w sprawach organizacyjnych i budżetowych. Oczekujemy regularnych raportów i pełnej determinacji na boisku.\n\nZ poważaniem,\nWojciech Marcin Jankowski\nPrezes Zarządu, {CLUB}'
  },
  {
    id: 'board_welcome_pro',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Witamy w {CLUB} — cele na nadchodzący sezon',
    body: 'Szanowny Panie Managerze,\n\nZ przyjemnością witamy Pana w strukturach {CLUB}. Cieszymy się, że podjął się Pan tego wyzwania i wierzymy, że wniesie Pan do klubu nową jakość zarówno pod względem sportowym, jak i organizacyjnym.\n\nW nadchodzącym sezonie naszym priorytetem jest regularna rywalizacja o miejsca w europejskich pucharach oraz realna walka o Puchar Polski. Zdajemy sobie sprawę, że liga jest wyrównana, jednak potencjał naszej kadry powinien plasować nas wyraźnie w czołówce tabeli.\n\nLiczymy na Pana profesjonalizm i zapraszamy do współpracy.\n\nZ poważaniem,\nMarcin Wiśniewski\nPrezes Zarządu, {CLUB}'
  },
  {
    id: 'board_welcome_elite_promotion',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Objęcie stanowiska Pierwszego Trenera — mandat Zarządu',
    body: 'Szanowny Panie Managerze,\n\nWitamy Pana w {CLUB}. Dziękujemy za podjęcie się tego odpowiedzialnego zadania w szczególnym momencie dla naszego klubu.\n\nBędę bezpośredni: obecny szczebel rozgrywkowy jest stanem przejściowym, który nie odpowiada ani historii, ani ambicjom {CLUB}. Zarząd stawia przed Panem jeden, niepodlegający dyskusji cel — awans do {TARGET_LEAGUE} w tym sezonie. Dysponuje Pan kadrą znacząco przewyższającą poziom tej ligi.\n\nOczekujemy pełnego profesjonalizmu i skupienia na realizacji tego mandatu.\n\nZ poważaniem,\nTomasz Adamski\nPrezes Zarządu, {CLUB}'
  },
  {
    id: 'board_welcome_pro_promotion',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Witamy w {CLUB} — priorytety sportowe sezonu',
    body: 'Szanowny Panie Managerze,\n\nW imieniu Zarządu oraz Dyrekcji Sportowej {CLUB} serdecznie witamy Pana na nowym stanowisku. Doceniamy Pana zdecydowanie przy podejmowaniu tego wyzwania.\n\nNasze oczekiwania względem bieżącego sezonu są klarowne: priorytetem jest zajęcie miejsca gwarantującego awans do {TARGET_LEAGUE}. Ambicje klubu sięgają wyżej niż obecny szczebel rozgrywkowy, a posiadana kadra daje realne podstawy do osiągnięcia tego celu.\n\nDyrekcja Sportowa pozostaje do Pana dyspozycji we wszelkich kwestiach kadrowych i organizacyjnych.\n\nZ poważaniem,\nPaweł Nowak\nDyrektor Sportowy, {CLUB}'
  },
  {
    id: 'board_welcome_mid',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Witamy w {CLUB}',
    body: 'Szanowny Panie Managerze,\n\nWitamy Pana w {CLUB} i dziękujemy za gotowość podjęcia się poprowadzenia naszej drużyny. Jesteśmy przekonani, że Pana doświadczenie i wiedza będą cennym wkładem w rozwój zespołu.\n\nNa ten sezon Zarząd wyznacza cel w postaci stabilnej, spokojnej pozycji w środku tabeli. Klub przechodzi etap budowania i konsolidacji kadry — zależy nam na stworzeniu solidnych fundamentów, które pozwolą na ambitniejsze plany w kolejnych rozgrywkach.\n\nLiczymy na Pana zaangażowanie i otwartą komunikację z Dyrekcją Sportową.\n\nZ poważaniem,\nKrzysztof Mazurek\nDyrektor Sportowy, {CLUB}'
  },
  {
    id: 'board_welcome_relegation',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Właściciel Klubu',
    subject: 'Witamy w {CLUB} — pilna kwestia do omówienia',
    body: 'Szanowny Panie Managerze,\n\nWitamy Pana w {CLUB}. Rozumiemy, że dołącza Pan do klubu w trudnym momencie, i doceniamy gotowość do podjęcia tego wyzwania.\n\nNie będę owijał w bawełnę — sytuacja sportowa jest poważna i wymaga natychmiastowych działań. Priorytetem absolutnym na ten sezon jest utrzymanie miejsca w lidze. Każdy zdobyty punkt ma dla nas kluczowe znaczenie. Proszę skupić się na stabilizacji gry defensywnej i odbudowie morale szatni — to fundament, od którego musimy zacząć.\n\nZarząd zapewnia Panu pełne wsparcie w granicach dostępnych zasobów. Oczekujemy regularnego kontaktu i rzetelnej oceny sytuacji.\n\nZ poważaniem,\nAndrzej Karpowicz\nWłaściciel, {CLUB}'
  },

  // --- PERFORMANCE TRACKING (BOARD) ---
  {
    id: 'board_winning_streak',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Imponująca seria zwycięstw!',
    body: 'Jesteśmy pod ogromnym wrażeniem ostatnich wyników. Seria wygranych meczów napawa nas dumą i buduje świetną atmosferę wokół klubu. Proszę utrzymać tę koncentrację. Premie dla sztabu są już przygotowane.'
  },
  {
    id: 'board_losing_streak',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Głęboki niepokój zarządu',
    body: 'Ostatnia seria porażek jest dla nas nieakceptowalna. Rozumiemy trudności, ale {CLUB} nie może pozwalać sobie na takie przestoje. Oczekujemy natychmiastowej reakcji w najbliższym spotkaniu. Nasz kredyt zaufania drastrocznie maleje.'
  },
  {
    id: 'board_excellent_position',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Aktualna pozycja w tabeli',
    body: 'Z dużą satysfakcją spoglądamy na tabelę ligową. Miejsce, które obecnie zajmujemy, przewyższa nasze przedsezonowe założenia. To dowód na Pana świetną pracę z zespołem. Tak trzymać!'
  },
  {
    id: 'board_bad_position',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Właściciel Klubu',
    subject: 'Niezadowolenie z miejsca w tabeli',
    body: 'Obecna lokata {CLUB} w tabeli jest upokarzająca dla marki o takiej reputacji. Nie po to inwestujemy w kadrę, by oglądać plecy znacznie słabszych zespołów. Oczekujemy jak najszybszej poprawy wyników.'
  },
  {
    id: 'board_watching_patience',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Obserwujemy sytuację w tabeli',
    body: 'Zarząd uważnie śledzi poczynania {CLUB} na boisku i w tabeli. Zdajemy sobie sprawę, że sezon jest jeszcze w toku, dlatego cierpliwie czekamy na przełom. Liczymy jednak, że w nadchodzących kolejkach drużyna potwierdzi swój potencjał i zacznie wspinać się w klasyfikacji.'
  },

  // --- MATCH EVENTS (FIXED LOGIC) ---
  {
    id: 'board_high_win_praise',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'To byl mecz jaki chcielibyśmy widzieć w każdej kolejce!',
    body: ' W imieniu całego Zarządu chcemy bardzo podziękować za dostarczone emocje i piękny styl tego spotkania. Zwycięstwo przy tak dużej liczbie zdobytych bramek to najlepsza reklama naszego klubu. Kibice są zachwyceni ofensywnym stylem gry. Gratulujemy spektakularnego wyniku.'
  },
  {
    id: 'fans_bitter_loss_high_score',
    type: MailType.FANS,
    sender: 'Stowarzyszenie Kibiców',
    role: 'Gniazdowy',
    subject: 'Serce boli po takim meczu...',
    body: 'Strzeliliśmy tyle goli, a i tak wracamy z niczym. Jak można tak fatalnie grać w obronie?! To bolesna lekcja, że sam atak meczu nie wygrywa. Oczekujemy poprawy gry defensywnej, bo serca nam pękną od takich wyników.'
  },
  {
    id: 'fans_furious_loss',
    type: MailType.FANS,
    sender: 'Stowarzyszenie Kibiców',
    role: 'Gniazdowy',
    subject: 'Wstyd i hańba!',
    body: 'To co pokazaliście w dzisiejszym meczu to obraza dla tych barw. Brak walki, brak ambicji. My nie wymagamy samych wygranych, my wymagamy gryzienia trawy! Następnym razem nie będzie tak miło.'
  },

  // --- LEAGUE NEWS (INJURIES) ---
  {
    id: 'media_league_star_injured',
    type: MailType.MEDIA,
    sender: 'Przegląd Ligowy',
    role: 'Redakcja',
    subject: 'Dramat gwiazdy ligi! {PLAYER} wypada z gry.',
    body: 'Szokujące wieści z obozu {OTHER_CLUB}. Ich kluczowy zawodnik, {PLAYER}, doznał fatalnej kontuzji, która wyklucza go z gry na co najmniej {DAYS} dni. To może być punkt zwrotny w walce o czołowe lokaty w tym sezonie.'
  },

  // --- STAFF (FATIGUE & HEALTH) ---
  {
    id: 'staff_fatigue_warning',
    type: MailType.STAFF,
    sender: 'Sztab Medyczny',
    role: 'Fizjoterapeuta',
    subject: 'Raport kondycyjny: {PLAYER}',
    body: 'Organizm zawodnika {PLAYER} wysyła niepokojące sygnały. Jego aktualna kondycja spadła do niebezpiecznego poziomu. Sugeruję dać mu wolne w najblizym meczu lub posadzić na ławce. Ryzyko poważnej kontuzji przy takim przemęczeniu drastycznie wzrasta.'
  },
  {
    id: 'staff_severe_injury',
    type: MailType.STAFF,
    sender: 'Szef Sztabu Medycznego',
    role: 'Lekarz Klubowy',
    subject: 'Raport medyczny: {PLAYER}',
    body: 'Niestety, badania potwierdziły uraz u zawodnika {PLAYER}. Przewidywany rozbrat z futbollem to około {DAYS} dni. To spore wyzwanie dla składu, ale rozpoczynamy intensywną rehabilitację.'
  },
  {
    id: 'board_league_champion',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: '🏆 MISTRZOWIE POLSKI! HISTORIA NAPISANA NA NOWO!',
    body: 'Panie Managerze, ZROBIŁ PAN TO! Tytuł Mistrza Polski należy do {CLUB}! To jeden z najwspanialszych momentów w historii naszego klubu. Całe miasto świętuje, kibice wylegli na ulice, a my — zarząd — jesteśmy po prostu dumni. To sukces całego sztabu, całej drużyny i Pana niesamowitej pracy przez cały sezon. Dziękujemy z całego serca. Trofeum trafia do naszej gabloty na zawsze!'
  },
  {
    id: 'board_cup_victory',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'PUCHAR JEST NASZ! 🏆 HISTORIA NAPISANA NA NOWO!',
    body: 'Brakuje nam słów, by opisać dumę, jaką czujemy. Zdobycie Pucharu Polski to moment, który na zawsze zostanie zapisany złotymi zgłoskami w historii {CLUB}. Pokonał Pan {OPPONENT} w finale na Narodowym, udowadniając, że nasza wizja rozwoju klubu była słuszna. Miasto dziś nie zaśnie, a trofeum trafia do naszej gabloty. Gratulujemy wielkiego sukcesu!'
  },
  {
    id: 'board_cup_final_loss',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Głowa do góry - dziękujemy za walkę w finale',
    body: 'Panie Managerze, mimo goryczy porażki w finale z {OPPONENT}, chcemy Panu podziękować za niesamowitą przygodę w tegorocznym Pucharze Polski. Sam awans na PGE Narodowy był dla nas wielkim wydarzeniem. Dziś zabrakło niewiele, być może odrobiny szczęścia w kluczowych momentach. Proszę przekazać zawodnikom, że zarząd docenia ich trud. Teraz musimy skupić się na lidze i wyciągnąć wnioski z tego spotkania.'
  },
  {
    id: 'system_cup_news',
    type: MailType.SYSTEM,
    sender: 'Sekretariat PZPN',
    role: 'Biuro Prasowe',
    subject: 'Finał Pucharu Polski rozstrzygnięty!',
    body: 'Byliśmy świadkami pasjonującego finału na Stadionie Narodowym w Warszawie. Po zaciętym spotkaniu, nowym triumfatorem Pucharu Polski została drużyna {WINNER}, która pokonała {LOSER} wynikiem {SCORE}. Trofeum wędruje do nowej siedziby, a kibice zwycięzców rozpoczęli świętowanie sukcesu.'
  },
  {
    id: 'fans_welcome',
    type: MailType.FANS,
    sender: 'Stowarzyszenie Kibiców',
    role: 'Przewodniczący',
    subject: 'Wsparcie z trybun - liczymy na walkę!',
    body: 'Witamy w naszym ukochanym klubie. My, kibice {CLUB}, nie oczekujemy od Pana cudów, ale wymagamy jednego: pełnego zaangażowania i walki o każdy centymetr murawy. Liczymy, że potrafi Pan zmotywować tych chłopaków tak, aby po meczu mogli spojrzeć nam w oczy. {TRANSFER_DEMAND} Jesteśmy z wami!'
  },
  {
    id: 'board_bie_approved',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Biuro Finansowe',
    subject: 'Zatwierdzenie wniosku: {PLAYER}',
    body: 'Szanowny Panie, informujemy, że Pana wniosek o rozwiązanie kontraktu z zawodnikiem {PLAYER} został rozpatrzony pozytywnie. Finanse klubu pozwalają na wypłatę odszkodowania. Proszę kontynuować proces w panelu kadrowym.'
  },
  {
    id: 'board_bie_veto',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'KATEGORYCZNE ODRZUCENIE WNIOSKU: {PLAYER}',
    body: 'Jestem głęboko rozczarowany Pana próbą pozbycia się tak kluczowego ogniwa jak {PLAYER}. Ten ruch naraziłby nas na śmieszność w mediach i zniszczył budżet na transfery. Kolejna taka prośba zostanie uznana za działanie na szkodę klubu. Proszę natychmiast porzucić ten temat.'
  },
  // --- SUPERCUP TEMPLATES ---
  {
    id: 'board_supercup_win',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Superpuchar jest nasz!',
    body: 'Szanowny Panie, gratulujemy zdobycia Superpucharu Polski po zwycięstwie nad {OPPONENT} ({SCORE}). To trofeum jest dowodem na Pana znakomity warsztat i świetne przygotowanie zespołu do sezonu. Na konto klubu wpłynęła premia w wysokości {BONUS} PLN. Oby tak dalej!'
  },
  {
    id: 'board_supercup_loss_1',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Porażka w Superpucharze ({SCORE})',
    body: 'Niestety, przegrywamy walkę o trofeum z {OPPONENT}. Mimo wyniku, w Pana grze widać było pozytywne aspekty. Proszę wyciągnąć wnioski i skupić się na nadchodzącym starcie ligi.'
  },
  {
    id: 'board_supercup_loss_2',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Rozczarowanie po finale Superpucharu',
    body: 'Zarząd nie jest zadowolony z wyniku meczu z {OPPONENT}. Oczekiwalibyśmy lepszej organizacji gry, szczególnie w formacji obronnej. Liczymy na szybką poprawę przed pierwszą kolejką.'
  },
  {
    id: 'board_supercup_loss_3',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Słaby występ zespołu w Superpucharze',
    body: 'Jesteśmy zaniepokojeni postawą drużyny w dzisiejszym starciu. {OPPONENT} obnażył nasze braki. Oczekujemy od Pana szczegółowego raportu i planu naprawczego.'
  },
  {
    id: 'board_supercup_loss_high',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Właściciel Klubu',
    subject: 'KATASTROFA w Superpucharze',
    body: 'Wynik {SCORE} z {OPPONENT} to kompromitacja naszego klubu. Nie po to inwestujemy w kadrę, by oglądać taki antyfutbol. Pana kredyt zaufania został drastycznie uszczuplony.'
  },
  {
    id: 'fans_supercup_furious',
    type: MailType.FANS,
    sender: 'Kibice',
    role: 'Stowarzyszenie',
    subject: 'AMBICJA! WALKA!',
    body: 'To co pokazaliście dzisiaj to naplucie nam w twarz. Przegrać w taki sposób mecz o trofeum?! Jeśli w lidze będzie to samo, to nie mamy o czym rozmawiać.'
  },
  {
    id: 'media_supercup_news',
    type: MailType.MEDIA,
    sender: 'Prasa Sportowa',
    role: 'Redaktor',
    subject: 'Echa finału Superpucharu',
    body: '{MEDIA_COMMENT}'
  }, // <--- TUTAJ BYŁ BRAK PRZECINKA
  {
    id: 'media_coach_fired',
    type: MailType.MEDIA,
    sender: 'Głos Ligowy',
    role: 'Redakcja Sportowa',
    subject: 'Trzęsienie ziemi w {CLUB}! {COACH} zwolniony.',
    body: 'Oficjalnie: Zarząd klubu {CLUB} podjął decyzję o natychmiastowym rozwiązaniu kontraktu z trenerem {COACH}. Powodem dymisji jest rozczarowująca postawa zespołu i odległa pozycja w tabeli ({RANK}. miejsce). Media spekulują, że czara goryczy przelała się po ostatnich wynikach, które nie dawały nadziei na realizację celu.'
  },
  {
    id: 'board_coach_warning',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'OSTRZEŻENIE - Ultimatum Zarządu',
    body: 'Szanowny Panie, nasza cierpliwość dobiegła końca. Obecna lokata zespołu ({RANK}) drastycznie odbiega od Pana obietnic. Jeśli w najbliższym czasie nie zobaczymy wyraźnej poprawy punktowej, będziemy zmuszeni podjąć radykalne kroki. Proszę traktować tę wiadomość jako oficjalne ostrzeżenie.'
  },
  {
    id: 'board_season_ticket_report',
    type: MailType.BOARD,
    sender: 'Dział Marketingu',
    role: 'Dyrektor ds. Sprzedaży',
    subject: 'Raport przedsprzedaży karnetów — Sezon {SEASON}',
    body: 'Szanowny Panie Managerze,\n\nZ przyjemnością przedstawiamy raport z przedsprzedaży karnetów sezonowych dla {CLUB} przed startem nowych rozgrywek.\n\n🏟️ STADION: {STADIUM}\n📊 POJEMNOŚĆ: {CAPACITY} miejsc\n\n--- WYNIKI PRZEDSPRZEDAŻY ---\n\n🎫 Sprzedane karnety: {TICKETS_SOLD} szt.\n💰 Przychód netto: {REVENUE}\n💳 Cena karnetu: {TICKET_PRICE}\n\nZainteresowanie kibiców przed tym sezonem oceniamy jako {DEMAND_LEVEL}. Pieniądze z przedsprzedaży zostały doliczone do budżetu klubu.\n\nZ poważaniem,\nDział Marketingu {CLUB}'
  },
  // --- EUROPEJSKIE GRATULACJE — FAZA GRUPOWA ---
  {
    id: 'board_european_advance_group_cl',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Fazy Grupowej Ligi Mistrzów — Gratulacje!',
    body: 'Panie Managerze,\n\nW imieniu całego Zarządu {CLUB} składamy serdeczne gratulacje z okazji awansu do fazy grupowej Ligi Mistrzów! To historyczny moment dla naszego klubu. Europejskie areny czekają — liczymy na godne zaprezentowanie barw {CLUB}. Zarząd w pełni Pana wspiera.\n\nZ wyrazami uznania,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_group_el',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Fazy Grupowej Ligi Europy — Gratulacje!',
    body: 'Szanowny Panie Managerze,\n\nZ wielką przyjemnością gratulujemy awansu do fazy grupowej Ligi Europy! To znakomity wynik, który potwierdza rosnącą siłę {CLUB} na arenie europejskiej. Cały klub jest z Pana dumny — powodzenia w dalszych zmaganiach!\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_group_conf',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Fazy Grupowej Ligi Konferencji — Gratulacje!',
    body: 'Panie Managerze,\n\nW imieniu Zarządu {CLUB} gratulujemy awansu do fazy grupowej Ligi Konferencji UEFA! To ważny krok w europejskiej rywalizacji i powód do dumy dla całego klubu. Liczymy na dalsze sukcesy!\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  // --- EUROPEJSKIE GRATULACJE — 1/8 FINAŁU ---
  {
    id: 'board_european_advance_r16_cl',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do 1/8 Finału Ligi Mistrzów!',
    body: 'Panie Managerze,\n\nZarząd {CLUB} składa gratulacje z okazji awansu do 1/8 finału Ligi Mistrzów! To wybitne osiągnięcie, które stawia {CLUB} w gronie europejskiej elity. Jesteśmy niezwykle dumni i z niecierpliwością oczekujemy kolejnych meczów.\n\nZ wyrazami uznania,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_r16_el',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do 1/8 Finału Ligi Europy!',
    body: 'Szanowny Panie Managerze,\n\nGratulujemy awansu do 1/8 finału Ligi Europy! Wyjście z grupy to doskonały wynik potwierdzający jakość pracy całego sztabu. Zarząd {CLUB} jest pełen optymizmu i wierzy w dalsze postępy drużyny.\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_r16_conf',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do 1/8 Finału Ligi Konferencji!',
    body: 'Panie Managerze,\n\nGratulujemy awansu do fazy pucharowej Ligi Konferencji! Wyjście z grupy to potwierdzenie ciężkiej pracy całego sztabu szkoleniowego. Zarząd {CLUB} jest zadowolony z dotychczasowych wyników i liczy na kolejne sukcesy.\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  // --- EUROPEJSKIE GRATULACJE — 1/4 FINAŁU ---
  {
    id: 'board_european_advance_qf_cl',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Ćwierćfinału Ligi Mistrzów!',
    body: 'Panie Managerze,\n\nSerdecznie gratulujemy niesamowitego osiągnięcia — {CLUB} awansował do ćwierćfinału Ligi Mistrzów! To historyczny wyczyn, który przejdzie do kronik naszego klubu. Cały zarząd, kibice i miasto są z Pana niezwykle dumni!\n\nZ ogromnym uznaniem,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_qf_el',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Ćwierćfinału Ligi Europy!',
    body: 'Szanowny Panie Managerze,\n\nGratulujemy awansu do ćwierćfinału Ligi Europy! To znakomity wynik, świadczący o doskonałej jakości pracy całego zespołu. Zarząd {CLUB} w pełni Pana popiera i oczekuje kolejnych emocji.\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_qf_conf',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Ćwierćfinału Ligi Konferencji!',
    body: 'Panie Managerze,\n\nGratulujemy awansu do ćwierćfinału Ligi Konferencji! To kolejny krok naprzód w europejskiej przygodzie {CLUB}. Zarząd jest zadowolony z postawy drużyny i liczy na dalsze sukcesy.\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  // --- EUROPEJSKIE GRATULACJE — 1/2 FINAŁU ---
  {
    id: 'board_european_advance_sf_cl',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Półfinału Ligi Mistrzów! Historyczne osiągnięcie!',
    body: 'Panie Managerze,\n\nJesteśmy w półfinale Ligi Mistrzów! To historyczne osiągnięcie {CLUB}, którego nikt nie zapomni. W imieniu zarządu, kibiców i całego miasta składamy Panu wyrazy najwyższego uznania. Jeden krok od wielkiego finału — wierzymy w Pana i drużynę!\n\nZ ogromną dumą,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_sf_el',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Półfinału Ligi Europy!',
    body: 'Szanowny Panie Managerze,\n\nZarząd {CLUB} z ogromną dumą gratuluje awansu do półfinału Ligi Europy! To znakomity wynik, który odzwierciedla ciężką pracę całego sztabu szkoleniowego. Do wielkiego finału brakuje jeszcze jednego kroku — liczymy na Pana!\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_sf_conf',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Awans do Półfinału Ligi Konferencji!',
    body: 'Panie Managerze,\n\nSerdecznie gratulujemy awansu do półfinału Ligi Konferencji! {CLUB} udowadnia, że jest liczącą się siłą w europejskich rozgrywkach. Zarząd w pełni wierzy, że drużyna powalczy o najwyższe laury.\n\nZ poważaniem,\nZarząd {CLUB}'
  },
  // --- EUROPEJSKIE GRATULACJE — FINAŁ ---
  {
    id: 'board_european_advance_final_el',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: '{CLUB} w Finale Ligi Europy! Gratulacje!',
    body: 'Panie Managerze,\n\nGRATULACJE! {CLUB} awansował do Finału Ligi Europy! To jeden z największych momentów w historii naszego klubu. Cały kraj patrzy na Was z podziwem. Zarząd jest za Panem w 100% — idźcie po ten puchar!\n\nZ wyrazami najwyższego uznania,\nZarząd {CLUB}'
  },
  {
    id: 'board_european_advance_final_conf',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: '{CLUB} w Finale Ligi Konferencji! Gratulacje!',
    body: 'Panie Managerze,\n\nGRATULACJE! {CLUB} awansował do Finału Ligi Konferencji UEFA! To historyczny sukces, który przejdzie do annałów naszego klubu. Zarząd jest z Pana niezwykle dumny. Powodzenia w wielkim finale!\n\nZ wyrazami najwyższego uznania,\nZarząd {CLUB}'
  }
]; // <--- ZAMKNIĘCIE TABLICY


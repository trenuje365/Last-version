
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
    subject: 'Witamy w naszym klubie.',
    body: 'Szanowny Panie Managerze, gratulujemy objęcia sterów w {CLUB}. Jako jeden z najpotężniejszych klubów w kraju, sądzimy, że posiadamy odpowiednie środki do zrealizowania najwyższych celów. Dysponuje Pan kadrą gotową na wielkie rzeczy. Oczekujemy, że od pierwszej kolejki narzucimy rywalom swój styl gry. Powodzenia, całe miasto oraz kibice liczą na solidna walkę o tytuł Mistrza Polski!'
  },
  {
    id: 'board_welcome_pro',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Witmy w klubie.',
    body: 'Cieszymy się, że dołączył Pan do {CLUB}. Nasz zespół ma ogromny potencjał, który w ostatnim czasie nie był w pełni wykorzystany. W nadchodzącym sezonie naszym priorytetem jest walka o miejsca premiowane grą w europejskich pucharach, a przy odrobinie szczęscia może i Puchar Polski lub Mistrz Polski. Chcemy widzieć drużynę grającą ofensywnie i z pasją. Wierzymy, że pod Pana wodzą to możliwe.'
  },
  {
    id: 'board_welcome_elite_promotion',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Prezes Zarządu',
    subject: 'Witamy w {CLUB}! .',
    body: 'Szanowny Panie Managerze, Nie będziemy ukrywać – ten klub i te trybuny nie pasują do obecnego szczebla rozgrywek. Naszym jedynym i bezdyskusyjnym celem jest AWANS do {TARGET_LEAGUE}. Ma Pan do dyspozycji najsilniejszy skład w stawce. Liczymy na szybki powrót tam, gdzie nasze miejsce.'
  },
  {
    id: 'board_welcome_pro_promotion',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Witamy w klubie.',
    body: ' Cieszymy się, że podjął się Pan wyzwania poprowadzenia {CLUB}. Nasze ambicje sięgają wyżej niż obecna liga. W tym sezonie oczekujemy twardej walki o miejsca gwarantujące AWANS do {TARGET_LEAGUE}. Chcemy widzieć zespół zdeterminowany, który w każdym meczu narzuca swoje warunki. Powodzenia w realizacji tego celu.'
  },
  {
    id: 'board_welcome_mid',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Dyrektor Sportowy',
    subject: 'Witamy na pokładzie,',
    body: 'Nasza drużyna przechodzi obecnie proces przebudowy i naszym głównym celem jest spokój oraz bezpieczne miejsce w środku tabeli. Chcemy uniknąć nerwowej końcówki sezonu i zbudować solidne fundamenty pod przyszłe sukcesy. Proszę skupić się na zbalansowaniu kadry i wprowadzaniu stabilnego planu taktycznego. Zarząd ufa Pana wizji.'
  },
  {
    id: 'board_welcome_relegation',
    type: MailType.BOARD,
    sender: 'Zarząd Klubu',
    role: 'Właściciel Klubu',
    subject: 'Witamy serdecznie w {CLUB}!',
    body: 'Sytuacja nie jest łatwa, ale wierzymy, że jest Pan odpowiednią osobą na odpowiednim miejscu. W tym sezonie interesuje nas tylko jedno: utrzymanie w lidze za wszelką cenę. Każdy punkt będzie na wagę złota, a każdy mecz będzie bitwą o życie. Proszę natchnąć tych chłopców do walki. Jeśli uda się uniknąć spadku, uznamy sezon za udany.'
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
  }
]; // <--- ZAMKNIĘCIE TABLICY


export type TalkType = 'CALM' | 'AGGRESSIVE' | 'PRAISE' | 'CRITICIZE' | 'SILENCE';

export type ScoreContext =
  | 'DRAW_LOW'
  | 'DRAW_HIGH'
  | 'LOSING_ONE'
  | 'LOSING_HIGH'
  | 'WINNING_ONE'
  | 'WINNING_HIGH';

export interface TalkOption {
  id: string;
  text: string;
  hiddenType: TalkType;
}

export const HALFTIME_TALKS: Record<ScoreContext, TalkOption[]> = {

  // ─── REMIS — MAŁO BRAMEK (0:0) ───────────────────────────────────────────
  DRAW_LOW: [
    { id: 'DL_1',  text: 'Spokojnie, panowie. 0:0 to dobry wynik na wyjeździe. Utrzymajcie ustawienie i szukajcie kontry.', hiddenType: 'CALM' },
    { id: 'DL_2',  text: 'Nie strzelimy żadnego gola stojąc z tyłu! Idźcie do przodu, atakujcie bez strachu!', hiddenType: 'AGGRESSIVE' },
    { id: 'DL_3',  text: 'Dobra, zwarta defensywa w pierwszej połowie. Teraz pora na nasz ruch ofensywny.', hiddenType: 'PRAISE' },
    { id: 'DL_4',  text: 'Zero strzałów, zero kreatywności. Gdzie była wasza gra kombinacyjna?!', hiddenType: 'CRITICIZE' },
    { id: 'DL_5',  text: 'Cierpliwość jest tutaj kluczem. Jedna dobra akcja i ten mecz jest nasz.', hiddenType: 'CALM' },
    { id: 'DL_6',  text: 'Widzę jak się boją naszego pressingu! Zaciskajcie ich, nie dajcie im oddychać!', hiddenType: 'AGGRESSIVE' },
    { id: 'DL_7',  text: 'Taktycznie gracie świetnie. Rywal nie ma na nas żadnego pomysłu.', hiddenType: 'PRAISE' },
    { id: 'DL_8',  text: 'Spodziewałem się więcej inicjatywy. W drugiej połowie chcę was widzieć przy ich bramce!', hiddenType: 'CRITICIZE' },
    { id: 'DL_9',  text: 'Jeden gol zmienia wszystko. Bądźcie gotowi na szybkie tempo od pierwszej minuty!', hiddenType: 'AGGRESSIVE' },
    { id: 'DL_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],

  // ─── REMIS — DUŻO BRAMEK (1:1, 2:2+) ────────────────────────────────────
  DRAW_HIGH: [
    { id: 'DH_1',  text: 'Strzelamy i tracimy, strzelamy i tracimy! Czas zacisnąć defensywę i atakować skuteczniej!', hiddenType: 'AGGRESSIVE' },
    { id: 'DH_2',  text: 'To jest mecz na szarpanie nerwów. Uspokójmy grę, kontrolujmy piłkę.', hiddenType: 'CALM' },
    { id: 'DH_3',  text: 'Panowie, te bramki były fenomenalne! Teraz zadbajcie o szczelność obrony.', hiddenType: 'PRAISE' },
    { id: 'DH_4',  text: 'Tyle goli strąconych w pierwszej połowie to wstyd dla naszej linii defensywnej!', hiddenType: 'CRITICIZE' },
    { id: 'DH_5',  text: 'Rywal daje się nam strzelać! Jeszcze jedna bramka i mecz jest nasz!', hiddenType: 'AGGRESSIVE' },
    { id: 'DH_6',  text: 'Zatrzymajcie to szaleństwo. Zagrajcie spokojnie, opanujcie środek pola.', hiddenType: 'CALM' },
    { id: 'DH_7',  text: 'Świetna gra w ataku, naprawdę! Teraz tylko trochę więcej skupienia z tyłu.', hiddenType: 'PRAISE' },
    { id: 'DH_8',  text: 'Ta obrona to kpina! Nie mogę patrzeć jak stoicie i czekacie aż oni strzelą!', hiddenType: 'CRITICIZE' },
    { id: 'DH_9',  text: 'Idę na całość! Chcę pressingu, chcę tempa, chcę gola w ciągu pierwszych dziesięciu minut!', hiddenType: 'AGGRESSIVE' },
    { id: 'DH_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],

  // ─── PRZEGRYWAMY O 1 (0:1, 1:2, 2:3) ────────────────────────────────────
  LOSING_ONE: [
    { id: 'LO_1',  text: 'Jedna bramka to nic! Mamy całą drugą połowę! Rzućcie się do ataku!', hiddenType: 'AGGRESSIVE' },
    { id: 'LO_2',  text: 'Nie panikujcie. Jeden gol, jeden strzał nas wyrówna. Grajcie spokojnie.', hiddenType: 'CALM' },
    { id: 'LO_3',  text: 'Graliście dobrze, po prostu mieliśmy pecha. W drugiej połowie odwrócimy wynik.', hiddenType: 'PRAISE' },
    { id: 'LO_4',  text: 'Jedna głupia strata i już przegrywamy. To niedopuszczalne przy naszym poziomie!', hiddenType: 'CRITICIZE' },
    { id: 'LO_5',  text: 'Chcę was wściekłych! Chcę was głodnych! Jedna bramka i ten mecz jest remisem!', hiddenType: 'AGGRESSIVE' },
    { id: 'LO_6',  text: 'Sytuacja jest pod kontrolą. Cierpliwie budujcie akcje, nie szarżujcie bez sensu.', hiddenType: 'CALM' },
    { id: 'LO_7',  text: 'Wasza praca była widoczna. Teraz czas żeby ta praca przyniosła efekty.', hiddenType: 'PRAISE' },
    { id: 'LO_8',  text: 'Pozwoliliście im się cieszyć przez całą przerwę. To musi się zmienić w drugiej połowie!', hiddenType: 'CRITICIZE' },
    { id: 'LO_9',  text: 'Ja wierzę w was! Jeden gol zmienia ten mecz! Pełne tempo od pierwszej minuty!', hiddenType: 'AGGRESSIVE' },
    { id: 'LO_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],

  // ─── PRZEGRYWAMY O 2+ (0:2, 0:3+) ───────────────────────────────────────
  LOSING_HIGH: [
    { id: 'LH_1',  text: 'Co to było?! Wstydzę się za was! Chcę zobaczyć zupełnie inną drużynę w drugiej połowie!', hiddenType: 'CRITICIZE' },
    { id: 'LH_2',  text: 'Wszystko stracone? NIE! Wychodzimy i walczymy do ostatniej sekundy!', hiddenType: 'AGGRESSIVE' },
    { id: 'LH_3',  text: 'Spokój. Jeden gol na raz. Nie myślcie o wyniku, skupcie się wyłącznie na grze.', hiddenType: 'CALM' },
    { id: 'LH_4',  text: 'Ta obrona to kpina! Zapomnijcie o taktyce — po prostu walczcie każdą piłkę!', hiddenType: 'CRITICIZE' },
    { id: 'LH_5',  text: 'Nie znosimy przegranej! Idźcie tam i pokażcie im siłę naszego charakteru!', hiddenType: 'AGGRESSIVE' },
    { id: 'LH_6',  text: 'Wiem że daliście z siebie wszystko. Teraz dajcie jeszcze więcej — na honor tego klubu.', hiddenType: 'PRAISE' },
    { id: 'LH_7',  text: 'Tyle goli za pierwszą połowę. To hańba. Macie 45 minut żeby to naprawić!', hiddenType: 'CRITICIZE' },
    { id: 'LH_8',  text: 'Widziałem gorsze mecze odwrócone. Idźcie i walczcie, nic się tutaj nie skończyło!', hiddenType: 'AGGRESSIVE' },
    { id: 'LH_9',  text: 'Dwa gole to do odrobienia. Metodycznie, cierpliwie. Nie szarżujcie jak szaleni.', hiddenType: 'CALM' },
    { id: 'LH_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],

  // ─── PROWADZIMY O 1 (1:0, 2:1, 3:2) ─────────────────────────────────────
  WINNING_ONE: [
    { id: 'WO_1',  text: 'Jeden gol przewagi. Skupcie się na obronie, nie dawajcie im wolnej piłki.', hiddenType: 'CALM' },
    { id: 'WO_2',  text: 'Brawo! Zasłużone prowadzenie. Kontynuujcie tę grę w drugiej połowie.', hiddenType: 'PRAISE' },
    { id: 'WO_3',  text: 'Jeden gol to za mało! Idźcie po drugi! Nie wolno nam zwalniać tempa!', hiddenType: 'AGGRESSIVE' },
    { id: 'WO_4',  text: 'Utrzymajcie ten wynik. Zagrajcie spokojnie, kontrolujcie każde podanie.', hiddenType: 'CALM' },
    { id: 'WO_5',  text: 'Jeden gol i już myślicie że wygraliście? To mecz, a nie spacer!', hiddenType: 'CRITICIZE' },
    { id: 'WO_6',  text: 'Piękna bramka, świetna robota defensywna. Tak samo w drugiej połowie.', hiddenType: 'PRAISE' },
    { id: 'WO_7',  text: 'Nie odpuszczamy ani sekundy! Chcę pressingu, chcę krzyku, chcę goli!', hiddenType: 'AGGRESSIVE' },
    { id: 'WO_8',  text: 'Cierpliwość i dyscyplina. Mamy przewagę — teraz ją utrzymajmy do końca.', hiddenType: 'CALM' },
    { id: 'WO_9',  text: 'Za dużo ryzyka w ataku. W drugiej połowie wracamy do taktycznej defensywy!', hiddenType: 'CRITICIZE' },
    { id: 'WO_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],

  // ─── PROWADZIMY O 2+ (2:0, 3:1+) ────────────────────────────────────────
  WINNING_HIGH: [
    { id: 'WH_1',  text: 'Świetny wynik. Teraz zagrajcie spokojnie, bez zbędnego ryzyka.', hiddenType: 'CALM' },
    { id: 'WH_2',  text: 'Doskonała gra, panowie! Jesteście absolutnie fantastyczni dziś wieczór!', hiddenType: 'PRAISE' },
    { id: 'WH_3',  text: 'Nie zadowalamy się tym! Idźcie po więcej bramek, koniec z litością!', hiddenType: 'AGGRESSIVE' },
    { id: 'WH_4',  text: 'Dwie bramki przewagi to dobra poduszka. Brońcie pozycji, nie ryzykujcie.', hiddenType: 'CALM' },
    { id: 'WH_5',  text: 'To jest nasz poziom! Wy rozumiecie jak grać w piłkę! Tak dalej!', hiddenType: 'PRAISE' },
    { id: 'WH_6',  text: 'Nie popadajcie w samozadowolenie! Widziałem jak z 2:0 robi się 2:2!', hiddenType: 'CRITICIZE' },
    { id: 'WH_7',  text: 'Chcę was głodnych do końca! Cztery, pięć goli jest dzisiaj możliwe!', hiddenType: 'AGGRESSIVE' },
    { id: 'WH_8',  text: 'Kontrolujcie mecz. Nie śpieszcie się. Wynik jest po naszej stronie.', hiddenType: 'CALM' },
    { id: 'WH_9',  text: 'Dwie bramki to za mało żeby odpoczywać. Nie zwalniajcie, dajcie z siebie coś!', hiddenType: 'CRITICIZE' },
    { id: 'WH_10', text: 'Bez komentarza', hiddenType: 'SILENCE' },
  ],
};

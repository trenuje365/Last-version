import { CommentaryCategory, CompetitionType } from '../types';

export interface CommentaryTemplate {
  id: string;
  speaker: string;
  category: CommentaryCategory;
  conditions: {
    competitionType?: CompetitionType;
    importanceTier?: number; // 1-5
    tableGap?: 'CLOSE' | 'WIDE' | 'NONE';
    seasonPhase?: 'START' | 'MID' | 'END';
    underdog?: boolean;
    weather?: 'RAINY' | 'COLD' | 'WARM';
  };
  text: string;
}

/**
 * Massive Database of Polish Football Commentary
 * Designed to provide depth, tactical analysis, and 6-sentence long responses.
 */
export const PREMATCH_COMMENTARY_DB: CommentaryTemplate[] = [
  // --- INTROS (HOSTS: Borek, Smokowski, Twarowski) ---
  {
    id: 'intro_001',
    speaker: 'Mateusz Borek',
    category: CommentaryCategory.INTRO,
    conditions: {},
    text: 'Kłaniam się nisko ze studia przedmeczowego, gdzie emocje sięgają już zenitu, a zapach świeżo przystrzyżonej trawy niemal czuć przez ekrany. Dzisiejsze starcie {HOME} kontra {AWAY} to nie jest zwykły mecz, to jest manifestacja siły i ambicji obu tych wielkich ośrodków piłkarskich w naszym kraju. Widzimy na trybunach komplet publiczności, która od godzin porannych przygotowywała się na to widowisko, tworząc atmosferę godną europejskich pucharów. Gospodarze muszą dziś udowodnić, że ich ostatnia zwyżka formy to nie był przypadek, a systematyczna praca całego sztabu szkoleniowego. Z kolei goście przyjeżdżają tutaj z bardzo konkretnym planem, który ma zneutralizować najmocniejsze ogniwa ekipy {HOME}. Zapraszam państwa na podróż przez świat taktyki, pasji i nieustępliwej walki o każdą piłkę.'
  },
  {
    id: 'intro_002',
    speaker: 'Tomasz Smokowski',
    category: CommentaryCategory.INTRO,
    conditions: {},
    text: 'Dobry wieczór państwu, zaczynamy odliczanie do jednego z najbardziej wyczekiwanych spotkań tej rundy, w którym {HOME} podejmuje {AWAY}. Każdy ekspert, z którym rozmawiałem przed wejściem na antenę, podkreśla jedno: to będzie mecz detali i strategicznych szachów na murawie. Patrząc na składy, które właśnie spłynęły do naszej redakcji, widać wyraźnie, że trenerzy nie zamierzają dziś kalkulować i rzucają na szalę wszystko co mają najlepsze. Stadion tętni życiem, a presja na zawodnikach gospodarzy jest wręcz namacalna, bo oczekiwania kibiców po prostu nie znają granic. Goście z kolei czują się w roli "twardego orzecha do zgryzienia" znakomicie, co udowadniali już niejednokrotnie w tym sezonie na trudnych terenach. Czy zobaczymy grad bramek, czy może defensywną batalię o każdy metr kwadratowy boiska? Przekonamy się o tym już za kilkanaście minut, kiedy sędzia zagwiżdże po raz pierwszy.'
  },
  // --- TACTICAL GUESTS (Hajto, Engel, Strejlau, Brzęczek, Wichniarek, Juskowiak, Żelasko) ---
  {
    id: 'tact_001',
    speaker: 'Tomasz Hajto',
    category: CommentaryCategory.TACTICS,
    conditions: {},
    text: 'Słuchajcie, tu nie ma co czarować rzeczywistości, bo w piłce na tym poziomie liczy się przede wszystkim to, co masz w "wątrobie" i jak potrafisz zareagować w fazie przejściowej. {HOME} musi dziś zagrać bardzo agresywnie w środkowej strefie, bo jeśli dadzą rywalowi z {AWAY} złapać oddech, to zostaną po prostu rozklepani przez ich szybkie skrzydła. Widzę tu spore braki w asekuracji bocznych obrońców gospodarzy, co przy tak dysponowanych wahadłowych gości może skończyć się tragicznie dla ich defensywy. Trzeba skrócić pole gry, zacieśnić formacje i przede wszystkim nie bać się twardego, męskiego kontaktu, bo sędzia dziś na pewno pozwoli na więcej. Jeśli jeden z drugim nie zrozumie, że tu trzeba biegać po 12 kilometrów na mecz, to nie mają co marzyć o trzech punktach. Kluczowe będzie wyłączenie z gry ich playmakera, który ma niesamowite kopyto i potrafi jednym podaniem otworzyć drogę do bramki z każdej pozycji.'
  },
  {
    id: 'tact_002',
    speaker: 'Andrzej Strejlau',
    category: CommentaryCategory.TACTICS,
    conditions: {},
    text: 'Współczesna myśl szkoleniowa opiera się na strukturze, a struktura to przede wszystkim odpowiednie odległości między formacjami, czego w ostatnich meczach {HOME} nam brakowało. Musimy zwrócić uwagę na to, jak {AWAY} buduje swoje ataki pozycyjne, wykorzystując rotację w trójkącie środkowym, co kompletnie dezorientuje defensywę rywala. Jeśli gospodarze nie zastosują dziś pressingu selektywnego i nie odetną linii podania do bocznych sektorów, to będą mieli ogromny problem z płynnością gry. Widzimy, że trener postawił na system 4-4-2, ale w fazie ofensywnej to się musi płynnie zmieniać w 3-5-2, aby zapewnić przewagę w strefie ataku. Ważne jest, aby zawodnicy nie dublowali swoich pozycji i potrafili czytać grę bez piłki, co jest absolutnym fundamentem na tym poziomie ligowym. Liczę na to, że zobaczymy dziś sporo inteligentnych przesunięć, które pozwolą nam cieszyć się z wysokiej jakości widowiska taktycznego.'
  },
  {
    id: 'tact_003',
    speaker: 'Jerzy Engel',
    category: CommentaryCategory.TACTICS,
    conditions: { importanceTier: 4 },
    text: 'Mecze o takim ciężarze gatunkowym wygrywa się w głowach, ale plan taktyczny musi być egzekwowany z chirurgiczną precyzją od pierwszej minuty. Drużyna {HOME} ma tę niesamowitą zdolność do wypracowywania przewagi w bocznych sektorach boiska, gdzie ich dynamiczni skrzydłowi potrafią zdziałać cuda. Z kolei {AWAY} to monolit w defensywie, ekipa, która potrafi cierpieć na własnej połowie i czekać na ten jeden, jedyny błąd przeciwnika, by zadać zabójczy cios. Kluczowym pojedynkiem będzie starcie napastników gospodarzy z parą stoperów gości, którzy są niezwykle silni w powietrzu, ale mają pewne problemy przy niskim pressingu. Musimy pamiętać, że w takich spotkaniach stałe fragmenty gry mogą okazać się kluczem do sukcesu, a obie ekipy mają w swoich szeregach specjalistów od rzutów wolnych. Spodziewam się, że początek będzie bardzo ostrożny, nikt nie zechce się odkryć zbyt wcześnie, by nie narazić się na szybką kontrę. To będzie prawdziwy test dojrzałości dla obu tych zespołów, które aspirują do gry o najwyższe laury w tym sezonie.'
  },
  {
    id: 'form_001',
    speaker: 'Artur Wichniarek',
    category: CommentaryCategory.FORM,
    conditions: {},
    text: 'Analizując ostatnie pięć spotkań {HOME}, widać wyraźny trend wznoszący, szczególnie jeśli chodzi o skuteczność pod bramką rywala. Ich napastnik jest w gazie, strzela niemal w każdym meczu i widać, że koledzy z drużyny szukają go w każdej możliwej sytuacji w polu karnym. Z drugiej strony mamy {AWAY}, zespół który ostatnio przechodził mały kryzys, ale zwycięstwo w poprzedniej kolejce mogło podziałać na nich bardzo oczyszczająco. Tabela nie kłamie, różnica punktowa jest minimalna, co tylko podgrzewa atmosferę przed tym derbowym wręcz starciem o dominację w regionie. Goście muszą poprawić grę w defensywie, bo tracenie bramek po prostych błędach indywidualnych stało się ich zmorą w tym miesiącu. Jeśli gospodarze narzucą swoje tempo od początku, to ekipa przyjezdna może mieć bardzo długi i bolesny wieczór. Widzę tu jednak szansę dla {AWAY} w kontrataku, bo obrona gospodarzy często zostawia zbyt dużo wolnej przestrzeni za plecami przy ataku pozycyjnym.'
  },
  {
    id: 'inj_001',
    speaker: 'Jerzy Brzęczek',
    category: CommentaryCategory.INJURIES,
    conditions: { underdog: true },
    text: 'Sytuacja kadrowa gospodarzy jest daleka od idealnej, brak dwóch kluczowych ogniw w środku pola może kompletnie rozsypać ich dotychczasową strategię. To jest szansa dla zawodników z szerokiego składu, aby udowodnić, że zasługują na regularną grę w pierwszej jedenastce, choć presja jest ogromna. {AWAY} z kolei przyjeżdża w najsilniejszym zestawieniu, co stawia ich w roli naturalnego faworyta, mimo że grają na wyjeździe. Często jednak bywa tak, że drużyna osłabiona kontuzjami potrafi się niesamowicie zmobilizować i wykrzesać z siebie dodatkowe pokłady energii. Kluczowe będzie, jak zmiennicy wejdą w mecz, bo tempo na pewno będzie bardzo wysokie od samego początku spotkania. Muszą uważać na urazy przeciążeniowe, bo przy takim obciążeniu meczowym widać, że niektórym zawodnikom brakuje już tej świeżości. Liczę na mądre zarządzanie zmianami przez trenera {HOME}, bo to może być decydujące w ostatnim kwadransie.'
  },
  {
    id: 'ref_001',
    speaker: 'Witt Żelasko',
    category: CommentaryCategory.REFEREE,
    conditions: {},
    text: 'Dzisiejszy sędzia, pan {REF_NAME}, to arbiter z ogromnym doświadczeniem, który nie boi się podejmować trudnych decyzji pod presją trybun. Ma on jednak swoją specyfikę – pozwala na bardzo agresywną grę w kontakcie, co może być wodą na młyn dla fizycznie grającej ekipy {HOME}. Zawodnicy {AWAY} muszą uważać na niepotrzebne dyskusje, bo pan arbiter bywa bardzo surowy, jeśli chodzi o dyscyplinę na boisku i szybko sięga po żółte kartki. Statystyki pokazują, że w meczach prowadzonych przez tego sędziego rzadko dochodzi do pomyłek w polu karnym, co daje nam nadzieję na sprawiedliwe rozstrzygnięcie. Ważne, aby kapitanowie obu drużyn od początku nawiązali z nim dobry dialog, aby tonować nastroje w gorących momentach. Spodziewam się twardej walki, ale mam nadzieję, że pan sędzia zapanuje nad widowiskiem i nie będzie muiał kraść show głównym aktorom. Trzeba też zwrócić uwagę na współpracę z asystentami, bo przy tak szybkich skrzydłowych milimetry mogą decydować o spalonych.'
  },
  {
    id: 'pred_001',
    speaker: 'Andrzej Juskowiak',
    category: CommentaryCategory.PREDICTION,
    conditions: {},
    text: 'Moim zdaniem zobaczymy dzisiaj mecz dwóch różnych połówek, gdzie w pierwszej części obie ekipy będą się bardzo uważnie badać. {HOME} ma atut własnego boiska i to oni będą chcieli dyktować warunki, ale {AWAY} to mistrzowie cierpliwości i wyczekiwania na błąd. Stawiam na minimalne zwycięstwo gospodarzy, może 1:0, po jakimś stałym fragmencie gry lub błysku indywidualnym ich gwiazdy. Goście na pewno tanio skóry nie sprzedadzą, będą walczyć o każdy metr, ale brak im ostatnio tej "kropki nad i" w wykończeniu akcji. Kluczowe będzie pierwsze 15 minut drugiej połowy – jeśli wtedy nie padnie bramka, to mecz może otworzyć się dopiero w samej końcówce. Nie wykluczam też scenariusza z remisem, co obie ekipy mogłyby przyjąć z pewnym niedosytem, ale szacunkiem do rywala. To będzie wielki wieczór polskiej piłki i niech wygra po prostu lepszy zespół, który pokaże więcej charakteru na murawie.'
  },
  {
    id: 'pred_002',
    speaker: 'Mateusz Borek',
    category: CommentaryCategory.PREDICTION,
    conditions: { importanceTier: 5 },
    text: 'Kończąc nasze rozważania przed pierwszym gwizdkiem, muszę powiedzieć, że czuję w powietrzu coś wielkiego, co zapamiętamy na lata. To jest starcie tytanów, gdzie każda sekunda dekoncentracji może kosztować utratę marzeń o trofeum, o którym obie ekipy tak głośno marzą. Moje serce podpowiada otwartą wymianę ciosów, bo przy takiej jakości w ofensywie po prostu nie da się grać na 0:0 przez cały mecz. Liczę na to, że {HOME} pociągnie ten wózek siłą swoich kibiców, ale {AWAY} ma w sobie ten gen zwycięzcy, który ujawnia się w najtrudniejszych momentach. Typuję wynik 2:1, z dużą ilością dramaturgii, może nawet jakąś kontrowersją, która będzie tematem rozmów przez najbliższy tydzień. Cieszmy się tym momentem, bo polska liga potrafi pisać scenariusze, których nie powstydziłby się sam Alfred Hitchcock. Za chwilę oddajemy głos komentatorom na stanowiskach, bądźcie z nami, bo to będzie prawdziwy rollercoaster emocji!'
  }
];

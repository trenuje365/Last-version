import { Club, Player, MailMessage, MailType, Fixture, MatchStatus, HealthStatus, InjurySeverity, RetirementInfo } from '../types';
import { MAIL_TEMPLATES, MailTemplate } from '../data/mail_templates_pl';

export interface SeasonSummaryData {
  year: number;
  championName: string;
  promotions: { from: string, to: string, teams: string[] }[];
  relegations: { from: string, to: string, teams: string[] }[];
  leagueAwards: {
    leagueName: string;
    topScorer: { name: string, goals: number };
    topAssistant: { name: string, assists: number };
  }[];
}

export const MailService = {
  
  /**
   * Generuje wiadomość powitalną od zarządu na start kariery.
   */
  generateWelcomeMail: (userClub: Club, squad: Player[]): MailMessage => {
    const topPlayers = [...squad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 15);
    const avgSquadOvr = topPlayers.reduce((acc, p) => acc + p.overallRating, 0) / topPlayers.length;

    let tierBaseline = 60;
    if (userClub.leagueId === 'L_PL_1') tierBaseline = 66;
    else if (userClub.leagueId === 'L_PL_2') tierBaseline = 59;
    else if (userClub.leagueId === 'L_PL_3') tierBaseline = 52;

    const strengthFactor = (avgSquadOvr / tierBaseline) * 5; 
    const expectationIndex = (userClub.reputation * 0.3) + (strengthFactor * 0.7);

    const isTopTier = userClub.leagueId === 'L_PL_1';
    let targetLeagueName = "wyższej ligi";
    if (userClub.leagueId === 'L_PL_2') targetLeagueName = "Ekstraklasy";
    if (userClub.leagueId === 'L_PL_3') targetLeagueName = "1. Ligi";

    let templateId = 'board_welcome_mid';
    if (expectationIndex >= 7.6) {
      templateId = isTopTier ? 'board_welcome_elite' : 'board_welcome_elite_promotion';
    } else if (expectationIndex >= 6.1) {
      templateId = isTopTier ? 'board_welcome_pro' : 'board_welcome_pro_promotion';
    } else if (expectationIndex <= 4.0) {
      templateId = 'board_welcome_relegation';
    }

    const template = MAIL_TEMPLATES.find(t => t.id === templateId)!;
    
    return {
      id: `WELCOME_MAIL_${Date.now()}`,
      sender: template.sender,
      role: template.role,
      subject: template.subject.replace('{CLUB}', userClub.name).replace('{TARGET_LEAGUE}', targetLeagueName),
      body: template.body.replace('{CLUB}', userClub.name).replace('{TARGET_LEAGUE}', targetLeagueName),
      date: new Date(),
      isRead: false,
      type: template.type,
      priority: 100
    };
  },
/**
   * Generuje wiadomość powitalną od Stowarzyszenia Kibiców z analizą składu.
   */
  generateFanWelcomeMail: (userClub: Club, squad: Player[]): MailMessage => {
    // Obliczamy średnią 15 najlepszych zawodników
    const topPlayers = [...squad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 15);
    const avgSquadOvr = topPlayers.reduce((acc, p) => acc + p.overallRating, 0) / topPlayers.length;

    // Progi ligowe dla kibiców (Ekstraklasa: 66, 1. Liga: 59, 2. Liga: 52)
    let tierBaseline = 52;
    if (userClub.leagueId === 'L_PL_1') tierBaseline = 66;
    else if (userClub.leagueId === 'L_PL_2') tierBaseline = 59;

    const needsTransfers = avgSquadOvr < tierBaseline;
    const transferDemand = needsTransfers 
      ? "Niepokoi nas jednak głębia składu. Przy obecnych brakach kadrowych ciężko będzie o stabilne wyniki – liczymy, że jeszcze w tym oknie transferowym sprowadzi Pan kogoś, kto realnie podniesie jakość tej drużyny."
      : "Patrząc na chłopaków w szatni, wierzymy, że ta grupa pod Pana wodzą może zwojować tę ligę bez większych posiłków.";

    const template = MAIL_TEMPLATES.find(t => t.id === 'fans_welcome')!;
    
    return {
      id: `FAN_WELCOME_${Date.now()}`,
      sender: template.sender,
      role: template.role,
      subject: template.subject,
      body: template.body
        .replace('{CLUB}', userClub.name)
        .replace('{TRANSFER_DEMAND}', transferDemand),
      date: new Date(),
      isRead: false,
      type: template.type,
      priority: 90
    };
  },

  generateBoardDecisionMail: (player: Player, club: Club, decision: {status: string, reason: string, woz: number}): MailMessage => {
    let templateId = 'board_bie_approved';
    if (decision.status === 'VETO' || decision.status === 'SOFT_BLOCK') templateId = 'board_bie_veto';
    
    return MailService.createFromTemplate(templateId, {
      'PLAYER': `${player.firstName} ${player.lastName}`,
      'CLUB': club.name
    });
  },

  /**
   * Generuje wielki raport podsumowujący miniony sezon.
   */
generateSeasonSummaryMail: (data: SeasonSummaryData): MailMessage => {
    const separator = "------------------------------------------";
    const seasonLabel = `${data.year}/${(data.year + 1).toString().slice(2)}`;
    
    let body = `Szanowny Panie Managerze, \r\n\r\n Sezon ${seasonLabel} Przedstawiamy Panu raport z zakończenia ubiegłego sezonu:\r\n`;
    
    body += `🏆 MISTRZ POLSKI: ${data.championName.toUpperCase()}\n`;
    body += `${separator}\r\n`;
    
    body += `📈 AWANSOWALI :\r\n`;
    if (data.promotions.length > 0) {
      data.promotions.forEach(p => {
        body += `• ${p.to}: ${p.teams.join(', ')}\r\n`;
      });
    } else {
      body += `• Brak awansów (najwyższy szczebel)\r\n`;
    }
    body += `\n`;
    
    body += `📉 SPADKOWICZE :\r\n`;
    data.relegations.forEach(r => {
      body += `• Z ${r.from}: ${r.teams.join(', ')}\r\n`;
    });
    body += `\n${separator}\n\n`;
    
    body += `⚽ ZŁOTE BUTY - NAGRODY INDYWIDUALNE:\r\n`;
    data.leagueAwards.forEach(a => {
      body += `[${a.leagueName.toUpperCase()}]\n`;
      body += `  🎯 Król Strzelców: ${a.topScorer.name} (${a.topScorer.goals} goli)\\r\n`;
      body += `  👟 Król Asyst:    ${a.topAssistant.name} (${a.topAssistant.assists} asyst)\r\n`;
    });

    body += `${separator}\r\n`;
    body += `Zarząd oraz kibice dziękują za emocje dostarczone w ubiegłym sezonie. \r\n Teraz czas na nowe wyzwania.`;

    return {
      id: `SEASON_SUMMARY_${data.year}`,
      sender: 'Polska Liga Futbolu',
      role: 'PZPM',
      subject: `OFICJALNY RAPORT: Podsumowanie Sezonu ${seasonLabel}`,
      body: body,
      date: new Date(data.year + 1, 5, 30),
      isRead: false,
      type: MailType.SYSTEM,
      priority: 150
    };
  },

generateCupFinalMail: (homeName: string, awayName: string, score: string, userTeamId: string | null, winnerId: string): MailMessage => {
    const isUserHome = homeName === userTeamId;
    const isUserWinner = winnerId === userTeamId;
    const isUserInFinal = homeName === userTeamId || awayName === userTeamId;

    let templateId = 'system_cup_news';
    let replacements: Record<string, string> = {
      'WINNER': winnerId === homeName ? homeName : awayName,
      'LOSER': winnerId === homeName ? awayName : homeName,
      'SCORE': score
    };

    if (isUserInFinal) {
      templateId = isUserWinner ? 'board_cup_victory' : 'board_cup_final_loss';
      replacements = {
        'CLUB': userTeamId || '',
        'OPPONENT': isUserHome ? awayName : homeName
      };
    }

    const template = MAIL_TEMPLATES.find(t => t.id === templateId)!;
    let body = template.body;
    let subject = template.subject;

    Object.entries(replacements).forEach(([key, val]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      body = body.replace(regex, val);
      subject = subject.replace(regex, val);
    });

    return {
      id: `CUP_FINAL_${Date.now()}`,
      sender: template.sender,
      role: template.role,
      subject: subject,
      body: body,
      date: new Date(),
      isRead: false,
      type: template.type,
      priority: 150
    };
  },

  generateSuperCupMail: (winnerName: string, opponentName: string, score: string): MailMessage => {
    return MailService.createFromTemplate('board_supercup_win', { 
      'CLUB': winnerName, 
      'OPPONENT': opponentName, 
      'SCORE': score,
      'BONUS': '250 000' 
    });
  },

  generateSuperCupLossMails: (userClub: Club, opponentName: string, userScore: number, oppScore: number): MailMessage[] => {
    const isPenaltyShootout = userScore === oppScore; 
    const diff = isPenaltyShootout ? 1 : (oppScore - userScore);
    const scoreStr = `${userScore}:${oppScore}`;
    const mails: MailMessage[] = [];

    let boardTemplate = 'board_supercup_loss_1';
    let poolIndex = 0; 

    if (diff === 1) {
      boardTemplate = 'board_supercup_loss_1';
      poolIndex = 0;
    } else if (diff === 2) {
      boardTemplate = 'board_supercup_loss_2';
      poolIndex = 1;
    } else if (diff === 3) {
      boardTemplate = 'board_supercup_loss_3';
      poolIndex = 2;
    } else {
      boardTemplate = 'board_supercup_loss_high';
      poolIndex = 3;
      mails.push(MailService.createFromTemplate('fans_supercup_furious', { 'CLUB': userClub.name }));
    }

    mails.push(MailService.createFromTemplate(boardTemplate, { 'CLUB': userClub.name, 'SCORE': scoreStr, 'OPPONENT': opponentName }));

    const pools = [
 [
  "Minimalna porażka po bardzo wyrównanym spotkaniu, w którym {CLUB} przez większość czasu dotrzymywał kroku rywalom. O losach Superpucharu zadecydował jeden moment dekoncentracji w końcówce, który został natychmiast bezlitośnie wykorzystany. Media podkreślają jednak, że styl gry i organizacja zespołu dają solidne podstawy do optymizmu na przyszłość.",
  "Jedna bramka przesądziła o wyniku, choć przebieg meczu absolutnie nie wskazywał na wyraźną przewagę którejkolwiek ze stron. Zespół {CLUB} stworzył sobie kilka sytuacji, ale zabrakło chłodnej głowy przy wykończeniu. Prasa pisze o straconej szansie, lecz jednocześnie chwali charakter i intensywność gry.",
  "Spotkanie mogło zakończyć się w każdą stronę, bo oba zespoły grały odważnie i z dużą determinacją. Ostatecznie to rywale zachowali więcej spokoju w kluczowym fragmencie meczu. Dla {CLUB} to bolesna, ale pouczająca lekcja na starcie sezonu.",
  "Trener może mieć mieszane uczucia po końcowym gwizdku. Z jednej strony wynik boli, z drugiej postawa drużyny pokazuje, że fundamenty pod dobry sezon są już widoczne. Jeden błąd zadecydował o utracie trofeum, ale ogólny obraz gry napawa umiarkowanym optymizmem.",
  "Jednobramkowa porażka to najniższy możliwy wymiar kary w tak prestiżowym meczu. {CLUB} nie był zespołem gorszym, lecz mniej skutecznym w decydujących momentach. Komentatorzy zgodnie twierdzą, że przy odrobinie szczęścia wynik mógłby wyglądać zupełnie inaczej."
],
[
  "Dwie stracone bramki obnażyły problemy {CLUB} w defensywie i organizacji gry w kluczowych fazach spotkania. Przez długie fragmenty mecz był wyrównany, jednak rywale potrafili lepiej wykorzystać swoje okazje. Eksperci mówią o potrzebie szybkich korekt przed startem rozgrywek ligowych.",
  "Porażka różnicą dwóch goli pokazuje, że drużynie wciąż brakuje automatyzmów i odpowiedniego zgrania formacji. Kilka prostych strat i spóźnione reakcje w obronie kosztowały utratę kontroli nad meczem. Sztab szkoleniowy ma materiał do poważnej analizy.",
  "Faworyci wygrali w sposób spokojny i dość kontrolowany, nie pozwalając {CLUB} na rozwinięcie skrzydeł. Choć momentami widać było ambicję i wolę walki, brakowało konkretów pod bramką rywala. Media określają ten wynik jako solidne ostrzeżenie przed nadchodzącym sezonem.",
  "Dwubramkowa porażka to sygnał, że projekt sportowy jest wciąż w fazie budowy. Zespół miał swoje momenty, ale brak konsekwencji i koncentracji w obronie przesądził o losach trofeum. Trener podkreśla potrzebę cierpliwości i dalszej pracy nad strukturą gry.",
  "Superpuchar uciekł, bo rywale byli dziś dojrzalsi taktycznie i bardziej bezwzględni w polu karnym. {CLUB} zaprezentował się poprawnie, lecz bez błysku, który pozwoliłby przechylić szalę zwycięstwa. Prasa mówi o wyniku sprawiedliwym, choć nie druzgocącym."
],
[
  "Trzy stracone gole wywołały pierwszą falę poważnych wątpliwości wobec nowego szkoleniowca. Drużyna wyglądała na zagubioną taktycznie i nie potrafiła zareagować na zmiany w grze rywali. Eksperci zaczynają zadawać pytania, czy obrany kierunek rozwoju jest właściwy.",
  "Styl gry {CLUB} w tym meczu był daleki od oczekiwań kibiców i komentatorów. Brak spójnego planu, chaos w ustawieniu i bierna postawa w defensywie doprowadziły do wysokiej porażki. W studiach telewizyjnych coraz głośniej mówi się o presji, która szybko zaczyna ciążyć na trenerze.",
  "Różnica trzech bramek to już nie przypadek, a wyraźny sygnał alarmowy. Zespół sprawiał wrażenie nieprzygotowanego do gry o stawkę, a reakcje z ławki były spóźnione i nieskuteczne. Dziennikarze zastanawiają się, czy ten projekt ma solidne fundamenty.",
  "Porażka obnażyła braki zarówno w przygotowaniu fizycznym, jak i mentalnym drużyny. {CLUB} nie potrafiła podnieść się po stracie pierwszego gola, a kolejne ciosy tylko pogłębiały chaos. Coraz częściej pojawiają się głosy o potrzebie szybkiej korekty kursu.",
  "To był mecz, który zamiast nadziei przyniósł niepokój. Trzy stracone bramki i brak wyraźnej reakcji zespołu sprawiły, że atmosfera wokół trenera stała się wyraźnie cięższa. Eksperci nie wykluczają, że kolejne spotkania będą dla niego prawdziwym testem przetrwania."
],
[
  "To była prawdziwa katastrofa i jeden z najbardziej bolesnych występów {CLUB} w ostatnich latach. Drużyna została całkowicie zdominowana i nie była w stanie nawiązać równorzędnej walki. Kibice opuszczali stadion w ciszy, a media mówią o kompromitacji na wszystkich płaszczyznach.",
  "Wysoka porażka w Superpucharze miała znamiona sportowej egzekucji. Chaos w obronie, brak organizacji i bezradność w ataku sprawiły, że wynik szybko wymknął się spod kontroli. Komentatorzy nie mają wątpliwości, że to jeden z najgorszych debiutów trenerskich ostatniej dekady.",
  "Rywal zrobił z {CLUB} wszystko, co chciał, a różnica klas była widoczna gołym okiem. Zespół nie potrafił odpowiedzieć ani taktycznie, ani mentalnie, co tylko pogłębiało rozmiary klęski. Prasa pisze o wstrząsie, który może mieć długofalowe konsekwencje.",
  "To spotkanie przejdzie do historii jako symbol totalnego rozkładu gry i braku przygotowania. Każda formacja zawiodła, a błędy indywidualne mnożyły się z minuty na minutę. W klubie zapowiada się gorący okres pełen trudnych rozmów i decyzji.",
  "Kompromitacja była pełna i bezdyskusyjna. {CLUB} został rozbity zarówno piłkarsko, jak i mentalnie, nie pokazując ani charakteru, ani planu na odwrócenie losów meczu. Eksperci mówią wprost: taki występ wymaga natychmiastowej reakcji władz klubu."
]
    ];

    const randomComment = pools[poolIndex][Math.floor(Math.random() * 5)];
    const processedComment = randomComment.replace(/{CLUB}/g, userClub.name);

    mails.push(MailService.createFromTemplate('media_supercup_news', { 
      'CLUB': userClub.name, 
      'MEDIA_COMMENT': processedComment 
    }));

    return mails;
  },

createFromTemplate: (templateId: string, replacements: Record<string, string>): MailMessage => {
    const template = MAIL_TEMPLATES.find(t => t.id === templateId)!;
    let body = template.body;
    let subject = template.subject;

    const clubName = replacements['CLUB'] || "";
    
    const finalReplacements = { ...replacements };
    Object.entries(finalReplacements).forEach(([key, val]) => {
      if (typeof val === 'string') {
        finalReplacements[key] = val.replace(/{CLUB}/g, clubName);
      }
    });

    Object.entries(finalReplacements).forEach(([key, val]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      body = body.replace(regex, val);
      subject = subject.replace(regex, val);
    });

    return {
      id: `${templateId}_${Date.now()}_${Math.random()}`,
      sender: template.sender,
      role: template.role,
      subject,
      body,
      date: new Date(),
      isRead: false,
      type: template.type,
      priority: 85
    };
  },

generateRetirementReportMail: (retirements: RetirementInfo[], clubName: string): MailMessage => {
    const title = `Raport Kadry ${clubName}`;
    let body = `Szanowny Panie,\r\n Następujący zawodnicy postanowili zakończyć kariery oraz listę młodych talentów z naszej Akademii, którzy zostali włączeni do kadry w ich miejsce:\n\n`;

    if (retirements.length === 0) {
      body += "Po ostatnim sezonie, żaden z piłkarzy naszej kadry nie zakończył kariery.";
    } else {
      retirements.forEach(r => {
        body += `🎖️ ${r.oldPlayerName} (${r.oldPlayerAge} lat) - Zakończył karierę.\n`;
        body += `🌱 Zastąpił go: ${r.newPlayerName} (Potencjał OVR: ${r.newPlayerOverall})\r\n`;
      });
    }

    body += `\nŻyczymy powodzenia w pracy z nowymi zawodnikami!\n\nDyrektor Sportowy`;

    return {
      id: `RETIREMENT_${Date.now()}`,
      sender: 'Dyrektor Sportowy',
      role: 'Sztab Szkoleniowy',
      subject: title,
      body: body,
      date: new Date(),
      isRead: false,
      type: MailType.STAFF,
      priority: 95
    };
  },

 generateCoachFiredMail: (clubName: string, coachName: string, rank: number): MailMessage => {
    return MailService.createFromTemplate('media_coach_fired', {
      'CLUB': clubName,
      'COACH': coachName,
      'RANK': rank.toString()
    });
  },

  generateBoardWarningMail: (rank: number): MailMessage => {
    return MailService.createFromTemplate('board_coach_warning', {
      'RANK': rank.toString()
    });
  },

  /**
   * Codzienne generowanie poczty z zachowaniem logiki realizmu futbolowego.
   */
  generateDailyMails: (
    currentDate: Date, 
    userClub: Club, 
    allPlayers: Record<string, Player[]>, 
    allClubs: Club[],
    rank: number, 
    boardConfidence: number,
    recentFixture?: Fixture
  ): MailMessage[] => {
    const newMails: MailMessage[] = [];
    const played = userClub.stats.played;
    const userSquad = allPlayers[userClub.id] || [];

    const createMail = (templateId: string, replacements: Record<string, string> = {}): MailMessage => {
      const template = MAIL_TEMPLATES.find(t => t.id === templateId) || MAIL_TEMPLATES[0];
      let body = template.body;
      let subject = template.subject;
      
      Object.entries(replacements).forEach(([key, val]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        body = body.replace(regex, val);
        subject = subject.replace(regex, val);
      });

      return {
        id: `MAIL_${currentDate.getTime()}_${templateId}_${Math.random()}`,
        sender: template.sender,
        role: template.role,
        subject: subject,
        body: body,
        date: new Date(currentDate),
        isRead: false,
        type: template.type,
        priority: template.type === MailType.BOARD ? 10 : 5
      };
    };

    if (recentFixture && recentFixture.status === MatchStatus.FINISHED) {
       const isUserHome = recentFixture.homeTeamId === userClub.id;
       const userScore = isUserHome ? recentFixture.homeScore : recentFixture.awayScore;
       const oppScore = isUserHome ? recentFixture.awayScore : recentFixture.homeScore;

       if (userScore !== null && oppScore !== null) {
          if (userScore >= 4 && userScore > oppScore) {
             newMails.push(createMail('board_high_win_praise', { 'CLUB': userClub.name }));
          }
          else if (userScore >= 4 && userScore < oppScore) {
             newMails.push(createMail('fans_bitter_loss_high_score', { 'CLUB': userClub.name }));
          }
          else if (oppScore - userScore >= 3) {
             newMails.push(createMail('fans_furious_loss', { 'CLUB': userClub.name }));
          }
       }
    }

    const rng = Math.random();

    if (played >= 3) {
       const expectedRank = Math.max(1, 19 - userClub.reputation);
       
       if (rng < 0.15) {
          if (rank <= expectedRank - 3) {
             newMails.push(createMail('board_excellent_position', { 'CLUB': userClub.name }));
          } else if (rank >= expectedRank + 5) {
             newMails.push(createMail('board_bad_position', { 'CLUB': userClub.name }));
          }
       }

       if (boardConfidence < 35 && rng < 0.2) {
          newMails.push(createMail('board_losing_streak', { 'CLUB': userClub.name }));
       } else if (boardConfidence > 85 && rng < 0.1) {
          newMails.push(createMail('board_winning_streak', { 'CLUB': userClub.name }));
       }
    }

    if (rng < 0.2) {
       const leagueId = userClub.leagueId;
       const otherClubs = allClubs.filter(c => c.leagueId === leagueId && c.id !== userClub.id);
       
       let victim: Player | null = null;
       let victimClub: Club | null = null;

       for (const club of otherClubs) {
          const squad = allPlayers[club.id] || [];
          const injuredStar = squad.find(p => 
            p.health.status === HealthStatus.INJURED && 
            p.health.injury?.severity === InjurySeverity.SEVERE &&
            p.overallRating >= 75
          );
          if (injuredStar) {
            victim = injuredStar;
            victimClub = club;
            break;
          }
       }

       if (victim && victimClub) {
          newMails.push(createMail('media_league_star_injured', {
             'PLAYER': victim.lastName,
             'OTHER_CLUB': victimClub.name,
             'DAYS': victim.health.injury?.daysRemaining.toString() || '30'
          }));
       }
    }

    const overworkedPlayer = userSquad.find(p => p.condition < 55 && p.overallRating > 60);
    if (overworkedPlayer && rng < 0.3) {
       newMails.push(createMail('staff_fatigue_warning', { 
         'PLAYER': overworkedPlayer.lastName 
       }));
    }

    const severeInjury = userSquad.find(p => p.health.status === HealthStatus.INJURED && p.health.injury?.severity === InjurySeverity.SEVERE && p.health.injury.daysRemaining >= 12);
    if (severeInjury && rng < 0.15) {
       newMails.push(createMail('staff_severe_injury', { 
         'PLAYER': severeInjury.lastName, 
         'DAYS': severeInjury.health.injury?.daysRemaining.toString() || '30' 
       }));
    }

    return newMails;
  }
};
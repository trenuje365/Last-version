
import { PreMatchContext, StudioLine, CommentaryCategory, Referee } from '../types';
import { PREMATCH_COMMENTARY_DB, CommentaryTemplate } from '../data/prematch_commentary_pl';

const HOSTS = ['Mateusz Borek', 'Tomasz Smokowski', 'Tomasz Twarowski'];
const GUESTS = [
  'Andrzej Juskowiak', 'Tomasz Hajto', 'Andrzej Strejlau', 
  'Jerzy Brzęczek', 'Witt Żelasko', 'Artur Wichniarek', 'Jerzy Engel'
];

export const CommentarySelectionEngine = {
  
  selectLines: (context: PreMatchContext, homeName: string, awayName: string, ref: Referee): StudioLine[] => {
    const transcript: StudioLine[] = [];
    
    // 1. Pick Studio Cast
    const host = HOSTS[Math.floor(Math.random() * HOSTS.length)];
    const guest1 = GUESTS[Math.floor(Math.random() * GUESTS.length)];
    let guest2 = GUESTS[Math.floor(Math.random() * GUESTS.length)];
    while (guest2 === guest1) {
      guest2 = GUESTS[Math.floor(Math.random() * GUESTS.length)];
    }

    const cast = [
      { name: host, role: 'HOST' },
      { name: guest1, role: 'GUEST' },
      { name: guest2, role: 'GUEST' }
    ];

    // 2. Helper to get text for a specific persona
    const getLine = (speaker: string, categories: CommentaryCategory[]): string => {
      const pool = PREMATCH_COMMENTARY_DB.filter(t => 
        categories.includes(t.category) && 
        (t.conditions.underdog === undefined || t.conditions.underdog === context.underdogFlag)
      );
      
      const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : PREMATCH_COMMENTARY_DB[0];
      
      return pick.text
        .replace(/{HOME}/g, homeName)
        .replace(/{AWAY}/g, awayName)
        .replace(/{REF_NAME}/g, `${ref.firstName} ${ref.lastName}`);
    };

    // 3. Assemble Broadcast Flow
    // Segment 1: Host Intro
    transcript.push({
      speaker: host,
      category: CommentaryCategory.INTRO,
      text: getLine(host, [CommentaryCategory.INTRO])
    });

    // Segment 2: Guest 1 - Tactics/Form
    transcript.push({
      speaker: guest1,
      category: CommentaryCategory.TACTICS,
      text: getLine(guest1, [CommentaryCategory.TACTICS, CommentaryCategory.FORM])
    });

    // Segment 3: Guest 2 - Players/Weather/Ref
    transcript.push({
      speaker: guest2,
      category: CommentaryCategory.KEY_PLAYERS,
      text: getLine(guest2, [CommentaryCategory.KEY_PLAYERS, CommentaryCategory.WEATHER, CommentaryCategory.REFEREE])
    });

    // Segment 4: Predictions/Closing
    transcript.push({
      speaker: host,
      category: CommentaryCategory.PREDICTION,
      text: "Dziękuję panowie za te niezwykle trafne spostrzeżenia. Jak widzimy, fani już nie mogą się doczekać, a atmosfera na stadionie jest po prostu elektryzująca. Czas kończyć nasze studio i oddać głos komentatorom na stanowiskach. Zapraszamy na wielkie emocje!"
    });

    return transcript;
  }
};

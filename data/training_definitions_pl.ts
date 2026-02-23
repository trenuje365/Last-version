import { TrainingCycle } from '../types';

export const TRAINING_CYCLES: TrainingCycle[] = [
  {
    id: 'T_TACTICAL_PERIOD',
    name: 'Periodyzacja Taktyczna',
    description: 'Skupienie na inteligencji boiskowej. Główne wzrosty: Wizja i Ustawianie się. Wsparcie: Podania i Technika. Program o niskim obciążeniu, idealny do stabilizacji formy.',
    icon: '🧠',
    primaryAttributes: ['vision', 'positioning'],
    secondaryAttributes: ['passing', 'technique'],
    fatigueRisk: 0.3
  },
  {
    id: 'T_GEGENPRESSING',
    name: 'Gegenpressing',
    description: 'Ekstremalny nacisk na fizyczność. Główne wzrosty: Kondycja i Szybkość. Wsparcie: Obrona i Siła. UWAGA: Bardzo wysokie ryzyko kontuzji i drenaż energii zawodników.',
    icon: '⚡',
    primaryAttributes: ['stamina', 'pace'],
    secondaryAttributes: ['defending', 'strength'],
    fatigueRisk: 0.9
  },
  {
    id: 'T_TIKI_TAKA',
    name: 'Szkoła Techniczna (Tiki-Taka)',
    description: 'Trening operowania piłką. Główne wzrosty: Podania i Technika. Wsparcie: Drybling i Wizja. Rozwija kreatywność kosztem braku nacisku na parametry siłowe.',
    icon: '👟',
    primaryAttributes: ['passing', 'technique'],
    secondaryAttributes: ['dribbling', 'vision'],
    fatigueRisk: 0.4
  },
  {
    id: 'T_CATENACCIO',
    name: 'Blok Defensywny (Catenaccio)',
    description: 'Włoska szkoła rygoru. Główne wzrosty: Obrona i Siła. Wsparcie: Ustawianie się i Gra głową. Buduje twardą defensywę, zaniedbując rozwój ataku.',
    icon: '🛡️',
    primaryAttributes: ['defending', 'strength'],
    secondaryAttributes: ['positioning', 'heading'],
    fatigueRisk: 0.5
  },
  {
    id: 'T_FINISHING',
    name: 'Instynkt Snajperski',
    description: 'Szlifowanie wykończenia akcji. Główne wzrosty: Wykończenie i Atakowanie. Wsparcie: Technika i Gra głową. Maksymalizuje skuteczność napastników.',
    icon: '🎯',
    primaryAttributes: ['finishing', 'attacking'],
    secondaryAttributes: ['technique', 'heading'],
    fatigueRisk: 0.4
  },
  {
    id: 'T_SAQ',
    name: 'Szybkość i Zwinność (SAQ)',
    description: 'Program Speed, Agility, Quickness. Główne wzrosty: Szybkość i Drybling. Wsparcie: Technika i Kondycja. Kluczowy dla dynamicznych skrzydłowych.',
    icon: '🚀',
    primaryAttributes: ['pace', 'dribbling'],
    secondaryAttributes: ['technique', 'stamina'],
    fatigueRisk: 0.7
  },
  {
    id: 'T_AIR_DOM',
    name: 'Dominacja w Powietrzu',
    description: 'Trening walki o górne piłki. Główne wzrosty: Gra głową i Siła. Wsparcie: Ustawianie się i Obrona. Niezbędny przy taktyce opartej na dośrodkowaniach.',
    icon: '🪂',
    primaryAttributes: ['heading', 'strength'],
    secondaryAttributes: ['positioning', 'defending'],
    fatigueRisk: 0.6
  },
  {
    id: 'T_MODERN_GK',
    name: 'Nowoczesny Bramkarz',
    description: 'Specjalistyczny cykl dla golkiperów. Główne wzrosty: Bramkarstwo i Ustawianie się. Wsparcie: Podania i Wizja (wyprowadzanie piłki).',
    icon: '🧤',
    primaryAttributes: ['goalkeeping', 'positioning'],
    secondaryAttributes: ['passing', 'vision'],
    fatigueRisk: 0.3
  },
  {
    id: 'T_SET_PIECES',
    name: 'Stałe Fragmenty Gry',
    description: 'Dopracowanie schematów. Główne wzrosty: Podania i Gra głową. Wsparcie: Wizja i Wykończenie. Poprawia skuteczność rzutów rożnych i wolnych.',
    icon: '🚩',
    primaryAttributes: ['passing', 'heading'],
    secondaryAttributes: ['vision', 'finishing'],
    fatigueRisk: 0.2
  },
  {
    id: 'T_RECOVERY_YOGA',
    name: 'Odnowa Biologiczna i Joga',
    description: 'Program regeneracyjny. Główne wzrosty: Kondycja (lekko). Wsparcie: Technika. Bonus: Gwarantuje +50% do szybkości regeneracji energii po meczu.',
    icon: '🧘',
    primaryAttributes: ['stamina'],
    secondaryAttributes: ['technique'],
    fatigueRisk: 0.0,
    recoveryBonus: 0.5
  }
];

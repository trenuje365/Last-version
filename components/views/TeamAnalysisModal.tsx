import React from 'react';
import { Club, PlayerPosition } from '../../types';
import bojoPitch from '../../Graphic/themes/bojo.png';
import { TacticRepository } from '../../resources/tactics_db';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { TeamAnalysisReport } from '../../services/TeamAnalysisService';

const POSITION_ORDER: PlayerPosition[] = [
  PlayerPosition.GK,
  PlayerPosition.DEF,
  PlayerPosition.MID,
  PlayerPosition.FWD,
];

const POSITION_TITLES: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'Bramkarze',
  [PlayerPosition.DEF]: 'Obrońcy',
  [PlayerPosition.MID]: 'Pomocnicy',
  [PlayerPosition.FWD]: 'Napastnicy',
};

export const TeamAnalysisModal: React.FC<{
  club: Club;
  report: TeamAnalysisReport;
  onClose: () => void;
}> = ({ club, report, onClose }) => {
  const highlightedNames = getHighlightedNames(report);
  const generatedLabel = new Date(report.generatedAt).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-[1600px] max-h-[92vh] overflow-hidden rounded-[40px] border border-white/15 bg-slate-950/70 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-8 py-6 border-b border-white/10 bg-white/[0.03]">
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at top right, ${club.colorsHex[0]}55 0%, transparent 45%)` }} />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-400">Analiza Drużyny</div>
              <h2 className="text-4xl font-black italic uppercase tracking-tight text-white mt-2">{club.name}</h2>
              <p className="text-sm text-slate-400 mt-3 max-w-3xl">
                Raport wygenerowany {generatedLabel}. {report.injuryRule}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-[0.25em] text-white hover:bg-white/10 transition-all"
            >
              Zamknij
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-110px)] overflow-y-auto custom-scrollbar p-8 space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Raport sztabu</div>
                  <h3 className="text-2xl font-black italic text-white mt-2">ANALIZA ASYSTENTA</h3>
                  <p className="text-xs text-slate-500 mt-1">Raport sporządzony na podstawie dostępnych danych.</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                  Raport
                </div>
              </div>
              <div className="space-y-4 text-[15px] leading-8 text-slate-200">
                {report.commentary.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-slate-200">
                    {renderHighlightedParagraph(paragraph, highlightedNames)}
                  </p>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Analiza Techniki I Treningu</div>
                <div className="space-y-3 text-[15px] leading-7 text-slate-200">
                  {report.trainingAnalysis.summary.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Dostępna Kadra do Taktyki</div>
                <div className="grid grid-cols-2 gap-3">
                  {POSITION_ORDER.map(position => (
                    <div key={position} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(position)}`}>{POSITION_TITLES[position]}</div>
                      <div className="text-3xl font-black italic text-white mt-2">{report.availableCounts[position]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Rekomendowane Ustawienie</div>
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-3xl font-black italic text-white">{report.tacticalRecommendation.tacticName}</h3>
                    <p className="text-sm text-slate-400 mt-2">Najlepsze ustawienie przy obecnej kadrze</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Obsadzone pozycje</div>
                    <div className="text-2xl font-black text-emerald-400">{report.tacticalRecommendation.healthyPoolUsed}/11</div>
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  {report.tacticalRecommendation.reasons.map((reason, index) => (
                    <div key={index} className="text-sm text-slate-300">• {reason}</div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 overflow-hidden">
                  {report.tacticalRecommendation.projectedXI.map((slot) => (
                    <div
                      key={slot.slotIndex}
                      className={`flex items-center justify-between gap-4 px-4 py-3 border-b border-white/8 last:border-b-0 ${getProjectedSlotRowClass(slot.role)}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(slot.role)}`}>
                          {slot.role}
                        </div>
                        <div className="text-[15px] font-medium italic text-white truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
                          {slot.player ? formatPlayerFullName(slot.player) : 'Brak obsady'}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] text-slate-500">
                        {slot.player ? `OVR ${slot.player.overallRating}` : 'Brak pełnej obsady'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Rzuty Karne</div>
              <div className="space-y-4">
                {report.assistantLeaders.penalties.map((entry, index) => (
                  <div key={`penalties_${entry.player.id}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-sm font-black text-amber-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-white font-black italic text-lg">{formatPlayerFullName(entry.player)}</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(entry.player.position)}`}>
                          {entry.player.position}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{entry.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Rzuty Wolne</div>
              <div className="space-y-4">
                {report.assistantLeaders.freeKicks.map((entry, index) => (
                  <div key={`free_kicks_${entry.player.id}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-sm font-black text-sky-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-white font-black italic text-lg">{formatPlayerFullName(entry.player)}</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(entry.player.position)}`}>
                          {entry.player.position}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{entry.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Kandydaci Na Kapitana</div>
              <div className="space-y-4">
                {report.assistantLeaders.captains.map((entry, index) => (
                  <div key={`captains_${entry.player.id}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-white font-black italic text-lg">{formatPlayerFullName(entry.player)}</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(entry.player.position)}`}>
                          {entry.player.position}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{entry.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Rozmowa z analitykiem</div>
                <h3 className="text-2xl font-black italic text-white mt-2">Rekomendacje dotyczące zawodników</h3>
                <p className="text-xs text-slate-500 mt-1">W tej sekcji analityk mówi, co warto zrobić z konkretnymi zawodnikami i dlaczego.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {report.analystNotes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-black italic text-xl">{note.title}</div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-blue-300 mt-1">{note.actionLabel}</div>
                    </div>
                    <div className={`text-[11px] font-black ${PlayerPresentationService.getPositionColorClass(note.player.position)}`}>{note.player.position}</div>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-slate-200">{note.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Mocne i Ważne Ogniwa</div>
              <div className="space-y-4">
                {report.keyPlayers.map((entry) => (
                  <div key={entry.player.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-black italic text-lg">{formatPlayerFullName(entry.player)}</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{entry.label}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-black ${PlayerPresentationService.getPositionColorClass(entry.player.position)}`}>{entry.player.position}</div>
                        <div className="text-xl font-black text-white">{entry.player.overallRating}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      {entry.reasons.map((reason, index) => <div key={index}>• {reason}</div>)}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Status: {entry.availabilityNote}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Zawodnicy, którzy powinni odejść</div>
              <div className="space-y-4">
                {report.exitCandidates.length === 0 && report.exitCandidatesNote ? (
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-[15px] leading-7 text-slate-300">
                    {report.exitCandidatesNote}
                  </div>
                ) : report.exitCandidates.map((entry) => (
                  <div key={entry.player.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-black italic text-lg">{formatPlayerLabel(entry.player)}</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-amber-400">{entry.actionLabel}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Prawd.</div>
                        <div className="text-2xl font-black text-amber-300">{entry.probability}%</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      {entry.reasons.map((reason, index) => <div key={index}>• {reason}</div>)}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">{entry.squadNote}</div>
                  </div>
                ))}
              </div>
            </div>

            {report.contractCases.length > 0 && (
              <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Sprawy Kontraktowe</div>
                <div className="space-y-4">
                  {report.contractCases.map((entry) => (
                    <div key={entry.player.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-black italic text-lg">{formatPlayerLabel(entry.player)}</div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-sky-300">{entry.actionLabel}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Pilność</div>
                          <div className="text-2xl font-black text-sky-200">{entry.urgency}%</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-300">
                        {entry.reasons.map((reason, index) => <div key={index}>• {reason}</div>)}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">{entry.contractNote}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Talenty Pod Opiekę</div>
              <div className="space-y-4">
                {report.talents.map((entry) => (
                  <div key={entry.player.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-black italic text-lg">{formatPlayerLabel(entry.player)}</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">Plan rozwoju</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Talent</div>
                        <div className="text-2xl font-black text-emerald-300">{entry.player.attributes.talent}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-blue-300 font-bold">{entry.developmentPath}</div>
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      {entry.reasons.map((reason, index) => <div key={index}>• {reason}</div>)}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">{entry.warning}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-2">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Alternatywne Systemy</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.alternativeTactics.map((option) => (
                  <div key={option.tacticId} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="text-white font-black italic text-xl">{option.tacticName}</div>
                    <div className="text-sm text-slate-400 mt-1">Opcja rezerwowa</div>
                    <div className="mt-4">
                      <MiniTacticPreview tacticId={option.tacticId} />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      {option.reasons.slice(0, 2).map((reason, index) => <div key={index}>• {reason}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">RAPORT POSZCZEGÓLNYCH POZYCJI</div>
              <div className="space-y-3">
                {POSITION_ORDER.map((position) => {
                  const assessment = getLineAssessment(position, report);

                  return (
                    <div key={position} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                      <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(position)}`}>{POSITION_TITLES[position]}</div>
                      <div className={`text-lg font-black mt-2 ${assessment.textClass}`}>{assessment.label}</div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
                          style={{ width: `${assessment.score}%` }}
                        />
                      </div>
                      <div className="mt-3 text-xs text-slate-400">{assessment.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
      `}</style>
    </div>
  );
};

const formatPlayerFullName = (player: { firstName: string; lastName: string }) =>
  `${player.firstName} ${player.lastName}`;

const MiniTacticPreview: React.FC<{ tacticId: string }> = ({ tacticId }) => {
  const tactic = TacticRepository.getById(tacticId);

  if (!tactic) return null;

  const slotLayouts = getMiniSlotLayouts(tactic.slots);

  return (
    <div className="relative h-48 rounded-[24px] border border-emerald-500/25 shadow-inner overflow-hidden bg-slate-950/50">
      <img
        src={bojoPitch}
        alt="Boisko"
        className="absolute inset-0 h-full w-full object-contain object-bottom"
      />
      <div className="absolute inset-0 bg-slate-950/5" />

      {tactic.slots.map((slot) => (
        <div
          key={`${tactic.id}_${slot.index}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={slotLayouts[slot.index]}
        >
          <div className={`flex h-[18px] w-[18px] min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px] flex-none items-center justify-center overflow-hidden rounded-full border border-white/60 bg-slate-950/85 ${getMiniRoleRingClass(slot.role)}`} />
        </div>
      ))}
    </div>
  );
};

const formatPlayerLabel = (player: { firstName: string; lastName: string; age: number; position: PlayerPosition }) =>
  `${formatPlayerFullName(player)} • ${player.position} • ${player.age} l.`;

const getHighlightedNames = (report: TeamAnalysisReport): string[] => {
  const names = [
    ...report.keyPlayers.map(entry => formatPlayerFullName(entry.player)),
    ...report.exitCandidates.map(entry => formatPlayerFullName(entry.player)),
    ...report.contractCases.map(entry => formatPlayerFullName(entry.player)),
    ...report.talents.map(entry => formatPlayerFullName(entry.player)),
    ...report.analystNotes.map(entry => formatPlayerFullName(entry.player)),
    ...report.assistantLeaders.penalties.map(entry => formatPlayerFullName(entry.player)),
    ...report.assistantLeaders.freeKicks.map(entry => formatPlayerFullName(entry.player)),
    ...report.assistantLeaders.captains.map(entry => formatPlayerFullName(entry.player)),
  ];

  return [...new Set(names)].sort((a, b) => b.length - a.length);
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderHighlightedParagraph = (paragraph: string, names: string[]) => {
  if (names.length === 0) return paragraph;

  const regex = new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'g');
  const parts = paragraph.split(regex);

  return parts.map((part, index) =>
    names.includes(part)
      ? <span key={`${part}_${index}`} className="font-black text-amber-300">{part}</span>
      : <React.Fragment key={`${part}_${index}`}>{part}</React.Fragment>
  );
};

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const getRecentAverageRating = (player: { stats: { ratingHistory?: number[] } }): number | null => {
  const recent = player.stats.ratingHistory?.slice(-5) ?? [];
  return recent.length > 0 ? average(recent) : null;
};

const normalizeOverall = (value: number): number => clamp(((value - 50) / 30) * 100, 0, 100);
const normalizeForm = (value: number): number => clamp(((value - 5.8) / 1.7) * 100, 0, 100);

const getLineAssessment = (position: PlayerPosition, report: TeamAnalysisReport): {
  score: number;
  label: string;
  detail: string;
  textClass: string;
} => {
  const lineSlots = report.tacticalRecommendation.projectedXI.filter(slot => slot.role === position);
  const linePlayers = lineSlots.map(slot => slot.player).filter(Boolean);
  const filledCount = linePlayers.length;
  const totalSlots = lineSlots.length;
  const fillRate = totalSlots === 0 ? 0 : filledCount / totalSlots;
  const avgOverall = average(linePlayers.map(player => player!.overallRating));
  const avgCondition = average(linePlayers.map(player => player!.condition));
  const avgForm = average(linePlayers.map(player => getRecentAverageRating(player!) ?? 6.3));

  const score = Math.round(clamp(
    normalizeOverall(avgOverall) * 0.5 +
    normalizeForm(avgForm) * 0.23 +
    avgCondition * 0.12 +
    fillRate * 100 * 0.15 -
    (totalSlots - filledCount) * 12,
    0,
    100
  ));

  const lineName = position === PlayerPosition.GK
    ? 'Bramka'
    : position === PlayerPosition.DEF
      ? 'Obrona'
      : position === PlayerPosition.MID
        ? 'Pomoc'
        : 'Atak';

  let label = `${lineName} wygląda przeciętnie.`;
  let textClass = 'text-amber-300';

  if (score >= 78) {
    label = `${lineName} wygląda bardzo dobrze.`;
    textClass = 'text-emerald-300';
  } else if (score >= 64) {
    label = `${lineName} wygląda solidnie.`;
    textClass = 'text-lime-300';
  } else if (score >= 50) {
    label = `${lineName} wygląda przeciętnie.`;
    textClass = 'text-amber-300';
  } else {
    label = `${lineName} wymaga poprawy.`;
    textClass = 'text-red-300';
  }

  const detail = totalSlots === 0
    ? 'Ta linia nie jest używana w obecnym ustawieniu.'
    : `Obsada ${filledCount}/${totalSlots}, średni OVR ${avgOverall.toFixed(1)}, forma ${avgForm.toFixed(1)}, kondycja ${Math.round(avgCondition)}%.`;

  return { score, label, detail, textClass };
};

const getMiniRoleRingClass = (position: PlayerPosition): string => {
  switch (position) {
    case PlayerPosition.GK:
      return 'shadow-[0_0_0_1px_rgba(250,204,21,0.45)]';
    case PlayerPosition.DEF:
      return 'shadow-[0_0_0_1px_rgba(59,130,246,0.45)]';
    case PlayerPosition.MID:
      return 'shadow-[0_0_0_1px_rgba(34,197,94,0.45)]';
    case PlayerPosition.FWD:
      return 'shadow-[0_0_0_1px_rgba(239,68,68,0.45)]';
    default:
      return '';
  }
};

const getProjectedSlotRowClass = (position: PlayerPosition): string => {
  switch (position) {
    case PlayerPosition.GK:
      return 'bg-yellow-400/10';
    case PlayerPosition.DEF:
      return 'bg-blue-500/10';
    case PlayerPosition.MID:
      return 'bg-emerald-500/10';
    case PlayerPosition.FWD:
      return 'bg-red-500/10';
    default:
      return 'bg-white/5';
  }
};

const getMiniSlotLayouts = (
  slots: Array<{ index: number; x: number; y: number }>
): Record<number, React.CSSProperties> => {
  const groupedRows = new Map<number, Array<{ index: number; x: number; y: number }>>();

  slots.forEach((slot) => {
    const rowKey = Math.round(slot.y * 100);
    const row = groupedRows.get(rowKey) ?? [];
    row.push(slot);
    groupedRows.set(rowKey, row);
  });

  const layout: Record<number, React.CSSProperties> = {};

  groupedRows.forEach((rowSlots) => {
    const sortedRow = [...rowSlots].sort((leftSlot, rightSlot) => leftSlot.x - rightSlot.x);

    sortedRow.forEach((slot, orderIndex) => {
      const rowCenterOffset = orderIndex - (sortedRow.length - 1) / 2;
      const horizontalOffset = rowCenterOffset * 12;
      const perspectiveWidth = 0.76 - slot.y * 0.16;
      const normalizedX = 0.5 + (slot.x - 0.5) * perspectiveWidth;
      const spreadX = clamp(normalizedX, 0.16, 0.84);
      const shiftedY = clamp(8 + slot.y * 48, 18, 72);
      const goalkeeperOffset = slot.y >= 0.9 ? 40 : 0;
      const defenseOffset = slot.y >= 0.7 && slot.y < 0.9 ? 20 : 0;
      const midfieldOffset = slot.y > 0.25 && slot.y < 0.7 ? -15 : 0;
      const forwardOffset = slot.y <= 0.25 ? -40 : 0;

      layout[slot.index] = {
        left: `calc(${(spreadX * 100).toFixed(2)}% + ${horizontalOffset}px)`,
        top: `calc(${shiftedY}% + ${20 + goalkeeperOffset + defenseOffset + midfieldOffset + forwardOffset}px)`,
      };
    });
  });

  return layout;
};

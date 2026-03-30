import React from 'react';
import { Club, PlayerPosition } from '../../types';
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
                  <h3 className="text-2xl font-black italic text-white mt-2">Podsumowanie raportu</h3>
                  <p className="text-xs text-slate-500 mt-1">Krótki obraz obecnej kadry i głównych problemów zespołu</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                  Raport
                </div>
              </div>
              <div className="space-y-4 text-[15px] leading-8 text-slate-200">
                {report.commentary.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-slate-200">
                    {paragraph}
                  </p>
                ))}
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
                <div className="grid grid-cols-2 gap-2">
                  {report.tacticalRecommendation.projectedXI.map((slot) => (
                    <div key={slot.slotIndex} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                      <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(slot.role)}`}>{slot.role}</div>
                      <div className="text-sm font-black italic text-white mt-2 truncate">{slot.player ? slot.player.lastName : 'Brak obsady'}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{slot.player ? `OVR ${slot.player.overallRating}` : 'Brak pełnej obsady'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Rozmowa z analitykiem</div>
                <h3 className="text-2xl font-black italic text-white mt-2">Konkretne rekomendacje</h3>
                <p className="text-xs text-slate-500 mt-1">Tu są konkretne decyzje przy zawodnikach i krótki powód każdej z nich</p>
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
                        <div className="text-white font-black italic text-lg">{entry.player.lastName}</div>
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
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Słabsi Zawodnicy</div>
              <div className="space-y-4">
                {report.exitCandidates.map((entry) => (
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
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      {option.reasons.slice(0, 2).map((reason, index) => <div key={index}>• {reason}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/45 p-6 xl:col-span-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Ocena Formacji</div>
              <div className="space-y-3">
                {POSITION_ORDER.map((position) => (
                  <div key={position} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                    <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${PlayerPresentationService.getPositionColorClass(position)}`}>{POSITION_TITLES[position]}</div>
                    <div className="text-2xl font-black text-white mt-2">{getLineStrengthLabel(report.tacticalRecommendation.lineStrength[position])}</div>
                  </div>
                ))}
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

const formatPlayerLabel = (player: { firstName: string; lastName: string; age: number; position: PlayerPosition }) =>
  `${player.lastName} • ${player.position} • ${player.age} l.`;

const getLineStrengthLabel = (score: number): string => {
  if (score >= 86) return 'Mocna';
  if (score >= 74) return 'Stabilna';
  if (score >= 62) return 'Średnia';
  return 'Słaba';
};

import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { IncomingOfferStatus, IncomingTransferOffer, Player, ViewState } from '../../types';
import negocjacjeBg from '../../Graphic/themes/negocjacje.png';

const LEAGUES = [
  { id: 'ALL', label: 'WSZYSTKIE' },
  { id: 'L_PL_1', label: 'EKSTRAKLASA' },
  { id: 'L_PL_2', label: 'I LIGA' },
  { id: 'L_PL_3', label: 'II LIGA' },
  { id: 'L_PL_4', label: 'III LIGA' },
  { id: 'REST_WORLD', label: 'RESZTA SWIATA' },
];

const MONTHS_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru'];

const POS_COLOR: Record<string, string> = {
  GK: 'text-yellow-400',
  DEF: 'text-blue-400',
  MID: 'text-emerald-400',
  FWD: 'text-red-400',
};

const isTransferWindowOpen = (currentDate: Date): boolean => {
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const isSummer =
    (month === 6 && day >= 1) ||
    month === 7 ||
    (month === 8 && day <= 8);

  const isWinter =
    (month === 0 && day >= 12) ||
    (month === 1 && day <= 13);

  return isSummer || isWinter;
};

const leagueTag = (leagueId?: string) => {
  if (!leagueId) return '';
  if (leagueId === 'L_PL_1') return 'Ekstraklasa';
  if (leagueId === 'L_PL_2') return 'I Liga';
  if (leagueId === 'L_PL_3') return 'II Liga';
  if (leagueId === 'L_PL_4') return 'III Liga';
  if (leagueId === 'L_CL') return 'Liga Mistrzow';
  if (leagueId === 'L_EL') return 'Liga Europy';
  if (leagueId === 'L_CONF') return 'Liga Konferencji';
  if (leagueId === 'L_SA') return 'Ameryka Poludniowa';
  if (leagueId === 'L_ASIA') return 'Azja';
  if (leagueId === 'L_AFRICA') return 'Afryka';
  if (leagueId === 'L_NA') return 'Ameryka Polnocna';
  return leagueId;
};

const isPolishLeague = (leagueId?: string) => !!leagueId && leagueId.startsWith('L_PL_');

const playerName = (player: Player) => `${player.lastName} ${player.firstName}`;

const formatDate = (date: Date | null) => {
  if (!date) return '---';
  return `${date.getDate()} ${MONTHS_PL[date.getMonth()]} ${date.getFullYear()}`;
};

const shiftDate = (date: Date | null, days: number) => {
  if (!date) return null;
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const formatValue = (value?: number) => {
  if (!value) return '0';
  return value.toLocaleString('pl-PL');
};

const INCOMING_OFFER_PRIORITY: Record<IncomingOfferStatus, number> = {
  [IncomingOfferStatus.AWAITING_CONFIRMATION]: 7,
  [IncomingOfferStatus.AI_COUNTERED]: 6,
  [IncomingOfferStatus.COUNTER_PENDING_AI]: 5,
  [IncomingOfferStatus.NEGOTIATION_IN_PROGRESS]: 4,
  [IncomingOfferStatus.REMINDER_SENT]: 3,
  [IncomingOfferStatus.EMAIL_SENT]: 2,
  [IncomingOfferStatus.COMPLETED]: 1,
  [IncomingOfferStatus.PLAYER_REFUSED]: 1,
  [IncomingOfferStatus.REJECTED_BY_MANAGER]: 1,
  [IncomingOfferStatus.REJECTED_AT_CONFIRM]: 1,
  [IncomingOfferStatus.EXPIRED]: 1,
};

const pickMoreRelevantIncomingOffer = (
  current: IncomingTransferOffer,
  challenger: IncomingTransferOffer
): IncomingTransferOffer => {
  const currentPriority = INCOMING_OFFER_PRIORITY[current.status] ?? 0;
  const challengerPriority = INCOMING_OFFER_PRIORITY[challenger.status] ?? 0;
  if (challengerPriority !== currentPriority) {
    return challengerPriority > currentPriority ? challenger : current;
  }

  if (challenger.negotiationRound !== current.negotiationRound) {
    return challenger.negotiationRound > current.negotiationRound ? challenger : current;
  }

  const currentTime = new Date(current.createdAt).getTime();
  const challengerTime = new Date(challenger.createdAt).getTime();
  if (challengerTime !== currentTime) {
    return challengerTime > currentTime ? challenger : current;
  }

  const currentDisplayedFee = current.status === IncomingOfferStatus.AI_COUNTERED
    ? (current.aiCounterFee ?? current.fee)
    : current.fee;
  const challengerDisplayedFee = challenger.status === IncomingOfferStatus.AI_COUNTERED
    ? (challenger.aiCounterFee ?? challenger.fee)
    : challenger.fee;
  if (challengerDisplayedFee !== currentDisplayedFee) {
    return challengerDisplayedFee > currentDisplayedFee ? challenger : current;
  }

  return challenger.id > current.id ? challenger : current;
};

const mergeIncomingOffersByPair = (offers: IncomingTransferOffer[]): IncomingTransferOffer[] => {
  const merged = new Map<string, IncomingTransferOffer>();

  offers.forEach(offer => {
    const key = `${offer.playerId}::${offer.buyerClubId}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, offer);
      return;
    }

    merged.set(key, pickMoreRelevantIncomingOffer(existing, offer));
  });

  return [...merged.values()];
};

export const TransferNewsView: React.FC = () => {
  const {
    players,
    clubs,
    currentDate,
    navigateTo,
    viewPlayerDetails,
    incomingOffers,
    navigateToIncomingOffer,
    transferNewsActiveTab,
    setTransferNewsActiveTab,
  } = useGame();

  const [leagueFilter, setLeagueFilter] = useState('ALL');
  const [scoutingMarketFilter, setScoutingMarketFilter] = useState<'POLAND' | 'REST_WORLD'>('POLAND');
  const activeTab = transferNewsActiveTab;

  const clubMap = useMemo(() => new Map(clubs.map(club => [club.id, club])), [clubs]);
  const allPlayers = useMemo(() => Object.values(players).flat(), [players]);
  const transferWindowOpen = useMemo(() => isTransferWindowOpen(currentDate), [currentDate]);

  const trsf = useMemo(() => {
    return allPlayers
      .filter(player => player.transferPendingClubId && player.clubId && player.clubId !== 'FREE_AGENTS')
      .map(player => {
        const sellerClub = clubMap.get(player.clubId);
        const buyerClub = clubMap.get(player.transferPendingClubId!);
        return { player, sellerClub, buyerClub };
      })
      .filter(({ sellerClub, buyerClub }) => {
        if (leagueFilter === 'ALL') return true;
        if (leagueFilter === 'REST_WORLD') {
          return !isPolishLeague(sellerClub?.leagueId) && !isPolishLeague(buyerClub?.leagueId);
        }
        return sellerClub?.leagueId === leagueFilter || buyerClub?.leagueId === leagueFilter;
      });
  }, [allPlayers, clubMap, leagueFilter]);

  const freeAgentNeg = useMemo(() => {
    return (players['FREE_AGENTS'] || [])
      .filter(player => player.aiNegotiationClubId)
      .map(player => {
        const buyerClub = clubMap.get(player.aiNegotiationClubId!);
        return { player, buyerClub };
      })
      .filter(({ buyerClub }) => {
        if (leagueFilter === 'ALL') return true;
        if (leagueFilter === 'REST_WORLD') return !isPolishLeague(buyerClub?.leagueId);
        return buyerClub?.leagueId === leagueFilter;
      });
  }, [players, clubMap, leagueFilter]);

  const activeNegotiations = useMemo(() => {
    const transferNegotiations = trsf.map(({ player, sellerClub, buyerClub }) => {
      const expectedResponseDate = player.transferReportDate ? new Date(player.transferReportDate) : null;
      const contractPresentedDate = shiftDate(expectedResponseDate, -3);

      return {
        id: `TRSF_${player.id}`,
        playerId: player.id,
        playerLabel: playerName(player),
        currentClubName: sellerClub?.name ?? 'Bez klubu',
        negotiatingClubName: buyerClub?.name ?? '---',
        contractPresentedDate,
        expectedResponseDate,
      };
    });

    const freeAgentNegotiations = freeAgentNeg.map(({ player, buyerClub }) => {
      const expectedResponseDate = player.aiNegotiationResponseDate ? new Date(player.aiNegotiationResponseDate) : null;
      const contractPresentedDate = shiftDate(expectedResponseDate, -4);

      return {
        id: `FA_${player.id}`,
        playerId: player.id,
        playerLabel: playerName(player),
        currentClubName: 'Bez klubu',
        negotiatingClubName: buyerClub?.name ?? '---',
        contractPresentedDate,
        expectedResponseDate,
      };
    });

    return [...transferNegotiations, ...freeAgentNegotiations].sort((a, b) => {
      const aTime = a.expectedResponseDate?.getTime() ?? 0;
      const bTime = b.expectedResponseDate?.getTime() ?? 0;
      return aTime - bTime;
    });
  }, [freeAgentNeg, trsf]);

  const seasonStart = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return month >= 6 ? new Date(year, 6, 1) : new Date(year - 1, 6, 1);
  }, [currentDate]);

  const scoutingWatch = useMemo(() => {
    return allPlayers
      .filter(player =>
        (player.interestedClubs?.length || 0) > 0 &&
        !player.transferPendingClubId &&
        !player.isOnTransferList &&
        player.clubId &&
        player.clubId !== 'FREE_AGENTS'
      )
      .map(player => {
        const sellerClub = clubMap.get(player.clubId);
        const interestedClubNames = (player.interestedClubs || [])
          .map(clubId => clubMap.get(clubId)?.name)
          .filter(Boolean) as string[];

        return {
          player,
          sellerClub,
          interestedClubIds: player.interestedClubs || [],
          interestedClubNames,
          interestedCount: interestedClubNames.length,
        };
      })
      .filter(({ sellerClub, interestedClubIds, interestedCount }) => {
        if (interestedCount === 0) return false;
        if (leagueFilter === 'ALL') return true;
        if (leagueFilter === 'REST_WORLD') {
          return !isPolishLeague(sellerClub?.leagueId) &&
            interestedClubIds.every(clubId => !isPolishLeague(clubMap.get(clubId)?.leagueId));
        }
        return sellerClub?.leagueId === leagueFilter;
      })
      .sort((a, b) =>
        b.interestedCount - a.interestedCount ||
        b.player.overallRating - a.player.overallRating
      );
  }, [allPlayers, clubMap, leagueFilter]);

  const scoutingEntries = useMemo(() => {
    return scoutingWatch.filter(({ sellerClub }) => {
      const isPolishPlayer = isPolishLeague(sellerClub?.leagueId);
      return scoutingMarketFilter === 'POLAND' ? isPolishPlayer : !isPolishPlayer;
    });
  }, [scoutingWatch, scoutingMarketFilter]);

  const releasedPlayers = useMemo(() => {
    return (players['FREE_AGENTS'] || [])
      .filter(player => {
        if (!player.history || player.history.length < 2) return false;
        if (player.contractEndDate) return false;

        const lastEntry = player.history[player.history.length - 1];
        const previousEntry = player.history[player.history.length - 2];
        if (lastEntry.clubId !== 'FREE_AGENTS' || previousEntry.clubId === 'FREE_AGENTS') return false;
        if (!lastEntry.fromYear || !lastEntry.fromMonth) return false;

        const releaseDate = new Date(lastEntry.fromYear, lastEntry.fromMonth - 1, 1);
        if (releaseDate < seasonStart) return false;

        if (leagueFilter === 'ALL') return true;
        const previousClub = clubMap.get(previousEntry.clubId);
        if (leagueFilter === 'REST_WORLD') return !isPolishLeague(previousClub?.leagueId);
        return previousClub?.leagueId === leagueFilter;
      })
      .map(player => {
        const lastEntry = player.history![player.history!.length - 1];
        const previousEntry = player.history![player.history!.length - 2];

        return {
          player,
          previousClubName: previousEntry.clubName,
          releaseDate: new Date(lastEntry.fromYear!, lastEntry.fromMonth! - 1, 1),
        };
      })
      .sort((a, b) =>
        b.releaseDate.getTime() - a.releaseDate.getTime() ||
        a.player.lastName.localeCompare(b.player.lastName)
      );
  }, [players, seasonStart, leagueFilter, clubMap]);

  const completed = useMemo(() => {
    return allPlayers
      .filter(player => {
        if (!player.history || player.history.length < 2) return false;
        const lastEntry = player.history[player.history.length - 1];
        if (!lastEntry.fromYear || !lastEntry.fromMonth) return false;

        const entryDate = new Date(lastEntry.fromYear, lastEntry.fromMonth - 1, 1);
        return entryDate >= seasonStart;
      })
      .map(player => {
        const lastEntry = player.history[player.history.length - 1];
        const previousEntry = player.history[player.history.length - 2];
        const toClub = clubMap.get(lastEntry.clubId);
        const fromClub = clubMap.get(previousEntry.clubId);

        return {
          player,
          toClub,
          fromClub,
          fromClubName: previousEntry.clubName,
          toClubName: lastEntry.clubName,
          fromMonth: lastEntry.fromMonth!,
          fromYear: lastEntry.fromYear!,
        };
      })
      .filter(({ toClub, fromClub }) => {
        if (leagueFilter === 'ALL') return true;
        if (leagueFilter === 'REST_WORLD') {
          return !isPolishLeague(toClub?.leagueId) && !isPolishLeague(fromClub?.leagueId);
        }
        return toClub?.leagueId === leagueFilter || fromClub?.leagueId === leagueFilter;
      })
      .sort((a, b) => {
        if (b.fromYear !== a.fromYear) return b.fromYear - a.fromYear;
        return b.fromMonth - a.fromMonth;
      });
  }, [allPlayers, clubMap, leagueFilter, seasonStart]);

  const activityCount = trsf.length + freeAgentNeg.length;

  const activeIncomingOffers = useMemo(() => {
    return mergeIncomingOffersByPair(incomingOffers.filter(o =>
      o.status !== 'COMPLETED' &&
      o.status !== 'REJECTED_BY_MANAGER' &&
      o.status !== 'REJECTED_AT_CONFIRM' &&
      o.status !== 'PLAYER_REFUSED' &&
      o.status !== 'EXPIRED'
    ));
  }, [incomingOffers]);

  const closedIncomingOffers = useMemo(() => {
    return mergeIncomingOffersByPair(incomingOffers.filter(o =>
      o.status === 'COMPLETED' ||
      o.status === 'PLAYER_REFUSED' ||
      o.status === 'REJECTED_BY_MANAGER' ||
      o.status === 'REJECTED_AT_CONFIRM' ||
      o.status === 'EXPIRED'
    ));
  }, [incomingOffers]);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-50 flex flex-col p-4 gap-4"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.9)), url(${negocjacjeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <header className="w-full max-w-[1680px] mx-auto flex items-center justify-between shrink-0 bg-white/[0.03] border border-white/10 rounded-[30px] p-5 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="text-3xl">📡</div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
              AKTYWNOŚĆ <span className="text-yellow-400">RYNKOWA</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mt-1">
              Transfery w tle • skauting • sezon biezacy
            </p>
          </div>
        </div>
        <button
          onClick={() => navigateTo(ViewState.JOB_MARKET)}
          className="px-8 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.15] transition-all shadow-xl active:scale-95 group"
        >
          <span className="group-hover:text-emerald-400 transition-colors">&larr; Centrum transferowe</span>
        </button>
      </header>

      <div className="w-full max-w-[1680px] mx-auto flex items-center justify-between shrink-0 px-1 gap-4">
        <div className="flex gap-2 flex-wrap">
          {LEAGUES.map(league => (
            <button
              key={league.id}
              onClick={() => setLeagueFilter(league.id)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                leagueFilter === league.id
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
              }`}
            >
              {league.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={() => setTransferNewsActiveTab('scouting')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'scouting'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            Skauting ({scoutingWatch.length})
          </button>
          <button
            onClick={() => setTransferNewsActiveTab('released')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'released'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            Zwolnienia ({releasedPlayers.length})
          </button>
          <button
            onClick={() => setTransferNewsActiveTab('activity')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'activity'
                ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            📡 NEGOCJACJE ({activityCount})
          </button>
          <button
            onClick={() => setTransferNewsActiveTab('completed')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'completed'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            ✅ Sfinalizowane ({completed.length})
          </button>
          <button
            onClick={() => setTransferNewsActiveTab('incoming')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === 'incoming'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
            }`}
          >
            📨 OFERTY ZA MOICH ({activeIncomingOffers.length})
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1680px] mx-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {activeTab === 'scouting' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setScoutingMarketFilter('POLAND')}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  scoutingMarketFilter === 'POLAND'
                    ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
                }`}
              >
                Polska
              </button>
              <button
                onClick={() => setScoutingMarketFilter('REST_WORLD')}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  scoutingMarketFilter === 'REST_WORLD'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07]'
                }`}
              >
                Reszta swiata
              </button>
            </div>

            {scoutingEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <span className="text-5xl mb-4">🔎</span>
                <p className="text-[11px] font-black uppercase tracking-widest">Brak aktywnego skautingu</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Kluby nie obserwuja teraz zadnych nowych celow
                </p>
              </div>
            )}

            {scoutingEntries.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-300">Skauting i obserwacje</p>
                    <p className="text-[10px] text-slate-500">Kluby monitoruja zawodnikow jeszcze przed oficjalnym ruchem.</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-200">{scoutingEntries.length}</span>
                </div>

                <div className="rounded-2xl border border-emerald-400/15 bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[2fr_1.6fr_0.7fr_0.7fr_1fr_2.6fr] gap-4 px-5 py-3 border-b border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <p>Zawodnik</p>
                    <p>Obecny klub</p>
                    <p className="text-center">Pozycja</p>
                    <p className="text-center">Wiek</p>
                    <p className="text-center">Wartosc</p>
                    <p>Zainteresowane kluby</p>
                  </div>

                  {scoutingEntries.map(({ player, sellerClub, interestedClubNames, interestedCount }) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-[2fr_1.6fr_0.7fr_0.7fr_1fr_2.6fr] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 text-[11px] text-slate-200 hover:bg-white/[0.03] transition-all items-start"
                    >
                      <div>
                        <button
                          onClick={() => viewPlayerDetails(player.id)}
                          className="font-black uppercase text-white hover:text-yellow-300 transition-colors text-left"
                        >
                          {playerName(player)}
                        </button>
                      </div>

                      <div>
                        <p className="font-semibold uppercase text-slate-300">{sellerClub?.name ?? '---'}</p>
                      </div>

                      <div className="text-center">
                        <p className={`font-black uppercase ${POS_COLOR[player.position] || 'text-slate-400'}`}>{player.position}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-semibold text-slate-300">{player.age}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-black text-emerald-300">{formatValue(player.marketValue)}</p>
                      </div>

                      <div>
                        <p className="text-[10px] leading-relaxed text-slate-300">
                          {interestedCount > 0 ? interestedClubNames.join(', ') : 'Brak'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'released' && (
          <div className="space-y-4">
            {releasedPlayers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <span className="text-5xl mb-4">📄</span>
                <p className="text-[11px] font-black uppercase tracking-widest">Brak nowych zwolnien</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Kluby nie rozwiazaly ostatnio zadnych umow
                </p>
              </div>
            )}

            {releasedPlayers.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-300">Zwolnieni z klubow</p>
                    <p className="text-[10px] text-slate-500">Zawodnicy, ktorzy rozwiazali umowy i sa juz dostepni na wolnym transferze.</p>
                  </div>
                  <span className="text-[10px] font-black text-amber-200">{releasedPlayers.length}</span>
                </div>

                <div className="rounded-2xl border border-amber-400/15 bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[2fr_1.6fr_1fr] gap-4 px-5 py-3 border-b border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <p>Zawodnik</p>
                    <p>Ostatni klub</p>
                    <p>Data zwolnienia</p>
                  </div>

                  {releasedPlayers.map(({ player, previousClubName, releaseDate }) => (
                    <div
                      key={`RELEASE_${player.id}`}
                      className="grid grid-cols-[2fr_1.6fr_1fr] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 text-[11px] text-slate-200 hover:bg-white/[0.03] transition-all"
                    >
                      <div>
                        <button
                          onClick={() => viewPlayerDetails(player.id)}
                          className="font-black uppercase text-white hover:text-yellow-300 transition-colors text-left"
                        >
                          {playerName(player)}
                        </button>
                      </div>

                      <div>
                        <p className="font-semibold uppercase text-slate-300">{previousClubName}</p>
                      </div>

                      <div>
                        <p className="font-black text-amber-300">{formatDate(releaseDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {!transferWindowOpen && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-300">Okno transferowe zamkniete</p>
                <p className="mt-2 text-[11px] text-slate-300">
                  Negocjacje miedzy klubami sa wstrzymane, ale dalej widac rozmowy z wolnymi agentami.
                </p>
              </div>
            )}

            {activityCount === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <span className="text-5xl mb-4">🤝</span>
                <p className="text-[11px] font-black uppercase tracking-widest">Brak aktywnosci rynkowej</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  AI nie uruchomilo jeszcze nowych negocjacji
                </p>
              </div>
            )}

            {activeNegotiations.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-300">Aktywne negocjacje</p>
                    <p className="text-[10px] text-slate-500">Imie i nazwisko, obecny klub, kto negocjuje oraz kluczowe daty.</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-200">{activeNegotiations.length}</span>
                </div>

                <div className="rounded-2xl border border-blue-400/15 bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[2.2fr_1.4fr_1.4fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <p>Zawodnik</p>
                    <p>Obecny klub</p>
                    <p>Kto negocjuje</p>
                    <p className="text-center">Data oferty</p>
                    <p className="text-center">Oczekiwana odpowiedz</p>
                  </div>

                  {activeNegotiations.map(item => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[2.2fr_1.4fr_1.4fr_1fr_1fr] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 text-[11px] text-slate-200 hover:bg-white/[0.03] transition-all"
                    >
                      <div>
                        <button
                          onClick={() => viewPlayerDetails(item.playerId)}
                          className="font-black uppercase text-white hover:text-yellow-300 transition-colors text-left"
                        >
                          {item.playerLabel}
                        </button>
                      </div>

                      <div>
                        <p className="font-semibold uppercase text-slate-300">{item.currentClubName}</p>
                      </div>

                      <div>
                        <p className="font-black uppercase text-blue-300">{item.negotiatingClubName}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-semibold text-slate-300">{formatDate(item.contractPresentedDate)}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-black text-purple-300">{formatDate(item.expectedResponseDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-2">
            {completed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <span className="text-5xl mb-4">✅</span>
                <p className="text-[11px] font-black uppercase tracking-widest">Brak sfinalizowanych transferow w tym sezonie</p>
              </div>
            )}

            {completed.length > 0 && (
              <div className="rounded-2xl border border-emerald-400/15 bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-[80px_140px_1fr] gap-4 px-5 py-3 border-b border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                  <p>Nr</p>
                  <p>Data</p>
                  <p>Komunikat</p>
                </div>

                {completed.map(({ player, toClubName, fromClubName, fromClub, fromMonth, fromYear }, index) => (
                  <div
                    key={player.id}
                    className="grid grid-cols-[80px_140px_1fr] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 text-[11px] text-slate-200 hover:bg-white/[0.03] transition-all"
                  >
                    <div>
                      <p className="font-black text-emerald-300">{index + 1}.</p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-300">{MONTHS_PL[fromMonth - 1]} {fromYear}</p>
                    </div>

                    <div>
                      <p className="font-black text-white">
                        <button
                          onClick={() => viewPlayerDetails(player.id)}
                          className="text-yellow-300 hover:text-yellow-200 transition-colors"
                        >
                          {playerName(player)}
                        </button>{' '}
                        ({fromClub?.leagueId ? fromClubName : 'wolny transfer'}) podpisal kontrakt z <span className="text-emerald-300">{toClubName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <div className="space-y-3">
            {activeIncomingOffers.length === 0 && closedIncomingOffers.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm font-black uppercase tracking-widest">
                Brak aktywnych ofert za Twoich zawodników
              </div>
            )}
            {activeIncomingOffers.map(offer => {
              let player: Player | undefined;
              for (const cId in players) {
                player = players[cId]?.find(p => p.id === offer.playerId);
                if (player) break;
              }
              const buyerClub = clubs.find(c => c.id === offer.buyerClubId);
              if (!player || !buyerClub) return null;
              const displayedFee = offer.status === 'AI_COUNTERED'
                ? (offer.aiCounterFee ?? offer.fee)
                : offer.fee;

              const statusLabels: Record<string, { label: string; color: string }> = {
                EMAIL_SENT: { label: 'Oczekuje na odpowiedź', color: 'text-amber-300' },
                REMINDER_SENT: { label: 'Przypomnienie wysłane', color: 'text-orange-300' },
                COUNTER_PENDING_AI: { label: 'Rozpatrywanie oferty', color: 'text-blue-300' },
                AI_COUNTERED: { label: 'Przyszła odpowiedz, wymagana akcja', color: 'text-amber-400' },
                NEGOTIATION_IN_PROGRESS: { label: 'Negocjacje z zawodnikiem w toku', color: 'text-blue-400' },
                AWAITING_CONFIRMATION: { label: 'Wymagane zatwierdzenie', color: 'text-emerald-400' },
              };
              const st = statusLabels[offer.status] ?? { label: offer.status, color: 'text-slate-400' };
              const needsAction =
                offer.status === 'EMAIL_SENT' ||
                offer.status === 'REMINDER_SENT' ||
                offer.status === 'AI_COUNTERED' ||
                offer.status === 'AWAITING_CONFIRMATION';

              return (
                <div
                  key={offer.id}
                  className="bg-white/[0.03] border border-white/10 rounded-[20px] p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                      needsAction ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-400'
                    }`}>
                      {offer.aiUrgency === 3 ? '🔥 PILNA' : offer.aiUrgency === 2 ? 'NORMALNA' : 'NISKA'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        {player.firstName} {player.lastName}
                        <span className="ml-2 text-[10px] text-slate-400 font-normal">{player.position} · {player.overallRating} OVR</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {buyerClub.name} oferuje <span className="text-amber-300 font-black">{displayedFee.toLocaleString('pl-PL')} PLN</span>
                        {offer.boardPressure && <span className="ml-2 text-red-400 font-black">· zarząd naciska</span>}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${st.color}`}>{st.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateToIncomingOffer(offer.id)}
                    className="shrink-0 px-5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black uppercase tracking-widest text-[9px] hover:bg-amber-500/30 transition-all"
                  >
                    Przejdź
                  </button>
                </div>
              );
            })}
            {closedIncomingOffers.slice(0, 10).map(offer => {
              let player: Player | undefined;
              for (const cId in players) {
                player = players[cId]?.find(p => p.id === offer.playerId);
                if (player) break;
              }
              const buyerClub = clubs.find(c => c.id === offer.buyerClubId);
              if (!player || !buyerClub) return null;
              const closedLabels: Record<string, string> = {
                COMPLETED: '✅ Transfer sfinalizowany',
                PLAYER_REFUSED: '❌ Zawodnik odmówił',
                REJECTED_BY_MANAGER: '🚫 Odrzucona przez Ciebie',
                REJECTED_AT_CONFIRM: '🚫 Odrzucona przy zatwierdzeniu',
                EXPIRED: '⌛ Wygasła',
              };
              return (
                <div key={offer.id} className="bg-white/[0.02] border border-white/5 rounded-[16px] px-5 py-3 flex items-center justify-between gap-4 opacity-50">
                  <div>
                    <p className="text-xs font-black text-slate-300">{player.firstName} {player.lastName} ← {buyerClub.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{closedLabels[offer.status] ?? offer.status}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-500">{offer.fee.toLocaleString('pl-PL')} PLN</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

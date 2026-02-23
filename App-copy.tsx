import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { ViewState } from './types';
import { StartMenu } from './components/views/StartMenu';
import { TeamSelection } from './components/views/TeamSelection';
import { Dashboard } from './components/views/Dashboard';
import { LeagueTables } from './components/views/LeagueTables';
import { MatchView } from './components/views/MatchView';
import { MatchLiveView } from './components/views/MatchLiveView';
import { PreMatchStudioView } from './components/views/PreMatchStudioView';
import { SquadView } from './components/views/SquadView';
import { ClubDetails } from './components/views/ClubDetails';
import { HiddenLeagueViewer } from './components/views/HiddenLeagueViewer';
import { PlayerCard } from './components/views/PlayerCard';
import { RefereeCard } from './components/views/RefereeCard';
import { RefereeListView } from './components/views/RefereeListView';
import { LeagueStatsView } from './components/views/LeagueStatsView';
import { CalendarDebugView } from './components/views/CalendarDebugView';
import { PostMatchStudioView } from './components/views/PostMatchStudioView';
import { ManagerCreation } from './components/views/ManagerCreation';
import { GameManual } from './components/views/GameManual';
import { TrainingView } from './components/views/TrainingView';
import { CupDrawView } from './components/views/CupDrawView';
import { MatchHistoryView } from './components/views/MatchHistoryView';
import { JobMarketView } from './components/views/JobMarketView';
import { PreMatchCupStudioView } from './PolishCupEngine/PreMatchCupStudioView';
import { MatchLiveViewPolishCupSimulation } from './PolishCupEngine/MatchLiveViewPolishCupSimulation';
import { PostMatchCupStudioView } from './PolishCupEngine/PostMatchCupStudioView';
import { ScoreResultsPolishCup } from './PolishCupEngine/ScoreResultsPolishCup';
import { CoachCard } from './components/views/CoachCard';
import { EditorView } from './components/views/EditorView';
import { ContractManagementView } from './components/views/ContractManagementView';
import { FreeAgentNegotiationView } from './components/views/FreeAgentNegotiationView';

// Internal component to handle view switching
const AppContent: React.FC = () => {
  const { viewState, navigateTo } = useGame();

  const renderView = () => {
    switch (viewState) {
      case ViewState.START_MENU:
        return <StartMenu />;
      case ViewState.MANAGER_CREATION:
        return <ManagerCreation />;
      case ViewState.TEAM_SELECTION:
        return <TeamSelection />;
      case ViewState.GAME_MANUAL:
        return <GameManual />;
      case ViewState.TRAINING_VIEW:
        return (
         
            <TrainingView />
          
        );
      case ViewState.DASHBOARD:
        return <Dashboard />
          
      case ViewState.LEAGUE_TABLES:
        return (
           <div className="min-h-screen bg-slate-900 p-6">
            <LeagueTables />
          </div>
        );
      case ViewState.LEAGUE_STATS:
        return <LeagueStatsView />;
      case ViewState.CALENDAR_DEBUG:
        return <CalendarDebugView />;
      case ViewState.SQUAD_VIEW:
        return (
           <div className="min-h-screen text-slate-50 p-6">
            <SquadView />
          </div>
        );
      case ViewState.CLUB_DETAILS:
        return <ClubDetails />;
      case ViewState.PLAYER_CARD:
        return <PlayerCard />;
        case ViewState.CONTRACT_MANAGEMENT:
        return <ContractManagementView />;

   
      case ViewState.FREE_AGENT_NEGOTIATION:
        return <FreeAgentNegotiationView />;

         case ViewState.COACH_CARD:
        return <CoachCard />;
        case ViewState.EDITOR:
        return <EditorView />;
      case ViewState.JOB_MARKET: // -> tutaj wstaw kod
        return <JobMarketView />;
      case ViewState.REFEREE_CARD:
        return <RefereeCard />;
      case ViewState.REFEREE_LIST:
        return (
           <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
            <RefereeListView />
          </div>
        );
      case ViewState.HIDDEN_LEAGUE:
        return <HiddenLeagueViewer />;
      case ViewState.CUP_DRAW:
        return <CupDrawView />;
        case ViewState.MATCH_HISTORY_BROWSER:
        return (
          <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
            <MatchHistoryView />
          </div>
        );
      case ViewState.TRANSFER_WINDOW:
        return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-10 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
              <span className="text-6xl mb-6 block">📝</span>
              <h2 className="text-3xl font-bold text-white mb-2">Okno Transferowe</h2>
              <p className="text-slate-400 mb-8 font-light italic">
                Tutaj będziesz mógł negocjować kontrakty i wzmacniać swój skład. (Stage 10)
              </p>
              <button 
                onClick={() => navigateTo(ViewState.DASHBOARD)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Powrót do Dashboardu
              </button>
            </div>
          </div>
        );
      case ViewState.PRE_MATCH_STUDIO:
        return <PreMatchStudioView />;
      case ViewState.MATCH_LIVE:
        return <MatchLiveView />;
      case ViewState.MATCH_POST:
        return <PostMatchStudioView />;
      case ViewState.MATCH_PREVIEW:
        return (
          <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
            <MatchView />
          </div>
        );
      
      // Polish Cup Engine
      case ViewState.PRE_MATCH_CUP_STUDIO:
        return <PreMatchCupStudioView />;
      case ViewState.MATCH_LIVE_CUP:
        return <MatchLiveViewPolishCupSimulation />;
      case ViewState.POST_MATCH_CUP_STUDIO:
        return <PostMatchCupStudioView />;
      case ViewState.SCORE_RESULTS_POLISH_CUP:
        return <ScoreResultsPolishCup />;

      default:
        return (
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-3xl font-bold text-slate-500">
              Work In Progress: {viewState}
            </h1>
          </div>
        );
    }
  };

  return <main>{renderView()}</main>;
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
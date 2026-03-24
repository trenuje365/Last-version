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
import { CLDrawView } from './components/views/CLDrawView';
import { CLGroupDrawView } from './components/views/CLGroupDrawView';
import { PolishCupBracketView } from './components/views/PolishCupBracketView';
import { PolishCupFinalistsView } from './PolishCupEngine/PolishCupFinalistsView';
import { PostMatchCLStudioView } from './CLEngine/PostMatchCLStudioView';
import { PreMatchCLStudioView } from './CLEngine/PreMatchCLStudioView';
import { PreMatchCLLiveStudioView } from './CLEngine/PreMatchCLLiveStudioView';
import { CLMatchLiveView } from './CLEngine/CLMatchLiveView';
import { CLHistoryView } from './CLEngine/CLHistoryView';
import { CLFinalDrawView } from './CLEngine/CLFinalDrawView';
import { CLR16DrawView } from './components/views/CLR16DrawView';
import { CLQFDrawView } from './components/views/CLQFDrawView';
import { CLSFDrawView } from './components/views/CLSFDrawView';
import { PreMatchCLFinalView } from './components/views/PreMatchCLFinalView';
import { PostMatchCLFinalView } from './components/views/PostMatchCLFinalView';
import { EuropeanClubsView } from './components/views/EuropeanClubsView';
import { ELDrawView } from './LECupEngine/ELDrawView';
import { ELR2QDrawView } from './LECupEngine/ELR2QDrawView';
import { ELHistoryView } from './LECupEngine/ELHistoryView';
import { CONFDrawView } from './LECupEngine/CONFDrawView';
import { CONFR2QDrawView } from './LECupEngine/CONFR2QDrawView';
import { CONFHistoryView } from './LECupEngine/CONFHistoryView';
import { ELGroupDrawView } from './components/views/ELGroupDrawView';
import { CONFGroupDrawView } from './LECupEngine/CONFGroupDrawView';
import { CONFR16DrawView } from './LECupEngine/CONFR16DrawView';
import { CONFQFDrawView } from './LECupEngine/CONFQFDrawView';
import { CONFSFDrawView } from './LECupEngine/CONFSFDrawView';
import { CONFFinalDrawView } from './LECupEngine/CONFFinalDrawView';
import { ELR16DrawView } from './components/views/ELR16DrawView';
import { ELQFDrawView } from './components/views/ELQFDrawView';
import { ELSFDrawView } from './components/views/ELSFDrawView';
import { ELFinalDrawView } from './components/views/ELFinalDrawView';

// Internal component to handle view switching
const AppContent: React.FC = () => {
  const { viewState, navigateTo } = useGame();

  const renderView = () => {
    switch (viewState) {

      case ViewState.CL_HISTORY:
  return <CLHistoryView />;
case ViewState.EL_DRAW:
  return <ELDrawView />;
case ViewState.EL_R2Q_DRAW:
  return <ELR2QDrawView />;
case ViewState.EL_HISTORY:
  return <ELHistoryView />;
case ViewState.CONF_DRAW:
  return <CONFDrawView />;
case ViewState.CONF_R2Q_DRAW:
  return <CONFR2QDrawView />;
case ViewState.CONF_HISTORY:
  return <CONFHistoryView />;
case ViewState.CONF_GROUP_DRAW:
  return <CONFGroupDrawView />;
case ViewState.CONF_R16_DRAW:
  return <CONFR16DrawView />;
case ViewState.CONF_QF_DRAW:
  return <CONFQFDrawView />;
case ViewState.CONF_SF_DRAW:
  return <CONFSFDrawView />;
case ViewState.CONF_FINAL_DRAW:
  return <CONFFinalDrawView />;
case ViewState.EL_GROUP_DRAW:
  return <ELGroupDrawView />;
case ViewState.EL_R16_DRAW:
  return <ELR16DrawView />;
case ViewState.EL_QF_DRAW:
  return <ELQFDrawView />;
case ViewState.EL_SF_DRAW:
  return <ELSFDrawView />;
case ViewState.EL_FINAL_DRAW:
  return <ELFinalDrawView />;
case ViewState.PRE_MATCH_CL_STUDIO:
  return <PreMatchCLStudioView />;

case ViewState.PRE_MATCH_CL_LIVE_STUDIO:
  return <PreMatchCLLiveStudioView />;

case ViewState.MATCH_LIVE_CL:
  return <CLMatchLiveView />;

case ViewState.POST_MATCH_CL_STUDIO:
  return <PostMatchCLStudioView />;
  case ViewState.PRE_MATCH_CL_FINAL:
  return <PreMatchCLFinalView />;
case ViewState.POST_MATCH_CL_FINAL:
  return <PostMatchCLFinalView />;
case ViewState.POLISH_CUP_BRACKET:
  return <PolishCupBracketView />;

      case ViewState.POLISH_CUP_FINALISTS:
        return <PolishCupFinalistsView />;

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
              case ViewState.CL_DRAW:
        return <CLDrawView />;

case ViewState.CL_GROUP_DRAW:
        return <CLGroupDrawView />;

        case ViewState.CL_R16_DRAW:
        return <CLR16DrawView />;

 case ViewState.CL_QF_DRAW:
        return <CLQFDrawView />;

      case ViewState.CL_SF_DRAW:
        return <CLSFDrawView />;

      case ViewState.CL_FINAL_DRAW:
        return <CLFinalDrawView />;

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

      case ViewState.EUROPEAN_CLUBS:
        return <EuropeanClubsView />;

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
import { Club } from '../types';
import { FinanceService } from './FinanceService';

export interface BudgetMonitorResult {
  action: 'REDUCE' | 'RESTORE' | 'NONE';
  newTransferBudget: number;
  newState: 'NORMAL' | 'ALERT';
  amountChanged: number;
  ratio: number;
  mailSubject: string;
  mailBody: string;
}

export const BoardFinanceMonitorService = {
  check: (club: Club): BudgetMonitorResult => {
    const projectedIncome = FinanceService.calculateInitialBudget(club.tier, club.reputation);
    const ratio = projectedIncome > 0 ? club.budget / projectedIncome : 0;
    const currentState = club.boardBudgetMonitorState ?? 'NORMAL';
    const newState: 'NORMAL' | 'ALERT' = ratio <= 0.05 ? 'ALERT' : 'NORMAL';

    if (currentState === newState) {
      return { action: 'NONE', newTransferBudget: club.transferBudget, newState, amountChanged: 0, ratio, mailSubject: '', mailBody: '' };
    }

    if (newState === 'ALERT') {
      const severity = Math.min(1, ratio <= 0 ? 1 : 1 - (ratio / 0.05));
      const reductionFraction = 0.20 + severity * 0.60;
      const amountTaken = Math.floor(club.transferBudget * reductionFraction);
      const newTransferBudget = Math.max(0, club.transferBudget - amountTaken);
      const ratioPercent = (ratio * 100).toFixed(1);

      return {
        action: 'REDUCE',
        newTransferBudget,
        newState,
        amountChanged: amountTaken,
        ratio,
        mailSubject: 'Pilne: Zarząd ogranicza budżet transferowy',
        mailBody: `Szanowny Panie Managerze,\n\nZ przykrością informujemy, że bieżąca sytuacja finansowa klubu wymaga natychmiastowej reakcji.\n\nAktualny stan kasy (${club.budget.toLocaleString('pl-PL')} PLN) stanowi jedynie ${ratioPercent}% oczekiwanych przychodów sezonu (${projectedIncome.toLocaleString('pl-PL')} PLN). Jest to poziom alarmowy.\n\nZarząd podjął decyzję o wstrzymaniu ${amountTaken.toLocaleString('pl-PL')} PLN z budżetu transferowego. Nowy dostępny budżet transferowy: ${newTransferBudget.toLocaleString('pl-PL')} PLN.\n\nProsimy o powściągliwość w wydatkach do czasu poprawy sytuacji finansowej.\n\nZ poważaniem,\nDyrektor Finansowy, ${club.name}`,
      };
    }

    const recoveryFactor = Math.min(1, (ratio - 0.15) / 0.85);
    const maxTransferBudget = projectedIncome * 0.40;
    const gap = Math.max(0, maxTransferBudget - club.transferBudget);
    const amountRestored = Math.floor(gap * recoveryFactor * 0.30);

    if (amountRestored <= 0) {
      return { action: 'NONE', newTransferBudget: club.transferBudget, newState, amountChanged: 0, ratio, mailSubject: '', mailBody: '' };
    }

    const newTransferBudget = club.transferBudget + amountRestored;

    return {
      action: 'RESTORE',
      newTransferBudget,
      newState,
      amountChanged: amountRestored,
      ratio,
      mailSubject: 'Informacja finansowa: Zwiększenie budżetu transferowego',
      mailBody: `Szanowny Panie Managerze,\n\nZ zadowoleniem informujemy, że sytuacja finansowa klubu uległa znaczącej poprawie.\n\nAktualny stan kasy wrócił do bezpiecznego poziomu. W związku z tym Zarząd przywraca część budżetu transferowego w wysokości ${amountRestored.toLocaleString('pl-PL')} PLN.\n\nNowy dostępny budżet transferowy: ${newTransferBudget.toLocaleString('pl-PL')} PLN.\n\nZ poważaniem,\nDyrektor Finansowy, ${club.name}`,
    };
  },
};

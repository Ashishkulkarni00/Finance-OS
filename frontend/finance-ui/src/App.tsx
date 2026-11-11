import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useGetAccountsQuery } from '@/services/accountService';

const TodayPage = lazy(() => import('./routes/TodayPage'));
const MonthPage = lazy(() => import('./routes/MonthPage'));
const MonthClosePage = lazy(() => import('./routes/MonthClosePage'));
const MoneyPage = lazy(() => import('./routes/MoneyPage'));
const PlanPage = lazy(() => import('./routes/PlanPage'));
const CommitmentDetailPage = lazy(() => import('./routes/CommitmentDetailPage'));
const AccountDetailPage = lazy(() => import('./routes/AccountDetailPage'));
const LoanDetailPage = lazy(() => import('./routes/LoanDetailPage'));
const GoalDetailPage = lazy(() => import('./routes/GoalDetailPage'));
const CommitmentRuleDetailPage = lazy(() => import('./routes/CommitmentRuleDetailPage'));
const OnboardingPage = lazy(() => import('./routes/OnboardingPage'));
const LedgerPage = lazy(() => import('./routes/LedgerPage'));
const SummaryPage = lazy(() => import('./routes/SummaryPage'));
const DebtsPage = lazy(() => import('./routes/DebtsPage'));
const InvestmentsPage = lazy(() => import('./routes/InvestmentsPage'));
const CoverPage = lazy(() => import('./routes/CoverPage'));
const CardsPage = lazy(() => import('./routes/CardsPage'));
const CreditCardDetailPage = lazy(() => import('./routes/CreditCardDetailPage'));
const MoneyLayout = lazy(() => import('./routes/MoneyLayout'));
const ImportPage = lazy(() => import('./routes/ImportPage'));
const HelpHomePage = lazy(() => import('./routes/HelpHomePage'));
const HelpCategoryPage = lazy(() => import('./routes/HelpCategoryPage'));
const HelpTopicPage = lazy(() => import('./routes/HelpTopicPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));
const SettingsPage = lazy(() => import('./routes/SettingsPage'));

/** No persisted "onboarding done" flag exists (and shouldn't need one) - a user with
 *  zero accounts has nothing for the rest of the product to show, which is exactly
 *  the condition onboarding exists to fix. Anyone past that lands on Today as before. */
function RootRedirect() {
  const { data: accountsPage, isLoading } = useGetAccountsQuery();
  if (isLoading) return null;
  const hasAccounts = (accountsPage?.content.length ?? 0) > 0;
  return <Navigate to={hasAccounts ? '/today' : '/onboarding'} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppShell />}>
            <Route index element={<RootRedirect />} />
            <Route path="/today" element={<TodayPage />} />
            {/* Needs you is a panel over the current page now (`?needs=1`); old links and the
                toast's fallback destination land on Today with it open. */}
            <Route path="/needs-you" element={<Navigate to="/today?needs=1" replace />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/month/close" element={<MonthClosePage />} />
            {/* Money: the four registers as tabs (STRATEGY_DEEP_DIVE §D). Old addresses redirect. */}
            <Route path="/money" element={<MoneyLayout />}>
              <Route index element={<Navigate to="/money/accounts" replace />} />
              <Route path="accounts" element={<MoneyPage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="debts" element={<DebtsPage />} />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="insurance" element={<CoverPage />} />
              {/* Renamed from "Cover" (user, 2026-11-09) - old links still land. */}
              <Route path="cover" element={<Navigate to="/money/insurance" replace />} />
            </Route>
            <Route path="/accounts" element={<Navigate to="/money/accounts" replace />} />
            <Route path="/commitments/:instanceId" element={<CommitmentDetailPage />} />
            <Route path="/accounts/:accountId" element={<AccountDetailPage />} />
            <Route path="/loans/:loanId" element={<LoanDetailPage />} />
            <Route path="/goals/:goalId" element={<GoalDetailPage />} />
            <Route path="/commitment-rules/:ruleId" element={<CommitmentRuleDetailPage />} />
            {/* Goals only now - the page lives at /goals, beside /goals/:goalId. /plan
                still resolves so any saved link or bookmark lands in the same place. */}
            {/* Ahead: where you're heading - goals now; the 12-month view joins it in Phase 3. */}
            <Route path="/ahead" element={<PlanPage />} />
            <Route path="/goals" element={<Navigate to="/ahead" replace />} />
            <Route path="/plan" element={<Navigate to="/ahead" replace />} />
            <Route path="/ledger" element={<LedgerPage />} />
            {/* Summary: the months consolidated. Sits below Goals in the rail - the only
                screen that compares months rather than reporting one. */}
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/review" element={<Navigate to="/summary" replace />} />
            <Route path="/ledger/import" element={<ImportPage />} />
            <Route path="/debts" element={<Navigate to="/money/debts" replace />} />
            <Route path="/investments" element={<Navigate to="/money/investments" replace />} />
            <Route path="/cards" element={<Navigate to="/money/cards" replace />} />
            <Route path="/cards/:accountId" element={<CreditCardDetailPage />} />
            {/* The in-app manual - registered inside AppShell so the rail stays visible
                and a reader is never stranded (IN_APP_MANUAL.md §5). */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpHomePage />} />
            <Route path="/help/:category" element={<HelpCategoryPage />} />
            <Route path="/help/:category/:slug" element={<HelpTopicPage />} />
            {/* Anything else: a page inside the shell, so navigation is still there. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

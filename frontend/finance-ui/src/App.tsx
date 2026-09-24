import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useGetAccountsQuery } from '@/services/accountService';

const TodayPage = lazy(() => import('./routes/TodayPage'));
const NeedsYouPage = lazy(() => import('./routes/NeedsYouPage'));
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
const DebtsPage = lazy(() => import('./routes/DebtsPage'));
const InvestmentsPage = lazy(() => import('./routes/InvestmentsPage'));
const CoverPage = lazy(() => import('./routes/CoverPage'));
const CardsPage = lazy(() => import('./routes/CardsPage'));
const CreditCardDetailPage = lazy(() => import('./routes/CreditCardDetailPage'));
const MoneyLayout = lazy(() => import('./routes/MoneyLayout'));
const ImportPage = lazy(() => import('./routes/ImportPage'));

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
            {/* A drill-down of Today's "Needs you", not a sibling of it - see NeedsYouPage. */}
            <Route path="/needs-you" element={<NeedsYouPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/month/close" element={<MonthClosePage />} />
            {/* Money: the four registers as tabs (STRATEGY_DEEP_DIVE §D). Old addresses redirect. */}
            <Route path="/money" element={<MoneyLayout />}>
              <Route index element={<Navigate to="/money/accounts" replace />} />
              <Route path="accounts" element={<MoneyPage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="debts" element={<DebtsPage />} />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="cover" element={<CoverPage />} />
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
            <Route path="/ledger/import" element={<ImportPage />} />
            <Route path="/debts" element={<Navigate to="/money/debts" replace />} />
            <Route path="/investments" element={<Navigate to="/money/investments" replace />} />
            <Route path="/cards" element={<Navigate to="/money/cards" replace />} />
            <Route path="/cards/:accountId" element={<CreditCardDetailPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

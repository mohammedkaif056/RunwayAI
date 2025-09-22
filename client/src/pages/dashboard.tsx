import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ExpenseBreakdown } from "@/components/dashboard/expense-breakdown";
import { ScenarioCards } from "@/components/dashboard/scenario-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OnboardingModal } from "@/components/modals/onboarding-modal";
import { AccountConnectionModal } from "@/components/modals/account-connection-modal";
import { BudgetCreationModal } from "@/components/modals/budget-creation-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [accountConnectionOpen, setAccountConnectionOpen] = useState(false);
  const [budgetCreationOpen, setBudgetCreationOpen] = useState(false);
  const { toast } = useToast();

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
    retry: false,
  });

  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial-summary"],
    retry: false,
  });

  const { data: expenseBreakdown = [] } = useQuery({
    queryKey: ["/api/expense-breakdown"],
    retry: false,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { limit: "10" }],
    retry: false,
  });

  // Show onboarding if no company profile exists
  const shouldShowOnboarding = company === null;

  const handleRecategorize = (transactionId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Transaction recategorization will be available soon",
    });
  };

  const handleExportReport = () => {
    toast({
      title: "Feature Coming Soon", 
      description: "Report export functionality will be available soon",
    });
  };

  const handleBulkEdit = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Bulk transaction editing will be available soon", 
    });
  };

  const handleSync = () => {
    toast({
      title: "Syncing Data",
      description: "Refreshing account data...",
    });
  };

  // Mock chart data - in real app this would come from API
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    actual: [280000, 252000, 225000, 198000, 171000, 144000],
    projected: [0, 0, 0, 198000, 175000, 152000, 129000, 106000],
  };

  // Mock scenario data - in real app this would be calculated
  const scenarios = [
    { type: "optimistic" as const, runwayMonths: 12.3, revenueGrowth: 25, burnChange: -15 },
    { type: "realistic" as const, runwayMonths: 8.7, revenueGrowth: 10, burnChange: -5 },
    { type: "pessimistic" as const, runwayMonths: 6.2, revenueGrowth: -5, burnChange: 10 },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          subtitle="Welcome back, here's your financial overview"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleSync} data-testid="button-sync-data">
                <i className="fas fa-sync-alt w-4 h-4 mr-2"></i>
                Sync Data
              </Button>
              <Button size="sm" onClick={() => setAccountConnectionOpen(true)} data-testid="button-connect-account-header">
                <i className="fas fa-plus w-4 h-4 mr-2"></i>
                Connect Account
              </Button>
            </>
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Current Balance"
              value={financialSummary ? `$${(financialSummary as any).totalBalance.toLocaleString()}` : "$0"}
              change="+5.2% from last month"
              changeType="positive"
              icon="fas fa-wallet"
              iconColor="text-success"
            />
            <MetricCard
              title="Monthly Burn Rate"
              value={financialSummary ? `$${(financialSummary as any).monthlyBurn.toLocaleString()}` : "$0"}
              change="-2.1% from last month"
              changeType="positive"
              icon="fas fa-fire"
              iconColor="text-destructive"
            />
            <MetricCard
              title="Runway Remaining"
              value={financialSummary ? `${(financialSummary as any).runwayMonths.toFixed(1)} months` : "0 months"}
              change="Based on current burn"
              changeType="neutral"
              icon="fas fa-hourglass-half"
              iconColor="text-warning"
            />
            <MetricCard
              title="Monthly Revenue"
              value={financialSummary ? `$${(financialSummary as any).monthlyRevenue.toLocaleString()}` : "$0"}
              change="+18.5% from last month"
              changeType="positive"
              icon="fas fa-chart-line"
              iconColor="text-success"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CashFlowChart data={chartData} />
            <ExpenseBreakdown data={expenseBreakdown as any} />
          </div>

          {/* Scenario Planning */}
          <div className="mb-8">
            <ScenarioCards scenarios={scenarios} />
          </div>

          {/* Recent Transactions & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentTransactions 
              transactions={transactions} 
              onRecategorize={handleRecategorize}
            />
            <QuickActions
              onConnectAccount={() => setAccountConnectionOpen(true)}
              onCreateBudget={() => setBudgetCreationOpen(true)}
              onExportReport={handleExportReport}
              onBulkEdit={handleBulkEdit}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <OnboardingModal
        open={shouldShowOnboarding || onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onConnectAccount={() => {
          setOnboardingOpen(false);
          setAccountConnectionOpen(true);
        }}
      />
      <AccountConnectionModal
        open={accountConnectionOpen}
        onOpenChange={setAccountConnectionOpen}
      />
      <BudgetCreationModal
        open={budgetCreationOpen}
        onOpenChange={setBudgetCreationOpen}
      />
    </div>
  );
}

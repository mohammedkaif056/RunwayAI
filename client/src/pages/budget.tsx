import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BudgetCreationModal } from "@/components/modals/budget-creation-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Budget } from "@shared/schema";

export default function BudgetPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [budgetCreationOpen, setBudgetCreationOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: expenseBreakdown = [] } = useQuery({
    queryKey: ["/api/expense-breakdown"],
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      await apiRequest("DELETE", `/api/budgets/${budgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Budget> }) => {
      const response = await apiRequest("PUT", `/api/budgets/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  const getSpentAmount = (category: string) => {
    const expense = (expenseBreakdown as any[]).find((e: any) => e.category === category);
    return expense ? expense.amount : 0;
  };

  const getBudgetStatus = (spent: number, limit: number, alertThreshold: number) => {
    const percentage = (spent / limit) * 100;
    
    if (percentage >= 100) return { status: 'over', color: 'destructive' };
    if (percentage >= alertThreshold) return { status: 'warning', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const getProgressColor = (percentage: number, alertThreshold: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= alertThreshold) return 'bg-warning';
    return 'bg-success';
  };

  const toggleBudgetStatus = (budgetId: string, currentStatus: boolean) => {
    updateBudgetMutation.mutate({
      id: budgetId,
      updates: { isActive: !currentStatus }
    });
  };

  const totalBudgeted = budgets.reduce((sum, budget) => sum + parseFloat(budget.monthlyLimit), 0);
  const totalSpent = budgets.reduce((sum, budget) => {
    const spent = getSpentAmount(budget.category);
    return sum + spent;
  }, 0);

  const alertBudgets = budgets.filter(budget => {
    const spent = getSpentAmount(budget.category);
    const percentage = (spent / parseFloat(budget.monthlyLimit)) * 100;
    return percentage >= budget.alertThreshold;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Budget"
            subtitle="Manage spending limits and track expenses"
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Budget"
          subtitle="Manage spending limits and track expenses"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            <Button onClick={() => setBudgetCreationOpen(true)} data-testid="button-create-budget">
              <i className="fas fa-plus w-4 h-4 mr-2"></i>
              Create Budget
            </Button>
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {budgets.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calculator text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">No budgets created</h3>
                <p className="text-muted-foreground mb-6">
                  Create budgets to track spending limits and get alerts when you're approaching them.
                </p>
                <Button onClick={() => setBudgetCreationOpen(true)} data-testid="button-create-first-budget">
                  <i className="fas fa-plus w-4 h-4 mr-2"></i>
                  Create Your First Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Budget Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-primary"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budgeted</p>
                      <p className="text-xl font-bold">${totalBudgeted.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-credit-card text-destructive"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold">${totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-piggy-bank text-success"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-xl font-bold">${(totalBudgeted - totalSpent).toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Alerts */}
              {alertBudgets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Budget Alerts</h3>
                  {alertBudgets.map(budget => {
                    const spent = getSpentAmount(budget.category);
                    const percentage = (spent / parseFloat(budget.monthlyLimit)) * 100;
                    const status = getBudgetStatus(spent, parseFloat(budget.monthlyLimit), budget.alertThreshold);
                    
                    return (
                      <Alert key={budget.id} className={`border-${status.color}/20 bg-${status.color}/10`}>
                        <i className={`fas fa-exclamation-triangle text-${status.color}`}></i>
                        <AlertDescription>
                          <span className="font-medium">{budget.category}</span> budget is at{' '}
                          <span className="font-bold">{percentage.toFixed(1)}%</span> of limit
                          ({spent.toLocaleString()} / ${parseFloat(budget.monthlyLimit).toLocaleString()})
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              )}

              {/* Budget Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Budget Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {budgets.map(budget => {
                    const spent = getSpentAmount(budget.category);
                    const limit = parseFloat(budget.monthlyLimit);
                    const percentage = (spent / limit) * 100;
                    const status = getBudgetStatus(spent, limit, budget.alertThreshold);
                    
                    return (
                      <Card key={budget.id} className="bg-card border border-border" data-testid={`budget-card-${budget.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">{budget.category}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={budget.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {budget.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleBudgetStatus(budget.id, budget.isActive)}
                                data-testid={`button-toggle-${budget.id}`}
                              >
                                <i className="fas fa-power-off w-3 h-3"></i>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-muted-foreground">
                                ${spent.toLocaleString()} of ${limit.toLocaleString()}
                              </span>
                              <span className={`text-sm font-medium text-${status.color}`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(percentage, 100)} 
                              className="h-2"
                              data-testid={`progress-${budget.id}`}
                            />
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Alert at</span>
                            <span className="font-medium">{budget.alertThreshold}%</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className={`font-medium ${limit - spent >= 0 ? 'text-success' : 'text-destructive'}`}>
                              ${Math.abs(limit - spent).toLocaleString()}
                              {limit - spent < 0 && ' over'}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              disabled={updateBudgetMutation.isPending}
                              data-testid={`button-edit-${budget.id}`}
                            >
                              <i className="fas fa-edit w-3 h-3 mr-1"></i>
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteBudgetMutation.mutate(budget.id)}
                              disabled={deleteBudgetMutation.isPending}
                              data-testid={`button-delete-${budget.id}`}
                            >
                              <i className="fas fa-trash w-3 h-3"></i>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Budget Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-lightbulb text-warning mt-0.5"></i>
                      <div>
                        <p className="font-medium">Set realistic limits</p>
                        <p className="text-muted-foreground">
                          Base budgets on historical spending data for accuracy
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <i className="fas fa-bell text-primary mt-0.5"></i>
                      <div>
                        <p className="font-medium">Use alerts effectively</p>
                        <p className="text-muted-foreground">
                          Set alert thresholds at 75-80% to get early warnings
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <i className="fas fa-chart-line text-success mt-0.5"></i>
                      <div>
                        <p className="font-medium">Review regularly</p>
                        <p className="text-muted-foreground">
                          Adjust budgets monthly based on business needs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <i className="fas fa-tags text-destructive mt-0.5"></i>
                      <div>
                        <p className="font-medium">Categorize transactions</p>
                        <p className="text-muted-foreground">
                          Proper categorization ensures accurate budget tracking
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <BudgetCreationModal
        open={budgetCreationOpen}
        onOpenChange={setBudgetCreationOpen}
      />
    </div>
  );
}

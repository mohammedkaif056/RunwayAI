import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountConnectionModal } from "@/components/modals/account-connection-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@shared/schema";

export default function Accounts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountConnectionOpen, setAccountConnectionOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", `/api/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const syncAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-breakdown"] });
      toast({
        title: "Success",
        description: data.message || "Account synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync account",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = (accountId: string) => {
    if (window.confirm("Are you sure you want to delete this account? This will also delete all associated transactions.")) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "checking":
        return "fas fa-university";
      case "savings":
        return "fas fa-piggy-bank";
      case "credit":
        return "fas fa-credit-card";
      default:
        return "fas fa-wallet";
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "checking":
        return "bg-primary/20 text-primary";
      case "savings":
        return "bg-success/20 text-success";
      case "credit":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted";
    }
  };

  const formatBalance = (balance: string, type: string) => {
    const value = parseFloat(balance);
    const isCredit = type === "credit";
    const displayValue = Math.abs(value);
    
    return {
      value: `$${displayValue.toLocaleString()}`,
      className: isCredit && value > 0 ? "text-destructive" : "text-foreground"
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Accounts"
            subtitle="Manage your connected bank accounts"
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
          title="Accounts"
          subtitle="Manage your connected bank accounts"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            <Button onClick={() => setAccountConnectionOpen(true)} data-testid="button-connect-account">
              <i className="fas fa-plus w-4 h-4 mr-2"></i>
              Connect Account
            </Button>
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {accounts.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-university text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your bank accounts to start tracking your finances and generate runway projections.
                </p>
                <Button onClick={() => setAccountConnectionOpen(true)} data-testid="button-connect-first-account">
                  <i className="fas fa-plus w-4 h-4 mr-2"></i>
                  Connect Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => {
                const balance = formatBalance(account.balance, account.type);
                return (
                  <Card key={account.id} className="bg-card border border-border" data-testid={`account-card-${account.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            <i className={`${getAccountTypeIcon(account.type)} text-muted-foreground`}></i>
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{account.bankName}</p>
                          </div>
                        </div>
                        <Badge className={getAccountTypeColor(account.type)} variant="secondary">
                          {account.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                          <p className={`text-2xl font-bold ${balance.className}`} data-testid={`balance-${account.id}`}>
                            {balance.value}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Currency</span>
                          <span className="font-medium">{account.currency}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            data-testid={`button-view-transactions-${account.id}`}
                          >
                            <i className="fas fa-list w-3 h-3 mr-1"></i>
                            Transactions
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => syncAccountMutation.mutate(account.id)}
                            disabled={syncAccountMutation.isPending}
                            data-testid={`button-sync-account-${account.id}`}
                          >
                            <i className={`fas fa-sync-alt w-3 h-3 ${syncAccountMutation.isPending ? 'animate-spin' : ''}`}></i>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            disabled={deleteAccountMutation.isPending}
                            data-testid={`button-delete-account-${account.id}`}
                          >
                            <i className="fas fa-trash w-3 h-3"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Account Statistics */}
          {accounts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-wallet text-success"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-xl font-bold">
                        ${accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-university text-primary"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Connected Accounts</p>
                      <p className="text-xl font-bold">{accounts.length}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-line text-warning"></i>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Accounts</p>
                      <p className="text-xl font-bold">{accounts.filter(a => a.isActive).length}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      <AccountConnectionModal
        open={accountConnectionOpen}
        onOpenChange={setAccountConnectionOpen}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Account } from "@shared/schema";

export default function Transactions() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { limit: "100" }],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[], updates: Partial<Transaction> }) => {
      const response = await apiRequest("PUT", "/api/transactions/bulk", { ids, updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-breakdown"] });
      setSelectedTransactions([]);
      setBulkEditOpen(false);
      toast({
        title: "Success",
        description: "Transactions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transactions",
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Transaction> }) => {
      const response = await apiRequest("PUT", `/api/transactions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-breakdown"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Engineering", "Marketing", "Operations", "Sales", "Legal", 
    "Office & Equipment", "Travel", "Revenue", "Other"
  ];

  const filteredTransactions = (transactions as Transaction[]).filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || 
                           (categoryFilter === "uncategorized" && !transaction.category) ||
                           transaction.category === categoryFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions((filteredTransactions as Transaction[]).map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleBulkUpdate = () => {
    if (selectedTransactions.length === 0 || !bulkCategory) {
      toast({
        title: "Error",
        description: "Please select transactions and a category",
        variant: "destructive",
      });
      return;
    }
    
    bulkUpdateMutation.mutate({
      ids: selectedTransactions,
      updates: { category: bulkCategory }
    });
  };

  const handleRecategorize = (transactionId: string, newCategory: string) => {
    updateTransactionMutation.mutate({
      id: transactionId,
      updates: { category: newCategory }
    });
  };

  const formatAmount = (amount: string, type: string) => {
    const value = parseFloat(amount);
    const isNegative = value < 0 || type === 'expense';
    const displayValue = Math.abs(value);
    
    return {
      value: `${isNegative ? '-' : '+'}$${displayValue.toLocaleString()}`,
      className: isNegative ? 'text-destructive' : 'text-success'
    };
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-muted';
    
    const colors: Record<string, string> = {
      'Engineering': 'bg-primary/20 text-primary',
      'Marketing': 'bg-success/20 text-success',
      'Operations': 'bg-warning/20 text-warning',
      'Revenue': 'bg-success/20 text-success',
      'Sales': 'bg-blue-500/20 text-blue-500',
      'Legal': 'bg-purple-500/20 text-purple-500',
      'Office & Equipment': 'bg-orange-500/20 text-orange-500',
      'Travel': 'bg-teal-500/20 text-teal-500',
      'Other': 'bg-gray-500/20 text-gray-500',
    };
    
    return colors[category] || 'bg-muted';
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Transactions"
            subtitle="View and manage your financial transactions"
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
          title="Transactions"
          subtitle="View and manage your financial transactions"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            selectedTransactions.length > 0 ? (
              <Button onClick={() => setBulkEditOpen(true)} data-testid="button-bulk-edit">
                <i className="fas fa-edit w-4 h-4 mr-2"></i>
                Edit Selected ({selectedTransactions.length})
              </Button>
            ) : null
          }
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-transactions"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoryFilter">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="typeFilter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger data-testid="select-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setTypeFilter("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Transactions ({filteredTransactions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-exchange-alt text-2xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    {(transactions as Transaction[]).length === 0 
                      ? "Connect an account to see your transactions"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(filteredTransactions as Transaction[]).map((transaction) => {
                    const amount = formatAmount(transaction.amount, transaction.type);
                    const isSelected = selectedTransactions.includes(transaction.id);
                    
                    return (
                      <div 
                        key={transaction.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                          isSelected ? 'bg-accent/50 border-primary' : 'border-border hover:bg-accent/30'
                        }`}
                        data-testid={`transaction-row-${transaction.id}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                          data-testid={`checkbox-transaction-${transaction.id}`}
                        />
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                          <div className="md:col-span-2">
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {getAccountName(transaction.accountId)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <div className="flex items-center gap-2">
                              {transaction.category ? (
                                <Badge className={`text-xs ${getCategoryColor(transaction.category)}`} variant="secondary">
                                  {transaction.category}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Uncategorized
                                </Badge>
                              )}
                              <Select
                                value={transaction.category || ""}
                                onValueChange={(value) => handleRecategorize(transaction.id, value)}
                              >
                                <SelectTrigger className="h-6 w-6 p-0 border-none">
                                  <i className="fas fa-edit w-3 h-3"></i>
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs">
                              {transaction.type}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <p className={`font-bold ${amount.className}`}>
                              {amount.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Bulk Edit Modal */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent data-testid="bulk-edit-modal">
          <DialogHeader>
            <DialogTitle>Bulk Edit Transactions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update category for {selectedTransactions.length} selected transactions
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkCategory">New Category</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger data-testid="select-bulk-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setBulkEditOpen(false)}
                data-testid="button-cancel-bulk-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpdate}
                disabled={bulkUpdateMutation.isPending}
                data-testid="button-apply-bulk-edit"
              >
                {bulkUpdateMutation.isPending ? "Updating..." : "Update Transactions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

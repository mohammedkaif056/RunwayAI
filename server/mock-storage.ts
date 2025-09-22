import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

// Simple mock storage with the minimum needed for demo
class MockStorage {
  private users: any[] = [];
  private companies: any[] = [];
  private accounts: any[] = [];
  private transactions: any[] = [];
  private budgets: any[] = [];
  private forecasts: any[] = [];
  private reports: any[] = [];
  private initialized = false;

  constructor() {
    // Don't auto-initialize in constructor for serverless compatibility
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeDemoData();
      this.initialized = true;
    }
  }

  private async initializeDemoData() {
    // Create demo user
    const demoUser = await this.createUser({
      username: "demo",
      email: "demo@startup.com", 
      password: "demo123",
    });

    // Create demo company
    const demoCompany = await this.createCompany({
      userId: demoUser.id,
      name: "TechFlow Startup",
      stage: "pre-seed",
      industry: "SaaS",
      teamSize: "8",
    });

    // Create demo accounts
    const checkingAccount = await this.createAccount({
      userId: demoUser.id,
      name: "Business Checking",
      type: "checking",
      balance: "45000.00",
      currency: "USD",
      bankName: "Chase Bank",
      isActive: true,
      externalId: "mock_checking_001",
      accessToken: "mock_token_checking",
    });

    const savingsAccount = await this.createAccount({
      userId: demoUser.id,
      name: "Business Savings", 
      type: "savings",
      balance: "125000.00",
      currency: "USD",
      bankName: "Chase Bank",
      isActive: true,
      externalId: "mock_savings_001",
      accessToken: "mock_token_savings",
    });

    // Generate realistic transactions
    const transactionTemplates = [
      { desc: "AWS Services", category: "Engineering", amount: -2847, isRecurring: true, frequency: 30 },
      { desc: "Google Cloud Platform", category: "Engineering", amount: -1234, isRecurring: true, frequency: 30 },
      { desc: "Office Rent", category: "Operations", amount: -4500, isRecurring: true, frequency: 30 },
      { desc: "Subscription Revenue - Q3", category: "Revenue", amount: 45000, isRecurring: true, frequency: 30 },
      { desc: "Custom Integration - BigCorp", category: "Revenue", amount: 12000, isRecurring: false },
      { desc: "Legal Services", category: "Legal", amount: -5500, isRecurring: false },
      { desc: "Team Equipment", category: "Office & Equipment", amount: -6800, isRecurring: false },
    ];

    // Generate transactions for the past 90 days
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      transactionTemplates.forEach(template => {
        let shouldGenerate = false;
        
        if (template.isRecurring && template.frequency) {
          if (daysAgo % template.frequency === 0) {
            shouldGenerate = true;
          }
        } else {
          shouldGenerate = Math.random() < 0.05;
        }

        if (shouldGenerate) {
          const account = Math.random() < 0.7 ? checkingAccount : savingsAccount;
          this.transactions.push({
            id: nanoid(),
            accountId: account.id,
            userId: demoUser.id,
            amount: (template.amount + (Math.random() - 0.5) * template.amount * 0.1).toFixed(2),
            description: template.desc,
            category: template.category,
            subcategory: null,
            date: new Date(date),
            type: template.amount < 0 ? "expense" : "income",
            externalId: `mock_tx_${nanoid()}`,
            isRecurring: template.isRecurring,
            tags: null,
            createdAt: new Date(),
          });
        }
      });
    }

    // Create demo budgets
    await this.createBudget({
      userId: demoUser.id,
      category: "Engineering",
      monthlyLimit: "25000",
      currentSpent: "0",
      alertThreshold: 80,
      isActive: true,
    });

    await this.createBudget({
      userId: demoUser.id,
      category: "Marketing",
      monthlyLimit: "8000", 
      currentSpent: "0",
      alertThreshold: 90,
      isActive: true,
    });
  }

  // User methods
  async getUser(id: string) {
    await this.ensureInitialized();
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string) {
    await this.ensureInitialized();
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string) {
    await this.ensureInitialized();
    return this.users.find(u => u.email === email);
  }

  async createUser(insertUser: any) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = {
      id: nanoid(),
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  // Company methods
  async getCompanyByUserId(userId: string) {
    return this.companies.find(c => c.userId === userId);
  }

  async createCompany(company: any) {
    const newCompany = {
      id: nanoid(),
      name: company.name,
      userId: company.userId,
      industry: company.industry || null,
      teamSize: company.teamSize || null,
      stage: company.stage || null,
      createdAt: new Date(),
    };
    this.companies.push(newCompany);
    return newCompany;
  }

  async updateCompany(id: string, updates: any) {
    const index = this.companies.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Company not found');
    
    this.companies[index] = { ...this.companies[index], ...updates };
    return this.companies[index];
  }

  // Account methods
  async getAccountsByUserId(userId: string) {
    return this.accounts.filter(a => a.userId === userId);
  }

  async getAccount(id: string) {
    return this.accounts.find(a => a.id === id);
  }

  async createAccount(account: any) {
    const newAccount = {
      id: nanoid(),
      name: account.name,
      type: account.type,
      userId: account.userId,
      balance: account.balance || "0",
      currency: account.currency || "USD",
      bankName: account.bankName || null,
      isActive: account.isActive !== undefined ? account.isActive : true,
      externalId: account.externalId || null,
      accessToken: account.accessToken || null,
      createdAt: new Date(),
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  async updateAccount(id: string, updates: any) {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');
    
    this.accounts[index] = { ...this.accounts[index], ...updates };
    return this.accounts[index];
  }

  async deleteAccount(id: string) {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.accounts.splice(index, 1);
    }
  }

  // Transaction methods
  async getTransactionsByUserId(userId: string, limit = 50) {
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getTransactionsByAccountId(accountId: string) {
    return this.transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: string) {
    return this.transactions.find(t => t.id === id);
  }

  async createTransaction(transaction: any) {
    const newTransaction = {
      id: nanoid(),
      accountId: transaction.accountId,
      userId: transaction.userId,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category || null,
      subcategory: transaction.subcategory || null,
      date: transaction.date,
      type: transaction.type,
      externalId: transaction.externalId || null,
      isRecurring: transaction.isRecurring || false,
      tags: transaction.tags || null,
      createdAt: new Date(),
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: string, updates: any) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    this.transactions[index] = { ...this.transactions[index], ...updates };
    return this.transactions[index];
  }

  async bulkUpdateTransactions(ids: string[], updates: any) {
    const updatedTransactions: any[] = [];
    ids.forEach(id => {
      const index = this.transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        this.transactions[index] = { ...this.transactions[index], ...updates };
        updatedTransactions.push(this.transactions[index]);
      }
    });
    return updatedTransactions;
  }

  async deleteTransaction(id: string) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transactions.splice(index, 1);
    }
  }

  // Budget methods
  async getBudgetsByUserId(userId: string) {
    return this.budgets.filter(b => b.userId === userId);
  }

  async getBudget(id: string) {
    return this.budgets.find(b => b.id === id);
  }

  async createBudget(budget: any) {
    const newBudget = {
      id: nanoid(),
      userId: budget.userId,
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      currentSpent: budget.currentSpent || "0",
      alertThreshold: budget.alertThreshold || 80,
      isActive: budget.isActive !== undefined ? budget.isActive : true,
      createdAt: new Date(),
    };
    this.budgets.push(newBudget);
    return newBudget;
  }

  async updateBudget(id: string, updates: any) {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Budget not found');
    
    this.budgets[index] = { ...this.budgets[index], ...updates };
    return this.budgets[index];
  }

  async deleteBudget(id: string) {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.budgets.splice(index, 1);
    }
  }

  // Forecast methods
  async getForecastsByUserId(userId: string) {
    return this.forecasts.filter(f => f.userId === userId);
  }

  async getForecast(id: string) {
    return this.forecasts.find(f => f.id === id);
  }

  async createForecast(forecast: any) {
    const newForecast = {
      id: nanoid(),
      userId: forecast.userId,
      scenarioType: forecast.scenarioType,
      projectedRevenue: forecast.projectedRevenue || null,
      projectedExpenses: forecast.projectedExpenses || null,
      runwayMonths: forecast.runwayMonths || null,
      assumptions: forecast.assumptions || null,
      projectionData: forecast.projectionData || null,
      createdAt: new Date(),
    };
    this.forecasts.push(newForecast);
    return newForecast;
  }

  async updateForecast(id: string, updates: any) {
    const index = this.forecasts.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Forecast not found');
    
    this.forecasts[index] = { ...this.forecasts[index], ...updates };
    return this.forecasts[index];
  }

  async deleteForecast(id: string) {
    const index = this.forecasts.findIndex(f => f.id === id);
    if (index !== -1) {
      this.forecasts.splice(index, 1);
    }
  }

  // Report methods
  async getReportsByUserId(userId: string) {
    return this.reports
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  async createReport(report: any) {
    const newReport = {
      id: nanoid(),
      userId: report.userId,
      type: report.type,
      format: report.format,
      data: report.data,
      fileName: report.fileName,
      generatedAt: new Date(),
    };
    this.reports.push(newReport);
    return newReport;
  }

  // Analytics methods
  async getFinancialSummary(userId: string) {
    const userAccounts = this.accounts.filter(a => a.userId === userId);
    const totalBalance = userAccounts.reduce((sum, account) => 
      sum + parseFloat(account.balance || "0"), 0);

    // Get this month's transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = this.transactions.filter(t => 
      t.userId === userId &&
      new Date(t.date) >= startOfMonth &&
      new Date(t.date) <= endOfMonth
    );

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const monthlyRevenue = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyBurn = monthlyExpenses - monthlyRevenue;
    const runwayMonths = monthlyBurn > 0 ? totalBalance / monthlyBurn : 999;

    return {
      totalBalance,
      monthlyBurn,
      monthlyRevenue,
      runwayMonths,
    };
  }

  async getExpenseBreakdown(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenseTransactions = this.transactions.filter(t =>
      t.userId === userId &&
      t.type === 'expense' &&
      new Date(t.date) >= startOfMonth &&
      new Date(t.date) <= endOfMonth
    );

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(parseFloat(transaction.amount));
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => (sum as number) + (amount as number), 0) as number;

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount: amount as number,
      percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0,
    }));
  }
}

export const mockStorage = new MockStorage();
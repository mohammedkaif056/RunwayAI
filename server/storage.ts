import { 
  users, 
  companies, 
  accounts, 
  transactions, 
  budgets, 
  forecasts, 
  reports,
  type User, 
  type InsertUser,
  type Company,
  type InsertCompany,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type Forecast,
  type InsertForecast,
  type Report,
  type InsertReport
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, avg, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Companies
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<Company>): Promise<Company>;
  
  // Accounts
  getAccountsByUserId(userId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Transactions
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByAccountId(accountId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
  bulkUpdateTransactions(ids: string[], updates: Partial<Transaction>): Promise<Transaction[]>;
  deleteTransaction(id: string): Promise<void>;
  
  // Budgets
  getBudgetsByUserId(userId: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  
  // Forecasts
  getForecastsByUserId(userId: string): Promise<Forecast[]>;
  getForecast(id: string): Promise<Forecast | undefined>;
  createForecast(forecast: InsertForecast): Promise<Forecast>;
  updateForecast(id: string, forecast: Partial<Forecast>): Promise<Forecast>;
  deleteForecast(id: string): Promise<void>;
  
  // Reports
  getReportsByUserId(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Analytics
  getFinancialSummary(userId: string): Promise<{
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    runwayMonths: number;
  }>;
  getExpenseBreakdown(userId: string): Promise<{
    category: string;
    amount: number;
    percentage: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set(account)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async getTransactionsByUserId(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async bulkUpdateTransactions(ids: string[], updates: Partial<Transaction>): Promise<Transaction[]> {
    const updatedTransactions = [];
    for (const id of ids) {
      const [updated] = await db
        .update(transactions)
        .set(updates)
        .where(eq(transactions.id, id))
        .returning();
      updatedTransactions.push(updated);
    }
    return updatedTransactions;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budget)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getForecastsByUserId(userId: string): Promise<Forecast[]> {
    return await db.select().from(forecasts).where(eq(forecasts.userId, userId));
  }

  async getForecast(id: string): Promise<Forecast | undefined> {
    const [forecast] = await db.select().from(forecasts).where(eq(forecasts.id, id));
    return forecast || undefined;
  }

  async createForecast(forecast: InsertForecast): Promise<Forecast> {
    const [newForecast] = await db.insert(forecasts).values(forecast).returning();
    return newForecast;
  }

  async updateForecast(id: string, forecast: Partial<Forecast>): Promise<Forecast> {
    const [updatedForecast] = await db
      .update(forecasts)
      .set(forecast)
      .where(eq(forecasts.id, id))
      .returning();
    return updatedForecast;
  }

  async deleteForecast(id: string): Promise<void> {
    await db.delete(forecasts).where(eq(forecasts.id, id));
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.generatedAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getFinancialSummary(userId: string): Promise<{
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    runwayMonths: number;
  }> {
    // Get total balance from all accounts
    const accountsData = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));
    
    const totalBalance = accountsData.reduce((sum, account) => 
      sum + parseFloat(account.balance || "0"), 0);

    // Get this month's transactions for burn and revenue calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth)
        )
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

  async getExpenseBreakdown(userId: string): Promise<{
    category: string;
    amount: number;
    percentage: number;
  }[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenseTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth)
        )
      );

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(parseFloat(transaction.amount));
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }));
  }
}

export const storage = new DatabaseStorage();

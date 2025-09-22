import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertAccountSchema, insertTransactionSchema, insertBudgetSchema } from "@shared/schema";
import { z } from "zod";

// Enhanced mock data generators for realistic Plaid simulation
function generateRealisticBalance(accountType: string): string {
  switch (accountType) {
    case "checking":
      return (Math.random() * 15000 + 1000).toFixed(2); // $1k-$16k
    case "savings":
      return (Math.random() * 50000 + 5000).toFixed(2); // $5k-$55k
    case "credit":
      return (Math.random() * 2000).toFixed(2); // $0-$2k (credit card balance)
    default:
      return (Math.random() * 25000 + 2000).toFixed(2);
  }
}

function generateRealisticTransactions(accountId: string, userId: string, accountType: string) {
  const transactions = [];
  const categories = ["Engineering", "Marketing", "Operations", "Sales", "Legal", "Office & Equipment", "Travel", "Revenue"];
  
  // Startup-specific transaction templates
  const expenseTemplates = [
    { desc: "AWS Services", category: "Engineering", minAmount: 500, maxAmount: 3000 },
    { desc: "Google Cloud Platform", category: "Engineering", minAmount: 200, maxAmount: 1500 },
    { desc: "GitHub Enterprise", category: "Engineering", minAmount: 100, maxAmount: 500 },
    { desc: "Figma Team Plan", category: "Engineering", minAmount: 50, maxAmount: 200 },
    { desc: "Office Rent", category: "Operations", minAmount: 2000, maxAmount: 8000 },
    { desc: "Internet & Utilities", category: "Operations", minAmount: 200, maxAmount: 600 },
    { desc: "Legal Services", category: "Legal", minAmount: 500, maxAmount: 5000 },
    { desc: "Accounting Services", category: "Operations", minAmount: 300, maxAmount: 1500 },
    { desc: "Marketing Tools", category: "Marketing", minAmount: 100, maxAmount: 1000 },
    { desc: "Social Media Ads", category: "Marketing", minAmount: 500, maxAmount: 3000 },
    { desc: "Conference Tickets", category: "Marketing", minAmount: 300, maxAmount: 2000 },
    { desc: "Team Lunch", category: "Operations", minAmount: 50, maxAmount: 300 },
    { desc: "Software Licenses", category: "Engineering", minAmount: 100, maxAmount: 1000 },
    { desc: "Hardware & Equipment", category: "Office & Equipment", minAmount: 500, maxAmount: 3000 },
    { desc: "Travel Expenses", category: "Travel", minAmount: 200, maxAmount: 2000 },
  ];

  const incomeTemplates = [
    { desc: "Customer Payment", category: "Revenue", minAmount: 1000, maxAmount: 10000 },
    { desc: "Subscription Revenue", category: "Revenue", minAmount: 500, maxAmount: 5000 },
    { desc: "Consulting Services", category: "Revenue", minAmount: 2000, maxAmount: 15000 },
    { desc: "Grant Funding", category: "Revenue", minAmount: 5000, maxAmount: 50000 },
    { desc: "Investment Round", category: "Revenue", minAmount: 25000, maxAmount: 500000 },
  ];

  // Generate transactions for the past 90 days
  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Skip weekends for business transactions (70% chance)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend && Math.random() < 0.7) continue;
    
    // 60% chance of expense, 40% chance of income (startup burn pattern)
    const isExpense = Math.random() < 0.6;
    const templates = isExpense ? expenseTemplates : incomeTemplates;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Vary amounts slightly
    const amount = (Math.random() * (template.maxAmount - template.minAmount) + template.minAmount).toFixed(2);
    
    transactions.push({
      accountId,
      userId,
      amount: isExpense ? `-${amount}` : amount,
      description: template.desc,
      category: template.category,
      date,
      type: isExpense ? "expense" as const : "income" as const,
      externalId: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRecurring: ["Office Rent", "Internet & Utilities", "Software Licenses"].includes(template.desc),
    });
  }

  return transactions;
}

function generateNewTransactions(accountId: string, userId: string, accountType: string) {
  const transactions = [];
  const recentTemplates = [
    { desc: "AWS Services", category: "Engineering", amount: "847.23", type: "expense" as const },
    { desc: "Stripe Processing Fees", category: "Operations", amount: "45.67", type: "expense" as const },
    { desc: "Customer Payment - Acme Corp", category: "Revenue", amount: "2500.00", type: "income" as const },
    { desc: "Google Workspace", category: "Operations", amount: "72.00", type: "expense" as const },
    { desc: "Team Lunch - Pizza", category: "Operations", amount: "89.43", type: "expense" as const },
  ];

  // Generate 1-3 new transactions since last sync
  const numTransactions = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numTransactions; i++) {
    const template = recentTemplates[Math.floor(Math.random() * recentTemplates.length)];
    const hoursAgo = Math.floor(Math.random() * 24) + 1; // 1-24 hours ago
    const date = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
    
    transactions.push({
      accountId,
      userId,
      amount: template.type === "expense" ? `-${template.amount}` : template.amount,
      description: template.desc,
      category: template.category,
      date,
      type: template.type,
      externalId: `sync_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  return transactions;
}

// Configure Passport
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Authentication required' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Company routes
  app.get('/api/company', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const company = await storage.getCompanyByUserId(user.id);
      res.json(company);
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ message: 'Failed to get company' });
    }
  });

  app.post('/api/company', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const companyData = insertCompanySchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      console.error('Create company error:', error);
      res.status(400).json({ message: 'Failed to create company' });
    }
  });

  // Account routes
  app.get('/api/accounts', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const accounts = await storage.getAccountsByUserId(user.id);
      res.json(accounts);
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ message: 'Failed to get accounts' });
    }
  });

  app.post('/api/accounts', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error('Create account error:', error);
      res.status(400).json({ message: 'Failed to create account' });
    }
  });

  app.put('/api/accounts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const account = await storage.updateAccount(id, updates);
      res.json(account);
    } catch (error) {
      console.error('Update account error:', error);
      res.status(400).json({ message: 'Failed to update account' });
    }
  });

  app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAccount(id);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  });

  // Transaction routes
  app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactionsByUserId(user.id, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(400).json({ message: 'Failed to create transaction' });
    }
  });

  app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const transaction = await storage.updateTransaction(id, updates);
      res.json(transaction);
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(400).json({ message: 'Failed to update transaction' });
    }
  });

  app.put('/api/transactions/bulk', requireAuth, async (req, res) => {
    try {
      const { ids, updates } = req.body;
      const transactions = await storage.bulkUpdateTransactions(ids, updates);
      res.json(transactions);
    } catch (error) {
      console.error('Bulk update transactions error:', error);
      res.status(400).json({ message: 'Failed to update transactions' });
    }
  });

  // Budget routes
  app.get('/api/budgets', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const budgets = await storage.getBudgetsByUserId(user.id);
      res.json(budgets);
    } catch (error) {
      console.error('Get budgets error:', error);
      res.status(500).json({ message: 'Failed to get budgets' });
    }
  });

  app.post('/api/budgets', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const budget = await storage.createBudget(budgetData);
      res.json(budget);
    } catch (error) {
      console.error('Create budget error:', error);
      res.status(400).json({ message: 'Failed to create budget' });
    }
  });

  // Financial summary route
  app.get('/api/financial-summary', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const summary = await storage.getFinancialSummary(user.id);
      res.json(summary);
    } catch (error) {
      console.error('Get financial summary error:', error);
      res.status(500).json({ message: 'Failed to get financial summary' });
    }
  });

  // Expense breakdown route
  app.get('/api/expense-breakdown', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const breakdown = await storage.getExpenseBreakdown(user.id);
      res.json(breakdown);
    } catch (error) {
      console.error('Get expense breakdown error:', error);
      res.status(500).json({ message: 'Failed to get expense breakdown' });
    }
  });

  // Enhanced simulated Plaid account connection
  app.post('/api/connect-account', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { bankName, accountType } = req.body;
      
      // Simulate Plaid connection with more realistic mock data
      const mockAccount = {
        userId: user.id,
        name: `${bankName} ${accountType}`,
        type: accountType,
        balance: generateRealisticBalance(accountType),
        bankName,
        externalId: `mock_${Date.now()}`,
        accessToken: `mock_token_${Date.now()}`,
      };
      
      const account = await storage.createAccount(mockAccount);
      
      // Generate realistic transaction history for the past 3 months
      const mockTransactions = generateRealisticTransactions(account.id, user.id, accountType);
      
      for (const tx of mockTransactions) {
        await storage.createTransaction(tx);
      }
      
      res.json({ 
        account, 
        transactionCount: mockTransactions.length,
        message: 'Account connected successfully with transaction history' 
      });
    } catch (error) {
      console.error('Connect account error:', error);
      res.status(500).json({ message: 'Failed to connect account' });
    }
  });

  // Account sync functionality
  app.post('/api/accounts/:id/sync', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { id: accountId } = req.params;
      
      // Get the account
      const account = await storage.getAccount(accountId);
      if (!account || account.userId !== user.id) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      // Simulate fetching new transactions from bank
      const newTransactions = generateNewTransactions(accountId, user.id, account.type);
      const addedTransactions = [];
      
      for (const tx of newTransactions) {
        try {
          const created = await storage.createTransaction(tx);
          addedTransactions.push(created);
        } catch (error) {
          // Skip if transaction already exists (duplicate externalId)
          console.log('Transaction already exists, skipping');
        }
      }
      
      // Update account balance
      const balanceChange = addedTransactions.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount);
        return sum + (tx.type === 'income' ? amount : -Math.abs(amount));
      }, 0);
      
      const newBalance = (parseFloat(account.balance) + balanceChange).toString();
      await storage.updateAccount(accountId, { balance: newBalance });
      
      res.json({ 
        newTransactions: addedTransactions.length,
        balanceChange,
        newBalance: parseFloat(newBalance),
        message: `Synced ${addedTransactions.length} new transactions` 
      });
    } catch (error) {
      console.error('Account sync error:', error);
      res.status(500).json({ message: 'Failed to sync account' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

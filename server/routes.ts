import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertAccountSchema, insertTransactionSchema, insertBudgetSchema } from "@shared/schema";
import { z } from "zod";

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

  // Simulated Plaid account connection
  app.post('/api/connect-account', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { bankName, accountType } = req.body;
      
      // Simulate Plaid connection with mock data
      const mockAccount = {
        userId: user.id,
        name: `${bankName} ${accountType}`,
        type: accountType,
        balance: (Math.random() * 50000 + 1000).toString(), // Random balance between $1k-$51k
        bankName,
        externalId: `mock_${Date.now()}`,
        accessToken: `mock_token_${Date.now()}`,
      };
      
      const account = await storage.createAccount(mockAccount);
      
      // Generate some mock transactions
      const mockTransactions = [
        {
          accountId: account.id,
          userId: user.id,
          amount: "-1247.50",
          description: "AWS Services",
          category: "Engineering",
          date: new Date(Date.now() - 86400000), // Yesterday
          type: "expense" as const,
          externalId: `mock_tx_${Date.now()}_1`,
        },
        {
          accountId: account.id,
          userId: user.id,
          amount: "-4200.00",
          description: "Office Rent",
          category: "Operations",
          date: new Date(Date.now() - 172800000), // 2 days ago
          type: "expense" as const,
          externalId: `mock_tx_${Date.now()}_2`,
        },
        {
          accountId: account.id,
          userId: user.id,
          amount: "2850.00",
          description: "Customer Payment",
          category: "Revenue",
          date: new Date(Date.now() - 259200000), // 3 days ago
          type: "income" as const,
          externalId: `mock_tx_${Date.now()}_3`,
        },
      ];
      
      for (const tx of mockTransactions) {
        await storage.createTransaction(tx);
      }
      
      res.json({ account, message: 'Account connected successfully' });
    } catch (error) {
      console.error('Connect account error:', error);
      res.status(500).json({ message: 'Failed to connect account' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

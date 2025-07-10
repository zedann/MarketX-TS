import pool from "../config/db";

export interface Wallet {
  id?: string;
  user_id: string;
  balance: number;
}

export interface WalletTransaction {
  id?: string;
  user_id: string;
  amount: number;
  fees?: number;
  total_amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  method: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  reference_number?: string;
  created_at?: Date;
}

interface WalletModel {
  getOrCreateWallet: (userId: string) => Promise<Wallet>;
  updateBalance: (userId: string, amountDiff: number) => Promise<Wallet>;

  createTransaction: (tx: WalletTransaction) => Promise<WalletTransaction>;
  updateTransactionStatus: (txId: string, status: string) => Promise<WalletTransaction>;
  getTransactions: (userId: string, status?: string) => Promise<WalletTransaction[]>;
  getTransactionById: (txId: string) => Promise<WalletTransaction | null>;
  getTransactionByReference: (reference: string) => Promise<WalletTransaction | null>;
}

const walletModel: WalletModel = {
  getOrCreateWallet: async (userId: string) => {
    const existing = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
    if (existing.rows[0]) return existing.rows[0];

    const result = await pool.query(
      "INSERT INTO wallets (user_id, balance) VALUES ($1, 0.00) RETURNING *",
      [userId]
    );
    return result.rows[0];
  },

  updateBalance: async (userId: string, amountDiff: number) => {
    const result = await pool.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *`,
      [amountDiff, userId]
    );
    return result.rows[0];
  },

  createTransaction: async (tx: WalletTransaction) => {
    const ref = tx.reference_number || `WAL-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
    const result = await pool.query(
      `INSERT INTO wallet_transactions (
        user_id, amount, fees, total_amount, transaction_type, method, status, reference_number
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        tx.user_id,
        tx.amount,
        tx.fees || 0,
        tx.total_amount,
        tx.transaction_type,
        tx.method,
        tx.status || 'pending',
        ref,
      ]
    );
    return result.rows[0];
  },

  updateTransactionStatus: async (txId: string, status: string) => {
    const result = await pool.query(
      `UPDATE wallet_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, txId]
    );
    return result.rows[0];
  },

  getTransactions: async (userId: string, status?: string) => {
    let query = "SELECT * FROM wallet_transactions WHERE user_id = $1";
    const params: any[] = [userId];
    if (status) {
      query += " AND status = $2";
      params.push(status);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    return result.rows;
  },

  getTransactionById: async (txId: string) => {
    const result = await pool.query("SELECT * FROM wallet_transactions WHERE id = $1", [txId]);
    return result.rows[0] || null;
  },

  getTransactionByReference: async (reference: string) => {
    const result = await pool.query(
      "SELECT * FROM wallet_transactions WHERE reference_number = $1",
      [reference]
    );
    return result.rows[0] || null;
  },
};

export default walletModel; 
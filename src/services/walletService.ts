import walletModel, { WalletTransaction } from "../models/wallet";
import AppError from "../utils/appError";
import StripeService from "./stripeService";

export class WalletService {
  static async getWallet(userId: string) {
    return await walletModel.getOrCreateWallet(userId);
  }

  static calculateFees(amount: number, method: string): number {
    // Example fee logic
    switch (method) {
      case 'vodafone_cash':
        return amount * 0.015; // 1.5%
      case 'debit_card':
        return amount * 0.021; // 2.1%
      case 'instapay':
        return 0; // no fee
      case 'bank_transfer':
        return 0; // no fee
      default:
        return 0;
    }
  }

  static async createDeposit(userId: string, amount: number, method: string) {
    if (amount <= 0) throw new AppError("Amount must be greater than 0", 400);

    const fees = this.calculateFees(amount, method);
    const total = amount + fees;

    // If debit_card use Stripe
    if (method === 'debit_card') {
      const paymentIntent = await StripeService.createDepositPaymentIntent(userId, total);

      const tx = await walletModel.createTransaction({
        user_id: userId,
        amount,
        fees,
        total_amount: total,
        transaction_type: 'deposit',
        method,
        status: 'pending',
        reference_number: paymentIntent.id,
      } as WalletTransaction);

      return {
        transaction: tx,
        stripeClientSecret: paymentIntent.client_secret,
      };
    }

    // Non-card methods: process immediately (mock)
    let tx = await walletModel.createTransaction({
      user_id: userId,
      amount,
      fees,
      total_amount: total,
      transaction_type: 'deposit',
      method,
      status: 'processing',
    } as WalletTransaction);

    tx = await walletModel.updateTransactionStatus(tx.id!, 'completed');
    await walletModel.updateBalance(userId, amount);

    return { transaction: tx };
  }

  static async createWithdrawal(userId: string, amount: number, method: string) {
    const wallet = await walletModel.getOrCreateWallet(userId);
    if (amount <= 0 || amount > wallet.balance) {
      throw new AppError("Invalid withdrawal amount", 400);
    }
    const fees = this.calculateFees(amount, method);
    const total = amount + fees;

    let tx = await walletModel.createTransaction({
      user_id: userId,
      amount,
      fees,
      total_amount: total,
      transaction_type: 'withdrawal',
      method,
      status: 'processing',
    } as WalletTransaction);

    // Simulate processing success
    tx = await walletModel.updateTransactionStatus(tx.id!, 'completed');
    await walletModel.updateBalance(userId, -total);

    return tx;
  }

  static async getTransactions(userId: string, status?: string) {
    return await walletModel.getTransactions(userId, status);
  }

  static async getTransactionDetail(userId: string, txId: string) {
    const tx = await walletModel.getTransactionById(txId);
    if (!tx || tx.user_id !== userId) throw new AppError("Transaction not found", 404);
    return tx;
  }
}

export default WalletService; 
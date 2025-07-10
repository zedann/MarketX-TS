import express, { Request, Response, NextFunction } from "express";
import { protect } from "../middleware/authMiddleware";
import { securityLogger } from "../middleware/securityMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { APIResponse, HTTP_CODES } from "../types";
import WalletService from "../services/walletService";
import StripeService from "../services/stripeService";
import walletModel from "../models/wallet";

const router = express.Router();

router.use(protect);

// Get wallet balance
router.get(
  "/",
  securityLogger("WALLET_BALANCE_ACCESS"),
  catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any;
    const wallet = await WalletService.getWallet(user.id);
    res.status(HTTP_CODES.OK).json(new APIResponse("success", "Wallet retrieved", { wallet }));
  })
);

// Deposit
router.post(
  "/deposit",
  securityLogger("WALLET_DEPOSIT"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { amount, method } = req.body;
    if (!amount || !method) return next(new Error("amount and method required"));
    const tx = await WalletService.createDeposit(user.id, amount, method);
    res.status(HTTP_CODES.CREATED).json(new APIResponse("success", "Deposit processed", { transaction: tx }));
  })
);

// Withdrawal
router.post(
  "/withdraw",
  securityLogger("WALLET_WITHDRAW"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { amount, method } = req.body;
    if (!amount || !method) return next(new Error("amount and method required"));
    const tx = await WalletService.createWithdrawal(user.id, amount, method);
    res.status(HTTP_CODES.CREATED).json(new APIResponse("success", "Withdrawal processed", { transaction: tx }));
  })
);

// List transactions
router.get(
  "/transactions",
  securityLogger("WALLET_TRANSACTIONS"),
  catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any;
    const { status } = req.query;
    const txs = await WalletService.getTransactions(user.id, status as string | undefined);
    res.status(HTTP_CODES.OK).json(new APIResponse("success", "Transactions retrieved", { transactions: txs }));
  })
);

// Transaction detail
router.get(
  "/transactions/:txId",
  securityLogger("WALLET_TRANSACTION_DETAIL"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { txId } = req.params;
    const tx = await WalletService.getTransactionDetail(user.id, txId);
    res.status(HTTP_CODES.OK).json(new APIResponse("success", "Transaction detail", { transaction: tx }));
  })
);

// Stripe webhook (no auth)
router.post(
  "/stripe/webhook",
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    try {
      const event = StripeService.verifyWebhookSignature(req.body as Buffer, sig, webhookSecret);

      if (event.type === 'payment_intent.succeeded') {
        const intent: any = event.data.object;
        const ref = intent.id;
        const tx = await walletModel.getTransactionByReference(ref);
        if (tx && tx.status !== 'completed') {
          await walletModel.updateTransactionStatus(tx.id!, 'completed');
          await walletModel.updateBalance(tx.user_id, tx.amount);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Stripe webhook error', err);
      res.status(400).send(`Webhook Error: ${(err as any).message}`);
    }
  }
);

export default router; 
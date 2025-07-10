import Stripe from "stripe";
import AppError from "../utils/appError";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
if (!stripeSecretKey) {
  // tslint:disable-next-line:no-console
  console.warn("⚠️  STRIPE_SECRET_KEY not set – Stripe integration disabled");
}
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null as any;

export class StripeService {
  static async createDepositPaymentIntent(userId: string, amount: number) {
    if (!stripe) throw new AppError("Stripe not configured", 500);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // in fils/cents
      currency: 'aed',
      metadata: {
        userId,
        purpose: 'wallet_deposit'
      },
      payment_method_types: ['card'],
    });
    return paymentIntent;
  }

  static verifyWebhookSignature(rawBody: Buffer, sig: string | string[] | undefined, webhookSecret: string) {
    if (!stripe) throw new Error('Stripe not configured');
    return stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  }
}

export default StripeService; 
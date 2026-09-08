import Razorpay from 'razorpay';
import crypto from 'crypto';

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createSubscriptionOrder = async (userId) => {
  const instance = getRazorpayInstance();

  const options = {
    amount: 3000, // Amount in paise (₹30.00)
    currency: 'INR',
    receipt: `receipt_${userId.toString().slice(-6)}_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      plan: 'Krishak Plus',
    },
  };

  const order = await instance.orders.create(options);
  return order;
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};
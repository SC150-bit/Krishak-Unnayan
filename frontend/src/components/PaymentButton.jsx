import React, { useState } from 'react';

export default function PaymentButton({ user, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleSubscriptionPayment = async () => {
    setLoading(true);

    try {
      // 1. Request an order from your backend for ₹30 (30 INR = 3000 paise)
      const response = await fetch('http://localhost:5000/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 30, // ₹30 monthly fee
          currency: 'INR',
        }),
      });

      const orderData = await response.json();

      if (!orderData.id) {
        alert('Failed to initialize payment session. Please check backend configuration.');
        setLoading(false);
        return;
      }

      // 2. Configure Razorpay Modal Options
      const options = {
        key: 'rzp_test_dummy', // Replace with your live/test Razorpay Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Krishak Unnayan Portal',
        description: 'Monthly Portal Access Subscription (₹30/month)',
        image: 'https://cdn-icons-png.flaticon.com/512/188/188333.png', // Optional logo
        order_id: orderData.id,
        prefill: {
          name: user?.name || 'Ramesh Kumar',
          email: user?.email || 'farmer@krishak.in',
          contact: '9876543210',
        },
        theme: {
          color: '#047857', // Tailwind emerald-700 color scheme matching your portal
        },
        handler: function (paymentResponse) {
          setLoading(false);
          alert(`Payment Successful! Transaction ID: ${paymentResponse.razorpay_payment_id}`);
          if (onPaymentSuccess) {
            onPaymentSuccess(paymentResponse);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // 3. Open Razorpay Checkout Modal
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      console.error('Payment Error:', error);
      alert('An error occurred during payment initialization.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-lg font-bold">
          ₹
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">Portal Subscription Pass</h4>
          <p className="text-xs text-slate-500">₹30 / month • Auto-renews monthly</p>
        </div>
      </div>

      <button
        onClick={handleSubscriptionPayment}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Pay ₹30 Now'
        )}
      </button>
    </div>
  );
}
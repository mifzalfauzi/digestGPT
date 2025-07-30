// StripeCancel.jsx
export default function StripeCancel() {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Payment Cancelled</h2>
          <p className="text-gray-600 mb-6">No worries! You can try again anytime.</p>
          <button onClick={() => window.location.href = '/pricing'}>
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }
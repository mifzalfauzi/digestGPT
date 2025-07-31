// StripeCancel.jsx
export default function StripeCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Payment Cancelled</h2>
        <p className="dark:text-white mb-6">No worries! You can try again anytime.</p>
        <button
          onClick={() => window.location.href = '/upgrade'}
          className="px-4 py-2 rounded-lg font-bold transition-colors duration-200 
             bg-white text-black dark:bg-white dark:text-black 
             hover:bg-black hover:text-white dark:hover:bg-black dark:hover:text-white 
             "
        >
          Back to Pricing
        </button>

      </div>
    </div>
  );
}
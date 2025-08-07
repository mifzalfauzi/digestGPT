import React, { useState, useEffect } from 'react';
import { Check, Download, FileText, Calendar, CreditCard, User, Building, Loader2 } from 'lucide-react';

export default function InvoiceDisplay({ sessionId, invoiceData: propInvoiceData, invoiceFilename }) {
  const [invoiceData, setInvoiceData] = useState(propInvoiceData || null);
  const [isLoading, setIsLoading] = useState(!propInvoiceData && sessionId);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (sessionId && !propInvoiceData) {
      fetchInvoiceData();
    }
  }, [sessionId, propInvoiceData]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/stripe/invoice-data/${sessionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const data = await response.json();
      setInvoiceData(data);
    } catch (err) {
      console.error('Error fetching invoice data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceFilename) {
      alert('Invoice file not available for download');
      return;
    }

    try {
      setDownloadLoading(true);
      
      const response = await fetch(`http://localhost:8000/stripe/download-invoice/${invoiceFilename}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoiceFilename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#121212] rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#121212] from-green-500 to-emerald-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-green-100">Your subscription is now active</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">INVOICE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invoice ID:</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">{invoiceData.invoice_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-white">{invoiceData.invoice_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  {invoiceData.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Information</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <User className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{invoiceData.user_name}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{invoiceData.user_email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Building className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{invoiceData.company_name}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{invoiceData.company_address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Services</h3>
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoiceData.plan_name} Plan Subscription
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Monthly subscription
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoiceData.subscription_start_date && invoiceData.subscription_end_date ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {invoiceData.subscription_start_date} - {invoiceData.subscription_end_date}
                      </div>
                    ) : (
                      'Monthly'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                    {invoiceData.amount}
                  </td>
                </tr>
                <tr className="bg-green-50 dark:bg-green-900/20">
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900 dark:text-white text-right">
                    {invoiceData.amount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Information */}
        {/* <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Payment Method:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{invoiceData.payment_method}</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Status:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Completed</span>
              </div>
            </div>
            {invoiceData.subscription_id && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Subscription ID: <span className="font-mono">{invoiceData.subscription_id}</span>
                </p>
              </div>
            )}
          </div>
        </div> */}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* {invoiceFilename && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadLoading}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadLoading ? 'Downloading...' : 'Download PDF Invoice'}
            </button>
          )} */}
          
          <button
            onClick={() => window.location.href = '/assistant'}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Continue to DocuChat
          </button>
        </div>

        {/* Thank You Message */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Thank you for your subscription!
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              A confirmation email with your invoice has been sent to {invoiceData.user_email}.
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
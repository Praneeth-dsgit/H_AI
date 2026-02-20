/**
 * Billing Dashboard Component
 * View bills and make payments
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Calendar, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { billingService, Billing, Payment, PaymentData } from '../../services/billingService';

const BillingDashboard: React.FC = () => {
  const [bills, setBills] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Billing | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    billing_id: 0,
    payment_method: 'upi',
    amount: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadBills();
  }, [filterStatus]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await billingService.getBills({
        status: filterStatus || undefined,
      });
      if (result.success && result.bills) {
        setBills(result.bills);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (bill: Billing) => {
    setSelectedBill(bill);
    setPaymentData({
      billing_id: bill.billing_id,
      payment_method: 'upi',
      amount: bill.final_amount - (bill.status === 'partial' ? bill.total_amount : 0),
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      const result = await billingService.makePayment(paymentData);
      if (result.success) {
        setShowPaymentModal(false);
        await loadBills();
      }
    } catch (error) {
      console.error('Error making payment:', error);
    }
  };

  const handleDownloadInvoice = async (billingId: number) => {
    try {
      const blob = await billingService.downloadInvoice(billingId);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${billingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-8 w-8 mr-3 text-blue-600" />
            Billing & Payments
          </h1>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{bills.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bills.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{bills.reduce((sum, b) => sum + b.final_amount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Bills List */}
        {bills.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-12 text-center transition-all duration-300">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No bills found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.billing_id} className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bill #{bill.billing_id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(bill.status)}`}>
                        {getStatusIcon(bill.status)}
                        {bill.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-semibold text-gray-900">₹{bill.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Discount</p>
                        <p className="font-semibold text-gray-900">₹{bill.discount_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tax</p>
                        <p className="font-semibold text-gray-900">₹{bill.tax_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Final Amount</p>
                        <p className="font-semibold text-blue-600">₹{bill.final_amount.toLocaleString()}</p>
                      </div>
                    </div>
                    {bill.due_date && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due Date: {new Date(bill.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadInvoice(bill.billing_id)}
                      className="bg-gray-100 hover:bg-gray-200 hover:shadow-md hover:scale-105 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Invoice
                    </button>
                    {bill.status !== 'paid' && (
                      <button
                        onClick={() => handleMakePayment(bill)}
                        className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl hover:shadow-2xl max-w-md w-full p-6 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-4">Make Payment</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Amount to Pay</p>
                  <p className="text-2xl font-bold text-gray-900">₹{paymentData.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                {paymentData.payment_method === 'card' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      value={paymentData.transaction_id || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handlePaymentSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 text-white py-2 rounded-lg transition-all duration-200"
                  >
                    Pay ₹{paymentData.amount.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 hover:shadow-md hover:scale-105 text-gray-700 py-2 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;


import React, { useState } from 'react';
import { Printer, CheckCircle, Shield, X, Download } from 'lucide-react';

const PrintStatementButton = ({
  receiptData = null,
  referenceId = '#REC-1001',
  title = 'Payment Receipt Voucher',
  label = 'Print Receipt',
}) => {
  const [showModal, setShowModal] = useState(false);

  // Fallback / Normalized Receipt Details
  const details = {
    receiptNumber: receiptData?.receiptNumber || referenceId,
    customerName: receiptData?.customerId?.fullName || receiptData?.customerId?.name || receiptData?.customerName || 'Sarah Customer',
    customerPhone: receiptData?.customerId?.phone || receiptData?.customerPhone || '+1 (555) 018-3344',
    customerAddress: receiptData?.customerId?.address || receiptData?.customerAddress || 'Main District Branch, Sector B',
    amountPaid: receiptData?.amountPaid !== undefined ? receiptData.amountPaid : 350.00,
    newBalance: receiptData?.newRemainingBalance !== undefined ? receiptData.newRemainingBalance : 3850.00,
    paymentMethod: receiptData?.paymentMethod || 'Agent Doorstep Cash',
    paymentDate: receiptData?.paymentDate
      ? new Date(receiptData.paymentDate).toLocaleString()
      : new Date().toLocaleString(),
    collectedBy: receiptData?.collectedBy?.name || 'System Agent',
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition shadow-sm cursor-pointer"
        title={`View & print ${title}`}
      >
        <Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span>{label}</span>
      </button>

      {/* Printable Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white">
            
            {/* Modal Top Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Official Financial Voucher Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerPrint}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <Printer className="w-4 h-4" /> Print Voucher Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE RECEIPT CONTENT (Targeted by CSS print) */}
            <div id="printable-voucher-section" className="space-y-6 bg-slate-50 dark:bg-slate-950/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b-2 border-brand-500 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                      MICROFINANCE PRO
                    </h2>
                    <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                      Official Payment Clearance Voucher
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Receipt Ref:</span>
                  <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{details.receiptNumber}</div>
                </div>
              </div>

              {/* Customer & Transaction Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Customer Borrower:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{details.customerName}</div>
                  <div className="text-slate-500">{details.customerPhone}</div>
                  <div className="text-slate-400 text-[11px] truncate max-w-[200px]">{details.customerAddress}</div>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 font-medium">Payment Timestamp:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{details.paymentDate}</div>
                  <div className="text-slate-500 mt-1">Channel: <strong>{details.paymentMethod}</strong></div>
                  <div className="text-slate-500">Collector: <strong>{details.collectedBy}</strong></div>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Amount Received & Cleared</span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${Number(details.amountPaid).toFixed(2)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                  Updated Remaining Loan Balance: <strong className="text-slate-900 dark:text-white">${Number(details.newBalance).toFixed(2)}</strong>
                </span>
              </div>

              {/* Footer Signatures & Stamp */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-[11px] text-slate-400">
                <div>
                  <div className="w-32 border-b border-slate-400 dark:border-slate-600 mb-1" />
                  <span>Collector Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 text-emerald-600 flex items-center justify-center font-bold text-[9px] uppercase mx-auto mb-1 rotate-12">
                    Verified
                  </div>
                  <span>System Audit Stamp</span>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 dark:border-slate-600 mb-1" />
                  <span>Borrower Signature</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default PrintStatementButton;

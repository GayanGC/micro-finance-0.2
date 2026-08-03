import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formats currency values
 */
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Formats date values
 */
const fmtDate = (d) => {
  if (!d) return new Date().toLocaleDateString('en-US');
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generate and download a styled A5 Payment Receipt PDF.
 *
 * @param {Object} repayment - Repayment object
 * @param {Object} [customer] - Customer object (optional if embedded in repayment)
 * @param {Object} [loan] - Loan object (optional if embedded in repayment)
 */
export const generatePaymentReceipt = (repayment = {}, customer = null, loan = null) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5', // A5 is standard receipt voucher dimensions (148 x 210 mm)
    });

    const cust = customer || repayment.customerId || {};
    const loanObj = loan || repayment.loanId || {};
    const receiptNo = repayment.receiptNumber || `REC-${Date.now()}`;
    const paymentDate = fmtDate(repayment.paymentDate || repayment.createdAt);
    const amountPaid = repayment.amountPaid || 0;
    const penaltyPaid = repayment.penaltyPaid || 0;
    const newBalance = repayment.newRemainingBalance !== undefined ? repayment.newRemainingBalance : (loanObj.remainingBalance || 0);
    const collector = repayment.collectedBy?.name || repayment.collectedBy || 'Staff Agent';

    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header Banner Bar ───────────────────────────────────────────
    doc.setFillColor(79, 70, 229); // Brand Indigo (#4F46E5)
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MICROFINANCE v2.0', 12, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL PAYMENT RECEIPT VOUCHER', 12, 21);

    doc.text(`Receipt No: ${receiptNo}`, pageWidth - 12, 14, { align: 'right' });
    doc.text(`Date: ${paymentDate}`, pageWidth - 12, 21, { align: 'right' });

    // ── Customer & Loan Meta Section ────────────────────────────────
    let y = 35;

    // Left Column — Customer Info
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM:', 12, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name    : ${cust.fullName || cust.name || 'Valued Customer'}`, 12, y + 6);
    doc.text(`NIC      : ${cust.nicNumber || cust.nic || '—'}`, 12, y + 11);
    doc.text(`Phone  : ${cust.phone || '—'}`, 12, y + 16);

    // Right Column — Transaction Meta
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS:', pageWidth - 65, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`Method    : ${repayment.paymentMethod || 'Cash'}`, pageWidth - 65, y + 6);
    doc.text(`Loan ID   : #${String(loanObj._id || loanObj).slice(-8).toUpperCase()}`, pageWidth - 65, y + 11);
    doc.text(`Agent     : ${collector}`, pageWidth - 65, y + 16);

    y += 26;

    // ── Item Breakdown Table ───────────────────────────────────────
    autoTable(doc, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [['Description / Particulars', 'Amount ($)']],
      body: [
        ['Principal Repayment Portion', `$${fmt(amountPaid - penaltyPaid)}`],
        ...(penaltyPaid > 0 ? [['Late Fee & Penalty Collected', `$${fmt(penaltyPaid)}`]] : []),
        [{ content: 'TOTAL PAYMENT RECEIVED', styles: { fontStyle: 'bold' } }, `$${fmt(amountPaid)}`],
      ],
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── Summary Box ─────────────────────────────────────────────────
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(12, y, pageWidth - 24, 18, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('New Remaining Balance:', 16, y + 11);

    doc.setFontSize(12);
    doc.setTextColor(newBalance <= 0 ? 16 : 217, newBalance <= 0 ? 185 : 119, newBalance <= 0 ? 129 : 6); // Green if completed, Amber if positive
    doc.text(newBalance <= 0 ? '$0.00 (LOAN FULLY PAID OFF 🎉)' : `$${fmt(newBalance)}`, pageWidth - 16, y + 11, { align: 'right' });

    y += 32;

    // ── Signature & Footer ──────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    // Signature lines
    doc.line(16, y, 60, y);
    doc.text('Customer Signature', 16, y + 4);

    doc.line(pageWidth - 60, y, pageWidth - 16, y);
    doc.text('Authorized Agent Signature', pageWidth - 60, y + 4);

    // Footer note
    doc.setFontSize(7);
    doc.text('This is a computer-generated official receipt. Thank you for your payment!', pageWidth / 2, y + 14, { align: 'center' });

    // Download PDF
    doc.save(`Receipt_${receiptNo}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    alert('Failed to generate receipt PDF. Please try again.');
    return false;
  }
};

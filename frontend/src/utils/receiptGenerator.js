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
 * Generate and download a styled A5 Payment Receipt PDF using dynamic Tenant Settings & Letterhead.
 *
 * @param {Object} repayment - Repayment object
 * @param {Object} [customer] - Customer object (optional if embedded in repayment)
 * @param {Object} [loan] - Loan object (optional if embedded in repayment)
 * @param {Object} [settings] - Tenant Settings object (companyName, currencySymbol, signature, seal, etc.)
 */
export const generatePaymentReceipt = (repayment = {}, customer = null, loan = null, settings = null) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5', // A5 dimensions: 148 x 210 mm
    });

    const cust = customer || repayment.customerId || {};
    const loanObj = loan || repayment.loanId || {};
    const receiptNo = repayment.receiptNumber || `REC-${Date.now()}`;
    const paymentDate = fmtDate(repayment.paymentDate || repayment.createdAt);
    const amountPaid = repayment.amountPaid || 0;
    const penaltyPaid = repayment.penaltyPaid || 0;
    const newBalance = repayment.newRemainingBalance !== undefined ? repayment.newRemainingBalance : (loanObj.remainingBalance || 0);
    const collector = repayment.collectedBy?.name || repayment.collectedBy || 'Staff Agent';

    // Tenant & Letterhead Configuration
    const sysName = settings?.companyName || 'MICROFINANCE CORE BANKING';
    const sysAddress = settings?.companyAddress || '123 Financial District, Suite 400';
    const sysPhone = settings?.contactPhone || '+94 11 234 5678';
    const currSym = settings?.currencySymbol || '$';
    const directorSigUrl = settings?.directorSignatureUrl || '';
    const companySealUrl = settings?.companySealUrl || '';

    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header Banner Bar ───────────────────────────────────────────
    doc.setFillColor(79, 70, 229); // Brand Indigo (#4F46E5)
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(sysName.toUpperCase(), 12, 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sysAddress} | Tel: ${sysPhone}`, 12, 18);
    doc.text('OFFICIAL PAYMENT RECEIPT VOUCHER', 12, 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Receipt No: ${receiptNo}`, pageWidth - 12, 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Date: ${paymentDate}`, pageWidth - 12, 20, { align: 'right' });

    // ── Customer & Loan Meta Section ────────────────────────────────
    let y = 35;

    // Left Column — Customer Info
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM:', 12, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Name    : ${cust.fullName || cust.name || 'Valued Borrower'}`, 12, y + 5);
    doc.text(`NIC      : ${cust.nicNumber || cust.nic || '—'}`, 12, y + 10);
    doc.text(`Phone  : ${cust.phone || '—'}`, 12, y + 15);

    // Right Column — Transaction Meta
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS:', pageWidth - 65, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`Method    : ${repayment.paymentMethod || 'Cash'}`, pageWidth - 65, y + 5);
    doc.text(`Loan ID   : #${String(loanObj._id || loanObj).slice(-8).toUpperCase()}`, pageWidth - 65, y + 10);
    doc.text(`Agent     : ${collector}`, pageWidth - 65, y + 15);

    y += 24;

    // ── Item Breakdown Table ───────────────────────────────────────
    autoTable(doc, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [['Description / Particulars', `Amount (${currSym})`]],
      body: [
        ['Principal Repayment Portion', `${currSym}${fmt(amountPaid - penaltyPaid)}`],
        ...(penaltyPaid > 0 ? [['Late Fee & Penalty Collected', `${currSym}${fmt(penaltyPaid)}`]] : []),
        [{ content: 'TOTAL PAYMENT RECEIVED', styles: { fontStyle: 'bold' } }, `${currSym}${fmt(amountPaid)}`],
      ],
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    y = doc.lastAutoTable.finalY + 6;

    // ── Summary Box ─────────────────────────────────────────────────
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(12, y, pageWidth - 24, 16, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('New Remaining Balance:', 16, y + 10);

    doc.setFontSize(11);
    doc.setTextColor(newBalance <= 0 ? 16 : 217, newBalance <= 0 ? 185 : 119, newBalance <= 0 ? 129 : 6);
    doc.text(
      newBalance <= 0 ? `${currSym}0.00 (LOAN FULLY PAID OFF 🎉)` : `${currSym}${fmt(newBalance)}`,
      pageWidth - 16,
      y + 10,
      { align: 'right' }
    );

    y += 28;

    // ── Optional Signature / Stamp Asset Embeds ─────────────────────
    if (directorSigUrl) {
      try {
        doc.addImage(directorSigUrl, 'PNG', pageWidth - 55, y - 12, 35, 12);
      } catch (e) {
        // Fallback if image fails to render
      }
    }

    if (companySealUrl) {
      try {
        doc.addImage(companySealUrl, 'PNG', 25, y - 14, 20, 20);
      } catch (e) {
        // Fallback if seal image fails
      }
    }

    // ── Signature Lines & Footer ───────────────────────────────────
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.line(16, y, 60, y);
    doc.text('Customer Signature', 16, y + 4);

    doc.line(pageWidth - 60, y, pageWidth - 16, y);
    doc.text('Authorized Director Signature', pageWidth - 60, y + 4);

    // Footer Disclaimer
    doc.setFontSize(6.5);
    doc.text(
      `This is a computer-generated official receipt issued by ${sysName}. Thank you for your payment!`,
      pageWidth / 2,
      y + 12,
      { align: 'center' }
    );

    // Save PDF
    doc.save(`Receipt_${receiptNo}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    alert('Failed to generate receipt PDF. Please try again.');
    return false;
  }
};

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TransactionData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  payment_method?: {
    card?: {
      brand: string;
      last4: string;
    };
  };
  fees?: number;
  net?: number;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private companyInfo: CompanyInfo;

  constructor() {
    this.doc = new jsPDF();
    this.companyInfo = {
      name: 'GreenScape Lux',
      address: '123 Garden Ave, Green City, GC 12345',
      phone: '(555) 123-4567',
      email: 'billing@greenscapelux.com',
      website: 'www.greenscapelux.com'
    };
  }

  private addHeader(title: string) {
    this.doc.setFontSize(20);
    this.doc.setTextColor(34, 139, 34);
    this.doc.text(this.companyInfo.name, 20, 30);
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(this.companyInfo.address, 20, 40);
    this.doc.text(this.companyInfo.phone, 20, 48);
    this.doc.text(this.companyInfo.email, 20, 56);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, 20, 80);
    
    this.doc.line(20, 85, 190, 85);
  }

  generateInvoice(transaction: TransactionData): void {
    this.doc = new jsPDF();
    this.addHeader('Invoice');
    
    const date = new Date(transaction.created * 1000).toLocaleDateString();
    
    this.doc.setFontSize(12);
    this.doc.text(`Invoice #: ${transaction.id}`, 20, 100);
    this.doc.text(`Date: ${date}`, 20, 110);
    this.doc.text(`Status: ${transaction.status.toUpperCase()}`, 20, 120);
    
    if (transaction.payment_method?.card) {
      this.doc.text(`Payment Method: ${transaction.payment_method.card.brand.toUpperCase()} ****${transaction.payment_method.card.last4}`, 20, 130);
    }
    
    const tableData = [
      ['Description', 'Amount'],
      [transaction.description || 'Service Payment', `$${(transaction.amount / 100).toFixed(2)}`],
      ['Processing Fee', `$${((transaction.fees || 0) / 100).toFixed(2)}`],
      ['Net Amount', `$${((transaction.net || transaction.amount) / 100).toFixed(2)}`]
    ];
    
    (this.doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 150,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] }
    });
    
    this.doc.setFontSize(10);
    this.doc.text('Thank you for your business!', 20, this.doc.internal.pageSize.height - 30);
  }

  generateBulkReport(transactions: TransactionData[], dateRange: string): void {
    this.doc = new jsPDF();
    this.addHeader(`Transaction Report - ${dateRange}`);
    
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fees || 0), 0);
    const totalNet = transactions.reduce((sum, t) => sum + (t.net || t.amount), 0);
    
    this.doc.setFontSize(12);
    this.doc.text(`Total Transactions: ${transactions.length}`, 20, 100);
    this.doc.text(`Total Amount: $${(totalAmount / 100).toFixed(2)}`, 20, 110);
    this.doc.text(`Total Fees: $${(totalFees / 100).toFixed(2)}`, 20, 120);
    this.doc.text(`Net Amount: $${(totalNet / 100).toFixed(2)}`, 20, 130);
    
    const tableData = transactions.map(t => [
      t.id.substring(0, 20) + '...',
      new Date(t.created * 1000).toLocaleDateString(),
      t.status.toUpperCase(),
      `$${(t.amount / 100).toFixed(2)}`,
      t.payment_method?.card ? `${t.payment_method.card.brand.toUpperCase()} ****${t.payment_method.card.last4}` : 'N/A'
    ]);
    
    (this.doc as any).autoTable({
      head: [['Transaction ID', 'Date', 'Status', 'Amount', 'Payment Method']],
      body: tableData,
      startY: 150,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 34] },
      styles: { fontSize: 8 }
    });
  }

  download(filename: string): void {
    this.doc.save(filename);
  }
}
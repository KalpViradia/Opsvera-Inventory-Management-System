import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#334155',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  companyInfo: {
    maxWidth: 250,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 4,
  },
  titleArea: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 11,
    color: '#0f172a',
    marginBottom: 2,
  },
  table: {
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  th: {
    fontSize: 9,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 10,
    color: '#1e293b',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsBox: {
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  totalRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#0f172a',
  },
  totalLabel: {
    fontSize: 10,
    color: '#475569',
  },
  totalValue: {
    fontSize: 10,
    color: '#0f172a',
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  }
});

// Using a unified interface for the component so it works for both POs and SOs
export interface InvoiceTemplateData {
  title: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  companyName: string;
  companyCurrency: string;
  partyName: string; // Customer or Supplier
  partyAddress: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
}

export const InvoicePDFTemplate = ({ data }: { data: InvoiceTemplateData }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.companyCurrency || 'USD',
    }).format(val);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.companyName}</Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.documentTitle}>{data.title}</Text>
            <Text style={styles.metaValue}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Meta Grid (Bill To, Dates) */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Bill To:</Text>
            <Text style={[styles.metaValue, { fontWeight: 600 }]}>{data.partyName}</Text>
            {data.partyAddress && <Text style={styles.metaValue}>{data.partyAddress}</Text>}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Date Issued:</Text>
            <Text style={styles.metaValue}>{data.date}</Text>
            
            {data.dueDate && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.metaLabel}>Due Date:</Text>
                <Text style={styles.metaValue}>{data.dueDate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.col1]}>Description</Text>
            <Text style={[styles.th, styles.col2]}>Quantity</Text>
            <Text style={[styles.th, styles.col3]}>Unit Price</Text>
            <Text style={[styles.th, styles.col4]}>Total</Text>
          </View>
          
          {data.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.td, styles.col1]}>{item.name}</Text>
              <Text style={[styles.td, styles.col2]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.col3]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.td, styles.col4, { fontWeight: 600 }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
            </View>
            
            {data.discount !== undefined && data.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>-{formatCurrency(data.discount)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.taxAmount)}</Text>
            </View>
            
            <View style={styles.totalRowLast}>
              <Text style={[styles.totalLabel, { fontWeight: 700 }]}>Total Due</Text>
              <Text style={styles.grandTotal}>{formatCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business. Generated by Opsvera.</Text>
        </View>
        
      </Page>
    </Document>
  );
};

export default InvoicePDFTemplate;

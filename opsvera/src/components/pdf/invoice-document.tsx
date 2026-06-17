import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SalesOrder, Customer, SalesOrderItem, Product } from "@prisma/client";

export type SalesOrderWithRelations = SalesOrder & {
  customer: Customer;
  items: (SalesOrderItem & { product: Product })[];
};
// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  companyInfo: {
    fontSize: 10,
    color: "#475569",
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 8,
    color: "#0f172a",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: "#64748b",
    width: 100,
  },
  value: {
    fontSize: 10,
    color: "#0f172a",
    flex: 1,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f8fafc",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableColHeaderWide: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f8fafc",
  },
  tableColWide: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
    color: "#0f172a",
  },
  totalsContainer: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  totalLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 10,
    color: "#0f172a",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#0f172a",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

export function InvoiceDocument({ order, companyName }: { order: SalesOrderWithRelations, companyName: string }) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const subtotal = order.totalAmount.toNumber() - order.taxAmount.toNumber() + order.discount.toNumber();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>{order.soNumber}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontWeight: "bold", fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{companyName}</Text>
            <Text>Generated on: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Order Info & Customer */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 30 }}>
          <View style={{ width: "45%" }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#0f172a", marginBottom: 2 }}>{order.customer.name}</Text>
            {order.customer.email && <Text style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{order.customer.email}</Text>}
            {order.customer.address && (
              <Text style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                {order.customer.address}
              </Text>
            )}
          </View>
          
          <View style={{ width: "45%" }}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Order Date:</Text>
              <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{order.status}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeaderWide}>
              <Text style={styles.tableCellHeader}>Item Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Unit Price</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>
          
          {/* Table Body */}
          {order.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>{item.product.name}</Text>
                <Text style={{ fontSize: 8, color: "#64748b", marginHorizontal: 5, marginBottom: 5 }}>SKU: {item.product.sku}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrency(item.unitPrice.toNumber())}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrency(item.total.toNumber())}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          
          {order.discount.toNumber() > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{formatCurrency(order.discount.toNumber())}</Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.taxAmount.toNumber())}</Text>
          </View>
          
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.totalAmount.toNumber())}</Text>
          </View>
        </View>

        {order.notes && (
          <View style={{ marginTop: 40 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 10, color: "#475569" }}>{order.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Thank you for your business. Generated by Opsvera.
        </Text>
      </Page>
    </Document>
  );
}

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#666",
  },
  value: {
    fontWeight: "bold",
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  footer: {
    marginTop: 40,
    fontSize: 10,
    color: "#888",
    textAlign: "center",
  },
});

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceTzs: number;
  totalPriceTzs: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  orderDate: string;
  vendorName: string;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  customerName: string;
  customerPhone?: string | null;
  studentName?: string | null;
  schoolName?: string | null;
  items: InvoiceItem[];
  totalAmountTzs: number;
  paymentStatus: string;
}

export function InvoiceDocument(data: InvoiceData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Shuleyetu</Text>
          <Text style={styles.subtitle}>Invoice #{data.invoiceNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Invoice Date</Text>
          <Text>{data.invoiceDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Order Date</Text>
          <Text>{data.orderDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID</Text>
          <Text>{data.orderId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Status</Text>
          <Text style={styles.value}>{data.paymentStatus.toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor</Text>
          <Text>{data.vendorName}</Text>
          {data.vendorEmail ? <Text>{data.vendorEmail}</Text> : null}
          {data.vendorPhone ? <Text>{data.vendorPhone}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text>{data.customerName}</Text>
          {data.customerPhone ? <Text>{data.customerPhone}</Text> : null}
          {data.studentName ? <Text>Student: {data.studentName}</Text> : null}
          {data.schoolName ? <Text>School: {data.schoolName}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.unitPriceTzs.toLocaleString()} TZS</Text>
              <Text style={styles.colTotal}>{item.totalPriceTzs.toLocaleString()} TZS</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.value}>
              Total: {data.totalAmountTzs.toLocaleString()} TZS
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for shopping with Shuleyetu!</Text>
          <Text>For support, contact help@shuleyetu.test</Text>
        </View>
      </Page>
    </Document>
  );
}

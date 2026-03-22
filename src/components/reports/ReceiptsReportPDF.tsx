import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

interface WeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  items: {
    itemNumber: number;
    descriptionCategory: string;
    itemDescription: string;
    location: string;
    paymentMethod: string;
    transactionDate: string;
    amount: number;
    movementType: string;
    receiptUrls: string[];
  }[];
}

interface ReceiptsReportPDFProps {
  projectName: string;
  technicalManager: string;
  weeks: WeekSummary[];
  filterPeriod?: string;
}

const colors = {
  primary: '#1a365d',
  secondary: '#2d4a7a',
  accent: '#3182ce',
  success: '#276749',
  danger: '#c53030',
  lightBg: '#f7fafc',
  border: '#e2e8f0',
  text: '#2d3748',
  muted: '#718096',
  white: '#ffffff',
  headerBg: '#1a365d',
};

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 40, fontSize: 9, color: colors.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25, paddingBottom: 15, borderBottom: `2px solid ${colors.primary}` },
  headerLeft: { flex: 1 },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 },
  projectName: { fontSize: 13, color: colors.secondary, marginBottom: 2 },
  headerMeta: { fontSize: 8, color: colors.muted },
  headerRight: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 3 },
  reportDate: { fontSize: 8, color: colors.muted },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 10, marginTop: 5, paddingBottom: 4, borderBottom: `1px solid ${colors.border}` },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.headerBg, padding: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: 10 },
  weekTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.white },
  weekPeriod: { fontSize: 8, color: '#cbd5e0' },
  recordContainer: { marginBottom: 20, borderBottom: `1px solid ${colors.border}`, paddingBottom: 15 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, backgroundColor: colors.lightBg, padding: 6, borderRadius: 4 },
  recordInfo: { flex: 1 },
  recordLabel: { fontSize: 7, color: colors.muted, textTransform: 'uppercase', marginBottom: 2 },
  recordValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.text },
  recordAmount: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 7, color: colors.muted, textTransform: 'uppercase', marginBottom: 2 },
  amountValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  receiptsContainer: { marginTop: 10 },
  receiptsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.secondary, marginBottom: 5 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  receiptImage: { width: 200, height: 150, objectFit: 'contain', borderRadius: 4, border: `1px solid ${colors.border}` },
  noReceiptText: { fontSize: 8, color: colors.muted, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTop: `1px solid ${colors.border}`, paddingTop: 8 },
  footerText: { fontSize: 7, color: colors.muted },
});

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateBR = (dateStr: string) => {
  try {
    return format(new Date(`${dateStr}T12:00:00`), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

const ReceiptsReportPDF: React.FC<ReceiptsReportPDFProps> = ({
  projectName, technicalManager, weeks, filterPeriod,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>Balix Construtora</Text>
            <Text style={styles.projectName}>{projectName}</Text>
            <Text style={styles.headerMeta}>Resp. Técnico: {technicalManager || '—'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Relatório de Comprovantes</Text>
            <Text style={styles.reportDate}>Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
            {filterPeriod && <Text style={styles.reportDate}>Período: {filterPeriod}</Text>}
          </View>
        </View>

        {/* Detailed weeks */}
        <Text style={styles.sectionTitle}>Listagem de Comprovantes por Semana</Text>

        {weeks.map((wk, wkIdx) => (
          <View key={wkIdx} style={{ marginBottom: 20 }}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Semana {String(wk.weekNumber).padStart(2, '0')}</Text>
              <Text style={styles.weekPeriod}>{formatDateBR(wk.startDate)} — {formatDateBR(wk.endDate)}</Text>
            </View>

            <View style={{ marginTop: 10 }}>
              {wk.items.map((item, idx) => (
                <View key={idx} style={styles.recordContainer} wrap={false}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordLabel}>Item {wk.weekNumber}.{item.itemNumber} — {item.descriptionCategory}</Text>
                      <Text style={styles.recordValue}>{item.itemDescription}</Text>
                    </View>
                    <View style={{ width: 100 }}>
                      <Text style={styles.recordLabel}>Data</Text>
                      <Text style={styles.recordValue}>{formatDateBR(item.transactionDate)}</Text>
                    </View>
                    <View style={styles.recordAmount}>
                      <Text style={styles.amountLabel}>Valor ({item.movementType})</Text>
                      <Text style={[styles.amountValue, { color: item.movementType === 'entrada' ? colors.success : colors.danger }]}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 20, marginBottom: 5 }}>
                    <View>
                      <Text style={styles.recordLabel}>Local</Text>
                      <Text style={styles.recordValue}>{item.location}</Text>
                    </View>
                    <View>
                      <Text style={styles.recordLabel}>Pagamento</Text>
                      <Text style={styles.recordValue}>{item.paymentMethod}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.receiptsContainer}>
                    <Text style={styles.receiptsTitle}>Comprovantes:</Text>
                    {item.receiptUrls && item.receiptUrls.length > 0 ? (
                      <View style={styles.imagesGrid}>
                        {item.receiptUrls.map((url, imgIdx) => (
                          <Image key={imgIdx} src={url} style={styles.receiptImage} />
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noReceiptText}>Sem comprovante anexado</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Balix Construtora — {projectName}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptsReportPDF;

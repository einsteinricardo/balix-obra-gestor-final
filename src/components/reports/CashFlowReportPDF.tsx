import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

interface WeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  entradas: number;
  saidas: number;
  saldoSemana: number;
  saldoAnterior: number;
  saldoAcumulado: number;
  items: {
    itemNumber: number;
    descriptionCategory: string;
    itemDescription: string;
    location: string;
    paymentMethod: string;
    transactionDate: string;
    amount: number;
    movementType: string;
  }[];
}

interface CashFlowReportPDFProps {
  projectName: string;
  technicalManager: string;
  weeks: WeekSummary[];
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
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
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${colors.border}` },
  summaryCardLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
  summaryCardValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 10, marginTop: 5, paddingBottom: 4, borderBottom: `1px solid ${colors.border}` },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.headerBg, padding: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: 10 },
  weekTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.white },
  weekPeriod: { fontSize: 8, color: '#cbd5e0' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.lightBg, borderBottom: `1px solid ${colors.border}`, paddingVertical: 5, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottom: `0.5px solid ${colors.border}`, paddingVertical: 4, paddingHorizontal: 4 },
  tableRowAlt: { flexDirection: 'row', borderBottom: `0.5px solid ${colors.border}`, paddingVertical: 4, paddingHorizontal: 4, backgroundColor: '#fafbfc' },
  colItem: { width: '8%', fontSize: 8 },
  colDesc: { width: '18%', fontSize: 8 },
  colDetail: { width: '22%', fontSize: 8 },
  colLocation: { width: '14%', fontSize: 8 },
  colPayment: { width: '14%', fontSize: 8 },
  colDate: { width: '10%', fontSize: 8 },
  colAmount: { width: '14%', fontSize: 8, textAlign: 'right' as const },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.muted, textTransform: 'uppercase' as const },
  weekTotals: { backgroundColor: colors.lightBg, padding: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, flexDirection: 'row', justifyContent: 'flex-end', gap: 20, borderTop: `1px solid ${colors.border}` },
  totalLabel: { fontSize: 8, color: colors.muted },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  grandTotalTable: { marginTop: 20, border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' },
  grandTotalHeader: { flexDirection: 'row', backgroundColor: colors.headerBg, padding: 8 },
  grandTotalHeaderText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.white, flex: 1, textAlign: 'center' as const },
  grandTotalRow: { flexDirection: 'row', padding: 8, borderBottom: `0.5px solid ${colors.border}` },
  grandTotalCell: { flex: 1, fontSize: 9, textAlign: 'center' as const },
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

const CashFlowReportPDF: React.FC<CashFlowReportPDFProps> = ({
  projectName, technicalManager, weeks, totalEntradas, totalSaidas, saldoFinal, filterPeriod,
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
            <Text style={styles.reportTitle}>Relatório de Fluxo de Caixa</Text>
            <Text style={styles.reportDate}>Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
            {filterPeriod && <Text style={styles.reportDate}>Período: {filterPeriod}</Text>}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#f0fff4' }]}>
            <Text style={styles.summaryCardLabel}>Total Entradas</Text>
            <Text style={[styles.summaryCardValue, { color: colors.success }]}>{formatCurrency(totalEntradas)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fff5f5' }]}>
            <Text style={styles.summaryCardLabel}>Total Saídas</Text>
            <Text style={[styles.summaryCardValue, { color: colors.danger }]}>{formatCurrency(totalSaidas)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.lightBg }]}>
            <Text style={styles.summaryCardLabel}>Saldo Final (Caixa)</Text>
            <Text style={[styles.summaryCardValue, { color: saldoFinal >= 0 ? colors.success : colors.danger }]}>{formatCurrency(saldoFinal)}</Text>
          </View>
        </View>

        {/* Consolidated table */}
        <Text style={styles.sectionTitle}>Resumo por Semana</Text>
        <View style={styles.grandTotalTable}>
          <View style={styles.grandTotalHeader}>
            <Text style={styles.grandTotalHeaderText}>Semana</Text>
            <Text style={styles.grandTotalHeaderText}>Período</Text>
            <Text style={styles.grandTotalHeaderText}>Entradas</Text>
            <Text style={styles.grandTotalHeaderText}>Saídas</Text>
            <Text style={styles.grandTotalHeaderText}>Saldo Anterior</Text>
            <Text style={styles.grandTotalHeaderText}>Saldo Semana</Text>
            <Text style={styles.grandTotalHeaderText}>Saldo Acumulado</Text>
          </View>
          {weeks.map((wk, idx) => (
            <View key={idx} style={[styles.grandTotalRow, idx % 2 !== 0 && { backgroundColor: '#fafbfc' }]}>
              <Text style={styles.grandTotalCell}>Sem. {String(wk.weekNumber).padStart(2, '0')}</Text>
              <Text style={[styles.grandTotalCell, { fontSize: 7 }]}>{formatDateBR(wk.startDate)} - {formatDateBR(wk.endDate)}</Text>
              <Text style={[styles.grandTotalCell, { color: colors.success }]}>{formatCurrency(wk.entradas)}</Text>
              <Text style={[styles.grandTotalCell, { color: colors.danger }]}>{formatCurrency(wk.saidas)}</Text>
              <Text style={[styles.grandTotalCell, { color: wk.saldoAnterior >= 0 ? colors.success : colors.danger }]}>{formatCurrency(wk.saldoAnterior)}</Text>
              <Text style={[styles.grandTotalCell, { color: wk.saldoSemana >= 0 ? colors.success : colors.danger }]}>{formatCurrency(wk.saldoSemana)}</Text>
              <Text style={[styles.grandTotalCell, { fontFamily: 'Helvetica-Bold', color: wk.saldoAcumulado >= 0 ? colors.success : colors.danger }]}>{formatCurrency(wk.saldoAcumulado)}</Text>
            </View>
          ))}
        </View>

        {/* Detailed weeks */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Detalhamento por Semana</Text>

        {weeks.map((wk, wkIdx) => (
          <View key={wkIdx} wrap={false} style={{ marginBottom: 12 }}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Semana {String(wk.weekNumber).padStart(2, '0')}</Text>
              <Text style={styles.weekPeriod}>{formatDateBR(wk.startDate)} — {formatDateBR(wk.endDate)}</Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.colItem, styles.thText]}>Item</Text>
              <Text style={[styles.colDesc, styles.thText]}>Descrição</Text>
              <Text style={[styles.colDetail, styles.thText]}>Detalhamento</Text>
              <Text style={[styles.colLocation, styles.thText]}>Local</Text>
              <Text style={[styles.colPayment, styles.thText]}>Pagamento</Text>
              <Text style={[styles.colDate, styles.thText]}>Data</Text>
              <Text style={[styles.colAmount, styles.thText]}>Valor</Text>
            </View>

            {wk.items.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.colItem}>{wk.weekNumber}.{item.itemNumber}</Text>
                <Text style={[styles.colDesc, { color: item.movementType === 'entrada' ? colors.success : colors.danger }]}>{item.descriptionCategory}</Text>
                <Text style={styles.colDetail}>{item.itemDescription}</Text>
                <Text style={styles.colLocation}>{item.location}</Text>
                <Text style={styles.colPayment}>{item.paymentMethod}</Text>
                <Text style={styles.colDate}>{formatDateBR(item.transactionDate)}</Text>
                <Text style={[styles.colAmount, { fontFamily: 'Helvetica-Bold', color: item.movementType === 'entrada' ? colors.success : colors.danger }]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}

            <View style={styles.weekTotals}>
              <View>
                <Text style={styles.totalLabel}>Saldo Anterior</Text>
                <Text style={[styles.totalValue, { color: wk.saldoAnterior >= 0 ? colors.success : colors.danger }]}>{formatCurrency(wk.saldoAnterior)}</Text>
              </View>
              <View>
                <Text style={styles.totalLabel}>Entradas</Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>{formatCurrency(wk.entradas)}</Text>
              </View>
              <View>
                <Text style={styles.totalLabel}>Saídas</Text>
                <Text style={[styles.totalValue, { color: colors.danger }]}>{formatCurrency(wk.saidas)}</Text>
              </View>
              <View>
                <Text style={styles.totalLabel}>Saldo Acumulado</Text>
                <Text style={[styles.totalValue, { color: wk.saldoAcumulado >= 0 ? colors.success : colors.danger }]}>{formatCurrency(wk.saldoAcumulado)}</Text>
              </View>
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

export default CashFlowReportPDF;

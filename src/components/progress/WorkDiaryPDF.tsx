
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { WorkDiaryEntry } from '@/types/progress';
import { format } from 'date-fns';

interface WorkDiaryPDFProps {
  entries: WorkDiaryEntry[];
  projectName: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 15,
    borderBottom: '1px solid #ccc',
    paddingBottom: 5,
  },
  entryContainer: {
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  entryDate: {
    fontSize: 12,
    color: '#555',
  },
  entryWeather: {
    fontSize: 10,
    color: '#666',
  },
  entryDescription: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  entryImage: {
    maxWidth: '100%',
    maxHeight: 200,
    marginVertical: 10,
    alignSelf: 'center',
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
    borderTop: '1px solid #ccc',
    paddingTop: 5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: '#555',
  },
});

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

const getWeatherLabel = (weather?: string) => {
  switch (weather) {
    case 'sunny':
      return 'Ensolarado';
    case 'cloudy':
      return 'Nublado';
    case 'rainy':
      return 'Chuvoso';
    default:
      return 'Não informado';
  }
};

const WorkDiaryPDF: React.FC<WorkDiaryPDFProps> = ({ entries, projectName }) => {
  // Group entries by date
  const entriesByDate = entries.reduce<Record<string, WorkDiaryEntry[]>>((acc, entry) => {
    const date = formatDate(entry.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Diário de Obra - {projectName}
        </Text>
        
        <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 20 }}>
          Relatório gerado em {format(new Date(), 'dd/MM/yyyy')}
        </Text>
        
        {sortedDates.map((date) => (
          <View key={date} wrap={false}>
            <Text style={styles.subHeader}>
              Data: {date}
            </Text>
            
            {entriesByDate[date].map((entry, index) => (
              <View key={entry.id} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    Registro #{index + 1}
                  </Text>
                  {entry.weather && (
                    <Text style={styles.entryWeather}>
                      Clima: {getWeatherLabel(entry.weather)}
                    </Text>
                  )}
                </View>
                
                <Text style={styles.entryDescription}>
                  {entry.description}
                </Text>
                
                {entry.image_url && (
                  <Image src={entry.image_url} style={styles.entryImage} />
                )}
              </View>
            ))}
          </View>
        ))}
        
        <Text style={styles.footer}>
          © {new Date().getFullYear()} - Diário de Obra - {projectName}
        </Text>
        
        <Text 
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default WorkDiaryPDF;

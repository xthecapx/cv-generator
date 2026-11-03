import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { CvSection as CvSectionType } from '@/types';

const MARKDOWN_LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

function normalizeUrl(url: string): string {
  return /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
}

function DetailText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return (
    <Text style={sectionStyles.detailItem}>
      {parts.map((part, index) => {
        const match = part.match(MARKDOWN_LINK);
        if (match) {
          return (
            <Link key={index} src={normalizeUrl(match[2])} style={{ color: '#000000' }}>
              {match[1]}
            </Link>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

export const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginBottom: 4,
  },
  itemContainer: {
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  primaryText: {
    fontFamily: 'Helvetica-Bold',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#666666',
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  detailsList: {
    marginLeft: 6,
    marginBottom: 6,
  },
  detailItem: {
    fontSize: 10,
    marginBottom: 1,
  },
  bullet: {
    width: 6,
  }
});

interface CvSectionProps {
  section: CvSectionType;
}

export function Section({ section }: CvSectionProps) {
  return (
    <View style={sectionStyles.section} break={section.break}>
      <Text style={sectionStyles.sectionTitle}>{section.title}</Text>
      
      {section.items.map((item, itemIndex) => (
        <View key={itemIndex} style={sectionStyles.itemContainer} break={item.break}>
          {(item.primary || item.primaryRight) && (
            <View style={sectionStyles.headerRow}>
              <Text style={sectionStyles.primaryText}>{item.primary}</Text>
              <Text>{item.primaryRight}</Text>
            </View>
          )}
          
          {(item.secondary || item.secondaryRight) && (
            <View style={sectionStyles.secondaryRow}>
              <Text>{item.secondary}</Text>
              <Text>{item.secondaryRight}</Text>
            </View>
          )}
          
          {item.details && (
            <View style={sectionStyles.detailsList}>
              {item.plain
                ? item.details.map((detail, detailIndex) => (
                    <Text key={detailIndex} style={sectionStyles.detailItem}>
                      <DetailText text={detail} />
                    </Text>
                  ))
                : item.details.map((detail, detailIndex) => (
                    <View key={detailIndex} style={{ flexDirection: 'row' }}>
                      <Text style={sectionStyles.bullet}>• </Text>
                      <DetailText text={detail} />
                    </View>
                  ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
} 
import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { CvSection as CvSectionType } from '@/types';
import { cjkHyphenation } from '@/utils/cjkText';

const MARKDOWN_LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

function normalizeUrl(url: string): string {
  return /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
}

function DetailText({ text, scale }: { text: string; scale: number }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return (
    <Text hyphenationCallback={cjkHyphenation(text)} style={[sectionStyles.detailItem, { fontSize: 10 * scale }]}>
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
    fontWeight: 700,
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
    fontWeight: 700,
    flexShrink: 1,
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
    flexShrink: 1,
  },
  bullet: {
    width: 6,
  }
});

interface CvSectionProps {
  section: CvSectionType;
  scale?: number;
  customFont?: boolean;
}

export function Section({ section, scale = 1, customFont = false }: CvSectionProps) {
  return (
    <View style={sectionStyles.section} break={section.break}>
      <Text hyphenationCallback={cjkHyphenation(section.title)} style={[sectionStyles.sectionTitle, { fontSize: 14 * scale }, customFont ? {} : { fontFamily: 'Helvetica-Bold' }]}>{section.title}</Text>
      
      {section.items.map((item, itemIndex) => (
        <View key={itemIndex} style={sectionStyles.itemContainer} break={item.break}>
          {(item.primary || item.primaryRight) && (
            <View style={sectionStyles.headerRow}>
              <Text hyphenationCallback={cjkHyphenation(item.primary || '')} style={[sectionStyles.primaryText, customFont ? {} : { fontFamily: 'Helvetica-Bold' }]}>{item.primary}</Text>
              <Text hyphenationCallback={cjkHyphenation(item.primaryRight || '')} style={{ flexShrink: 1, marginLeft: 8, textAlign: 'right' }}>{item.primaryRight}</Text>
            </View>
          )}
          
          {(item.secondary || item.secondaryRight) && (
            <View style={[sectionStyles.secondaryRow, { fontSize: 10 * scale, fontStyle: customFont ? 'normal' : 'italic' }, customFont ? {} : { fontFamily: 'Helvetica-Oblique' }]}>
              <Text hyphenationCallback={cjkHyphenation(item.secondary || '')} style={{ flexShrink: 1 }}>{item.secondary}</Text>
              <Text hyphenationCallback={cjkHyphenation(item.secondaryRight || '')} style={{ flexShrink: 1, marginLeft: 8, textAlign: 'right' }}>{item.secondaryRight}</Text>
            </View>
          )}
          
          {item.details && (
            <View style={sectionStyles.detailsList}>
              {item.plain
                ? item.details.map((detail, detailIndex) => (
                    <DetailText key={detailIndex} text={detail} scale={scale} />
                  ))
                : item.details.map((detail, detailIndex) => (
                    <View key={detailIndex} style={{ flexDirection: 'row' }}>
                      <Text style={[sectionStyles.bullet, { width: 6 * scale, fontSize: 10 * scale }]}>• </Text>
                      <DetailText text={detail} scale={scale} />
                    </View>
                  ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

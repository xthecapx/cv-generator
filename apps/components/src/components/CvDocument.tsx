import { Document, Page, StyleSheet, View, Text, Link } from '@react-pdf/renderer';
import { Section } from '@/components/Section';
import { CvData, CvRenderOptions } from '@/types';
import { contactUrl, pdfFontSize } from '@/utils/pdfOptions';
import { cjkHyphenation } from '@/utils/cjkText';

export const documentStyles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', fontSize: 12 },
  viewer: { width: '100%', height: '100vh' },
  header: { marginBottom: 16, textAlign: 'center' },
  name: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 18, marginBottom: 8, color: '#333333' },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  contactText: { color: '#333333', fontSize: 10, marginHorizontal: 4, marginBottom: 2, maxWidth: '100%' },
});

function ContactValue({ value, url }: { value: string; url?: string }) {
  const markdownLink = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  const text = markdownLink ? markdownLink[1] : value;
  const href = markdownLink ? contactUrl(markdownLink[2]) : url || contactUrl(value);
  return href ? <Link src={href} style={{ color: '#333333' }}>{text}</Link> : <Text>{text}</Text>;
}

export const CvDocument = ({ cvData, options = {} }: { cvData: CvData; options?: CvRenderOptions }) => {
  const fontSize = pdfFontSize(cvData.properties?.['font-size'], pdfFontSize(options.fontSize));
  const scale = fontSize / 12;
  const { contact } = cvData;
  const entries = [
    { label: 'Phone', value: contact.phone, url: contact.phone ? `tel:${contact.phone}` : undefined },
    { label: 'Email', value: contact.email, url: contact.email ? `mailto:${contact.email}` : undefined },
    { label: 'Location', value: contact.location, url: undefined },
    ...contact.links.map(link => ({ label: link.text, value: link.url, url: contactUrl(link.url, true) })),
    ...(contact.details || []).map(detail => ({ ...detail, url: undefined })),
  ].filter(entry => entry.value?.trim());

  return (
    <Document>
      <Page size="A4" style={[documentStyles.page, { fontSize, fontFamily: options.fontFamily || 'Helvetica' }]}>
        <View style={documentStyles.header}>
          <Text hyphenationCallback={cjkHyphenation(contact.name)} style={[documentStyles.name, { fontSize: 24 * scale, fontFamily: options.fontFamily || 'Helvetica-Bold' }]}>{contact.name}</Text>
          {contact.title && <Text hyphenationCallback={cjkHyphenation(contact.title)} style={[documentStyles.title, { fontSize: 18 * scale }]}>{contact.title}</Text>}
          <View style={documentStyles.contactRow}>
            {entries.map((entry, index) => (
              <Text key={index} hyphenationCallback={cjkHyphenation(entry.label + entry.value)} style={[documentStyles.contactText, { fontSize: 10 * scale }]}>
                {entry.label}: <ContactValue value={entry.value} url={entry.url} />
              </Text>
            ))}
          </View>
        </View>
        {cvData.sections.map((section, index) => (
          <Section key={index} section={section} scale={scale} customFont={Boolean(options.fontFamily)} />
        ))}
      </Page>
    </Document>
  );
};

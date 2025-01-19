import { Fragment } from 'react';
import { CvSection } from "@/components/CvSection";
import { CvData } from "@/utils/cvConverter";
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  viewer: {
    width: '100%',
    height: '100vh',
  },
  header: {
    marginBottom: 16,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    color: '#333333',
    fontFamily: 'Helvetica',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    fontSize: 10,
  },
  contactText: {
    color: '#333333',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  bullet: {
    color: '#333333',
    paddingHorizontal: 2,
    fontSize: 10,
  },
});

const CvDocument = ({ cvData }: { cvData: CvData }) => {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.name}>{cvData.contact.name}</Text>
            <Text style={styles.title}>{cvData.contact.title}</Text>
            <View style={styles.contactRow}>
              <Text>Phone: </Text>
              <Link src={`tel:${cvData.contact.phone}`} style={styles.contactText}>
                {cvData.contact.phone}
              </Link>
              <Text style={styles.bullet}>•</Text>
              <Text>Email: </Text>
              <Link src={`mailto:${cvData.contact.email}`} style={styles.contactText}>
                {cvData.contact.email}
              </Link>
            </View>
            <View style={styles.contactRow}>
              {cvData.contact.links.map((link, index) => (
                <Fragment key={index}>
                  {index > 0 && <Text style={styles.bullet}>•</Text>}
                  <Text>{`${link.text}: `}</Text>
                  <Link src={`https://${link.url}`} style={styles.contactText}>
                    {link.url}
                  </Link>
                </Fragment>
              ))}
            </View>
          </View>
          {cvData.sections.map((section, index) => (
            <CvSection key={index} section={section} />
          ))}
        </Page>
      </Document>
    );
};

export default CvDocument;
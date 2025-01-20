import * as React from 'react';

import { useState, useEffect, useCallback, Fragment, memo } from 'react';

import { PDFViewer, Document, Page, StyleSheet, View, Text, Link, PDFViewerProps } from '@react-pdf/renderer';
import { CvSection } from 'CvSection';
import { CvData, markdownToCv } from 'cvConverter';


// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 32, // reduced from 48
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  viewer: {
    width: '100%',
    height: '100vh',
  },
  header: {
    marginBottom: 16, // reduced from 32
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4, // reduced from 8
  },
  title: {
    fontSize: 18,
    marginBottom: 8, // reduced from 16
    color: '#333333',
    fontFamily: 'Helvetica',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2, // reduced from 4
    fontSize: 10,
  },
  contactText: {
    color: '#333333',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  bullet: {
    color: '#333333',
    paddingHorizontal: 2, // reduced from 4
    fontSize: 10,
  },
});

// Create Document Component
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


interface ReactViewProps {
    markdown: string;
}

export const ReactView: React.FC<ReactViewProps> = ({ markdown }) => {
  const cvData = markdownToCv(markdown);

  return (
      <div className="react-view-container">
          <h2>Current File Content</h2>
          <div className="markdown-content">
            <PDFViewer style={styles.viewer}>
              <CvDocument cvData={cvData} />
            </PDFViewer>
          </div>
      </div>
  );
};
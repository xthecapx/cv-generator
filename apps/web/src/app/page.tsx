"use client";

import { useState, useEffect, useCallback, Fragment, memo } from 'react';
import { FloatingActions } from '@/components/FloatingActions';
import { markdownToCv, cvToMarkdown } from '@/utils/cvConverter';
import { CvData, CV_STORAGE_KEY } from '@/utils/cvConverter';
import dynamic from 'next/dynamic';
// import '@uiw/react-md-editor/markdown-editor.css';
// import '@uiw/react-markdown-preview/markdown.css';
import debounce from 'lodash/debounce';
import { Snackbar } from '@/components/Snackbar';
import { PDFViewer, Document, Page, StyleSheet, View, Text, Link, PDFViewerProps } from '@react-pdf/renderer';
import { CvSection } from '@/components/CvSection';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

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

const MemoizedPDFViewer = memo(
  ({ cvData, style }: { cvData: CvData; style: PDFViewerProps['style']  }) => {
    return (
      <PDFViewer style={style}>
        <CvDocument cvData={cvData} />
      </PDFViewer>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.cvData) === JSON.stringify(nextProps.cvData);
  }
);

MemoizedPDFViewer.displayName = 'MemoizedPDFViewer';

export default function Home() {
  const [cvData, setCvData] = useState<CvData | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localMarkdown, setLocalMarkdown] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(CV_STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: CvData = JSON.parse(storedData);
        setCvData(parsedData);
        return;
      } catch (error) {
        console.error('Error parsing stored CV:', error);
      }
    }

    fetch('/api/default-cv')
      .then(res => res.text())
      .then(markdown => {
        const cv = markdownToCv(markdown);
        setCvData(cv);
      })
      .catch(error => {
        console.error('Error loading default CV:', error);
      });
  }, []);

  useEffect(() => {
    if (cvData) {
      localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(cvData));
    }
  }, [cvData]);

  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to reset to the default CV? This will remove all your changes.')) {
      localStorage.removeItem(CV_STORAGE_KEY);
      fetch('/api/default-cv')
        .then(res => res.text())
        .then(markdown => {
          updateCv(markdown);
        });
    }
  };

  const handleToggleEditMode = () => {
    if (!isEditMode &&cvData) {
      const md = cvToMarkdown(cvData);
      setLocalMarkdown(md);
    }

    setIsEditMode(!isEditMode);

  };

  const updateCv = (value: string) => {
    try {
      setIsUpdating(true);
      const newCvData = markdownToCv(value);
      setCvData(newCvData);
      setTimeout(() => {
        setIsUpdating(false); 
        setShowSnackbar(true);
      }, 500);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setIsUpdating(false);
    }
  }

  const debouncedUpdateCv = useCallback(debounce(updateCv, 2000), []);

  const handleMarkdownChange = (newValue?: string) => {
    if (newValue !== undefined) {
      setLocalMarkdown(newValue);
      debouncedUpdateCv(newValue);
    }
  };

  if (!cvData) {
    return <div>Loading...</div>;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          if (file.name.toLowerCase().endsWith('.md')) {
            updateCv(content);
          } else {
            throw new Error('Unsupported file format');
          }
        } catch (error) {
          console.error('Error details:', error);
          alert(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportMarkdown = () => {
    const markdownContent = cvToMarkdown(cvData);
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cv-data.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <main className={isEditMode ? 'w-1/2' : 'w-full'}>
          {!isUpdating ? (
            <MemoizedPDFViewer cvData={cvData} style={styles.viewer} />
          ) : (
            <div className="w-full h-screen flex items-center justify-center text-white">
              Updating PDF...
            </div>
          )}
        </main>

        {isEditMode && (
          <div data-color-mode="light" className="w-1/2 bg-gray-100 p-8 overflow-auto h-screen sticky top-0">
            <MDEditor
              value={localMarkdown}
              onChange={handleMarkdownChange}
              height="100%"
              preview="edit"
              hideToolbar
            />
          </div>
        )}
      </div>

      <FloatingActions
        onFileUpload={handleFileUpload}
        onExportMarkdown={handleExportMarkdown}
        onClearStorage={handleClearStorage}
        onToggleEditMode={handleToggleEditMode}
        isEditMode={isEditMode}
      />

      <Snackbar 
        message="CV updated successfully"
        isVisible={showSnackbar}
        onHide={() => setShowSnackbar(false)}
      />
    </div>
  );
}

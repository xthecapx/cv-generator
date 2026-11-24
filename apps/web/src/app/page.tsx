"use client";

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { FloatingActions } from '@/components/FloatingActions';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import debounce from 'lodash/debounce';
import { Snackbar } from '@/components/Snackbar';
import { PDFViewer, PDFViewerProps } from '@react-pdf/renderer';
import { CvDocument, documentStyles, markdownToCv, cvToMarkdown, CvData, CV_STORAGE_KEY } from '@thecap-cv/components';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

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

// The raw Markdown draft is the source of truth for editing and export, so text
// the parser skips is never lost. Older sessions only stored parsed data.
const MARKDOWN_STORAGE_KEY = 'cvMarkdown';

function readStoredMarkdown(): string | null {
  try {
    const markdown = localStorage.getItem(MARKDOWN_STORAGE_KEY);
    if (markdown !== null) return markdown;
    const legacy = localStorage.getItem(CV_STORAGE_KEY);
    if (legacy) return cvToMarkdown(JSON.parse(legacy) as CvData);
  } catch (error) {
    console.error('Error reading stored CV:', error);
  }
  return null;
}

function storeMarkdown(markdown: string | null) {
  try {
    if (markdown === null) {
      localStorage.removeItem(MARKDOWN_STORAGE_KEY);
      localStorage.removeItem(CV_STORAGE_KEY);
    } else {
      localStorage.setItem(MARKDOWN_STORAGE_KEY, markdown);
    }
  } catch (error) {
    console.error('Error saving CV:', error);
  }
}

export default function Home() {
  const [cvData, setCvData] = useState<CvData | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const stored = readStoredMarkdown();
    if (stored !== null) {
      // Hydrate browser-only storage after mount to keep server and client markup consistent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMarkdown(stored);
      setCvData(markdownToCv(stored));
      return;
    }

    fetch('/api/default-cv')
      .then(res => res.text())
      .then(defaultMarkdown => {
        setMarkdown(defaultMarkdown);
        setCvData(markdownToCv(defaultMarkdown));
      })
      .catch(error => {
        console.error('Error loading default CV:', error);
      });
  }, []);

  const updateCv = useCallback((value: string) => {
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
  }, []);

  const debouncedUpdateCv = useMemo(() => debounce(updateCv, 2000), [updateCv]);

  useEffect(() => () => debouncedUpdateCv.cancel(), [debouncedUpdateCv]);

  // Replace the whole CV (import or reset). A pending edit must not overwrite it.
  const replaceCv = useCallback((value: string) => {
    debouncedUpdateCv.cancel();
    setMarkdown(value);
    storeMarkdown(value);
    updateCv(value);
  }, [debouncedUpdateCv, updateCv]);

  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to reset to the default CV? This will remove all your changes.')) {
      debouncedUpdateCv.cancel();
      storeMarkdown(null);
      fetch('/api/default-cv')
        .then(res => res.text())
        .then(replaceCv)
        .catch(error => {
          console.error('Error loading default CV:', error);
        });
    }
  };

  const handleToggleEditMode = () => {
    // Leaving edit mode: render the latest draft now instead of waiting for the debounce.
    if (isEditMode) debouncedUpdateCv.flush();
    setIsEditMode(!isEditMode);
  };

  const handleMarkdownChange = (newValue?: string) => {
    if (newValue !== undefined) {
      setMarkdown(newValue);
      // Save the draft immediately so a reload never loses the last keystrokes.
      storeMarkdown(newValue);
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
            replaceCv(content);
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
    // Allow choosing the same file again after editing.
    event.target.value = '';
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
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
          {!isUpdating && typeof window !== 'undefined' ? (
            <MemoizedPDFViewer cvData={cvData} style={documentStyles.viewer} />
          ) : (
            <div className="w-full h-screen flex items-center justify-center text-white">
              Updating PDF...
            </div>
          )}
        </main>

        {isEditMode && (
          <div data-color-mode="light" className="w-1/2 bg-gray-100 p-8 overflow-auto h-screen sticky top-0">
            <MDEditor
              value={markdown}
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

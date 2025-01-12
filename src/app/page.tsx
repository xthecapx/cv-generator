"use client";

import { useState, useEffect } from 'react';
import { FloatingActions } from '@/components/FloatingActions';
import { Header } from '@/components/Header';
import { CvSection } from '@/components/CvSection';
import { markdownToJson, jsonToMarkdown, CvData, isValidCvData, CV_STORAGE_KEY } from '@/utils/markdownConverter';

export default function Home() {
  const [cvData, setCvData] = useState<CvData | null>(null);

  useEffect(() => {
    // Try to load from localStorage first
    const storedData = localStorage.getItem(CV_STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (isValidCvData(parsedData)) {
          setCvData(parsedData);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored CV:', error);
      }
    }

    // Fall back to default CV if no valid stored data
    fetch('/api/default-cv')
      .then(res => res.text())
      .then(markdown => {
        const jsonData = markdownToJson(markdown);
        setCvData(jsonData);
      })
      .catch(error => {
        console.error('Error loading default CV:', error);
      });
  }, []);

  // Save to localStorage whenever cvData changes
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
          const jsonData = markdownToJson(markdown);
          setCvData(jsonData);
        });
    }
  };

  if (!cvData) {
    return <div>Loading...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let jsonData: CvData;

          if (file.name.toLowerCase().endsWith('.json')) {
            // Handle JSON file
            const parsedData = JSON.parse(content);
            console.log('Parsed JSON:', parsedData); // Debug log
            
            if (!isValidCvData(parsedData)) {
              console.error('Invalid CV data structure:', parsedData); // Debug log
              throw new Error('The JSON file does not match the expected CV format');
            }
            jsonData = parsedData;
          } else if (file.name.toLowerCase().endsWith('.md')) {
            // Handle Markdown file
            jsonData = markdownToJson(content);
          } else {
            throw new Error('Unsupported file format');
          }

          setCvData(jsonData);
        } catch (error) {
          console.error('Error details:', error); // Debug log
          alert(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportMarkdown = () => {
    const markdownContent = jsonToMarkdown(cvData);
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
    <div className="min-h-screen p-8 max-w-[8.5in] mx-auto bg-white text-gray-800">
      <main className="mx-auto leading-relaxed">
        <Header contact={cvData.contact} />
        
        {cvData.sections
          .filter(section => section.isVisible)
          .map((section, index) => (
            <CvSection key={index} section={section} />
          ))}
      </main>

      <FloatingActions
        onPrint={handlePrint}
        onFileUpload={handleFileUpload}
        onExportMarkdown={handleExportMarkdown}
        onClearStorage={handleClearStorage}
      />

      <style jsx global>{`
        @media print {
          .fixed {
            display: none !important;
          }
          #__next_route_announcer__ {
            display: none !important;
          }
          @page {
            margin: 2cm;
            size: A4 portrait;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          [data-floating-ui-portal],
          [role="tooltip"],
          [class*="floating"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

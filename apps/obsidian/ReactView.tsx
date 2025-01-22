import * as React from 'react';

import { PDFViewer } from '@react-pdf/renderer';
import { documentStyles, markdownToCv, CvDocument } from '@thecap-cv/components';

interface ReactViewProps {
    markdown: string;
}

export const ReactView: React.FC<ReactViewProps> = ({ markdown }) => {
  const cvData = markdownToCv(markdown);

  return (
      <div className="react-view-container">
        <PDFViewer style={documentStyles.viewer}>
          <CvDocument cvData={cvData} />
        </PDFViewer>
      </div>
  );
};
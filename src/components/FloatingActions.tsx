"use client";

interface FloatingActionsProps {
  onPrint: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportMarkdown: () => void;
  onClearStorage: () => void;
  onToggleEditMode: () => void;
  isEditMode: boolean;
}

export function FloatingActions({
  onPrint,
  onFileUpload,
  onExportMarkdown,
  onClearStorage,
  onToggleEditMode,
  isEditMode
}: FloatingActionsProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      <button 
        onClick={onToggleEditMode}
        className={`group relative ${isEditMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-purple-600 hover:bg-purple-700'} text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105`}
        aria-label={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
      >
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {!isEditMode && (
        <>
          <input
            type="file"
            accept=".json,.md"
            onChange={onFileUpload}
            className="hidden"
            id="cv-upload"
          />
          <label 
            htmlFor="cv-upload"
            className="group relative bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Load CV (.md or .json)
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </label>
          <button 
            onClick={onExportMarkdown}
            className="group relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Save CV Information
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          <button 
            onClick={onPrint}
            className="group relative bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Generate PDF
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button 
            onClick={onClearStorage}
            className="group relative bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Reset to Default
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
} 
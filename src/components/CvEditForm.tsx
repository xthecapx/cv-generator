import { useForm, useFieldArray } from 'react-hook-form';
import { CvData } from '@/utils/markdownConverter';
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

interface CvEditFormProps {
  cvData: CvData;
  onSubmit: (data: CvData) => void;
}

export function CvEditForm({ cvData, onSubmit }: CvEditFormProps) {
  const { register, control, watch } = useForm<CvData>({
    defaultValues: cvData
  });

  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "sections"
  });

  const processAndSubmitData = useCallback(
    debounce((data: CvData) => {
      const processedData = {
        ...data,
        sections: data.sections.map(section => ({
          ...section,
          items: section.items.map(item => ({
            ...item,
            details: typeof item.details === 'string' 
              ? item.details.split('\n').filter(line => line.trim())
              : Array.isArray(item.details)
                ? item.details
                : []
          }))
        }))
      };

      onSubmit(processedData);
    }, 1000),
    []
  );

  watch((data) => {
    if (data) {
      processAndSubmitData(data as CvData);
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Contact Information */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Contact Information</h2>
          <div className="flex-grow border-b ml-4 border-gray-200" />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <input
              {...register('contact.name')}
              placeholder="Full Name"
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <input
              {...register('contact.title')}
              placeholder="Professional Title"
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <input
              {...register('contact.email.text')}
              placeholder="Email Address"
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <input
              {...register('contact.phone.text')}
              placeholder="Phone Number"
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center flex-grow">
            <h2 className="text-xl font-medium text-gray-900">Sections</h2>
            <div className="flex-grow border-b ml-4 border-gray-200" />
          </div>
          <button
            type="button"
            onClick={() => appendSection({ 
              title: "New Section", 
              isVisible: true, 
              items: [{ details: [] }] 
            })}
            className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-full text-sm font-medium transition-colors"
          >
            + Add Section
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div 
              key={section.id} 
              className="p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  {...register(`sections.${sectionIndex}.title`)}
                  placeholder="Section Title"
                  className="text-lg font-medium w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      {...register(`sections.${sectionIndex}.isVisible`)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Visible
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {section.items?.map((_, itemIndex) => (
                  <div 
                    key={`${section.id}-item-${itemIndex}`}
                    className="relative"
                  >
                    {itemIndex > 0 && (
                      <div className="my-6 border-t border-gray-200 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-gray-400">
                          Item {itemIndex + 1}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.primary`)}
                        placeholder="Primary Text"
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.primaryRight`)}
                        placeholder="Primary Right"
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.secondary`)}
                        placeholder="Secondary Text"
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.secondaryRight`)}
                        placeholder="Secondary Right"
                        className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <div className="col-span-2">
                        <textarea
                          {...register(`sections.${sectionIndex}.items.${itemIndex}.details`)}
                          placeholder="Enter details (one per line)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none transition-colors"
                          rows={3}
                          defaultValue={Array.isArray(section.items[itemIndex]?.details) 
                            ? section.items[itemIndex].details.join('\n') 
                            : ''}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
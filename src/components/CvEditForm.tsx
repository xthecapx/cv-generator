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

  // Watch for form changes
  watch((data) => {
    if (data) {
      processAndSubmitData(data as CvData);
    }
  });

  return (
    <form className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              {...register('contact.name')}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              {...register('contact.title')}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...register('contact.email.text')}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              {...register('contact.phone.text')}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sections</h3>
          <button
            type="button"
            onClick={() => appendSection({ 
              title: "New Section", 
              isVisible: true, 
              items: [{ details: [] }] 
            })}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
          >
            Add Section
          </button>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="border rounded p-4 relative">
            <button
              type="button"
              onClick={() => removeSection(sectionIndex)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium">Section Title</label>
                <input
                  {...register(`sections.${sectionIndex}.title`)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register(`sections.${sectionIndex}.isVisible`)}
                  className="rounded border-gray-300"
                />
                <label className="ml-2 text-sm">Visible</label>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {section.items?.map((_, itemIndex) => (
                <div key={`${section.id}-item-${itemIndex}`} className="border-t pt-4 relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Primary</label>
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.primary`)}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Primary Right</label>
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.primaryRight`)}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Secondary</label>
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.secondary`)}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Secondary Right</label>
                      <input
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.secondaryRight`)}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium">Details</label>
                      <textarea
                        {...register(`sections.${sectionIndex}.items.${itemIndex}.details`)}
                        className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                        rows={3}
                        placeholder="Enter details separated by newlines"
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
    </form>
  );
} 
import { CvData } from '@/utils/cvConverter';

interface CvSectionProps {
  section: CvData['sections'][0];
}

export function CvSection({ section }: CvSectionProps) {
  console.log({ section });
  return (
    <section className="mb-6">
      <h2 className="text-lg font-extrabold uppercase border-b-2 border-gray-800 mb-3 text-gray-900">
        {section.title}
      </h2>
      {section.items.map((item, itemIndex) => (
        <div key={itemIndex} className="mb-4">
          {(item.primary || item.primaryRight) && (
            <div className="flex justify-between">
              <div className="font-bold">{item.primary}</div>
              <div className="text-sm">{item.primaryRight}</div>
            </div>
          )}
          {(item.secondary || item.secondaryRight) && (
            <div className="flex justify-between text-sm font-medium italic text-gray-600 -mt-1">
              <div>{item.secondary}</div>
              <div>{item.secondaryRight}</div>
            </div>
          )}
          {item.details && (
            <ul className="text-sm list-disc ml-4 mt-2">
            {item.details.map((detail, detailIndex) => (
              <li key={detailIndex}>{detail}</li>
            ))}
          </ul>
          )}
        </div>
      ))}
    </section>
  );
} 
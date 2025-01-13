import { ContactInfo } from '@/utils/cvConverter';

interface HeaderProps {
  contact: ContactInfo;
}

export function Header({ contact }: HeaderProps) {
  return (
    <header className="text-center mb-4">
      <h1 className="text-2xl font-extrabold text-gray-900">{contact.name}</h1>
      <p className="text-lg mb-2">{contact.title}</p>
      <div className="text-sm space-y-0 font-medium">
        <div className="flex justify-center items-center space-x-2">
          <a href={`tel:${contact.phone}`} className="hover:text-blue-600 transition-colors">Phone: {contact.phone}</a>
          <span>•</span>
          <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors">Email: {contact.email}</a>
        </div>
        <div className="flex justify-center items-center space-x-2">
          <a href={`https://${contact.links.linkedin.url}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            LinkedIn: {contact.links.linkedin.text}
          </a>
          <span>•</span>
          <a href={`https://${contact.links.github.url}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            GitHub: {contact.links.github.text}
          </a>
        </div>
      </div>
    </header>
  );
} 
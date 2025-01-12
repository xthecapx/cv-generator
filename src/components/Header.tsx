interface HeaderProps {
  contact: {
    name: string;
    title: string;
    email: { text: string; url: string };
    phone: { text: string; url: string };
    links: {
      linkedin: { text: string; url: string };
      github: { text: string; url: string };
    };
  };
}

export function Header({ contact }: HeaderProps) {
  return (
    <header className="text-center mb-8">
      <h1 className="text-2xl font-extrabold mb-2 text-gray-900">{contact.name}</h1>
      <p className="text-lg mb-2">{contact.title}</p>
      <div className="text-sm space-y-1 font-medium">
        <div className="flex justify-center items-center space-x-2">
          <a href={contact.phone.url} className="hover:text-blue-600 transition-colors">Phone: {contact.phone.text}</a>
          <span>•</span>
          <a href={contact.email.url} className="hover:text-blue-600 transition-colors">Email: {contact.email.text}</a>
        </div>
        <div className="flex justify-center items-center space-x-2">
          <a href={contact.links.linkedin.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            LinkedIn: {contact.links.linkedin.text}
          </a>
          <span>•</span>
          <a href={contact.links.github.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            GitHub: {contact.links.github.text}
          </a>
        </div>
      </div>
    </header>
  );
} 
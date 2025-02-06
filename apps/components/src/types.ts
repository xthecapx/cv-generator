export interface ContactInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  links: Array<{
    text: string;
    url: string;
  }>;
}

export interface CvItem {
  primary?: string;
  primaryRight?: string;
  secondary?: string;
  secondaryRight?: string;
  details: string[];
  break?: boolean;
}

export interface CvSection {
  title: string;
  items: CvItem[];
  break?: boolean;
}

export interface CvProperties {
  [key: string]: string | string[] | undefined;
}

export interface CvData {
  properties?: CvProperties;
  contact: ContactInfo;
  sections: CvSection[];
}
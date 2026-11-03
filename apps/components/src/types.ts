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
  /** Additional labeled values, preserved when exporting back to Markdown. */
  details?: Array<{ label: string; value: string }>;
}

export interface CvItem {
  primary?: string;
  primaryRight?: string;
  secondary?: string;
  secondaryRight?: string;
  details: string[];
  /** Plain paragraph item: details render as stacked text without bullets */
  plain?: boolean;
  break?: boolean;
}

export interface CvSection {
  title: string;
  items: CvItem[];
  break?: boolean;
}

export interface CvProperties {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface CvRenderOptions {
  /** Base text size in points (8–20); the default is 12. */
  fontSize?: number;
  /** A font family already registered with React PDF. */
  fontFamily?: string;
}

export interface CvData {
  properties?: CvProperties;
  contact: ContactInfo;
  sections: CvSection[];
}

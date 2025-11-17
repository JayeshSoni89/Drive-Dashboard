declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export type DocType = 'doc' | 'sheet';

export interface Doc {
  id: string;
  name: string;
  type: DocType;
  categoryId: string | null;
  url: string;
  lastModified: string;
}

export interface Category {
  id: string;
  name:string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface CategoryMapping {
  [docId: string]: string;
}

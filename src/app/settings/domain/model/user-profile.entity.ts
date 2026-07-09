export interface UserProfile {
  id: string;
  name: string;
  email: string;
  language: 'en' | 'es';
  theme: 'light' | 'dark';
  passwordUpdatedAt?: string;
}

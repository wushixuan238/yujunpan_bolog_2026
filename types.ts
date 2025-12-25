export interface PlaylistItem {
  id: string;
  title: string;
  originalTitle?: string; // For the Kanji/Japanese text
  duration?: string;
}

export interface NavItem {
  label: string;
  href: string;
}
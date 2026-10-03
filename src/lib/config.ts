/** Brand name used across the UI — change it here. */
export const APP_NAME = "B-Hire";

export const JOB_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Design & Creative",
  "Writing & Translation",
  "Marketing & Sales",
  "Data & AI",
  "Video & Animation",
  "Admin & Support",
  "Other",
] as const;

/** Offered as you type in the profile's skills field; any other skill can be typed in too. */
export const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Django", "PHP", "Laravel",
  "WordPress", "Shopify", "HTML & CSS", "Tailwind CSS", "Flutter", "React Native", "Swift", "Kotlin",
  "SQL", "PostgreSQL", "Supabase", "Firebase", "AWS", "Docker", "Figma", "UI Design", "UX Research",
  "Branding", "Logo Design", "Illustration", "Adobe Photoshop", "Adobe Illustrator", "Copywriting",
  "Content Writing", "SEO", "Technical Writing", "Translation", "Social Media Marketing",
  "Email Marketing", "Google Ads", "Data Analysis", "Machine Learning", "Excel", "Power BI",
  "Video Editing", "Motion Graphics", "3D Modeling", "Virtual Assistance", "Customer Support",
  "Project Management", "Bookkeeping",
] as const;

export const LANGUAGE_SUGGESTIONS = [
  "English", "French", "Spanish", "Portuguese", "German", "Italian", "Dutch", "Arabic", "Hindi",
  "Urdu", "Bengali", "Mandarin", "Cantonese", "Japanese", "Korean", "Russian", "Turkish", "Polish",
  "Swahili", "Yoruba", "Igbo", "Hausa", "Amharic", "Zulu",
] as const;

export const CONTACT_TOPICS = [
  "Hiring on B-Hire",
  "Finding work",
  "Partnerships",
  "Press",
  "Something else",
] as const;

/** Where the landing page's contact details point. Replace before launch. */
export const CONTACT_EMAIL = "justbhire@gmail.com";

export function isJobCategory(value: string): boolean {
  return (JOB_CATEGORIES as readonly string[]).includes(value);
}

export interface Tutor {
  id: number;
  name: string;
  title: string;
  bio: string;
  picture: string;
  course_count: string;
  rating: string;
  total_students: number;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  updated_at: string;
  order: number;
  is_active: boolean;
}
export interface StudentProfile {
  has_profile: boolean;
  first_name: string | null;
  last_name: string | null;
  needs_names: boolean;
}

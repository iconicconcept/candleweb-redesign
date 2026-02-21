export interface Course {
  id: number | string;
  title: string;
  description: string;
  image: string | null;
  features: string[];
  duration: string;
  lessons: number;
  certification: string;
  price: number;
  passiveRevenue: string; // Derived/Placeholder for UI
  
  // API specific fields
  course_code?: string;
  logo?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  category?: string | null;
  total_hours?: number;
  featured?: boolean;
  max_students?: number;
  base_price?: string;
  duration_weeks?: number;
  difficulty_level?: string;
  is_published?: boolean;
  is_enrollment_open?: boolean;
  current_enrollment_count?: number;
  available_slots?: number;
  is_full?: boolean;
  lecturer_count?: number;
  created_at?: string;
}

export interface ApiCourseResponse {
  status: string;
  message: string;
  data: {
    count: number;
    results: Course[];
  } | Course[]; // Handle potential variations based on other services
}

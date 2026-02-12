export interface BlogProp {
  id: number;
  author: Author;
  category: BlogCategory;
  tags: Tag[];
  photo: string;
  title: string;
  blog_slug: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: number;
  user: number;
  name: string;
  role: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  category_slug: string;
}

export interface Tag {
  id: number;
  name: string;
  tag_slug: string;
}

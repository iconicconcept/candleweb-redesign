/**
 * Represents a collection of testimonials.
 */
export interface Testimonial {
  /**
   * The total count of testimonials available in the collection.
   */
  count?: number;

  /**
   * A reference to the next page of testimonials (if available).
   */
  next?: null;

  /**
   * A reference to the previous page of testimonials (if available).
   */
  previous?: null;

  /**
   * An array containing the testimonial results for the current page.
   */
  results?: Result[];
}

/**
 * Represents a single testimonial in the collection.
 */
export interface Result {
  /**
   * The name of the person providing the testimonial.
   */
  name?: string;

  /**
   * The content of the testimonial or review.
   */
  review?: string;

  /**
   * The position of the person providing the testimonial.
   */
  position?: string;

  /**
   * The URL or path to the photo or image of the person providing the testimonial.
   */
  photo?: string;

  /**
   * The URL to the person's Facebook profile (if available).
   */
  facebook_url?: string;

  /**
   * The URL to the person's Instagram profile (if available).
   */
  instagram_url?: string;
}

import { axiosApi } from "../lib/axiosApi";

/**
 * Shape of a single row returned by GET /api/certificate/{username}/
 * Note: is_issued=false rows are included — a Certificate row can exist
 * before it has actually been issued in Django admin.
 */
export interface CertificateInfo {
  certificate_number: string;
  course_code: string[];
  issued_at: string | null;
  is_issued: boolean;
}

export interface StudentProfileInfo {
  user_email: string;
  first_name: string;
  last_name: string;
  cohort: any[];
  course: any[];
}

export interface StudentCertificatesResponse {
  student_profile: StudentProfileInfo;
  certificate: CertificateInfo[];
}

/**
 * GET /api/certificate/{username}/
 * Public endpoint — returns the student's profile plus every certificate
 * row (issued or not) that exists for them.
 */
const getStudentCertificates = async (
  username: string,
): Promise<StudentCertificatesResponse> => {
  try {
    const response = await axiosApi.get(`/certificate/${username}/`);
    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.statusText ||
      err?.message ||
      "Failed to load certificate info";
    throw new Error(message);
  }
};

/**
 * Finds the certificate row (if any) belonging to a given course_code.
 * Works whether the certificate has been issued yet or not — callers
 * should check `.is_issued` on the result before allowing a download.
 */
const findCertificateForCourse = (
  certificates: CertificateInfo[] | undefined | null,
  courseCode: string | undefined | null,
): CertificateInfo | undefined => {
  if (!certificates || !courseCode) return undefined;
  return certificates.find((cert) =>
    (cert.course_code || []).includes(courseCode),
  );
};

/**
 * Builds the public, unauthenticated URL that renders/downloads the PNG
 * certificate. This is the same URL that's encoded into the certificate's
 * QR code.
 *
 * GET /api/certificate/{username}/{certificate_number}/?course_code=...
 */
const getCertificateDownloadUrl = (
  username: string,
  certificateNumber: string,
  courseCode: string,
): string => {
  const baseURL = (axiosApi.defaults.baseURL || "").replace(/\/$/, "");
  const params = new URLSearchParams({ course_code: courseCode });
  return `${baseURL}/certificate/${encodeURIComponent(
    username,
  )}/${encodeURIComponent(certificateNumber)}/?${params.toString()}`;
};

/**
 * Fetches the rendered certificate PNG and triggers a browser download.
 * Throws if the certificate can't be rendered (not issued yet, wrong
 * course_code, etc — the API returns 403/500 in those cases).
 */
const downloadCertificate = async (
  username: string,
  certificateNumber: string,
  courseCode: string,
  filename?: string,
): Promise<void> => {
  const url = getCertificateDownloadUrl(
    username,
    certificateNumber,
    courseCode,
  );
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Certificate is not available yet";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // Response wasn't JSON (e.g. it was actually the PNG but something
      // else failed) — fall back to the generic message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || `certificate-${certificateNumber}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const certificateService = {
  getStudentCertificates,
  findCertificateForCourse,
  getCertificateDownloadUrl,
  downloadCertificate,
};

export default certificateService;

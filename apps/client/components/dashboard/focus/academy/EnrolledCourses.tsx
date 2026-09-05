import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { imageUri } from "../../../../utils/constants";

export interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  is_active?: boolean;
  instructor_name?: string;
  status?: string;
}

export default function EnrolledCourses({ courses }: { courses: EnrolledCourse[] }) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? courses : courses.slice(0, 4);

  return (
    <>
      <div className="fx-sh">
        <h2>Your learning</h2>
        {courses.length > 4 && (
          <button className="fx-link" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      <div className="fx-courses">
        {visible.map((course) => {
          const progress = course.progress ?? 0;
          const done = progress >= 100;
          const active = course.is_active !== false && course.status !== "paused";
          return (
            <div className="fx-lc" key={course.id}>
              <div className="fx-lcv">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail.startsWith("http") ? course.thumbnail : `${imageUri}${course.thumbnail}`}
                    alt={course.title}
                    fill
                    sizes="(max-width: 820px) 100vw, 50vw"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      background: "linear-gradient(150deg,#12352C,#0C1A18)",
                      color: "var(--fx-teal2)",
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {course.title?.charAt(0) ?? "C"}
                  </div>
                )}
                <span className={`st2 ${done ? "done" : "act"}`}>
                  {done ? "Completed" : active ? "In progress" : "Paused"}
                </span>
              </div>
              <div className="fx-lcb">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="fx-lh">
                  <span>{progress}% complete</span>
                  <b>{progress}%</b>
                </div>
                <div className="fx-lbar">
                  <i className={done ? "gold" : ""} style={{ width: `${progress}%` }} />
                </div>
                <button
                  className={`fx-cta ${done ? "ghost2" : "live6"}`}
                  type="button"
                  style={{ width: "100%" }}
                  onClick={() => router.push(`/dashboard/tutor/course/${course.id}`)}
                >
                  {done ? "View certificate" : "Continue learning"} →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

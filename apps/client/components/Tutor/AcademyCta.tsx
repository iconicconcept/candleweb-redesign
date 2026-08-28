import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import useUserStore from "../../lib/hooks/useUserStore";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";

const AcademyCta = () => {
  const { courses } = useSelector((state: RootState) => state.courses);
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;
  const { googleAuth } = useGoogleAuth();

  const goToCourses = () => {
    if (!isLoggedIn) {
      googleAuth("/tutor#courses");
      return;
    }
    document
      .getElementById("courses")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="ac-cta-box">
      <div className="ac-rise">
        <p className="ac-eyebrow">Cohort 2</p>
        <h2 style={{ maxWidth: "15ch" }}>Registration is open.</h2>
        <p className="ac-lede">
          Seats are limited and classes run live. Enrol now and your learning
          tools switch on the moment payment clears.
        </p>
      </div>
      <form
        className="ac-form ac-rise"
        onSubmit={(event) => {
          event.preventDefault();
          goToCourses();
        }}
      >
        <label htmlFor="ac-cta-email">Email</label>
        <input
          id="ac-cta-email"
          type="email"
          placeholder="you@example.com"
          defaultValue={user.email || ""}
        />
        <label htmlFor="ac-cta-course">Which course?</label>
        <select id="ac-cta-course" defaultValue="">
          <option value="">Not sure yet — send me details</option>
          {courses.map((course: any) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <button type="submit" className="pub-btn pub-btn-amber">
          Enrol now <span>↗</span>
        </button>
        <p className="ac-fine">
          Payment via Paystack. Course fee is one-time; there are no recurring
          charges.
        </p>
      </form>
    </section>
  );
};

export default AcademyCta;

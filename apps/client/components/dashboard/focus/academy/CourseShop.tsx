import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { AppDispatch, RootState } from "../../../../redux/store";
import courseService from "../../../../services/courseService";
import paymentService from "../../../../services/paymentService";
import tutorService from "../../../../services/tutorService";
import useUserStore from "../../../../lib/hooks/useUserStore";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import Dialog from "../Dialog";
import { CheckIcon } from "../icons";

declare let window: any;

type Props = {
  /** Course ids the student is already enrolled in — hidden from the shop. */
  excludeIds: (number | string)[];
};

export default function CourseShop({ excludeIds }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();
  const { courses, isLoading } = useSelector((state: RootState) => state.courses);
  const { isInitiating, isVerifying } = useSelector((state: RootState) => state.payment);

  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    dispatch(courseService.getCourses());
  }, [dispatch]);

  const excludeSet = new Set(excludeIds.map(String));
  const shop = courses.filter((c: any) => !excludeSet.has(String(c.id)));

  const initiate = async (course: any, firstName: string, lastName: string, phone: string) => {
    try {
      const payload: any = {
        course_id: course.id,
        email: user.email || "",
        first_name: firstName,
        last_name: lastName,
        phone,
        callback_url: `${window.location.origin}/tutor/verify`,
      };
      const resultAction = await dispatch(paymentService.initiatePayment(payload));
      if (paymentService.initiatePayment.fulfilled.match(resultAction)) {
        const data = resultAction.payload?.data;
        if (data?.requires_payment === false) {
          toast.success("You're enrolled! Refreshing your courses.");
          router.reload();
          return;
        }
        if (data?.requires_payment && data?.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          toast.error("Unable to get a payment link. Please try again.");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const buy = async (course: any) => {
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const phone = user.phone || "";
    setIsCheckingProfile(true);
    try {
      const result = await dispatch(tutorService.checkStudentProfile(axiosToken));
      if (tutorService.checkStudentProfile.fulfilled.match(result)) {
        const profile = result.payload?.data;
        if (profile?.has_profile && !profile?.needs_names) {
          await initiate(course, profile.first_name, profile.last_name, profile.phone);
          return;
        }
      }
      setSelectedCourse(course);
      setForm({ firstName, lastName, phone });
      setShowNameDialog(true);
    } catch {
      setSelectedCourse(course);
      setForm({ firstName, lastName, phone });
      setShowNameDialog(true);
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const busy = isInitiating || isVerifying || isCheckingProfile;

  return (
    <>
      <div className="fx-shop">
        {isLoading && shop.length === 0 && (
          <>
            <div className="fx-ghost" style={{ minHeight: 220 }} />
            <div className="fx-ghost" style={{ minHeight: 220 }} />
          </>
        )}
        {!isLoading && shop.length === 0 && (
          <p className="fx-nempty" style={{ gridColumn: "1 / -1" }}>
            <b>Nothing new to enrol in right now.</b>
          </p>
        )}
        {shop.map((course: any) => {
          const open = course.is_enrollment_open !== false;
          return (
            <div className="fx-sc" key={course.id}>
              <span className={`fx-stag ${open ? "" : "soon2"}`}>
                {open ? "Enrolling now" : "Coming soon"}
              </span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="fx-smeta">
                {course.duration && <span>{course.duration}</span>}
                {course.lessons ? <span>{course.lessons} hours</span> : null}
                {course.certification && <span>{course.certification}</span>}
              </div>
              <div className="fx-sbuy">
                <div className="fx-sprice">
                  <b>₦{Number(course.price ?? 0).toLocaleString()}</b>
                  <span>One-time course fee</span>
                </div>
                <button
                  type="button"
                  className={`fx-cta ${open ? "live6" : "ghost2"}`}
                  disabled={busy}
                  onClick={() => (open ? buy(course) : undefined)}
                >
                  {open ? "Pay with Paystack" : "Join the waitlist"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={showNameDialog}
        onClose={() => setShowNameDialog(false)}
        icon={<CheckIcon />}
        title="Complete your profile"
        subtitle="We need this to enrol you and issue your certificate"
        labelledBy="shop-profile-title"
        footer={
          <>
            <button className="fx-cta ghost2" type="button" onClick={() => setShowNameDialog(false)}>
              Cancel
            </button>
            <button
              className="fx-cta main2"
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!form.firstName.trim() || !form.lastName.trim()) {
                  toast.error("Please fill in both first and last names");
                  return;
                }
                if (!form.phone.trim()) {
                  toast.error("Please provide your phone number");
                  return;
                }
                setShowNameDialog(false);
                await initiate(selectedCourse, form.firstName.trim(), form.lastName.trim(), form.phone.trim());
              }}
            >
              Proceed to pay
            </button>
          </>
        }
      >
        <div className="fx-fld">
          <label className="fx-fl" htmlFor="shop-first">
            First name
          </label>
          <div className="fx-inp">
            <input
              id="shop-first"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          </div>
        </div>
        <div className="fx-fld">
          <label className="fx-fl" htmlFor="shop-last">
            Last name
          </label>
          <div className="fx-inp">
            <input
              id="shop-last"
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
        </div>
        <div className="fx-fld">
          <label className="fx-fl" htmlFor="shop-phone">
            Phone number
          </label>
          <div className="fx-inp">
            <input
              id="shop-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}

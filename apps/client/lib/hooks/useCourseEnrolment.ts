import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { AppDispatch, RootState } from "../../redux/store";
import paymentService from "../../services/paymentService";
import tutorService from "../../services/tutorService";
import useUserStore from "./useUserStore";
import useAxiosAuth from "./useAxiosAuth";
import { signUpPath } from "../authRedirect";

/**
 * Enrolling in a course: sign in, make sure we have a name and phone for the
 * receipt, then hand over to Paystack.
 *
 * The same three steps the Academy course cards run. They are here so the
 * public course-detail page can offer the identical path rather than inventing
 * a second one — a checkout that drifts between two screens is the kind of
 * bug that costs money quietly.
 *
 * `returnTo` is where the Google round-trip comes back to, so a visitor who
 * signs in from a course page lands back on that course and not on a list.
 */

export type EnrolmentProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  referralUsername?: string;
};

const useCourseEnrolment = (returnTo: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;

  const { purchasedCourseIds, isInitiating, isVerifying } = useSelector(
    (state: RootState) => state.payment,
  );

  const [checkingProfile, setCheckingProfile] = useState(false);
  /** Set when we still need a name/phone before we can take payment. */
  const [profileFor, setProfileFor] = useState<any>(null);
  const [profileDraft, setProfileDraft] = useState<EnrolmentProfile>({
    firstName: "",
    lastName: "",
    phone: "",
  });

  /* `purchasedCourseIds` is only filled in by the profile check, so on a cold
     page load it is empty and an enrolled visitor would be offered the course
     they already own. Ask once, up front, when there is someone to ask about. */
  const askedRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || askedRef.current || purchasedCourseIds.length > 0) return;
    askedRef.current = true;
    dispatch(tutorService.checkStudentProfile(axiosToken));
  }, [isLoggedIn, purchasedCourseIds.length, dispatch, axiosToken]);

  /* Compared as strings: the list endpoint and the detail endpoint do not
     agree on whether an id is a number or a string. */
  const hasPurchased = (courseId: number | string) =>
    purchasedCourseIds.some((owned: any) => String(owned) === String(courseId));

  const startPayment = async (
    course: any,
    firstName: string,
    lastName: string,
    phone: string,
    referralUsername?: string,
  ) => {
    try {
      const payload: any = {
        course_id: course.id,
        email: user.email || "",
        first_name: firstName,
        last_name: lastName,
        phone,
        callback_url: `${window.location.origin}/tutor/verify`,
      };
      if (referralUsername && referralUsername.trim()) {
        payload.referrer_username = referralUsername.trim();
      }

      const resultAction = await dispatch(paymentService.initiatePayment(payload));

      if (paymentService.initiatePayment.fulfilled.match(resultAction)) {
        const paymentData = resultAction.payload?.data;
        // A free or already-covered course never reaches Paystack.
        if (paymentData?.requires_payment === false) {
          toast.success("You're enrolled! Taking you to your dashboard.");
          router.push("/dashboard/tutor");
          return;
        }
        if (paymentData?.requires_payment && paymentData?.authorization_url) {
          window.location.href = paymentData.authorization_url;
        } else {
          toast.error("Unable to get payment authorization link. Please try again.");
        }
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  /** The button. Signs in first if needed, then either pays or asks for the
   *  missing details. An already-purchased course goes to the dashboard. */
  const enrol = async (course: any) => {
    if (!isLoggedIn) {
      router.push(signUpPath(returnTo));
      return;
    }
    if (hasPurchased(course.id)) {
      router.push("/dashboard/tutor");
      return;
    }

    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const phone = user.phone || "";

    const askForProfile = (first: string, last: string, tel: string) => {
      setProfileDraft({ firstName: first, lastName: last, phone: tel });
      setProfileFor(course);
    };

    setCheckingProfile(true);
    try {
      const profileResult = await dispatch(tutorService.checkStudentProfile(axiosToken));
      if (tutorService.checkStudentProfile.fulfilled.match(profileResult)) {
        const p = profileResult.payload?.data;
        if (p?.has_profile && !p?.needs_names) {
          startPayment(course, p.first_name, p.last_name, p.phone);
        } else {
          askForProfile(p?.first_name || firstName, p?.last_name || lastName, p?.phone || phone);
        }
      } else if (!firstName || !lastName) {
        askForProfile(firstName, lastName, phone);
      } else {
        startPayment(course, firstName, lastName, phone);
      }
    } catch (err) {
      // The check failing shouldn't block a payment we already have names for.
      console.error("Profile check failed:", err);
      if (!firstName || !lastName) askForProfile(firstName, lastName, phone);
      else startPayment(course, firstName, lastName, phone);
    } finally {
      setCheckingProfile(false);
    }
  };

  /** Called by the profile dialog once the visitor has filled it in. */
  const submitProfile = (profile: EnrolmentProfile) => {
    if (!profileFor) return;
    const course = profileFor;
    setProfileFor(null);
    startPayment(
      course,
      profile.firstName.trim(),
      profile.lastName.trim(),
      profile.phone.trim(),
      profile.referralUsername,
    );
  };

  return {
    enrol,
    isLoggedIn,
    hasPurchased,
    busy: checkingProfile || isInitiating || isVerifying,
    /** The course awaiting a name/phone, or null. */
    profileFor,
    profileDraft,
    submitProfile,
    closeProfile: () => setProfileFor(null),
  };
};

export default useCourseEnrolment;

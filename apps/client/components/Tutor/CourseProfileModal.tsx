import { useEffect, useState } from "react";
import { EnrolmentProfile } from "../../lib/hooks/useCourseEnrolment";

/**
 * Asked for once, before Paystack: the name and phone that go on the receipt
 * and the certificate. Shown only when the account does not already carry
 * them, so a returning student never sees it.
 */

type Props = {
  courseTitle: string;
  initial: EnrolmentProfile;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (profile: EnrolmentProfile) => void;
};

const CourseProfileModal = ({ courseTitle, initial, busy, onCancel, onSubmit }: Props) => {
  const [first, setFirst] = useState(initial.firstName);
  const [last, setLast] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [referral, setReferral] = useState("");

  // Escape closes, and the page behind must not scroll under the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onCancel]);

  const ready = first.trim() && last.trim() && phone.trim();

  return (
    <div
      className="ac-cd-scrim"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="ac-cd-dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enrol-profile-title"
      >
        <button type="button" className="ac-cd-x" onClick={onCancel} aria-label="Close">
          &times;
        </button>
        <h2 id="enrol-profile-title">Before you pay</h2>
        <p className="ac-cd-dsub">
          We put these on your receipt and your certificate for {courseTitle}.
        </p>

        <form
          className="ac-cd-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready || busy) return;
            onSubmit({
              firstName: first,
              lastName: last,
              phone,
              referralUsername: referral,
            });
          }}
        >
          <label htmlFor="enrol-first">First name</label>
          <input
            id="enrol-first"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="Your first name"
            autoComplete="given-name"
          />

          <label htmlFor="enrol-last">Last name</label>
          <input
            id="enrol-last"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Your last name"
            autoComplete="family-name"
          />

          <label htmlFor="enrol-phone">Phone number</label>
          <input
            id="enrol-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 08012345678"
            autoComplete="tel"
            inputMode="tel"
          />

          <label htmlFor="enrol-ref">
            Referral username <em>— optional</em>
          </label>
          <input
            id="enrol-ref"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            placeholder="Who sent you?"
          />

          <div className="ac-cd-dacts">
            <button type="button" className="pub-btn pub-btn-glass" onClick={onCancel}>
              Not yet
            </button>
            <button type="submit" className="pub-btn pub-btn-amber" disabled={!ready || busy}>
              {busy ? "Working…" : "Continue to payment"} <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseProfileModal;

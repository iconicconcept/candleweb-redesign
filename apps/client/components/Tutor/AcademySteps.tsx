import { Written } from "../public/Written";

const STEPS = [
  {
    title: "Select course",
    body: "Choose from the catalogue, tailored to where you are and what you want to be able to do.",
  },
  {
    title: "Make payment",
    body: "Secure checkout via Paystack, with multiple payment options available.",
  },
  {
    title: "Activate your tools",
    body: "Enrolment switches on your learning tools — your personal AI tutor and the project templates on your dashboard.",
  },
  {
    title: "Start learning",
    body: "Join live classes and follow your progress and credits on your dashboard.",
  },
];

const AcademySteps = () => (
  <>
    <p className="ac-eyebrow landing-rise">How it works</p>
    <h2>
      <Written text="From enrolment to first class, in four steps." />
    </h2>
    <div className="ac-steps">
      {STEPS.map((step, index) => (
        <div className="ac-st landing-rise" key={step.title}>
          <span className="ac-st-n">{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
      ))}
    </div>
  </>
);

export default AcademySteps;

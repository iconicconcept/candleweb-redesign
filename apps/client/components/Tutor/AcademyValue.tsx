const VALUES = [
  {
    tone: "",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
    title: "Real-world projects",
    body: "Design and build projects that reinforce what you've learned, grow your portfolio, and show recruiters what you can actually do.",
  },
  {
    tone: "",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18M7 8h7a3 3 0 010 6H7" />
      </svg>
    ),
    title: "Earn AI Units",
    body: "Complete tasks and quizzes to earn AI Credits, then spend them on learning tools — including a personal AI tutor available for projects, lessons and coursework.",
  },
  {
    tone: "amb",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
    title: "Internship opportunities",
    body: "Top performers gain access to internship slots with our partners, real project experience, and introductions to people already doing the work.",
  },
];

const AcademyValue = () => (
  <>
    <p className="ac-eyebrow ac-rise">More than a course</p>
    <h2 className="ac-rise">Real skills, and somewhere to use them.</h2>
    <p className="ac-lede ac-rise">
      We&apos;ve built the programme around what happens after the last class as
      much as what happens in it.
    </p>
    <div className="ac-vals">
      {VALUES.map((value) => (
        <div className={`ac-val ${value.tone} ac-rise`} key={value.title}>
          <div className="ac-ico">{value.icon}</div>
          <h3>{value.title}</h3>
          <p>{value.body}</p>
        </div>
      ))}
    </div>
  </>
);

export default AcademyValue;

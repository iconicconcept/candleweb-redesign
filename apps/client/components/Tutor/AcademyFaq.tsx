import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import tutorService from "../../services/tutorService";
import { Written } from "../public/Written";

const AcademyFaq = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { faqs, isLoading } = useSelector((state: RootState) => state.tutors);

  useEffect(() => {
    dispatch(tutorService.getFaqs());
  }, [dispatch]);

  const sortedFaqs = [...faqs].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <p className="ac-eyebrow landing-rise">Frequently asked questions</p>
      <h2>
        <Written text="Before you enrol." />
      </h2>
      <div className="ac-faq">
        {isLoading && sortedFaqs.length === 0 ? (
          <p className="ac-empty" style={{ display: "block" }}>
            Loading questions…
          </p>
        ) : sortedFaqs.length === 0 ? (
          <p className="ac-empty" style={{ display: "block" }}>
            No FAQs available at the moment.
          </p>
        ) : (
          sortedFaqs.map((faq, index) => (
            <details className="ac-q landing-rise" key={faq.id || index}>
              <summary>
                {faq.question}
                <i>+</i>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))
        )}
      </div>
    </>
  );
};

export default AcademyFaq;

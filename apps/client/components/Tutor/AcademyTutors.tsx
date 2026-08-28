import Image from "next/image";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import tutorService from "../../services/tutorService";
import { imageUri } from "../../utils/constants";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const AcademyTutors = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tutors, isLoading } = useSelector((state: RootState) => state.tutors);

  useEffect(() => {
    dispatch(tutorService.getTutors());
  }, [dispatch]);

  return (
    <>
      <p className="ac-eyebrow ac-rise">Your instructors</p>
      <h2 className="ac-rise">Learn from people who build this for a living.</h2>
      <p className="ac-lede ac-rise">
        Backend engineering, blockchain development, AI automation, personal
        finance and cryptocurrency trading — taught by the people doing the work,
        not reading about it.
      </p>
      <div className="ac-tutors">
        {!isLoading && tutors.length === 0 ? (
          <p className="ac-empty" style={{ display: "block" }}>
            Our instructor roster is being updated — check back soon.
          </p>
        ) : (
          tutors.map((tutor: any) => {
            if (!tutor) return null;
            const picture =
              tutor.picture && typeof tutor.picture === "string"
                ? tutor.picture.startsWith("http")
                  ? tutor.picture
                  : imageUri + tutor.picture
                : null;
            return (
              <div className="ac-tutor ac-rise" key={tutor.id}>
                <div className="ac-face">
                  {picture ? (
                    <Image
                      src={picture}
                      alt={tutor.name}
                      fill
                      sizes="78px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    initials(tutor.name || "")
                  )}
                  <em>✓</em>
                </div>
                <b>{tutor.name}</b>
                <span className="role">{tutor.title}</span>
                <p>{tutor.bio || "No bio provided."}</p>
                <div className="ac-mentored">
                  <b>{(tutor.total_students ?? 0).toLocaleString()}+</b>
                  <span>Students mentored</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default AcademyTutors;

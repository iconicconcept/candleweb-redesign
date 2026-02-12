import Image from "next/image";
import { NewLoader } from "ui";

type Props = {};

const Loader = (props: Props) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999999,
      }}
    >
      {/* <div className="loader__container">
        <div className="loader">
          <div className="loader--dot" />
          <div className="loader--dot" />
          <div className="loader--dot" />
          <div className="loader--dot" />
          <div className="loader--dot" />
          <div className="loader--dot" />
          <div className="loader--text" />
        </div>
      </div> */}

      <Image src={NewLoader} alt="Candleweb Loader" width={200} height={200} />

    </div>
  );
};

export default Loader;

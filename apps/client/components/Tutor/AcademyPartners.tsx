import Image from "next/image";
import { Fragment } from "react";
import { Written } from "../public/Written";

const PARTNERS = [
  { name: "n8n", logo: "/n8n_pink+black_logo.png" },
  { name: "Chain Co-op", logo: "/chain-co-op-logo.png" },
  { name: "SavvyBee", logo: "/savvy-logo.svg" },
  { name: "BitMart", logo: "/bitmart-logo.png" },
  { name: "MonieRate", logo: "/monierate-logo.png" },
];

const AcademyPartners = () => (
  <>
    <p className="ac-eyebrow landing-rise">Our partners</p>
    <h2 className="ac-sm">
      <Written text="Where outstanding graduates land." />
    </h2>
    <p className="ac-lede landing-rise rise-left">
      Through our partners, top graduates gain access to internship opportunities
      as soon as they finish.
    </p>
    <div className="ac-logos landing-rise">
      <div className="ac-logo-row">
        {[0, 1].map((set) => (
          <Fragment key={set}>
            {PARTNERS.map((partner) => (
              <div className="ac-logo-card" key={`${set}-${partner.name}`}>
                <span>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    sizes="168px"
                    style={{ objectFit: "contain" }}
                  />
                </span>
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  </>
);

export default AcademyPartners;

import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { uri } from "../../lib/axiosApi";

// Import PDF viewer components
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";

// Import the styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import Head from "next/head";
import Image from "next/image";

type Props = {};

const Certification = (props: Props) => {
  const router = useRouter();
  const [pdfSource, setPdfSource] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { user, course_code } = router.query;

  const fetchPdf = async (pdfUrl: string) => {
    try {
      setLoading(true);
      console.log("Attempting to fetch:", pdfUrl);

      const response = await fetch(pdfUrl, {
        method: "GET",
        // Remove credentials unless explicitly required
        // credentials: 'include',
        headers: {
          Accept: "*/*", // Match Postman’s broader Accept header
          "User-Agent": "YourAppName/1.0" // Optional: mimic Postman’s User-Agent
        }
      });

      console.log("Response status:", response.status);
      console.log("Content-Type:", response.headers.get("Content-Type"));

      if (!response.ok) {
        // Log JSON error response if present
        if (response.headers.get("Content-Type") === "application/json") {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          throw new Error(`Server error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      if (response.headers.get("Content-Type") !== "image/png") {
        throw new Error("Response is not an image");
      }

      const pdfBlob = await response.blob();
      const pdfUrlObject = URL.createObjectURL(pdfBlob);
      setPdfSource(pdfUrlObject);
      console.log("PDF loaded successfully");
    } catch (error) {
      console.error("Error fetching PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCertificate = async () => {
    console.log("Fetching certificate for user:", user);
    try {
      setLoading(true);
      const response = await fetch(`${uri}/certificate/${user}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certificate data");
      }

      const data = await response.json();
      const selectedCertificate = data.certificate.filter((cert: any) =>
        cert.course_code.includes(course_code as string)
      );

      if (!selectedCertificate || selectedCertificate.length === 0) {
        console.log("No matching certificate found");
        setLoading(false);
        return;
      }

      fetchPdf(
        `${uri}certificate/${user}/${selectedCertificate[0].certificate_number}?course_code=${course_code}`
      );
    } catch (error) {
      console.error("Error fetching certificate data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && pdfSource === "") {
      getCertificate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Clean up the URL object when component unmounts
  useEffect(() => {
    return () => {
      if (pdfSource) {
        URL.revokeObjectURL(pdfSource);
      }
    };
  }, [pdfSource]);

  return (
    <>
      <Head>
        <title>{user} Certificate</title>
        <meta
          name="description"
          content="Maximize trading success with CandleWeb! AI-powered CandleAI analyzes real-time data, giving a competitive edge in crypto. Utilize advanced algorithms, minimize risks, and maximize profits. Start achieving financial goals with CandleWeb and $CDE token. Access advanced tools for profitable trades in cryptocurrency."
        />
        <meta
          name="keywords"
          content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token"
        />
        <link rel="canonical" href="https://candleweb.io" />
        <meta
          property="og:title"
          content="CandleWeb - AI-Powered Trading Platform for Profitable Trades"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {loading && (
        <div className="flex justify-center items-center h-screen">
          <div className="inter text-xl">Loading...</div>
        </div>
      )}

      {pdfSource && (
        <div className="m-auto w-full max-w-[950px] my-24 sm:m-2 sm:mt-20 border-8 border-primary p-1">
          <Image src={pdfSource} alt="Certificate" width={100} height={100} className="w-full" />
        </div>
      )}

      {!loading && !pdfSource && (
        <div className="flex justify-center items-center h-screen">
          <div className="inter text-xl">No certificate found</div>
        </div>
      )}
    </>
  );
};

export default Certification;

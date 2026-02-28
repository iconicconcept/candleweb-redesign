import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import paymentService from "../../services/paymentService";
import Loader from "../../components/Loader";
import { toast } from "react-hot-toast";
import Head from "next/head";
import { resetPaymentStatus } from "../../redux/slices/paymentSlice";

const VerifyPayment = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isVerifying, lastPaymentStatus, error } = useSelector((state: RootState) => state.payment);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (router.isReady && router.query.reference && !verifyAttempted.current) {
      verifyAttempted.current = true;
      const reference = router.query.reference as string;
      dispatch(paymentService.verifyPayment(reference));
    }
  }, [router.isReady, router.query.reference, dispatch]);

  useEffect(() => {
    if (lastPaymentStatus === "success") {
      toast.success("Payment successful! You can now access your courses.");
      dispatch(resetPaymentStatus());
      router.push("/dashboard");
    } else if (lastPaymentStatus === "failed") {
      if (error) toast.error(error);
      dispatch(resetPaymentStatus());
      router.push("/tutor");
    }
  }, [lastPaymentStatus, error, router, dispatch]);

  return (
    <>
      <Head>
        <title>Verifying Payment... | Candleweb</title>
      </Head>
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
        <Loader />
        <p className="text-white mt-4 text-lg font-medium">Verifying your payment, please wait...</p>
      </div>
    </>
  );
};

export default VerifyPayment;

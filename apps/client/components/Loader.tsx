/**
 * App-wide full-screen loading overlay. Used by the auth pages, the dashboard
 * session gate (CheckLogin) and the on-chain payment flows.
 * On-brand: the Candleweb candle mark pulsing inside a teal ring spinner.
 */
const Loader = () => {
  return (
    <div className="cwl" role="status" aria-live="polite" aria-label="Loading">
      <div className="cwl-box">
        {/* <span className="cwl-ring" /> */}
        <span className="cwl-mark" />
      </div>
      <style jsx>{`
        .cwl {
          position: fixed;
          inset: 0;
          z-index: 999999999;
          display: grid;
          place-items: center;
          background: rgba(10, 12, 15, 0.62);
          backdrop-filter: blur(10px) saturate(1.1);
          -webkit-backdrop-filter: blur(10px) saturate(1.1);
          animation: cwl-fade 0.2s ease both;
        }
        .cwl-box {
          position: relative;
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
        }
        .cwl-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(46, 230, 168, 0) 0deg,
            rgba(46, 230, 168, 0.06) 110deg,
            #2ee6a8 320deg,
            #7ff3cd 360deg
          );
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          animation: cwl-spin 0.9s linear infinite;
        }
        .cwl-mark {
          width: 25px;
          height: 20px;
          background: linear-gradient(150deg, #7ff3cd, #0b8f6b);
          clip-path: polygon(
            0% 8%,
            20% 8%,
            34% 62%,
            50% 8%,
            66% 62%,
            80% 8%,
            100% 8%,
            60% 100%,
            50% 62%,
            40% 100%
          );
          filter: drop-shadow(0 0 12px rgba(46, 230, 168, 0.55));
          animation: cwl-pulse 1.5s ease-in-out infinite;
        }
        @keyframes cwl-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes cwl-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.88);
          }
        }
        @keyframes cwl-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cwl-ring {
            animation-duration: 2.2s;
          }
          .cwl-mark {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;

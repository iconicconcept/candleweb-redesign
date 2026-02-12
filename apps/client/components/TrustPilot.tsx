import React, { useEffect, useRef } from 'react';

interface TrustBoxProps {
    templateId: string;
    businessUnitId: string;
    styleHeight?: string;
    styleWidth?: string;
    theme?: string;
}

// const TrustBox: React.FC<TrustBoxProps> = ({
//     templateId,
//     businessUnitId,
//     styleHeight = '500px',
//     styleWidth = '100%',
//     theme = 'light',
// }) => {
//     const ref = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         // Check if Trustpilot is loaded and attach the TrustBox
//         if (window.Trustpilot) {
//             window.Trustpilot.loadFromElement(ref.current, true);
//         }
//     }, []);

//     return (
//         <div
//             ref={ref}
//             className="trustpilot-widget"
//             data-locale="en-US" // Add the locale attribute
//             data-template-id={templateId}
//             data-businessunit-id={businessUnitId}
//             data-style-height={styleHeight}
//             data-style-width={styleWidth}
//             data-theme={theme}
//         >
//             <a
//                 href="https://www.trustpilot.com/review/example.com"
//                 target="_blank"
//                 rel="noopener noreferrer"
//             >
//                 Trustpilot
//             </a>
//         </div>
//     );
// };

// export default TrustBox;

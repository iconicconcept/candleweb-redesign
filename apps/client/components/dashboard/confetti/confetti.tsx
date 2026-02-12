// components/ConfettiComponent.tsx
import React from 'react';
import Confetti from 'react-confetti';
import useWindowSize from '../../../lib/hooks/useWindowSize';

interface ConfettiComponentProps {
    trigger: boolean;
    onComplete: () => void;
}

const ConfettiComponent: React.FC<ConfettiComponentProps> = ({ trigger, onComplete }) => {
    const { width, height } = useWindowSize();

    return trigger ? (
        <Confetti
            width={width}
            height={height}
            recycle={false}
            onConfettiComplete={(confetti) => {
                confetti?.reset();
                onComplete();
            }}
        />
    ) : null;
};

export default ConfettiComponent;

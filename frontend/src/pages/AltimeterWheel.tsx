import React, { useState, useRef, useEffect } from 'react';

interface AltimeterWheelProps {
    onAltitudeChange?: (altitude: number) => void;
    minAltitude?: number;
    maxAltitude?: number;
    step?: number;
    disabled?: boolean; // ✅ Add this
}

const generateAltitudeValues = (min: number, max: number, step: number): number[] => {
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
        values.push(i);
    }
    return values;
};

const AltimeterWheel: React.FC<AltimeterWheelProps> = ({
    onAltitudeChange,
    minAltitude = -200,
    maxAltitude = 500,
    disabled = false,
    step = 10
}) => {
    const [altitude, setAltitude] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [startY, setStartY] = useState<number>(0);
    const [startAltitude, setStartAltitude] = useState<number>(0);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Generate altitude values
    const altitudeValues = React.useMemo(
        () => generateAltitudeValues(minAltitude, maxAltitude, step),
        [minAltitude, maxAltitude, step]
    );

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        setIsDragging(true);
        setStartY(e.clientY);
        setStartAltitude(altitude);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaY = startY - e.clientY;
        const altitudeChange = Math.round(deltaY / 2) * step;
        const newAltitude = Math.max(minAltitude, Math.min(maxAltitude, startAltitude + altitudeChange));
        setAltitude(newAltitude);
        onAltitudeChange?.(newAltitude);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -step : step;
        const newAltitude = Math.max(minAltitude, Math.min(maxAltitude, altitude + delta));
        setAltitude(newAltitude);
        onAltitudeChange?.(newAltitude);
    };
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, startY, startAltitude]);

    // Calculate visible values
    const getVisibleAltitudes = (): number[] => {
        const centerIndex = altitudeValues.indexOf(altitude);
        const visibleRange = 6;
        const startIndex = Math.max(0, centerIndex - visibleRange);
        const endIndex = Math.min(altitudeValues.length - 1, centerIndex + visibleRange);
        return altitudeValues.slice(startIndex, endIndex + 1);
    };

    const visibleAltitudes = getVisibleAltitudes();
    const centerIndex = visibleAltitudes.indexOf(altitude);

    return (
        <div className="absolute -translate-y-1/2 left-4 top-1/3">
            <div
                ref={wheelRef}
                className={`relative w-16 h-32 overflow-hidden border rounded-lg select-none bg-black/70 border-white/40 ${disabled ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                style={{ cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab' }}
            >
                {/* Center indicator */}
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-yellow-400 z-10">
                    <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-yellow-400 transform translate-x-full -translate-y-0.5"></div>
                </div>

                {/* Scrolling altitude values */}
                <div className="relative h-full">
                    {visibleAltitudes.map((value: number, index: number) => {
                        const distanceFromCenter = index - centerIndex;
                        const yOffset = distanceFromCenter * 24;
                        const opacity = Math.max(0.4, 1 - Math.abs(distanceFromCenter) * 0.2);

                        return (
                            <div
                                key={value}
                                className="absolute left-0 right-0 font-mono text-xs text-center text-white"
                                style={{
                                    top: '50%',
                                    transform: `translateY(${yOffset - 8}px)`,
                                    opacity: opacity,
                                    fontWeight: value === altitude ? 'bold' : 'normal',
                                    color: value === altitude ? '#facc15' : '#ffffff'
                                }}
                            >
                                {value}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Optional digital readout */}
            <div className="mt-2 text-center">
                <div className="px-2 py-1 border rounded bg-black/70 border-white/30">
                    <div className="font-mono text-xs font-bold text-green-400">
                        {altitude} ft
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AltimeterWheel;
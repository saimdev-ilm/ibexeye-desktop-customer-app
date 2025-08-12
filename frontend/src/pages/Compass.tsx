import React, { useState } from 'react';

interface CompassProps {
    bearing?: number;
    size?: number;
}

const Compass: React.FC<CompassProps> = ({ bearing = 200, size = 100 }) => {
    const [currentBearing,] = useState(bearing);

    // Generate tick marks for the compass - simplified for small size
    const generateTicks = () => {
        const ticks = [];

        for (let i = 0; i < 360; i += 15) { // Reduced tick frequency for less congestion
            const isMainDirection = i % 90 === 0;
            const isMajorTick = i % 30 === 0;
            const angle = i - 90;

            const outerRadius = size / 2 - 3;
            const innerRadius = isMainDirection ? size / 2 - 12 :
                isMajorTick ? size / 2 - 8 : size / 2 - 5;

            const x1 = (size / 2) + outerRadius * Math.cos(angle * Math.PI / 180);
            const y1 = (size / 2) + outerRadius * Math.sin(angle * Math.PI / 180);
            const x2 = (size / 2) + innerRadius * Math.cos(angle * Math.PI / 180);
            const y2 = (size / 2) + innerRadius * Math.sin(angle * Math.PI / 180);

            ticks.push(
                <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#666"
                    strokeWidth={isMainDirection ? 1.5 : isMajorTick ? 1 : 0.5}
                />
            );
        }

        return ticks;
    };

    // Generate degree labels - only major ones for small size
    const generateLabels = () => {
        const labels = [];

        for (let i = 0; i < 360; i += 90) { // Only show 0, 90, 180, 270 to reduce clutter
            const angle = i - 90;
            const radius = size / 2 - 16;
            const x = (size / 2) + radius * Math.cos(angle * Math.PI / 180);
            const y = (size / 2) + radius * Math.sin(angle * Math.PI / 180);

            labels.push(
                <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#666"
                    fontSize="6"
                    fontFamily="Arial, sans-serif"
                >
                    {i}°
                </text>
            );
        }

        return labels;
    };

    // Generate cardinal direction labels - made smaller
    const generateCardinalLabels = () => {
        const directions = [
            { label: 'N', angle: 0, color: '#ff4444' },
            { label: 'E', angle: 90, color: '#fff' },
            { label: 'S', angle: 180, color: '#fff' },
            { label: 'W', angle: 270, color: '#fff' }
        ];

        return directions.map(({ label, angle, color }) => {
            const adjustedAngle = angle - 90;
            const radius = size / 2 - 24;
            const x = (size / 2) + radius * Math.cos(adjustedAngle * Math.PI / 180);
            const y = (size / 2) + radius * Math.sin(adjustedAngle * Math.PI / 180);

            return (
                <text
                    key={label}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color}
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                >
                    {label}
                </text>
            );
        });
    };

    return (
        <div className="flex items-center justify-between gap-2 text-white">
            <div className="relative">
                <svg
                    width={size}
                    height={size}
                    className="transition-transform duration-1000 ease-out transform rounded-full bg-black/70"
                    style={{ transform: `rotate(${-currentBearing}deg)` }}
                >
                    {/* Outer circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={size / 2 - 3}
                        fill="none"
                        stroke="#333"
                        strokeWidth="1"
                    />

                    {/* Inner circle - smaller for size 100 */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={size / 2 - 30}
                        fill="none"
                        stroke="#333"
                        strokeWidth="0.5"
                    />

                    {/* Tick marks */}
                    {generateTicks()}

                    {/* Degree labels */}
                    {generateLabels()}

                    {/* Cardinal direction labels */}
                    {generateCardinalLabels()}

                    {/* Center dot - smaller */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r="1"
                        fill="#666"
                    />

                    {/* Crosshairs - smaller */}
                    <line
                        x1={size / 2}
                        y1={size / 2 - 20}
                        x2={size / 2}
                        y2={size / 2 + 20}
                        stroke="#333"
                        strokeWidth="0.5"
                    />
                    <line
                        x1={size / 2 - 20}
                        y1={size / 2}
                        x2={size / 2 + 20}
                        y2={size / 2}
                        stroke="#333"
                        strokeWidth="0.5"
                    />
                </svg>

                {/* Fixed needle pointing up - smaller for size 100 */}
                <div
                    className="absolute w-1.5 h-12 transform -translate-x-1/2 bg-red-500 left-1/2"
                    style={{
                        top: '2px',
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                        backgroundColor: '#ff4444'
                    }}
                />
            </div>
            {/* Bearing display */}
            <div className="font-mono text-xs text-nowrap">
                {Math.round(currentBearing)}° N
            </div>
        </div>
    );
};

export default Compass;
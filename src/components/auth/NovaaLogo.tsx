import React from 'react';

export default function NovaaLogo({ size = 180 }: { size?: number }) {
  const center = size / 2;
  const cloudR = size * 0.18;
  const orbitR = size * 0.35;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow background */}
      <div
        className="absolute rounded-full animate-pulse-glow"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          background: 'radial-gradient(circle, rgba(124,92,255,0.15) 0%, rgba(76,201,240,0.05) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="50%" stopColor="#4CC9F0" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CC9F0" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#4CC9F0" />
          </linearGradient>
          <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#7C5CFF" />
          </linearGradient>
          <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CC9F0" />
            <stop offset="100%" stopColor="#7C5CFF" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Orbiting icons - Cloud (center) */}
        <g filter="url(#glow)">
          {/* Main Cloud Shape */}
          <path
            d={`M${center - cloudR * 1.5} ${center + cloudR * 0.3}
                C${center - cloudR * 2} ${center + cloudR * 0.3}
                ${center - cloudR * 2} ${center - cloudR * 0.3}
                ${center - cloudR * 1.4} ${center - cloudR * 0.4}
                C${center - cloudR * 1.4} ${center - cloudR * 1.2}
                ${center - cloudR * 0.5} ${center - cloudR * 1.6}
                ${center} ${center - cloudR * 1.2}
                C${center + cloudR * 0.5} ${center - cloudR * 1.7}
                ${center + cloudR * 1.3} ${center - cloudR * 1.3}
                ${center + cloudR * 1.5} ${center - cloudR * 0.5}
                C${center + cloudR * 2} ${center - cloudR * 0.5}
                ${center + cloudR * 2.1} ${center + cloudR * 0.3}
                ${center + cloudR * 1.6} ${center + cloudR * 0.3}
                Z`}
            fill="url(#cloudGrad)"
            opacity="0.95"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values={`
                M${center - cloudR * 1.5} ${center + cloudR * 0.3}
                C${center - cloudR * 2} ${center + cloudR * 0.3}
                ${center - cloudR * 2} ${center - cloudR * 0.3}
                ${center - cloudR * 1.4} ${center - cloudR * 0.4}
                C${center - cloudR * 1.4} ${center - cloudR * 1.2}
                ${center - cloudR * 0.5} ${center - cloudR * 1.6}
                ${center} ${center - cloudR * 1.2}
                C${center + cloudR * 0.5} ${center - cloudR * 1.7}
                ${center + cloudR * 1.3} ${center - cloudR * 1.3}
                ${center + cloudR * 1.5} ${center - cloudR * 0.5}
                C${center + cloudR * 2} ${center - cloudR * 0.5}
                ${center + cloudR * 2.1} ${center + cloudR * 0.3}
                ${center + cloudR * 1.6} ${center + cloudR * 0.3}
                Z;
                M${center - cloudR * 1.4} ${center + cloudR * 0.4}
                C${center - cloudR * 1.9} ${center + cloudR * 0.4}
                ${center - cloudR * 1.9} ${center - cloudR * 0.2}
                ${center - cloudR * 1.3} ${center - cloudR * 0.3}
                C${center - cloudR * 1.3} ${center - cloudR * 1.1}
                ${center - cloudR * 0.4} ${center - cloudR * 1.4}
                ${center} ${center - cloudR * 1.0}
                C${center + cloudR * 0.5} ${center - cloudR * 1.5}
                ${center + cloudR * 1.2} ${center - cloudR * 1.1}
                ${center + cloudR * 1.4} ${center - cloudR * 0.4}
                C${center + cloudR * 1.9} ${center - cloudR * 0.4}
                ${center + cloudR * 2} ${center + cloudR * 0.4}
                ${center + cloudR * 1.5} ${center + cloudR * 0.4}
                Z;
                M${center - cloudR * 1.5} ${center + cloudR * 0.3}
                C${center - cloudR * 2} ${center + cloudR * 0.3}
                ${center - cloudR * 2} ${center - cloudR * 0.3}
                ${center - cloudR * 1.4} ${center - cloudR * 0.4}
                C${center - cloudR * 1.4} ${center - cloudR * 1.2}
                ${center - cloudR * 0.5} ${center - cloudR * 1.6}
                ${center} ${center - cloudR * 1.2}
                C${center + cloudR * 0.5} ${center - cloudR * 1.7}
                ${center + cloudR * 1.3} ${center - cloudR * 1.3}
                ${center + cloudR * 1.5} ${center - cloudR * 0.5}
                C${center + cloudR * 2} ${center - cloudR * 0.5}
                ${center + cloudR * 2.1} ${center + cloudR * 0.3}
                ${center + cloudR * 1.6} ${center + cloudR * 0.3}
                Z
              `}
            />
          </path>

          {/* Upload Arrow inside cloud */}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,2;0,-2;0,2`}
              dur="2s"
              repeatCount="indefinite"
            />
            <path
              d={`M${center - cloudR * 0.25} ${center + cloudR * 0.1}
                  L${center} ${center - cloudR * 0.3}
                  L${center + cloudR * 0.25} ${center + cloudR * 0.1}`}
              stroke="url(#arrowGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glow)"
            />
            <line
              x1={center} y1={center - cloudR * 0.3}
              x2={center} y2={center + cloudR * 0.15}
              stroke="url(#arrowGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
            />
          </g>
        </g>

        {/* Orbiting icons */}
        {/* Shield - Top */}
        <g filter="url(#glow)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 180 180"
            to="360 180 180"
            dur="20s"
            repeatCount="indefinite"
          />
          <g>
            <path
              d={`M${center} ${center - orbitR - cloudR * 0.4}
                  L${center + cloudR * 0.4} ${center - orbitR - cloudR * 0.1}
                  L${center + cloudR * 0.4} ${center - orbitR + cloudR * 0.15}
                  C${center + cloudR * 0.4} ${center - orbitR + cloudR * 0.4}
                  ${center + cloudR * 0.15} ${center - orbitR + cloudR * 0.6}
                  ${center} ${center - orbitR + cloudR * 0.7}
                  C${center - cloudR * 0.15} ${center - orbitR + cloudR * 0.6}
                  ${center - cloudR * 0.4} ${center - orbitR + cloudR * 0.4}
                  ${center - cloudR * 0.4} ${center - orbitR + cloudR * 0.15}
                  L${center - cloudR * 0.4} ${center - orbitR - cloudR * 0.1}
                  Z`}
              fill="url(#shieldGrad)"
              opacity="0.9"
            />
            <line
              x1={center} y1={center - orbitR - cloudR * 0.35}
              x2={center} y2={center - orbitR + cloudR * 0.5}
              stroke="#0B1020"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M${center - cloudR * 0.15} ${center - orbitR + cloudR * 0.1}
                  L${center - cloudR * 0.05} ${center - orbitR + cloudR * 0.25}
                  L${center + cloudR * 0.2} ${center - orbitR - cloudR * 0.05}`}
              stroke="#0B1020"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
          <text
            x={center}
            y={center - orbitR - cloudR * 0.65}
            textAnchor="middle"
            fill="#4CC9F0"
            fontSize="7"
            fontWeight="600"
            opacity="0.7"
          >
            PROTECTED
          </text>
        </g>

        {/* Lock - Bottom */}
        <g filter="url(#glow)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="180 180 180"
            to="540 180 180"
            dur="20s"
            repeatCount="indefinite"
          />
          <g>
            <rect
              x={center - cloudR * 0.25}
              y={center + orbitR - cloudR * 0.15}
              width={cloudR * 0.5}
              height={cloudR * 0.45}
              rx={cloudR * 0.08}
              fill="url(#lockGrad)"
              opacity="0.9"
            />
            <path
              d={`M${center - cloudR * 0.18} ${center + orbitR - cloudR * 0.15}
                  V${center + orbitR - cloudR * 0.4}
                  A${cloudR * 0.18} ${cloudR * 0.25} 0 0 1 ${center + cloudR * 0.18} ${center + orbitR - cloudR * 0.4}
                  V${center + orbitR - cloudR * 0.15}`}
              fill="none"
              stroke="url(#lockGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle
              cx={center}
              cy={center + orbitR + cloudR * 0.05}
              r={cloudR * 0.06}
              fill="#0B1020"
            />
          </g>
          <text
            x={center}
            y={center + orbitR + cloudR * 0.8}
            textAnchor="middle"
            fill="#7C5CFF"
            fontSize="7"
            fontWeight="600"
            opacity="0.7"
          >
            ENCRYPTED
          </text>
        </g>

        {/* Folder - Right */}
        <g filter="url(#glow)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="90 180 180"
            to="450 180 180"
            dur="20s"
            repeatCount="indefinite"
          />
          <g>
            <path
              d={`M${center + orbitR - cloudR * 0.4} ${center - cloudR * 0.25}
                  L${center + orbitR - cloudR * 0.4} ${center + cloudR * 0.25}
                  L${center + orbitR + cloudR * 0.4} ${center + cloudR * 0.25}
                  L${center + orbitR + cloudR * 0.4} ${center - cloudR * 0.1}
                  L${center + orbitR + cloudR * 0.05} ${center - cloudR * 0.1}
                  L${center + orbitR - cloudR * 0.05} ${center - cloudR * 0.25}
                  Z`}
              fill="url(#folderGrad)"
              opacity="0.9"
            />
            <path
              d={`M${center + orbitR - cloudR * 0.3} ${center + cloudR * 0.15}
                  V${center - cloudR * 0.15}
                  H${center + orbitR + cloudR * 0.3}`}
              fill="none"
              stroke="#0B1020"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1={center + orbitR - cloudR * 0.15}
              y1={center + cloudR * 0.15}
              x2={center + orbitR + cloudR * 0.15}
              y2={center + cloudR * 0.15}
              stroke="#0B1020"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
          <text
            x={center + orbitR + cloudR * 0.7}
            y={center + cloudR * 0.05}
            textAnchor="middle"
            fill="#4CC9F0"
            fontSize="7"
            fontWeight="600"
            opacity="0.7"
          >
            FILES
          </text>
        </g>

        {/* File - Left */}
        <g filter="url(#glow)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="270 180 180"
            to="630 180 180"
            dur="20s"
            repeatCount="indefinite"
          />
          <g>
            <path
              d={`M${center - orbitR - cloudR * 0.3} ${center + cloudR * 0.3}
                  V${center - cloudR * 0.3}
                  L${center - orbitR} ${center - cloudR * 0.3}
                  L${center - orbitR + cloudR * 0.25} ${center - cloudR * 0.05}
                  H${center - orbitR + cloudR * 0.35}
                  V${center + cloudR * 0.3}
                  Z`}
              fill="url(#arrowGrad)"
              opacity="0.9"
            />
            <line
              x1={center - orbitR - cloudR * 0.15}
              y1={center + cloudR * 0.05}
              x2={center - orbitR - cloudR * 0.05}
              y2={center + cloudR * 0.05}
              stroke="#0B1020"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1={center - orbitR - cloudR * 0.15}
              y1={center + cloudR * 0.15}
              x2={center - orbitR + cloudR * 0.05}
              y2={center + cloudR * 0.15}
              stroke="#0B1020"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
          <text
            x={center - orbitR - cloudR * 0.7}
            y={center + cloudR * 0.05}
            textAnchor="middle"
            fill="#00E5FF"
            fontSize="7"
            fontWeight="600"
            opacity="0.7"
          >
            DOCS
          </text>
        </g>

        {/* Orbit rings */}
        <circle
          cx={center} cy={center} r={orbitR}
          fill="none"
          stroke="url(#cloudGrad)"
          strokeWidth="0.3"
          opacity="0.2"
        />
        <circle
          cx={center} cy={center} r={orbitR + cloudR * 0.35}
          fill="none"
          stroke="url(#shieldGrad)"
          strokeWidth="0.3"
          opacity="0.15"
        />

        {/* Floating particles around logo */}
        {[
          { x: center + orbitR * 0.6, y: center - orbitR * 0.7, r: 1.5, color: '#7C5CFF', delay: '0s' },
          { x: center - orbitR * 0.5, y: center + orbitR * 0.8, r: 2, color: '#4CC9F0', delay: '0.5s' },
          { x: center + orbitR * 0.8, y: center + orbitR * 0.4, r: 1.2, color: '#00E5FF', delay: '1s' },
          { x: center - orbitR * 0.7, y: center - orbitR * 0.5, r: 1.8, color: '#7C5CFF', delay: '1.5s' },
          { x: center + orbitR * 0.3, y: center + orbitR * 0.9, r: 1, color: '#4CC9F0', delay: '0.3s' },
          { x: center - orbitR * 0.9, y: center + orbitR * 0.2, r: 1.4, color: '#00E5FF', delay: '0.8s' },
        ].map((particle, i) => (
          <circle key={i} cx={particle.x} cy={particle.y} r={particle.r} fill={particle.color} opacity="0.6">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="2s"
              begin={particle.delay}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${particle.y - 5};${particle.y + 5};${particle.y - 5}`}
              dur="3s"
              begin={particle.delay}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Central glow pulse */}
        <circle cx={center} cy={center} r={cloudR * 0.5} fill="#7C5CFF" opacity="0.08">
          <animate
            attributeName="r"
            values={`${cloudR * 0.3};${cloudR * 0.7};${cloudR * 0.3}`}
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.08;0.15;0.08"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
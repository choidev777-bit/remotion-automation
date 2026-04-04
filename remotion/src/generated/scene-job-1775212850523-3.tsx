import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

export const AiFreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall scene fade-in/scale-in
  const sceneProgress = spring({
    frame: frame,
    fps,
    config: {
      damping: 200,
      stiffness: 1000,
    },
    durationInFrames: 30, // Initial scene build-up
  });

  const sceneScale = interpolate(sceneProgress, [0, 1], [0.8, 1]);
  const sceneOpacity = interpolate(sceneProgress, [0, 1], [0, 1]);

  // AI Core Screen animation
  const aiScreenProgress = spring({
    frame: frame - 15, // Starts slightly after scene init
    fps,
    config: {
      damping: 200,
      stiffness: 1000,
    },
    durationInFrames: 30,
  });

  const aiScreenScale = interpolate(aiScreenProgress, [0, 1], [0.5, 1]);
  const aiScreenOpacity = interpolate(aiScreenProgress, [0, 1], [0, 1]);
  const aiScreenTranslateY = interpolate(aiScreenProgress, [0, 1], [100, 0]);

  // Doctor & Lawyer panels animation (slide in)
  const panelsProgress = spring({
    frame: frame - 40, // Starts after AI screen is visible
    fps,
    config: {
      damping: 200,
      stiffness: 1000,
    },
    durationInFrames: 30,
  });

  const doctorPanelTranslateX = interpolate(panelsProgress, [0, 1], [-300, 0]); // Slide from further out
  const lawyerPanelTranslateX = interpolate(panelsProgress, [0, 1], [300, 0]); // Slide from further out
  const panelsOpacity = interpolate(panelsProgress, [0, 1], [0, 1]);

  // AI data animation (grid, lines, text)
  const aiDataProgress = spring({
    frame: frame - 50,
    fps,
    config: { damping: 200, stiffness: 1000 },
    durationInFrames: 40,
  });

  const aiGridOpacity = interpolate(aiDataProgress, [0, 0.5], [0, 1], { extrapolateLeft: 'clamp' });
  const aiLineDraw = interpolate(aiDataProgress, [0.5, 1], [0, 100], { extrapolateLeft: 'clamp' }); // Percentage for stroke-dashoffset
  const aiTextOpacity = interpolate(aiDataProgress, [0.7, 1], [0, 1], { extrapolateLeft: 'clamp' });

  // Connecting lines from AI to panels
  const connectingLineProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 200, stiffness: 1000 },
    durationInFrames: 40,
  });
  const lineDrawLength = interpolate(connectingLineProgress, [0, 1], [0, 200]); // Max length for drawing lines

  // Icon and text animations within panels
  const iconTextProgress = spring({
    frame: frame - 70,
    fps,
    config: { damping: 200, stiffness: 1000 },
    durationInFrames: 30,
  });
  const iconTextOpacity = interpolate(iconTextProgress, [0, 1], [0, 1]);
  const iconTextScale = interpolate(iconTextProgress, [0, 1], [0.8, 1]);

  // Helper function to draw a simple person icon (reusable for doctor/patient/lawyer)
  const PersonIcon = ({ color }: { color: string }) => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3"></circle>
      <path d="M17 14h-2a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2z"></path>
      <path d="M7 14H5a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2z"></path>
      <line x1="12" y1="11" x2="12" y2="14"></line>
    </svg>
  );

  // Helper function for Stethoscope icon
  const StethoscopeIcon = ({ color }: { color: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 013 3v6a3 3 0 01-3 3H9a3 3 0 01-3-3V5a3 3 0 013-3h3z"></path>
      <path d="M15 11v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7"></path>
      <path d="M18 11v7a2 2 0 01-2 2h-1"></path>
      <circle cx="12" cy="18" r="2"></circle>
    </svg>
  );

  // Helper function for Gavel icon
  const GavelIcon = ({ color }: { color: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6L8 12 11 15 17 9 14 6z"></path>
      <path d="M12 21l3-3"></path>
      <path d="M19 12l2 2-2 2-2-2 2-2z"></path>
      <path d="M10 18l-3 3"></path>
      <line x1="14" y1="6" x2="17" y2="9"></line>
      <line x1="11" y1="15" x2="8" y2="12"></line>
    </svg>
  );

  // Helper function for Document icon
  const DocumentIcon = ({ color }: { color: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  );

  // Dynamic values for AI data lines to make them appear more complex
  const line1EndX = interpolate(aiLineDraw, [0, 100], [20, 400]);
  const line2EndX = interpolate(aiLineDraw, [0, 100], [440, 60]);
  const path1ControlY1 = interpolate(aiLineDraw, [0, 100], [100, 180]);
  const path1ControlY2 = interpolate(aiLineDraw, [0, 100], [200, 120]);
  const path1EndX = interpolate(aiLineDraw, [0, 100], [50, 400]);
  const path1EndY = interpolate(aiLineDraw, [0, 100], [150, 250]);
  const path1Length = interpolate(aiLineDraw, [0, 100], [0, 600]); // Max length of the path for stroke-dashoffset

  const circlePulseScale = interpolate(frame % 30, [0, 15, 30], [1, 1.2, 1], {extrapolateRight: "clamp"});


  return (
    <AbsoluteFill style={{
      backgroundColor: theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: sceneOpacity,
      transform: `scale(${sceneScale})`,
      fontFamily: 'Inter, sans-serif', // Using Inter as a common sans-serif
      color: theme.text,
    }}>
      {/* AI Central Screen */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '350px',
          backgroundColor: theme.card,
          borderRadius: '15px',
          boxShadow: `0 0 40px ${theme.primary}40`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${aiScreenScale}) translateY(${aiScreenTranslateY}px)`,
          opacity: aiScreenOpacity,
          border: `2px solid ${theme.primary}`,
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        {/* AI Data Grid - Animated */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          bottom: '20px',
          border: `1px dashed ${theme.textMuted}80`,
          opacity: aiGridOpacity,
        }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={`grid-h-${i}`}
              style={{
                position: 'absolute',
                top: `${(i + 1) * 16.6}%`,
                left: 0,
                width: `${interpolate(aiGridOpacity, [0,1], [0,100])}%`, // Animate width
                height: '1px',
                backgroundColor: theme.textMuted,
                opacity: aiGridOpacity,
              }}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <div
              key={`grid-v-${i}`}
              style={{
                position: 'absolute',
                left: `${(i + 1) * 16.6}%`,
                top: 0,
                height: `${interpolate(aiGridOpacity, [0,1], [0,100])}%`, // Animate height
                width: '1px',
                backgroundColor: theme.textMuted,
                opacity: aiGridOpacity,
              }}
            />
          ))}
        </div>

        {/* Dynamic Data Lines within AI screen */}
        <svg width="460" height="310" viewBox="0 0 460 310" style={{ position: 'absolute', opacity: aiGridOpacity }}>
          <line
            x1="20" y1="50" x2={line1EndX} y2="50"
            stroke={theme.primary} strokeWidth="3"
            strokeDasharray="1000" strokeDashoffset={1000 - aiLineDraw * 10} // Simulate drawing
            strokeLinecap="round"
          />
          <line
            x1="440" y1="100" x2={line2EndX} y2="100"
            stroke={theme.accent} strokeWidth="3"
            strokeDasharray="1000" strokeDashoffset={1000 - aiLineDraw * 10}
            strokeLinecap="round"
          />
          <path
            d={`M50 150 C 150 ${path1ControlY1}, 300 ${path1ControlY2}, ${path1EndX} ${path1EndY}`}
            stroke={theme.primary} fill="none" strokeWidth="3"
            strokeDasharray={path1Length} strokeDashoffset={path1Length - aiLineDraw * path1Length / 100}
            strokeLinecap="round"
          />
        </svg>

        <h3 style={{
          position: 'relative',
          fontSize: '2.5em',
          color: theme.primary,
          marginBottom: '10px',
          opacity: aiTextOpacity,
          zIndex: 1,
          textShadow: `0 0 10px ${theme.primary}40`
        }}>
          AI Intelligence
        </h3>
        <p style={{
          fontSize: '1.2em',
          color: theme.textMuted,
          textAlign: 'center',
          opacity: aiTextOpacity,
          zIndex: 1
        }}>
          Analyzing complex data...
        </p>
      </div>

      {/* Doctor Panel */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: '-700px', // Adjusted position for doctor panel (left of AI screen)
          width: '400px',
          height: '300px',
          backgroundColor: theme.card,
          borderRadius: '15px',
          boxShadow: `0 0 20px ${theme.primary}30`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          border: `1px solid ${theme.primary}`,
          transform: `translateX(${doctorPanelTranslateX}px)`,
          opacity: panelsOpacity,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          <PersonIcon color={theme.primary} />
          <StethoscopeIcon color={theme.primary} />
          <PersonIcon color={theme.textMuted} /> {/* Patient */}
        </div>
        <h4 style={{ color: theme.primary, fontSize: '1.8em', marginBottom: '10px', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          Medical Insights
        </h4>
        <p style={{ color: theme.textMuted, textAlign: 'center', fontSize: '1.1em', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          AI assists diagnosis, doctor ensures compassionate care.
        </p>
      </div>

      {/* Lawyer Panel */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: '300px', // Adjusted position for lawyer panel (right of AI screen)
          width: '400px',
          height: '300px',
          backgroundColor: theme.card,
          borderRadius: '15px',
          boxShadow: `0 0 20px ${theme.accent}30`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          border: `1px solid ${theme.accent}`,
          transform: `translateX(${lawyerPanelTranslateX}px)`,
          opacity: panelsOpacity,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          <PersonIcon color={theme.accent} />
          <GavelIcon color={theme.accent} />
          <DocumentIcon color={theme.textMuted} />
        </div>
        <h4 style={{ color: theme.accent, fontSize: '1.8em', marginBottom: '10px', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          Legal Strategies
        </h4>
        <p style={{ color: theme.textMuted, textAlign: 'center', fontSize: '1.1em', opacity: iconTextOpacity, transform: `scale(${iconTextScale})` }}>
          AI analyzes cases, lawyer provides human judgment.
        </p>
      </div>

      {/* Connecting Lines SVG */}
      <svg
        width="1400" // Increased width to cover the full span of elements
        height="500"
        viewBox="0 0 1400 500" // Adjusted viewBox
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'none',
          opacity: panelsOpacity
        }}
      >
        {/* Line from AI center (700, 250 in 1400x500 viewBox) to Doctor Panel center (200, 250) */}
        <line
          x1="700" y1="250"
          x2="200" y2="250"
          stroke={theme.primary}
          strokeWidth="3"
          strokeDasharray="200 200" // Adjust dash array to be long enough for full draw
          strokeDashoffset={200 - lineDrawLength}
          strokeLinecap="round"
        />
        {lineDrawLength > 0 && (
          <circle cx="200" cy="250" r="5" fill={theme.primary} style={{ transform: `scale(${circlePulseScale})` }}/>
        )}


        {/* Line from AI center (700, 250) to Lawyer Panel center (1200, 250) */}
        <line
          x1="700" y1="250"
          x2="1200" y2="250"
          stroke={theme.accent}
          strokeWidth="3"
          strokeDasharray="200 200"
          strokeDashoffset={200 - lineDrawLength}
          strokeLinecap="round"
        />
        {lineDrawLength > 0 && (
          <circle cx="1200" cy="250" r="5" fill={theme.accent} style={{ transform: `scale(${circlePulseScale})` }}/>
        )}
      </svg>

    </AbsoluteFill>
  );
};
import React from 'react';
import { PageFrameStyleId } from '../types';

interface PageFrameOverlayProps {
  frameStyle?: PageFrameStyleId;
  borderColor?: string;
  borderWidthPx?: number;
  insetMm?: number;
}

export const PageFrameOverlay: React.FC<PageFrameOverlayProps> = ({
  frameStyle = 'none',
  borderColor = '#0A194E',
  borderWidthPx = 2,
  insetMm = 10,
}) => {
  if (!frameStyle || frameStyle === 'none') return null;

  const insetPx = Math.round(insetMm * 3.7795);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${insetPx}px`,
    left: `${insetPx}px`,
    right: `${insetPx}px`,
    bottom: `${insetPx}px`,
    pointerEvents: 'none',
    zIndex: 2,
    boxSizing: 'border-box',
  };

  switch (frameStyle) {
    case 'minimal-dotted':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx}px dotted ${borderColor}`,
          }}
        />
      );

    case 'simple-double':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx * 1.5}px double ${borderColor}`,
          }}
        />
      );

    case 'classic-border':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx}px solid ${borderColor}`,
            outline: `1px solid ${borderColor}`,
            outlineOffset: '-5px',
          }}
        />
      );

    case 'double-line-inset':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx}px solid ${borderColor}`,
            boxShadow: `inset 0 0 0 4px #FFFFFF, inset 0 0 0 5px ${borderColor}`,
          }}
        />
      );

    case 'executive-solid':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `1px solid ${borderColor}`,
            borderTop: `${borderWidthPx * 2.5}px solid ${borderColor}`,
            borderBottom: `${borderWidthPx * 1.5}px solid ${borderColor}`,
          }}
        />
      );

    case 'creative-artistic':
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx}px dashed ${borderColor}`,
            boxShadow: `0 0 0 3px #FFFFFF, 0 0 0 4px ${borderColor}`,
          }}
        />
      );

    case 'decorative-corner':
      return (
        <div className="doc-page-decorative-frame" style={containerStyle}>
          {/* Subtle perimeter rule */}
          <div
            style={{
              position: 'absolute',
              inset: '8px',
              border: `1px solid ${borderColor}`,
              opacity: 0.45,
            }}
          />
          {/* Top Left Corner Bracket */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0 }}
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              d="M 2 24 L 2 2 L 24 2"
              stroke={borderColor}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="square"
            />
            <path d="M 6 18 L 6 6 L 18 6" stroke={borderColor} strokeWidth="1.2" fill="none" />
          </svg>
          {/* Top Right Corner Bracket */}
          <svg
            style={{ position: 'absolute', top: 0, right: 0 }}
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              d="M 30 24 L 30 2 L 8 2"
              stroke={borderColor}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="square"
            />
            <path d="M 26 18 L 26 6 L 14 6" stroke={borderColor} strokeWidth="1.2" fill="none" />
          </svg>
          {/* Bottom Left Corner Bracket */}
          <svg
            style={{ position: 'absolute', bottom: 0, left: 0 }}
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              d="M 2 8 L 2 30 L 24 30"
              stroke={borderColor}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="square"
            />
            <path d="M 6 14 L 6 26 L 18 26" stroke={borderColor} strokeWidth="1.2" fill="none" />
          </svg>
          {/* Bottom Right Corner Bracket */}
          <svg
            style={{ position: 'absolute', bottom: 0, right: 0 }}
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              d="M 30 8 L 30 30 L 8 30"
              stroke={borderColor}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="square"
            />
            <path d="M 26 14 L 26 26 L 14 26" stroke={borderColor} strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      );

    case 'modern-geometric':
      return (
        <div className="doc-page-decorative-frame" style={containerStyle}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `${borderWidthPx}px solid ${borderColor}`,
              clipPath:
                'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
            }}
          />
        </div>
      );

    case 'floral-ornamental':
      return (
        <div className="doc-page-decorative-frame" style={containerStyle}>
          <div
            style={{
              position: 'absolute',
              inset: '10px',
              border: `1.2px solid ${borderColor}`,
              borderStyle: 'dashed',
            }}
          />
          {/* Four corner botanical florets */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
            const isTop = corner.includes('top');
            const isLeft = corner.includes('left');
            return (
              <svg
                key={corner}
                style={{
                  position: 'absolute',
                  top: isTop ? 0 : undefined,
                  bottom: !isTop ? 0 : undefined,
                  left: isLeft ? 0 : undefined,
                  right: !isLeft ? 0 : undefined,
                  transform: `${!isTop ? 'scaleY(-1)' : ''} ${!isLeft ? 'scaleX(-1)' : ''}`,
                }}
                width="34"
                height="34"
                viewBox="0 0 34 34"
              >
                <circle cx="10" cy="10" r="4" fill={borderColor} opacity="0.8" />
                <path d="M 18 10 C 18 16, 16 18, 10 18" stroke={borderColor} strokeWidth="1.8" fill="none" />
                <circle cx="20" cy="10" r="2" fill={borderColor} />
                <circle cx="10" cy="20" r="2" fill={borderColor} />
              </svg>
            );
          })}
        </div>
      );

    default:
      return (
        <div
          className="doc-page-decorative-frame"
          style={{
            ...containerStyle,
            border: `${borderWidthPx}px solid ${borderColor}`,
          }}
        />
      );
  }
};

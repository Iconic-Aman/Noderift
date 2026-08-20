import React from 'react';
import {interpolate} from 'remotion';
import {COLORS, NodeData} from './constants';
import {ICONS} from './icons';

export const clampProgress = (frame: number, start: number, end: number): number =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const CursorDot: React.FC<{
  frame: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moveStart: number;
  moveEnd: number;
  clickFrame: number;
  visibleFrom: number;
  visibleTo: number;
}> = ({frame, fromX, fromY, toX, toY, moveStart, moveEnd, clickFrame, visibleFrom, visibleTo}) => {
  if (frame < visibleFrom || frame > visibleTo) return null;
  const moveT = clampProgress(frame, moveStart, moveEnd);
  const x = interpolate(moveT, [0, 1], [fromX, toX]);
  const y = interpolate(moveT, [0, 1], [fromY, toY]);
  const clickT = clampProgress(frame, clickFrame - 6, clickFrame + 6);
  const clickScale = 1 - 0.35 * Math.sin(clickT * Math.PI);
  const opacity = interpolate(
    frame,
    [visibleFrom, visibleFrom + 8, visibleTo - 8, visibleTo],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 18,
        height: 18,
        borderRadius: 9,
        background: COLORS.accent,
        opacity,
        transform: `scale(${clickScale})`,
        boxShadow: `0 0 12px ${COLORS.accent}`,
      }}
    />
  );
};

export const NodeCard: React.FC<{
  frame: number;
  appearFrame: number;
  node: NodeData;
  runFrame?: number;
  doneFrame?: number;
}> = ({frame, appearFrame, node, runFrame, doneFrame}) => {
  if (frame < appearFrame) return null;

  const t = clampProgress(frame, appearFrame, appearFrame + 18);
  const scale = t < 1 ? interpolate(t, [0, 0.7, 1], [0.6, 1.08, 1]) : 1;
  const opacity = clampProgress(frame, appearFrame, appearFrame + 10);

  const isRunning = runFrame !== undefined && frame >= runFrame && (doneFrame === undefined || frame < doneFrame);
  const isDone = doneFrame !== undefined && frame >= doneFrame;

  const Icon = ICONS[node.icon];
  const spinAngle = (frame * 12) % 360;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x - 90,
        top: node.y - 70,
        width: 180,
        height: 135,
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${
          isRunning
            ? 'rgba(59, 130, 246, 0.8)'
            : isDone
            ? 'rgba(16, 185, 129, 0.8)'
            : 'rgba(71, 85, 105, 0.3)'
        }`,
        borderRadius: 16,
        opacity,
        transform: `scale(${scale})`,
        boxShadow: isRunning
          ? '0 0 25px rgba(59, 130, 246, 0.4)'
          : isDone
          ? '0 0 25px rgba(16, 185, 129, 0.3)'
          : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px ${node.color}20`,
        padding: '16px 12px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {/* Icon Box matching workflow-node.tsx */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${node.color}15`,
          boxShadow: `0 0 20px ${node.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon color={node.color} />
      </div>

      {/* Label text centered below icon */}
      <div
        style={{
          color: '#CBD5E1',
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: 150,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {node.title}
      </div>

      {/* Target handle dot (Left) */}
      <div
        style={{
          position: 'absolute',
          left: -6,
          top: '50%',
          width: 12,
          height: 12,
          borderRadius: 6,
          border: '2px solid #475569',
          background: '#1E293B',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Source handle dot (Right) */}
      <div
        style={{
          position: 'absolute',
          right: -6,
          top: '50%',
          width: 12,
          height: 12,
          borderRadius: 6,
          border: '2px solid #475569',
          background: '#1E293B',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Execution status badge */}
      {(isRunning || isDone) && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: -10,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: isDone ? '#059669' : '#2563EB',
            border: `1.5px solid ${isDone ? '#34D399' : '#60A5FA'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          }}
        >
          {isDone ? (
            <span style={{color: '#fff', fontSize: 13, fontWeight: 700}}>✓</span>
          ) : (
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                transform: `rotate(${spinAngle}deg)`,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export const Connector: React.FC<{
  frame: number;
  drawStart: number;
  drawEnd: number;
  fromNode: NodeData;
  toNode: NodeData;
}> = ({frame, drawStart, drawEnd, fromNode, toNode}) => {
  if (frame < drawStart) return null;
  const x1 = fromNode.x + 90;
  const y1 = fromNode.y;
  const x2 = toNode.x - 90;
  const y2 = toNode.y;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const t = clampProgress(frame, drawStart, drawEnd);
  const dashOffset = length * (1 - t);

  return (
    <svg
      style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={COLORS.border}
        strokeWidth={2}
        strokeDasharray={length}
        strokeDashoffset={dashOffset}
      />
      {t >= 1 && <circle cx={x2} cy={y2} r={5} fill={COLORS.textMuted} />}
    </svg>
  );
};

export const PulseDot: React.FC<{
  frame: number;
  nodes: NodeData[];
  arrivalFrames: number[];
}> = ({frame, nodes, arrivalFrames}) => {
  const first = arrivalFrames[0];
  const last = arrivalFrames[arrivalFrames.length - 1];
  if (frame < first || frame > last) return null;

  let segIndex = 0;
  for (let i = 0; i < arrivalFrames.length - 1; i++) {
    if (frame >= arrivalFrames[i] && frame <= arrivalFrames[i + 1]) {
      segIndex = i;
      break;
    }
  }
  const t = clampProgress(frame, arrivalFrames[segIndex], arrivalFrames[segIndex + 1]);
  const x = interpolate(t, [0, 1], [nodes[segIndex].x, nodes[segIndex + 1].x]);
  const y = nodes[segIndex].y;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 8,
        top: y - 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        background: '#fff',
        boxShadow: `0 0 20px 6px ${COLORS.running}`,
      }}
    />
  );
};

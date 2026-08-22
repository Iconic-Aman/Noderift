export const COLORS = {
  bg: '#0A0E1A',
  panel: '#141826',
  border: '#2A3040',
  accent: '#6C5CE7',
  running: '#3B82F6',
  success: '#22C55E',
  text: '#E4E6EB',
  textMuted: '#8B92A5',
};

// Swap this for whatever workflow best shows off what Noderift actually does
export const PROMPT_TEXT =
  'Every day at 8:00 AM, get all mail from xyz@gmail.com and save it into an excel sheet.';

export const THINKING_STEPS = [
  'Understanding workflow request…',
  'Configuring Gmail & schedule triggers',
  'Building Excel data logic',
  'Connecting workflow nodes…',
];

export type IconKey = 'clock' | 'mail' | 'code';

export interface NodeData {
  title: string;
  subtitle: string;
  icon: IconKey;
  color: string;
  x: number;
  y: number;
}

// Real 3-node flow: schedule → fetch Gmail → save to Excel via a code node
export const NODES: NodeData[] = [
  {title: 'Schedule Trigger', subtitle: 'Every day at 8:00 AM', icon: 'clock', color: '#F59E0B', x: 400, y: 540},
  {title: 'Gmail Trigger', subtitle: 'Get mail from xyz@gmail.com', icon: 'mail', color: '#EF4444', x: 960, y: 540},
  {title: 'Code Node', subtitle: 'Save to Excel (Python)', icon: 'code', color: '#3B82F6', x: 1520, y: 540},
];

export const NODE_WIDTH = 320;
export const NODE_HEIGHT = 150;

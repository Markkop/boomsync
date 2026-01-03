import React from 'react';
import { 
  Timer, 
  Users, 
  Volume2, 
  VolumeX, 
  Music, 
  RefreshCcw, 
  Plus, 
  Trash2, 
  Shuffle, 
  Edit2, 
  Share2,
  X,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Smartphone,
  Settings,
  Check,
  LogOut,
  Github,
  Proportions,
  Circle,
  CheckCircle2,
  Bomb
} from 'lucide-react';

const icons = {
  timer: Timer,
  users: Users,
  volumeOn: Volume2,
  volumeOff: VolumeX,
  music: Music,
  sync: RefreshCcw,
  plus: Plus,
  trash: Trash2,
  shuffle: Shuffle,
  edit: Edit2,
  share: Share2,
  close: X,
  right: ChevronRight,
  play: Play,
  pause: Pause,
  expand: Maximize2,
  shrink: Minimize2,
  phone: Smartphone,
  settings: Settings,
  check: Check,
  logout: LogOut,
  github: Github,
  proportions: Proportions,
  circle: Circle,
  circleCheck: CheckCircle2,
  bomb: Bomb
};

interface IconProps {
  name: keyof typeof icons;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 24 }) => {
  const LucideIcon = icons[name];
  return <LucideIcon className={className} size={size} />;
};
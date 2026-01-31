// FIX: Add the AlertCircle icon for displaying errors.
import React from "react";
import {
  Home,
  Settings,
  Package,
  Server,
  RefreshCw,
  HardDrive,
  Palette,
  User,
  Search,
  Moon,
  Sun,
  Globe,
  LayoutDashboard,
  FileCode,
  Mail,
  Image,
  Film,
  Music,
  MessageSquare,
  Disc,
  Monitor,
  MousePointer,
  TerminalSquare,
  Code,
  GitBranch,
  Briefcase,
  Cpu,
  Activity,
  AlertCircle,
  Bluetooth,
  Printer,
  List,
  Thermometer,
  Users,
  Network,
} from "lucide-react";

interface AppIconProps {
  name: string;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ name, className }) => {
  const icons: { [key: string]: React.ReactNode } = {
    // General
    home: <Home className={className} />,
    dashboard: <LayoutDashboard className={className} />,
    system: <Cpu className={className} />,
    kernel: <GitBranch className={className} />,
    network: <Network className={className} />,
    mirrors: <Globe className={className} />,
    updates: <RefreshCw className={className} />,
    storage: <HardDrive className={className} />,
    personalization: <Palette className={className} />,
    user: <User className={className} />,
    users: <Users className={className} />,
    search: <Search className={className} />,
    moon: <Moon className={className} />,
    sun: <Sun className={className} />,
    host: <Server className={className} />,
    monitor: <Activity className={className} />,
    processes: <List className={className} />,
    sensors: <Thermometer className={className} />,
    error: <AlertCircle className={className} />,
    devices: <Settings className={className} />, // Generic for now
    locale: <Globe className={className} />,
    bluetooth: <Bluetooth className={className} />,
    printer: <Printer className={className} />,
    hardware: <Cpu className={className} />,
    default: <Package className={className} />,

    // Hardware/Driver Icons (using generic fallbacks as brand icons are not in lucide)
    intel: <Cpu className={className} />,
    nvidia: <Cpu className={className} />,
    amd: <Cpu className={className} />,
    "video-linux": <TerminalSquare className={className} />,

    // Categories
    browser: <Globe className={className} />,
    "mail-client": <Mail className={className} />,
    "applications-office": <Briefcase className={className} />,
    "text-editor": <FileCode className={className} />,
    "applications-accessories": <Settings className={className} />,
    "applications-graphics": <Image className={className} />,
    "video-player": <Film className={className} />,
    musicbrainz: <Music className={className} />,
    "internet-chat": <MessageSquare className={className} />,
    "disk-utility": <Disc className={className} />,

    // Apps (using generic fallbacks for now)
    vivaldi: <Globe className={className} />,
    chromium: <Globe className={className} />,
    "org.gnome.Epiphany": <Globe className={className} />,
    firefox: <Globe className={className} />,
    "claws-mail": <Mail className={className} />,
    evolution: <Mail className={className} />,
    geary: <Mail className={className} />,
    kmail: <Mail className={className} />,
    thunderbird: <Mail className={className} />,
    freeoffice: <Briefcase className={className} />,
    "ms-word": <Briefcase className={className} />,
    "libreoffice-main": <Briefcase className={className} />,
    gedit: <FileCode className={className} />,
    "visual-studio-code": <Code className={className} />,
    xed: <FileCode className={className} />,
    blender: <Monitor className={className} />,
    gimp: <Image className={className} />,
    inkscape: <MousePointer className={className} />,
    krita: <Palette className={className} />,
    shotwell: <Image className={className} />,
    eog: <Image className={className} />,
    kodi: <Film className={className} />,
    vlc: <Film className={className} />,
    spotify: <Music className={className} />,
    audacious: <Music className={className} />,
    lollypop: <Music className={className} />,
    hexchat: <MessageSquare className={className} />,
    "telegram-desktop": <MessageSquare className={className} />,
    "signal-desktop": <MessageSquare className={className} />,
    gparted: <Disc className={className} />,
  };

  return <>{icons[name] || <Package className={className} />}</>;
};

export default AppIcon;

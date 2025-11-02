// FIX: Removed self-import that was causing multiple declaration conflicts.

// FIX: Update the PackageStatus enum to include an `Error` state,
// and add an optional `error` message field to the `PackageState` interface
// to store detailed error information.
export type Page = 'landing' | 'home' | 'packages' | 'configuration' | 'about';

export type ConfigPanel = 'home'|'system' | 'kernel' | 'updates' | 'storage' | 'personalization' | 'monitor' | 'devices' | 'locale' | 'hardware' | 'processes' | 'sensors' | 'network' | 'users';

export interface App {
  name: string;
  icon: string;
  description: string;
  pkg: string;
  extra: string[];
  filter?: string[];
  desktop?: string[];
}

export interface Category {
  name: string;
  icon: string;
  description: string;
  apps: App[];
  filter?: string[];
}

export enum PackageStatus {
  NotInstalled,
  Installing,
  Installed,
  UpdateAvailable,
  Error,
}

export interface PackageState {
  status: PackageStatus;
  progress?: number;
  error?: string;
  progressDetail?: string;
}

export type AllPackagesState = Record<string, PackageState>;

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface Kernel {
    version: string;
    releaseType: 'stable' | 'lts' | 'recommended';
    running?: boolean;
    pkg: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface BluetoothDevice {
    address: string;
    name?: string;
    paired: boolean;
    connected: boolean;
    rssi?: number | null;
}

export type BluetoothDeviceEvent =
    | { type: 'discovered'; device: BluetoothDevice }
    | { type: 'removed'; address: string };

export interface PrinterDevice {
    name: string;
    deviceUri: string;
    description: string;
    location: string;
    isDefault: boolean;
    state: string;
    acceptingJobs: boolean;
}

export interface CommandResult {
  success: boolean;
  message: string;
}

export interface SystemLocale {
  id: string; // e.g., 'en_US.UTF-8'
  name: string; // e.g., 'English (United States)'
}

// --- Hardware Info Types ---

export interface Gpu {
    vendor: string;
    model: string;
    driver_type: 'open_source' | 'proprietary';
    driver_module: string;
    in_use: boolean;
}

export interface HybridInfo {
    primary: string;
    secondary: string;
    switch_method: string;
    recommended_variant: string;
}

export interface DriverVariant {
    name: string;
    packages: string[];
    instructions?: string;
    wiki_url?: string;
}

export interface DriverPackage {
    type: 'proprietary' | 'open_source';
    packages: string[];
    instructions: string;
    wiki_url: string;
    variants: DriverVariant[];
}

export interface NetworkCard {
    vendor: string;
    model: string;
    device: string;
}

export interface OtherCard {
    raw: string;
}

export interface HardwareInfo {
    gpus: Gpu[];
    network_cards: NetworkCard[];
    other_cards: OtherCard[];
    hybrid: HybridInfo | null;
    driver_packages: Record<string, DriverPackage>;
}

// --- Live System Info Types ---

export interface OsInfo {
    name: string;
    kernel_version: string;
    os_version: string;
    host_name: string;
}

export interface CpuInfo {
    brand: string;
    physical_cores: number;
    global_usage_percent: number;
}

export interface MemoryInfo {
    total_kb: number;
    used_kb: number;
    total_swap_kb: number;
    used_swap_kb: number;
}

export interface DiskInfo {
    name: string;
    mount_point: string;
    total_gb: number;
    available_gb: number;
}

export interface LoadAverage {
    one_min: number;
    five_min: number;
    fifteen_min: number;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    status: string;
    cpu_usage_percent: number;
}

export interface SensorInfo {
    label: string;
    temperature_c: number;
    max_c: number;
    critical_c: number | null;
}

export interface NetworkInfo {
    interface_name: string;
    mac_address: string;
    total_received_bytes: number;
    total_transmitted_bytes: number;
}

export interface UserInfo {
    name: string;
    groups: string[];
}

export interface SystemInfo {
    os_info: OsInfo;
    cpu: CpuInfo;
    memory: MemoryInfo;
    disks: DiskInfo[];
    uptime_s: number;
    boot_time_s: number;
    load_average: LoadAverage;
    processes: ProcessInfo[];
    components: SensorInfo[]; // 'components' is used for sensors in sysinfo crate
    networks: NetworkInfo[];
    users: UserInfo[];
}
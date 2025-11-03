// model.rs
use serde::{Serialize, Deserialize};
use bluer::Address;
use bluer::Device;

// --- Core System Data Model ---

#[derive(Serialize, Clone, Debug)]
pub struct SystemData {
    pub os_info: OsInfo,
    pub boot_time_s: u64,
    pub uptime_s: u64,
    pub load_average: LoadAverage,
    pub memory: MemoryInfo,
    pub cpu: CpuSnapshot,
    pub disks: Vec<DiskInfo>,
    pub networks: Vec<NetworkData>,
    pub processes: Vec<ProcessSnapshot>,
    pub components: Vec<ComponentSnapshot>,
    pub users: Vec<UserInfo>,
}

#[derive(Serialize, Clone, Debug)]
pub struct OsInfo {
    pub name: String,
    pub kernel_version: String,
    pub os_version: String,
    pub long_os_version: String,
    pub host_name: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct LoadAverage {
    pub one_min: f64,
    pub five_min: f64,
    pub fifteen_min: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct MemoryInfo {
    pub total_kb: u64,
    pub available_kb: u64,
    pub used_kb: u64,
    pub total_swap_kb: u64,
    pub used_swap_kb: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct CpuSnapshot {
    pub physical_cores: Option<usize>,
    pub global_usage_percent: f32,
    pub brand: String,
    pub vendor_id: String,
    pub individual_cpus: Vec<CpuDetails>,
}

#[derive(Serialize, Clone, Debug)]
pub struct CpuDetails {
    pub name: String,
    pub usage_percent: f32,
    pub frequency_mhz: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_gb: f64,
    pub available_gb: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct NetworkData {
    pub interface_name: String,
    pub mac_address: String,
    pub received_bytes: u64,
    pub total_received_bytes: u64,
    pub transmitted_bytes: u64,
    pub total_transmitted_bytes: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProcessSnapshot {
    pub pid: u32,
    pub name: String,
    pub status: String,
    pub cpu_usage_percent: f32,
}

#[derive(Serialize, Clone, Debug)]
pub struct ComponentSnapshot {
    pub label: String,
    pub temperature_c: f32,
    pub max_c: f32,
    pub critical_c: Option<f32>,
}

#[derive(Serialize, Clone, Debug)]
pub struct UserInfo {
    pub name: String,
    pub groups: Vec<String>,
}

// --- Kernel Info Structures (from lib.rs) ---

#[derive(Debug, Serialize)]
pub struct KernelInfo {
    pub running_kernel: String,
    pub installed_kernels: Vec<InstalledKernel>,
    pub installable_kernels: Vec<InstallableKernel>,
}

#[derive(Debug, Serialize)]
pub struct InstalledKernel {
    pub name: String,
    pub version: String,
    pub flavor: String,
}

#[derive(Debug, Serialize)]
pub struct InstallableKernel {
    pub package_name: String,
    pub version: String,
    pub description: String,
    pub flavor: String,
}
/// Event name for continuous device updates sent to the frontend.
pub const BLUETOOTH_DEVICE_EVENT: &str = "bluetooth-device-update";

/// An enum representing the type of change to a device list.
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum DeviceUpdate {
    /// A new device has been discovered or an existing one was updated.
    Discovered { device: BluetoothDevice },
    /// A device has been removed (e.g., went out of range).
    Removed { address: String },
}

/// Simplified model for a Bluetooth device.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BluetoothDevice {
    pub name: Option<String>,
    pub address: String,
    pub rssi: Option<i16>,
    pub is_connected: bool,
    pub is_paired: bool,
    pub vendor_data: Option<String>,
}

impl BluetoothDevice {
    /// Async factory method to convert bluer::Device to BluetoothDevice
    pub async fn from_bluer_device(device: &Device) -> Self {
        BluetoothDevice {
            // These properties are async and return a Result, so we await and unwrap/default
            name: device.name().await.ok().flatten(),
            address: device.address().to_string(),
            rssi: device.rssi().await.ok().flatten(),
            is_connected: device.is_connected().await.unwrap_or(false),
            is_paired: device.is_paired().await.unwrap_or(false),
            vendor_data: None, // Simplified
        }
    }
}

/// Command results to send back to the frontend.
#[derive(Serialize)]
pub struct CommandResult {
    pub success: bool,
    pub message: String,
}

impl CommandResult {
    pub fn ok(message: impl Into<String>) -> Self {
        CommandResult { success: true, message: message.into() }
    }
    pub fn error(message: impl Into<String>) -> Self {
        CommandResult { success: false, message: message.into() }
    }
}

// Convert bluer::Error to a serializable type for Tauri command error
impl From<bluer::Error> for CommandResult {
    fn from(err: bluer::Error) -> Self {
        CommandResult::error(format!("Bluetooth Error: {}", err))
    }
}

// Convert a general error to a serializable type for Tauri command error
impl From<anyhow::Error> for CommandResult {
    fn from(err: anyhow::Error) -> Self {
        CommandResult::error(format!("General Error: {}", err))
    }
}

/// Utility to convert a string address to bluer::Address
pub fn parse_address(address: &str) -> anyhow::Result<Address> {
    address.parse::<Address>().map_err(|e| anyhow::anyhow!("Invalid Bluetooth Address: {}", e))
}

pub const PRINTER_EVENT: &str = "printer-event";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Printer {
    pub name: String,
    pub device_uri: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub is_default: bool,
    pub state: PrinterState,
    pub accepting_jobs: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum PrinterState {
    Idle,
    Printing,
    Stopped,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum PrinterEvent {
    List(Vec<Printer>),
    Added(String),
    Removed(String),
    Error(String),
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct LocaleInfo {
    pub lang: String,
    pub lc_collate: String,
    pub lc_ctype: String,
    pub lc_messages: String,
    pub lc_monetary: String,
    pub lc_numeric: String,
    pub lc_time: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocaleStatus {
    pub current: LocaleInfo,
    pub available_locales: Vec<String>,
    pub generated_locales: Vec<String>,
    pub reboot_required: bool,
}
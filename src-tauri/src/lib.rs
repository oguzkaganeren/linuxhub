use std::process::Command;
use tauri::{Manager};
use std::fs;
use std::path::PathBuf;
use base64::{engine::general_purpose, Engine as _};
use std::process::Command as StdCommand;
use serde::{Serialize};
use sysinfo::{System}; // Only System is needed here after refactoring

mod pacman_manager;
mod hardware;
mod model; // NEW: Import the model module
mod system; // NEW: Import the system module

use hardware::get_hardware_info;
use model::*; // Import all structs from model.rs
use system::start_system_monitor; // Import the new command

mod bluetooth;
mod printers;
mod locale;
mod reboot;
use locale::{generate_locale, get_locale_status, set_system_locale};


#[tauri::command]
async fn hardware_info() -> Result<String, String> {
    let info = get_hardware_info()?;
    serde_json::to_string(&info).map_err(|e| e.to_string())
}
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn run_shell_command_with_result(command: String) -> String {
    let output = Command::new("sh").arg("-c").arg(command).output().unwrap();
    return format!("{:?}", String::from_utf8_lossy(&output.stdout));
}

#[tauri::command]
fn get_system_user_info() -> String {
    let username = whoami::username().unwrap_or_else(|_| "user".to_string());
    let realname = whoami::realname().unwrap_or_else(|_| "User".to_string());

    // Combine into a simple JSON string or a structured object for the frontend
    format!("{{\"username\": \"{}\", \"realname\": \"{}\"}}", username, realname)
}

#[tauri::command]
fn get_distro() -> String {
    System::name().unwrap_or_else(|| "Linux".to_string())
}



#[derive(Serialize)]
pub struct UserInfo {
    name: String,
    groups: Vec<String>,
}



// --- The Core Tauri Command Function ---

#[tauri::command]
async fn get_system_kernels() -> Result<String, String> {
    let running_kernel = get_running_kernel_version();
    let installed_kernels = get_installed_kernels().map_err(|e| format!("Failed to get installed kernels: {}", e))?;
    let installable_kernels = get_installable_kernels_from_repos().await.map_err(|e| format!("Failed to get installable kernels: {}", e))?;

    let result = KernelInfo {
        running_kernel,
        installed_kernels,
        installable_kernels,
    };

    // Serialize the final struct to a JSON string
    serde_json::to_string_pretty(&result)
        .map_err(|e| format!("Failed to serialize kernel info to JSON: {}", e))
}

fn get_running_kernel_version() -> String {
    let mut sys = System::new();
    // This call is now redundant if kernel_version() is an associated function
    sys.refresh_all(); 

    
    sysinfo::System::kernel_version()
        .unwrap_or_else(|| "<unknown>".to_owned())
}
async fn run_command(cmd: &str, args: &[&str]) -> Result<String, String> {
    let output = tokio::process::Command::new(cmd)
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Failed to execute command '{}': {}", cmd, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(format!(
            "Command failed: {} {}", 
            cmd, 
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

fn get_installed_kernels() -> Result<Vec<InstalledKernel>, std::io::Error> {
    // NOTE: For a real-world Tauri app, you might want to use 
    // `tokio::process::Command` here as well, but for simplicity
    // and correctness, we'll shell out to 'pacman' later on.
    
    // Simplified logic: Read files in /lib/modules/
    let mut installed_kernels = Vec::new();
    let modules_path = "/lib/modules";

    for entry in std::fs::read_dir(modules_path)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(dir_name) = path.file_name().and_then(|s| s.to_str()) {
                // A very simplified attempt to determine flavor based on common suffixes
                let flavor = if dir_name.contains("lts") {
                    "lts".to_string()
                } else if dir_name.contains("rt") {
                    "rt".to_string()
                } else if dir_name.contains("zen") {
                    "zen".to_string()
                } else {
                    "default".to_string() // Fallback for the main or other kernels
                };

                installed_kernels.push(InstalledKernel {
                    name: format!("linux-{}", flavor), // Guess a package name
                    version: dir_name.to_string(),
                    flavor,
                });
            }
        }
    }

    Ok(installed_kernels)
}
// Revised function to make parsing more defensive
async fn get_installable_kernels_from_repos() -> Result<Vec<InstallableKernel>, String> {
    // Search for all packages starting with 'linux-' (kernels, headers, etc.)
    // We use the regex anchor '^' to only get packages that start with the prefix.
    let output = run_command("pacman", &["-Ss", "^linux-"]).await?;

    let mut installable_list = Vec::new();
    let mut current_pkg_name: Option<String> = None;

    for line in output.lines() {
        // Line 1: 'repo/package-name version'
        // Example: 'core/linux 6.6.1-arch1-1'
        if line.starts_with("core/") || line.starts_with("extra/") || line.starts_with("community/") {
            // New package entry starts
            
            // 1. Extract package name and version
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 2 { continue; } // Skip malformed lines

            // parts[0] is typically 'repo/package-name'
            let full_name = parts[0];
            let pkg_name = full_name.split('/').nth(1).unwrap_or("unknown-pkg").to_string();
            let pkg_version = parts[1].to_string();

            // Skip packages that are clearly headers or docs, we only want the kernel image package
            if pkg_name.ends_with("-headers") || pkg_name.ends_with("-docs") {
                current_pkg_name = None;
                continue;
            }

            // 2. Determine flavor
            let flavor = if pkg_name.contains("lts") {
                "lts"
            } else if pkg_name.contains("rt") {
                "rt"
            } else if pkg_name.contains("zen") {
                "zen"
            } else if pkg_name == "linux" {
                "main" // Standard mainline kernel
            } else {
                "other"
            };

            // 3. Create a new entry and store the name to look for the description next
            current_pkg_name = Some(pkg_name.clone());
            installable_list.push(InstallableKernel {
                package_name: pkg_name,
                version: pkg_version,
                description: String::new(), // Will be filled in the next step
                flavor: flavor.to_string(),
            });

        // Line 2: '    Description: ...'
        } else if line.trim().starts_with("Description:") {
            if let Some(name) = current_pkg_name.take() {
                // Find the last entry we just created
                if let Some(entry) = installable_list.iter_mut().rev().find(|e| e.package_name == name) {
                    let desc = line.split(':').nth(1).unwrap_or("").trim().to_string();
                    entry.description = desc;
                }
            }
        }
    }

    Ok(installable_list)
}
#[tauri::command]
fn get_user_profile_photo_base64() -> Result<String, String> {
    // 1. Get the user's home directory
    let mut face_path: PathBuf = home::home_dir().ok_or("Could not find home directory")?;

    // 2. Append the standard Linux profile picture filename
    face_path.push(".face");

    // 3. Check if the file exists
    if !face_path.exists() {
        // If .face doesn't exist, you might check other common locations here (see Method 2)
        return Err("User profile photo (.face) not found.".into());
    }

    // 4. Read the file contents
    let image_bytes = fs::read(&face_path)
        .map_err(|e| format!("Failed to read .face file: {}", e))?;

    // 5. Determine the MIME type (assuming JPEG or PNG, you may need better file-type detection)
    let mime_type = if face_path.extension().map_or(false, |ext| ext == "png") {
        "image/png"
    } else {
        // Default to JPEG, but real-world usage may require a better check
        "image/jpeg"
    };

    // 6. Encode the bytes to Base64
    let base64_image = general_purpose::STANDARD.encode(image_bytes);

    // 7. Return as a Data URL for the frontend
    Ok(format!("data:{};base64,{}", mime_type, base64_image))
}

/// Executes a given command string using pkexec to gain root privileges.
///
/// This function triggers the native PolicyKit graphical password prompt.
///
/// @param command_to_run: The command string to execute (e.g., "apt update").
/// @returns A Result containing the combined stdout/stderr output on success, 
///          or a detailed error message on failure (including user cancellation).
#[tauri::command]
fn run_elevated_command(command_to_run: String) -> Result<String, String> {
    
    // --- Security Note ---
    // It is safer to pass arguments separately rather than using "sh -c",
    // but for simple commands, this structure is functional for pkexec.
    
    // 1. Prepare the full pkexec command
    let mut command = StdCommand::new("/usr/bin/pkexec");
    
    // This structure passes the command string to a shell for execution with elevated rights.
    command.arg("sh").arg("-c").arg(&command_to_run);

    // 2. Execute and capture output
    match command.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let combined_output = format!("{}\n{}", stdout, stderr);
            
            if output.status.success() {
                // Command successfully ran with elevation (exit code 0)
                Ok(combined_output)
            } else {
                // Command failed, possibly due to user cancellation or incorrect command
                let exit_code = output.status.code().unwrap_or(-1);
                
                // Common check for pkexec/PolicyKit failures (like user cancelling or auth failure)
                if stderr.contains("not authorized") || exit_code == 127 || stderr.contains("authentication failed") {
                    Err(format!("Root permission denied or cancelled by user. (Exit Code: {})", exit_code))
                } else {
                    Err(format!("Elevated command failed (Exit Code: {}). Output: {}", exit_code, combined_output))
                }
            }
        }
        Err(e) => {
            // Failed to even spawn the process (e.g., pkexec not found)
            Err(format!("Failed to spawn pkexec process: {}", e))
        }
    }
}




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
unsafe { // Not unsafe if you don't use edition 2024
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
}
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            let handle = app.handle().clone();
            // Optional: emit current list on startup
            tauri::async_runtime::spawn(async move {
                let _ = printers::get_printers(handle).await;
            });
            Ok(())
        })
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_shell_command_with_result,
            get_system_user_info,
            get_user_profile_photo_base64,
            run_elevated_command,
            get_locale_status,
            set_system_locale,
            generate_locale,
printers::get_printers, 
            printers::add_printer_cmd, 
            printers::remove_printer_cmd,
           start_system_monitor,
            hardware_info,
            pacman_manager::manage_pacman_package,
            pacman_manager::check_package_status,
            pacman_manager::check_system_updates,
             pacman_manager::check_packages_status,

       bluetooth::start_discovery,
            bluetooth::connect_device,
            bluetooth::disconnect_device,
            bluetooth::pair_device,
            bluetooth::remove_device,
            bluetooth::list_paired_devices,
            get_system_kernels,
            get_distro])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// src/printers.rs
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};
use serde_json::json;
use crate::model::{Printer, PrinterEvent, PrinterState, PRINTER_EVENT};

fn run_command(cmd: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(cmd)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", cmd, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

fn parse_printer_state(state_str: &str) -> PrinterState {
    match state_str {
        "idle" => PrinterState::Idle,
        "printing" => PrinterState::Printing,
        _ => PrinterState::Stopped,
    }
}

fn emit_event(app: &AppHandle, event: PrinterEvent) -> Result<(), String> {
    let payload = json!(event).to_string();
    app.emit(PRINTER_EVENT, payload)
        .map_err(|e| format!("Emit failed: {}", e))
}

fn list_printers_inner(app: AppHandle) -> Result<(), String> {
    let output = run_command("lpstat", &["-p", "-e"])?;

    // ⚡ Bolt: Query default printer once before the loop (O(1)) instead of for every printer (O(N)).
    // Eliminates N external `lpstat -d` process spawns, drastically speeding up enumeration on systems with many printers.
    let default_printer_name = run_command("lpstat", &["-d"])
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.contains("system default destination:"))
                .and_then(|l| l.split(':').nth(1))
                .map(|s| s.trim().to_string())
        });

    let mut printers = Vec::new();

    for line in output.lines() {
        if !line.starts_with("printer ") { continue; }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 4 { continue; }

        let name = parts[1].to_string();
        let state_str = parts[3..].join(" ");
        let state = if state_str.contains("disabled") {
            PrinterState::Stopped
        } else {
            parse_printer_state(&state_str)
        };
        let accepting = !state_str.contains("not accepting");

        // === FIXED: Device URI ===
        let device_uri = match run_command("lpstat", &["-v", &name]) {
            Ok(output) => {
                let mut uri = "unknown".to_string();
                for line in output.lines() {
                    if line.contains("device for") {
                        if let Some(part) = line.split("device for").nth(1) {
                            uri = part.trim_matches(':').trim().to_string();
                            break;
                        }
                    }
                }
                uri
            }
            Err(_) => "unknown".to_string(),
        };

        // === FIXED: Description & Location ===
        let (description, location) = match run_command("lpoptions", &["-p", &name]) {
            Ok(info) => {
                let mut desc = None;
                let mut loc = None;
                for line in info.lines() {
                    if line.contains("printer-info=") {
                        if let Some(part) = line.split("printer-info=").nth(1) {
                            desc = Some(part.to_string());
                        }
                    }
                    if line.contains("printer-location=") {
                        if let Some(part) = line.split("printer-location=").nth(1) {
                            loc = Some(part.to_string());
                        }
                    }
                }
                (desc, loc)
            }
            Err(_) => (None, None),
        };

        // === Default printer ===
        let is_default = default_printer_name.as_deref() == Some(&name);

        printers.push(Printer {
            name: name.clone(),
            device_uri,
            description,
            location,
            is_default,
            state,
            accepting_jobs: accepting,
        });
    }

    emit_event(&app, PrinterEvent::List(printers))
}

#[tauri::command]
pub async fn get_printers(app: AppHandle) -> Result<(), String> {
    list_printers_inner(app)
}

#[tauri::command]
pub async fn add_printer_cmd(
    app: AppHandle,
    name: String,
    device_uri: String,
    ppd: Option<String>,
    description: Option<String>,
    location: Option<String>,
) -> Result<(), String> {
    let mut args = vec!["-p", &name, "-E", "-v", &device_uri];

    if let Some(p) = ppd.as_ref() {
        args.push("-P"); args.push(p);
    }
    if let Some(d) = description.as_ref() {
        args.push("-D"); args.push(d);
    }
    if let Some(l) = location.as_ref() {
        args.push("-L"); args.push(l);
    }

    run_command("lpadmin", &args)?;
    run_command("cupsaccept", &[&name])?;
    run_command("cupsenable", &[&name])?;

    emit_event(&app, PrinterEvent::Added(name))
}

#[tauri::command]
pub async fn remove_printer_cmd(app: AppHandle, name: String) -> Result<(), String> {
    run_command("lpadmin", &["-x", &name])?;
    emit_event(&app, PrinterEvent::Removed(name))
}
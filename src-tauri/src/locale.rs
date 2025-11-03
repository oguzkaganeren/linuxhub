// src/locale.rs
use crate::model::{LocaleInfo, LocaleStatus};
use crate::reboot::is_reboot_required;
use serde_json::{json, Value};
use std::fs;
use std::process::{Command, Output};
use tauri::{AppHandle, Emitter};

const EVENT_NAME: &str = "system-locale-info";

fn run_cmd(cmd: &str, args: &[&str]) -> Result<String, String> {
    let output: Output = Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", cmd, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_owned())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_owned())
    }
}

// ---------- read /etc/locale.conf ----------
fn parse_locale_conf() -> Result<LocaleInfo, String> {
    let raw = fs::read_to_string("/etc/locale.conf")
        .map_err(|e| format!("read /etc/locale.conf: {}", e))?;

    let mut info = LocaleInfo::default();

    for line in raw.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((k, v)) = line.split_once('=') {
            let v = v.trim_matches('"').trim().to_string();
            match k {
                "LANG" => info.lang = v,
                "LC_COLLATE" => info.lc_collate = v,
                "LC_CTYPE" => info.lc_ctype = v,
                "LC_MESSAGES" => info.lc_messages = v,
                "LC_MONETARY" => info.lc_monetary = v,
                "LC_NUMERIC" => info.lc_numeric = v,
                "LC_TIME" => info.lc_time = v,
                _ => {}
            }
        }
    }
    Ok(info)
}

// ---------- available locales ----------
fn available_locales() -> Result<Vec<String>, String> {
    let raw = fs::read_to_string("/etc/locale.gen")
        .map_err(|e| format!("read /etc/locale.gen: {}", e))?;

    let mut list = Vec::new();
    for line in raw.lines() {
        let line = line.trim_start();
        if line.starts_with('#') || !line.contains("UTF-8") {
            continue;
        }
        if let Some(loc) = line.split_whitespace().next() {
            list.push(loc.to_string());
        }
    }
    Ok(list)
}

// ---------- generated locales ----------
fn generated_locales() -> Result<Vec<String>, String> {
    run_cmd("locale", &["-a"]).map(|out| {
        out.lines()
            .map(|s| s.trim().to_string())
            .filter(|s| s.ends_with(".utf8") || s.ends_with(".UTF-8"))
            .map(|s| s.replace(".utf8", ".UTF-8"))
            .collect()
    })
}

// ---------- emit helper ----------
fn emit_status(app: AppHandle, status: LocaleStatus) {
    let payload = json!({
        "success": true,
        "data": status
    });
    let _ = app.emit(EVENT_NAME, payload);
}

// ---------- public commands ----------
#[tauri::command]
pub async fn get_locale_status(app_handle: AppHandle) -> Result<Value, String> {
    let current = parse_locale_conf()?;
    let available = available_locales()?;
    let generated = generated_locales()?;
    let reboot = is_reboot_required();

    let status = LocaleStatus {
        current,
        available_locales: available,
        generated_locales: generated,
        reboot_required: reboot,
    };

    emit_status(app_handle.clone(), status.clone());

    Ok(json!(status))
}

#[tauri::command]
pub async fn set_system_locale(
    app_handle: AppHandle,
    lang: Option<String>,
    lc_collate: Option<String>,
    lc_ctype: Option<String>,
    lc_messages: Option<String>,
    lc_monetary: Option<String>,
    lc_numeric: Option<String>,
    lc_time: Option<String>,
) -> Result<Value, String> {
    let mut args: Vec<String> = vec!["set-locale".into()];

    if let Some(v) = lang.filter(|s| !s.is_empty()) {
        args.push(format!("LANG={}", v));
    }
    macro_rules! push_opt {
        ($opt:expr, $name:expr) => {
            if let Some(v) = $opt.filter(|s| !s.is_empty()) {
                args.push(format!("{}={}", $name, v));
            }
        };
    }
    push_opt!(lc_collate, "LC_COLLATE");
    push_opt!(lc_ctype, "LC_CTYPE");
    push_opt!(lc_messages, "LC_MESSAGES");
    push_opt!(lc_monetary, "LC_MONETARY");
    push_opt!(lc_numeric, "LC_NUMERIC");
    push_opt!(lc_time, "LC_TIME");

    if args.len() == 1 {
        return Err("No locale values supplied".into());
    }

    // pkexec → password-less thanks to polkit rule (see below)
    let output = Command::new("pkexec")
        .args(["localectl"])
        .args(&args)
        .output()
        .map_err(|e| format!("pkexec localectl failed: {}", e))?;

    let success = output.status.success();
    let message = if success {
        "Locale applied. A reboot may be required.".into()
    } else {
        format!("localectl error: {}", String::from_utf8_lossy(&output.stderr))
    };

    let payload = json!({
        "success": success,
        "message": message
    });
    let _ = app_handle.emit(EVENT_NAME, payload.clone());

    // Refresh status (includes reboot flag)
    let _ = get_locale_status(app_handle).await;

    Ok(payload)
}

#[tauri::command]
pub async fn generate_locale(app_handle: AppHandle, locale: String) -> Result<Value, String> {
    // 1. enable in /etc/locale.gen
    let path = "/etc/locale.gen";
    let content = fs::read_to_string(path)
        .map_err(|e| format!("read locale.gen: {}", e))?;
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

    let target = format!("{} UTF-8", locale.replace(".UTF-8", ""));
    let mut modified = false;

    for line in &mut lines {
        let trimmed = line.trim_start();
        if trimmed.starts_with(&format!("#{}", target)) {
            *line = target.clone();
            modified = true;
            break;
        }
        if trimmed == target {
            modified = false;
            break;
        }
    }
    if modified {
        fs::write(path, lines.join("\n") + "\n")
            .map_err(|e| format!("write locale.gen: {}", e))?;
    }

    // 2. run locale-gen via pkexec
    let output = Command::new("pkexec")
        .args(["locale-gen"])
        .output()
        .map_err(|e| format!("pkexec locale-gen: {}", e))?;

    let success = output.status.success();
    let message = if success {
        format!("Locale {} generated.", locale)
    } else {
        format!("locale-gen failed: {}", String::from_utf8_lossy(&output.stderr))
    };

    let payload = json!({
        "success": success,
        "message": message
    });
    let _ = app_handle.emit(EVENT_NAME, payload.clone());

    // Refresh
    let _ = get_locale_status(app_handle).await;

    Ok(payload)
}
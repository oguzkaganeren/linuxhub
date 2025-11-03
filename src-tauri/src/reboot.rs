use std::path::Path;

/// Arch (systemd) marks a reboot as needed by creating `/var/run/reboot-required`
pub fn is_reboot_required() -> bool {
    Path::new("/var/run/reboot-required").exists()
}


## 2024-05-24 - [Command Injection via sh -c in Tauri Commands]
**Vulnerability:** The Tauri backend exposes `run_shell_command_with_result` and `run_elevated_command` commands that take raw strings and pass them directly to `sh -c`. This is a critical command injection vulnerability.
**Learning:** Using `sh -c` to execute commands parameterized by string concatenation or untrusted input allows trivial shell injection.
**Prevention:** Always pass the command and its arguments separately using an array (e.g., `Vec<String>`) rather than relying on a shell interpreter.

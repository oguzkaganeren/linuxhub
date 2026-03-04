## 2024-05-30 - [Command Injection]
**Vulnerability:** Arbitrary shell command execution via `run_shell_command_with_result` and `run_elevated_command` due to passing user input to `sh -c`.
**Learning:** Taking commands as an unsanitized string and passing them to `sh -c` allows for critical command injection, even with `pkexec`. The issue is not used anywhere in the frontend codebase, but still accessible if an attacker injects their own Javascript, gaining RCE (and potentially elevated RCE).
**Prevention:** Remove `run_shell_command_with_result` and `run_elevated_command` as they are unused, or avoid taking raw unsanitized shell commands from the frontend.

## YYYY-MM-DD - Removed RCE vulnerabilities
**Vulnerability:** Arbitrary shell execution in `run_shell_command_with_result` and `run_elevated_command`.
**Learning:** The endpoints exposed arbitrary command execution to the frontend but were not actually used by the frontend codebase. They were removed rather than rewritten.
**Prevention:** Avoid defining generalized command execution endpoints in the backend IPC unless absolutely necessary, and always restrict execution to pre-approved command allowlists or specific tasks.
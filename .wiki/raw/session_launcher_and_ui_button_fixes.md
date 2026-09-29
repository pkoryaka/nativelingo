# Session: Launcher Headless Crash Fix, UI Button Reference Fix & Variant Cycling

## Date: 2026-09-29

### 1. Launcher Headless Crash & Quoting Fix (`launch.vbs` / `start.bat`)
- **Problem**: When launched from the Desktop shortcut (`NativeLingo.lnk`), the app silently failed to launch or open any window.
- **Root Causes**:
  1. `launch.vbs` previously invoked `node cli.js` with window style `0` (hidden). On Windows, invoking Node in a headless environment without an attached console buffer crashes Node's `child_process.spawn({ stdio: 'inherit' })` with `EBADF: bad file descriptor, write`.
  2. Direct invocation of `electron.exe` through `cmd /c` stripped outer quotation marks on paths containing spaces (`C:\AI Projects\...`), causing `cmd.exe` to attempt executing `'C:\AI'` and silently failing.
- **Solution**:
  - In `launch.vbs`, wrapped the command line in extra outer quotes required by `cmd.exe`:
    ```vbscript
    cmdLine = "cmd /c """"" & electronExe & """ """ & strPath & """" & args & """"
    WshShell.Run cmdLine, 0, False
    ```
  - Aligned `start.bat` to launch `electron.exe` directly relative to the application directory.
  - Added lightweight startup logging (`debugLog`) in `electron/main.cjs` to `crash_debug.log`.

### 2. UI Translation & Alternative Buttons Freezing (`src/App.jsx`)
- **Problem**: When jargon explanation / meaning options were toggled, or translation buttons were clicked, buttons would freeze or disappear.
- **Root Cause**: In `src/App.jsx`, `executeTranslationWithMode` function signature was missing default assignment for `options`, causing a `ReferenceError: options is not defined` when checking `options.isAlternative` or `options.previousTranslation`.
- **Solution**: Added `options = {}` to `executeTranslationWithMode` parameter list.

### 3. In-Place Rewrite Variant Cycling (`electron/main.cjs`, `CopyNative.cs`)
- **Problem**: Pressing the in-place rewrite hotkey repeatedly returned the identical text variant instead of offering alternative phrasings.
- **Solution**:
  - Implemented session tracking for `lastQuickRewrite` in `main.cjs` tracking original source text, last output, and timestamp.
  - Added `undopaste` and `undo` command handling in `electron/CopyNative.cs` (`VK_Z = 0x5A`) to undo previous replacement before pasting the next variant.
  - Injected negative constraints (`"Avoid previous phrasing..."`) and temperature `0.75` for cycling calls.

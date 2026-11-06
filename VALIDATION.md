# macOS validation — 5 November 2026

Base: upstream Capri Desktop `v1.0.0`, commit `f2aff721d2a791fd17ea1e3f8e4c9409dd3c01aa`.

Machine: Apple Silicon arm64, Apple A18 Pro, 8 GB RAM, macOS 27.0 (26A428). The available display is a single 2408 × 1506 logical display with scale factor 1. This is the tested environment; older macOS and Intel are not claimed as validated.

## Passed

- TypeScript checks for the Electron main/preload and React renderer.
- Python voice-script syntax check and native arm64 Swift-helper compilation.
- Production Electron/Vite build and unsigned arm64 DMG generation. `hdiutil verify` reports a valid checksum.
- **14 regression tests**, using test-only mocks for Electron, native desktop access, credentials and Spotify responses. Coverage includes Mac/Windows/Linux capability and update routing; small-memory model defaults; Retina/negative-origin crop calculations; native process routing; denied permissions; provider persistence and absence of silent fallback; exact Spotify track selection, concurrency and playback verification; API token refresh, missing tracks/devices, Premium/rate-limit failures; PKCE challenge/state validation and cancellation; supported/unsupported macros; and preventing ordinary chat from receiving desktop tools.
- Packaged-app launch with a fresh, isolated data directory. The app was copied from the DMG into `/Applications/Capri Desktop.app` for installed-app checks.
- Real native-helper permission and foreground-window queries, stable window identity/geometry, companion perching placement and tracked-position updates.
- Companion rendering, Mac settings rendering and preload IPC. App-window screenshots were inspected. No renderer errors were recorded in the passing core diagnostic run.
- Game-mode docking and switching click-through on/off.
- Real screen capture of the scanner region. Thumbnail-to-display mapping uses actual capture dimensions; transient empty Mac thumbnails are retried.
- Missing Python and FFmpeg are detected. A speech request without Python returns an actionable error instead of an uncaught process exception.
- Local Ollama inference using the already-installed `qwen3:1.7b` model returned `MAC_OK` for the diagnostic prompt. The final installed-app acceptance run also returned `MAC_OK` through the real agent and renderer event channel, with `session.started → assistant.delta → session.finished` and no tool calls. All installed-app diagnostic checks passed with an empty failure list.
- The native Spotify selector resolved the expected exact track URI from the installed app's actual search-results interface. This is a real Accessibility selection check, not a live playback authorization check.

## Remaining manual checks

- Python 3.11 and FFmpeg were absent. Per the chosen guided-manual setup policy, they were not installed automatically. Real Python environment creation/repair, Whisper download, microphone transcription, always-listening, TTS-provider audio and interruption/cancellation still need end-to-end checks after those dependencies are installed.
- Spotify Automation was not determined/granted for the new app. The diagnostic deliberately did not grant it. Desktop playback and media controls must be checked after the user authorizes them.
- No Spotify developer client/account authorization was supplied. Web API behavior was tested against controlled responses and the real local OAuth callback server; live Spotify token exchange, Premium playback and account/device availability were not verified. Mock encryption tests do not constitute a live Keychain credential-storage test.
- Permission denial paths have regression tests. Actual macOS permission revocation and regrant were not performed on the user's machine.
- Retina and negative display origins have numeric tests. Physical Retina, multiple monitors, moving tracked windows between displays, fullscreen Spaces and global keyboard/recording behavior still need hands-on checks.
- Windows and Linux branches pass static checks and policy tests. Their runtime behavior was not exercised on those operating systems.
- Gatekeeper behavior for an internet-downloaded, quarantined copy was not tested. This is an unsigned personal build, not a notarized public release.

## Personal-machine adjustments

On this 8 GB Mac, setup recommends Qwen3 1.7B and recognizes the existing Gemma3 4B vision model. Vision inference is loaded on demand; it is not prewarmed alongside chat. Qwen3 local chat disables thinking for lower latency. See [Ollama's compatibility documentation](https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx) for `reasoning_effort` support.

With explicit user authorization, nine installers for already-installed apps were removed from Downloads (0.99 GiB in listed file sizes). Hunyuan 4B, Qwen3 4B and Gemma4 e2b were removed through Ollama's API (12.58 GB in listed model sizes; shared-file accounting can differ). Qwen3 1.7B and Gemma3 4B were retained. Cleanup details are supplied separately.

The source retains upstream dependency versions. This work does not constitute a dependency/security upgrade or a public-release certification.

## Update: 1.0.1-mac.1 — native controls, login and placement

- All **16 regression tests** pass, including natural placement commands, accidental-command rejection, negative display origins and Dock-aware anchors.
- Fresh and restarted packaged runs passed. A restart restored the saved bottom-right position. The lock survived opening/closing the editor, autonomous-cycle attempts and background renderer resume requests.
- The installed update was opened and Command–comma was verified to display Mac settings, the Open at Login checkbox and placement controls. Its saved NVIDIA cloud model remained selected.
- The position button was tested in the installed UI. A follow-up fix ensures choosing a position hides the editor and reveals the companion.
- The macOS Login Items API is available in the packaged build. Startup registration is opt-in; an actual logout/login was not performed. No login preference was enabled during testing.

The release keeps existing settings/data. `desktop-placement.json` stores only the pinned rectangle and sitting pose. Dragging a pinned companion updates that rectangle; explicit “roam again” clears it. Menu-bar and Dock clearance use the selected display's work area.

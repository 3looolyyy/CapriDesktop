# macOS 1.0.6 validation

Validated 2026-11-24 on Apple A18 Pro (arm64), 8 GB unified memory, macOS 27.0, Node 24.21.0.

This change builds upstream 1.0.6, including the changes from 1.0.5, using the previously merged Apple Silicon port. Qwen3-TTS is a separate change based on PR #48 and is excluded here.

- `npm run typecheck`: passed (main/preload and renderer).
- `npm run test:mac`: 76 tests passed across platform, scanner, agent lifecycle and desktop-cache suites.
- `npm run dist:mac`: Swift helper compiled; production renderer/main/preload built; arm64 app and DMG generated.
- `codesign --verify --deep --strict`: passed for the packaged app.
- `hdiutil verify`: DMG checksum passed.
- Packaged Electron launch and settings rendering checked with an isolated test profile. Mac permissions/status IPC answered successfully. Settings includes the upstream Logs, Support and Contributors tabs and Mac controls.
- The shared 1.0.6 code plus the separate TTS changes also passed 30 game-reaction tests and 7 capability tests.

The Mac test fixtures had drifted from upstream service imports; they now cover current code again. A real game-detection regression is fixed: `includeAdapted=true` no longer rejects the process before the Mac caller can recognize it, while the ordinary adapter exclusion stays intact.

No existing app installation, personal profile or account credentials were replaced. The previous personal ChatGPT sign-in integration is not included. The app is locally development-signed, not Developer ID notarized. Intel, macOS 13–26, another clean Mac, physical sleep/wake, external monitors, live provider accounts and Windows/Linux runtime were not retested. Windows-only game integrations and autonomous YouTube/TikTok controls remain unavailable on Mac as documented in MACOS.md.

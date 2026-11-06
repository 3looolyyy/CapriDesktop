# macOS validation — upstream 1.0.4 / Mac revision 13

Apple Silicon personal build. See [UPSTREAM-MAC-REVIEW.md](UPSTREAM-MAC-REVIEW.md) for release-by-release integration details.

## Passing checks

- 47 regression tests covering platform/updater routing, cloud vision/provider separation, credential-safe request metadata, Spotify selection/errors, placement/crop math, voice wake gating, microphone cleanup, screen-comment consent/lock gating, Mac command bounds, hotkeys, multilingual fixed requests and speech-cache relocation planning.
- TypeScript main/preload/renderer checks; Python voice-script syntax; Swift native helper build; production Electron arm64 package and signature verification.
- Packaged read-only native queries for battery, disk space, OS version, local clock and system volume.
- Offline synthetic speech transcription with a previously downloaded Whisper base model. Missing-model state in a fresh profile returns setup instructions; no model silently downloaded.
- Prior user acceptance on this Mac: cloud chat/vision, Spotify desktop control, login startup, permissions and local voice/wake behavior. Those accepted features are preserved by the merge; this is not a claim of fresh testing every path after each change.

## Not yet fully validated

- Real external-disk relocation, low-disk/interrupted migration and rollback on physical hardware; tests use isolated dry-run paths.
- Hardware-dependent volume/mute writes (bounded/verified in tests), every external audio device/microphone and every System Settings destination.
- All ten spoken languages, physical Retina/external displays, fullscreen Spaces and keyboard combinations on different layouts.
- Spotify Web API live credentials/Premium account path, all permission revocation/regrant combinations and a clean second Mac.
- Windows/Linux runtime; passing static checks do not establish runtime equivalence.
- Intel/older macOS compatibility, Developer ID signing/notarization and public Gatekeeper acceptance.

Local validation artifacts and API keys, app-data backups, user settings, models, private signing identity and built binaries are excluded from the source repository.

On Mac, storage moves leave a standalone/shared Ollama library in place. Only model folders already managed under Capri’s selected storage root are eligible to move; a running standalone server must be quit first. Speech caches and Capri’s Python environment can be relocated independently.

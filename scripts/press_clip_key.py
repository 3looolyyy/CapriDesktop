#!/usr/bin/env python3
"""
Simulates an F8 keypress (press + 80ms hold + release) via Windows Win32 API.
Designed for NVIDIA ShadowPlay / GeForce Experience instant replay clip capture.
Uses both Virtual-Key code (VK_F8 = 0x77) and hardware scan code (0x42)
so games (DirectInput, RawInput) and global low-level hooks intercept it reliably.
"""
import ctypes
import time
import sys

def trigger_f8_clip(hold_seconds: float = 0.08) -> bool:
    try:
        user32 = ctypes.windll.user32
        VK_F8 = 0x77
        SCAN_F8 = 0x42
        KEYEVENTF_KEYUP = 0x0002

        # Key Down (with hardware scan code)
        user32.keybd_event(VK_F8, SCAN_F8, 0, 0)
        time.sleep(hold_seconds)
        # Key Up
        user32.keybd_event(VK_F8, SCAN_F8, KEYEVENTF_KEYUP, 0)
        return True
    except Exception as e:
        sys.stderr.write(f"Failed to send F8 keybd_event: {e}\n")
        return False

if __name__ == "__main__":
    hold = 0.08
    if len(sys.argv) > 1:
        try:
            hold = float(sys.argv[1])
        except ValueError:
            pass

    success = trigger_f8_clip(hold)
    if success:
        print("SUCCESS_F8_EMITTED")
        sys.exit(0)
    else:
        sys.exit(1)

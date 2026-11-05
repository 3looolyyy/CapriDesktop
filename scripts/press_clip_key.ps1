param(
    [int]$HoldMs = 80
)

$code = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public static class ClipKeyHelper {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public static void TriggerF8(int holdMs) {
        // VK_F8 = 0x77, Scan Code = 0x42
        keybd_event(0x77, 0x42, 0, UIntPtr.Zero);
        Thread.Sleep(holdMs);
        keybd_event(0x77, 0x42, 2, UIntPtr.Zero);
    }
}
"@

try {
    if (-not ([System.Management.Automation.PSTypeName]'ClipKeyHelper').Type) {
        Add-Type -TypeDefinition $code -ErrorAction Stop
    }
    [ClipKeyHelper]::TriggerF8($HoldMs)
    Write-Output "SUCCESS_F8_EMITTED"
    exit 0
} catch {
    Write-Error $_
    exit 1
}

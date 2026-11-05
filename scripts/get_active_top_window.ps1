Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Diagnostics;

public class ActiveTopWindowHelper {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("dwmapi.dll")]
    public static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    public const int DWMWA_CLOAKED = 14;

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public class TopWindowResult {
        public string Title;
        public string Process;
    }

    public static TopWindowResult GetActiveOrTopWindow() {
        IntPtr hwinsta = OpenWindowStation("WinSta0", false, 0x037F);
        if (hwinsta != IntPtr.Zero) SetProcessWindowStation(hwinsta);
        IntPtr hdesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hdesk != IntPtr.Zero) SetThreadDesktop(hdesk);

        IntPtr fgHwnd = GetForegroundWindow();
        if (fgHwnd != IntPtr.Zero && IsWindowVisible(fgHwnd) && !IsIconic(fgHwnd)) {
            var sbFg = new StringBuilder(512);
            GetWindowText(fgHwnd, sbFg, 512);
            string fgTitle = sbFg.ToString().Trim();
            if (!string.IsNullOrEmpty(fgTitle) && !fgTitle.Contains("cyber-companion") && !fgTitle.Contains("Capri Desktop") && !fgTitle.Contains("capricorn · dev-deck")) {
                uint fgPid = 0;
                GetWindowThreadProcessId(fgHwnd, out fgPid);
                string pName = "";
                try { pName = Process.GetProcessById((int)fgPid).ProcessName; } catch {}
                return new TopWindowResult { Title = fgTitle, Process = pName };
            }
        }

        TopWindowResult result = null;

        EnumDesktopWindows(hdesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd) || IsIconic(hWnd)) return true;

            int cloaked = 0;
            DwmGetWindowAttribute(hWnd, DWMWA_CLOAKED, out cloaked, sizeof(int));
            if (cloaked != 0) return true;

            var sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (string.IsNullOrEmpty(title)) return true;

            // Ignore system widgets or desktop elements
            if (title == "Program Manager" || title == "Windows Input Experience" || title == "Settings" ||
                title.StartsWith("Task Switching") || title == "cyber-companion" || title.Contains("Capri Desktop") || title.Contains("capricorn · dev-deck")) {
                return true;
            }

            uint pid = 0;
            GetWindowThreadProcessId(hWnd, out pid);
            string proc = "";
            try { proc = Process.GetProcessById((int)pid).ProcessName; } catch {}

            // Ignore our own electron processes
            if (proc.ToLower().Contains("electron")) return true;

            result = new TopWindowResult { Title = title, Process = proc };
            return false; // Found top visible user window
        }, IntPtr.Zero);

        return result ?? new TopWindowResult { Title = "", Process = "" };
    }
}
"@

try {
    [ActiveTopWindowHelper]::GetActiveOrTopWindow() | ConvertTo-Json -Compress
} catch {
    Write-Output '{"Title":"","Process":""}'
}

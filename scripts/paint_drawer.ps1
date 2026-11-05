param(
    [Parameter(Mandatory=$false)]
    [string]$Shape = "random",
    [Parameter(Mandatory=$false)]
    [int]$Speed = 1,
    [Parameter(Mandatory=$false)]
    [string]$JsonFile = ""
)

$code = @"
using System;
using System.Text;
using System.Drawing;
using System.Threading;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Diagnostics;

public class NativePaintDrawer {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern IntPtr GetAncestor(IntPtr hWnd, uint gaFlags);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);

    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);

    public const uint GA_ROOT = 2;
    public const int VK_ESCAPE = 0x1B;
    public const int SW_RESTORE = 9;

    public const uint MOUSEEVENTF_MOVE     = 0x0001;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint MOUSEEVENTF_ABSOLUTE = 0x8000;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }

    public static uint PaintPid = 0;

    public static IntPtr FindPaintWindow() {
        IntPtr found = IntPtr.Zero;
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            string title = sb.ToString();
            RECT r;
            GetWindowRect(hWnd, out r);
            int w = r.Right - r.Left;
            int h = r.Bottom - r.Top;
            if (w > 250 && h > 250 && (title.ToLower().Contains("paint") || title.EndsWith("- Paint") || title.EndsWith(": Paint"))) {
                found = hWnd;
                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                PaintPid = pid;
                return false;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }

    public static void BringToFront(IntPtr hWnd) {
        ShowWindow(hWnd, SW_RESTORE);
        keybd_event(0, 0, 0, UIntPtr.Zero);
        SetForegroundWindow(hWnd);
        SwitchToThisWindow(hWnd, true);
        Thread.Sleep(350);
    }

    public static bool IsEscapePressed() {
        return (GetAsyncKeyState(VK_ESCAPE) & 0x8000) != 0;
    }

    public static void MouseUp() {
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
    }

    public static void MouseDown() {
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
    }

    public static void MoveAbsolute(int x, int y, int screenW, int screenH) {
        SetCursorPos(x, y);
        uint normX = (uint)((x * 65535) / Math.Max(1, screenW));
        uint normY = (uint)((y * 65535) / Math.Max(1, screenH));
        mouse_event(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, normX, normY, 0, UIntPtr.Zero);
    }

    public static bool CheckSafety(IntPtr targetHwnd) {
        if (IsEscapePressed()) return false;

        IntPtr fg = GetForegroundWindow();
        if (fg == IntPtr.Zero) return true; // transient click state
        if (fg == targetHwnd) return true;

        IntPtr root = GetAncestor(fg, GA_ROOT);
        if (root == targetHwnd) return true;

        uint fgPid;
        GetWindowThreadProcessId(fg, out fgPid);
        if (fgPid == PaintPid && PaintPid != 0) return true;

        StringBuilder sb = new StringBuilder(256);
        GetWindowText(fg, sb, 256);
        if (sb.ToString().ToLower().Contains("paint")) return true;

        return false;
    }
}
"@

try {
    Add-Type -TypeDefinition $code -ErrorAction Stop
} catch {
    # If already added in current session, ignore
}

# Locate or Launch Paint (Windows 11 modern Paint has MainWindowHandle=0 on Get-Process, so EnumWindows is required)
$hWnd = [NativePaintDrawer]::FindPaintWindow()

if ($hWnd -eq [IntPtr]::Zero) {
    Start-Process mspaint
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.ElapsedMilliseconds -lt 4500) {
        Start-Sleep -Milliseconds 250
        $hWnd = [NativePaintDrawer]::FindPaintWindow()
        if ($hWnd -ne [IntPtr]::Zero) { break }
    }
}

if ($hWnd -eq [IntPtr]::Zero) {
    [PSCustomObject]@{
        success = $false
        aborted = false
        shape = $Shape
        reason = "paint_not_found"
    } | ConvertTo-Json -Compress
    exit 0
}

# Bring Paint reliably to front
[NativePaintDrawer]::BringToFront($hWnd)

$rect = New-Object NativePaintDrawer+RECT
[NativePaintDrawer]::GetWindowRect($hWnd, [ref]$rect) | Out-Null

$winW = $rect.Right - $rect.Left
$winH = $rect.Bottom - $rect.Top

if ($winW -lt 300 -or $winH -lt 300) {
    [PSCustomObject]@{
        success = $false
        aborted = false
        shape = $Shape
        reason = "window_too_small"
    } | ConvertTo-Json -Compress
    exit 0
}

$screenW = [NativePaintDrawer]::GetSystemMetrics(0)
$screenH = [NativePaintDrawer]::GetSystemMetrics(1)

# Compute Safe Canvas Bounds (Inside Paint, avoiding ribbon header, status bar & side panels)
$canvasMinX = $rect.Left + [Math]::Max(80, [int]($winW * 0.12))
$canvasMaxX = $rect.Right - [Math]::Max(80, [int]($winW * 0.12))
$canvasMinY = $rect.Top + 190   # Under the ribbon toolbars
$canvasMaxY = $rect.Bottom - 70 # Above the status bar / zoom slider

$centerX = [int](($canvasMinX + $canvasMaxX) / 2)
$centerY = [int](($canvasMinY + $canvasMaxY) / 2)

$availW = [Math]::Max(100, $canvasMaxX - $canvasMinX)
$availH = [Math]::Max(100, $canvasMaxY - $canvasMinY)
$radius = [int]([Math]::Min($availW, $availH) * 0.35)
if ($radius -lt 60) { $radius = 60 }
if ($radius -gt 180) { $radius = 180 }

# Shape Generation (List of Strokes; each stroke is an array of [X, Y] points)
$strokes = @()
$rand = New-Object System.Random

if ($JsonFile -and (Test-Path $JsonFile)) {
    try {
        $rawJson = Get-Content -Raw -Path $JsonFile -Encoding UTF8
        $plan = $rawJson | ConvertFrom-Json
        if ($plan.subject) { $Shape = [string]$plan.subject }

        $scaleX = ($canvasMaxX - $canvasMinX) / 100.0
        $scaleY = ($canvasMaxY - $canvasMinY) / 100.0

        foreach ($item in $plan.shapes) {
            $type = [string]$item.type
            switch ($type.ToLower()) {
                "line" {
                    $rx1 = [int]($canvasMinX + ($item.x1 * $scaleX))
                    $ry1 = [int]($canvasMinY + ($item.y1 * $scaleY))
                    $rx2 = [int]($canvasMinX + ($item.x2 * $scaleX))
                    $ry2 = [int]($canvasMinY + ($item.y2 * $scaleY))
                    $dist = [Math]::Sqrt([Math]::Pow($rx2 - $rx1, 2) + [Math]::Pow($ry2 - $ry1, 2))
                    $steps = [Math]::Max(2, [int]($dist / 6))
                    $pts = @()
                    for ($s = 0; $s -le $steps; $s++) {
                        $t = $s / [double]$steps
                        $pts += ,@([int]($rx1 + ($rx2 - $rx1) * $t), [int]($ry1 + ($ry2 - $ry1) * $t))
                    }
                    $strokes += ,$pts
                }

                "polyline" {
                    if ($item.points -and $item.points.Count -ge 2) {
                        $pts = @()
                        $pList = @($item.points)
                        if ($item.closed -and $pList.Count -ge 3) {
                            $pList += $pList[0]
                        }
                        for ($k = 0; $k -lt ($pList.Count - 1); $k++) {
                            $pA = $pList[$k]
                            $pB = $pList[$k + 1]
                            $rxA = [int]($canvasMinX + ($pA[0] * $scaleX))
                            $ryA = [int]($canvasMinY + ($pA[1] * $scaleY))
                            $rxB = [int]($canvasMinX + ($pB[0] * $scaleX))
                            $ryB = [int]($canvasMinY + ($pB[1] * $scaleY))
                            $dist = [Math]::Sqrt([Math]::Pow($rxB - $rxA, 2) + [Math]::Pow($ryB - $ryA, 2))
                            $steps = [Math]::Max(2, [int]($dist / 6))
                            for ($s = 0; $s -le $steps; $s++) {
                                if ($k -gt 0 -and $s -eq 0) { continue }
                                $t = $s / [double]$steps
                                $pts += ,@([int]($rxA + ($rxB - $rxA) * $t), [int]($ryA + ($ryB - $ryA) * $t))
                            }
                        }
                        if ($pts.Count -gt 0) {
                            $strokes += ,$pts
                        }
                    }
                }

                "circle" {
                    $cx = [int]($canvasMinX + ($item.cx * $scaleX))
                    $cy = [int]($canvasMinY + ($item.cy * $scaleY))
                    $minScale = [Math]::Min($scaleX, $scaleY)
                    $r = [int]($item.r * $minScale)
                    if ($r -lt 2) { $r = 2 }
                    $steps = [Math]::Max(16, [int](2 * [Math]::PI * $r / 5))
                    if ($steps -gt 60) { $steps = 60 }
                    $pts = @()
                    for ($s = 0; $s -le ($steps + 2); $s++) {
                        $theta = ($s / [double]$steps) * 2 * [Math]::PI
                        $px = [int]($cx + ($r * [Math]::Cos($theta)))
                        $py = [int]($cy + ($r * [Math]::Sin($theta)))
                        $pts += ,@($px, $py)
                    }
                    $strokes += ,$pts
                }

                "ellipse" {
                    $cx = [int]($canvasMinX + ($item.cx * $scaleX))
                    $cy = [int]($canvasMinY + ($item.cy * $scaleY))
                    $rx = [int]($item.rx * $scaleX)
                    $ry = [int]($item.ry * $scaleY)
                    if ($rx -lt 2) { $rx = 2 }
                    if ($ry -lt 2) { $ry = 2 }
                    $steps = [Math]::Max(16, [int](2 * [Math]::PI * [Math]::Max($rx, $ry) / 5))
                    if ($steps -gt 60) { $steps = 60 }
                    $pts = @()
                    for ($s = 0; $s -le ($steps + 2); $s++) {
                        $theta = ($s / [double]$steps) * 2 * [Math]::PI
                        $px = [int]($cx + ($rx * [Math]::Cos($theta)))
                        $py = [int]($cy + ($ry * [Math]::Sin($theta)))
                        $pts += ,@($px, $py)
                    }
                    $strokes += ,$pts
                }

                "arc" {
                    $cx = [int]($canvasMinX + ($item.cx * $scaleX))
                    $cy = [int]($canvasMinY + ($item.cy * $scaleY))
                    $rx = [int]($item.rx * $scaleX)
                    $ry = [int]($item.ry * $scaleY)
                    $startDeg = [double]$item.startAngle
                    $endDeg = [double]$item.endAngle
                    $startRad = ($startDeg * [Math]::PI) / 180.0
                    $endRad = ($endDeg * [Math]::PI) / 180.0
                    $diff = $endRad - $startRad
                    if ($diff -le 0) { $diff += (2 * [Math]::PI) }
                    $steps = [Math]::Max(8, [int]([Math]::Abs($diff) * [Math]::Max($rx, $ry) / 5))
                    if ($steps -gt 50) { $steps = 50 }
                    $pts = @()
                    for ($s = 0; $s -le $steps; $s++) {
                        $theta = $startRad + (($s / [double]$steps) * $diff)
                        $px = [int]($cx + ($rx * [Math]::Cos($theta)))
                        $py = [int]($cy + ($ry * [Math]::Sin($theta)))
                        $pts += ,@($px, $py)
                    }
                    $strokes += ,$pts
                }

                "curve" {
                    $rx0 = [int]($canvasMinX + ($item.p0[0] * $scaleX))
                    $ry0 = [int]($canvasMinY + ($item.p0[1] * $scaleY))
                    $rx1 = [int]($canvasMinX + ($item.p1[0] * $scaleX))
                    $ry1 = [int]($canvasMinY + ($item.p1[1] * $scaleY))
                    $rx2 = [int]($canvasMinX + ($item.p2[0] * $scaleX))
                    $ry2 = [int]($canvasMinY + ($item.p2[1] * $scaleY))

                    $hasP3 = ($item.p3 -ne $null -and $item.p3.Count -ge 2)
                    $rx3 = if ($hasP3) { [int]($canvasMinX + ($item.p3[0] * $scaleX)) } else { 0 }
                    $ry3 = if ($hasP3) { [int]($canvasMinY + ($item.p3[1] * $scaleY)) } else { 0 }

                    $steps = 20
                    $pts = @()
                    for ($s = 0; $s -le $steps; $s++) {
                        $t = $s / [double]$steps
                        if ($hasP3) {
                            $u = 1.0 - $t
                            $bx = ($u * $u * $u * $rx0) + (3.0 * $u * $u * $t * $rx1) + (3.0 * $u * $t * $t * $rx2) + ($t * $t * $t * $rx3)
                            $by = ($u * $u * $u * $ry0) + (3.0 * $u * $u * $t * $ry1) + (3.0 * $u * $t * $t * $ry2) + ($t * $t * $t * $ry3)
                        } else {
                            $u = 1.0 - $t
                            $bx = ($u * $u * $rx0) + (2.0 * $u * $t * $rx1) + ($t * $t * $rx2)
                            $by = ($u * $u * $ry0) + (2.0 * $u * $t * $ry1) + ($t * $t * $ry2)
                        }
                        $pts += ,@([int]$bx, [int]$by)
                    }
                    $strokes += ,$pts
                }
            }
        }
    } catch {
        # If parsing JSON fails, fall back to procedural
    }
}

if ($strokes.Count -eq 0) {
    if ($Shape -eq "random") {
        $options = @("heart", "star", "smile", "house", "cat", "spiral", "doodle")
        $Shape = $options[$rand.Next($options.Length)]
    }

    switch ($Shape.ToLower()) {
        "heart" {
            $heartPoints = @()
            $steps = 100
            for ($i = 0; $i -le 105; $i++) {
                $t = ($i / [double]$steps) * 2 * [Math]::PI
                $hx = 16 * [Math]::Pow([Math]::Sin($t), 3)
                $hy = -(13 * [Math]::Cos($t) - 5 * [Math]::Cos(2*$t) - 2 * [Math]::Cos(3*$t) - [Math]::Cos(4*$t))
                $scale = $radius / 17.0
                $px = [int]($centerX + ($hx * $scale))
                $py = [int]($centerY + ($hy * $scale) + ($radius * 0.15))
                $heartPoints += ,@($px, $py)
            }
            $strokes += ,$heartPoints
        }

        "star" {
            $starPoints = @()
            $numPoints = 5
            $outerR = $radius
            $innerR = $radius * 0.40
            $totalVertices = $numPoints * 2

            for ($i = 0; $i -le $totalVertices; $i++) {
                $angle = ($i / [double]$totalVertices) * 2 * [Math]::PI - ([Math]::PI / 2)
                $r = if ($i % 2 -eq 0) { $outerR } else { $innerR }
                $px = [int]($centerX + ($r * [Math]::Cos($angle)))
                $py = [int]($centerY + ($r * [Math]::Sin($angle)))
                $starPoints += ,@($px, $py)
            }
            $strokes += ,$starPoints
        }

        "spiral" {
            $spiralPoints = @()
            $loops = 3.5
            $steps = 110
            for ($i = 0; $i -le 50; $i++) {
                $theta = ($i / [double]$steps) * ($loops * 2 * [Math]::PI)
                $r = ($i / [double]$steps) * $radius
                $px = [int]($centerX + ($r * [Math]::Cos($theta)))
                $py = [int]($centerY + ($r * [Math]::Sin($theta)))
                $spiralPoints += ,@($px, $py)
            }
            $strokes += ,$spiralPoints
        }

        "smile" {
            $faceCircle = @()
            for ($i = 0; $i -le 65; $i++) {
                $ang = ($i / 60.0) * 2 * [Math]::PI
                $px = [int]($centerX + ($radius * [Math]::Cos($ang)))
                $py = [int]($centerY + ($radius * [Math]::Sin($ang)))
                $faceCircle += ,@($px, $py)
            }
            $strokes += ,$faceCircle

            $leftEyeX = [int]($centerX - ($radius * 0.35))
            $eyeY = [int]($centerY - ($radius * 0.25))
            $leftEye = @()
            for ($i = 0; $i -le 16; $i++) {
                $ang = ($i / 15.0) * 2 * [Math]::PI
                $leftEye += ,@([int]($leftEyeX + 6 * [Math]::Cos($ang)), [int]($eyeY + 6 * [Math]::Sin($ang)))
            }
            $strokes += ,$leftEye

            $rightEyeX = [int]($centerX + ($radius * 0.35))
            $rightEye = @()
            for ($i = 0; $i -le 16; $i++) {
                $ang = ($i / 15.0) * 2 * [Math]::PI
                $rightEye += ,@([int]($rightEyeX + 6 * [Math]::Cos($ang)), [int]($eyeY + 6 * [Math]::Sin($ang)))
            }
            $strokes += ,$rightEye

            $smile = @()
            for ($i = 0; $i -le 35; $i++) {
                $ang = [Math]::PI * 0.20 + ($i / 35.0) * ([Math]::PI * 0.60)
                $px = [int]($centerX + ($radius * 0.60 * [Math]::Cos($ang)))
                $py = [int]($centerY + ($radius * 0.55 * [Math]::Sin($ang)))
                $smile += ,@($px, $py)
            }
            $strokes += ,$smile
        }

        "house" {
            $halfW = [int]($radius * 0.75)
            $halfH = [int]($radius * 0.65)
            $roofH = [int]($radius * 0.75)

            $walls = @(
                @($centerX - $halfW, $centerY + $halfH),
                @($centerX + $halfW, $centerY + $halfH),
                @($centerX + $halfW, $centerY - $halfH),
                @($centerX - $halfW, $centerY - $halfH),
                @($centerX - $halfW, $centerY + $halfH)
            )
            $strokes += ,$walls

            $roof = @(
                @($centerX - $halfW - 10, $centerY - $halfH),
                @($centerX, $centerY - $halfH - $roofH),
                @($centerX + $halfW + 10, $centerY - $halfH)
            )
            $strokes += ,$roof

            $doorW = [int]($halfW * 0.35)
            $doorH = [int]($halfH * 0.70)
            $door = @(
                @($centerX - $doorW, $centerY + $halfH),
                @($centerX - $doorW, $centerY + $halfH - $doorH),
                @($centerX + $doorW, $centerY + $halfH - $doorH),
                @($centerX + $doorW, $centerY + $halfH)
            )
            $strokes += ,$door

            $chimney = @(
                @($centerX + [int]($halfW * 0.45), $centerY - $halfH - [int]($roofH * 0.40)),
                @($centerX + [int]($halfW * 0.45), $centerY - $halfH - $roofH),
                @($centerX + [int]($halfW * 0.65), $centerY - $halfH - $roofH),
                @($centerX + [int]($halfW * 0.65), $centerY - $halfH - [int]($roofH * 0.20))
            )
            $strokes += ,$chimney
        }

        "cat" {
            $head = @()
            for ($i = 0; $i -le 52; $i++) {
                $ang = ($i / 50.0) * 2 * [Math]::PI
                $head += ,@([int]($centerX + ($radius * 0.75 * [Math]::Cos($ang))), [int]($centerY + ($radius * 0.75 * [Math]::Sin($ang))))
            }
            $strokes += ,$head

            $leftEar = @(
                @([int]($centerX - ($radius * 0.65)), [int]($centerY - ($radius * 0.35))),
                @([int]($centerX - ($radius * 0.75)), [int]($centerY - $radius - 15)),
                @([int]($centerX - ($radius * 0.20)), [int]($centerY - ($radius * 0.70)))
            )
            $strokes += ,$leftEar

            $rightEar = @(
                @([int]($centerX + ($radius * 0.20)), [int]($centerY - ($radius * 0.70))),
                @([int]($centerX + ($radius * 0.75)), [int]($centerY - $radius - 15)),
                @([int]($centerX + ($radius * 0.65)), [int]($centerY - ($radius * 0.35)))
            )
            $strokes += ,$rightEar

            $strokes += ,@(@($centerX - 15, $centerY + 5), @($centerX - $radius - 20, $centerY - 5))
            $strokes += ,@(@($centerX - 15, $centerY + 15), @($centerX - $radius - 15, $centerY + 25))

            $strokes += ,@(@($centerX + 15, $centerY + 5), @($centerX + $radius + 20, $centerY - 5))
            $strokes += ,@(@($centerX + 15, $centerY + 15), @($centerX + $radius + 15, $centerY + 25))
        }

        default {
            $doodle = @()
            $numWaypoints = 6
            $pts = @()
            for ($w = 0; $w -lt $numWaypoints; $w++) {
                $rx = $centerX + $rand.Next(-$radius, $radius)
                $ry = $centerY + $rand.Next(-$radius, $radius)
                $pts += ,@($rx, $ry)
            }
            for ($w = 0; $w -lt ($pts.Length - 1); $w++) {
                $p0 = $pts[$w]
                $p1 = $pts[$w + 1]
                for ($k = 0; $k -le 15; $k++) {
                    $t = $k / 15.0
                    $bx = [int]($p0[0] + ($p1[0] - $p0[0]) * $t)
                    $by = [int]($p0[1] + ($p1[1] - $p0[1]) * $t)
                    $doodle += ,@($bx, $by)
                }
            }
            $strokes += ,$doodle
        }
    }
}

# Human-like Drawing Execution with Safety Checks
$isAborted = $false
$abortReason = ""

$baseDelayMs = switch ($Speed) {
    2 { 6 }
    0 { 15 }
    default { 9 }
}

try {
    # Move cursor over canvas to ensure cursor position is inside Paint window
    [NativePaintDrawer]::MouseUp()
    [NativePaintDrawer]::MoveAbsolute($centerX, $centerY, $screenW, $screenH)
    Start-Sleep -Milliseconds 120

    foreach ($stroke in $strokes) {
        if ($stroke.Length -eq 0) { continue }

        # Safety Check before stroke
        if (-not [NativePaintDrawer]::CheckSafety($hWnd)) {
            $isAborted = $true
            $abortReason = if ([NativePaintDrawer]::IsEscapePressed()) { "escape_key" } else { "lost_focus" }
            break
        }

        # Smoothly move to stroke start with mouse UP
        [NativePaintDrawer]::MouseUp()
        $firstPt = $stroke[0]
        $clampedX = [Math]::Max($canvasMinX, [Math]::Min($canvasMaxX, $firstPt[0]))
        $clampedY = [Math]::Max($canvasMinY, [Math]::Min($canvasMaxY, $firstPt[1]))
        [NativePaintDrawer]::MoveAbsolute($clampedX, $clampedY, $screenW, $screenH)
        Start-Sleep -Milliseconds 90

        # Press Mouse Down
        [NativePaintDrawer]::MouseDown()
        Start-Sleep -Milliseconds 35

        # Draw Stroke Waypoints with Micro-jitter, smooth velocity variation
        $totalPts = $stroke.Length
        for ($idx = 1; $idx -lt $totalPts; $idx++) {
            if (-not [NativePaintDrawer]::CheckSafety($hWnd)) {
                $isAborted = $true
                $abortReason = if ([NativePaintDrawer]::IsEscapePressed()) { "escape_key" } else { "lost_focus" }
                break
            }

            $pt = $stroke[$idx]
            $targetX = [Math]::Max($canvasMinX, [Math]::Min($canvasMaxX, $pt[0]))
            $targetY = [Math]::Max($canvasMinY, [Math]::Min($canvasMaxY, $pt[1]))

            # Micro-jitter (~1px human tremor)
            if ($rand.Next(100) -lt 20) {
                $targetX += $rand.Next(-1, 2)
                $targetY += $rand.Next(-1, 2)
                $targetX = [Math]::Max($canvasMinX, [Math]::Min($canvasMaxX, $targetX))
                $targetY = [Math]::Max($canvasMinY, [Math]::Min($canvasMaxY, $targetY))
            }

            [NativePaintDrawer]::MoveAbsolute($targetX, $targetY, $screenW, $screenH)

            # Smooth ease-in / ease-out speed variation
            $progress = $idx / [double]$totalPts
            $easeFactor = 1.0
            if ($progress -lt 0.15 -or $progress -gt 0.85) {
                $easeFactor = 1.35
            }
            $stepDelay = [int]($baseDelayMs * $easeFactor)
            Start-Sleep -Milliseconds $stepDelay
        }

        # Lift Mouse Up at end of stroke
        Start-Sleep -Milliseconds 30
        [NativePaintDrawer]::MouseUp()
        if ($isAborted) { break }
        Start-Sleep -Milliseconds 85
    }
} finally {
    # Ensure mouse button is always released
    [NativePaintDrawer]::MouseUp()
}

[PSCustomObject]@{
    success = (-not $isAborted)
    shape = $Shape
    aborted = $isAborted
    reason = $abortReason
} | ConvertTo-Json -Compress

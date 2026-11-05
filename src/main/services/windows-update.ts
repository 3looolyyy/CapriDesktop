/**
 * The silent installer sometimes crashes as it starts (about 1 run in 5, inside the NSIS System
 * plugin that electron-builder ships), before touching anything. So the update runs from a small
 * script that outlives Capri: it tries again, and if every try fails it reopens the version that
 * is still installed, so an update can never leave the user without her.
 */

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`

export function windowsUpdateScript(installer: string, currentApp: string, installerArgs = ['/S', '--updated', '--force-run'], tries = 5): string {
  const args = installerArgs.map(quote).join(',')
  return [
    // Capri has to be closed first: the installer would stop to wait for her
    'Start-Sleep -Seconds 3',
    `foreach ($try in 1..${tries}) {`,
    `  $run = Start-Process -FilePath ${quote(installer)} -ArgumentList ${args} -PassThru`,
    // Without asking for the handle first, PowerShell 5.1 forgets the exit code
    '  $null = $run.Handle',
    '  $run.WaitForExit()',
    '  if ($run.ExitCode -eq 0) { exit 0 }',
    '  Start-Sleep -Seconds 2',
    '}',
    `Start-Process -FilePath ${quote(currentApp)}`
  ].join('; ').replace(/\{; /g, '{ ').replace(/; \}/g, ' }')
}

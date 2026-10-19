$cwpFiles = @(
    "dist",
    "app.js",
    "server.js",
    "migrations",
    "shared",
    "attached_assets",
    "spotly.sql",
    ".env.example",
    "drizzle.config.ts",
    "ecosystem.config.cjs",
    "package.json",
    "package-lock.json",
    "CWP_DEPLOYMENT_GUIDE.md"
)

function Safe-Remove($filePath) {
    if (Test-Path $filePath) {
        for ($i = 0; $i -lt 5; $i++) {
            try {
                Remove-Item $filePath -Force -ErrorAction Stop
                return
            } catch {
                Start-Sleep -Milliseconds 600
            }
        }
    }
}

Safe-Remove "spotly-deployment.zip"
Compress-Archive -Path $cwpFiles -DestinationPath "spotly-deployment.zip" -Force
$cwpSize = [math]::Round((Get-Item "spotly-deployment.zip").Length / 1MB, 2)
Write-Host "CWP Deployment Archive created: spotly-deployment.zip ($cwpSize MB)"

Safe-Remove "build.zip"
Copy-Item "spotly-deployment.zip" "build.zip" -Force
Write-Host "Build Archive created: build.zip ($cwpSize MB)"

Safe-Remove "dist.zip"
Compress-Archive -Path "dist" -DestinationPath "dist.zip" -Force
$distSize = [math]::Round((Get-Item "dist.zip").Length / 1MB, 2)
Write-Host "Dist Archive created: dist.zip ($distSize MB)"

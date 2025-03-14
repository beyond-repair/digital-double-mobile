$ErrorActionPreference = 'Stop'

function Test-AdminPrivileges {
    return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Shellcheck {
    $shellcheckUrl = "https://github.com/koalaman/shellcheck/releases/download/v0.9.0/shellcheck-v0.9.0.zip"
    $tempPath = Join-Path $env:TEMP "shellcheck.zip"
    $extractPath = Join-Path $env:TEMP "shellcheck"
    $userBinPath = Join-Path $env:USERPROFILE ".local\bin"
    $systemPath = "C:\Program Files\shellcheck"
    
    try {
        # Create user bin directory if it doesn't exist
        if (-not (Test-Path $userBinPath)) {
            New-Item -ItemType Directory -Path $userBinPath -Force | Out-Null
        }

        Write-Host "Downloading shellcheck..."
        Invoke-WebRequest -Uri $shellcheckUrl -OutFile $tempPath

        # Extract the zip file
        Write-Host "Extracting shellcheck..."
        Expand-Archive -Path $tempPath -DestinationPath $extractPath -Force

        $shellcheckExe = Get-ChildItem -Path $extractPath -Recurse -Filter "shellcheck.exe" | Select-Object -First 1

        if ($null -eq $shellcheckExe) {
            throw "shellcheck.exe not found in the extracted files"
        }

        $installPath = if (Test-AdminPrivileges) { $systemPath } else { $userBinPath }
        
        if (-not (Test-Path $installPath)) {
            New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        }

        Copy-Item $shellcheckExe.FullName -Destination (Join-Path $installPath "shellcheck.exe") -Force

        # Add to PATH if needed
        if (-not (Test-AdminPrivileges)) {
            $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            if ($userPath -notlike "*$userBinPath*") {
                [Environment]::SetEnvironmentVariable("PATH", "$userPath;$userBinPath", "User")
            }
        }

        # Refresh current session PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Test shellcheck using full path first
        $shellcheckPath = Join-Path $installPath "shellcheck.exe"
        if (-not (Test-Path $shellcheckPath)) {
            throw "Shellcheck executable not found at $shellcheckPath"
        }

        # Test the installation
        $testResult = & $shellcheckPath --version
        if (-not $?) {
            throw "Shellcheck verification failed"
        }

        Write-Host "Shellcheck installed successfully to $installPath"
        return $true
    }
    catch {
        Write-Error "Failed to install shellcheck: $_"
        return $false
    }
    finally {
        # Cleanup
        if (Test-Path $tempPath) { Remove-Item $tempPath -Force }
        if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
    }
    
    return $true
}

if (-not (Test-AdminPrivileges)) {
    Write-Warning "Script is not running with administrator privileges"
    Write-Host "Attempting to install shellcheck in user space..."
}

if (Install-Shellcheck) {
    # Refresh PATH one more time
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Try both full path and PATH-based command
    $shellcheckPath = if (Test-AdminPrivileges) { 
        "C:\Program Files\shellcheck\shellcheck.exe" 
    } else { 
        Join-Path $env:USERPROFILE ".local\bin\shellcheck.exe" 
    }

    if ((Test-Path $shellcheckPath) -and (& $shellcheckPath --version)) {
        Write-Host "Shellcheck installation verified successfully"
        exit 0
    }
}

Write-Error "Failed to install shellcheck. Please try installing it manually."
exit 1

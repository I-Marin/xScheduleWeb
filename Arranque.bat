@echo off

:xLights
for /F "skip=2" %%I in ('%SystemRoot%\System32\tasklist.exe /FI "IMAGENAME eq xLights.exe" 2^>nul') do (
    if /I "%%I" == "xLights.exe" goto :xSchedule
)
:: Aqui llega si el xLights no este iniciado
echo xLights no esta abierto
cd /d C:/Program Files/xLights
start "" "C:/Program Files/xLights/xLights.exe"

:xSchedule
for /F "skip=2" %%I in ('%SystemRoot%\System32\tasklist.exe /FI "IMAGENAME eq xSchedule.exe" 2^>nul') do (
    if /I "%%I" == "xSchedule.exe" goto :webServer
)
:: Aqui llega si el xSchedule no este iniciado
echo xSchedule no esta abierto
cd /d C:/Program Files/xLights
start "" "C:/Program Files/xLights/xSchedule.exe"

:webServer
cd C:/Program Files/xLights/xScheduleWeb
for /f %%i in ('serverInitArrancado.bat') do (
    if /I "%%i" == "Open" goto :end
)
:: Aqui llega si el webServer no este iniciado
echo webServer no esta abierto

start "serverInit.exe" "C:/Program Files/xLights/xScheduleWeb/serverInit.bat"

:end
timeout 5
goto :xLights
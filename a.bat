@echo off
setlocal EnableDelayedExpansion

REM Set output file
set "output=sample.txt"

REM Clear existing output file if it exists
if exist "%output%" del "%output%"

REM Write header
echo Merged File Contents > "%output%"
echo =================== >> "%output%"
echo. >> "%output%"

REM Process and merge files
for %%F in (
    "collect.py"
    "client\package-lock.json"
    "client\package.json"
    "client\public\index.html"
    "client\public\style.css"
    "client\src\App.css"
    "client\src\App.js"
    "client\src\index.js"
    "client\src\script.js"
    "client\src\components\Login.js"
    "client\src\components\Register.js"
    "client\src\components\Wallet.js"
    "server\.env"
    "server\blockchain.js"
    "server\package-lock.json"
    "server\package.json"
    "server\server.js"
    "server\middleware\auth.js"
    "server\models\Token.js"
    "server\models\Transaction.js"
    "server\models\User.js"
    "server\routes\auth.js"
) do (
    echo Processing %%F
    echo. >> "%output%"
    echo [START OF %%F] >> "%output%"
    echo. >> "%output%"
    if exist "%%F" (
        type "%%F" >> "%output%"
    ) else (
        echo [File not found] >> "%output%"
    )
    echo. >> "%output%"
    echo [END OF %%F] >> "%output%"
    echo. >> "%output%"
)

echo. >> "%output%"
echo Collection complete. Merged contents saved to %output%
pause
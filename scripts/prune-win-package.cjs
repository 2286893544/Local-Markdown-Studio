const fs = require('node:fs');
const path = require('node:path');

const packageDir = path.join(__dirname, '..', 'dist', 'Local Markdown Studio-win32-x64');
const localesDir = path.join(packageDir, 'locales');
const keptLocales = new Set(['en-US.pak', 'zh-CN.pak']);
const registerScriptPath = path.join(packageDir, 'register-md-association.cmd');

if (!fs.existsSync(packageDir)) {
  throw new Error(`Windows package not found: ${packageDir}`);
}

if (fs.existsSync(localesDir)) {
  for (const fileName of fs.readdirSync(localesDir)) {
    if (!keptLocales.has(fileName)) {
      fs.rmSync(path.join(localesDir, fileName), { force: true });
    }
  }
}

writeMarkdownAssociationScript();

console.log(`Pruned Windows package locales. Kept: ${[...keptLocales].join(', ')}`);
console.log(`Wrote Markdown association script: ${registerScriptPath}`);

function writeMarkdownAssociationScript() {
  const script = String.raw`@echo off
setlocal

set "APP_EXE=%~dp0Local Markdown Studio.exe"
if not exist "%APP_EXE%" (
  echo Local Markdown Studio.exe was not found next to this script.
  echo Please run this script from the packaged app folder.
  exit /b 1
)

reg add "HKCU\Software\Classes\LocalMarkdownStudio.Markdown" /ve /d "Markdown Document" /f
reg add "HKCU\Software\Classes\LocalMarkdownStudio.Markdown\DefaultIcon" /ve /d "\"%APP_EXE%\",0" /f
reg add "HKCU\Software\Classes\LocalMarkdownStudio.Markdown\shell\open\command" /ve /d "\"%APP_EXE%\" \"%%1\"" /f

reg add "HKCU\Software\Classes\.md" /ve /d "LocalMarkdownStudio.Markdown" /f
reg add "HKCU\Software\Classes\.md\OpenWithProgids" /v "LocalMarkdownStudio.Markdown" /t REG_NONE /f

reg add "HKCU\Software\Classes\.markdown" /ve /d "LocalMarkdownStudio.Markdown" /f
reg add "HKCU\Software\Classes\.markdown\OpenWithProgids" /v "LocalMarkdownStudio.Markdown" /t REG_NONE /f

echo.
echo Registered .md and .markdown for Local Markdown Studio.
echo If Windows still opens another app, use Open with - Choose another app - Local Markdown Studio - Always.
`;

  fs.writeFileSync(registerScriptPath, script.replace(/\n/g, '\r\n'));
}

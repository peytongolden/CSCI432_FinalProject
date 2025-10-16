@echo off
echo This script will:
echo 1) Add node_modules/ to .gitignore (if not present)
echo 2) Remove tracked node_modules from the git index (keeps files locally)
echo 3) Add .gitattributes and renormalize line endings
echo 
setlocal

REM Ensure .gitignore has node_modules entry
findstr /C:"node_modules/" .gitignore >nul 2>&1
if errorlevel 1 (
  echo node_modules/ >> .gitignore
  echo Added node_modules/ to .gitignore
) else (
  echo .gitignore already contains node_modules/
)

REM Remove tracked node_modules from index (keeps files)
git rm -r --cached node_modules 2>nul
if errorlevel 1 (
  echo node_modules were not tracked or git failed to remove them from index
) else (
  echo Removed node_modules from git index
)

REM Ensure .gitattributes exists
if not exist .gitattributes (
  echo * text=auto eol=crlf> .gitattributes
  echo Created .gitattributes with eol=crlf
) else (
  echo .gitattributes already exists
)

REM Renormalize
git add --renormalize . 2>nul
echo Renormalize completed (check git status for changed files)

echo Done. Review changes with: git status
pause
endlocal
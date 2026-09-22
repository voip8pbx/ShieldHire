@echo off
cd android
call gradlew.bat assembleDebug --stacktrace --info
pause

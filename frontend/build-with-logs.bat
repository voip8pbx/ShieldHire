@echo off
cd android
call gradlew.bat assembleDebug --stacktrace 2&gt;error.txt 1&gt;output.txt
echo Build complete. Check output.txt and error.txt for details.

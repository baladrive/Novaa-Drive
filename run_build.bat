@echo off
cd /d "d:\New project\desktop-bala photos"
call npx tsc --noEmit > build_output.txt 2>&1
echo DONE >> build_output.txt
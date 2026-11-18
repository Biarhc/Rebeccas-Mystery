@echo off
cd /d "%~dp0"
title Abrindo no Godot Editor...
start "" "Z:\DW\jogo\Godot_v4.7.2-stable_win64.exe" -e --path "%~dp0"
exit

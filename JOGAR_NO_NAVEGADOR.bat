@echo off
title Rebecca's Mystery - Versao Web
echo Iniciando o servidor local do jogo...
cd /d "%~dp0..\Rebecca's Mystery - Copia"
start "" http://127.0.0.1:5000
python app.py


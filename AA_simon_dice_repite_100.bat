@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

FOR /L %%i IN (1,1,100) DO (
    copy /Y simon_dice_amarillo.fseq simon_dice_amarillo_%%i.fseq > nul
    copy /Y simon_dice_amarillo.xsq simon_dice_amarillo_%%i.xsq > nul

    copy /Y simon_dice_verde.fseq simon_dice_verde_%%i.fseq > nul
    copy /Y simon_dice_verde.xsq simon_dice_verde_%%i.xsq > nul

    copy /Y simon_dice_azul.fseq simon_dice_azul_%%i.fseq > nul
    copy /Y simon_dice_azul.xsq simon_dice_azul_%%i.xsq > nul

    copy /Y simon_dice_rojo.fseq simon_dice_rojo_%%i.fseq > nul
    copy /Y simon_dice_rojo.xsq simon_dice_rojo_%%i.xsq > nul


)

echo Se han creado 100 archivos.


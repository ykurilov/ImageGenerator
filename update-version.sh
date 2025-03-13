#!/bin/bash

# Генерация версии на основе текущей даты и времени
VERSION=$(date +%Y%m%d%H%M)

# Обновление версий в HTML-файле
sed -i '' "s/styles\.css?v=[0-9a-zA-Z]*/styles.css?v=$VERSION/g" index.html
sed -i '' "s/script\.js?v=[0-9a-zA-Z]*/script.js?v=$VERSION/g" index.html

echo "Версии успешно обновлены до $VERSION" 
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Функция для генерации хеша содержимого файла
function generateFileHash(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const hash = crypto.createHash('md5').update(fileContent).digest('hex');
        return hash.substring(0, 8); // Используем только первые 8 символов хеша
    } catch (error) {
        console.error(`Ошибка при чтении файла ${filePath}:`, error);
        return Date.now().toString().substring(0, 8); // Запасной вариант
    }
}

// Обновление версий в HTML-файле на основе хешей
function updateVersionsWithHashes() {
    const htmlPath = path.join(__dirname, 'index.html');
    const cssPath = path.join(__dirname, 'styles.css');
    const jsPath = path.join(__dirname, 'script.js');
    
    const cssHash = generateFileHash(cssPath);
    const jsHash = generateFileHash(jsPath);
    
    fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка при чтении HTML файла:', err);
            return;
        }
        
        // Обновление версий CSS и JS файлов
        const updatedHTML = data
            .replace(/styles\.css\?v=[\w\d]+/g, `styles.css?v=${cssHash}`)
            .replace(/script\.js\?v=[\w\d]+/g, `script.js?v=${jsHash}`);
        
        fs.writeFile(htmlPath, updatedHTML, 'utf8', (err) => {
            if (err) {
                console.error('Ошибка при записи HTML файла:', err);
                return;
            }
            console.log(`Версии успешно обновлены: CSS=${cssHash}, JS=${jsHash}`);
        });
    });
}

// Запуск обновления версий
updateVersionsWithHashes();

console.log('Для обновления версий выполните:');
console.log('npm run hash-version'); 
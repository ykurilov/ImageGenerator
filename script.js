// Function to generate a random UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Закодированные API ключи (используем простое кодирование Base64)
// Это обеспечивает минимальную защиту от случайного обнаружения ключей при просмотре исходного кода
const encodedOpenAI = 'c2stc3ZjYWNjdC15SEdhM2hsQVR6Z080VTlLeWphV0gwMlhfYl9SaDh4eUZEOEdRS2dRNnR3bl9sTF9EMUxDNmI4WGt1aXZZZlJOV2NDZjF1OUl0ZFQzQmxia0ZKTnVyRXpPZHloT3ZvTEFabFpxdmItSGtqaEZ5VVVqdkJlZlB4UU1BYzdEa1VINXpTSnNnQkVxUWc2QldUR2NpX3VUOFFjUWVFd0E=';
const encodedRunWare = 'MDNnNUVlWm50eGhqZ1RTOEg4bFhBN3hwQU1yRnJmOTg=';

// Декодирование ключей
function decodeBase64(encoded) {
    return atob(encoded);
}

// Объект для хранения API ключей
const CONFIG = {
    OPENAI_API_KEY: decodeBase64(encodedOpenAI),
    RUNWARE_API_KEY: decodeBase64(encodedRunWare)
};

// Глобальная переменная для хранения текущей выбранной модели
let selectedModel = 'juggernaut';

// Инициализация обработчиков для выбора модели
function initModelSelectors() {
    const modelSelect = document.getElementById('model-select');
    
    // Установка начального значения
    selectedModel = modelSelect.value;
    
    // Обработчик изменения
    modelSelect.addEventListener('change', function() {
        selectedModel = this.value;
        console.log(`Выбрана модель: ${selectedModel === 'flux' ? 'Flux Dev' : 'Juggernaut Pro Flux'}`);
    });
}

// Функция для настройки обработчиков кликов по изображениям
function setupGalleryImageClicks() {
    const galleryImages = document.querySelectorAll('.image-item img');
    const allImageSources = Array.from(galleryImages).map(img => img.src);
    
    galleryImages.forEach(img => {
        img.addEventListener('click', function() {
            openImageViewer(this.src, allImageSources);
        });
    });
}

// Функция для открытия просмотрщика изображений
function openImageViewer(imageSrc, allImages) {
    const imageViewer = document.getElementById('image-viewer');
    const viewerImage = document.getElementById('viewer-image');
    
    if (!imageViewer || !viewerImage) return;
    
    viewerImage.src = imageSrc;
    window.currentImages = allImages;
    window.currentIndex = allImages.indexOf(imageSrc);
    
    imageViewer.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Предотвращаем прокрутку страницы
}

// Функция для закрытия просмотрщика
function closeImageViewer() {
    const imageViewer = document.getElementById('image-viewer');
    if (!imageViewer) return;
    
    imageViewer.style.display = 'none';
    document.body.style.overflow = 'auto'; // Возвращаем прокрутку страницы
}

// Навигация к предыдущему изображению
function showPreviousImage() {
    const viewerImage = document.getElementById('viewer-image');
    if (!viewerImage || window.currentImages.length <= 1) return;
    
    window.currentIndex = (window.currentIndex - 1 + window.currentImages.length) % window.currentImages.length;
    viewerImage.src = window.currentImages[window.currentIndex];
}

// Навигация к следующему изображению
function showNextImage() {
    const viewerImage = document.getElementById('viewer-image');
    if (!viewerImage || window.currentImages.length <= 1) return;
    
    window.currentIndex = (window.currentIndex + 1) % window.currentImages.length;
    viewerImage.src = window.currentImages[window.currentIndex];
}

// Функция для улучшения запроса с помощью ChatGPT
async function enhancePrompt() {
    const promptInput = document.getElementById('prompt');
    const userPrompt = promptInput.value.trim();
    
    if (!userPrompt) {
        alert('Пожалуйста, введите запрос для улучшения!');
        return;
    }
    
    // Отображаем индикатор загрузки на кнопке
    const enhanceButton = document.getElementById('enhance-prompt');
    const originalButtonText = enhanceButton.innerHTML;
    enhanceButton.innerHTML = '⏳';
    enhanceButton.disabled = true;
    
    try {
        // Определяем, запущено ли приложение локально
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname === '';  // Для file:// протокола
        
        let enhancedPrompt;
        
        if (isLocalhost) {
            // Локальная разработка - прямой запрос к API OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an image prompt generator. Your task is to expand the given text according to the following structure: {style}, {object and details}, {location if applicable}, {style description}. By default, use "a photo of" as the style. But only if other style wasn\'t mentioned. If other style was mention, then use this style and don\'t use photo style. In the style description, specify camera name and settings (only if it\'s photo or cinematic style). However, if I indicate a different style, describe keywords that would be more suitable for that style. Write the prompt in English.'
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }
            
            const data = await response.json();
            enhancedPrompt = data.choices[0]?.message?.content;
            
            if (!enhancedPrompt) {
                throw new Error('Не удалось получить улучшенный запрос');
            }
        } else {
            // GitHub Pages - используем Cloudflare Worker
            const response = await fetch('https://openai-proxy.ykurilov.workers.dev/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: userPrompt
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            enhancedPrompt = data.enhancedPrompt;
            
            if (!enhancedPrompt) {
                throw new Error('Не удалось получить улучшенный запрос');
            }
        }
        
        // Устанавливаем полученный результат
        promptInput.value = enhancedPrompt;
        
        // Анимация подсветки поля ввода для обратной связи пользователю
        promptInput.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
        setTimeout(() => {
            promptInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка при улучшении запроса:', error);
        alert(`Ошибка при улучшении запроса: ${error.message}`);
    } finally {
        // Восстанавливаем кнопку
        enhanceButton.innerHTML = originalButtonText;
        enhanceButton.disabled = false;
    }
}

// Function to send request and display images
async function generateImages() {
    const prompt = document.getElementById('prompt').value;
    if (!prompt) {
        alert('Пожалуйста, введите запрос!');
        return;
    }

    // Get selected resolution
    const selectedResolution = document.querySelector('input[name="resolution"]:checked').value;
    let width, height;
    
    // Set width and height based on selected resolution
    switch(selectedResolution) {
        case 'square':
            width = 1024;
            height = 1024;
            break;
        case 'horizontal':
            width = 1344;
            height = 768;
            break;
        case 'vertical':
            width = 768;
            height = 1344;
            break;
        default:
            width = 1024;
            height = 1024;
    }

    // Get selected number of images
    const imageCountSelect = document.getElementById('image-count');
    const numberResults = parseInt(imageCountSelect.value) || 2; // Default to 2 if not found or invalid

    // Показываем лоадер
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    
    // Убираем предыдущие сообщения об ошибках, если они есть
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.remove());
    
    // НЕ очищаем предыдущие картинки, а будем добавлять новые перед ними
    const imagesDiv = document.getElementById('images');

    const taskUUID = generateUUID();
    const apiKey = CONFIG.RUNWARE_API_KEY;
    const url = 'https://api.runware.ai/v1';

    // Получаем параметры Lora-модели
    const isLoraEnabled = document.getElementById('lora-toggle').checked;
    const loraWeight = parseFloat(document.getElementById('lora-weight-input').value);
    
    // Получаем выбранную модель
    const modelId = selectedModel === 'juggernaut' ? "rundiffusion:130@100" : "runware:101@1";
    console.log(`Используется модель: ${selectedModel} (${modelId})`);
    
    // Создаем основную часть запроса
    const requestBodyBase = {
        "taskType": "imageInference",
        "taskUUID": taskUUID,
        "positivePrompt": prompt,
        "model": modelId, // Используем выбранную модель
        "width": width,
        "height": height,
        "numberResults": numberResults, // Используем выбранное количество
        "outputFormat": "JPEG",
        "steps": selectedModel === 'juggernaut' ? 33 : 28,
        "CFGScale": selectedModel === 'juggernaut' ? 3 : 3.5,
        "scheduler": selectedModel === 'juggernaut' ? "Euler Beta" : "FlowMatchEulerDiscreteScheduler",
        "outputType": ["URL"],
        "includeCost": false
    };
    
    // Добавляем Lora параметры, только если включены
    if (isLoraEnabled) {
        requestBodyBase.lora = [
            {
                "model": "ykurilov:1@1",
                "weight": loraWeight
            }
        ];
    }
    
    const requestBody = [requestBodyBase];

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        // Скрываем лоадер после получения ответа
        loader.style.display = 'none';

        if (result.data && result.data.length > 0) {
            // Создаем контейнер для новой группы изображений
            const newImagesGroup = document.createElement('div');
            newImagesGroup.className = 'images-group';
            newImagesGroup.style.display = 'contents'; // Чтобы не нарушать сетку

            // Добавляем метку времени в виде скрытого атрибута для возможной сортировки
            const timestamp = new Date().getTime();
            const formattedDate = new Date(timestamp).toLocaleString();
            newImagesGroup.dataset.timestamp = timestamp;
            newImagesGroup.dataset.prompt = prompt;
            
            // Создаем заголовок группы изображений
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.style.gridColumn = '1 / -1'; // Занимает всю ширину строки
            
            const promptText = document.createElement('span');
            promptText.className = 'prompt-text';
            promptText.textContent = `"${prompt}"`;
            
            const dateText = document.createElement('span');
            dateText.className = 'date-text';
            dateText.textContent = formattedDate;
            
            groupHeader.appendChild(promptText);
            groupHeader.appendChild(dateText);
            newImagesGroup.appendChild(groupHeader);
            
            // Добавляем изображения в группу
            result.data.forEach(item => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-item';
                
                const img = document.createElement('img');
                img.src = item.imageURL;
                img.alt = `Generated image for: ${prompt}`;
                img.loading = 'lazy'; // Ленивая загрузка изображений
                
                // Устанавливаем правильное соотношение сторон для разных разрешений
                if (selectedResolution === 'square') {
                    img.style.aspectRatio = '1';
                } else if (selectedResolution === 'horizontal') {
                    img.style.aspectRatio = '1344/768';
                } else if (selectedResolution === 'vertical') {
                    img.style.aspectRatio = '768/1344';
                }
                
                imgContainer.appendChild(img);
                newImagesGroup.appendChild(imgContainer);
            });
            
            // Добавляем новые изображения в начало
            if (imagesDiv.firstChild) {
                imagesDiv.insertBefore(newImagesGroup, imagesDiv.firstChild);
            } else {
                imagesDiv.appendChild(newImagesGroup);
            }
            
            // Обновляем обработчики кликов для всех изображений в галерее
            setupGalleryImageClicks();
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Изображения не были сгенерированы. Проверьте консоль для деталей.';
            
            // Добавляем сообщение об ошибке перед существующими изображениями
            if (imagesDiv.firstChild) {
                imagesDiv.insertBefore(errorMessage, imagesDiv.firstChild);
            } else {
                imagesDiv.appendChild(errorMessage);
            }
            
            console.log(result);
        }
    } catch (error) {
        // Скрываем лоадер в случае ошибки
        loader.style.display = 'none';
        console.error('Error:', error);
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Ошибка при генерации изображений. Попробуйте снова.';
        
        // Добавляем сообщение об ошибке перед существующими изображениями
        const imagesDiv = document.getElementById('images');
        if (imagesDiv.firstChild) {
            imagesDiv.insertBefore(errorMessage, imagesDiv.firstChild);
        } else {
            imagesDiv.appendChild(errorMessage);
        }
    }
}

// Добавляем обработчик события для кнопки улучшения запроса
document.addEventListener('DOMContentLoaded', function() {
    // Предотвращаем навигацию назад при горизонтальном свайпе
    disableSwipeBackNavigation();
    
    // Обработчик для кнопки улучшения запроса
    const enhanceButton = document.getElementById('enhance-prompt');
    if (enhanceButton) {
        enhanceButton.addEventListener('click', enhancePrompt);
    }
    
    // Обработчики для элементов управления весом Lora
    const weightSlider = document.getElementById('lora-weight');
    const weightInput = document.getElementById('lora-weight-input');
    
    if (weightSlider && weightInput) {
        // Синхронизация слайдера и поля ввода
        weightSlider.addEventListener('input', function() {
            weightInput.value = this.value;
        });
        
        weightInput.addEventListener('input', function() {
            // Ограничиваем ввод значениями от 0 до 2
            let value = parseFloat(this.value);
            if (isNaN(value)) value = 0;
            if (value > 2) value = 2;
            if (value < 0) value = 0;
            
            // Устанавливаем значение слайдера
            weightSlider.value = value;
        });
    }
    
    // Обработчик для переключателя Lora
    const loraToggle = document.getElementById('lora-toggle');
    const loraWeightControl = document.querySelector('.lora-weight-control');
    
    if (loraToggle && loraWeightControl) {
        // Функция для обновления видимости контрола веса
        function updateWeightControlVisibility() {
            const loraControlsElement = document.querySelector('.lora-controls');
            
            if (loraToggle.checked) {
                loraWeightControl.style.display = 'block';
                loraControlsElement.classList.remove('lora-collapsed');
                loraControlsElement.classList.add('lora-expanded');
            } else {
                loraWeightControl.style.display = 'none';
                loraControlsElement.classList.remove('lora-expanded');
                loraControlsElement.classList.add('lora-collapsed');
            }
        }
        
        // Устанавливаем начальное состояние
        updateWeightControlVisibility();
        
        // Обновляем при изменении переключателя
        loraToggle.addEventListener('change', updateWeightControlVisibility);
    }
    
    // Настройка обработчиков для просмотрщика изображений
    const imageViewer = document.getElementById('image-viewer');
    const closeViewer = document.querySelector('.close-viewer');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    // Инициализируем глобальные переменные
    window.currentImages = [];
    window.currentIndex = 0;
    
    // Добавляем обработчики событий для просмотрщика
    if (closeViewer) {
        closeViewer.addEventListener('click', closeImageViewer);
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', showPreviousImage);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', showNextImage);
    }
    
    // Закрытие при клике вне изображения
    if (imageViewer) {
        imageViewer.addEventListener('click', function(event) {
            if (event.target === imageViewer) {
                closeImageViewer();
            }
        });
    }
    
    // Навигация с помощью клавиш
    document.addEventListener('keydown', function(event) {
        if (imageViewer.style.display !== 'block') return;
        
        switch (event.key) {
            case 'Escape':
                closeImageViewer();
                break;
            case 'ArrowLeft':
                showPreviousImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    });
    
    // Первоначальная настройка обработчиков для существующих изображений
    setupGalleryImageClicks();
    
    // Добавляем обработчик для кнопки случайного промпта
    document.getElementById('random-prompt').addEventListener('click', generateRandomPrompt);
    
    // Инициализация селекторов модели
    initModelSelectors();
});

// Функция для отключения навигации "назад" при горизонтальном свайпе
function disableSwipeBackNavigation() {
    // Обрабатываем события для десктопных браузеров
    document.addEventListener('mousedown', handleStart, { passive: false });
    document.addEventListener('mousemove', handleMove, { passive: false });
    
    // Обрабатываем события для мобильных устройств
    document.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    
    let startX = 0;
    let startY = 0;
    let moveThreshold = 100; // Порог для определения свайпа
    
    function handleStart(e) {
        // Сохраняем начальные координаты касания/клика
        startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
        startY = e.type === 'mousedown' ? e.pageY : e.touches[0].pageY;
    }
    
    function handleMove(e) {
        if (!startX || !startY) return;
        
        let currentX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
        let currentY = e.type === 'mousemove' ? e.pageY : e.touches[0].pageY;
        
        let diffX = startX - currentX;
        let diffY = startY - currentY;
        
        // Если это горизонтальный свайп (больше по X, чем по Y)
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Если свайп достаточно сильный и направлен влево или вправо
            if (Math.abs(diffX) > moveThreshold) {
                // Предотвращаем стандартное поведение (навигацию назад)
                e.preventDefault();
                
                // Сбрасываем для предотвращения повторного срабатывания
                startX = 0;
                startY = 0;
            }
        }
    }
}

// Функция для генерации случайного промпта с персонажем
async function generateRandomPrompt() {
    const promptInput = document.getElementById('prompt');
    
    // Отображаем загрузку
    const randomButton = document.getElementById('random-prompt');
    const originalButtonText = randomButton.innerHTML;
    randomButton.innerHTML = '⏳';
    randomButton.disabled = true;
    promptInput.value = "Генерация идеи...";
    
    try {
        // Проверяем, включена ли Lora
        const isLoraEnabled = document.getElementById('lora-toggle').checked;
        
        // Определяем, запущено ли приложение локально
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname === '';  // Для file:// протокола
        
        let generatedPrompt;
        
        if (isLocalhost) {
            // Локальная разработка - прямой запрос к API OpenAI
            const systemMessage = 'You are an image prompt generator specialized in creating creative and diverse scenarios. Your prompts should be detailed, visually descriptive, and engage imagination. Always respond in English only.';
            
            // Формируем запрос в зависимости от состояния Lora
            const userMessage = isLoraEnabled
                ? `Create a random, detailed image generation prompt where 'ohwx man with a beard' is the main character. Place the character in a usual or an unexpected situation. Photo, cinematic or some interesting artistic style. Use diverse attributes, environments, and visual elements to create a vivid scene. Structure your response following this pattern: {style}, {ohwx man with beard with specific details}, {location with atmosphere}, {technical aspects like lighting, camera specs, style keywords}. DO NOT use the words 'prompt' or 'request' in your answer - just give me the ready-to-use text. Keep your response to 1-3 sentences max. Respond in English only.`
                : `Create a random, detailed image generation prompt with an interesting character in usual or an unexpected situation. Photo, cinematic or artistic style. Use diverse attributes, environments, and visual elements to create a vivid scene. Structure your response following this pattern: {style}, {character with specific details}, {location with atmosphere}, {technical aspects like lighting, camera specs, style keywords}. DO NOT use the words 'prompt' or 'request' in your answer - just give me the ready-to-use text. Keep your response to 1-3 sentences max. Respond in English only.`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: systemMessage
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    temperature: 0.9,
                    max_tokens: 250
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }
            
            const data = await response.json();
            generatedPrompt = data.choices[0]?.message?.content;
            
            if (!generatedPrompt) {
                throw new Error('Не удалось получить случайный запрос');
            }
        } else {
            // GitHub Pages - используем Cloudflare Worker
            // Временный режим отладки - показывает ошибки и отправляемые данные
            try {
                console.log('Отправка запроса в Cloudflare Worker с параметрами:', {
                    randomPrompt: true,
                    loraEnabled: isLoraEnabled
                });
                
                const response = await fetch('https://openai-proxy.ykurilov.workers.dev/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        randomPrompt: true,
                        loraEnabled: isLoraEnabled
                    })
                });
                
                console.log('Статус ответа:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Текст ошибки:', errorText);
                    throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                console.log('Полученные данные:', data);
                
                if (!data.generatedPrompt) {
                    console.error('В ответе нет generatedPrompt:', data);
                    
                    // Временный фоллбэк - сгенерировать промпт локально, если сервер не вернул его
                    generatedPrompt = isLoraEnabled 
                        ? "Concept art, ohwx man with a beard wearing a steampunk outfit with brass goggles, in a Victorian laboratory filled with tesla coils and brass instruments, dramatic lighting, detailed textures, 4K resolution"
                        : "Pixel art, brave explorer with a map and compass, standing on a cliff overlooking a fantasy landscape with floating islands, vibrant colors, nostalgic 16-bit style";
                } else {
                    generatedPrompt = data.generatedPrompt;
                }
            } catch (fetchError) {
                console.error('Ошибка при выполнении fetch запроса:', fetchError);
                
                // Временный фоллбэк - сгенерировать промпт локально, если произошла ошибка
                generatedPrompt = isLoraEnabled 
                    ? "Watercolor painting, ohwx man with a beard in a cozy library, surrounded by floating books and magical glowing orbs, warm ambient lighting, soft brushstrokes, dreamy atmosphere"
                    : "Digital illustration, cyberpunk detective with neon hair, in a rainy futuristic cityscape with holographic advertisements, neon lighting, reflective puddles, cinematic composition";
            }
        }
        
        // Устанавливаем полученный результат
        promptInput.value = generatedPrompt;
        
        // Анимация подсветки поля ввода для обратной связи пользователю
        promptInput.style.backgroundColor = 'rgba(106, 17, 203, 0.2)';
        setTimeout(() => {
            promptInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка при генерации случайного запроса:', error);
        promptInput.value = 'Ошибка. Попробуйте снова';
    } finally {
        // Восстанавливаем кнопку
        randomButton.innerHTML = originalButtonText;
        randomButton.disabled = false;
    }
}

// Обновляем функцию инициализации, чтобы добавить инициализацию селекторов модели
async function init() {
    // ... existing code ...
    initLoraControls();
    initModelSelectors(); // Добавляем инициализацию селекторов модели
    // ... existing code ...
}

// Обновить функцию generateImage, чтобы она использовала выбранную модель
async function generateImage() {
    // ... existing code ...
    
    // Добавляем параметр модели в запрос
    const modelParameter = selectedModel === 'juggernaut' ? 'juggernaut' : 'flux';
    
    // ... existing code ...
    
    // Обновляем параметры в запросе
    const data = {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        width: parseInt(widthSelect.value),
        height: parseInt(heightSelect.value),
        model: modelParameter,
        // ... other existing parameters ...
    };
    
    // ... existing code ...
}
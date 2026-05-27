// HomeMonitor Russian UI overlay for the upstream RuView interface.
// Keeps domain terms such as CSI, RSSI, API, WebSocket, LoRA, RVF, PCK, OKS,
// FPS, WiFi DensePose, Pose Fusion, and Observatory in English.

const translations = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.hardware': 'Hardware',
    'nav.demo': 'Live Demo',
    'nav.architecture': 'Architecture',
    'nav.performance': 'Performance',
    'nav.applications': 'Applications',
    'nav.sensing': 'Sensing',
    'nav.training': 'Training',
    'dashboard.title': 'Revolutionary WiFi-Based Human Pose Detection',
    'dashboard.subtitle': 'Human Tracking Through Walls Using WiFi Signals',
    'dashboard.status': 'System Status',
    'dashboard.metrics': 'System Metrics',
    'dashboard.features': 'Features',
    'dashboard.liveStats': 'Live Statistics',
    'metrics.cpu': 'CPU Usage',
    'metrics.memory': 'Memory Usage',
    'metrics.disk': 'Disk Usage',
    'misc.language': 'Language'
  },
  ru: {
    'nav.dashboard': 'Панель',
    'nav.hardware': 'Оборудование',
    'nav.demo': 'Live Demo',
    'nav.architecture': 'Архитектура',
    'nav.performance': 'Метрики',
    'nav.applications': 'Сценарии',
    'nav.sensing': 'Sensing',
    'nav.training': 'Обучение',
    'dashboard.title': 'Определение позы человека по WiFi',
    'dashboard.subtitle': 'Отслеживание человека через стены по WiFi-сигналам',
    'dashboard.status': 'Состояние системы',
    'dashboard.metrics': 'Метрики системы',
    'dashboard.features': 'Возможности',
    'dashboard.liveStats': 'Live-статистика',
    'metrics.cpu': 'CPU',
    'metrics.memory': 'Память',
    'metrics.disk': 'Диск',
    'misc.language': 'Язык'
  }
};

const exactRu = {
  // Navigation and global shell
  'Dashboard': 'Панель',
  'Hardware': 'Оборудование',
  'Live Demo': 'Live Demo',
  'Architecture': 'Архитектура',
  'Performance': 'Метрики',
  'Applications': 'Сценарии',
  'Sensing': 'Sensing',
  'Training': 'Обучение',
  'Settings': 'Настройки',
  'Quick settings': 'Быстрые настройки',
  'Language': 'Язык',
  'Notifications': 'Уведомления',
  'Notification history': 'История уведомлений',
  'No notifications': 'Нет уведомлений',
  'Mark read': 'Прочитано',
  'Clear': 'Очистить',
  'Close': 'Закрыть',
  'Dismiss': 'Закрыть',
  'Cancel': 'Отмена',
  'Confirm': 'Подтвердить',
  'Refresh': 'Обновить',
  'Load': 'Загрузить',
  'Delete': 'Удалить',
  'Unload': 'Выгрузить',
  'None': 'Нет',
  '-- none --': '-- нет --',
  'Ready': 'Готово',
  'Idle': 'Ожидание',
  'Loading...': 'Загрузка...',
  'Initializing...': 'Инициализация...',
  'Unknown': 'Неизвестно',
  'Never': 'Никогда',
  'Connected': 'Подключено',
  'Disconnected': 'Отключено',
  'Connecting...': 'Подключение...',
  'Reconnecting...': 'Переподключение...',
  'Attempting to connect...': 'Пытаюсь подключиться...',
  'Offline': 'Нет связи',
  'OFFLINE': 'НЕТ СВЯЗИ',
  'HEALTHY': 'НОРМА',
  'Healthy': 'Норма',
  'SIMULATED': 'СИМУЛЯЦИЯ',
  'RECONNECTING': 'ПЕРЕПОДКЛЮЧЕНИЕ',
  'DEMO': 'ДЕМО',
  'LIVE': 'LIVE',
  'Good': 'Хорошо',
  'Poor': 'Плохо',
  'On': 'Вкл',
  'Off': 'Выкл',

  // Dashboard
  'WiFi DensePose': 'WiFi DensePose',
  'Human Tracking Through Walls Using WiFi Signals': 'Отслеживание человека через стены по WiFi-сигналам',
  'Revolutionary WiFi-Based Human Pose Detection': 'Определение позы человека по WiFi',
  'AI can track your full-body movement through walls using just WiFi signals. Researchers at Carnegie Mellon have trained a neural network to turn basic WiFi signals into detailed wireframe models of human bodies.':
    'AI может отслеживать движения тела через стены, используя только WiFi-сигналы. Исследователи Carnegie Mellon обучили нейросеть превращать WiFi-сигналы в подробные каркасные модели человека.',
  'System Status': 'Состояние системы',
  'API Server': 'API Server',
  'Inference': 'Inference',
  'Streaming': 'Streaming',
  'Data Source': 'Источник данных',
  'System Metrics': 'Метрики системы',
  'CPU Usage': 'CPU',
  'Memory Usage': 'Память',
  'Disk Usage': 'Диск',
  'Features': 'Возможности',
  'Live Statistics': 'Live-статистика',
  'Active Persons': 'Людей активно',
  'Avg Confidence': 'Средняя уверенность',
  'Total Detections': 'Всего детекций',
  'Zone Occupancy': 'Занятость зон',
  'Through Walls': 'Через стены',
  'Works through solid barriers with no line of sight required': 'Работает через препятствия без прямой видимости',
  'Privacy-Preserving': 'Без камер',
  'No cameras or visual recording - just WiFi signal analysis': 'Без камер и видеозаписи - только анализ WiFi-сигнала',
  'Real-Time': 'В реальном времени',
  'Maps 24 body regions in real-time at 100Hz sampling rate': 'Отслеживает 24 области тела при частоте 100 Hz',
  'Low Cost': 'Низкая стоимость',
  'Built using $30 commercial WiFi hardware': 'Работает на доступном WiFi-железе',
  'Body Regions': 'Области тела',
  'Sampling Rate': 'Частота выборки',
  'Accuracy (AP@50)': 'Точность (AP@50)',
  'Hardware Cost': 'Стоимость железа',
  'API server is running normally': 'API Server работает нормально',
  'WiFi-derived pose estimation': 'Оценка позы по WiFi',
  'Server running without hardware': 'Сервер работает без железа',
  'Real hardware connected': 'Реальное железо подключено',
  'Server unreachable, local fallback': 'Сервер недоступен, локальный fallback',
  'Source: simulated': 'Источник: симуляция',
  'Mock server active - testing mode': 'Активен mock server - тестовый режим',
  'Connected to Rust sensing server': 'Подключено к Rust sensing server',
  'Backend unavailable — start sensing-server': 'Backend недоступен - запустите sensing-server',

  // Hardware
  'Hardware Configuration': 'Настройка оборудования',
  '3×3 Antenna Array': 'Массив антенн 3×3',
  'Click antennas to toggle their state': 'Нажимайте на антенны, чтобы включать и выключать их',
  'Transmitters (3)': 'Передатчики (3)',
  'Receivers (6)': 'Приемники (6)',
  'WiFi Configuration': 'Настройка WiFi',
  'Frequency': 'Частота',
  'Subcarriers': 'Subcarriers',
  'Total Cost': 'Итоговая стоимость',
  'Real-time CSI Data': 'CSI данные в реальном времени',
  'Amplitude:': 'Амплитуда:',
  'Phase:': 'Фаза:',
  'Active TX:': 'Активные TX:',
  'Active RX:': 'Активные RX:',
  'Signal Quality:': 'Качество сигнала:',

  // Live Demo
  'Live Demonstration': 'Live Demo',
  'Live Human Pose Detection': 'Live-детекция позы человека',
  'Detecting data source...': 'Определяю источник данных...',
  'Start Stream': 'Запустить поток',
  'Stop Stream': 'Остановить поток',
  'Start Detection': 'Запустить детекцию',
  'Stop Detection': 'Остановить детекцию',
  'Demo': 'Демо',
  'Debug Mode': 'Debug Mode',
  'Zone 1': 'Зона 1',
  'Zone 2': 'Зона 2',
  'Zone 3': 'Зона 3',
  'WiFi Signal Analysis': 'Анализ WiFi-сигнала',
  'Signal Strength:': 'Сила сигнала:',
  'Processing Latency:': 'Задержка обработки:',
  'Human Pose Detection': 'Детекция позы человека',
  'Persons Detected:': 'Обнаружено людей:',
  'Confidence:': 'Уверенность:',
  'Keypoints:': 'Keypoints:',
  'Performance Metrics': 'Метрики работы',
  'Connection Status:': 'Статус соединения:',
  'Frames Processed:': 'Обработано кадров:',
  'Uptime:': 'Время работы:',
  'Errors:': 'Ошибки:',
  'Last Update:': 'Последнее обновление:',
  'Estimation Mode': 'Режим оценки',
  'Model Control': 'Управление моделью',
  'Model:': 'Модель:',
  'Signal-Derived (no model)': 'Signal-Derived (без модели)',
  'LoRA Profile:': 'LoRA Profile:',
  'Load Model': 'Загрузить модель',
  'No model loaded': 'Модель не загружена',
  'Compare: Signal vs Model': 'Сравнить: сигнал vs модель',
  'Open Training Panel': 'Открыть панель обучения',
  'Record 60s': 'Записать 60 с',
  'Setup Guide': 'Как подключать',
  '1 ESP32 + 1 AP': '1 ESP32 + 1 AP',
  'Presence, breathing, gross motion': 'Присутствие, дыхание, грубое движение',
  '2-3 ESP32s': '2-3 ESP32',
  'Body localization, motion direction': 'Локализация тела, направление движения',
  '4+ ESP32s + trained model': '4+ ESP32 + обученная модель',
  'Individual limb tracking, full pose': 'Отслеживание конечностей, полная поза',
  'Signal-Derived mode uses aggregate CSI features. For per-limb tracking, load a trained .rvf model with --model path.rvf and use 4+ sensors.':
    'Режим Signal-Derived использует агрегированные CSI features. Для отслеживания конечностей загрузите обученную .rvf модель через --model path.rvf и используйте 4+ сенсора.',
  'System Health': 'Состояние системы',
  'API Health:': 'API:',
  'WebSocket:': 'WebSocket:',
  'Pose Service:': 'Pose Service:',
  'Debug Information': 'Debug-информация',
  'Force Reconnect': 'Переподключить',
  'Clear Errors': 'Очистить ошибки',
  'Export Logs': 'Экспорт логов',
  'Model Inference': 'Model Inference',
  'Signal-Derived': 'Signal-Derived',
  'Waiting for first frame...': 'Жду первый кадр...',
  'Model is loaded. Pose stream is using trained RVF inference when available.':
    'Модель загружена. Поток позы использует обученный RVF inference, когда он доступен.',
  'Pose stream is generated from live CSI signal features without a trained model.':
    'Поток позы формируется из live CSI features без обученной модели.',
  'SIMULATED DATA — No Hardware Detected': 'СИМУЛЯЦИЯ - железо не найдено',
  'SIMULATED DATA - No Hardware Detected': 'СИМУЛЯЦИЯ - железо не найдено',
  'LIVE — ESP32 Hardware Connected': 'LIVE - ESP32 подключен',
  'LIVE - ESP32 Hardware Connected': 'LIVE - ESP32 подключен',
  'OFFLINE — Client Simulation': 'OFFLINE - симуляция в браузере',
  'OFFLINE - Client Simulation': 'OFFLINE - симуляция в браузере',

  // Architecture and performance
  'System Architecture': 'Архитектура системы',
  'CSI Input': 'CSI Input',
  'Channel State Information collected from WiFi antenna array': 'Channel State Information, собранная с WiFi-антенн',
  'Phase Sanitization': 'Очистка фазы',
  'Remove hardware-specific noise and normalize signal phase': 'Удаление аппаратного шума и нормализация фазы сигнала',
  'Modality Translation': 'Перевод модальности',
  'Convert WiFi signals to visual representation using CNN': 'Преобразование WiFi-сигналов в визуальное представление через CNN',
  'DensePose-RCNN': 'DensePose-RCNN',
  'Extract human pose keypoints and body part segmentation': 'Извлечение keypoints позы и сегментации частей тела',
  'Wireframe Output': 'Wireframe output',
  'Generate final human pose wireframe visualization': 'Построение итоговой wireframe-визуализации позы',
  'Performance Analysis': 'Метрики качества',
  'WiFi-based (Same Layout)': 'WiFi-based (та же планировка)',
  'Image-based (Reference)': 'Image-based (эталон)',
  'Average Precision:': 'Average Precision:',
  'Advantages & Limitations': 'Плюсы и ограничения',
  'Advantages': 'Плюсы',
  'Limitations': 'Ограничения',
  'Through-wall detection': 'Детекция через стены',
  'Privacy preserving': 'Без камер',
  'Lighting independent': 'Не зависит от освещения',
  'Low cost hardware': 'Доступное железо',
  'Uses existing WiFi': 'Использует WiFi',
  'Performance drops in different layouts': 'Качество падает в новых планировках',
  'Requires WiFi-compatible devices': 'Нужны совместимые WiFi-устройства',
  'Training requires synchronized data': 'Для обучения нужны синхронизированные данные',

  // Applications
  'Real-World Applications': 'Практические сценарии',
  'Elderly Care Monitoring': 'Мониторинг пожилых',
  'Monitor elderly individuals for falls or emergencies without invading privacy. Track movement patterns and detect anomalies in daily routines.':
    'Мониторинг падений и тревожных ситуаций без вторжения в приватность. Анализ паттернов движения и аномалий в обычном распорядке.',
  'Fall Detection': 'Детекция падений',
  'Activity Monitoring': 'Мониторинг активности',
  'Emergency Alert': 'Тревожное уведомление',
  'Home Security Systems': 'Безопасность дома',
  'Detect intruders and monitor home security without visible cameras. Track multiple persons and identify suspicious movement patterns.':
    'Обнаружение проникновения и контроль безопасности без видимых камер. Отслеживание нескольких людей и подозрительных движений.',
  'Intrusion Detection': 'Детекция проникновения',
  'Multi-person Tracking': 'Multi-person tracking',
  'Invisible Monitoring': 'Незаметный мониторинг',
  'Healthcare Patient Monitoring': 'Мониторинг пациентов',
  'Monitor patients in hospitals and care facilities. Track vital signs through movement analysis and detect health emergencies.':
    'Мониторинг пациентов в больницах и care-фасилити. Оценка vital signs через анализ движения и детекция тревожных состояний.',
  'Vital Sign Analysis': 'Анализ vital signs',
  'Movement Tracking': 'Отслеживание движения',
  'Health Alerts': 'Медицинские уведомления',
  'Smart Building Occupancy': 'Occupancy в умных зданиях',
  'Optimize building energy consumption by tracking occupancy patterns. Control lighting, HVAC, and security systems automatically.':
    'Оптимизация энергопотребления по occupancy patterns. Автоматическое управление светом, HVAC и безопасностью.',
  'Energy Optimization': 'Оптимизация энергии',
  'Occupancy Tracking': 'Occupancy tracking',
  'Smart Controls': 'Умное управление',
  'AR/VR Applications': 'AR/VR сценарии',
  'Enable full-body tracking for virtual and augmented reality applications without wearing additional sensors or cameras.':
    'Full-body tracking для VR/AR без носимых сенсоров и камер.',
  'Full Body Tracking': 'Full-body tracking',
  'Sensor-free': 'Без сенсоров',
  'Immersive Experience': 'Иммерсивный опыт',
  'Implementation Considerations': 'Что важно при внедрении',
  'While WiFi DensePose offers revolutionary capabilities, successful implementation requires careful consideration of environment setup, data privacy regulations, and system calibration for optimal performance.':
    'WiFi DensePose дает сильные возможности, но для успешного внедрения нужны правильная установка, учет приватности и калибровка системы под помещение.',

  // Sensing tab
  'Live WiFi Sensing': 'Live WiFi Sensing',
  'SIMULATED — NO HARDWARE': 'СИМУЛЯЦИЯ - НЕТ ЖЕЛЕЗА',
  'SIMULATED - NO HARDWARE': 'СИМУЛЯЦИЯ - НЕТ ЖЕЛЕЗА',
  'LIVE — ESP32 HARDWARE': 'LIVE - ESP32',
  'LIVE - ESP32 HARDWARE': 'LIVE - ESP32',
  'OFFLINE — CLIENT SIMULATION': 'OFFLINE - СИМУЛЯЦИЯ В БРАУЗЕРЕ',
  'OFFLINE - CLIENT SIMULATION': 'OFFLINE - СИМУЛЯЦИЯ В БРАУЗЕРЕ',
  'Loading 3D engine...': 'Загрузка 3D engine...',
  '3D rendering unavailable': '3D rendering недоступен',
  'Connection': 'Соединение',
  'Signal Features': 'Signal features',
  'Variance': 'Variance',
  'Motion Band': 'Motion band',
  'Breathing Band': 'Breathing band',
  'Spectral Power': 'Spectral power',
  'Classification': 'Классификация',
  'About This Data': 'Об этих данных',
  'Metrics are computed from WiFi Channel State Information (CSI). With 0 ESP32 node(s) you get presence detection, breathing estimation, and gross motion. Add 3-4+ ESP32 nodes around the room for spatial resolution and limb-level tracking.':
    'Метрики считаются из WiFi Channel State Information (CSI). С 0 ESP32 node(s) доступны только тестовые данные; с одним сенсором - presence, breathing estimation и грубое движение. Для пространственного разрешения и limb-level tracking нужны 3-4+ ESP32 вокруг комнаты.',
  'NODE STATUS': 'СТАТУС УЗЛОВ',
  'Details': 'Детали',
  'Dominant Freq': 'Dominant freq',
  'Change Points': 'Change points',
  'Sample Rate': 'Sample rate',
  'ABSENT': 'НЕТ ПРИСУТСТВИЯ',
  'PRESENT': 'ЕСТЬ ПРИСУТСТВИЕ',
  'MOTION': 'ДВИЖЕНИЕ',

  // Training and models
  'Model Training': 'Обучение модели',
  'Record CSI data, train pose estimation models, and manage .rvf files': 'Запись CSI, обучение pose-моделей и управление .rvf файлами',
  'CSI Recordings': 'CSI-записи',
  'Start recording CSI data to train a model': 'Начните запись CSI-данных для обучения модели',
  'Start Recording': 'Начать запись',
  'Stop Recording': 'Остановить запись',
  'Training Configuration': 'Настройки обучения',
  'Collapse': 'Свернуть',
  'Expand': 'Развернуть',
  'Datasets': 'Датасеты',
  'Epochs': 'Эпохи',
  'Batch Size': 'Batch size',
  'Learning Rate': 'Learning rate',
  'Early Stop Patience': 'Early stop patience',
  'Base Model (opt.)': 'Base model (опц.)',
  'LoRA Profile (opt.)': 'LoRA Profile (опц.)',
  'Start Training': 'Начать обучение',
  'Pretrain': 'Pretrain',
  'LoRA': 'LoRA',
  'Training Progress': 'Ход обучения',
  'Training Complete': 'Обучение завершено',
  'Final Loss': 'Final loss',
  'Best PCK': 'Best PCK',
  'Best Epoch': 'Лучшая эпоха',
  'Total Epochs': 'Всего эпох',
  'New Training': 'Новое обучение',
  'Loss': 'Loss',
  'Phase': 'Фаза',
  'Patience': 'Patience',
  'ETA': 'ETA',
  'Model Library': 'Библиотека моделей',
  'Available Models': 'Доступные модели',
  'No .rvf models found. Train a model or place .rvf files in data/models/':
    'Модели .rvf не найдены. Обучите модель или положите .rvf файлы в data/models/',
  'Active Model': 'Активная модель',
  'Inference:': 'Inference:',
  'Frames:': 'Кадры:',
  'Load failed:': 'Ошибка загрузки:',
  'Unload failed:': 'Ошибка выгрузки:',
  'Delete failed:': 'Ошибка удаления:',

  // Observatory
  'WiFi DensePose Sensing Observatory': 'WiFi DensePose Sensing Observatory',
  'Auto-cycling': 'Автопереключение',
  'Change scenario': 'Сменить сценарий',
  'Auto-Cycle': 'Автоцикл',
  'Auto-Cycle (30s)': 'Автоцикл (30 с)',
  'Empty Room': 'Пустая комната',
  'Vital Signs': 'Vital signs',
  'Vital Signs (Breathing)': 'Vital signs (дыхание)',
  'Multi-Person': 'Multi-person',
  'Fall Detect': 'Падение',
  'Sleep Monitor': 'Сон',
  'Intrusion': 'Проникновение',
  'Gesture Ctrl': 'Gesture control',
  'Crowd (4 ppl)': 'Толпа (4 чел.)',
  'Search Rescue': 'Search & Rescue',
  'Elderly Care': 'Пожилой человек',
  'Fitness': 'Фитнес',
  'Security Patrol': 'Патруль',
  'Heart Rate': 'Пульс',
  'Respiration': 'Дыхание',
  'WiFi Signal': 'WiFi-сигнал',
  'Motion': 'Движение',
  'Persons': 'Люди',
  'Presence': 'Присутствие',
  'FALL DETECTED': 'ОБНАРУЖЕНО ПАДЕНИЕ',
  'Human Pose Estimation': 'Оценка позы человека',
  'Vital Sign Monitoring': 'Мониторинг vital signs',
  'Presence Detection': 'Детекция присутствия',
  '[A] Orbit': '[A] Orbit',
  '[D] Scenario': '[D] Сценарий',
  '[F] FPS': '[F] FPS',
  '[S] Settings': '[S] Настройки',
  '[Space] Pause': '[Space] Пауза',
  'Rendering': 'Рендеринг',
  'Wireframe': 'Wireframe',
  'Scene': 'Сцена',
  'Data': 'Данные',
  'Bloom Strength': 'Bloom strength',
  'Bloom Radius': 'Bloom radius',
  'Bloom Threshold': 'Bloom threshold',
  'Exposure': 'Экспозиция',
  'Vignette': 'Виньетка',
  'Film Grain': 'Film grain',
  'Chromatic Aberration': 'Хроматическая аберрация',
  'Bone Thickness': 'Толщина костей',
  'Joint Size': 'Размер суставов',
  'Glow Intensity': 'Интенсивность свечения',
  'Particle Trail': 'След частиц',
  'Wireframe Color': 'Цвет wireframe',
  'Joint Color': 'Цвет суставов',
  'Aura Opacity': 'Прозрачность ауры',
  'Signal Field': 'Signal field',
  'WiFi Waves': 'WiFi waves',
  'Room Brightness': 'Яркость комнаты',
  'Floor Reflection': 'Отражение пола',
  'Orbit Speed': 'Скорость orbit',
  'Show Grid': 'Показывать сетку',
  'Show Room Boundary': 'Показывать границы комнаты',
  'Scenario': 'Сценарий',
  'Sleep Monitoring (Apnea)': 'Мониторинг сна (apnea)',
  'Elderly Care (Gait)': 'Пожилой человек (походка)',
  'Fitness Tracking': 'Фитнес-трекинг',
  'Intrusion Detection': 'Детекция проникновения',
  'Security Patrol': 'Патруль безопасности',
  'Crowd Occupancy (4 ppl)': 'Занятость помещения (4 чел.)',
  'Gesture Control (DTW)': 'Gesture control (DTW)',
  'Search & Rescue (WiFi-Mat)': 'Search & Rescue (WiFi-Mat)',
  'Cycle Speed (s)': 'Скорость цикла (с)',
  'Style Preset': 'Стиль',
  'Custom': 'Пользовательский',
  'Foundation (Default)': 'Foundation (по умолчанию)',
  'Cinematic': 'Cinematic',
  'Minimal / Clean': 'Минимальный / чистый',
  'Neon Glow': 'Neon glow',
  'Tactical / Military': 'Tactical / military',
  'Medical Monitor': 'Medical monitor',
  'Demo Generator': 'Демо-генератор',
  'Live WebSocket': 'Live WebSocket',
  'WS URL': 'WS URL',
  'Reset Camera': 'Сбросить камеру',
  'Reset to Defaults': 'Сбросить настройки',
  'Export Settings': 'Экспорт настроек',

  // Pose Fusion
  'Dual-Modal Pose Estimation — Live Video + WiFi CSI Fusion': 'Dual-Modal Pose Estimation - video + WiFi CSI Fusion',
  'Dual-Modal Pose Estimation - Live Video + WiFi CSI Fusion': 'Dual-Modal Pose Estimation - video + WiFi CSI Fusion',
  'Dual Mode (Video + CSI)': 'Dual Mode (Video + CSI)',
  'Video Only': 'Только video',
  'CSI Only (WiFi)': 'Только CSI (WiFi)',
  'READY': 'ГОТОВО',
  '← Dashboard': '← Панель',
  'Dashboard ←': 'Панель ←',
  'Observatory →': 'Observatory →',
  'DUAL FUSION': 'DUAL FUSION',
  'Enable your webcam for live video pose estimation.': 'Включите webcam для live video pose estimation.',
  'Or switch to': 'Или переключитесь в',
  'mode for WiFi-based sensing.': 'для WiFi-based sensing.',
  'Enable Camera': 'Включить камеру',
  'Fusion Confidence': 'Уверенность fusion',
  'Video': 'Video',
  'Fused': 'Fused',
  'Cross-modal:': 'Cross-modal:',
  'CSI Amplitude Heatmap': 'CSI amplitude heatmap',
  'RSSI Signal Strength': 'Сила RSSI',
  'Embedding Space (2D Projection)': 'Embedding space (2D projection)',
  'RuVector WASM Attention Pipeline': 'RuVector WASM Attention Pipeline',
  'Energy:': 'Energy:',
  'Refinement:': 'Refinement:',
  'Pose Impact:': 'Pose impact:',
  'Pipeline Latency': 'Задержка pipeline',
  'Video CNN': 'Video CNN',
  'CSI CNN': 'CSI CNN',
  'Fusion': 'Fusion',
  'Total': 'Итого',
  'Controls': 'Управление',
  '⏸ Pause': '⏸ Пауза',
  'Pause': 'Пауза',
  'Confidence': 'Уверенность',
  'Live CSI Source': 'Live CSI source',
  'Connect': 'Подключить',
  'Architecture: Conv2D → RuVector 6-Stage Attention (Flash+MHA+Hyperbolic+Linear+MoE+L/G) → Fusion → 26-Keypoint Pose':
    'Архитектура: Conv2D → RuVector 6-Stage Attention (Flash+MHA+Hyperbolic+Linear+MoE+L/G) → Fusion → 26-keypoint pose',
  'ruvector-cnn (loading…)': 'ruvector-cnn (загрузка...)',

  // Utilities
  'Display': 'Отображение',
  'Reduced motion': 'Меньше анимации',
  'High contrast': 'Высокий контраст',
  'Compact mode': 'Компактный режим',
  'Monitoring': 'Мониторинг',
  'Health polling': 'Проверка health',
  'Auto-reconnect': 'Автопереподключение',
  'Clear local data': 'Очистить локальные данные',
  'Reset onboarding': 'Сбросить обучение интерфейсу',
  'Reset': 'Сбросить',
  'Command palette': 'Палитра команд',
  'Type a command...': 'Введите команду...',
  'Search commands': 'Поиск команд',
  'Commands': 'Команды',
  'No matching commands': 'Команды не найдены',
  'Navigation': 'Навигация',
  'Actions': 'Действия',
  'Go to Dashboard': 'Перейти в Панель',
  'Go to Hardware': 'Перейти в Оборудование',
  'Go to Live Demo': 'Перейти в Live Demo',
  'Go to Architecture': 'Перейти в Архитектура',
  'Go to Performance': 'Перейти в Метрики',
  'Go to Applications': 'Перейти в Сценарии',
  'Go to Sensing': 'Перейти в Sensing',
  'Go to Training': 'Перейти в Обучение',
  'Open Pose Fusion': 'Открыть Pose Fusion',
  'Open Observatory': 'Открыть Observatory',
  'Toggle Dark/Light Theme': 'Переключить тему',
  'Toggle Performance Monitor': 'Показать/скрыть Performance monitor',
  'Toggle Activity Log': 'Показать/скрыть журнал событий',
  'Export Sensor Data': 'Экспорт sensor data',
  'Toggle Fullscreen': 'Полноэкранный режим',
  'Show Keyboard Shortcuts': 'Показать горячие клавиши',
  'navigate': 'навигация',
  'execute': 'выполнить',
  'close': 'закрыть',
  'Keyboard Shortcuts': 'Горячие клавиши',
  'Close performance monitor': 'Закрыть Performance monitor',
  'Open navigation menu': 'Открыть меню навигации',
  'Mobile navigation': 'Мобильная навигация',
  'Tip: Press Ctrl+K for command palette': 'Подсказка: Ctrl+K открывает палитру команд',
  'Onboarding tour': 'Обзор интерфейса',
  'Welcome to RuView': 'Добро пожаловать в RuView',
  "WiFi-based human pose estimation that works through walls. Let's take a quick tour of the dashboard.":
    'Оценка позы по WiFi работает через стены. Быстро посмотрим на панель.',
  'Monitor your WiFi sensing hardware and API server status in real time. Green means everything is connected.':
    'Следите за WiFi sensing hardware и API Server в реальном времени. Зеленый цвет означает, что все подключено.',
  'Switch to the Live Demo tab to see real-time pose detection. Connect an ESP32 sensor or use the built-in simulation.':
    'Перейдите во вкладку Live Demo, чтобы увидеть live pose detection. Подключите ESP32 или используйте встроенную симуляцию.',
  'The Sensing tab shows a 3D Gaussian splat visualization of WiFi signal fields, with real-time metrics.':
    'Вкладка Sensing показывает 3D Gaussian splat визуализацию WiFi signal field и live-метрики.',
  'Press ? for shortcuts, Ctrl+K for the command palette, or use number keys 1-8 to switch tabs quickly.':
    'Нажмите ? для горячих клавиш, Ctrl+K для палитры команд или цифры 1-8 для быстрого перехода по вкладкам.',
  "You're all set!": 'Все готово',
  'Explore the dashboard, connect hardware, or start the demo. You can replay this tour anytime from the command palette.':
    'Изучите панель, подключите железо или запустите demo. Этот обзор можно повторить из палитры команд.',
  'Skip tour': 'Пропустить',
  'Back': 'Назад',
  'Next': 'Далее',
  'Get started': 'Начать'
};

const titleRu = {
  'RuView Observatory — WiFi DensePose': 'RuView Observatory - WiFi DensePose',
  'RuView — Dual-Modal Pose Estimation': 'RuView - Dual-Modal Pose Estimation',
  'WiFi DensePose - 3D Visualization': 'WiFi DensePose - 3D визуализация'
};

const dynamicRules = [
  [/^Epoch (\d+) \/ ([^ ]+)\s+\(([^)]+)\)$/u, (_m, a, b, c) => `Эпоха ${a} / ${b} (${c})`],
  [/^Training epoch (\d+)\/(\d+)$/u, (_m, a, b) => `Эпоха обучения ${a}/${b}`],
  [/^(\d+) frames$/u, (_m, n) => `${n} кадров`],
  [/^(\d+) client\(s\)$/u, (_m, n) => `${n} клиент(ов)`],
  [/^PCK: (.+)$/u, (_m, score) => `PCK: ${score}`],
  [/^Load failed: (.+)$/u, (_m, msg) => `Ошибка загрузки: ${msg}`],
  [/^Unload failed: (.+)$/u, (_m, msg) => `Ошибка выгрузки: ${msg}`],
  [/^Delete failed: (.+)$/u, (_m, msg) => `Ошибка удаления: ${msg}`],
  [/^Recording failed: (.+)$/u, (_m, msg) => `Ошибка записи: ${msg}`],
  [/^Stop recording failed: (.+)$/u, (_m, msg) => `Ошибка остановки записи: ${msg}`],
  [/^Training failed: (.+)$/u, (_m, msg) => `Ошибка обучения: ${msg}`],
  [/^Stop failed: (.+)$/u, (_m, msg) => `Ошибка остановки: ${msg}`],
  [/^Initialization failed: (.+)$/u, (_m, msg) => `Ошибка инициализации: ${msg}`]
];

const TEXT_ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
const originalText = new WeakMap();
let applying = false;
let scheduled = false;
let observer = null;

function normalize(value) {
  return String(value || '').replace(/\s+/gu, ' ').trim();
}

function translateRaw(value) {
  const key = normalize(value);
  if (!key) return null;
  if (exactRu[key]) return exactRu[key];
  for (const [pattern, replacer] of dynamicRules) {
    const match = key.match(pattern);
    if (match) return replacer(...match);
  }
  return null;
}

function preserveOuterWhitespace(original, translated) {
  const start = String(original).match(/^\s*/u)?.[0] || '';
  const end = String(original).match(/\s*$/u)?.[0] || '';
  return `${start}${translated}${end}`;
}

function shouldSkipTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'].includes(parent.tagName);
}

function applyTextNode(node, locale) {
  if (shouldSkipTextNode(node)) return;
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  const original = originalText.get(node);
  if (locale !== 'ru') {
    if (node.nodeValue !== original) node.nodeValue = original;
    return;
  }
  const translated = translateRaw(original);
  if (translated && normalize(node.nodeValue) !== normalize(translated)) {
    node.nodeValue = preserveOuterWhitespace(original, translated);
  }
}

function applyElement(el, locale) {
  if (!(el instanceof Element)) return;

  const dict = translations[locale] || translations.en;
  const key = el.getAttribute('data-i18n');
  if (key && dict[key]) el.textContent = dict[key];

  const placeholderKey = el.getAttribute('data-i18n-placeholder');
  if (placeholderKey && dict[placeholderKey]) {
    el.setAttribute('placeholder', dict[placeholderKey]);
  }

  const ariaKey = el.getAttribute('data-i18n-aria');
  if (ariaKey && dict[ariaKey]) {
    el.setAttribute('aria-label', dict[ariaKey]);
  }

  for (const attr of TEXT_ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const originalAttr = `data-homemonitor-original-${attr}`;
    if (!el.hasAttribute(originalAttr)) {
      el.setAttribute(originalAttr, el.getAttribute(attr));
    }
    const originalValue = el.getAttribute(originalAttr);
    const translated = locale === 'ru' ? translateRaw(originalValue) : null;
    el.setAttribute(attr, translated || originalValue);
  }
}

function walk(root, locale) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    applyTextNode(root, locale);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) applyElement(root, locale);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) applyTextNode(node, locale);
    else applyElement(node, locale);
    node = walker.nextNode();
  }
}

function scheduleApply(i18n) {
  if (applying || scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    i18n.applyTranslations();
  });
}

export class I18n {
  constructor() {
    this.locale = this.getSavedLocale() || 'ru';
    this.listeners = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      this.applyTranslations();
      return;
    }
    this.initialized = true;
    document.documentElement.setAttribute('lang', this.locale);
    this.createSelector();
    this.applyTranslations();
    this.observeMutations();
  }

  detectLocale() {
    return 'ru';
  }

  getSavedLocale() {
    try {
      const value = localStorage.getItem('homemonitor-locale');
      return value === 'ru' || value === 'en' ? value : null;
    } catch {
      return null;
    }
  }

  saveLocale(locale) {
    try {
      localStorage.setItem('homemonitor-locale', locale);
    } catch {
      // noop
    }
  }

  t(key) {
    const dict = translations[this.locale] || translations.en;
    return dict[key] || translations.en[key] || key;
  }

  setLocale(locale) {
    if (!translations[locale]) return;
    this.locale = locale;
    this.saveLocale(locale);
    document.documentElement.setAttribute('lang', locale);
    this.applyTranslations();
    this.listeners.forEach(cb => {
      try { cb(locale); } catch { /* noop */ }
    });
  }

  onLocaleChange(callback) {
    this.listeners.push(callback);
    return () => {
      const i = this.listeners.indexOf(callback);
      if (i > -1) this.listeners.splice(i, 1);
    };
  }

  applyTranslations(root = document) {
    applying = true;
    try {
      if (document.title && this.locale === 'ru') {
        document.title = titleRu[document.title] || document.title;
      }
      walk(root, this.locale);
      const selector = document.getElementById('lang-selector');
      if (selector) selector.value = this.locale;
    } finally {
      applying = false;
    }
  }

  createSelector() {
    if (document.getElementById('lang-selector')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-selector-wrap';
    wrapper.innerHTML = `
      <select id="lang-selector" class="lang-selector" aria-label="Язык">
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
    `;

    const select = wrapper.querySelector('select');
    select.value = this.locale;
    select.addEventListener('change', () => this.setLocale(select.value));

    const host = document.querySelector('.header-info')
      || document.querySelector('.header-right')
      || document.querySelector('#status-bar');
    if (host) host.appendChild(wrapper);
  }

  observeMutations() {
    if (observer) return;
    observer = new MutationObserver(mutations => {
      if (applying) return;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          scheduleApply(this);
          return;
        }
        if (mutation.type === 'attributes' && TEXT_ATTRS.includes(mutation.attributeName)) {
          scheduleApply(this);
          return;
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRS
    });
  }

  getAvailableLocales() {
    return Object.keys(translations);
  }

  dispose() {
    this.listeners = [];
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    this.initialized = false;
  }
}

export const i18n = new I18n();

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.ruviewI18n = i18n;
  const start = () => i18n.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    queueMicrotask(start);
  }
}

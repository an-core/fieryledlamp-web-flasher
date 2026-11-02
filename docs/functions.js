import {
    ESPLoader,
    Transport
} from 'https://unpkg.com/esptool-js@0.4.5/bundle.js';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const FETCH_TIMEOUT_MS = 60000;

const FIRMWARE_VARIANTS = {
    'ESP32-S3_V1': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32-S3_VARIANT_1.zip',
        chipFamily: 'ESP32-S3',
        description: 'ESP32-S3 - Вариант 1 (без MULTI_MATRIX)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00000000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00C90000,
                required: true
            },
        ],
    },
    'ESP32-S3_V2': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32-S3_VARIANT_2.zip',
        chipFamily: 'ESP32-S3',
        description: 'ESP32-S3 - Вариант 2 (с MULTI_MATRIX)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00000000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00C90000,
                required: true
            },
        ],
    },
    'ESP32_V1': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32_VARIANT_1.zip',
        chipFamily: 'ESP32',
        description: 'ESP32 - Вариант 1 (USE_DAWN, USE_SUNSET, USE_SCHEDULE, USE_WEATHER, USE_MQTT, USE_MULTILAMP, LED_PANEL, BACKUP_CFG_FILES, STATUS_DEVICE, SOFT_INFO)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00001000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00210000,
                required: true
            },
        ],
    },
    'ESP32_V2': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32_VARIANT_2.zip',
        chipFamily: 'ESP32',
        description: 'ESP32 - Вариант 2 (USE_SD, USE_DAWN, USE_SUNSET, USE_SCHEDULE, USE_WEATHER, USE_MQTT, USE_MULTILAMP, LED_PANEL, BACKUP_CFG_FILES, STATUS_DEVICE, SOFT_INFO)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00001000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00210000,
                required: true
            },
        ],
    },
    'ESP32_V3': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32_VARIANT_3.zip',
        chipFamily: 'ESP32',
        description: 'ESP32 - Вариант 3 (USE_SD, MULTI_MATRIX, USE_DAWN, USE_SUNSET, USE_SCHEDULE, USE_WEATHER, LED_PANEL, STATUS_DEVICE, SOFT_INFO)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00001000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00210000,
                required: true
            },
        ],
    },
};

const FIRMWARE_VARIANTS_MISHANYA = {
    'ESP32-S3': {
        zipUrl: 'https://raw.githubusercontent.com/an-core/FieryLedLamp_mod/main/update/bin_for_web-flasher/bin_ESP32S3_MISHANYA.zip',
        chipFamily: 'ESP32-S3',
        description: 'MishanyaTS - ESP32-S3 (16MB)',
        parts: [{
                keywords: ['bootloader'],
                address: 0x00000000,
                required: true
            },
            {
                keywords: ['partitions'],
                address: 0x00008000,
                required: true
            },
            {
                keywords: ['boot_app0'],
                address: 0x0000E000,
                required: false
            },
            {
                keywords: ['firmware'],
                address: 0x00010000,
                required: true
            },
            {
                keywords: ['littlefs'],
                address: 0x00C90000,
                required: true
            },
        ],
    },
};

const FLASH_OPTIONS = {
    baudrate: 921600,
    romBaudrate: 115200,
    flashSize: 'keep',
    flashMode: 'keep',
    flashFreq: 'keep',
    eraseAll: false,
    compress: true,
};

let port = null;
let transport = null;
let loader = null;
let zipData = null;
let selectedVariant = null;
let detectedChip = null;
let useMishanya = false;
let isFlashing = false;
let isConnecting = false;

const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');
const flashBtn = document.getElementById('flashBtn');
const variantSelector = document.getElementById('variantSelector');
const variantSelect = document.getElementById('variantSelect');
const detectedInfo = document.getElementById('detectedInfo');
const progressBarOuter = document.getElementById('progressBarOuter');
const progressBarInner = document.getElementById('progressBarInner');

const stepEls = {
    variant: document.getElementById('stepVariant'),
    flashMode: document.getElementById('stepFlashMode'),
    download: document.getElementById('stepDownload'),
    flash: document.getElementById('stepFlash'),
};

function lockStep(el) {
    if (!el) return;
    el.classList.add('step-locked');
    el.classList.remove('step-revealed');
}

function unlockStep(el) {
    if (!el) return;
    if (!el.classList.contains('step-locked')) return;
    el.classList.remove('step-locked');
    el.classList.add('step-revealed');
}

function lockAllSteps() {
    lockStep(stepEls.variant);
    lockStep(stepEls.flashMode);
    lockStep(stepEls.download);
    lockStep(stepEls.flash);
}

function getActiveVariants() {
    return useMishanya ? FIRMWARE_VARIANTS_MISHANYA : FIRMWARE_VARIANTS;
}

function getPartsForFlashMode(variant, flashMode) {
    if (flashMode === 'firmware') return variant.parts.filter(p => p.keywords.includes('firmware'));
    if (flashMode === 'littlefs') return variant.parts.filter(p => p.keywords.includes('littlefs'));
    return variant.parts;
}

function findFileInZip(zip, keywords) {
    for (const filePath of Object.keys(zip.files)) {
        const file = zip.files[filePath];
        if (file.dir) continue;
        const fileName = filePath.toLowerCase();
        if (keywords.every(k => fileName.includes(k.toLowerCase()))) return file;
    }
    return null;
}

function log(msg) {
    const now = new Date();
    const time = now.toTimeString().substr(0, 8);
    const div = document.createElement('div');
    div.textContent = `[${time}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
}

function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status active ' + type;
}

function setProgress(percent, text) {
    progressBarOuter.classList.add('active');
    progressBarInner.style.width = percent + '%';
    progressBarInner.textContent = text || (percent + '%');
}

function hideProgress() {
    progressBarOuter.classList.remove('active');
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function safeClosePort() {
    try {
        if (transport) {
            try {
                await transport.disconnect();
            } catch (e) {}
        }
        if (port) {
            try {
                await port.close();
            } catch (e) {}
        }
    } catch (e) {}
    transport = null;
    port = null;
    loader = null;
}

function setupModal(modalEl, openBtnId, closeBtnIds) {
    const openBtn = document.getElementById(openBtnId);
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modalEl.classList.add('open');
        });
    }
    closeBtnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => modalEl.classList.remove('open'));
    });
    modalEl.addEventListener('click', function(e) {
        if (e.target === this) modalEl.classList.remove('open');
    });
}

setupModal(document.getElementById('instructionsModal'), 'showInstructions', ['closeModalBtn1', 'closeModalBtn2']);
setupModal(document.getElementById('modInfoModal'), 'showModInfo', ['closeModInfoBtn1', 'closeModInfoBtn2']);

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Vivaldi/')) return 'Vivaldi';
    if (ua.includes('Brave/')) return 'Brave';
    if (ua.includes('YaBrowser/')) return 'Яндекс.Браузер';
    if (ua.includes('CentBrowser/')) return 'Cent Browser';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'неизвестный браузер';
}

if (!('serial' in navigator)) {
    const browserName = detectBrowser();
    showStatus(browserName + ' не поддерживает Web Serial. Используйте Chrome, Edge, Opera, Vivaldi, Brave или Cent Browser.', 'error');
    connectBtn.disabled = true;
    log('Web Serial не поддерживается браузером: ' + browserName);
} else {
    log('Web Serial поддерживается');
}

async function downloadVariantZip(variant) {
    log('Загрузка архива: ' + variant.description);
    showStatus('Загрузка архива...', 'info');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(variant.zipUrl, {
            signal: controller.signal
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const blob = await response.blob();
        log('Загружено ' + (blob.size / 1024).toFixed(1) + ' KB');

        const zip = await JSZip.loadAsync(blob);
        const flashMode = document.getElementById('flashMode')?.value || 'all';
        const partsToFlash = getPartsForFlashMode(variant, flashMode);

        const missing = [];
        for (const part of partsToFlash) {
            const file = findFileInZip(zip, part.keywords);
            if (!file) {
                if (part.required) missing.push(part.keywords.join('+'));
                else log('  ⚠ Не найден (необязательный): ' + part.keywords.join('+'));
            } else {
                log('  Найден: ' + file.name);
            }
        }
        if (missing.length > 0) throw new Error('В архиве нет файлов: ' + missing.join(', '));

        log('Архив распакован, все файлы на месте');
        return zip;
    } catch (e) {
        if (e.name === 'AbortError') {
            log('Ошибка загрузки: превышен таймаут (' + (FETCH_TIMEOUT_MS / 1000) + ' с)');
            showStatus('Ошибка загрузки архива: превышен таймаут. Проверьте соединение.', 'error');
        } else {
            log('Ошибка загрузки: ' + e.message);
            showStatus('Ошибка загрузки архива: ' + e.message, 'error');
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

connectBtn.onclick = async () => {
    if (isConnecting || isFlashing) {
        log('Операция уже выполняется');
        return;
    }
    if (loader) {
        log('Уже подключено');
        return;
    }

    isConnecting = true;
    connectBtn.disabled = true;
    resetDownloadState();
    lockAllSteps();

    try {
        log('Запрос USB-порта...');
        showStatus('Запрос USB-порта...', 'info');

        const portFilters = [{
                usbVendorId: 0x10c4
            },
            {
                usbVendorId: 0x1a86
            },
            {
                usbVendorId: 0x303a
            },
        ];

        port = await navigator.serial.requestPort({
            filters: portFilters
        });
        const info = port.getInfo();
        log('Порт выбран: USB ' + (info.usbVendorId ? '0x' + info.usbVendorId.toString(16) : '?'));

        transport = new Transport(port, true);
        loader = new ESPLoader({
            transport,
            baudrate: FLASH_OPTIONS.baudrate,
            romBaudrate: FLASH_OPTIONS.romBaudrate,
        });

        log('Подключение к ESP...');
        showStatus('Подключение к ESP...', 'info');
        const chip = await loader.main();
        detectedChip = chip;
        log('Чип: ' + chip);

        unlockStep(stepEls.variant);
        unlockStep(stepEls.flashMode);
        unlockStep(stepEls.download);

        if (chip.includes('ESP32-S3') || chip.includes('ESP32S3')) {
            document.getElementById('mishanyaBlock').style.display = 'inline-flex';
            document.getElementById('mishanyaToggle').checked = useMishanya;
            document.getElementById('mishanyaWarning').style.display = useMishanya ? 'block' : 'none';

            variantSelector.style.display = 'block';
            variantSelect.innerHTML = '<option value="">- выберите вариант -</option>';
            for (const [key, variant] of Object.entries(getActiveVariants())) {
                if (variant.chipFamily === 'ESP32-S3') {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = variant.description;
                    variantSelect.appendChild(opt);
                }
            }

            selectedVariant = null;
            flashBtn.disabled = true;
            showStatus('Подключено: ' + chip + ' - выберите вариант прошивки', 'info');

        } else if (chip.includes('ESP32')) {
            document.getElementById('mishanyaBlock').style.display = 'none';
            document.getElementById('mishanyaToggle').checked = false;
            document.getElementById('mishanyaWarning').style.display = 'none';
            useMishanya = false;

            variantSelector.style.display = 'block';
            variantSelect.innerHTML = '<option value="">- выберите вариант -</option>';
            for (const [key, variant] of Object.entries(FIRMWARE_VARIANTS)) {
                if (variant.chipFamily === 'ESP32') {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = variant.description;
                    variantSelect.appendChild(opt);
                }
            }
            showStatus('Подключено: ' + chip + ' - выберите вариант прошивки', 'info');

        } else {
            log('Неизвестный чип: ' + chip);
            showStatus('Неизвестный чип: ' + chip, 'error');
            await safeClosePort();
            lockAllSteps();
        }
    } catch (e) {
        log('Ошибка подключения: ' + e.message);
        showStatus('Ошибка подключения: ' + e.message, 'error');
        await safeClosePort();
        lockAllSteps();
    } finally {
        isConnecting = false;
        if (!loader) connectBtn.disabled = false;
    }
};

log('Web Flasher загружен');

variantSelect.onchange = async (e) => {
    const value = e.target.value;
    if (!value) {
        flashBtn.disabled = true;
        showStatus('Выберите вариант прошивки', 'warning');
        return;
    }

    selectedVariant = value;
    const variant = getActiveVariants()[value];
    if (!variant) {
        log('Неизвестный вариант: ' + value);
        showStatus('Неизвестный вариант: ' + value, 'error');
        flashBtn.disabled = true;
        return;
    }
    log('Выбран вариант: ' + variant.description);

    detectedInfo.classList.add('active');
    detectedInfo.innerHTML = '';
    const br = document.createElement('br');
    detectedInfo.appendChild(br);
    detectedInfo.appendChild(document.createTextNode(' Чип: '));
    const bChip = document.createElement('b');
    bChip.textContent = detectedChip;
    detectedInfo.appendChild(bChip);
    detectedInfo.appendChild(document.createElement('br'));
    detectedInfo.appendChild(document.createTextNode(' Вариант: '));
    const bVar = document.createElement('b');
    bVar.textContent = variant.description;
    detectedInfo.appendChild(bVar);

    zipData = await downloadVariantZip(variant);
    if (!zipData) {
        flashBtn.disabled = true;
        return;
    }

    await populateDownloadList(zipData);
    flashBtn.disabled = false;
    showStatus('Готово к прошивке: ' + variant.description, 'success');
    unlockStep(stepEls.flash);
};

flashBtn.onclick = async () => {
    if (isFlashing || isConnecting) {
        log('Прошивка уже выполняется');
        return;
    }

    const flashMode = document.getElementById('flashMode')?.value || 'all';

    if (useMishanya && flashMode !== 'all') {
        log('ОШИБКА: для прошивки MishanyaTS доступна только полная прошивка');
        showStatus('Для прошивки MishanyaTS доступна только полная прошивка', 'error');
        return;
    }

    if (!loader || !zipData || !selectedVariant) {
        log('Не всё готово для прошивки');
        return;
    }

    const variant = getActiveVariants()[selectedVariant];

    isFlashing = true;
    flashBtn.disabled = true;
    connectBtn.disabled = true;
    setProgress(0, '0%');

    try {
        log('Подготовка файлов...');
        showStatus('Подготовка файлов...', 'info');

        const partsToFlash = getPartsForFlashMode(variant, flashMode);

        if (partsToFlash.length === 0) {
            log('ОШИБКА: не выбрано ни одного файла для прошивки');
            flashBtn.disabled = false;
            connectBtn.disabled = false;
            return;
        }

        log('Режим: ' + flashMode + ', файлов: ' + partsToFlash.length);
        log('Источник: ' + (useMishanya ? 'MishanyaTS' : 'an-core'));

        if (flashMode === 'firmware') {
            if (!confirm('Внимание: будет прошит ТОЛЬКО firmware.bin.\nPartition table должна совпадать.\n\nПродолжить?')) {
                flashBtn.disabled = false;
                connectBtn.disabled = false;
                return;
            }
        }
        if (flashMode === 'littlefs') {
            if (!confirm('Внимание: будет прошита ТОЛЬКО файловая система.\nПрошивка останется прежней.\n\nПродолжить?')) {
                flashBtn.disabled = false;
                connectBtn.disabled = false;
                return;
            }
        }

        const fileArray = [];
        const fileNames = [];

        for (const part of partsToFlash) {
            const file = findFileInZip(zipData, part.keywords);
            if (!file) {
                if (part.required) {
                    log('ОШИБКА: обязательный файл не найден: ' + part.keywords.join('+'));
                    continue;
                } else {
                    log('Пропуск необязательного: ' + part.keywords.join('+'));
                    continue;
                }
            }

            const arrayBuffer = await file.async('arraybuffer');
            const binaryString = Array.from(new Uint8Array(arrayBuffer))
                .map(b => String.fromCharCode(b)).join('');

            fileArray.push({
                data: binaryString,
                address: part.address
            });
            fileNames.push(file.name);

            log('  ' + file.name + ' @ 0x' + part.address.toString(16).padStart(8, '0') + ' (' + (arrayBuffer.byteLength / 1024).toFixed(1) + ' KB)');
        }

        if (fileArray.length === 0) {
            log('ОШИБКА: нет файлов для прошивки');
            flashBtn.disabled = false;
            connectBtn.disabled = false;
            return;
        }

        log('Начало прошивки...');
        showStatus('Прошивка... Не отключайте USB!', 'warning');

        await loader.writeFlash({
            fileArray: fileArray,
            flashSize: FLASH_OPTIONS.flashSize,
            flashMode: FLASH_OPTIONS.flashMode,
            flashFreq: FLASH_OPTIONS.flashFreq,
            eraseAll: FLASH_OPTIONS.eraseAll,
            compress: FLASH_OPTIONS.compress,

            reportProgress: (fileIndex, written, total) => {
                const percent = Math.round(written / total * 100);
                setProgress(percent, percent + '%');
                const currentName = fileNames[fileIndex] || 'файл';
                showStatus('Запись ' + currentName + '...', 'info');
            },
        });

        log('Прошивка успешно завершена!');

        try {
            if (typeof loader.hardReset === 'function') {
                await loader.hardReset();
                log('Hard reset выполнен');
            } else {
                log('Метод hardReset недоступен, пробуем через DTR/RTS');
                await transport.setDTR(false);
                await transport.setRTS(true);
                await new Promise(r => setTimeout(r, 100));
                await transport.setDTR(true);
                await transport.setRTS(false);
                await new Promise(r => setTimeout(r, 100));
                await transport.setDTR(false);
            }
        } catch (e) {
            log('Ошибка сброса: ' + e.message);
        }

        setProgress(100, '100%');
        showStatus('Прошивка успешно завершена!', 'success');
        log('ESP перезагружается...');

        setTimeout(() => hideProgress(), 2000);

        await safeClosePort();

        const flashModeSelect = document.getElementById('flashMode');
        if (flashModeSelect) flashModeSelect.value = 'all';
        resetDownloadState();
        lockAllSteps();

    } catch (e) {
        log('Ошибка прошивки: ' + e.message);
        showStatus('Ошибка прошивки: ' + e.message, 'error');
        await safeClosePort();
        resetDownloadState();
        lockAllSteps();
    } finally {
        isFlashing = false;
        flashBtn.disabled = false;
        connectBtn.disabled = false;
    }
};

function resetDownloadState() {
    zipData = null;
    selectedVariant = null;

    const box = document.getElementById('downloadList');
    if (box) box.innerHTML = '';

    const one = document.getElementById('downloadOneBtn');
    const all = document.getElementById('downloadAllBtn');
    if (one) one.disabled = true;
    if (all) all.disabled = true;

    const toggle = document.getElementById('dlToggle');
    if (toggle) toggle.checked = false;

    const panel = document.getElementById('dlPanel');
    if (panel) panel.classList.add('hidden');

    const hint = document.getElementById('dlHint');
    if (hint) hint.classList.remove('active');
}

async function populateDownloadList(zip) {
    const box = document.getElementById('downloadList');
    box.innerHTML = '';

    const paths = Object.keys(zip.files).filter(path => {
        const f = zip.files[path];
        if (f.dir) return false;
        return path.toLowerCase().endsWith('.bin');
    });

    if (paths.length === 0) {
        box.innerHTML = '<div style="color:#ff9999;font-size:13px;padding:6px 0;">В архиве не найдено .bin файлов</div>';
        document.getElementById('downloadOneBtn').disabled = true;
        document.getElementById('downloadAllBtn').disabled = false;
        const hint = document.getElementById('dlHint');
        if (hint) hint.classList.remove('active');
        return;
    }

    for (const path of paths) {
        const f = zip.files[path];
        const name = path.split('/').pop();

        let size = 0;
        if (f._data && typeof f._data.uncompressedSize === 'number' && f._data.uncompressedSize > 0) {
            size = f._data.uncompressedSize;
        } else if (f._data && typeof f._data.compressedSize === 'number') {
            size = f._data.compressedSize;
        }

        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = path;

        const span = document.createElement('span');
        span.textContent = name;

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'dl-size';
        sizeSpan.textContent = size > 0 ? ' (' + formatSize(size) + ')' : '';

        label.appendChild(cb);
        label.appendChild(span);
        label.appendChild(sizeSpan);
        box.appendChild(label);
    }

    const hint = document.getElementById('dlHint');
    if (hint) hint.classList.remove('active');

    document.getElementById('downloadOneBtn').disabled = false;
    document.getElementById('downloadAllBtn').disabled = false;
}

let deviceConnected = false;

const deviceHintEl = document.getElementById('deviceHint');

function updateConnectButtonState() {
    if (!('serial' in navigator)) {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Web Serial не поддерживается';
        if (deviceHintEl) deviceHintEl.classList.remove('active');
        return;
    }

    if (isConnecting || isFlashing) return;

    if (deviceConnected) {
        connectBtn.textContent = 'Подключиться к ESP';
        connectBtn.classList.remove('btn-muted');
        connectBtn.classList.add('btn-ready');
        if (deviceHintEl) deviceHintEl.classList.add('active');
    } else {
        connectBtn.textContent = 'Подключиться к ESP';
        connectBtn.classList.remove('btn-ready');
        connectBtn.classList.add('btn-muted');
        if (deviceHintEl) deviceHintEl.classList.remove('active');
    }

    connectBtn.disabled = false;
}

async function refreshDevicePresence() {
    if (!('serial' in navigator)) {
        deviceConnected = false;
        updateConnectButtonState();
        return;
    }

    try {
        const ports = await navigator.serial.getPorts();

        // Если у браузера нет разрешений — портов не будет
        if (ports.length === 0) {
            deviceConnected = false;
            updateConnectButtonState();
            return;
        }

        let found = false;

        for (const p of ports) {
            if (typeof p.connected === 'boolean') {
                if (p.connected) {
                    found = true;
                    break;
                }
                continue;
            }

            try {
                await p.open({
                    baudRate: 115200
                });
                await p.close();
                found = true;
                break;
            } catch (e) {
                console.log('[WebSerial] порт недоступен:', e.message);
            }
        }

        deviceConnected = found;
    } catch (e) {
        console.error('[WebSerial] ошибка проверки портов:', e);
        deviceConnected = false;
    }

    updateConnectButtonState();
}

(async () => {
    await refreshDevicePresence();
})();

navigator.serial.addEventListener('connect', async () => {
    console.log('[WebSerial] устройство подключено');
    await refreshDevicePresence();
});

navigator.serial.addEventListener('disconnect', async () => {
    console.log('[WebSerial] устройство отключено');
    await refreshDevicePresence();
});

updateConnectButtonState();

document.getElementById('downloadOneBtn').onclick = async () => {
    if (!zipData) return;

    const checked = Array.from(document.querySelectorAll('#downloadList input:checked'));
    if (checked.length === 0) return;

    if (checked.length === 1) {
        const path = checked[0].value;
        const blob = await zipData.files[path].async('blob');
        downloadBlob(blob, path.split('/').pop());
        return;
    }

    const newZip = new JSZip();
    for (const cb of checked) {
        const path = cb.value;
        const blob = await zipData.files[path].async('blob');
        newZip.file(path.split('/').pop(), blob);
    }
    const out = await newZip.generateAsync({
        type: 'blob'
    });
    downloadBlob(out, (selectedVariant || 'firmware') + '_selected.zip');
};

document.getElementById('downloadAllBtn').onclick = async () => {
    if (!zipData) return;
    const blob = await zipData.generateAsync({
        type: 'blob'
    });
    downloadBlob(blob, (selectedVariant || 'firmware') + '.zip');
};

document.getElementById('dlToggle').addEventListener('change', function() {
    const panel = document.getElementById('dlPanel');
    const hint = document.getElementById('dlHint');

    if (this.checked) {
        panel.classList.remove('hidden');
        if (!zipData) hint.classList.add('active');
        else hint.classList.remove('active');
    } else {
        panel.classList.add('hidden');
        hint.classList.remove('active');
    }
});

document.getElementById('mishanyaToggle').addEventListener('change', function() {
    useMishanya = this.checked;

    const warn = document.getElementById('mishanyaWarning');
    const flashMode = document.getElementById('flashMode');

    if (this.checked) {
        warn.style.display = 'block';
        flashMode.value = 'all';
        flashMode.querySelector('option[value="firmware"]').disabled = true;
        flashMode.querySelector('option[value="littlefs"]').disabled = true;
    } else {
        warn.style.display = 'none';
        flashMode.querySelector('option[value="firmware"]').disabled = false;
        flashMode.querySelector('option[value="littlefs"]').disabled = false;
    }

    resetDownloadState();
    flashBtn.disabled = true;
    selectedVariant = null;

    if (detectedChip && detectedChip.includes('ESP32-S3')) {
        variantSelector.style.display = 'block';
        variantSelect.innerHTML = '<option value="">- выберите вариант -</option>';
        for (const [key, variant] of Object.entries(getActiveVariants())) {
            if (variant.chipFamily === 'ESP32-S3') {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = variant.description;
                variantSelect.appendChild(opt);
            }
        }
        showStatus('Выберите вариант прошивки', 'info');
    }
});
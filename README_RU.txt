UHU CRM (Google Sheets + Apps Script) — инструкция для «чайника»

ЧТО ПОЛУЧИШЬ
- Заявка с сайта → падает в Google Sheets
- В таблице есть статус (NEW / IN_WORK / DONE / CANCELLED)
- Цвета строк по статусу (условное форматирование)
- Telegram-уведомления о новых заявках (опционально)

ШАГ 1. СОЗДАЙ GOOGLE SHEET
1) Google Drive → New → Google Sheets
2) Назови файл: UHU CRM
3) Скопируй ID таблицы (это кусок в адресе):
   https://docs.google.com/spreadsheets/d/  [SHEET_ID]  /edit

ШАГ 2. ОТКРОЙ APPS SCRIPT
1) В таблице: Extensions → Apps Script
2) Удали всё в Code.gs
3) Вставь код из файла apps-script/Code.gs
4) Сохрани (Ctrl+S)

ШАГ 3. ДОБАВЬ SCRIPT PROPERTIES
1) В Apps Script: Project Settings (шестерёнка слева)
2) Script Properties → Add property:
   - SHEET_ID = (вставь ID таблицы)
   - SHEET_NAME = Leads

(ОПЦИОНАЛЬНО) TELEGRAM
A) Создай бота через @BotFather → получи TG_BOT_TOKEN
B) Узнай chat_id:
   - Напиши боту любое сообщение
   - Открой в браузере:
     https://api.telegram.org/bot<TOKEN>/getUpdates
   - В ответе найди "chat":{"id":123456789,...} → это TG_CHAT_ID
C) Добавь в Script Properties:
   - TG_BOT_TOKEN = ...
   - TG_CHAT_ID = ...

ШАГ 4. DEPLOY (WEB APP)
1) В Apps Script: Deploy → New deployment
2) Select type → Web app
3) Execute as: Me
4) Who has access: Anyone
5) Deploy → Authorize доступы
6) Скопируй URL вида:
   https://script.google.com/macros/s/XXXXX/exec

ШАГ 5. ВСТАВЬ URL В crm-config.js
1) Открой файл crm-config.js в репозитории
2) Замени:
   endpoint: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
   на свой URL из шага 4
3) Commit

ШАГ 6. ПРОВЕРКА
1) Открой сайт
2) Заполни форму → Submit
3) Открой таблицу → лист Leads → должна появиться строка

ЕСЛИ НЕ ПРИХОДЯТ ЗАЯВКИ
- Проверь, что Web App доступен "Anyone"
- Проверь, что endpoint вставлен без пробелов
- Проверь Script Properties: SHEET_ID правильный

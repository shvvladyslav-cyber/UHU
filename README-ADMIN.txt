UHU — Admin Cabinet Patch

Что внутри:
1) index.html — кнопка "Кабинет" показывается ТОЛЬКО если открыть сайт с ?admin=1
2) cabinet.html — удобный кабинет: "Открыть CRM", проверка endpoint, сохранение ссылок в браузере
3) crm-config.js — добавлено поле sheetUrl + ссылки Telegram/Revolut
4) templates/Leads-template.csv — заголовки таблицы (опционально)

Важно:
- Чтобы увидеть кнопку: открой https://uhu.digital/?admin=1
- Затем нажми "Кабинет" → откроется /cabinet.html?admin=1
- В crm-config.js обязательно вставь:
  - endpoint (Web App URL из Apps Script)
  - sheetUrl (ссылка на Google Sheet)
НОВОЕ (кнопки в кабинете):
- "Открыть лист Leads" — использует Sheet URL + GID вкладки (если указал).
- "Открыть заявки NEW" — работает идеально, если ты создашь Filter view в Google Sheets и вставишь ссылку на него.

Как сделать ссылку на заявки NEW (Filter view) за 1 минуту:
1) Открой свою таблицу → вкладка Leads.
2) Данные → Создать новый вид фильтра (Create new filter view).
3) В колонке Status выбери только "NEW".
4) Скопируй ссылку из адресной строки браузера (обычно там появляется параметр fvid=...).
5) Вставь эту ссылку в кабинете в поле "Ссылка на фильтр/вид NEW" → Сохранить.
Готово: кнопка "Открыть заявки NEW" будет сразу открывать отфильтрованные NEW.

Где взять GID вкладки:
- Открой вкладку Leads → в URL будет #gid=123456789 → это и есть GID. Вставь только число.


=== ОБНОВЛЕНИЕ 2025-12-27 ===
В cabinet.html добавлены:
- Кнопки статусов NEW/IN_WORK/DONE/CANCELLED (ссылки на фильтры)
- Мини-таблица последних 10 заявок (берёт JSON из Apps Script: GET ?action=leads&limit=10)
Файл Apps Script лежит в папке apps-script/Code.gs


=== ВАЖНО ДЛЯ КНОПКИ “+1 статус” ===
1) В Apps Script → Project Settings → Script Properties добавь:
   ADMIN_KEY = (любой секретный ключ, напр. uhu-12345)
2) В кабинете (cabinet.html) вставь этот ключ в поле ADMIN_KEY и нажми “Сохранить”.
3) Без ADMIN_KEY статус менять нельзя (это защита от чужих).

UHU.digital — ФИНАЛ (для чайника)

1) Загрузить файлы в GitHub (репозиторий shvvladyslav-cyber/UHU)
   ВАЖНО: удалять репозиторий НЕ нужно.
   Проще всего: открыть репозиторий → кнопка Add file → Upload files → перетащить ВСЕ файлы из этого архива → Commit changes.

2) Подключить CRM (Google Sheets + Apps Script)
   - Создай таблицу Google Sheets с листом "Leads" (или любое имя, но тогда поменяй SHEET_NAME).
   - Открой Apps Script:
       Таблица → Extensions → Apps Script
   - Вставь код из apps-script/Code.gs (заменить всё).
   - Project Settings → Script Properties (СВОЙСТВА СКРИПТА):
       SHEET_ID    = ID таблицы (между /d/ и /edit в URL)
       SHEET_NAME  = Leads
       TG_BOT_TOKEN = (опционально)
       TG_CHAT_ID   = (опционально)
   - Deploy → New deployment → Select type: Web app
       Execute as: Me
       Who has access: Anyone
     Deploy → Copy URL

   - Открой файл crm-config.js и вставь URL в endpoint.

3) Проверка
   - Открой сайт. Внизу появится тост, если CRM не настроен.
   - Заполни форму → Отправить заявку → в Sheets должна появиться новая строка.

4) Если в PWA (приложении) кэш старый
   - Android: Настройки → Приложения → UHU → Хранилище → Очистить кеш/данные
   - Или: в браузере открой DevTools → Application → Service Workers → Unregister (если есть).

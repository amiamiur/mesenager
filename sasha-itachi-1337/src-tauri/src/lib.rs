//Импортируем типы для migrations
use tauri_plugin_sql::{Migration, MigrationKind};

// Аннотация для мобильных платформ
#[cfg_attr(mobile, tauri::mobile_entry_point)]

// Главная функция запуска приложения
pub fn run() {
    //Создаем список миграций
    let migrations = vec![Migration {
        version: 1,
        description: "create_message_table",
        sql: include_str!("../migrations/0001_initial.sql"),
        kind: MigrationKind::Up, //Сдвиг базы вперёд
    }];

    // Создаем сборщик приложения
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        // Подключаем sql plugin
        .plugin(
            tauri_plugin_sql::Builder::default()
                // Связываем миграции с sql базой
                .add_migrations("sqlite:messenger.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

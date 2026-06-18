// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use remember_lib::storage;
use remember_lib::commands;
use std::sync::{Arc, Mutex};
use commands::AppState;
use storage::StorageManager;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_data_dir = app.path().app_data_dir()
                .expect("无法获取应用数据目录");
            
            // 创建目录（如果不存在）
            std::fs::create_dir_all(&app_data_dir)
                .expect("无法创建应用数据目录");
            
            // 初始化存储管理器
            let storage_manager = Arc::new(StorageManager::new());
            storage_manager.init_database(&app_data_dir)
                .expect("无法初始化数据库");
            
            // 创建应用状态
            let state = AppState {
                storage: storage_manager,
                is_locked: Mutex::new(true),
                master_key: Mutex::new(None),
            };
            
            // 管理状态
            app.manage(state);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 加密相关命令
            commands::derive_key,
            commands::encrypt_data,
            commands::decrypt_data,
            commands::generate_password,
            // 存储相关命令
            commands::save_credential,
            commands::get_credentials,
            commands::delete_credential,
            commands::update_credential,
            // 密钥管理
            commands::set_master_password,
            commands::verify_master_password,
            commands::is_master_password_set,
            commands::lock_app,
            commands::is_locked,
            // 导入导出
            commands::export_data,
            commands::import_data,
            // 回忆录相关命令
            commands::save_memoir,
            commands::get_memoirs,
            commands::get_memoir_by_id,
            commands::delete_memoir,
            commands::search_memoirs,
            commands::save_memoir_link,
            commands::get_memoir_links,
            commands::delete_memoir_link,
            // AI 相关命令
            commands::ai_chat,
            commands::ai_chat_stream,
            commands::get_memoir_prompt,
            commands::ai_find_related,
            commands::ai_extract_tags,
            commands::ai_generate_summary,
            commands::ai_analyze_emotion,
            // 习惯追踪命令
            commands::save_habit,
            commands::get_habits,
            commands::delete_habit,
            commands::save_habit_record,
            commands::get_habit_records,
            commands::get_habit_records_by_date_range,
            commands::delete_habit_record,
            // 知识库命令
            commands::save_knowledge,
            commands::get_knowledge_list,
            commands::delete_knowledge,
            commands::search_knowledge,
            // 思想日记命令
            commands::save_thought,
            commands::get_thoughts,
            commands::delete_thought,
            commands::search_thoughts,
            // 梦想清单命令
            commands::save_dream,
            commands::get_dreams,
            commands::delete_dream,
            commands::search_dreams,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

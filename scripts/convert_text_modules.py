#!/usr/bin/env python3
"""
Скрипт для конвертации text_modules.xlsx в JSON формат
"""
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

def convert_text_modules(file_path):
    """Конвертирует text_modules.xlsx в JSON"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb['БАЗА ГОТОВАЯ']
    
    # Структура данных для JSON
    result = {
        "ageGroups": {
            "12-17": {
                "motivation": {"L": "", "M": "", "R": ""},
                "start": {"L": "", "M": "", "R": ""},
                "conflict": {"L": "", "M": "", "R": ""},
                "expression": {"L": "", "M": "", "R": ""},
                "confidence": {"L": "", "M": "", "R": ""}
            },
            "18-20": {
                "motivation": {"L": "", "M": "", "R": ""},
                "start": {"L": "", "M": "", "R": ""},
                "conflict": {"L": "", "M": "", "R": ""},
                "expression": {"L": "", "M": "", "R": ""},
                "confidence": {"L": "", "M": "", "R": ""}
            },
            "21+": {
                "motivation": {"L": "", "M": "", "R": ""},
                "start": {"L": "", "M": "", "R": ""},
                "conflict": {"L": "", "M": "", "R": ""},
                "expression": {"L": "", "M": "", "R": ""},
                "confidence": {"L": "", "M": "", "R": ""}
            }
        }
    }
    
    # Маппинг возрастных групп из Excel в JSON ключи
    # Строка 2: колонки 2, 5, 8, 11 содержат названия групп
    # Структура: для каждой группы следующие 3 колонки - это L, M, R
    age_group_columns = {
        "12-17": {"start_col": 2, "name": "12-14 лет"},  # Колонка B (индекс 1), но также включает 15-17
        "18-20": {"start_col": 8, "name": "18-20 лет"},  # Колонка H (индекс 7)
        "21+": {"start_col": 11, "name": "21+ лет"}      # Колонка K (индекс 10)
    }
    
    # Также есть группа 15-17 лет в колонке 5, объединяем с 12-14 в 12-17
    # Строка 2: колонка 2 = "12-14 лет", колонка 5 = "15-17 лет" -> обе в "12-17"
    
    # Модули и их строки в Excel (1-based индексы)
    module_rows = {
        'expression': 5,   # Строка 5
        'confidence': 7,   # Строка 7
        'motivation': 12,  # Строка 12 - MOTIVATION
        'start': 14,       # Строка 14 - ACTIVATION
        'conflict': 16     # Строка 16 - COMMUNICATION
    }
    
    # Парсим данные
    for age_key, age_info in age_group_columns.items():
        start_col = age_info['start_col']  # 1-based индекс колонки
        
        # Для 12-17 нужно обработать две группы колонок (12-14 и 15-17)
        if age_key == "12-17":
            # Первая группа: колонки 2, 3, 4 (12-14 лет)
            cols_12_14 = [2, 3, 4]
            # Вторая группа: колонки 5, 6, 7 (15-17 лет)
            cols_15_17 = [5, 6, 7]
            
            # Используем данные из колонок 15-17 (более подходящие для 12-17)
            l_col, m_col, r_col = cols_15_17
        else:
            # Для других групп: start_col, start_col+1, start_col+2
            l_col = start_col
            m_col = start_col + 1
            r_col = start_col + 2
        
        # Парсим каждый модуль
        for module_name, row_num in module_rows.items():
            row = sheet[row_num]  # Получаем строку (1-based)
            
            # Получаем значения из нужных колонок (openpyxl использует 1-based индексы)
            l_val = row[l_col - 1].value if l_col <= len(row) else None
            m_val = row[m_col - 1].value if m_col <= len(row) else None
            r_val = row[r_col - 1].value if r_col <= len(row) else None
            
            # Преобразуем в строки и очищаем
            l_val = str(l_val).strip() if l_val else ""
            m_val = str(m_val).strip() if m_val else ""
            r_val = str(r_val).strip() if r_val else ""
            
            result["ageGroups"][age_key][module_name]["L"] = l_val
            result["ageGroups"][age_key][module_name]["M"] = m_val
            result["ageGroups"][age_key][module_name]["R"] = r_val
    
    # Сохраняем в JSON
    output_file = Path(__file__).parent.parent / "src" / "data" / "text_modules.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Создан файл: {output_file}")
    print(f"   Структура: {len(result['ageGroups'])} возрастных групп")
    for age_key, modules in result['ageGroups'].items():
        print(f"   {age_key}: {len(modules)} модулей")
        for module_name, bands in modules.items():
            has_data = any(bands[b] for b in ['L', 'M', 'R'])
            print(f"     - {module_name}: {'✅' if has_data else '❌'}")

if __name__ == "__main__":
    file_path = Path(__file__).parent.parent / "text_modules" / "text_modules.xlsx"
    
    if not file_path.exists():
        print(f"❌ Файл не найден: {file_path}")
        sys.exit(1)
    
    convert_text_modules(file_path)


#!/usr/bin/env python3
"""
Проверка соответствия структуры text_modules.xlsx и JSON
"""
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

def verify_structure(file_path):
    """Проверяет структуру Excel и сравнивает с JSON"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb['БАЗА ГОТОВАЯ']
    
    print("=" * 80)
    print("АНАЛИЗ СТРУКТУРЫ text_modules.xlsx")
    print("=" * 80)
    
    # Проверяем строку 2 (возрастные группы)
    print("\n📊 Строка 2 - Возрастные группы:")
    row2 = [cell.value for cell in sheet[2]]
    age_groups_found = []
    for idx, val in enumerate(row2):
        if val and isinstance(val, str) and 'лет' in val:
            print(f"  Колонка {idx+1}: {val}")
            age_groups_found.append((idx+1, val))
    
    # Проверяем строку 3 (диапазоны)
    print("\n📊 Строка 3 - Диапазоны:")
    row3 = [cell.value for cell in sheet[3]]
    ranges_found = []
    for idx, val in enumerate(row3):
        if val and isinstance(val, str) and '-' in val:
            print(f"  Колонка {idx+1}: {val}")
            ranges_found.append((idx+1, val))
    
    # Проверяем модули
    print("\n📊 Модули в Excel:")
    module_rows = {
        'EXPRESSION': 5,
        'CONFIDENCE': 7,
        'MOTIVATION': 12,
        'ACTIVATION': 14,
        'COMMUNICATION': 16
    }
    
    for module_name, row_num in module_rows.items():
        print(f"\n  {module_name} (строка {row_num}):")
        row = [cell.value for cell in sheet[row_num]]
        # Показываем первые несколько колонок с данными
        for idx, val in enumerate(row[:15]):
            if val and isinstance(val, str) and len(val) > 10:
                print(f"    Колонка {idx+1}: {str(val)[:60]}...")
    
    # Проверяем JSON
    print("\n" + "=" * 80)
    print("ПРОВЕРКА JSON ФАЙЛА")
    print("=" * 80)
    
    json_path = Path(__file__).parent.parent / "src" / "data" / "text_modules.json"
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        print("\n✅ JSON структура:")
        for age_key in json_data['ageGroups'].keys():
            print(f"  {age_key}:")
            for module_name in json_data['ageGroups'][age_key].keys():
                has_l = bool(json_data['ageGroups'][age_key][module_name]['L'])
                has_m = bool(json_data['ageGroups'][age_key][module_name]['M'])
                has_r = bool(json_data['ageGroups'][age_key][module_name]['R'])
                print(f"    {module_name}: L={has_l}, M={has_m}, R={has_r}")
    else:
        print("❌ JSON файл не найден")

if __name__ == "__main__":
    file_path = Path(__file__).parent.parent / "text_modules" / "text_modules.xlsx"
    
    if not file_path.exists():
        print(f"❌ Файл не найден: {file_path}")
        sys.exit(1)
    
    verify_structure(file_path)


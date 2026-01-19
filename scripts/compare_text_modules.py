#!/usr/bin/env python3
"""
Скрипт для сравнения text_modules.xlsx с text_modules.json
Проверяет корректность конвертации и соответствие данных
"""
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

def load_json(file_path):
    """Загружает JSON файл"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_excel_data(file_path):
    """Извлекает данные из Excel файла"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb['БАЗА ГОТОВАЯ']
    
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
    
    # Модули и их строки в Excel (1-based индексы)
    module_rows = {
        'expression': 5,   # Строка 5
        'confidence': 7,   # Строка 7
        'motivation': 12,  # Строка 12 - MOTIVATION
        'start': 14,       # Строка 14 - ACTIVATION
        'conflict': 16     # Строка 16 - COMMUNICATION
    }
    
    # Маппинг возрастных групп
    age_group_columns = {
        "12-17": {"cols": [5, 6, 7]},  # Колонки 15-17 лет (E, F, G)
        "18-20": {"cols": [8, 9, 10]},  # Колонки 18-20 лет (H, I, J)
        "21+": {"cols": [11, 12, 13]}   # Колонки 21+ лет (K, L, M)
    }
    
    # Парсим данные
    for age_key, age_info in age_group_columns.items():
        cols = age_info['cols']
        l_col, m_col, r_col = cols
        
        # Парсим каждый модуль
        for module_name, row_num in module_rows.items():
            row = sheet[row_num]  # Получаем строку (1-based)
            
            # Получаем значения из нужных колонок (openpyxl использует 1-based индексы)
            l_val = row[l_col - 1].value if l_col <= len(row) else None
            m_val = row[m_col - 1].value if m_col <= len(row) else None
            r_val = row[r_col - 1].value if r_col <= len(row) else None
            
            # Преобразуем в строки и очищаем
            l_val = str(l_val).strip() if l_val and str(l_val) != 'None' else ""
            m_val = str(m_val).strip() if m_val and str(m_val) != 'None' else ""
            r_val = str(r_val).strip() if r_val and str(r_val) != 'None' else ""
            
            result["ageGroups"][age_key][module_name]["L"] = l_val
            result["ageGroups"][age_key][module_name]["M"] = m_val
            result["ageGroups"][age_key][module_name]["R"] = r_val
    
    return result

def compare_data(excel_data, json_data):
    """Сравнивает данные из Excel и JSON"""
    issues = []
    matches = []
    
    for age_group in ["12-17", "18-20", "21+"]:
        if age_group not in excel_data["ageGroups"]:
            issues.append(f"❌ Возрастная группа {age_group} отсутствует в Excel")
            continue
        
        if age_group not in json_data["ageGroups"]:
            issues.append(f"❌ Возрастная группа {age_group} отсутствует в JSON")
            continue
        
        excel_modules = excel_data["ageGroups"][age_group]
        json_modules = json_data["ageGroups"][age_group]
        
        for module_name in ["motivation", "start", "conflict", "expression", "confidence"]:
            if module_name not in excel_modules:
                issues.append(f"❌ Модуль {module_name} отсутствует в Excel для группы {age_group}")
                continue
            
            if module_name not in json_modules:
                issues.append(f"❌ Модуль {module_name} отсутствует в JSON для группы {age_group}")
                continue
            
            excel_bands = excel_modules[module_name]
            json_bands = json_modules[module_name]
            
            for band in ["L", "M", "R"]:
                excel_text = excel_bands.get(band, "").strip()
                json_text = json_bands.get(band, "").strip()
                
                # Сравниваем тексты
                if excel_text == json_text:
                    matches.append(f"✅ {age_group}/{module_name}/{band}: совпадает")
                elif not excel_text and not json_text:
                    issues.append(f"⚠️  {age_group}/{module_name}/{band}: оба пустые")
                elif not excel_text:
                    issues.append(f"❌ {age_group}/{module_name}/{band}: пусто в Excel, но есть в JSON")
                elif not json_text:
                    issues.append(f"❌ {age_group}/{module_name}/{band}: есть в Excel, но пусто в JSON")
                else:
                    # Сравниваем длину и первые символы
                    excel_len = len(excel_text)
                    json_len = len(json_text)
                    
                    if excel_len != json_len:
                        issues.append(f"⚠️  {age_group}/{module_name}/{band}: разная длина (Excel: {excel_len}, JSON: {json_len})")
                    
                    # Проверяем первые 50 символов
                    excel_preview = excel_text[:50].replace('\n', ' ')
                    json_preview = json_text[:50].replace('\n', ' ')
                    
                    if excel_preview != json_preview:
                        issues.append(f"❌ {age_group}/{module_name}/{band}: тексты различаются")
                        issues.append(f"   Excel: {excel_preview}...")
                        issues.append(f"   JSON:  {json_preview}...")
                    else:
                        matches.append(f"✅ {age_group}/{module_name}/{band}: начало совпадает (длина может отличаться)")
    
    return matches, issues

def main():
    base_path = Path(__file__).parent.parent
    
    excel_path = base_path / "text_modules" / "text_modules.xlsx"
    json_path = base_path / "src" / "data" / "text_modules.json"
    
    print("=" * 80)
    print("СРАВНЕНИЕ ТЕКСТОВЫХ МОДУЛЕЙ: Excel vs JSON")
    print("=" * 80)
    print()
    
    # Проверка существования файлов
    if not excel_path.exists():
        print(f"❌ Файл Excel не найден: {excel_path}")
        sys.exit(1)
    
    if not json_path.exists():
        print(f"❌ Файл JSON не найден: {json_path}")
        sys.exit(1)
    
    print(f"📄 Excel файл: {excel_path}")
    print(f"📄 JSON файл: {json_path}")
    print()
    
    # Загружаем данные
    print("Загрузка данных...")
    try:
        excel_data = extract_excel_data(excel_path)
        print("✅ Excel данные загружены")
    except Exception as e:
        print(f"❌ Ошибка загрузки Excel: {e}")
        sys.exit(1)
    
    try:
        json_data = load_json(json_path)
        print("✅ JSON данные загружены")
    except Exception as e:
        print(f"❌ Ошибка загрузки JSON: {e}")
        sys.exit(1)
    
    print()
    
    # Сравниваем
    print("Сравнение данных...")
    matches, issues = compare_data(excel_data, json_data)
    
    print()
    print("=" * 80)
    print("РЕЗУЛЬТАТЫ СРАВНЕНИЯ")
    print("=" * 80)
    print()
    
    if matches:
        print(f"✅ Совпадений: {len(matches)}")
        if len(matches) <= 20:
            for match in matches:
                print(f"  {match}")
        else:
            for match in matches[:10]:
                print(f"  {match}")
            print(f"  ... и еще {len(matches) - 10} совпадений")
        print()
    
    if issues:
        print(f"⚠️  Проблем/различий: {len(issues)}")
        for issue in issues:
            print(f"  {issue}")
        print()
    else:
        print("✅ Все данные совпадают!")
        print()
    
    # Статистика
    print("=" * 80)
    print("СТАТИСТИКА")
    print("=" * 80)
    
    total_expected = 3 * 5 * 3  # 3 возрастные группы × 5 модулей × 3 диапазона
    total_matches = len(matches)
    total_issues = len(issues)
    
    print(f"Всего ожидается записей: {total_expected}")
    print(f"Совпадений: {total_matches}")
    print(f"Проблем/различий: {total_issues}")
    print(f"Процент совпадения: {(total_matches / total_expected * 100):.1f}%")
    print()
    
    # Проверка структуры JSON для использования в коде
    print("=" * 80)
    print("ПРОВЕРКА СТРУКТУРЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В КОДЕ")
    print("=" * 80)
    
    # Проверяем, что структура соответствует ожидаемой в resolveVipMetrics.ts
    code_structure_ok = True
    
    for age_group in ["12-17", "18-20", "21+"]:
        if age_group not in json_data.get("ageGroups", {}):
            print(f"❌ Отсутствует возрастная группа: {age_group}")
            code_structure_ok = False
            continue
        
        age_data = json_data["ageGroups"][age_group]
        
        for module_name in ["motivation", "start", "conflict", "expression", "confidence"]:
            if module_name not in age_data:
                print(f"❌ Отсутствует модуль {module_name} для группы {age_group}")
                code_structure_ok = False
                continue
            
            module_data = age_data[module_name]
            
            for band in ["L", "M", "R"]:
                if band not in module_data:
                    print(f"❌ Отсутствует диапазон {band} для {age_group}/{module_name}")
                    code_structure_ok = False
    
    if code_structure_ok:
        print("✅ Структура JSON полностью соответствует ожидаемой в коде")
        print("   (ageGroups -> [ageGroup] -> [module] -> [L/M/R])")
    print()

if __name__ == "__main__":
    main()



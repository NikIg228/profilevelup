#!/usr/bin/env python3
"""
Скрипт для конвертации Excel файлов VIP тестов в JSON формат
"""
import json
import sys
import re
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

def parse_question_number(text):
    """Извлекает номер вопроса из текста"""
    if not text:
        return None
    
    text = str(text).strip()
    # Ищем паттерны: "1.", "1)", "1 " и т.д.
    match = re.search(r'^(\d+)[.)\s]', text)
    if match:
        return int(match.group(1))
    return None

def is_question_start(text):
    """Проверяет, является ли текст началом вопроса"""
    if not text:
        return False
    
    text = str(text).strip()
    # Вопрос начинается с номера
    if re.match(r'^\d+[.)\s]', text):
        return True
    return False

def is_option(text):
    """Проверяет, является ли текст вариантом ответа"""
    if not text:
        return False
    text = str(text).strip()
    # Поддерживаем как латинскую B, так и кириллическую В
    return text.startswith('A)') or text.startswith('B)') or text.startswith('В)')

def get_dichotomy_for_question(question_num):
    """Определяет дихотомию для вопроса согласно vip_rules.md"""
    # E/I: 1, 5, 9, 13, 17, 21, 25
    # S/N: 2, 6, 10, 14, 18, 22, 26
    # T/F: 3, 7, 11, 15, 19, 23, 27
    # J/P: 4, 8, 12, 16, 20, 24, 28
    
    ei_questions = [1, 5, 9, 13, 17, 21, 25]
    sn_questions = [2, 6, 10, 14, 18, 22, 26]
    tf_questions = [3, 7, 11, 15, 19, 23, 27]
    jp_questions = [4, 8, 12, 16, 20, 24, 28]
    
    if question_num in ei_questions:
        return 'EI', 'E', 'I'
    elif question_num in sn_questions:
        return 'SN', 'S', 'N'
    elif question_num in tf_questions:
        return 'TF', 'T', 'F'
    elif question_num in jp_questions:
        return 'JP', 'J', 'P'
    return None, None, None

def read_excel_file(file_path):
    """Читает Excel файл и возвращает данные в виде структуры"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    
    questions = []
    current_question = None
    
    for row in sheet.iter_rows(values_only=True):
        if not row or not row[0]:
            # Пустая строка - завершаем текущий вопрос
            if current_question and len(current_question['options']) == 2:
                questions.append(current_question)
                current_question = None
            continue
        
        cell_value = str(row[0]).strip()
        
        # Проверяем, является ли это началом нового вопроса
        question_num = parse_question_number(cell_value)
        
        if question_num and question_num <= 28:
            # Сохраняем предыдущий вопрос, если он был
            if current_question and len(current_question['options']) == 2:
                questions.append(current_question)
            
            # Определяем дихотомию для вопроса
            dichotomy, primary, secondary = get_dichotomy_for_question(question_num)
            if not dichotomy:
                continue
            
            # Извлекаем текст вопроса (убираем номер)
            question_text = re.sub(r'^\d+[.)\s]+', '', cell_value).strip()
            
            current_question = {
                "id": question_num,
                "text": question_text,
                "options": []
            }
            continue
        
        # Проверяем, является ли это вариантом ответа
        if current_question and is_option(cell_value):
            option_text = cell_value[2:].strip()  # Убираем "A)" или "B)"
            
            # Буква находится во второй колонке
            option_letter = None
            if len(row) > 1 and row[1]:
                option_letter = str(row[1]).strip()
            
            # Определяем значение варианта (A или B)
            # Поддерживаем как латинскую B, так и кириллическую В
            if cell_value.startswith('A)'):
                option_value = 'A'
            elif cell_value.startswith('B)') or cell_value.startswith('В)'):
                option_value = 'B'
            else:
                continue
            
            # Если буква не указана, используем дихотомию
            if not option_letter or option_letter not in ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']:
                dichotomy, primary, secondary = get_dichotomy_for_question(current_question['id'])
                if option_value == 'A':
                    option_letter = primary
                else:
                    option_letter = secondary
            
            current_question['options'].append({
                "value": option_value,
                "label": option_text
            })
    
    # Сохраняем последний вопрос
    if current_question and len(current_question['options']) == 2:
        questions.append(current_question)
    
    # Сортируем вопросы по ID
    questions.sort(key=lambda x: x['id'])
    
    return questions

def convert_vip_tests():
    """Конвертирует все VIP тесты из Excel в JSON"""
    base_dir = Path(__file__).parent.parent
    tests_dir = base_dir / "tests" / "VIP"
    output_dir = base_dir / "src" / "tests" / "VIP"
    
    # Создаем выходную директорию
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Маппинг файлов на возрастные группы
    age_mapping = {
        "12-17.xlsx": "12-17",
        "18-20.xlsx": "18-20",
        "21+.xlsx": "21+"
    }
    
    for excel_file, age_group in age_mapping.items():
        excel_path = tests_dir / excel_file
        
        if not excel_path.exists():
            print(f"⚠️  Файл не найден: {excel_path}")
            continue
        
        print(f"📖 Читаю {excel_file}...")
        
        try:
            questions = read_excel_file(excel_path)
            
            if not questions:
                print(f"⚠️  Не найдено вопросов в {excel_file}")
                continue
            
            if len(questions) != 28:
                print(f"⚠️  Найдено {len(questions)} вопросов вместо 28 в {excel_file}")
            
            # Создаем конфигурацию теста согласно vip_rules.md
            config = {
                "meta": {
                    "tariff": "EXTENDED",  # VIP тесты используют EXTENDED тариф
                    "ageGroup": age_group
                },
                "questions": questions,
                "resultMapping": {
                    "EI": {
                        "questions": [1, 5, 9, 13, 17, 21, 25],
                        "primary": "E",
                        "secondary": "I",
                        "middle": "Z"
                    },
                    "SN": {
                        "questions": [2, 6, 10, 14, 18, 22, 26],
                        "primary": "S",
                        "secondary": "N",
                        "middle": "X"
                    },
                    "TF": {
                        "questions": [3, 7, 11, 15, 19, 23, 27],
                        "primary": "T",
                        "secondary": "F",
                        "middle": "Q"
                    },
                    "JP": {
                        "questions": [4, 8, 12, 16, 20, 24, 28],
                        "primary": "J",
                        "secondary": "P",
                        "middle": "W"
                    }
                }
            }
            
            # Сохраняем в JSON
            output_file = output_dir / f"{age_group.replace('+', 'plus')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Создан {output_file.name} ({len(questions)} вопросов)")
            print(f"   Блок E/I: {len([q for q in questions if q['id'] in [1,5,9,13,17,21,25]])} вопросов")
            print(f"   Блок S/N: {len([q for q in questions if q['id'] in [2,6,10,14,18,22,26]])} вопросов")
            print(f"   Блок T/F: {len([q for q in questions if q['id'] in [3,7,11,15,19,23,27]])} вопросов")
            print(f"   Блок J/P: {len([q for q in questions if q['id'] in [4,8,12,16,20,24,28]])} вопросов")
            
        except Exception as e:
            print(f"❌ Ошибка при обработке {excel_file}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    convert_vip_tests()
    print("\n✨ Конвертация завершена!")


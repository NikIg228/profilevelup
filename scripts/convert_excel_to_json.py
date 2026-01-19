#!/usr/bin/env python3
"""
Скрипт для конвертации Excel файлов с тестами в JSON формат
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
    # Ищем паттерны: "1️⃣", "1.", "1)", "1 " и т.д.
    match = re.search(r'(\d+)[️⃣.)\s]', text)
    if match:
        return int(match.group(1))
    return None

def is_question_start(text):
    """Проверяет, является ли текст началом вопроса"""
    if not text:
        return False
    
    text = str(text).strip()
    # Вопрос начинается с эмодзи номера или содержит типичные слова вопроса
    if re.match(r'^\d+[️⃣.)\s]', text):
        return True
    if any(word in text.lower() for word in ['когда', 'если', 'в', 'обычно', 'тебе', 'ты', 'вам', 'вы']):
        # Но не вариант ответа
        if not text.startswith('а)') and not text.startswith('б)'):
            return True
    return False

def is_option(text):
    """Проверяет, является ли текст вариантом ответа"""
    if not text:
        return False
    text = str(text).strip()
    return text.startswith('а)') or text.startswith('б)')

def read_excel_file(file_path):
    """Читает Excel файл и возвращает данные в виде структуры"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    
    questions = []
    current_question = None
    question_counter = 0
    
    # Определяем тип вопроса по номеру (согласно free_rules.md)
    # 1: P/J, 2: E/I, 3: T/F, 4: J/P, 5: N/S
    question_types = {
        1: ['P', 'J'],
        2: ['E', 'I'],
        3: ['T', 'F'],
        4: ['J', 'P'],
        5: ['N', 'S']
    }
    
    skip_metadata = True  # Пропускаем метаданные в начале файла
    
    for row in sheet.iter_rows(values_only=True):
        if not row or not row[0]:
            # Пустая строка - завершаем текущий вопрос
            if current_question and len(current_question['options']) == 2:
                questions.append(current_question)
                current_question = None
            continue
        
        cell_value = str(row[0]).strip()
        
        # Пропускаем метаданные - ищем начало первого вопроса
        if skip_metadata:
            # Первый вопрос начинается с "Когда перед тобой" или "Когда перед вами"
            if 'когда перед тобой' in cell_value.lower() or 'когда перед вами' in cell_value.lower():
                skip_metadata = False
            else:
                continue
        
        # Проверяем, является ли это началом нового вопроса
        question_num = parse_question_number(cell_value)
        
        if question_num and question_num <= 5:
            # Сохраняем предыдущий вопрос, если он был
            if current_question and len(current_question['options']) == 2:
                questions.append(current_question)
            
            # Начинаем новый вопрос
            question_counter += 1
            expected_types = question_types.get(question_num, ['P', 'J'])
            
            # Извлекаем текст вопроса (убираем номер и эмодзи)
            question_text = re.sub(r'^\d+[️⃣.)\s]+', '', cell_value).strip()
            
            current_question = {
                "id": question_num,
                "text": question_text,
                "options": []
            }
            continue
        
        # Если нет номера, но это похоже на вопрос (для файла 12-17.xlsx)
        if not current_question and is_question_start(cell_value) and not is_option(cell_value):
            question_counter += 1
            # Определяем номер по порядку
            question_num = question_counter
            if question_num > 5:
                continue
            
            expected_types = question_types.get(question_num, ['P', 'J'])
            
            current_question = {
                "id": question_num,
                "text": cell_value,
                "options": []
            }
            continue
        
        # Проверяем, является ли это вариантом ответа
        if current_question and is_option(cell_value):
            option_text = cell_value[2:].strip()  # Убираем "а)" или "б)"
            
            # Буква находится во второй колонке
            option_value = None
            if len(row) > 1 and row[1]:
                option_value = str(row[1]).strip()
                if option_value not in ['P', 'J', 'E', 'I', 'T', 'F', 'N', 'S']:
                    option_value = None
            
            # Если буква не указана или неверная, определяем по логике вопроса
            if not option_value:
                expected_types = question_types.get(current_question['id'], ['P', 'J'])
                
                # Специальная логика для вопроса 4 (J/P)
                if current_question['id'] == 4:
                    # "Структура, сроки, порядок" = J
                    # "Свобода, по настроению" = P
                    if 'структур' in option_text.lower() or 'срок' in option_text.lower() or 'порядок' in option_text.lower() or 'договорённост' in option_text.lower():
                        option_value = 'J'
                    elif 'свобод' in option_text.lower() or 'настроени' in option_text.lower() or 'обстоятельств' in option_text.lower():
                        option_value = 'P'
                    else:
                        # По умолчанию используем порядок
                        option_value = expected_types[len(current_question['options'])]
                else:
                    # Для остальных вопросов используем порядок
                    option_value = expected_types[len(current_question['options'])]
            
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

def convert_free_tests():
    """Конвертирует все FREE тесты из Excel в JSON"""
    base_dir = Path(__file__).parent.parent
    tests_dir = base_dir / "tests" / "FREE"
    output_dir = base_dir / "src" / "tests" / "FREE"
    
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
            
            if len(questions) != 5:
                print(f"⚠️  Найдено {len(questions)} вопросов вместо 5 в {excel_file}")
            
            # Создаем конфигурацию теста согласно free_rules.md
            config = {
                "meta": {
                    "tariff": "FREE",
                    "ageGroup": age_group
                },
                "questions": questions,
                "resultMapping": {
                    "position1": {"from": 2},  # E/I из вопроса 2
                    "position2": {"from": 5},  # N/S из вопроса 5
                    "position3": {"from": 3},  # T/F из вопроса 3
                    "position4": {"from": [1, 4]}  # J/P/W из вопросов 1 и 4
                }
            }
            
            # Сохраняем в JSON
            output_file = output_dir / f"{age_group.replace('+', 'plus')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Создан {output_file.name} ({len(questions)} вопросов)")
            for q in questions:
                print(f"   Вопрос {q['id']}: {q['text'][:60]}...")
            
        except Exception as e:
            print(f"❌ Ошибка при обработке {excel_file}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    convert_free_tests()
    print("\n✨ Конвертация завершена!")

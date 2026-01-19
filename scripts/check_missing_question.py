#!/usr/bin/env python3
"""
Проверка отсутствующих вопросов в файле 12-17.xlsx
"""
import openpyxl
from pathlib import Path

def check_questions(file_path):
    """Проверяет наличие всех 28 вопросов"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    
    found_questions = set()
    
    for row in sheet.iter_rows(values_only=True):
        if row and row[0]:
            cell_value = str(row[0]).strip()
            # Ищем номера вопросов
            import re
            match = re.search(r'^(\d+)[.)\s]', cell_value)
            if match:
                q_num = int(match.group(1))
                if 1 <= q_num <= 28:
                    found_questions.add(q_num)
    
    print(f"\nФайл: {file_path.name}")
    print(f"Найдено вопросов: {len(found_questions)}")
    print(f"Найденные вопросы: {sorted(found_questions)}")
    
    all_questions = set(range(1, 29))
    missing = all_questions - found_questions
    
    if missing:
        print(f"⚠️  Отсутствующие вопросы: {sorted(missing)}")
    else:
        print("✅ Все 28 вопросов найдены")

if __name__ == "__main__":
    base_dir = Path(__file__).parent.parent
    excel_path = base_dir / "tests" / "VIP" / "12-17.xlsx"
    check_questions(excel_path)


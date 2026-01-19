#!/usr/bin/env python3
"""
Детальный анализ структуры text_modules.xlsx
"""
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Установите openpyxl: pip install openpyxl")
    sys.exit(1)

def inspect_detailed(file_path):
    """Детальный анализ структуры"""
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb['БАЗА ГОТОВАЯ']
    
    print("Детальный анализ листа 'БАЗА ГОТОВАЯ':\n")
    
    # Анализируем первые 20 строк и первые 15 колонок
    for row_idx in range(1, 21):
        row = sheet[row_idx]
        row_data = []
        for col_idx in range(1, 16):  # Колонки A-O
            cell = row[col_idx - 1]
            val = cell.value
            if val:
                val_str = str(val)[:50]  # Первые 50 символов
                row_data.append(f"Col{col_idx}: {repr(val_str)}")
        
        if row_data:
            print(f"Строка {row_idx}:")
            for item in row_data[:5]:  # Первые 5 колонок
                print(f"  {item}")
            if len(row_data) > 5:
                print(f"  ... и еще {len(row_data) - 5} колонок")
            print()

if __name__ == "__main__":
    file_path = Path(__file__).parent.parent / "text_modules" / "text_modules.xlsx"
    
    if not file_path.exists():
        print(f"❌ Файл не найден: {file_path}")
        sys.exit(1)
    
    inspect_detailed(file_path)


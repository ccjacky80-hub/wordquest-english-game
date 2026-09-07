from pathlib import Path
import openpyxl, json
p=Path('三年级英语词汇_Master_Database_v1.xlsx')
wb=openpyxl.load_workbook(p, read_only=True, data_only=True)
for s in ['00_Overview','02_Clean_Vocabulary','03_Game_Classification']:
 ws=wb[s]; rows=list(ws.iter_rows(values_only=True)); print('\n',s)
 for i,r in enumerate(rows[:55]): print(i+1,json.dumps(list(r),ensure_ascii=False))

from pathlib import Path
import openpyxl, json, collections, re
p=Path('三年级英语词汇_Master_Database_v1.xlsx')
wb=openpyxl.load_workbook(p, read_only=True, data_only=True)
for ws in wb.worksheets:
    rows=list(ws.iter_rows(values_only=True))
    print('\nSHEET',ws.title,'row_count_including_header',len(rows),'data_rows',max(0,len(rows)-1),'max_column',max((len(r) for r in rows),default=0))
    print('headers=',json.dumps(list(rows[0]) if rows else [],ensure_ascii=False))
    if ws.title in ('01_Raw_Vocabulary','02_Clean_Vocabulary','03_Game_Classification'):
      h=list(rows[0]); idx={str(v):i for i,v in enumerate(h) if v is not None}
      for key in ['Word','Canonical Word','MVP30','MVP Rank','Difficulty (1-5)','Difficulty','Imageability (1-5)','Imageability','Actionability','Related Words','Related Word','Confusing / Contrast Words','First Exposure','Recall / Production','File','Page','Unit','Lesson','Chinese (source)','Chinese']:
        if key in idx:
          vals=[r[idx[key]] for r in rows[1:] if len(r)>idx[key] and r[idx[key]] not in (None,'')]
          print(key,'nonempty',len(vals),'unique',len(set(map(str,vals))),'sample',list(dict.fromkeys(map(str,vals)))[:8])
      if 'Word' in idx:
        words=[str(r[idx['Word']]).strip().lower() for r in rows[1:] if len(r)>idx['Word'] and r[idx['Word']] not in (None,'')]
        print('unique_word_count',len(set(words)))
      if 'MVP30' in idx:
        mv=[r for r in rows[1:] if len(r)>idx['MVP30'] and str(r[idx['MVP30']]).strip().lower() in ('yes','y','true','1')]
        print('mvp_true_count',len(mv))

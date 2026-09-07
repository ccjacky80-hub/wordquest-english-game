# Content data

`三年级英语词汇_Master_Database_v1.xlsx` is the sole editable vocabulary source.

`vocabulary.clean.json` is deterministic generated output. Rebuild it with:

```text
python scripts/import_vocabulary.py
```

Runtime IDs are copied from the workbook Clean ID (`C0001`-style), not generated from array position.

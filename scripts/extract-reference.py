"""Re-extract frozen anonymous assets from the archived public Observable cell.
Does not fetch current data or write individual address records.
Run from any working directory: python3 scripts/extract-reference.py
"""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
source = (root / 'references/observable-cell.js').read_text()
decoder = json.JSONDecoder()
for name, filename in [('snapshot','heat-summary.json'),('boundaries','boroughs-simplified.geojson')]:
    marker = f'const {name} = '
    value, _ = decoder.raw_decode(source[source.index(marker) + len(marker):])
    (root / 'data' / filename).write_text(json.dumps(value,separators=(',',':')) + '\n')
    print(f'Extracted data/{filename}')

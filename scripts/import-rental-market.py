"""Build a small, dated market snapshot from StreetEasy's public Master Report.zip.
Usage: python3 scripts/import-rental-market.py /path/to/MasterReport.zip
Source: https://streeteasy.com/blog/data-dashboard/
"""
import csv,hashlib,io,json,sys,zipfile
from pathlib import Path
raw=Path(sys.argv[1]).read_bytes();master=zipfile.ZipFile(io.BytesIO(raw))
def read(metric,kind):
    z=zipfile.ZipFile(io.BytesIO(master.read(f'{metric}_{kind}.zip')))
    return list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode('utf-8-sig'))))
base=read('medianAskingRent','All');months=sorted(k for k in base[0] if len(k)==7 and k[4]=='-')[-13:]
areas={r['areaName']:{'name':r['areaName'],'borough':r['Borough'],'type':r['areaType'],'bedrooms':{}} for r in base}
for kind in ['All','Studio','OneBd','TwoBd','ThreePlusBd']:
    datasets={metric:{r['areaName']:r for r in read(metric,kind)} for metric in ['medianAskingRent','rentalInventory','discountShare']}
    for name,area in areas.items():
        record={}
        for metric,key in [('medianAskingRent','rent'),('rentalInventory','inventory'),('discountShare','rentCutShare')]:
            r=datasets[metric].get(name,{})
            record[key]=[float(r[m]) if r.get(m) else None for m in months]
        area['bedrooms'][kind]=record
out={'source':'StreetEasy Data Dashboard','sourceUrl':'https://streeteasy.com/blog/data-dashboard/','downloadUrl':'https://cdn-charts.streeteasy.com/Master%20Report.zip','retrieved':'2026-10-28','archiveSha256':hashlib.sha256(raw).hexdigest(),'months':months,'areas':list(areas.values())}
Path('data/rental-market.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
print(len(areas),'areas;',months[0],'to',months[-1])

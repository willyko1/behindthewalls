export const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const aliases={'bedstuy':'bedfordstuyvesant','bedfordstuy':'bedfordstuyvesant','kipsbay':'murrayhillkipsbay','ues':'uppereastside','uws':'upperwestside'};
export function matchNeighborhoods(query,features){
 const term=aliases[normalize(query)]||normalize(query);
 return term?features.filter(f=>normalize(f.properties.name).includes(term)).map(f=>f.properties.id):[];
}
export function summarize(rows,month=-1){
 const monthly=Array(8).fill(0),groups=new Map(),recurrence=[0,0,0];let reports=0,addresses=0;
 for(const b of rows){b.m.forEach((n,i)=>monthly[i]+=n);const n=month<0?b.m.reduce((a,v)=>a+v,0):b.m[month];if(!n)continue;
 reports+=n;addresses++;const g=groups.get(b.n)||{id:b.n,reports:0,addresses:0};g.reports+=n;g.addresses++;groups.set(b.n,g);
 const active=b.m.filter(n=>n>0).length;recurrence[active===1?0:active<=3?1:2]++;
 }
 return {monthly,groups:[...groups.values()],reports,addresses,recurrence};
}

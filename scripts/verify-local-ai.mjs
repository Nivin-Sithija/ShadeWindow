import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import SunCalc from 'suncalc';
globalThis.SunCalc=SunCalc;
const {plan,DEFAULT_PREFS}=await import('../public/core.js');
const base=process.env.APP_URL||'http://localhost:3000';
const cases=[
  {name:'shade and bench',request:'A gentle 20-minute walk, mostly shaded, with a bench halfway. Avoid rain.',expect:{duration:20,window:'afternoon',priority:'shade',rest:true,shadedRest:false,avoidRain:true,pace:3.6}},
  {name:'short morning walk',request:'I only have 10 minutes in the morning. Choose the shortest walk. No bench needed. Avoid rain.',expect:{duration:10,window:'morning',priority:'short',rest:false}},
  {name:'unsupported accessibility',request:'I need a wheelchair-accessible route with guaranteed step-free pavements.',unsupported:true}
];
const evidence={model:null,checkedAt:new Date().toISOString(),synthetic:true,cases:[]};
for(const c of cases){
  const response=await fetch(`${base}/api/plan`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:c.request,prefs:DEFAULT_PREFS,date:'2026-10-10',scenario:'clear'}),signal:AbortSignal.timeout(220000)});
  const data=await response.json();
  if(c.unsupported){assert.equal(response.status,422,JSON.stringify(data));}
  else{
    assert.equal(response.status,200,JSON.stringify(data));
    for(const [key,value]of Object.entries(c.expect))assert.equal(data.prefs[key],value,`${c.name}: ${key}`);
    const result=plan('2026-10-10',data.prefs,'clear');assert.ok(result.candidates.some(o=>o.id===data.selectedId),'Selection is a computed candidate');evidence.model=data.model;
  }
  evidence.cases.push({name:c.name,request:c.request,status:response.status,response:data,passed:true});
  console.log(`PASS ${c.name}${data.latency?` · ${(data.latency/1000).toFixed(1)}s`:''}`);
}
await mkdir('evidence',{recursive:true});await writeFile('evidence/local-ai.json',JSON.stringify(evidence,null,2)+'\n');
console.log('Recorded real local-model verification in evidence/local-ai.json');

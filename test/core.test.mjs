import test from 'node:test';
import assert from 'node:assert/strict';
import SunCalc from 'suncalc';
globalThis.SunCalc=SunCalc;
const {treeShadow,trees,classify,rayEntry,instant,sunAt,forecast,DEFAULT_PREFS,plan,evaluate,routes,routeLength,positionAlong,metresToPoint,validatePrefs}=await import('../public/core.js');
const eastSun={altitude:Math.PI/4,dx:1,dy:0};
test('10 m building casts a 10 m shadow at 45 degrees',()=>{
  const b=[{x:20,y:0,w:10,h:10,height:10}];
  assert.equal(classify([10.001,5],eastSun,b),'shade');
  assert.equal(classify([9.99,5],eastSun,b),'sun');
  assert.equal(classify([40,5],eastSun,b),'sun');
  assert.equal(classify([15,15],eastSun,b),'sun');
});
test('ray intersection handles parallel and diagonal rays',()=>{
  const b={x:10,y:10,w:10,h:10};
  assert.equal(rayEntry([0,15],[1,0],b),10);
  assert.equal(rayEntry([0,0],[1,0],b),null);
  assert.ok(Math.abs(rayEntry([0,0],[Math.SQRT1_2,Math.SQRT1_2],b)-Math.sqrt(200))<1e-10);
});
test('unknown height remains unknown; proven shade takes precedence',()=>{
  const missing={x:20,y:0,w:10,h:10,height:null};
  assert.equal(classify([10,5],eastSun,[missing]),'unknown');
  assert.equal(classify([10,5],eastSun,[missing,{x:15,y:0,w:2,h:10,height:10}]),'shade');
});
test('nighttime is never scored as shade',()=>assert.equal(classify([0,0],{...eastSun,altitude:-.1},[]),'night'));
test('Colombo wall time converts to the correct UTC instant',()=>assert.equal(new Date(instant('2026-10-10',600)).toISOString(),'2026-10-10T04:30:00.000Z'));
test('October Colombo noon has higher sun than late afternoon',()=>{
  assert.ok(sunAt('2026-10-10',720).altitude>sunAt('2026-10-10',1020).altitude);
  assert.ok(sunAt('2026-10-10',720).altitude>Math.PI/3);
});
test('route geometry gives known distances and bench placement',()=>{
  const r={points:[[0,0],[100,0],[100,100]]};assert.equal(routeLength(r),200);assert.deepEqual(positionAlong(r,150),[100,50]);assert.equal(metresToPoint(r,[100,25]),125);assert.equal(metresToPoint(r,[30,30]),null);
});
test('hourly weather covers the whole walk and never sums probabilities',()=>{
  const before=forecast('showers','2026-10-10',930,950),crossing=forecast('showers','2026-10-10',950,970);
  assert.equal(before.rainProbability,15);assert.equal(crossing.rainProbability,85);assert.equal(crossing.precipitation,2.5);
  assert.equal(forecast('clear','2026-10-17',900,920),null);
  assert.equal(forecast('clear','not-a-date',900,920),null);
});
test('weighted forecasts and storm flags are deterministic',()=>{
  assert.deepEqual(forecast('humid','2026-10-10',900,930),forecast('humid','2026-10-10',900,930));
  assert.equal(forecast('storm','2026-10-10',900,930).storm,true);
});
test('all scored loops respect duration and preserve distance fractions',()=>{
  for(const c of plan('2026-10-10',DEFAULT_PREFS,'clear').all){assert.ok(c.duration<=20);assert.ok(Math.abs(c.shade+c.exposed+c.unknown-1)<1e-8);if(c.score!==null)assert.ok(c.score>=0&&c.score<=100);}
});
test('weather changes departure recommendations without changing building shade',()=>{
  const clear=plan('2026-10-10',DEFAULT_PREFS,'clear'),rain=plan('2026-10-10',DEFAULT_PREFS,'showers');
  assert.ok(clear.candidates[0].start>rain.candidates[0].start);
  const a=evaluate(routes[0],'2026-10-10',900,DEFAULT_PREFS,'clear'),b=evaluate(routes[0],'2026-10-10',900,DEFAULT_PREFS,'humid');
  assert.equal(a.shade,b.shade);assert.equal(a.routeScore,b.routeScore);assert.notEqual(a.weatherScore,b.weatherScore);
});
test('storm scenario and impossible duration yield no recommendation',()=>{
  assert.equal(plan('2026-10-10',DEFAULT_PREFS,'storm').all.length,0);
  assert.equal(plan('2026-10-10',{...DEFAULT_PREFS,duration:8,pace:3},'clear').all.length,0);
});
test('required shaded bench is known shaded on arrival',()=>{
  const result=plan('2026-10-10',{...DEFAULT_PREFS,shadedRest:true},'clear');assert.ok(result.all.length>0);
  for(const c of result.all){assert.equal(c.bench.state,'shade');assert.ok(c.bench.arrival>=c.start&&c.bench.arrival<=c.end);assert.equal(classify(c.bench.point,sunAt(c.date,c.bench.arrival)),'shade');}
});
test('short-walk preference selects the shortest feasible loop',()=>{
  const result=plan('2026-10-10',{...DEFAULT_PREFS,priority:'short'},'clear');assert.equal(result.candidates[0].routeId,'short');
});
test('rest-independent score renormalizes components',()=>{
  const c=evaluate(routes[0],'2026-10-10',1050,{...DEFAULT_PREFS,rest:false},'clear');assert.equal(c.parts.rest,0);
  assert.equal(c.bench,null);
  assert.ok(Math.abs(c.parts.shade-c.shade*100*.6/.85)<1e-8);
});
test('uncertain paths do not display an aggregate score',()=>{
  const c=plan('2026-10-10',{...DEFAULT_PREFS,window:'any'},'clear').all.find(c=>c.unknown>.2);assert.ok(c);assert.equal(c.score,null);
});
test('preference validation rejects unsupported values',()=>{
  assert.throws(()=>validatePrefs({duration:100}));assert.throws(()=>validatePrefs({pace:20}));assert.throws(()=>validatePrefs({rest:'yes'}));
  assert.equal(validatePrefs({rest:false,shadedRest:true}).rest,true);
});

test('canopy shadow moves away from the sun and affects bench classification',()=>{
  const canopy={x:20,y:20,radius:3,height:10};
  const shadow=treeShadow(canopy,eastSun);
  assert.ok(Math.abs(shadow.x-10)<1e-8);assert.equal(shadow.y,20);
  assert.equal(classify([10,20],eastSun,[],[canopy]),'shade');
  assert.equal(classify([14,20],eastSun,[],[canopy]),'sun');
  assert.equal(classify([10,20],{...eastSun,dx:-1},[],[canopy]),'sun');
  assert.equal(treeShadow(canopy,{...eastSun,altitude:-.1}),null);
});
test('known canopy shade resolves unknown building shade and saved geometry can omit trees',()=>{
  const canopy={x:20,y:20,radius:3,height:10},missing={x:25,y:15,w:10,h:10,height:null};
  assert.equal(classify([10,20],eastSun,[missing],[]),'unknown');
  assert.equal(classify([10,20],eastSun,[missing],[canopy]),'shade');
});
test('synthetic trees contribute shade on real fixture paths',()=>{
  let added=0;
  for(const r of routes)for(let d=0;d<routeLength(r);d+=8){const point=positionAlong(r,d),sun=sunAt('2026-10-10',720);if(classify(point,sun,[],trees)==='shade')added++;}
  assert.ok(added>0);
});

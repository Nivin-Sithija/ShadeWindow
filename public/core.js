export const SITE = { name: 'Willow Quarter', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', offsetMinutes: 330, width: 620, height: 440, version: 'willow-v2' };
export const buildings = [
  { id:'b1', x:110,y:120,w:105,h:130,height:24 },
  { id:'b2', x:250,y:120,w:125,h:125,height:32 },
  { id:'b3', x:410,y:125,w:60,h:125,height:20 },
  { id:'b4', x:120,y:290,w:110,h:60,height:16 },
  { id:'b5', x:330,y:295,w:120,h:55,height:22 },
  { id:'b6', x:20,y:160,w:60,h:130,height:12 },
  { id:'b7', x:500,y:170,w:40,h:80,height:10 },
  { id:'b8', x:260,y:305,w:35,h:35,height:null }
];
// Synthetic opaque horizontal canopy disks; coordinates, radius and height in metres.
export const trees = [
  {x:518,y:120,radius:12,height:8},{x:574,y:140,radius:11,height:7},
  {x:580,y:307,radius:12,height:8},{x:519,y:304,radius:10,height:7},
  {x:59,y:345,radius:13,height:8},{x:60,y:105,radius:10,height:7},
  {x:570,y:200,radius:15,height:8},{x:188,y:270,radius:14,height:7}
];
export function treeShadow(tree,sun) {
  if(sun.altitude<=0)return null;
  const length=tree.height/Math.tan(sun.altitude);
  return {x:tree.x-sun.dx*length,y:tree.y-sun.dy*length,radius:tree.radius};
}
export const routes = [
  { id:'arcade', name:'The arcade loop', subtitle:'Quiet streets & a halfway pause', points:[[310,360],[100,360],[100,100],[240,100],[240,280],[310,280],[310,360]], benches:[{id:'arcade-seat', point:[100,210],name:'Courtyard bench'}] },
  { id:'garden', name:'The garden loop', subtitle:'Open space & a little more sky', points:[[310,360],[480,360],[480,280],[560,280],[560,100],[400,100],[400,280],[310,280],[310,360]], benches:[{id:'garden-seat',point:[560,200],name:'Garden bench'},{id:'east-seat',point:[400,210],name:'East lane bench'}] },
  { id:'short', name:'The little loop', subtitle:'A quick change of scenery', points:[[310,360],[100,360],[100,280],[310,280],[310,360]], benches:[{id:'little-seat',point:[180,280],name:'Pocket bench'}] }
];
export const SCENARIOS = { clear:'Sunny afternoon', humid:'Warm & humid', showers:'Showers later', storm:'Stormy day' };
export const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
export const routeLength = r => r.points.slice(1).reduce((sum,p,i)=>sum+distance(r.points[i],p),0);
export function instant(date,minute) { return new Date(`${date}T00:00:00Z`).getTime()+(minute-SITE.offsetMinutes)*60000; }
export function sunAt(date,minute) {
  const sun=globalThis.SunCalc.getPosition(new Date(instant(date,minute)),SITE.latitude,SITE.longitude);
  return { altitude:sun.altitude, azimuth:sun.azimuth, dx:-Math.sin(sun.azimuth), dy:Math.cos(sun.azimuth) };
}
export function rayEntry(point,dir,b) {
  let enter=0, exit=Infinity;
  for (const [p,d,min,max] of [[point[0],dir[0],b.x,b.x+b.w],[point[1],dir[1],b.y,b.y+b.h]]) {
    if(Math.abs(d)<1e-10) {if(p<min||p>max)return null; continue;}
    const t1=(min-p)/d,t2=(max-p)/d;
    enter=Math.max(enter,Math.min(t1,t2)); exit=Math.min(exit,Math.max(t1,t2));
    if(exit<enter)return null;
  }
  return exit>=0 ? enter : null;
}
export function classify(point,sun,blocks=buildings,canopies=trees) {
  if(sun.altitude<=0)return 'night';
  let unknown=false;
  for(const b of blocks) {
    const entry=rayEntry(point,[sun.dx,sun.dy],b);
    if(entry===null)continue;
    if(b.height===null) { unknown=true; continue; }
    if(entry*Math.tan(sun.altitude)<=b.height)return 'shade';
  }
  for(const tree of canopies){const shadow=treeShadow(tree,sun);if(Math.hypot(point[0]-shadow.x,point[1]-shadow.y)<=shadow.radius)return 'shade';}
  return unknown?'unknown':'sun';
}
export function shadowPolygon(b,sun) {
  if(b.height===null||sun.altitude<0.04)return null;
  const len=b.height/Math.tan(sun.altitude), dx=-sun.dx*len,dy=-sun.dy*len;
  const pts=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]];
  const all=[...pts,...pts.map(p=>[p[0]+dx,p[1]+dy])].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const half=[]; for(const p of all){while(half.length>=2&&cross(half.at(-2),half.at(-1),p)<=0)half.pop();half.push(p);}
  const upper=[];for(const p of [...all].reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  return [...half.slice(0,-1),...upper.slice(0,-1)];
}
export function positionAlong(r,metres) {
  for(let i=1;i<r.points.length;i++){const len=distance(r.points[i-1],r.points[i]);if(metres<=len){const f=metres/len;return [r.points[i-1][0]+f*(r.points[i][0]-r.points[i-1][0]),r.points[i-1][1]+f*(r.points[i][1]-r.points[i-1][1])];}metres-=len;}
  return r.points.at(-1);
}
export function metresToPoint(r,point) {
  let total=0;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=distance(a,b);if(Math.abs(distance(a,point)+distance(point,b)-len)<0.01)return total+distance(a,point);total+=len;}return null;
}
const clamp = x => Math.max(0,Math.min(1,x));
export function weatherHour(scenario,hour,day=0) {
  const peak=Math.sin(Math.max(0,Math.min(Math.PI,(hour-6)/12*Math.PI)));
  let temp=26+6*peak+day*0.12,humidity=62,apparent=temp+2,cloud=20,rainProbability=5,precipitation=0,wind=8,gust=14,storm=false;
  if(scenario==='humid'){humidity=83;temp-=1;apparent=temp+5;cloud=65;wind=5;gust=9;}
  if(scenario==='showers'){const wet=hour>=16;cloud=wet?90:35;rainProbability=wet?85:15;precipitation=wet?2.5:0;temp-=wet?4:0;apparent=temp+2;humidity=wet?85:68;gust=wet?25:15;}
  if(scenario==='storm'){cloud=95;rainProbability=95;precipitation=5;temp=27;apparent=30;humidity=90;wind=24;gust=48;storm=true;}
  return {temperature:temp,apparent,humidity,cloud,rainProbability,precipitation,wind,gust,uv:Math.round(9*peak),storm,source:'synthetic'};
}
export function forecast(scenario,date,start,end) {
  const day=Math.round((new Date(`${date}T00:00:00Z`)-new Date('2026-10-10T00:00:00Z'))/86400000);
  if(!SCENARIOS[scenario]||!Number.isFinite(day)||day<0||day>6||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start<0||end>1440)return null;
  let duration=0,temp=0,apparent=0,humidity=0,cloud=0,maxRain=0,maxAmount=0,maxGust=0,maxUv=0,storm=false;
  for(let h=Math.floor(start/60);h<Math.ceil(end/60);h++) {
    const weight=Math.min(end,(h+1)*60)-Math.max(start,h*60),w=weatherHour(scenario,h,day);
    duration+=weight;temp+=w.temperature*weight;apparent+=w.apparent*weight;humidity+=w.humidity*weight;cloud+=w.cloud*weight;
    maxRain=Math.max(maxRain,w.rainProbability);maxAmount=Math.max(maxAmount,w.precipitation);maxGust=Math.max(maxGust,w.gust);maxUv=Math.max(maxUv,w.uv);storm ||= w.storm;
  }
  return {temperature:temp/duration,apparent:apparent/duration,humidity:humidity/duration,cloud:cloud/duration,rainProbability:maxRain,precipitation:maxAmount,gust:maxGust,uv:maxUv,storm,source:'synthetic',version:'weather-v1',scenario};
}
export const DEFAULT_PREFS = {duration:20,window:'afternoon',priority:'shade',rest:true,shadedRest:false,avoidRain:true,pace:3.6};
export function validatePrefs(value) {
  const p={...DEFAULT_PREFS,...value};
  if(!Number.isFinite(p.duration)||p.duration<8||p.duration>45)throw Error('Choose a walk between 8 and 45 minutes.');
  if(!['morning','afternoon','any'].includes(p.window)||!['shade','short','rest'].includes(p.priority))throw Error('Unsupported walking preference.');
  if(![3,3.6,4.5].includes(p.pace))throw Error('Choose a supported walking pace.');
  for(const k of ['rest','shadedRest','avoidRain'])if(typeof p[k]!=='boolean')throw Error('Invalid preference.');
  if(p.shadedRest)p.rest=true;
  return p;
}
export function evaluate(r,date,start,p,scenario='clear',step=8) {
  const length=routeLength(r),speed=p.pace*1000/60,duration=length/speed,end=start+duration;
  if(duration>p.duration+0.001||end>1080)return null;
  const weather=forecast(scenario,date,start,end);
  if(!weather||weather.storm||(p.avoidRain&&(weather.rainProbability>=60||weather.precipitation>=1)))return null;
  let shaded=0,exposed=0,unknown=0,run=0,longest=0;
  const segments=[];
  for(let d=0;d<length;d+=step){const n=Math.min(step,length-d),point=positionAlong(r,d+n/2),sun=sunAt(date,start+(d+n/2)/speed),state=classify(point,sun);if(state==='night')return null;
    if(state==='shade'){shaded+=n;run=0;}else {if(state==='unknown')unknown+=n;else exposed+=n;run+=n;longest=Math.max(longest,run);}
    segments.push({a:positionAlong(r,d),b:positionAlong(r,d+n),state});
  }
  const benches=r.benches.map(b=>{const metres=metresToPoint(r,b.point),arrival=start+metres/speed,state=classify(b.point,sunAt(date,arrival)),timing=40*clamp(1-2*Math.abs(metres/length-.5));return {...b,arrival,state,score:state==='unknown'?null:(state==='shade'?60:0)+timing};});
  const eligible=p.shadedRest?benches.filter(b=>b.state==='shade'):benches;
  if(p.rest&&!eligible.length)return null;
  const bench=p.rest?([...eligible].sort((a,b)=>(b.score??-1)-(a.score??-1))[0]??null):null;
  const S=shaded/length,C=1-clamp(longest/speed/5),R=(bench?.score??0)/100;
  let weights=p.priority==='rest'?[.45,.20,.35]:[.60,.25,.15];if(!p.rest){weights[2]=0;const total=weights[0]+weights[1];weights=weights.map(v=>v/total);}
  const parts={shade:S*weights[0]*100,exposure:C*weights[1]*100,rest:R*weights[2]*100};
  const routeScore=parts.shade+parts.exposure+parts.rest;
  // Preferred apparent-temperature band 22–30 C; 12 C linear falloff outside it.
  const heat=clamp(1-Math.max(22-weather.apparent,weather.apparent-30,0)/12);
  const rain=clamp(1-Math.max(weather.rainProbability/100,weather.precipitation/5));
  const wind=clamp(1-Math.max(0,weather.gust-15)/35);
  const weatherScore=100*(.5*heat+.35*rain+.15*wind);
  const score=unknown/length>.2|| (p.rest&&bench?.score===null)?null:.75*routeScore+.25*weatherScore;
  return {id:`${r.id}-${start}`,routeId:r.id,name:r.name,subtitle:r.subtitle,date,start,end,duration,length,shade:shaded/length,exposed:exposed/length,unknown:unknown/length,longest:longest/speed,bench,benches,weather,routeScore,weatherScore,score,parts,segments,version:'score-v2',weatherParts:{heat:50*heat,rain:35*rain,wind:15*wind}};
}
export function plan(date,prefs,scenario) {
  const p=validatePrefs(prefs),range=p.window==='morning'?[480,720]:p.window==='afternoon'?[840,1050]:[480,1050];
  const all=[];for(let minute=range[0];minute<=range[1];minute+=15)for(const r of routes){const option=evaluate(r,date,minute,p,scenario);if(option)all.push(option);}
  // Short-walk preference ranks feasible shorter routes first; score remains unchanged.
  all.sort((a,b)=>p.priority==='short'?(a.duration-b.duration)||(b.score??-1)-(a.score??-1):(b.score??-1)-(a.score??-1)||a.start-b.start);
  const unique=[];for(const option of all)if(!unique.some(o=>o.routeId===option.routeId))unique.push(option);
  return {candidates:unique,all,prefs:p};
}
export function timeLabel(minutes) {const h=Math.floor(minutes/60),m=Math.round(minutes%60);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'pm':'am'}`;}

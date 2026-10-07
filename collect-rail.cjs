// Official pages are read only; published data contains normalized facts, not copied notices.
const {chromium, request}=require('playwright');
const fs=require('node:fs');
const sources=[
 {id:'sotetsu',name:'相鉄線',scope:'相鉄線全線',url:'https://www.sotetsu.co.jp/train/status/'},
 {id:'tokaido',name:'東海道線',scope:'JR東日本・東京〜熱海',url:'https://traininfo.jreast.co.jp/train_info/line.aspx?gid=1&lineid=tokaidoline'},
 {id:'odakyu',name:'小田急線',scope:'小田急線全線',url:'https://traininfo.odakyu-rt.jp/train_status'}
];
function classify(text){
 if(/対象時間外|配信.*行っておりません|メンテナンス/.test(text))return 'unknown';
 if(/運転[を]?見合わせ|運転見合せ|運休|運転[を]?中止/.test(text))return 'suspended';
 if(/遅延|遅れ|ダイヤ.*乱れ|直通.*中止|運行.*変更|お知らせ/.test(text))return 'disrupted';
 if(/平常(?:通り|どおり)?(?:に)?運転|正常運転/.test(text))return 'normal';
 return 'unknown';
}
function summarize(status,text){
 const base={normal:'公式情報では平常運転です。',disrupted:'遅延や運転変更の案内があります。',suspended:'運転見合わせ・運休の案内があります（一部区間・列車の場合を含みます）。',unknown:'現在の状況を確認できません。公式情報をご確認ください。'}[status];
 const causes=['人身事故','車両点検','安全確認','信号','踏切','強風','大雨','落雷','地震','混雑','倒木'].filter(x=>text.includes(x));
 return base+(status!=='normal'&&status!=='unknown'&&causes.length ? ` 関連する事象：${causes.join('・')}。`:'');
}
async function collect(){
 const api=await request.newContext({timeout:25000});
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const lines=[];
 for(const source of sources){
  let page;let text='';let status='unknown';let checkedAt=null;let provider='official';
  try{
   if(source.id==='sotetsu'){
    const r=await api.get('https://cdn.sotetsu.co.jp/unkou/dat/train_status1_v2.json');
    if(!r.ok())throw Error('HTTP '+r.status());
    const data=await r.json();if(!Array.isArray(data)||!data.length||!data.every(x=>typeof x.MSG==='string'))throw Error('Unexpected response');
    text=data.map(x=>x.MSG).join('\n');status=classify(text);
    if(status==='normal'&&data.some(x=>x.IRREGULAR!==false))status='unknown';
   }else{
    page=await browser.newPage({timezoneId:'Asia/Tokyo',locale:'ja-JP'});
    if(source.id==='odakyu'){
     const responsePromise=page.waitForResponse(r=>r.url().includes('/service/status_detail'),{timeout:35000});
     await page.goto(source.url,{waitUntil:'domcontentloaded',timeout:35000});
     const response=await responsePromise;if(!response.ok())throw Error('Status request failed');
     const data=await response.json();if(!Array.isArray(data.status))throw Error('Unexpected response');
     await page.waitForSelector('.status_summary-text');
     await page.waitForTimeout(800);
     text=await page.locator('.status_summary-text').innerText();
     status=classify(text);
    }else{
     const r=await page.goto(source.url,{waitUntil:'domcontentloaded',timeout:35000});
     if(!r.ok())throw Error('HTTP '+r.status());
     text=await page.locator('#susp_service_info .traininfo-line-info').innerText({timeout:15000});
     status=classify(text);
     const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Asia/Tokyo'}).format(new Date()));
     if(hour>=2&&hour<4)status='unknown';
    }
   }
   if(status==='unknown')console.warn(`${source.id}: unrecognized status ${text.slice(0,180)}`);
   if(status!=='unknown')checkedAt=new Date().toISOString();
  }catch(e){console.warn(`${source.id}: ${e.message}`);}finally{if(page)await page.close();}
  if(source.id==='tokaido' && status==='unknown'){
   let fallback;
   try{
    const r=await api.get('https://transit.yahoo.co.jp/diainfo/27/0');
    if(!r.ok())throw Error('HTTP '+r.status());
    fallback=await browser.newPage({locale:'ja-JP'});
    await fallback.setContent(await r.text(),{waitUntil:'domcontentloaded'});
    text=await fallback.locator('#mdServiceStatus').innerText({timeout:10000});
    status=classify(await fallback.locator('#mdServiceStatus dt').innerText());provider='yahoo';
    if(status!=='unknown')checkedAt=new Date().toISOString();
   }catch(e){console.warn(`tokaido fallback: ${e.message}`);}finally{if(fallback)await fallback.close();}
  }
  const summary=summarize(status,text).replace('公式情報では',provider==='yahoo'?'Yahoo!路線情報では':'公式情報では');
  lines.push({...source,status,summary,checkedAt,provider});
 }
 await browser.close();await api.dispose();
 const output={schemaVersion:1,generatedAt:new Date().toISOString(),lines};
 fs.writeFileSync('rail-status.json',JSON.stringify(output,null,2)+'\n');
 console.log(lines.map(x=>`${x.name}: ${x.status}`).join('\n'));
}
module.exports={classify,summarize};
if(require.main===module)collect().catch(e=>{console.error(e);process.exit(1)});

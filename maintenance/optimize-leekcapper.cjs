// Run against the deployable static directory after any legacy page generation.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const TITLE='Leekcapper Fortnite: How to Find It and Board a Ship';
const DESCRIPTION='Find the Leekcapper in Fortnite, compare attacks and durability, and follow the ship map to finish the boarding quest with the weapon equipped.';
const URL='https://zonezine.org/leekcapper-fortnite';
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const plain=s=>decode(s.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');

function optimizeSite(root,{modifiedAt=new Date().toISOString(),force=false}={}){
  root=path.resolve(root);
  const file=path.join(root,'leekcapper-fortnite.html');
  let html=fs.readFileSync(file,'utf8');
  const beforeBytes=Buffer.byteLength(html);
  // An unchanged rerun must not manufacture a new editorial modification date.
  if(!force&&!html.includes(';base64,')&&html.includes('<title>'+TITLE+'</title>')&&html.includes('href="/assets/leekcapper/guide.css"')&&html.includes('name="twitter:card"')){
    const words=plain(html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]).toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g)||[];
    const count=words.filter(w=>w==='leekcapper').length;
    return {beforeBytes,afterBytes:beforeBytes,h1Offset:html.indexOf('<h1'),words:words.length,leekcapper:count,density:count*100/words.length,unchanged:true,changedFiles:[]};
  }
  const assets=path.join(root,'assets/leekcapper');
  fs.mkdirSync(assets,{recursive:true});
  const changedFiles=new Set();
  function save(relative,bytes){
    const target=path.join(root,relative);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    if(!fs.existsSync(target)||!fs.readFileSync(target).equals(Buffer.from(bytes))){fs.writeFileSync(target,bytes);changedFiles.add(relative);}
  }
  const uris=[...new Set(html.match(/data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g)||[])];
  const bgFile=path.join(root,'assets/crossover-reunion-v2.png');
  const bgHash=fs.existsSync(bgFile)?digest(fs.readFileSync(bgFile)):null;
  for(const uri of uris){
    const [,mime,base64]=uri.match(/^data:([^;]+);base64,(.+)$/);
    const bytes=Buffer.from(base64,'base64');
    let relative;
    if(mime==='image/png'&&digest(bytes)===bgHash){relative='assets/crossover-reunion-v2.png';}
    else if(mime==='image/png'){
      const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
      if(w===512&&h===512)relative='assets/leekcapper/weapon.png';
      else if(w===1024&&h===576)relative='assets/leekcapper/ship-map.png';
      else throw Error(`Unexpected embedded PNG ${w}x${h}`);
    }else if(mime==='image/jpeg')relative='assets/leekcapper/promo.jpg';
    else if(mime==='audio/mpeg'){
      const tag=[...html.matchAll(/<audio\b[^>]+>/g)].map(m=>m[0]).find(tag=>tag.includes(uri));
      assert(tag,'Unidentified audio');
      if(tag.includes('id="equip-audio"'))relative='assets/leekcapper/equip.mp3';
      else if(tag.includes('id="smash-audio"'))relative='assets/leekcapper/smash.mp3';
      else throw Error('Unexpected audio ID');
    }else throw Error(`Unexpected data URI ${mime}`);
    if(relative!=='assets/crossover-reunion-v2.png')save(relative,bytes);
    html=html.split(uri).join('/'+relative);
  }
  const css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
  if(css.length){
    html=html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'');
    save('assets/leekcapper/guide.css',css.join('\n')+'\n');
  }
  if(!html.includes('href="/assets/leekcapper/guide.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/leekcapper/guide.css"></head>');
  html=html.replace(/<script(?![^>]*(?:\bsrc=|application\/ld\+json))[^>]*>([\s\S]*?)<\/script>/g,(_,code)=>{
    assert(code.includes('const loot='),'Unexpected executable inline script');
    save('assets/leekcapper/guide.js',code+'\n');
    return '<script src="/assets/leekcapper/guide.js" defer></script>';
  });
  html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+TITLE+'</title>')
    .replace(/(<meta name="description" content=")[^"]*/,'$1'+DESCRIPTION)
    .replace(/(<meta property="og:title" content=")[^"]*/,'$1'+TITLE)
    .replace(/(<meta property="og:description" content=")[^"]*/,'$1'+DESCRIPTION);
  html=html.replace(/<meta name="theme-color"[^>]*>/g,'');
  const identities=[];
  html=html.replace(/<link\b[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g,tag=>{identities.push(tag);return '';});
  const iconTags=identities.length?identities.join(''):'<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" type="image/svg+xml" href="/assets/brand/zonezine-mark.svg"><link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/icon-180.png"><link rel="manifest" href="/site.webmanifest">';
  html=html.replace(/(<link rel="canonical"[^>]*>)/,'$1\n'+iconTags+'<meta name="theme-color" content="#111b2a">');
  html=html.replace(/<meta\b[^>]*(?:property="og:image(?:[^"]*)?"|name="twitter:[^"]+")[^>]*>/g,'');
  const social=`<meta property="og:image" content="https://zonezine.org/assets/leekcapper/promo.jpg"><meta property="og:image:width" content="2048"><meta property="og:image:height" content="1152"><meta property="og:image:alt" content="Leekcapper with Hatsune Miku and Kasane Teto in Fortnite"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${TITLE}"><meta name="twitter:description" content="${DESCRIPTION}"><meta name="twitter:image" content="https://zonezine.org/assets/leekcapper/promo.jpg"><meta name="twitter:image:alt" content="Leekcapper with Hatsune Miku and Kasane Teto in Fortnite">`;
  html=html.replace(/(<meta property="og:url"[^>]*>)/,'$1\n'+social);
  html=html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/,'<h1>Leekcapper in Fortnite:<br>How to Find It and Use It</h1>');
  html=html.replace(/<p class="lead">[\s\S]*?<\/p>/,'<p class="lead">The Leekcapper is a weapon found through random loot in Fortnite Battle Royale and Zero Build. Available loot sources and drop rates vary by mode, so check the matching table before you search. To complete “Board a Ship with the Leekcapper,” switch to the weapon and hold it in your hands as you board one of the ships marked on the map. This guide covers where to look, attack damage, charged smashes, durability and the four-step quest walkthrough.</p>');
  const replaceParagraph=(prefix,replacement)=>{
    html=html.replace(/(<p\b[^>]*>)([\s\S]*?)(<\/p>)/g,(paragraph,open,copy,close)=>plain(copy).startsWith(prefix)?open+replacement+close:paragraph);
  };
  replaceParagraph('Find the Leekcapper through random loot','Find the Leekcapper through random loot, using the sources listed for your current mode. The Battle Royale table includes Chests, Floor Loot, Rare Chests and Supply Drops; the Zero Build figures cover Floor Loot.');
  replaceParagraph('Spawns are random across','Spawns are random. A listed drop rate does not guarantee a pickup at a particular ship or landing location. Find the weapon first, then choose a marked ship for the quest.');
  replaceParagraph('Use the fire input for swings','Use the fire input for normal swings. Hold the aim input to build up to two charges, then release it for a smash. The Leekcapper tables separate combo damage, smash damage, knockback and durability costs so you can compare each action.');
  replaceParagraph('The Leekcapper Fortnite controls below','The controls below use input actions rather than device-specific key bindings. Choose the action you want to compare, then check its damage and durability cost in the tables.');
  replaceParagraph('Find the item, equip it, and board','Equip the Leekcapper and hold it in your hands before boarding a marked ship. Follow the map below and try to stay toward the south of the island for convenient access to the marked ships.');
  replaceParagraph('Check your mode and loot source for missing drops','If the weapon is not dropping, check your mode and loot source; finding it is random. If the quest is not counting, check the map marker and hold the Leekcapper as you board. Also check its durability, because the weapon disappears when durability reaches zero.');
  const labels={
    'Where can you find the Leekcapper in Fortnite?':'Where to Find the Leekcapper in Fortnite',
    'How to use Leekcapper: attacks and durability':'How to Use the Leekcapper',
    'Board a Ship with the Leekcapper':'How to Complete “Board a Ship with the Leekcapper”',
    'Leekcapper not dropping or quest not counting?':'Leekcapper Not Dropping or Quest Not Counting?',
    'Leekcapper Fortnite FAQ':'Leekcapper FAQ'
  };
  html=html.replace(/(<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/g,(whole,start,text,end)=>start+(labels[plain(text)]||text)+end);
  const bodyMatch=html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  let body=bodyMatch[1].split(/(<[^>]+>)/g).map(part=>part.startsWith('<')?part:part.replace(/Leekcapper Fortnite/g,'Leekcapper')).join('');
  const returnLink='<p class="guide-return">Browse more <a href="https://zonezine.org/#guides">Fortnite guides</a> in the ZoneZine directory.</p>';
  if(!body.includes('class="guide-return"'))body=body.replace('</article>',returnLink+'</article>');
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(modifiedAt));
  const readableDate=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric'}).format(new Date(modifiedAt));
  body=body.replace(/<p class="review-line">[\s\S]*?<\/p>/,`<p class="review-line">By ZoneZine editorial · Updated <time datetime="${date}">${readableDate}</time> · Reduced page size and clarified the loot and ship-quest instructions.</p>`);
  html=html.replace(bodyMatch[0],bodyMatch[0].replace(bodyMatch[1],body));
  const ldMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const ld=JSON.parse(ldMatch[1]);
  const page=ld['@graph'].find(x=>x['@type']==='WebPage');
  Object.assign(page,{name:TITLE,description:DESCRIPTION,dateModified:modifiedAt,image:'https://zonezine.org/assets/leekcapper/promo.jpg'});
  ld['@graph'].find(x=>x['@type']==='FAQPage').mainEntity=[...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m=>({'@type':'Question',name:plain(m[1]),acceptedAnswer:{'@type':'Answer',text:plain(m[2])}}));
  html=html.replace(ldMatch[0],'<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,'\\u003c')+'</script>');
  assert(!html.includes(';base64,'),'Embedded binary data remains');
  assert(Buffer.byteLength(html)<100000,'Page still too large');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert(html.includes('href="'+URL+'"'),'Canonical changed');
  assert.equal((html.match(/name="theme-color"/g)||[]).length,1);
  const words=plain(html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]).toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g)||[];
  const count=words.filter(w=>w==='leekcapper').length,density=count*100/words.length;
  assert(density>=2&&density<=4,`Keyword density ${density}`);
  save('leekcapper-fortnite.html',html);
  const datesFile=path.join(root,'maintenance/page-lastmod.json');
  if(fs.existsSync(datesFile)){
    const dates=JSON.parse(fs.readFileSync(datesFile,'utf8'));
    dates[URL]={lastmod:modifiedAt,contentHash:digest(Buffer.from(html))};
    save('maintenance/page-lastmod.json',JSON.stringify(dates,null,2)+'\n');
  }
  const sitemapPath=path.join(root,'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    const sitemap=fs.readFileSync(sitemapPath,'utf8').replace(/(<loc>https:\/\/zonezine\.org\/leekcapper-fortnite<\/loc>\s*<lastmod>)[^<]+/,'$1'+modifiedAt);
    save('sitemap.xml',sitemap);
  }
  return {beforeBytes,afterBytes:Buffer.byteLength(html),h1Offset:html.indexOf('<h1'),words:words.length,leekcapper:count,density,title:TITLE,titleLength:TITLE.length,descriptionLength:DESCRIPTION.length,changedFiles:[...changedFiles]};
}
module.exports={optimizeSite};
if(require.main===module)console.log(JSON.stringify(optimizeSite(process.argv[2]||path.resolve(__dirname,'..')),null,2));

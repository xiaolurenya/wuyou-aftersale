// 无忧商服通 前端 SPA（零构建，原生 ES Module）
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

// 兼容两版序列格式：云版 jsonb 返回数组，NAS 版返回 JSON 字符串

// ===== 打印批次：每次送修保存生成独立批次；默认打印最新未打印批次 =====
function printBatchId(){const d=new Date(Date.now()+8*3600*1000),p=n=>String(n).padStart(2,'0');return 'PB'+d.getUTCFullYear()+p(d.getUTCMonth()+1)+p(d.getUTCDate())+p(d.getUTCHours())+p(d.getUTCMinutes())+p(d.getUTCSeconds())+String(Date.now()).slice(-4)+Math.random().toString(36).slice(2,6).toUpperCase()}
function batchOf(r){let e={};try{e=typeof r?.extra==='string'?JSON.parse(r.extra||'{}'):(r?.extra||{})}catch{}const m=e.maintenance&&typeof e.maintenance==='object'?e.maintenance:{};const up=m.upstream&&typeof m.upstream==='object'?m.upstream:{};return{extra:e,maintenance:m,upstream:up,batch_no:String(up.print_batch_no||m.print_batch_no||'').trim(),printed_at:String(up.print_printed_at||m.print_printed_at||'').trim()}}
function withBatchOf(r){const b=batchOf(r);return {...r,...b}}

function serialList(v){
  if(Array.isArray(v))return v.map(String);
  if(!v)return [];
  try{const x=JSON.parse(v);return Array.isArray(x)?x.map(String):[String(v)];}catch{return String(v).split(/[\s,，;；]+/).filter(Boolean);}
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setBrandTitle(n){try{const v=String(n||'').trim().slice(0,30);if(!v)return;localStorage.setItem('wuyou_brand_name',v);const t=document.title;if(t.includes('无忧商服通')||t.includes('__WUYOU_APP_NAME__'))document.title=t.replace(/无忧商服通/g,v).replace(/__WUYOU_APP_NAME__/g,v);else document.title=v;const m=document.querySelector('meta[name="app-name"]');if(m)m.content=v;}catch(e){}}
try{const n=localStorage.getItem('wuyou_brand_name');if(n)setBrandTitle(n);}catch(e){}
const NEWFLOW=true;
const NEW_STATUSES=['已收件','已送修','待返回','已返回','自维保'];
const NEW_DEFAULT_STATUS='已收件';
const nfUrl=(url)=>url;
function applyNewflowStatuses(){A.statuses=[...NEW_STATUSES];}
const A={user:null,license:null,roles:{},statuses:[],fields:{},route:'dashboard',dict:{products:[],suppliers:[],contacts:[]}};
function inlineBrand(){try{const e=document.getElementById('__WUYOU_BRAND__');if(!e)return null;const b=JSON.parse(e.textContent||'{}');if(b.name&&b.name!=='__WUYOU_APP_NAME__')return b;}catch{}return null;}
function setBrandLogo(v){try{const s=String(v||'').trim();if(s)localStorage.setItem('wuyou_brand_logo',s);else localStorage.removeItem('wuyou_brand_logo');}catch(e){}}
function customBrandLogo(){try{const ib=inlineBrand(),hasInline=!!ib&&Object.prototype.hasOwnProperty.call(ib,'logo'),inline=hasInline?String(ib.logo||'').trim():null;if(inline)return inline;const api=(A.loginBrand&&typeof A.loginBrand.logo!=='undefined')?String(A.loginBrand.logo||'').trim():null;if(api)return api;if(hasInline||api!==null)return '';return String(localStorage.getItem('wuyou_brand_logo')||'').trim();}catch(e){return String((A.loginBrand&&A.loginBrand.logo)||'').trim();}}
function brandLogo(){return customBrandLogo()||'/logo.png';}
function printBrandName(){try{let ib=null;if(typeof inlineBrand==='function')ib=inlineBrand();const n=String((ib&&ib.name)||(A.loginBrand&&A.loginBrand.name)||(A.license&&A.license.app_name)||localStorage.getItem('wuyou_brand_name')||'').trim();return n||'售后管理系统'}catch(e){return '售后管理系统'}}
try{const ib=inlineBrand();if(ib){A.loginBrand=ib;setBrandTitle(ib.name);if(ib.logo)setBrandLogo(ib.logo);}}catch(e){}

// GET 短缓存：只读接口 30 秒内复用，栏目来回切换秒开；任何写操作自动清空
const __CACHE__=new Map();
window.invalidateCache=()=>__CACHE__.clear();
async function api(url,opt={}){
  const method=(opt.method||'GET').toUpperCase();
  if(method!=='GET'){ __CACHE__.clear(); }
  else if(!opt.noCache&&!/\/api\/stats\/product-rate/.test(url)&&!/\/api\/warranty\/shipping\/latest/.test(url)&&!/\/api\/print\/packing-slip/.test(url)){ const hit=__CACHE__.get(url); if(hit&&Date.now()-hit.t<30000) return hit.v; }
  const o={credentials:'same-origin',...opt,headers:{...(opt.headers||{})}};
  if(opt.body&&typeof opt.body!=='string'&&!(opt.body instanceof FormData)){o.headers['Content-Type']='application/json';o.body=JSON.stringify(opt.body);}
  let r;
  try{ r=await fetch(url,o); }catch(e){ toast('无法连接服务器：'+e.message,'err'); throw e; }
  const ct=r.headers.get('content-type')||'';
  let data; try{ data=ct.includes('json')?await r.json():await r.text(); }catch{ data=null; }
  if(!r.ok){
    const err=(data&&data.error)||(data&&data.reason)||('请求失败 '+r.status);
    if(r.status===401){ A.user=null; renderLogin(); }
    if(r.status===402&&data?.code==='LICENSE_REQUIRED'){ A.license=data.license; showPayModal(); }
    if(!opt.silent) toast(err,'err');
    const e=new Error(err); e.data=data; throw e;
  }
  if(method==='GET'&&!opt.noCache&&!/\/api\/stats\/product-rate/.test(url)&&!/\/api\/warranty\/shipping\/latest/.test(url)&&!/\/api\/print\/packing-slip/.test(url)) __CACHE__.set(url,{t:Date.now(),v:data});
  return data;
}
function toast(msg,type=''){ const d=document.createElement('div'); d.className='toast '+type; d.textContent=msg; $('#toast-box').append(d); setTimeout(()=>d.remove(),3600); }
function modal(html,wide=false){ $('#modal-root').innerHTML='<div class="mask"><div class="modal'+(wide?' wide':'')+'">'+html+'</div></div>'; }
function modalPay(html){ $('#modal-root').innerHTML='<div class="mask"><div class="modal pay-modal">'+html+'</div></div>'; }
function closeModal(){ $('#modal-root').innerHTML=''; }
function modalHead(t){ return '<div class="mh"><b>'+t+'</b><button class="x" onclick="closeModal()">×</button></div>'; }
window.closeModal=closeModal;
const today=()=>new Date().toLocaleDateString('sv-SE');
const nowLocal=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());};
function fmtDate(v){ return v?String(v).slice(0,10):'—'; }
function statusPill(s){ return '<span class="pill st-'+esc(s)+'">'+esc(s)+'</span>'; }
function can(p){ if(!A.user)return false; if(A.user.role==='owner')return true; const r=A.roles[A.user.role]; if(!r)return false; return r.perms.includes('*')||r.perms.some(x=>x===p||(x.endsWith(':*')&&p.startsWith(x.slice(0,-1)))); }

// ================= 登录 =================
function renderLogin(){
  $('#app').innerHTML=`<div class="login-wrap"><div class="login-card">
    <div class="login-logo"><img id="loginLogo" src="${esc(brandLogo())}" alt="logo" onerror="this.onerror=null;this.src='/logo.png'"></div><h1>${esc(A.loginBrand?.name||inlineBrand()?.name||'售后管理系统')}</h1>
    <div class="sub">${esc(A.loginBrand?.subtitle||inlineBrand()?.subtitle||'售后 · 查询 · 报价 一站式')}</div>
    <form id="loginForm">
      <div class="field"><label>账号</label><input name="username" autocomplete="username" value="admin" required autofocus></div>
      <div class="field"><label>密码</label><input name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn block" type="submit">登 录</button>
    </form>
    <div id="loginLicense"></div>
    <div class="login-tip" id="loginTip">默认账号 admin / Admin@3650</div>
  </div></div>`;
  $('#loginForm').onsubmit=async e=>{
    e.preventDefault(); const f=new FormData(e.target), btn=e.target.querySelector('button'); const old=btn.textContent; btn.disabled=true; btn.textContent='登录中…';
    try{ const d=await api('/api/auth/login',{method:'POST',body:{username:f.get('username'),password:f.get('password')}});
      A.user=d.user; A.license=d.license;
      // 先用登录响应里的 roles/statuses 渲染主框架，字典异步补，避免干等 Supabase
      A.roles=d.roles||A.roles; A.statuses=d.statuses||A.statuses; A.fields=d.fields||A.fields; applyNewflowStatuses(); A.dict=A.dict||{products:[],suppliers:[],repairUnits:[],contacts:[]};
      renderShell(); navigate(A.route||'dashboard'); toast('登录成功','ok');
      api(nfUrl('/api/dict'),{silent:true}).then(x=>{A.dict=x;}).catch(()=>{});
      setTimeout(()=>checkOverdueAlert(false),900);
      setTimeout(()=>wsLiveStart(),400);
    setTimeout(()=>showGuideOnce(),500);
    }catch(err){ btn.disabled=false; btn.textContent=old; toast(err?.message||'登录失败','err'); }
  };
  refreshLicense();
  // 登录页标题/副标题由后台「系统设置」控制（公开读取，无需登录）
  api(nfUrl('/api/login-brand'),{silent:true}).then(b=>{ A.loginBrand=b; setBrandTitle(b.name); setBrandLogo(b.logo); if(!A.user) { renderLoginBrand(); const t=$('#loginTip'); if(t&&b.tip)t.innerHTML=esc(b.tip); } }).catch(()=>{});
}
function renderLoginBrand(){
  const h=$('.login-card h1'), s=$('.login-card .sub'), l=$('.login-logo');
  if(h&&A.loginBrand)h.textContent=A.loginBrand.name||'售后管理系统';
  if(s&&A.loginBrand)s.textContent=A.loginBrand.subtitle||'云端版';
  const img=$('#loginLogo');
  if(img){ img.onerror=()=>{img.onerror=null;img.src='/logo.png';}; const src=brandLogo(); if(img.getAttribute('src')!==src)img.src=src; }
}
async function refreshLicense(){
  try{ const s=await api('/api/license/status'); A.license=s;
    const el=$('#loginLicense'); if(el){
      el.innerHTML = s.needs_activation
          ? '<div class="login-tip">⚠ '+(s.activated?'':'试用 '+(s.trial_left>0?'剩余 '+s.trial_left+' 天':'已到期')+'，')+'请 <a href="javascript:showPayModal()">查看二维码 / 输入激活码</a>（一次性 ¥'+s.price+'，后续更新免费）</div>'
          : (s.activated?'<div class="login-tip"><span class="badge ok">已授权</span> 后续版本免费升级</div>':'<div class="login-tip"><span class="badge">免费试用</span> 剩余 '+s.trial_left+' 天</div>');
    }
  }catch{}
}

// ================= 主框架 =================
async function boot(){
  const me=await api('/api/auth/me');
  A.user=me.user; A.license=me.license; A.roles=me.roles; A.statuses=me.statuses; A.fields=me.fields; setBrandTitle(me.license?.app_name);
  const d=await api('/api/dict'); A.dict=d;
  renderShell(); navigate(A.route);
}
// 各栏目所需权限；owner 通过 can() 恒为 true
const PAGE_PERM={dashboard:'record:read',register:'record:create',maintenance:'maintenance:manage',quick:'return:manage',pickup:'pickup:manage',query:'query:read',print:'print:view',
  import:'import:create',export:'export:create',dict:'dict:read',users:'user:manage',roles:'*',audit:'audit:read',backups:'backup:manage',
  settings:'system:settings',paid:'paid:read',danger:'danger:manage',warranty:'warranty:view',wsettings:'warranty:settings',quote:'quote:manage'};
function navItems(){
  const items=[
    {g:'工作台',list:[['dashboard','▦','首页概览'],['register','＋','前台登记'],...(NEWFLOW?[['maintenance','🛠','维保中心']]:[]),['quick','↩','返回录入'],['pickup','📦','取件中心'],['query','⌕','任意检索'],['print','🖨','打印明细']]},
    {g:'数据',list:[['import','⇪','表格导入'],['export','⇩','数据导出']]},
    {g:'后台管理',list:[['dict','▤','信息维护'],['users','☰','人员账号'],...(A.user.role==='owner'?[['roles','⚑','权限配置']]:[]),['audit','≡','操作日志'],...(A.user.role==='owner'?[['backups','⛁','备份管理']]:[]),['settings','⚙','系统设置'],['quote','💼','报价系统'],['warranty','🛡','安心保'],['wsettings','⚙','保修设置'],['paid','💰','自费维修统计'],['danger','⚠','危险操作']]},
  ];
  return items.map(gr=>{
    // 按权限过滤：没勾选的栏目根本不渲染
    const li=gr.list.filter(([k])=>k==='roles'||k==='backups'?A.user.role==='owner':can(PAGE_PERM[k]||'record:read'));
    if(!li.length)return '';
    return '<div class="nav-group">'+gr.g+'</div>'+li.map(([k,ic,t])=>'<a data-r="'+k+'" class="'+(A.route===k?'on':'')+'"><span class="ico">'+ic+'</span><span>'+t+'</span></a>').join('');
  }).join('');
}
function renderShell(){
  const s=A.license;
  // 已授权：完全不显示任何条；未授权/试用：显示体验版剩余天数与到期倒计时
  const bar = s.activated ? ''
    : (!s.activated && !s.test_device)
      ? '<div class="license-bar"><span>⏳ 体验版 '+(s.trial_expired?'<b>已到期，请激活</b>':'剩余 <b>'+s.trial_left+'</b> 天到期')+'</span><button class="btn sm" onclick="showPayModal()">查看二维码 / 输入激活码</button></div>'
      : (s.needs_activation?'<div class="license-bar"><span>⚠ 请尽快激活</span><button class="btn sm" onclick="showPayModal()">查看二维码 / 输入激活码</button></div>':'');
  const bn=A.license?.app_name||(localStorage.getItem('wuyou_brand_name')||'售后管理系统'), bs=A.license?.app_subtitle||'云端托管';
  document.title=bn; setBrandTitle(bn);
  const _logo=customBrandLogo(),lg=_logo?'<img src="'+esc(_logo)+'" style="width:100%;height:100%;object-fit:contain;border-radius:9px" onerror="this.parentNode.textContent=\''+esc(bn.slice(0,1))+'\'">':esc(bn.slice(0,1));
  $('#app').innerHTML='<div class="layout"><aside class="side"><div class="brand"><div class="ic">'+lg+'</div><div><span><b>'+esc(bn)+'</b></span><div style=\"display:flex;align-items:center;gap:5px;margin-top:4px;white-space:nowrap\"><small id=\"appVersionLine\">版本 <span id=\"appVersion\">检测中…</span></small><button class=\"btn ghost sm\" style=\"padding:1px 6px;font-size:11px\" onclick=\"checkAppUpdate(true)\">🔄 检查更新</button></div></div></div><nav class="nav">'+navItems()+'</nav><div class="foot">云端托管<br>数据在 Supabase</div></aside><div class="main">'+bar+'<div class="topbar"><div class="title" id="pageTitle">首页概览</div><div class="right"><span class="badge">'+esc(A.user.display_name||A.user.username)+' · '+esc(A.roles[A.user.role]?.label||A.user.role)+'</span><button class="btn ghost sm" onclick="showLicenseInfo()">授权信息</button><button class="btn ghost sm" onclick="changePwd()">改密码</button><button class="btn ghost sm" onclick="logout()">退出</button></div></div><div class="content" id="page"></div></div></div>';
  $$('.nav a').forEach(a=>a.onclick=()=>navigate(a.dataset.r));
}
function navigate(r){ A.route=r; try{document.body.classList.toggle('route-query-clean',r==='query');}catch{} const titles={dashboard:'首页概览',register:'前台登记',maintenance:'维保中心',quick:'返回录入',pickup:'取件中心',query:'任意检索',import:'表格导入',export:'数据导出',dict:'信息维护',users:'人员权限',audit:'操作日志',backups:'备份管理',roles:'人员权限配置',print:'打印明细',settings:'系统设置',paid:'自费维修统计',warranty:'安心保',wsettings:'保修设置',quote:'报价系统',danger:'危险操作'}; $('#pageTitle').textContent=titles[r]||r; $$('.nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===r)); renderPage(r); }
window.navigate=navigate; window.logout=async()=>{await api('/api/auth/logout',{method:'POST'});A.user=null;renderLogin();};
window.changePwd=()=>{ modal(modalHead('修改密码')+'<div class="mb"><div class="field"><label>原密码</label><input id="op" type="password"></div><div class="field"><label>新密码（至少 8 位）</label><input id="np" type="password"></div><div class="field"><label>确认新密码</label><input id="np2" type="password"></div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="doChangePwd()">确认修改</button></div>'); };
window.doChangePwd=async()=>{const a=$('#np').value,b=$('#np2').value;if(String(a).length<8)return toast('新密码至少 8 位','err');if(a!==b)return toast('两次输入的新密码不一致','err');try{await api('/api/auth/password',{method:'POST',body:{old_password:$('#op').value,new_password:a,new_password2:b}});closeModal();toast('密码已修改','ok');}catch(e){toast(e.message,'err');}};

// ================= 首页 =================
async function pageDashboard(){
  // 单次合并接口 + 内存缓存：先渲染上次数据（秒开），后台刷新
  let bundle=window.__dashCache||null;
  const fresh=api(nfUrl('/api/dashboard'),{silent:true}).then(x=>{window.__dashCache=x;return x;}).catch(()=>null);
  // 首屏骨架：仅当前仍在首页时写，避免切换到别的栏目后被覆盖
  if(!bundle && A.route==='dashboard'){
    $('#page').innerHTML='<div class="grid g4" style="margin-bottom:18px">'+['登记总数','在修 / 待处理','已返回 / 已换新','今日已返回','今日登记','平均返修天数','自费维修','上家占比'].map(k=>'<div class="stat"><div class="k">'+k+'</div><div class="v" style="color:var(--muted)">…</div></div>').join('')+'</div><div class="grid g2"><div class="card"><div class="empty">统计加载中…</div></div><div class="card"><div class="empty">统计加载中…</div></div></div>';
  }
  const s0=bundle||await fresh||{stats:{total:0,pending:0,returned:0,exchange:0,today:0,paid_count:0,paid_total:0},merchant:[],rate:[],overdue_total:0,overdue_days:25};
  // 关键：等接口期间用户可能已切到别的栏目，渲染前必须确认仍在首页，否则会覆盖别的页面
  if(A.route!=='dashboard') return;
  const s=s0.stats||{}; const al={total:s0.overdue_total||0,days:s0.overdue_days||25};
  DYN.merchant.rows=s0.merchant||[]; DYN.rate.rows=s0.rate||[];
  const pieCard=(rows)=>{
    const all=(rows||[]).filter(x=>Number(x.cnt)>0);
    const total=all.reduce((n,x)=>n+Number(x.cnt||0),0);
    // 前 11 个独立扇区，其余合并为「其他」，保证总数=全部登记
    const main=all.slice(0,11), rest=all.slice(11);
    const list=rest.length?[...main,{name:'其他 '+(all.length-11)+' 家',cnt:rest.reduce((n,x)=>n+Number(x.cnt||0),0)}]:main;
    const colors=['#2563eb','#0f766e','#7c3aed','#dc2626','#ea580c','#0891b2','#4f46e5','#16a34a','#db2777','#ca8a04','#475569','#94a3b8'];
    let acc=0;const segs=[];
    for(let i=0;i<list.length;i++){const p=Number(list[i].cnt)/Math.max(1,total)*360;segs.push(colors[i%colors.length]+' '+acc.toFixed(1)+'deg '+(acc+p).toFixed(1)+'deg');acc+=p;}
    const bg=segs.length?'conic-gradient('+segs.join(',')+')':'conic-gradient(#e2e8f0 0deg 360deg)';
    const lg=main.slice(0,4).map((x,i)=>'<span><i style="background:'+colors[i%colors.length]+'"></i>'+esc(x.name)+' '+x.cnt+'</span>').join('');
    return '<div class="pie-card"><div class="pie-wrap" style="background:'+bg+'"></div><div class="pie-info"><div class="k">上家返修占比</div><div class="lg">'+(lg||'暂无数据')+'</div><div class="hint">共 '+total+' 单 · '+all.length+' 个上家 · 动态数据实时刷新</div></div></div>';
  };
  const card=(k,v,sub)=>'<div class="stat"><div class="k">'+k+'</div><div class="v">'+v+'</div><div class="hint">'+sub+'</div></div>';
  $('#page').innerHTML='<div class="grid g4" style="margin-bottom:18px">'
    +card('登记总数',s.total,'全部售后单据')
    +card('在修 / 待处理',s.pending,'待送修 → 待返回')
    +card('已返回 / 已换新',s.returned,'累计已完成（含换新）')
    +card('今日已返回',s.today_returned||0,'今天返回 / 换新')
    +card('今日登记',s.today,fmtDate(today()))
    +card('平均返修天数',(s.avg_cycle_days==null?'—':s.avg_cycle_days+' 天'),'有效寄送→返回 · '+(s.paired_count||0)+' 单')
    +card('自费维修',(s.paid_count||0)+' 单 / ¥'+(s.paid_total||0),'收费单据与金额合计')
    +pieCard(s0.supplier_stats||[])
    +'</div>'
    +(al.total?'<div class="card" style="border-color:#fcd34d;background:#fffbeb"><h2>⚠ 寄送超期提醒</h2><div class="hint">有 <b style="color:var(--err)">'+al.total+'</b> 单寄出后超过 '+al.days+' 天仍未返回，请及时跟进。</div><div class="toolbar" style="margin-top:10px"><button class="btn" onclick="showOverdueAlert()">查看超期明细</button><button class="btn ghost" onclick="navigate(\'quick\')">去快速返修录入</button></div></div>':'')
    +'<div class="grid g2" id="dynCards"><div class="card"><div class="empty">加载中…</div></div><div class="card"><div class="empty">加载中…</div></div></div>'
    +'<div class="card"><h2>快速开始</h2><div class="toolbar"><button class="btn" onclick="navigate(\'register\')">＋ 新增登记</button><button class="btn ghost" onclick="navigate(\'query\')">⌕ 任意检索</button><button class="btn ghost" onclick="navigate(\'import\')">⇪ 导入表格</button><button class="btn ghost" onclick="navigate(\'dict\')">▤ 维护型号 / 上家</button></div><div class="hint">商品型号与寄送上家可在后台预先录入，也可在登记页直接手动输入，系统会自动建档。</div></div>';
  renderDynCards();
  // 后台刷新：数据到了再重绘（不阻塞首屏）
  fresh.then(x=>{ if(x&&A.route==='dashboard'){ window.__dashCache=x; DYN.merchant.rows=x.merchant||[]; DYN.rate.rows=x.rate||[]; RATE_CAROUSEL.rows=x.rate||[]; renderDynCards(); const pc=$('#page .pie-card'); if(pc){ const holder=document.createElement('div'); holder.innerHTML=pieCard(x.supplier_stats||[]); pc.replaceWith(holder.firstElementChild); } } });
  // 轮询：每 30 秒刷新两张动态卡片（仅在本页时）
  clearInterval(window.__dashTimer);
  window.__dashTimer=setInterval(()=>{ if(A.route==='dashboard'&&$('#dynCards')) refreshDynCards(); else clearInterval(window.__dashTimer); },30000);
  if(RATE_CAROUSEL.timer)clearInterval(RATE_CAROUSEL.timer);
  RATE_CAROUSEL.timer=setInterval(()=>{ if(A.route==='dashboard'&&$('#dynCards')) rateCarouselTick(); else { clearInterval(RATE_CAROUSEL.timer); RATE_CAROUSEL.timer=null; } },6000);
}
let RATE_CAROUSEL={mode:0,timer:null,rows:[]};
const RATE_MODES=['占比高 → 低','占比低 → 高','品牌归类'];
window.rateCarouselTick=()=>{RATE_CAROUSEL.mode=(RATE_CAROUSEL.mode+1)%RATE_MODES.length;if(DYN&&DYN.rate)DYN.rate.page=1;renderDynCards();};
function rateSorted(rows){
  const list=[...rows];
  const mode=RATE_MODES[RATE_CAROUSEL.mode];
  if(mode==='占比高 → 低')list.sort((a,b)=>Number(b.rate||0)-Number(a.rate||0)||b.total-a.total);
  else if(mode==='占比低 → 高')list.sort((a,b)=>Number(a.rate||0)-Number(b.rate||0)||a.total-b.total);
  else list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'zh-CN'));
  return list;
}
let DYN={merchant:{page:1,all:false,open:true,rows:[]},rate:{page:1,all:false,open:true,rows:[]}}; // 默认展开，可手动折叠
const DYN_SIZE=5;
async function refreshDynCards(){
  const [m,p]=await Promise.all([api(nfUrl('/api/stats/merchant-pending'),{silent:true}).catch(()=>({rows:[]})),api(nfUrl('/api/stats/product-rate'),{silent:true}).catch(()=>({rows:[]}))]);
  DYN.merchant.rows=m.rows||[]; DYN.rate.rows=p.rows||[];
  RATE_CAROUSEL.rows=p.rows||[];
  renderDynCards();
}
function dynPager(key,total){
  const d=DYN[key], pages=Math.max(1,Math.ceil(total/DYN_SIZE));
  if(d.page>pages)d.page=pages;
  return '<div class="pager" style="margin-top:10px"><span>共 '+total+' 条 · 第 '+d.page+'/'+pages+' 页</span><div style="display:flex;gap:6px">'
    +'<button class="btn ghost sm" '+(d.page<=1?'disabled':'')+' onclick="dynGo(\''+key+'\',-1)">上一页</button>'
    +'<button class="btn ghost sm" '+((d.page>=pages)||d.all?'disabled':'')+' onclick="dynGo(\''+key+'\',1)">下一页</button>'
    +'<button class="btn ghost sm" onclick="dynToggleAll(\''+key+'\')">'+(d.all?'分页显示':'显示全部')+'</button>'
    +'<button class="btn ghost sm" onclick="dynToggleOpen(\''+key+'\')">'+(d.open?'折叠':'展开')+'</button></div></div>';
}
function renderDynCards(){
  const el=$('#dynCards'); if(!el)return;
  const m=DYN.merchant, p=DYN.rate;
  const mode=RATE_MODES[RATE_CAROUSEL.mode];
  const slice=(d)=>d.all?d.rows:d.rows.slice((d.page-1)*DYN_SIZE,d.page*DYN_SIZE);
  const mRows=slice(m);
  const pAll=rateSorted(p.rows||[]), pRows=p.all?pAll:pAll.slice((p.page-1)*DYN_SIZE,p.page*DYN_SIZE);
  el.innerHTML='<div class="card"><h2>🏪 商家未返回数 <span class="badge">'+m.rows.length+' 个商家</span> <span class="hint">每 30 秒自动刷新</span></h2>'
    +(m.open?(mRows.length?mRows.map(x=>'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>'+esc(x.name)+'</span><span><b style="color:var(--warn)">'+x.pending+'</b> 台未返回 · 换新 '+x.exchange+' · 最早 '+fmtDate(x.oldest)+'</span></div>').join(''):'<div class="empty">暂无未返回返修</div>'):'<div class="hint">已折叠</div>')
    +dynPager('merchant',m.rows.length)+'</div>'
    +'<div class="card"><h2>📦 商品返修率 <span class="badge">'+p.rows.length+' 个品牌</span> <span class="hint">'+esc(mode)+'</span></h2>'
    +(p.open?(pRows.length?pRows.map(x=>'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>'+esc(x.name)+'</span><span>登记 '+x.total+' 台 · <b>返修率 '+x.rate+'%</b></span></div>').join(''):'<div class="empty">暂无数据</div>'):'<div class="hint">已折叠</div>')
    +dynPager('rate',pAll.length)+'</div>';
}
window.dynGo=(key,delta)=>{DYN[key].page=Math.max(1,DYN[key].page+delta);DYN[key].all=false;renderDynCards();};
window.dynToggleAll=key=>{DYN[key].all=!DYN[key].all;DYN[key].page=1;renderDynCards();};
window.dynToggleOpen=key=>{DYN[key].open=!DYN[key].open;renderDynCards();};

// 快递公司识别（与 packages/shared 一致，前端零依赖）
function detectExpress(no){
  const v=String(no||'').trim().toUpperCase().replace(/\s/g,''); if(!v)return '';
  const rules=[[/^SF\d{8,16}$/,'顺丰速运'],[/^SF/,'顺丰速运'],
    [/^(ZT|ZTO)\d{8,16}$/,'中通快递'],[/^(YT|YTO)\d{8,16}$/,'圆通速递'],
    [/^(YD|YUNDA)\d{8,16}$/,'韵达快递'],[/^(ST|STO)\d{8,16}$/,'申通快递'],
    [/^(JD|JDX|JDVA)\d{8,20}$/,'京东物流'],[/^JD/,'京东物流'],
    [/^(EMS|EM|E[A-Z])\d{8,16}[A-Z]{0,2}$/,'EMS'],
    [/^(JT|J&T|JITU)\d{8,20}$/,'极兔速递'],[/^JT/,'极兔速递'],
    [/^(DB|DBKD|DPK)\d{8,20}$/,'德邦快递']];
  for(const[re,n]of rules)if(re.test(v))return n;
  // 纯数字单号各家号段重叠，不猜测，留给手动选择
  if(/^\d{10,20}$/.test(v))return '';
  return '其他/未识别';
}
const EXPRESS_LIST=['顺丰速运','中通快递','圆通速递','韵达快递','申通快递','京东物流','EMS','极兔速递','德邦快递','邮政快递','其他'];

// ================= 前台登记 =================
const FIELD_DEFS=[
 ['record_date','登记日期','date','req'],['supplier_name',(NEWFLOW?'送修上家 / 售后站点':'寄送上家 / 售后站点'),'datalist-suppliers',''],
 ['product_model','产品型号','datalist-products','req'],['quantity','数量','number',''],
 ['sale_date','销售日期','date',''],['status','维修进度','select-status',''],
 ['repair_unit','送修单位 / 客户','datalist-units','req'],['contact_name','联系人','text',''],
 ['contact_phone','联系方式','text',''],['tracking_out',(NEWFLOW?'客户寄来单号（寄件单号）':'寄送快递单号（自动识别快递公司）'),'text',''],
];
if(NEWFLOW)FIELD_DEFS.splice(0,FIELD_DEFS.length,...[['record_date','登记日期','date','req'],['product_model','产品型号','datalist-products','req'],['quantity','数量','number',''],['sale_date','销售日期','date-only',''],['repair_unit','送修单位 / 客户','datalist-units','req'],['contact_name','联系人','text',''],['contact_phone','联系方式','text',''],['tracking_out','客户寄来单号（寄件单号）','text','']]);
function inputHtml(k,label,type,req,val=''){
  const id='f_'+k, r=req==='req'?' <span class="req">*</span>':'';if(NEWFLOW&&type==='date'&&!val)val=nowLocal();
  let inp;
  if(type.startsWith('datalist-')){
    const list=type==='datalist-suppliers'?A.dict.suppliers.map(x=>x.name):type==='datalist-units'?(A.dict.repairUnits||[]).map(x=>x.name):A.dict.products.map(x=>x.model);
    inp='<input id="'+id+'" list="dl_'+k+'" value="'+esc(val)+'" placeholder="可输入新值自动建档"><datalist id="dl_'+k+'">'+list.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>';
  } else if(type==='date-only'){ inp='<input id="'+id+'" type="text" inputmode="numeric" value="'+esc(String(val||'').slice(0,10))+'" placeholder="可输入 20260512 / 2026-02-15，自动标准化" onblur="normalizeSaleDate(\''+id+'\')" oninput="normalizeSaleDateLive(\''+id+'\')">';
  } else if(type==='date'){
    // 手输 + 点选双模式：默认可粘贴任意格式，点📅调出日历，选完回填
    inp='<div style="display:flex;gap:6px;align-items:center"><input id="'+id+'" type="text" value="'+esc(val||(k==='record_date'?nowLocal():''))+'" placeholder="可手输 2026-11-11 11:30 或点选" style="flex:1"><input type="date" id="'+id+'_pick" style="position:absolute;width:1px;height:1px;opacity:0" onchange="setDateFromPick(\''+id+'\')"><button type="button" class="btn ghost sm" onclick="openDatePick(\''+id+'\')">📅</button><button type="button" class="btn ghost sm" onclick="clearDate(\''+id+'\')" title="清空日期">✕</button></div>';
  } else if(type==='select-status'){
    const cur=val||(NEWFLOW?NEW_DEFAULT_STATUS:'已寄送');
    inp='<select id="'+id+'">'+A.statuses.map(x=>'<option '+(x===cur?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
  } else if(type==='number') inp='<input id="'+id+'" type="number" min="1" value="'+esc(val||1)+'">';
  else inp='<input id="'+id+'" value="'+esc(val)+'" '+(k==='tracking_out'?'placeholder="输入单号，如 SF8888888"':'')+'>';
  return '<div class="field"><label>'+label+r+'</label>'+inp+'</div>';
}
function normalizeDateText(v){v=String(v||'').trim();if(!v)return '';let m=v.match(/^(\d{4})[-\/.年]?(\d{1,2})[-\/.月]?(\d{1,2})日?$/);if(!m)m=v.match(/^(\d{4})(\d{2})(\d{2})$/);if(!m)return v;const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);if(y<1900||y>2100||mo<1||mo>12||d<1||d>31)return v;const p=n=>String(n).padStart(2,'0');return y+'-'+p(mo)+'-'+p(d);}
window.normalizeSaleDate=(id)=>{const e=document.getElementById(id);if(!e)return;const n=normalizeDateText(e.value);if(n!==e.value)e.value=n;};
window.normalizeSaleDateLive=(id)=>{const e=document.getElementById(id);if(!e)return;const raw=String(e.value||'');if(/^\d{8}$/.test(raw)||/^\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}$/.test(raw)||/^\d{4}年\d{1,2}月\d{1,2}日?$/.test(raw)){const n=normalizeDateText(raw);if(n!==raw)e.value=n;}};
async function pageRegister(id=null){
  const rec=id?await api('/api/records/'+id):null;
  const g=(k)=>rec?(rec[k]??''):'';
  const serials=rec?(serialList(rec.serials)).join('\n'):'';
  const extra=FIELD_DEFS.map(([k,l,t,r])=>{
    if(k==='supplier_name') return inputHtml(k,l,t,r,g('supplier_name'));
    if(k==='product_model') return inputHtml(k,l,t,r,g('product_model'));
    return inputHtml(k,l,t,r,g(k));
  }).join('');
  $('#page').innerHTML='<div class="card"><h2>'+(rec?'编辑登记 '+esc(rec.record_no):'＋ 新增售后登记')+' <span class="badge gray">前台 / 后台均可录入</span></h2>'
    +(NEWFLOW?'<input type="hidden" id="f_status" value="已收件"><input type="hidden" id="f_supplier_name" value=""><input type="hidden" id="f_merchant_note" value="">':'')
    +'<div class="hint" style="margin-bottom:16px">前台快捷登记只负责收件：登记日期自动当前时间，默认「已收件」，填写客户寄来单号即可。收件后在「维保中心」一键选择送修上家或自维保，并打印明细。</div>'
    +'<div class="grid g3">'+extra+'</div>'
    +'<div id="express_hint" class="hint" style="margin:-6px 0 12px"></div>'
    +'<div class="field" style="margin:-6px 0 12px"><label>快递公司（自动识别，不准可手动选）</label><select id="f_express_company"><option value="">未指定 / 自动识别</option>'+EXPRESS_LIST.map(x=>'<option '+(rec?.express_company===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'
    +'<div class="grid g2"><div class="field scan-box"><label>序列号 / 条码 <span class="badge gray">支持扫码枪</span></label><textarea id="f_serials" placeholder="SN001&#10;SN002&#10;SN003">'+esc(serials)+'</textarea><div class="scan-hint"><span class="scan-live">● 扫码待命</span> 扫码枪扫入自动换行；多条也可逗号 / 空格分隔</div></div>'
    +'<div class="field"><label>故障描述</label><textarea id="f_fault_desc" placeholder="详细故障现象、检测结果">'+esc(g('fault_desc'))+'</textarea></div></div>'
    +(NEWFLOW?'':'<div class="field"><label>寄商家备注（打印明细显示，紧跟故障描述）</label><textarea id="f_merchant_note" placeholder="写给上家/售后站点看的内容，例如「请检测后报价」">'+esc(g('merchant_note'))+'</textarea></div>')
    +'<div class="field"><label>内部备注（仅自己查看，不打印）</label><textarea id="f_remark" placeholder="内部记录，不会出现在给商家的明细单">'+esc(g('remark'))+'</textarea></div>'
    +'<div class="sep"></div><div class="card" style="background:var(--bg2,#f8fafc);padding:12px 14px"><label style="display:flex;align-items:center;gap:8px;font-weight:600"><input type="checkbox" id="f_is_paid" style="width:auto" '+(rec?.is_paid?'checked':'')+' onchange="onPaidToggle()"> 是否收费（自费维修）</label><div id="paid_box" style="margin-top:8px"><span class="hint">默认关闭；勾选后需手动输入收费金额</span></div></div>'
    +(NEWFLOW?'':'<div class="sep"></div><h3>换新与返回信息</h3><div class="grid g3">'
    +'<div class="field"><label><input type="checkbox" id="f_is_exchange" style="width:auto;margin-right:6px" '+(rec?.is_exchange?'checked':'')+'>本单为换新</label></div>'
    +inputHtml('exchange_serial','新序列号（原序列号保留在 RAM 字段）','text','',g('exchange_serial'))
    +'<div class="field"><label>品牌</label><input id="f_brand" value="'+esc(g('brand'))+'"></div>'
    +inputHtml('return_date','返回日期','date','',g('return_date'))
    +inputHtml('tracking_back','返回快递单号','text','',g('tracking_back'))
    +'</div>')
    +'<div class="save-bar"><span class="hint"><span class="kbd">Ctrl</span>+<span class="kbd">S</span> 快速保存 · 保存后自动清空继续下一单</span><div class="spacer"></div><button class="btn ghost" onclick="navigate(\'query\')">查看全部登记</button>'+(rec?'<button class="btn ghost" onclick="showRecord('+rec.id+')">查看进度时间线</button>':'')+'<button class="btn" id="btnSaveRecord" onclick="saveRecord('+(rec?rec.id:'null')+')">'+(rec?'✔ 保存修改':'✔ 提交登记')+'</button></div></div>';
  setTimeout(()=>{if(!NEWFLOW)return;const t=$('#f_tracking_out'),co=$('#f_express_company'),lab=co?.closest('.field');if(t&&co&&lab){lab.style.display='none';const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:6px;align-items:center';t.parentNode.insertBefore(wrap,t);wrap.appendChild(t);wrap.appendChild(co);t.style.flex='2';co.style.flex='1';t.placeholder='客户寄来单号 / 自动识别快递公司';}},0);
  setTimeout(()=>{
    // 编辑已有收费单：回填金额输入框，避免保存时把金额清零
    if(rec){ window.__paidAmount=rec.fee_amount||0; if(window.__paidInit)window.__paidInit(); }
    const ti=$('#f_tracking_out'), h=$('#express_hint'), sel=$('#f_express_company');
    const show=()=>{
      const v=ti?.value?.trim()||'', auto=detectExpress(v);
      if(h) h.innerHTML=v?(auto?'📦 自动识别：<b>'+esc(auto)+'</b>':'⚠ 纯数字单号无法可靠识别，请在下方手动选择快递公司'):'';
      if(sel&&auto&&!sel.dataset.manual){ for(const o of sel.options) if(o.value===auto||o.textContent===auto){sel.value=o.value;break;} }
    };
    if(sel) sel.addEventListener('change',()=>{sel.dataset.manual='1';});
    if(ti){ ti.addEventListener('input',()=>{ if(sel)delete sel.dataset.manual; show(); }); show(); }
  },0);
  // 扫码枪：textarea 里回车不换行提交表单，保留为换行；全局 Ctrl+S
  setTimeout(()=>{
    const el=$('#f_serials');
    if(el){ el.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();saveRecord(rec?rec.id:null);} }); }
    document.addEventListener('keydown',function h(e){ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveRecord(rec?rec.id:null);} },{once:false});
  },0);
}
window.pageRegister=pageRegister;
let SAVING=false;
window.saveRecord=async(id)=>{
  if(SAVING) return; // 防连点重复提交
  // 收费弹框未确认时，自动采用弹框金额并关闭遮罩
  const pa=$('#pay_amount');
  if(pa&&pa.value){ const f=$('#f_fee_amount'); if(f)f.value=pa.value; closeModal(); }
  const v=k=>$('#f_'+k)?.value??'';
  if(!String(v('repair_unit')||'').trim()){ toast('送修单位 / 客户不能为空，请先填写','err'); $('#f_repair_unit')?.focus(); return; }
  const body={
    record_date:v('record_date'),supplier_name:v('supplier_name'),product_model:v('product_model'),
    brand:v('brand'),quantity:v('quantity'),serials:v('serials'),sale_date:normalizeDateText(v('sale_date')),sale_date_explicit:!!String(v('sale_date')||'').trim(),
    fault_desc:v('fault_desc'),status:(NEWFLOW?NEW_DEFAULT_STATUS:v('status')),repair_unit:v('repair_unit'),
    contact_name:v('contact_name'),contact_phone:v('contact_phone'),remark:v('remark'),merchant_note:v('merchant_note'),
    is_exchange:(NEWFLOW?false:(()=>{const e=document.getElementById('f_is_exchange');return !!(e&&e.checked);})()),exchange_serial:(NEWFLOW?'':v('exchange_serial')),
    is_paid:(()=>{const e=document.getElementById('f_is_paid');return !!(e&&e.checked)||(Number($('#f_fee_amount')?.value||0)>0);})(),fee_amount:Number($('#f_fee_amount')?.value||0)||0,
    tracking_out:v('tracking_out'),tracking_back:(NEWFLOW?'':v('tracking_back')),return_date:(NEWFLOW?'':v('return_date')),express_company:$('#f_express_company')?.value||detectExpress(v('tracking_out')),
    maintenance:(NEWFLOW?{mode:'已收件',inbound_no:v('tracking_out'),inbound_date:v('record_date')||nowLocal(),inbound_company:$('#f_express_company')?.value||detectExpress(v('tracking_out')),status:NEW_DEFAULT_STATUS}:undefined),
  };
  const btn=$('#btnSaveRecord'), old=btn?btn.textContent:'';
  SAVING=true; if(btn){btn.disabled=true;btn.textContent=id?'保存中…':'提交中…';}
  try{
    const r=id?await api('/api/records/'+id,{method:'PUT',body}):await api('/api/records',{method:'POST',body});
    invalidateCache(); // 新登记后统计/字典立即刷新
    toast(id?'已保存':'登记成功：'+r.record_no,'ok');
    await api('/api/dict').then(d=>A.dict=d).catch(()=>{});
    if(!id){ pageRegister(); toast('已保存，可继续登记下一单','ok'); } else navigate('query');
  }catch(e){ if(btn){btn.disabled=false;btn.textContent=old;} }
  finally{ SAVING=false; }
};
window.showRecord=async id=>{
  const r=await api('/api/records/'+id);
  const ev=r.events.map(e=>'<div style="padding:8px 0;border-bottom:1px solid var(--line);display:flex;gap:12px"><span class="pill st-'+esc(e.to_status)+'">'+esc(e.to_status)+'</span><span class="muted">'+new Date(e.created_at*1000).toLocaleString('zh-CN')+'</span><span>'+esc(e.operator||'系统')+'</span><span>'+esc(e.note)+'</span></div>').join('');
  modal(modalHead('单据 '+esc(r.record_no)+' · 进度时间线')+'<div class="mb"><div class="grid g2"><div><b>型号</b> '+esc(r.product_model)+'<br><b>品牌</b> '+esc(r.brand||'—')+'<br><b>上家</b> '+esc(r.supplier_name)+'<br><b>序列号（RAM）</b> '+serialList(r.serials).map(s=>'<span class="sn">'+esc(s)+'</span>').join('')+(r.exchange_serial?'<br><b>新序列号（换新）</b> <span class="sn">'+esc(r.exchange_serial)+'</span>':'')+'</div><div><b>状态</b> '+statusPill(r.status)+'<br><b>数量</b> '+r.quantity+'<br><b>快递</b> '+esc(r.tracking_out||'—')+' / '+esc(r.tracking_back||'—')+'</div></div>'
  +'<div style="margin-top:10px;padding:10px 12px;background:var(--bg2,#f8fafc);border:1px solid var(--line,#e2e8f0);border-radius:9px"><div class="grid g3"><div><b>寄送日期</b> '+esc(String(r.record_date||'—').slice(0,10))+'</div><div><b>返回日期</b> '+esc(String(r.return_date||'—').slice(0,10))+'</div><div><b>共计</b> '+((()=>{const a=String(r.record_date||'').slice(0,10),b=String(r.return_date||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b))return '—';const d=Math.ceil((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000);return d>=0?(d+' 天'):'—';})())+'</div></div><div style="margin-top:8px"><b>故障原因 / 故障描述</b><div style="white-space:pre-wrap;line-height:1.7;margin-top:5px">'+esc(r.fault_desc||'—')+'</div>'+(r.remark?'<div class="muted" style="margin-top:6px"><b>备注：</b>'+esc(r.remark)+'</div>':'')+'</div></div>'+pickupDetail(r)+'<h3 style="margin-top:14px">状态变更记录</h3>'+(ev||'<div class="empty">暂无变更</div>')+'</div><div class="mf"><button class="btn ghost" onclick="closeModal()">关闭</button><button class="btn" onclick="closeModal();pageRegister('+r.id+')">编辑此单</button></div>',true);
};

function localDateTime(d=new Date()){const p=n=>String(n).padStart(2,'0');const x=new Date(d.getTime()+8*3600*1000);return x.getUTCFullYear()+'-'+p(x.getUTCMonth()+1)+'-'+p(x.getUTCDate())+' '+p(x.getUTCHours())+':'+p(x.getUTCMinutes());}
// ================= 取件中心：已返回单据交付登记 =================
let PK={rows:[],page:1,size:10,all:false,open:true,q:'',filter:'unpicked'};
function pkFmt(t){return String(t||'').slice(0,16);}
function pkRowsHtml(rows,base){return rows.map((r,i)=>{const picked=Number(r.pickup_count||0)>0;return '<tr><td><a href="javascript:showRecord('+r.id+')">'+esc(r.record_no)+'</a><br><span class="muted">'+esc(pkFmt(r.return_date))+'</span></td><td>'+esc(r.product_model)+'</td><td>'+esc(r.repair_unit||'—')+'<br><span class="muted">'+esc(r.contact_name||'')+' '+esc(r.contact_phone||'')+'</span></td><td>'+serialList(r.serials).map(s=>'<span class="sn">'+esc(s)+'</span>').join('')+(r.exchange_serial?'<br><span class="mono">新：'+esc(r.exchange_serial)+'</span>':'')+'</td><td>'+statusPill(r.status)+'</td><td>'+esc(pkFmt(r.return_date))+'</td><td>'+(picked?'<span class="badge ok">'+esc(r.pickup_method||'已取')+'</span><br><span class="muted">'+esc(pkFmt(r.picked_at))+'</span>':'<span class="pk-unpicked">未取件</span>')+'</td><td>'+(picked?'—':'<button class="btn sm" onclick="openPickupFormById('+r.id+')">登记取件</button>')+'</td></tr>';}).join('');}
function renderPickup(){if(!$('#pk_result')){setTimeout(renderPickup,80);return;}const f=PK.filter||'unpicked';PK.rows=(window.__PK_ALL||[]).filter(r=>f==='all'?true:f==='picked'?Number(r.pickup_count||0)>0:Number(r.pickup_count||0)===0);const total=PK.rows.length,pages=Math.max(1,Math.ceil(total/PK.size));if(PK.page>pages)PK.page=pages;const view=PK.all?PK.rows:PK.rows.slice((PK.page-1)*PK.size,PK.page*PK.size);$('#pk_result').innerHTML='<div class="toolbar"><h2 style="margin:0">取件单据 <span class="badge">'+total+' 条</span></h2><span class="spacer"></span><button class="btn ghost sm" onclick="pkToggleOpen()">'+(PK.open?'折叠':'展开')+'</button><button class="btn ghost sm" onclick="pkToggleAll()">'+(PK.all?'分页显示':'显示全部')+'</button></div>'+(PK.open?'<div class="toolbar" style="margin-top:8px"><button class="btn ghost sm" '+(PK.page<=1?'disabled':'')+' onclick="pkPage(-1)">上一页</button><span class="hint">第 '+PK.page+'/'+pages+' 页 · 每页 '+PK.size+' 条</span><button class="btn ghost sm" '+((PK.page>=pages)||PK.all?'disabled':'')+' onclick="pkPage(1)">下一页</button></div>'+(total?'<div class="tbl-wrap"><table class="pickup-table"><thead><tr><th>单号 / 返回日期</th><th>型号</th><th>客户 / 联系人 / 电话</th><th>序列号</th><th>状态</th><th>通过时间</th><th>取件状态 / 时间</th><th>操作</th></tr></thead><tbody>'+pkRowsHtml(view,(PK.page-1)*PK.size)+'</tbody></table></div>':'<div class="empty">没有匹配的取件单据</div>'):'<div class="hint">已折叠，点「展开」查看候选单据。</div>')+(PK.open?'<div class="toolbar" style="margin-top:8px"><button class="btn ghost sm" '+(PK.page<=1?'disabled':'')+' onclick="pkPage(-1)">上一页</button><button class="btn ghost sm" '+((PK.page>=pages)||PK.all?'disabled':'')+' onclick="pkPage(1)">下一页</button></div>':'');}
async function pagePickup(){
 $('#page').innerHTML='<div class="card"><h2>📦 取件中心 <span class="badge gray">已返回配件交付客户</span></h2>'
  +'<div class="hint" style="margin-bottom:12px">默认只显示 <b>未取件</b>；可切换查看已取件或全部。红色标记表示未取件；「通过时间」为返回录入提交时间。</div>'
  +'<div class="toolbar"><input id="pk_q" style="flex:1;min-width:260px" placeholder="输入客户 / 单位 / 电话 / 序列号 / 设备型号 / 单号"><select id="pk_filter" style="width:120px" onchange="pkFilterChange(true)"><option value="unpicked">未取件</option><option value="picked">已取件</option><option value="all">全部</option></select><button class="btn" onclick="pkSearch()">查询</button><button class="btn ghost" onclick="loadPickupHistory()">取件记录</button></div>'
 +'<div id="pk_result" class="card" style="margin-top:12px"></div></div>';
 const q=$('#pk_q');q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();loadPickup();}};
 if(window.__PK_ALL&&window.__PK_ALL.length){renderPickup();}
 loadPickup('');
 setTimeout(()=>{if(A.route==='pickup')loadPickup('');},350);
}
window.pickupForceLoad=async()=>{if(A.route!=='pickup')navigate('pickup');await loadPickup('');};
window.pkFilterChange=(reload)=>{PK.filter=$('#pk_filter')?.value||'unpicked';PK.page=1;if(reload)loadPickup('');else renderPickup();};
window.pkSearch=()=>loadPickup($('#pk_q')?.value||'');
window.loadPickup=async(q)=>{q=q==null?($('#pk_q')?.value||''):q;PK.q=q;PK.filter=$('#pk_filter')?.value||'unpicked';PK.page=1;PK.all=false;PK.open=true;let d;try{d=await api(nfUrl('/api/pickup/candidates?q='+encodeURIComponent(q)+'&limit=5000&filter='+encodeURIComponent(PK.filter)));}catch(e){toast(e.message,'err');return;}window.__PK_ALL=d.rows||[];PK.rows=window.__PK_ALL;renderPickup();};
window.pkPage=d=>{PK.page=Math.max(1,PK.page+d);renderPickup();};window.pkToggleAll=()=>{PK.all=!PK.all;PK.page=1;renderPickup();};window.pkToggleOpen=()=>{PK.open=!PK.open;renderPickup();};
window.openPickupFormById=async(id)=>{const r=(window.__PK_ALL||[]).find(x=>Number(x.id)===Number(id));if(!r){toast('单据不存在','err');return;}modal(modalHead('登记取件 · '+esc(r.record_no))+'<div class="mb"><div class="hint" style="margin-bottom:10px">'+esc(r.product_model)+' · '+esc(r.repair_unit||'—')+' · '+esc(r.contact_phone||'—')+'</div><div class="grid g2"><div class="field"><label>取件方式</label><select id="pk_method"><option>自取</option><option>快递</option><option>商家自送</option></select></div><div class="field"><label>取件时间</label><input id="pk_time" value="'+esc(localDateTime())+'"></div><div class="field"><label>快递单号（快递时填写）</label><input id="pk_track" placeholder="选填"></div><div class="field"><label>取件人 / 签收人</label><input id="pk_receiver" placeholder="选填"></div></div><div class="field"><label>备注</label><input id="pk_remark" placeholder="选填"></div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="savePickupById('+r.id+')">确认登记</button></div>');};
window.savePickupById=async(id)=>{const r=(window.__PK_ALL||[]).find(x=>Number(x.id)===Number(id));if(!r){toast('单据不存在','err');return;}const body={record_id:id,pickup_method:$('#pk_method').value,picked_at:$('#pk_time').value,tracking_no:$('#pk_track').value,receiver:$('#pk_receiver').value,remark:$('#pk_remark').value};try{const j=await api(nfUrl('/api/pickup'),{method:'POST',body});if(j.ok===false){toast(j.reason||'登记失败','err');return;}invalidateCache();closeModal();toast('取件已登记：'+j.record_no,'ok');loadPickup($('#pk_q')?.value||'');}catch(e){toast(e.message||'登记失败','err');}};
window.openPickupForm=async(idx)=>{const r=(PK.rows||[])[idx];if(!r)return;modal(modalHead('登记取件 · '+esc(r.record_no))+'<div class="mb"><div class="hint" style="margin-bottom:10px">'+esc(r.product_model)+' · '+esc(r.repair_unit||'—')+' · '+esc(r.contact_phone||'—')+'</div><div class="grid g2"><div class="field"><label>取件方式</label><select id="pk_method"><option>自取</option><option>快递</option><option>商家自送</option></select></div><div class="field"><label>取件时间</label><input id="pk_time" value="'+esc(localDateTime())+'"></div><div class="field"><label>快递单号（快递时填写）</label><input id="pk_track" placeholder="选填"></div><div class="field"><label>取件人 / 签收人</label><input id="pk_receiver" placeholder="选填"></div></div><div class="field"><label>备注</label><input id="pk_remark" placeholder="选填"></div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="savePickup('+idx+')">确认登记</button></div>');};
window.savePickup=async(idx)=>{const r=(PK.rows||[])[idx];if(!r)return;const body={record_id:r.id,pickup_method:$('#pk_method').value,picked_at:$('#pk_time').value,tracking_no:$('#pk_track').value,receiver:$('#pk_receiver').value,remark:$('#pk_remark').value};try{const j=await api(nfUrl('/api/pickup'),{method:'POST',body});if(j.ok===false){toast(j.reason||'登记失败','err');return;}invalidateCache();closeModal();toast('取件已登记：'+j.record_no,'ok');loadPickup(PK.q);}catch(e){toast(e.message||'登记失败','err');}};
window.loadPickupHistory=async()=>{let d;try{d=await api(nfUrl('/api/pickup/records?limit=5000'));}catch(e){toast(e.message,'err');return;}const rows=d.rows||[];$('#pk_result').innerHTML='<h2>取件记录 <span class="badge">'+rows.length+' 条</span></h2>'+(rows.length?'<div class="tbl-wrap"><table><thead><tr><th>单号</th><th>型号 / 序列号</th><th>客户 / 电话</th><th>方式</th><th>快递单号</th><th>取件人</th><th>时间</th><th>备注</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><a href="javascript:showRecord('+r.record_id+')">'+esc(r.record_no)+'</a></td><td>'+esc(r.product_model)+'<br><span class="muted">'+esc(r.serial)+'</span></td><td>'+esc(r.repair_unit||'—')+'<br><span class="muted">'+esc(r.contact_phone||'')+'</span></td><td>'+esc(r.pickup_method)+'</td><td>'+esc(r.tracking_no||'—')+'</td><td>'+esc(r.receiver||'—')+'</td><td>'+esc(pkFmt(r.picked_at))+'</td><td>'+esc(r.remark||'—')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">暂无取件记录</div>');};
function pickupBadge(r){if(!r)return '';if(r.pickup_method)return '<br><span class="badge ok">已取件 · '+esc(r.pickup_method)+'</span>'+(r.picked_at?'<br><span class="muted">'+esc(pkFmt(r.picked_at))+'</span>':'');if(Number(r.pickup_count)>0)return '<br><span class="badge ok">已取件</span>';return '<br><span class="badge gray">待取件</span>';}
function pickupDetail(r){const p=r.pickup_latest||r.latest||(r.pickups&&r.pickups[0]);if(!p)return '<div class="hint" style="margin-top:12px">取件状态：待取件</div>';return '<div class="card" style="margin-top:12px;padding:10px 12px"><b>客户已取件</b> · '+esc(p.pickup_method||'—')+'<br><span class="muted">取件时间：'+esc(pkFmt(p.picked_at))+' · 取件人：'+esc(p.receiver||'—')+' · 快递单号：'+esc(p.tracking_no||'—')+'</span>'+(p.remark?'<div class="muted">备注：'+esc(p.remark)+'</div>':'')+'</div>';}
// ================= 精准查询 =================
let Q={page:1,size:20,sort:'record_date',order:'desc',open_only:false};
let Q_SEARCHED=false;
async function pageQuery(){
  Q_SEARCHED=false;
  $('#page').innerHTML='<div class="card"><h2>⌕ 任意检索 <span class="badge gray">输入即匹配 · 默认显示全部单据</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">一个输入框同时匹配 <b>上家 / 产品型号 / 送修单位 / 联系人 / 联系方式 / 序列号 / 快递单号 / 故障 / 备注 / 单号</b>。按 <span class="kbd">Enter</span> 或点「查询」显示结果；<b>默认列出全部单据</b>（含已完成 / 已返回）。</div>'
    +'<div class="toolbar"><input id="q_any" style="flex:1;min-width:260px;font-size:15px;padding:12px" placeholder="输入上家 / 型号 / 送修单位 / 联系人 / 电话 / 序列号 / 快递单号… 然后回车">'
    +'<button class="btn" onclick="doQuery(1)">查询</button><button class="btn ghost" onclick="clearQueryDates()">清空日期</button><button class="btn ghost" onclick="resetQuery()">重置</button>'
    +'<button class="btn ghost" onclick="exportCurrent()">⇩ 导出当前结果</button></div>'
    +'<div class="grid g4" style="margin-top:6px">'
    +'<div class="field"><label>登记日期从</label><div style="display:flex;gap:5px"><input type="text" id="q_date_from" placeholder="2026-11-01" style="flex:1"><input type="date" id="q_date_from_pick" style="position:absolute;width:1px;opacity:0" onchange="setDateFromPick(\'q_date_from\')"><button type="button" class="btn ghost sm" onclick="openDatePick(\'q_date_from\')">📅</button><button type="button" class="btn ghost sm" onclick="clearDate(\'q_date_from\')">✕</button></div></div>'
    +'<div class="field"><label>到</label><div style="display:flex;gap:5px"><input type="text" id="q_date_to" placeholder="2026-11-30" style="flex:1"><input type="date" id="q_date_to_pick" style="position:absolute;width:1px;opacity:0" onchange="setDateFromPick(\'q_date_to\')"><button type="button" class="btn ghost sm" onclick="openDatePick(\'q_date_to\')">📅</button><button type="button" class="btn ghost sm" onclick="clearDate(\'q_date_to\')">✕</button></div></div>'
    +'<div class="field"><label>换新 / 换新序列号</label><div style="display:flex;gap:6px"><select id="q_is_exchange" style="width:110px" onchange="doQuery(1)"><option value="">全部</option><option value="1">仅换新</option><option value="0">非换新</option></select><input id="q_exchange_serial" placeholder="新序列号"></div></div>'
    +'</div><div class="grid g4">'
    +'<div class="field"><label>寄送上家（模糊）</label><input id="q_supplier_name" list="dl_q_sup"><datalist id="dl_q_sup">'+A.dict.suppliers.map(x=>'<option value="'+esc(x.name)+'">').join('')+'</datalist></div>'
    +'<div class="field"><label>产品型号（模糊）</label><input id="q_product_model" list="dl_q_mod"><datalist id="dl_q_mod">'+A.dict.products.map(x=>'<option value="'+esc(x.model)+'">').join('')+'</datalist></div>'
    +'<div class="field"><label>维修进度</label><select id="q_status" onchange="doQuery(1)"><option value="">全部</option>'+A.statuses.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></div>'
    +'<div class="field"><label>日期排序</label><select id="q_order"><option value="desc">新→旧</option><option value="asc">旧→新</option></select></div>'
    +'<div class="field"><label>快递单号</label><input id="q_tracking"></div>'
    +'</div></div>'
    +'<div class="card" id="resultCard"><div class="empty">输入检索内容后按 <b>Enter</b> 或点「查询」显示结果</div></div>';
  const a=$('#q_any'); a.focus();
  a.onkeydown=e=>{ if(e.key==='Enter'){e.preventDefault();doQuery(1);} };
}
const QKEYS=['any','date_from','date_to','supplier_name','product_model','serial_exact','serial_like','status','tracking','repair_unit','contact_phone','sale_from','sale_to','return_from','return_to','is_exchange','exchange_serial','keyword','fault_desc','remark','open_only'];
function collectQ(){
  Q.any=$('#q_any')?.value||'';
  ['date_from','date_to','supplier_name','product_model','status','tracking','is_exchange','exchange_serial','open_only','order'].forEach(k=>{const el=$('#q_'+k);if(el)Q[k]=el.value;});
  Q.open_only=false;
  Q.order=$('#q_order')?.value||'desc';
}
window.resetQuery=()=>{Q={page:1,size:20,sort:'record_date',order:'desc',open_only:false};pageQuery();};
window.doQuery=async(p)=>{
  collectQ(); Q.page=p||1; Q_SEARCHED=true;
  const params=new URLSearchParams();
  Object.entries(Q).forEach(([k,v])=>{if(v!==''&&v!=null&&v!==false&&!['sort','order'].includes(k))params.set(k,String(v));});
  ['sort','order'].forEach(k=>params.set(k,String(Q[k]||(k==='order'?'desc':'record_date'))));
  const d=await api(nfUrl('/api/records?'+params.toString()));
  const rows=d.rows.map(r=>'<tr>'
    +'<td><a href="javascript:showRecord('+r.id+')"><b>'+esc(r.record_no)+'</b></a><br><span class="muted">'+fmtDate(r.record_date)+'</span></td>'
    +'<td>'+esc(r.supplier_name)+'</td><td>'+esc(r.product_model)+'</td><td>'+r.quantity+'</td>'
    +'<td>'+serialList(r.serials).map(s=>'<span class="sn">'+esc(s)+'</span>').join('')+'</td>'
    +'<td>'+statusPill(r.status)+pickupBadge(r)+'</td><td>'+esc(r.repair_unit||'—')+'<br><span class="muted">'+esc(r.contact_phone||'')+'</span></td>'
    +'<td>'+(NEWFLOW?(function(){let e={};try{e=typeof r.extra==='string'?JSON.parse(r.extra||'{}'):(r.extra||{})}catch{}const m=e.maintenance||{},up=m.upstream||{};const bits=[];if(m.inbound_no||r.tracking_out)bits.push('客户寄来：'+(m.inbound_no||r.tracking_out));if(up.tracking_no)bits.push('快递单号：'+up.tracking_no);if(up.company||m.inbound_company||r.express_company)bits.push('快递公司：'+(up.company||m.inbound_company||r.express_company));if(up.name||r.supplier_name)bits.push('送修上家：'+(up.name||r.supplier_name));if(m.mode||r.status)bits.push('维保方式：'+(m.mode||r.status));if(up.note||r.merchant_note)bits.push('寄商家备注：'+(up.note||r.merchant_note));if(r.tracking_back)bits.push('返回单号：'+r.tracking_back);return bits.map(x=>'<span class="muted">'+esc(x)+'</span>').join('<br>')||'—';})():esc(r.tracking_out||'—')+'<br><span class="muted">'+esc(r.tracking_back||'')+'</span>')+'</td>'
    +'<td class="col-paid">'+(Number(r.is_paid||0)>0||Number(r.fee_amount||0)>0?'<span class="badge warn paid-badge">自费 ¥'+esc(r.fee_amount||0)+'</span>':'<span class="muted">否</span>')+'</td>'
    +'<td>'+(r.is_exchange?'<span class="badge ok">是</span>'+(r.exchange_serial?'<br><span class="mono">'+esc(r.exchange_serial)+'</span>':''):'<span class="muted">否</span>')+'</td>'
    +'<td>'+fmtDate(r.return_date)+'</td><td>'+esc(r.creator||'—')+'</td>'
    +'<td style="white-space:nowrap"><button class="btn ghost sm" onclick="showRecord('+r.id+')">详情</button> <button class="btn ghost sm" onclick="pageRegister('+r.id+')">编辑</button></td></tr>').join('');
  $('#resultCard').innerHTML='<h2>查询结果 <span class="badge">'+d.total+' 条</span></h2><div class="tbl-wrap"><table class="'+(NEWFLOW?'query-table':'')+'">'+(NEWFLOW?'<colgroup><col style="width:9%"><col style="width:7%"><col style="width:9%"><col style="width:4%"><col style="width:8%"><col style="width:7%"><col style="width:9%"><col style="width:16%"><col style="width:5%"><col style="width:4%"><col style="width:6%"><col style="width:5%"><col style="width:9%"></colgroup>':'')+'<thead><tr><th>登记单号 / 日期</th><th>寄送上家</th><th>产品型号</th><th>数量</th><th>序列号（RAM）</th><th>进度 / 取件</th><th>送修单位 / 联系方式</th><th>快递单号(送/返)</th><th>自费</th><th>换新</th><th>返回日期</th><th>登记人</th><th>操作</th></tr></thead><tbody>'+(rows||'<tr><td colspan="13"><div class="empty">没有匹配的记录</div></td></tr>')+'</tbody></table></div>'
    +'<div class="pager"><span>第 '+d.page+' 页 · 每页 '+d.size+' 条 · 共 '+d.total+' 条</span><div style="display:flex;gap:6px"><button class="btn ghost sm" '+(d.page<=1?'disabled':'')+' onclick="doQuery('+(d.page-1)+')">上一页</button><button class="btn ghost sm" '+((d.page*d.size>=d.total)?'disabled':'')+' onclick="doQuery('+(d.page+1)+')">下一页</button></div></div>';
};
window.exportCurrent=()=>{ collectQ(); const p=new URLSearchParams(); Object.entries(Q).forEach(([k,v])=>{if(v!==''&&v!=null&&v!==false&&!['page','size','sort','order'].includes(k))p.set(k,String(v));}); p.set('format','xlsx'); location.href='/api/export?'+p.toString(); toast('已开始下载当前筛选结果','ok'); };

// ================= 客户设备档案（按单位/联系人查全年全部送修设备）=================
window.showCustomerDevices=async(unit)=>{
  const d=await api('/api/customer/devices?unit='+encodeURIComponent(unit));
  const years=d.years||[];
  const modelRows=Object.entries(d.by_model||{}).map(([k,v])=>'<span class="chip">'+esc(k)+' × '+v+'</span>').join('');
  const statusRows=Object.entries(d.by_status||{}).map(([k,v])=>'<span class="chip">'+statusPill(k)+' × '+v+'</span>').join('');
  const rows=d.rows.map(r=>'<tr><td><a href="javascript:showRecord('+r.id+')">'+esc(r.record_no)+'</a></td><td>'+fmtDate(r.record_date)+'</td><td>'+esc(r.product_model)+'</td><td>'+serialList(r.serials).map(s=>'<span class="sn">'+esc(s)+'</span>').join('')+'</td><td>'+esc(r.supplier_name)+'</td><td>'+statusPill(r.status)+'</td><td>'+esc(r.contact_phone||'—')+'</td><td>'+fmtDate(r.return_date)+'</td></tr>').join('');
  modal(modalHead('客户设备档案 · '+esc(unit))+'<div class="mb">'
    +'<div class="grid g4" style="margin-bottom:12px">'+[['累计送修',d.total+' 台'],['涉及年份',years.length+' 年'],['型号数',Object.keys(d.by_model||{}).length],['当前未返回',Object.entries(d.by_status||{}).filter(([k])=>!['已返回','已换新','已报废','已取消'].includes(k)).reduce((a,[,v])=>a+v,0)]].map(([k,v])=>'<div class="stat"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('')+'</div>'
    +'<div class="hint"><b>年份：</b>'+(years.join(' / ')||'—')+' &nbsp; <b>按型号：</b>'+modelRows+' &nbsp; <b>按进度：</b>'+statusRows+'</div>'
    +'<div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>单号</th><th>登记日期</th><th>型号</th><th>序列号（RAM）</th><th>上家</th><th>进度</th><th>联系方式</th><th>返回日期</th></tr></thead><tbody>'+(rows||'<tr><td colspan="8"><div class="empty">暂无送修记录</div></td></tr>')+'</tbody></table></div>'
    +'</div><div class="mf"><button class="btn ghost" onclick="closeModal()">关闭</button><button class="btn" onclick="closeModal();navigate(\'query\')">去任意检索</button></div>',true);
};

// ================= 表格导入 =================
let IMPORT=null;
async function pageImport(){
  $('#page').innerHTML='<div class="card"><h2>⇪ 导入表格自动识别</h2><div class="hint" style="margin-bottom:14px">支持 .xlsx / .xls / .csv。系统自动探测表头行并识别中英文别名（如「序列号/SN/条码/IMEI」「上家/售后站点/供应商」「换新序列号」「快递单号」…），未识别的列可在预览页手动指定。自动为不存在的型号 / 上家建档。</div>'
    +'<div class="toolbar"><input type="file" id="impFile" accept=".xlsx,.xls,.csv"><button class="btn" onclick="parseImport()">① 上传并自动识别</button><a class="btn ghost" href="/api/export?format=xlsx">⇩ 下载导入模板</a></div>'
    +'<div class="sep"></div><div class="hint"><b>重复策略</b>：<select id="impStrategy" style="width:auto;display:inline-block"><option value="append">追加（默认）</option><option value="skip">跳过重复单号 / 序列号</option></select></div>'
    +'<div id="impPreview"></div></div>';
}
window.parseImport=async()=>{
  const inp=$('#impFile'); if(!inp.files.length){toast('请先选择文件','warn');return;}
  const fd=new FormData(); fd.append('file',inp.files[0]);
  const p=await api('/api/import/parse',{method:'POST',body:fd});
  if(!p.ok){ $('#impPreview').innerHTML='<div class="empty">'+esc(p.reason)+'</div>'; return; }
  IMPORT=p;
  // 防御：若期间页面被重渲染导致预览容器丢失，重建导入页再填
  if(!$('#impPreview')){ await pageImport(); }
  const FALLBACK={recordNo:'登记单号',recordDate:'登记日期',supplierName:'寄送上家/售后站点',productModel:'产品型号',brand:'品牌',quantity:'数量',serials:'序列号/条码',saleDate:'销售日期',faultDesc:'故障描述',status:'维修进度',repairUnit:'送修单位',contactName:'联系人',contactPhone:'联系方式',remark:'备注',merchantNote:'寄商家备注',isExchange:'换新',exchangeSerial:'新序列号',returnDate:'返回日期',trackingOut:'寄送快递单号',trackingBack:'返回快递单号',expressCompany:'快递公司'};
  const fsrc=A.fields&&Object.keys(A.fields).length?A.fields:FALLBACK;
  const fields=Object.entries(fsrc).map(([k,d])=>({k,label:(d&&d.label)||FALLBACK[k]||k}));
  const sel=c=>'<select data-col="'+c.index+'">'+fields.map(x=>'<option value="'+x.k+'" '+(x.k===c.key?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select>';
  const colHtml=p.columns.map(c=>'<span class="chip">'+esc(c.header)+' → '+sel(c)+'</span>').join('');
  const head='<tr><th>行号</th>'+p.columns.map(c=>'<th>'+esc(c.header)+'</th>').join('')+'<th>校验</th></tr>';
  const rows=p.rows.slice(0,20).map((r,i)=>'<tr><td>'+r._row+'</td>'+p.columns.map(c=>'<td>'+esc(r[c.key]||'')+'</td>').join('')+'<td>'+((p.validation[i]?.errors||[]).length?'<span class="badge err">'+p.validation[i].errors.join('；')+'</span>':'<span class="badge ok">通过</span>')+'</td></tr>').join('');
  $('#impPreview').innerHTML='<h3>② 确认字段映射（共识别 '+p.columns.length+' 列 / '+p.total_rows+' 行）</h3><div style="margin-bottom:12px">'+colHtml+'</div>'
    +(p.unmapped.length?'<div class="hint">未识别列：'+p.unmapped.map(x=>esc(x.header)).join('、')+'（已忽略）</div>':'')
    +'<div class="tbl-wrap" style="margin-top:12px"><table class="map-table"><thead>'+head+'</thead><tbody>'+rows+'</tbody></table></div>'
    +(p.total_rows>20?'<div class="hint">仅预览前 20 行，提交时导入全部 '+p.total_rows+' 行。</div>':'')
    +'<div class="toolbar" style="margin-top:14px"><button class="btn" onclick="commitImport()">③ 确认导入 '+p.total_rows+' 行</button></div><div id="impResult"></div>';
};
window.commitImport=async()=>{
  // 按用户确认的映射重建 rows 的 key
  const maps={}; $$('#impPreview select[data-col]').forEach(s=>maps[s.dataset.col]=s.value);
  const rows=IMPORT.rows.map(r=>{const o={_row:r._row};IMPORT.columns.forEach(c=>{o[maps[c.index]||c.key]=r[c.key]||'';});return o;});
  const res=await api('/api/import/commit',{method:'POST',body:{rows,strategy:$('#impStrategy').value}});
  $('#impResult').innerHTML='<div class="card" style="margin-top:14px;background:#f0fdf4"><b>导入完成</b>：成功 '+res.ok+' 条，失败 '+res.fail+' 条'
    +(res.errors.length?'<div class="hint">'+res.errors.slice(0,10).map(e=>'第 '+e.row+' 行：'+esc(e.errors.join('；'))).join('<br>')+'</div>':'')+'</div>';
  toast('导入完成：成功 '+res.ok+' 条','ok'); A.dict=await api('/api/dict');
};

// ================= 数据导出 =================
async function pageExport(){
  $('#page').innerHTML='<div class="card"><h2>⇩ 数据导出与备份</h2><div class="grid g3">'
    +exportCard('售后登记 Excel','全部登记记录，含全部字段、冻结表头','xlsx')
    +exportCard('售后登记 CSV','UTF-8 BOM，Excel 直接打开不乱码','csv')
    +exportCard('整机数据备份 JSON','含售后登记 / 字典 / 用户 / 设置 / 安心保设备与报修单 / 报价商品与渠道账号，超级管理员专属','json')
    +'</div><div class="sep"></div><div class="card" style="border-color:#f59e0b"><h2>♻ 整机数据恢复</h2>'
    +'<div class="hint">从旧版本迁移、清空数据后重建：请先下载上面的「整机数据备份 JSON」，再在这里选择该文件恢复。<b>Excel / CSV 只含售后登记，不含报价、报修、安心保数据</b>；表格导入只用于批量补录售后单，不能恢复整机。</div>'
    +'<div class="toolbar" style="margin-top:12px"><input type="file" id="fullRestoreFile" accept=".json,application/json"><button class="btn" onclick="fullRestore()">⇪ 选择 JSON 并整机恢复</button></div>'
    +'<div id="fullRestoreMsg" class="hint" style="margin-top:8px"></div></div>'
    +'<div class="sep"></div><h3>按筛选条件导出</h3><div class="hint">也可以在「精准查询」页设置条件后点「导出当前结果」。</div>'
    +'<div class="toolbar" style="margin-top:12px"><button class="btn ghost" onclick="location.href=\'/api/export?format=xlsx&status=%E7%BB%B4%E4%BF%AE%E4%B8%AD\'">导出「维修中」</button><button class="btn ghost" onclick="location.href=\'/api/export?format=xlsx&is_exchange=1\'">导出全部换新</button></div></div>';
}
window.fullRestore=async()=>{
  const f=$('#fullRestoreFile'),msg=$('#fullRestoreMsg');
  if(!f||!f.files.length){toast('请先选择整机备份 JSON','warn');return;}
  if(!confirm('整机恢复会用备份覆盖当前全部业务数据（含售后单、报价、报修、安心保）。确定继续？'))return;
  msg.textContent='正在读取并恢复…';
  try{
    const j=JSON.parse(await f.files[0].text());
    const r=await api('/api/backups/restore-json',{method:'POST',body:j});
    if(r.ok===false){msg.textContent='恢复失败：'+(r.reason||'未知错误');toast(r.reason||'恢复失败','err');return;}
    msg.textContent='✅ 恢复完成：'+r.tables+' 张表。刷新页面后查看数据。';toast('整机数据已恢复','ok');
    setTimeout(()=>location.reload(),1200);
  }catch(e){msg.textContent='文件不是有效 JSON：'+e.message;toast('文件格式错误','err');}
};
function exportCard(t,d,fmt){ return '<div class="stat"><div class="k">'+t+'</div><div style="font-size:15px;font-weight:600;margin:8px 0">'+d+'</div><button class="btn sm" onclick="location.href=\'/api/export?format='+fmt+'\'">⇩ 下载</button></div>'; }

// ================= 后台：字典 =================
async function pageDict(){
  A.dict=await api('/api/dict');
  const tabs=[['products','商品型号'],['suppliers','上家 / 售后站点'],['units','送修单位 / 客户'],['contacts','联系方式库']];
  const body=(key)=>{
    if(key==='products') return dictTable('products',['型号','品牌','分类','规格','状态'],A.dict.products,r=>[r.model,r.brand,r.category,r.spec,r.active?'启用':'停用'],'产品型号');
    if(key==='suppliers') return dictTable('suppliers',['名称','编码','联系人','电话','地址','快递备注','备注'],A.dict.suppliers,r=>[r.name,r.code,r.contact_name,r.phone,r.address,r.express_pref,r.remark],'售后站点');
    if(key==='units') return dictTable('units',['单位 / 姓名','联系人','电话','微信','地址','备注'],A.dict.repairUnits||[],r=>[r.name,r.contact_name,r.phone,r.wechat,r.address,r.remark],'送修单位');
    return dictTable('contacts',['姓名','电话','微信','邮箱','单位','关联上家','备注'],A.dict.contacts,r=>[r.name,r.phone,r.wechat,r.email,r.company,r.supplier_name||'',r.remark],'联系方式');
  };
  // 四个分类各自折叠，默认全部收起；点标题展开/收起，状态本次会话内记住
  window.DICT_OPEN=window.DICT_OPEN||{products:true,suppliers:true,units:true,contacts:true}; // 默认展开，可折叠
  const count=k=>k==='products'?(A.dict.products||[]).length:k==='suppliers'?(A.dict.suppliers||[]).length:k==='units'?(A.dict.repairUnits||[]).length:(A.dict.contacts||[]).length;
  const panels=tabs.map(([k,t])=>{
    const op=!!window.DICT_OPEN[k];
    return '<section class="card" style="margin-bottom:10px;padding:0;overflow:hidden">'
      +'<div onclick="toggleDictPanel(\''+k+'\')" style="display:flex;align-items:center;gap:10px;padding:14px 18px;cursor:pointer;user-select:none;background:var(--bg2,#f8fafc)">'
      +'<span style="font-size:13px;color:var(--muted)">'+(op?'▾':'▸')+'</span><b>'+esc(t)+'</b>'
      +'<span class="badge gray">'+count(k)+' 条</span><span style="flex:1"></span><span class="hint" style="margin:0">'+(op?'点击收起':'点击展开')+'</span></div>'
      +(op?'<div id="dictPanel_'+k+'" style="padding:14px 18px">'+body(k)+'</div>':'')
      +'</section>';
  }).join('');
  $('#page').innerHTML='<div><h2 style="margin:0 0 4px">▤ 信息维护 <span class="badge gray">后台录入 · 前台登记页可直接手动新增</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">四个分类默认折叠，点标题展开；新增 / 删除后可继续操作，不会互相影响。</div>'
    +panels+'</div>';
}
window.toggleDictPanel=key=>{ window.DICT_OPEN=window.DICT_OPEN||{}; window.DICT_OPEN[key]=!window.DICT_OPEN[key]; pageDict(); };
// ================= 信息维护（分页 / 筛选 / 全选 / 批量删除）=================
const DICT_SIZE=10;
window.DICT_STATE=window.DICT_STATE||{};
function dstate(k){return window.DICT_STATE[k]||(window.DICT_STATE[k]={page:1,all:false,q:''});}
function dictNameOf(k,r){
  if(k==='products')return [r.model,r.brand,r.category,r.spec].join(' ');
  if(k==='suppliers')return [r.name,r.code,r.contact_name,r.phone].join(' ');
  if(k==='units')return [r.name,r.contact_name,r.phone].join(' ');
  return [r.name,r.phone,r.company].join(' ');
}
function dictRows(k){
  const all=k==='units'?(A.dict.repairUnits||[]):(A.dict[k]||[]);
  const st=dstate(k),q=(st.q||'').toLowerCase();
  return q?all.filter(r=>String(dictNameOf(k,r)||'').toLowerCase().includes(q)):all;
}
function dictToolbar(k,total,pages,st){
  const ph={products:'筛选型号 / 品牌 / 分类',suppliers:'筛选上家名称 / 编码 / 联系人',units:'筛选单位 / 姓名 / 联系人',contacts:'筛选姓名 / 电话 / 单位'}[k]||'筛选';
  return '<div class="toolbar" style="margin-bottom:8px"><input id="dq_'+k+'" placeholder="'+ph+'" value="'+esc(st.q)+'" style="flex:1;min-width:180px">'
    +'<button class="btn ghost sm" onclick="dictFilter(\''+k+'\')">筛选</button>'
    +'<button class="btn ghost sm" onclick="dictSelectAll(\''+k+'\')">全选</button>'
    +(can('dict:create')?'<button class="btn danger sm" onclick="dictDelSelected(\''+k+'\')">删除选中</button>':'')
    +'</div><div class="toolbar" style="margin-top:6px"><span class="hint">共 '+total+' 条 · 最新 '+DICT_SIZE+' 条 · 第 '+st.page+'/'+pages+' 页</span><div class="spacer"></div>'
    +'<button class="btn ghost sm" onclick="dictPage(\''+k+'\',-1)">上一页</button><button class="btn ghost sm" onclick="dictPage(\''+k+'\',1)">下一页</button>'
    +'<button class="btn ghost sm" onclick="dictToggleAll(\''+k+'\')">'+(st.all?'分页显示':'全部显示')+'</button></div>';
}
window.dictFilter=k=>{const i=$('#dq_'+k);dstate(k).q=i?i.value.trim():'';dstate(k).page=1;pageDict();};
window.dictPage=(k,d)=>{const s=dstate(k);s.page=Math.max(1,s.page+d);s.all=false;pageDict();};
window.dictToggleAll=k=>{const s=dstate(k);s.all=!s.all;s.page=1;pageDict();};
window.dictSelectAll=k=>{$$('.dsel[data-k="'+k+'"]').forEach(c=>c.checked=true);toast('已全选当前页','ok');};
window.dictDelSelected=async k=>{
  const ids=$$('.dsel[data-k="'+k+'"]:checked').map(c=>Number(c.value));
  if(!ids.length){toast('请先勾选','warn');return;}
  if(!confirm('确定删除选中的 '+ids.length+' 条？历史登记不受影响。'))return;
  const ep=k==='units'?'repair-units':k;
  for(const id of ids)await api('/api/dict/'+ep+'/'+id,{method:'DELETE'});
  toast('已删除 '+ids.length+' 条','ok');A.dict=await api('/api/dict');pageDict();
};
function dictTable(key,heads,rows,mapper,label){
  const st=dstate(key),all=dictRows(key),pages=Math.max(1,Math.ceil(all.length/DICT_SIZE));
  if(st.page>pages)st.page=pages;
  const view=st.all?all:all.slice((st.page-1)*DICT_SIZE,st.page*DICT_SIZE);
  const addBtn=can('dict:create')||can('dict:*')?'<button class="btn" onclick="addDict(\''+key+'\')">＋ 新增'+label+'</button>':'';
  const body=view.map(r=>'<tr><td><input type="checkbox" class="dsel" data-k="'+key+'" value="'+r.id+'" style="width:auto"></td>'
    +mapper(r).map(x=>'<td>'+esc(x||'—')+'</td>').join('')
    +'<td style="white-space:nowrap"><button class="btn ghost sm" onclick="editDict(\''+key+'\','+r.id+')">编辑</button> <button class="btn ghost sm" onclick="delDict(\''+key+'\','+r.id+')">删除</button></td></tr>').join('');
  return addBtn+dictToolbar(key,all.length,pages,st)
    +'<div class="tbl-wrap"><table><thead><tr><th><input type="checkbox" style="width:auto" onchange="dictToggleAllBox(\''+key+'\',this)"></th>'+heads.map(h=>'<th>'+h+'</th>').join('')+'<th>操作</th></tr></thead><tbody>'
    +(body||'<tr><td colspan="'+(heads.length+2)+'"><div class="empty">暂无数据</div></td></tr>')+'</tbody></table></div>';
}
window.dictToggleAllBox=(k,box)=>{$$('.dsel[data-k="'+k+'"]').forEach(c=>c.checked=box.checked);};

window.addDict=key=>{
  const forms={
    products:[['model','型号','req'],['brand','品牌'],['category','分类'],['spec','规格']],
    suppliers:[['name','名称（上家/售后站点）','req'],['code','编码'],['contact_name','联系人'],['phone','电话'],['address','地址'],['express_pref','快递备注'],['remark','备注']],
    units:[['name','单位 / 姓名','req'],['contact_name','联系人'],['phone','电话'],['wechat','微信'],['address','地址'],['remark','备注']],
    contacts:[['name','姓名','req'],['phone','电话'],['wechat','微信'],['email','邮箱'],['company','单位'],['remark','备注']],
  };
  const f=forms[key];
  modal(modalHead('新增'+(key==='products'?'商品型号':key==='suppliers'?'售后站点':'联系方式'))+'<div class="mb"><div class="grid g2">'+f.map(([k,l,r])=>'<div class="field"><label>'+l+(r?' <span class="req">*</span>':'')+'</label><input id="d_'+k+'"></div>').join('')+'</div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveDict(\''+key+'\')">保存</button></div>');
};
window.saveDict=async key=>{
  const b={}; $$('.modal input').forEach(i=>b[i.id.slice(2)]=i.value);
  await api('/api/dict/'+(key==='units'?'repair-units':key),{method:'POST',body:b}); closeModal(); toast('已新增','ok'); pageDict();
};
window.delDict=async(key,id)=>{ if(!confirm('确认删除？该字典项已关联的历史登记不受影响。'))return; await api('/api/dict/'+(key==='units'?'repair-units':key)+'/'+id,{method:'DELETE'}); toast('已删除','ok'); pageDict(); };

const DICT_EDIT_FIELDS={products:[['model','型号'],['brand','品牌'],['category','分类'],['spec','规格'],['active','启用(1/0)']],suppliers:[['name','名称'],['code','编码'],['contact_name','联系人'],['phone','电话'],['address','地址'],['express_pref','快递备注'],['remark','备注'],['active','启用(1/0)']],units:[['name','单位 / 姓名'],['contact_name','联系人'],['phone','电话'],['wechat','微信'],['address','地址'],['remark','备注'],['active','启用(1/0)']],contacts:[['name','姓名'],['phone','电话'],['wechat','微信'],['email','邮箱'],['company','单位'],['remark','备注']]};
window.editDict=(key,id)=>{const r=dictRows(key).find(x=>Number(x.id)===Number(id));if(!r){toast('未找到记录','err');return;}window.__DICT_EDIT={key,id};const f=DICT_EDIT_FIELDS[key]||[];modal(modalHead('编辑信息维护')+'<div class="mb"><div class="grid g2">'+f.map(([k,l])=>'<div class="field"><label>'+l+'</label><input id="ed_'+k+'" value="'+esc(r[k]??'')+'"></div>').join('')+'</div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveEditDict()">保存</button></div>',true);};
window.saveEditDict=async()=>{const x=window.__DICT_EDIT||{};if(!x.key||!x.id){toast('缺少编辑对象','err');return;}const b={};$$( '.modal input' ).forEach(i=>{const k=i.id.slice(3);b[k]=i.value;});if(b.active!==undefined)b.active=(b.active==='1'||b.active==='true'||b.active==='是')?1:0;const ep=x.key==='units'?'repair-units':x.key;await api('/api/dict/'+ep+'/'+x.id,{method:'PUT',body:b});closeModal();toast('已保存','ok');A.dict=await api('/api/dict');pageDict();};
// ================= 后台：人员权限 =================
async function pageUsers(){
  const d=await api('/api/users');
  $('#page').innerHTML='<div class="card"><h2>☰ 人员权限管理</h2><div class="hint" style="margin-bottom:14px">角色权限：'
    +Object.entries(A.roles).map(([k,r])=>'<span class="chip"><b>'+esc(r.label)+'</b> · '+(r.perms.includes('*')?'全部权限':esc(r.perms.map(p=>PERM_LABELS[p]||({ 'record:*':'全部登记权限','dict:*':'全部字典权限','import:*':'全部导入权限','export:*':'全部导出权限','query:*':'全部查询权限','warranty:*':'全部安心保权限','backup:*':'全部备份权限','system:*':'全部系统权限','user:*':'全部人员权限' })[p]||'其他权限').join(' / ')))+'</span>').join('')+'</div>'
    +'<div class="toolbar"><button class="btn" onclick="addUser()">＋ 新增人员</button></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>ID</th><th>账号</th><th>姓名</th><th>角色</th><th>电话 / 邮箱</th><th>状态</th><th>最后登录</th><th>操作</th></tr></thead><tbody>'
    +d.map(u=>'<tr><td>'+u.id+'</td><td><b>'+esc(u.username)+'</b></td><td>'+esc(u.display_name)+'</td><td>'+esc(A.roles[u.role]?.label||u.role)+'</td><td>'+esc(u.phone||'—')+' / '+esc(u.email||'—')+'</td><td>'+(u.active?'<span class="badge ok">启用</span>':'<span class="badge err">停用</span>')+'</td><td>'+(u.last_login_at?new Date(u.last_login_at*1000).toLocaleString('zh-CN'):'—')+'</td><td><button class="btn ghost sm" onclick="editUser('+u.id+')">编辑</button> '+(u.id!==A.user.id?'<button class="btn ghost sm" onclick="delUser('+u.id+')">删除</button>':'')+'</td></tr>').join('')
    +'</tbody></table></div></div>';
}
function userForm(u){
  return '<div class="grid g2">'
    +'<div class="field"><label>账号 <span class="req">*</span></label><input id="u_username" value="'+esc(u?.username||'')+'" '+(u?'disabled':'')+'></div>'
    +'<div class="field"><label>姓名</label><input id="u_display_name" value="'+esc(u?.display_name||'')+'"></div>'
    +'<div class="field"><label>角色</label><select id="u_role">'+Object.entries(A.roles).map(([k,r])=>'<option value="'+k+'" '+(u?.role===k?'selected':'')+'>'+esc(r.label)+'</option>').join('')+'</select></div>'
    +'<div class="field"><label>密码 '+(u?'(留空不改)':'<span class="req">*</span>')+'</label><input id="u_password" type="password" placeholder="至少 8 位"></div>'
    +'<div class="field"><label>电话</label><input id="u_phone" value="'+esc(u?.phone||'')+'"></div>'
    +'<div class="field"><label>邮箱</label><input id="u_email" value="'+esc(u?.email||'')+'"></div>'
    +(u?'<div class="field"><label>状态</label><select id="u_active"><option value="1" '+(u.active?'selected':'')+'>启用</option><option value="0" '+(!u.active?'selected':'')+'>停用</option></select></div>':'')
    +'</div>';
}
window.addUser=()=>modal(modalHead('新增人员')+'<div class="mb">'+userForm(null)+'</div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveUser(null)">创建</button></div>');
window.editUser=async id=>{const us=await api('/api/users');const u=us.find(x=>x.id===id);modal(modalHead('编辑 '+esc(u.username))+'<div class="mb">'+userForm(u)+'</div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveUser('+id+')">保存</button></div>');};
window.saveUser=async id=>{
  const b={display_name:$('#u_display_name').value,role:$('#u_role').value,phone:$('#u_phone').value,email:$('#u_email').value};
  if(!id){b.username=$('#u_username').value;b.password=$('#u_password').value;}
  else {if($('#u_password').value)b.password=$('#u_password').value;b.active=$('#u_active').value==='1';}
  await api(id?'/api/users/'+id:'/api/users',{method:id?'PUT':'POST',body:b});closeModal();toast('已保存','ok');pageUsers();
};
window.delUser=async id=>{if(!confirm('确认删除该人员？'))return;await api('/api/users/'+id,{method:'DELETE'});toast('已删除','ok');pageUsers();};

// ================= 后台：日志 / 设置 =================
async function pageAudit(){
  const d=await api('/api/audit?limit=200');
  const clearBtn=(A.user?.role==='owner')?'<button class="btn danger sm" onclick="clearAudit()">🧹 清空日志</button>':'';
  $('#page').innerHTML='<div class="card"><h2>≡ 操作日志 <span class="badge gray">超级管理员可清空</span></h2><div class="toolbar" style="margin-bottom:10px">'+clearBtn+'</div><div class="tbl-wrap"><table><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>详情</th><th>IP</th></tr></thead><tbody>'
    +d.map(x=>'<tr><td>'+new Date(x.created_at*1000).toLocaleString('zh-CN')+'</td><td>'+esc(x.username||'系统')+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.target)+'</td><td class="muted">'+esc(x.detail)+'</td><td>'+esc(x.ip)+'</td></tr>').join('')
    +'</tbody></table></div></div>';
}
async function pageSettings(){
  const s=await api('/api/settings'), l=A.license;
  $('#page').innerHTML='<div class="grid g1">'
    +'<div class="card"><h2>⚙ 软件设置</h2>'
    +'<div class="field"><label>软件名称（可自行更改，登录后立即生效）</label><input id="s_app_name" value="'+esc(l.app_name||'无忧商服通')+'" maxlength="30"></div>'
    +'<div class="field"><label>副标题</label><input id="s_app_subtitle" value="'+esc(l.app_subtitle||'')+'" maxlength="40"></div>'
    +'<div class="field"><label>登录页说明（可后台修改）</label><input id="s_login_subtitle" value="'+esc((await api(nfUrl('/api/login-brand'),{silent:true})).subtitle||'')+'" maxlength="80" placeholder="如：飞牛 / 群晖 / 绿联 私有部署"></div>'
    +'<div class="field"><label>寄送超期提醒天数</label><input id="s_overdue_days" type="number" min="1" max="365" value="'+(await api('/api/alerts/overdue/days')).days+'"><div class="hint">寄送后超过该天数仍未录入返回信息，任何人员登录后自动弹窗提醒</div></div>'
    +'<div class="field"><label>明细单单位名称（打印在明细单下方小字）</label><input id="s_print_unit" value="'+esc((await api('/api/settings/return-address',{silent:true})).print_unit||l.app_name||'售后管理系统')+'" maxlength="30"><div class="hint">留空则用软件名称；不影响登录页和系统标题。</div></div><div class="field"><label>返回地址（打印在明细单上）</label><textarea id="s_return_addr" placeholder="收件地址 / 公司 / 邮编">'+esc((await api('/api/settings/return-address',{silent:true})).return_address||'')+'</textarea></div>'
    +'<div class="field"><label>返回联系人 / 电话</label><input id="s_return_contact" value="'+esc((await api('/api/settings/return-address',{silent:true})).return_contact||'')+'"></div>'
    +'<div class="field"><label>自定义 Logo（登录页 / 左上角）</label><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img id="s_logo_preview" src="'+(customBrandLogo()||'/logo.png')+'" style="width:56px;height:56px;object-fit:contain;border:1px solid var(--line);border-radius:12px;background:#fff"><input type="file" id="s_logo_file" accept="image/png,image/jpeg,image/webp" style="flex:1;min-width:180px"><button class="btn ghost sm" onclick="clearCustomLogo()">恢复默认</button></div><div class="hint">建议正方形 PNG / JPG，不超过 200KB；上传后随「保存设置」一起生效，图片异常时自动使用内置图标。</div></div>'
    +'<button class="btn" onclick="saveBrand()">保存设置</button>'
    +'<div class="sep"></div><h3>系统信息</h3><div style="line-height:2.1;font-size:13px">'
    +'<b>版本</b> 云端版 1.0<br><b>数据</b> Supabase 云端存储</div></div>';
  bindLogoUpload(); window.__CUSTOM_LOGO=undefined;
}
window.saveBrand=async()=>{
  const lg=window.__CUSTOM_LOGO;
  const extra=lg===undefined?{}:{custom_logo:lg};
  await api('/api/brand',{method:'POST',body:{app_name:$('#s_app_name').value,app_subtitle:$('#s_app_subtitle').value,login_subtitle:$('#s_login_subtitle').value,overdue_days:Number($('#s_overdue_days').value),...extra}}); setBrandTitle($('#s_app_name').value); if(lg!==undefined){setBrandLogo(lg);A.loginBrand={...(A.loginBrand||{}),logo:lg};}
  await api('/api/settings/return-address',{method:'POST',body:{return_address:$('#s_return_addr').value,return_contact:$('#s_return_contact').value,print_unit:$('#s_print_unit').value}});
  A.license=await api('/api/license/status'); renderShell(); navigate('settings'); toast('设置已保存','ok');
};



// ================= 超期提醒弹窗（登录后自动，不限权限）=================
window.checkOverdueAlert=async(force=false)=>{
  if(!A.user) return;
  // 今日不再提醒（按本地日期，手动点「查看超期明细」仍可强制查看）
  const today=new Date().toISOString().slice(0,10);
  if(!force && localStorage.getItem('wuyou_overdue_mute')===today) return;
  let d; try{ d=await api(nfUrl('/api/alerts/overdue'),{silent:true}); }catch{return;}
  const open=d.open_rows||d.rows||[];
  if(!open.length && !force) return;
  const rows=open.slice(0,50).map(x=>'<div class="alert-item"><b>'+esc(x.record_no)+'</b> · '+esc(x.supplier_name)+' · '+esc(x.product_model)
    +'<br>登记 '+fmtDate(x.record_date)+' · <b style="color:var(--err)">已 '+Math.max(0,Math.floor(Number(x.span??x.days??0)||0))+' 天</b> 未返回 · '+statusPill(x.status)
    +'<br><span class="muted">'+esc(x.repair_unit||'')+' '+esc(x.contact_phone||'')+' '+serialList(x.serials).slice(0,3).map(s=>esc(s)).join(' / ')+'</span></div>').join('');
  const lateTip=(d.late_total?'<div class="hint" style="margin-top:8px">另有 '+d.late_total+' 条历史单据是「超过 '+d.days+' 天才返回」，仅用于在对账时查看，不在此提醒。</div>':'');
  const html='<div class="mh"><b>⚠ 寄送超期提醒</b><button class="x" onclick="closeModal()">×</button></div>'
    +'<div class="mb" style="padding:18px 22px"><div class="hint" style="margin-bottom:12px">以下单据寄出后<strong>超过 '+d.days+' 天</strong>仍未录入返回信息，共 <strong>'+open.length+'</strong> 条。请及时跟进上家 / 售后站点。</div>'
    +(rows||'<div class="empty">暂无超期未返回单据</div>')
    +(open.length>50?'<div class="hint">仅显示前 50 条，可在「精准查询」按日期筛选查看全部。</div>':'')
    +lateTip
    +'</div><div class="mf"><button class="btn ghost" onclick="muteOverdueToday()">今日不再提醒</button><button class="btn ghost" onclick="closeModal()">知道了</button><button class="btn ghost" onclick="closeModal();navigate(\'quick\')">去快速返修录入</button><button class="btn" onclick="closeModal();navigate(\'query\')">查看全部登记</button></div>';
  $('#modal-root').innerHTML='<div class="mask"><div class="modal alert-modal">'+html+'</div></div>';
};
window.muteOverdueToday=()=>{ localStorage.setItem('wuyou_overdue_mute',new Date().toISOString().slice(0,10)); closeModal(); toast('今日不再提醒超期','ok'); };
window.showOverdueAlert=()=>checkOverdueAlert(true);

// ================= 返修回来快速录入（扫码枪 / 客户信息）=================
let QUICK={items:[],scanned:new Set()};
let QUICK_SUGGEST=[];
let QUICK_SUGGEST_REQ=0;
const QUICK_DONE=['已返回','已换新','已报废','已取消'];
const isQuickOpen=r=>r&&!QUICK_DONE.includes(String(r.status||'').trim())&&!String(r.return_date||'').trim();
function renderQuickSuggest(rows){
  QUICK_SUGGEST=rows||[];
  const box=$('#qk_suggest'); if(!box)return;
  box.innerHTML=QUICK_SUGGEST.length?QUICK_SUGGEST.map(x=>{
    const id=esc(x.id||''), sn=esc(x.serial||''), label=esc(x.display_serial||x.serial||'（无序列号）');
    const match=esc(x.matched_by||'单据定位');
    const note=esc(x.remark||'');
    return '<div class="suggest-item" onclick="quickCandidateClick(event,this)" data-id="'+id+'" data-sn="'+sn+'" data-match="'+match+'"><b style="pointer-events:none">'+label+'</b> <span class="muted" style="pointer-events:none">'+esc(x.record_no||'')+' · '+esc(x.product_model||'')+' · '+esc(x.supplier_name||'—')+(x.sale_date?' · 销售日期：'+esc(String(x.sale_date).slice(0,10)):'')+(NEWFLOW?'<br><b style="color:#1d4ed8;pointer-events:none">状态/维保：'+esc(x.maintenance_mode||x.status||'')+(String(x.status||'')==='自维保'?'（自维保）':'')+'</b>':'')+'<br>客户：'+esc(x.repair_unit||'—')+' · 联系人：'+esc(x.contact_name||'—')+' · 电话：'+esc(x.contact_phone||'—')+(NEWFLOW&&(x.customer_inbound_no||x.express_no||x.express_company||x.merchant_note)?'<br><span style="color:#0f766e;pointer-events:none">客户寄来：'+esc(x.customer_inbound_no||'—')+(x.express_no?' · 快递单号：'+esc(x.express_no):'')+(x.express_company?' · 快递公司：'+esc(x.express_company):'')+(x.merchant_note?' · 寄商家备注：'+esc(x.merchant_note):'')+'</span>':'')+(note?'<br><span style="color:#9a3412;pointer-events:none"><b>内部备注：</b>'+note+'</span>':'')+'</span></div>';
  }).join(''):'<div class="suggest-empty">没有匹配的未返回单据，可输入客户、联系人、电话或单号再试</div>';
}
async function loadQuickSuggest(q=''){
  const req=++QUICK_SUGGEST_REQ;
  try{const p=await api(nfUrl('/api/quick-return/pending?q='+encodeURIComponent(q)+'&limit=500&_='+Date.now()),{silent:true});if(req!==QUICK_SUGGEST_REQ)return QUICK_SUGGEST;renderQuickSuggest(p.rows||[]);return QUICK_SUGGEST;}
  catch{if(req!==QUICK_SUGGEST_REQ)return QUICK_SUGGEST;renderQuickSuggest([]);return [];}
}
window.loadQuickSuggest=loadQuickSuggest;
window.quickCandidateClick=(e,el)=>{const item=el||e.target.closest('.suggest-item');if(!item)return;const id=Number(item.dataset.id);if(!id)return;const x=QUICK_SUGGEST.find(v=>Number(v.id)===id)||{};addQuickRecord(id,String(item.dataset.sn||x.serial||''),String(item.dataset.match||x.matched_by||'单据定位')).then(()=>{const inp=$('#qk_serial');if(inp){inp.value='';loadQuickSuggest('');inp.focus();}});};
window.pickQuickCandidate=async(id,sn,match)=>{
  id=Number(id); if(!id)return;
  QUICK_SUGGEST_REQ++; // 阻止点击前的最后一次联想请求覆盖当前选择
  const x=QUICK_SUGGEST.find(v=>Number(v.id)===id)||{id,serial:sn||'',matched_by:match||'单据定位'};
  await addQuickRecord(id,String(x.serial||sn||''),String(x.matched_by||match||'单据定位'));
  const inp=$('#qk_serial');if(inp){inp.value='';await loadQuickSuggest('');inp.focus();}
};
async function addQuickRecord(id,serial='',matchedBy='单据定位'){
  id=Number(id);if(!id)return;
  if(QUICK.items.some(x=>x.id===id)){toast('该单据已在列表','warn');return;}
  const detail=await api(nfUrl('/api/quick-return/record/'+encodeURIComponent(id)+'?_='+Date.now()),{silent:true}).catch(()=>null);
  const rec=detail&&detail.ok?detail.row:null;
  if(!rec||rec.error||!rec.id){toast('单据不存在或已无权限查看','err');return;}
  QUICK.scanned.add('id:'+id);
  QUICK.items.push({id,serial:String(serial||'').trim()||'（无序列号）',rec,matched_by:matchedBy||'单据定位'});
  renderQuick();toast('已定位 '+rec.record_no,'ok');
}
window.addQuickRecord=addQuickRecord;
window.addQuickSerial=async v=>{
  v=String(v||'').trim();if(!v)return;
  const res=await api(nfUrl('/api/quick-return/lookup?serial='+encodeURIComponent(v)+'&_='+Date.now()),{silent:true}).catch(()=>null);
  if(!res||!res.ok){toast((res&&res.reason)||'未找到该序列号','err');return;}
  const open=(res.rows||[]).filter(isQuickOpen);
  if(!open.length){toast('未找到该序列号对应的未返回登记','err');return;}
  if(open.length>1){
    const rows=open.map(r=>({...r,id:r.id,serial:v,matched_by:res.matched_by||'原序列号'}));
    renderQuickSuggest(rows);toast('该序列号对应多张未返回单，请点选具体单据','warn');return;
  }
  await addQuickRecord(open[0].id,v,res.matched_by||'原序列号');
};
async function pageQuick(){
  QUICK={items:[],scanned:new Set()};QUICK_SUGGEST=[];
  $('#page').innerHTML='<div class="card"><h2>↩ 返回录入 <span class="badge gray">扫码枪 / 客户信息均可定位</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">输入序列号、单号、上家、型号、送修单位 / 客户、联系人或电话片段；没有序列号的设备也能按客户信息找到。点候选或按 Enter 加入待确认，确认后自动填返回日期、状态与返回快递单号。</div>'
    +'<div class="grid g3"><div class="field"><label>返回快递单号（可先填，之后所有扫码单共用）</label><input id="qk_tracking" placeholder="如 SF123456"></div>'
    +'<div class="field"><label>返回状态</label><select id="qk_status"><option>已返回</option>'+(NEWFLOW?'':'<option>已换新</option>')+'</select></div>'
    +'<div class="field"><label>返回日期</label><input type="text" id="qk_date" value="'+nowLocal()+'" placeholder="自动填当前日期时间，可手动改"></div></div>'
    +'<div class="field scan-box"><label>扫描 / 输入序列号或客户信息（原机、换新机、无序列号均可）</label><input id="qk_serial" autocomplete="off" placeholder="序列号 / 单号 / 上家 / 客户 / 联系人 / 电话片段；下方自动列出未返回候选"><div id="qk_suggest" class="suggest-box"></div><div class="scan-hint"><span class="scan-live">● 已寄送未返回单据联想</span> 候选带单号与客户信息，点具体单据或按 <span class="kbd">Enter</span> 加入待确认列表</div></div>'
    +'<div class="sep"></div><h3>待确认单据 <span class="badge" id="qk_count">0</span></h3><div id="qk_list"><div class="empty">还没有扫码，搜一个客户或点一个候选试试</div></div>'
    +'<div class="save-bar"><span class="hint" id="qk_summary">扫描或选中候选后点「全部确认返回」即完成录入</span><div class="spacer"></div><button class="btn ghost" onclick="clearQuick()">清空</button><button class="btn" onclick="commitQuick()">✔ 全部确认返回</button></div></div>';
  const inp=$('#qk_serial');inp.focus();await loadQuickSuggest('');
  let timer=null;
  const onQuickInput=()=>{clearTimeout(timer);const q=inp.value.trim();timer=setTimeout(()=>loadQuickSuggest(q),150);};
  inp.oninput=onQuickInput;inp.addEventListener('input',onQuickInput);
  inp.onkeydown=async e=>{
    if(e.key!=='Enter')return;e.preventDefault();
    const v=inp.value.trim();if(!v)return;
    const rows=await loadQuickSuggest(v);
    if(rows.length){const x=rows[0];await addQuickRecord(Number(x.id),String(x.serial||''),String(x.matched_by||'单据定位'));}
    else await addQuickSerial(v);
    inp.value='';await loadQuickSuggest('');inp.focus();
  };
}
window.removeQuick=i=>{const x=QUICK.items[i];if(x){QUICK.scanned.delete('id:'+x.id);QUICK.items.splice(i,1);renderQuick();}};
function renderQuick(){
  $('#qk_count').textContent=QUICK.items.length;
  $('#qk_summary').textContent=QUICK.items.length?('共 '+QUICK.items.length+' 单待确认，点右侧按钮一次性录入'):'扫描或选中候选后点「全部确认返回」即完成录入';
  $('#qk_list').innerHTML=QUICK.items.length?QUICK.items.map((x,i)=>'<div class="quick-item" id="qi_'+i+'"><span class="badge '+(x.matched_by==='换新序列号'?'test':'ok')+'">'+(x.matched_by==='换新序列号'?'换新机定位':'已定位')+'</span><div class="info"><b>'+esc(x.rec.record_no)+'</b> · '+esc(x.rec.product_model)+' · '+esc(x.rec.supplier_name)+(x.rec.sale_date?' · 销售日期：'+esc(String(x.rec.sale_date).slice(0,10)):'')+'<br><span class="muted"><b>序列号（RAM）：</b>'+serialList(x.rec.serials).map(v=>'<span class="sn">'+esc(v)+'</span>').join('')+' · 定位 '+esc(x.serial)+' · 原状态 '+esc(x.rec.status)+'</span>'
    +'<br><span class="muted" style="color:#0f766e"><b>送修单位 / 客户：</b>'+esc(x.rec.repair_unit||'—')+' · <b>联系人：</b>'+esc(x.rec.contact_name||'—')+' · <b>联系方式：</b>'+esc(x.rec.contact_phone||'—')+'</span>'
     +(x.rec.remark?'<br><span class="muted" style="color:#9a3412"><b>内部备注：</b>'+esc(x.rec.remark)+'</span>':'')
     +'</div>'
    +'<input id="qi_sn_'+i+'" placeholder="仅换新时填新序列号" style="width:170px" value="">'
    +'<label style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:12px;margin:0 6px"><input type="checkbox" id="qi_ex_'+i+'" style="width:auto" '+(x.matched_by==='换新序列号'||x.rec.is_exchange?'checked':'')+'>本单为换新</label>'
    +'<button class="btn ghost sm" onclick="removeQuick('+i+')">移除</button></div>').join(''):'<div class="empty">还没有扫码，搜一个客户或点一个候选试试</div>';
}
window.clearQuick=()=>{QUICK={items:[],scanned:new Set()};QUICK_SUGGEST=[];const q=$('#qk_serial');if(q)q.value='';const sg=$('#qk_suggest');if(sg)sg.innerHTML='';toast('已清空待确认列表','ok');pageQuick();};
window.commitQuick=async()=>{
  if(!QUICK.items.length){toast('请先选择要返回的单据','warn');return;}
  const common={status:$('#qk_status').value,return_date:$('#qk_date').value,tracking_back:$('#qk_tracking').value};
  const items=QUICK.items.map((x,i)=>{const o={id:x.id,serial:x.serial==='（无序列号）'?'':x.serial,...common,exchange_serial:$('#qi_sn_'+i)?.value||'',is_exchange:!!$('#qi_ex_'+i)?.checked};
    if(o.is_exchange||x.matched_by==='换新序列号'||o.exchange_serial){o.is_exchange=true;o.status='已换新';o.exchange_serial=o.exchange_serial||x.serial;}
    else {o.is_exchange=false;o.exchange_serial='';}
    return o;});
  if(NEWFLOW)items.forEach(o=>{o.is_exchange=false;o.exchange_serial='';o.status='已返回';});
  const r=await api(nfUrl('/api/quick-return'),{method:'POST',body:{items}});
  toast('已完成 '+r.updated+' 单返修录入','ok');invalidateCache();
  QUICK={items:[],scanned:new Set()};QUICK_SUGGEST=[];pageQuick();toast('已完成，可继续录入','ok');
};

// ================= 集中归纳 =================
let GROUP_TAB='supplier';
async function pageGroups(){
  const d=await api('/api/groups/matrix');
  const s=await api('/api/groups?type=supplier'), u=await api('/api/groups?type=unit');
  $('#page').innerHTML='<div class="card"><h2>▣ 集中归纳 <span class="badge gray">同一上家 / 送修单位自动汇总</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">按「寄送上家 / 售后站点」与「送修单位」两级归类，数据由数据库聚合计算，数据量大也不会拉全表、打开依然快。点分组可展开二级明细。</div>'
    +'<div class="grid g4" style="margin-bottom:16px">'+[['上家 / 售后站点',s.total_groups],['送修单位',u.total_groups],['登记总数',s.groups.reduce((a,x)=>a+x.total,0)],['在修未返回',s.groups.reduce((a,x)=>a+x.pending,0)]].map(([k,v])=>'<div class="stat"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('')+'</div>'
    +'<div class="tabs"><div class="tab '+(GROUP_TAB==='supplier'?'on':'')+'" onclick="switchGroup(\'supplier\')">按上家 / 售后站点</div><div class="tab '+(GROUP_TAB==='unit'?'on':'')+'" onclick="switchGroup(\'unit\')">按送修单位</div><div class="tab '+(GROUP_TAB==='matrix'?'on':'')+'" onclick="switchGroup(\'matrix\')">两级交叉归纳</div></div>'
    +'<div id="groupBody">'+groupBody(GROUP_TAB,s,u,d)+'</div></div>';
}
function groupBody(tab,s,u,m){
  const cards=(arr)=>arr.length?arr.map(x=>'<div class="group-card"><div class="group-head"><span>▤ '+esc(x.name)+'</span><span class="cnt">共 '+x.total+' 单 · 在修 '+x.pending+' · 已完成 '+x.done+' · 换新 '+x.exchange+' · '+fmtDate(x.first_date)+' ~ '+fmtDate(x.last_date)+'</span></div></div>').join(''):'<div class="empty">暂无数据</div>';
  if(tab==='supplier') return cards(s.groups);
  if(tab==='unit') return cards(u.groups);
  return m.groups.length?m.groups.map((g,i)=>'<div class="group-card" id="gc_'+i+'"><div class="group-head" onclick="document.getElementById(\'gc_'+i+'\').classList.toggle(\'open\')"><span>▤ '+esc(g.name)+'</span><span class="cnt">共 '+g.total+' 单 · 在修 '+g.pending+' · '+g.units.length+' 个送修单位 ▾</span></div><div class="group-units">'
    +g.units.map(x=>'<div class="unit"><span>└ '+esc(x.name)+'</span><span>'+x.total+' 单 · 在修 '+x.pending+'</span></div>').join('')+'</div></div>').join(''):'<div class="empty">暂无数据</div>';
}
window.switchGroup=k=>{GROUP_TAB=k;pageGroups();};

// ================= 定时备份（仅 owner 可见）=================
// ================= 云端数据备份（整机 JSON，可下载 / 可恢复）=================
async function pageBackups(){
  $('#page').innerHTML='<div class="card"><h2>⛁ 云端数据备份 <span class="badge gray">整机 JSON</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">数据托管在 Supabase。下载的「整机备份 JSON」包含售后登记、字典、用户、设置、安心保报修、报价商品与渠道账号；可在本云端恢复，也可拿到本地 NAS 版整机恢复。</div>'
    +'<div class="toolbar"><button class="btn" onclick="cloudDownloadBackup()">⇩ 下载整机备份</button><button class="btn ghost" onclick="document.getElementById(&quot;cb_import&quot;).click()">⇪ 导入整机备份 JSON</button><input type="file" id="cb_import" accept=".json,application/json" style="display:none"></div>'
    +'<div id="cbMsg" class="hint" style="margin-top:12px"></div>'
    +'<div class="sep"></div><h3>使用说明</h3><div class="hint">云端不需要 NAS 目录、不需要定时备份。恢复会覆盖当前云端业务数据；恢复前建议先点「下载整机备份」留底。整机 JSON 与 NAS 版互通。</div></div>';
  setTimeout(()=>{const f=$('#cb_import');if(f)f.onchange=cloudImportBackup;},0);
}
window.cloudDownloadBackup=()=>{ const m=$('#cbMsg'); if(m)m.textContent='正在生成整机备份，浏览器将开始下载…'; location.href='/api/export?format=json'; setTimeout(()=>{const x=$('#cbMsg');if(x)x.textContent='✅ 已开始下载整机备份 JSON（若浏览器拦截下载，请允许本站下载）';},1200); toast('正在下载整机备份','ok'); };
window.cloudImportBackup=async()=>{
  const f=$('#cb_import'),m=$('#cbMsg');
  if(!f||!f.files.length){toast('请先选择备份 JSON','warn');return;}
  if(!confirm('整机恢复会覆盖当前云端业务数据（含售后单、报价、报修、安心保）。确定继续？'))return;
  m.textContent='正在读取并恢复…';m.style.color='';
  try{
    const j=JSON.parse(await f.files[0].text());
    const r=await api('/api/backups/restore-json',{method:'POST',body:j});
    if(!r||r.ok===false){m.style.color='var(--err,#dc2626)';m.textContent='❌ 恢复失败：'+(r?.reason||'未知错误');toast(r?.reason||'恢复失败','err');return;}
    m.style.color='var(--ok,#059669)';m.textContent='✅ 恢复完成：'+r.tables+' 张表、共 '+Object.values(r.counts||{}).reduce((a,b)=>a+b,0)+' 条记录。页面即将刷新。';
    toast('整机数据已恢复','ok');setTimeout(()=>location.reload(),1400);
  }catch(e){m.style.color='var(--err,#dc2626)';m.textContent='❌ 文件不是有效 JSON：'+e.message;toast('文件格式错误','err');}
};

// ================= 激活 / 到期弹窗（二维码仅在此展示）=================
function contactHtml(c){
  const rows=(c.list||[]).map(x=>[x.label,x.value]).filter(x=>x[1]);
  return rows.map(([k,v])=>'<div><b>'+esc(k)+'：</b>'+esc(v)+'</div>').join('')||'<div class="muted">'+esc(c.note||'请联系作者获取激活码')+'</div>';
}
function payBody(s,forcePreview=false){
  const c=s.contact||{};
  const qr=c.wechat_qr?'<img class="qr" src="'+esc(c.wechat_qr)+'" alt="收款二维码">':'<div class="qr-ph">联系二维码已内置</div>';
  const badge=forcePreview?'预览模式 · 15 天试用已到期':(s.test_device?'已授权':'免费试用 '+(s.trial_expired?'已到期':'剩余 '+s.trial_left+' 天'));
  const title='一次性买断，永久使用';
  const warn=(forcePreview||(s.trial_expired&&!s.test_device))?'<div class="hint" style="color:var(--err)">试用期已结束，软件进入只读保护（可查询 / 导出，不可新增修改），输入激活码后立即恢复全部功能，已有数据不会丢失。</div>':'';
  return '<div class="mh"><b>'+(forcePreview?'到期弹窗预览':'软件授权激活')+'</b><button class="x" onclick="closeModal()">×</button></div>'
    +'<div class="mb"><div class="badge '+(forcePreview?'err':'warn')+'">'+badge+'</div>'
    +'<h2 style="margin:14px 0 2px;font-size:18px">'+title+'</h2>'
    +'<div class="price">¥'+s.price+' <small>一次付费 · 后续所有版本免费升级</small></div>'
    +warn+qr+'<div class="contacts">'+contactHtml(c)+'</div>'+(c.note?'<div class="hint">'+esc(c.note)+'</div>':'')
    +'<div class="sep"></div><div class="field" style="text-align:left"><label>输入激活码（购买后由作者发放）</label><textarea class="lic-input" id="licCode" placeholder="粘贴 XXXXX-XXXXX-... 格式的激活码"></textarea></div>'
    +'<div class="fp">机器码：'+esc(s.device_fingerprint)+'<br><span class="hint">把这串发给作者换激活码；粘贴激活码即可离线激活，通用码首次激活自动绑定本实例</span></div>'
    +'</div><div class="mf"><button class="btn ghost" onclick="closeModal()">'+(forcePreview?'关闭预览':'稍后再说')+'</button>'
    +(s.test_device?'<button class="btn ghost" onclick="fillTestCode()">填入测试码</button>':'')
    +'<button class="btn" onclick="doActivate()">立即激活</button></div>';
}
window.showPayModal=async(forcePreview=false)=>{
  let s; try{ s=await api('/api/license/status'); }catch{return;}
  // 实时拉取发卡后台配置：后台一改，用户刷新/重开弹窗即看到最新二维码与联系方式，无需重装或拉镜像
  try{ const cfg=await fetch('/api/license/contact',{cache:'no-store'}).then(r=>r.json());
    const c=cfg||{};
    if(c.wechat_qr||c.wechat||c.phone||c.email||c.shop||c.note){
      s.contact=Object.assign({},s.contact,{wechat_qr:c.wechat_qr||s.contact?.wechat_qr||'/qr.png',
        list:[{label:'微信号',value:c.wechat||''},{label:'手机号',value:c.phone||''},{label:'邮箱',value:c.email||''},{label:'店铺 / 其它',value:c.shop||''},{label:'QQ',value:'435675554'}].filter(x=>x.value),
        note:c.note||s.contact?.note||''});
    }
  }catch(e){}
  A.license=s;
  if(forcePreview) s={...s,trial_expired:true,test_device:false,readonly:true};
  modalPay(payBody(s,forcePreview));
};
window.previewExpired=()=>showPayModal(true);
window.fillTestCode=async()=>{
  try{ const t=await fetch('/api/license/test-code').then(r=>r.json()); if(t.code) $('#licCode').value=t.code; else toast('请读取 deploy/keys/TEST-LICENSE.txt','warn'); }catch{ toast('请读取 deploy/keys/TEST-LICENSE.txt','warn'); }
};
window.doActivate=async()=>{
  const code=$('#licCode').value.trim(); if(!code){toast('请先输入激活码','warn');return;}
  try{ const r=await api('/api/license/activate',{method:'POST',body:{code}}); A.license=r.status; closeModal(); toast('激活成功：'+r.reason,'ok'); renderShell(); navigate(A.route); }catch{}
};
// 只读授权信息：不含二维码、联系方式、上传，仅状态 + 设备指纹（用户发码时用）
window.showLicenseInfo=async()=>{
  let s=A.license; try{ s=(await api(nfUrl('/api/license/status'),{silent:true}))||A.license; A.license=s; }catch{}
  let c={list:[{label:'QQ',value:'435675554'}],wechat_qr:'/qr.png',note:'购买 / 激活 / 换设备请联系作者'};
  try{ const r=await fetch('/api/license/contact',{cache:'no-store'}).then(x=>x.json()); if(r&&(r.list||r.wechat_qr))c=r; }catch{}
  const rows=(c.list||[]).map(x=>[x.label,x.value]).filter(x=>x[1]).map(([k,v])=>'<div><b>'+esc(k)+'：</b>'+esc(v)+'</div>').join('');
  const qr=c.wechat_qr?'<img class="qr" src="'+esc(c.wechat_qr)+'" alt="联系二维码">':'';
  modalPay('<div class="mh"><b>授权信息与联系方式</b><button class="x" onclick="closeModal()">×</button></div><div class="mb" style="text-align:left;line-height:2">'
  +'<div><b>状态：</b><span class="badge ok">'+(s.activated?(s.license?.test?'已授权':'永久授权'):'未授权（免费试用中）')+'</span></div>'
  +'<div><b>授权类型：</b>一次性买断 ¥'+s.price+'，后续所有版本免费升级</div>'
  +'<div><b>激活时间：</b>'+(s.license?.activated_at?new Date(s.license.activated_at*1000).toLocaleString('zh-CN'):'—')+'</div>'
  +'<div style="margin-top:8px"><b>机器码 / 设备指纹（发给作者换取激活码）</b></div><div class="fp">'+esc(s.device_fingerprint)+'</div>'
  +'<div class="sep"></div><h3 style="margin:0 0 8px">📞 作者联系方式（购买 / 激活 / 换设备）</h3>'+qr+'<div class="contacts">'+rows+'</div>'
  +(c.note?'<div class="hint">'+esc(c.note)+'</div>':'')
  +'<div class="hint">把这串机器码发给作者 → 作者在发码后台生成激活码 → 你粘贴到授权弹窗即可<b>离线激活</b>，无需联网</div>'
  +'</div><div class="mf"><button class="btn ghost" onclick="showPayModal()">输入激活码</button><button class="btn" onclick="closeModal()">知道了</button></div>');};

// ================= 送修单打印（A4 固定版式，可调）=================
let PRINT_CFG={rows_per_page:12,row_height:30,font_size:11,cell_pad:5,fault_max:36,gap:8,paper:'A4',scale:100,show_supplier:true,date_field:'sale_date'};
const PAPER_MM={A4:[210,297],A5:[148,210],Letter:[216,279]};
async function pagePrint(){
  try{ PRINT_CFG=await api(nfUrl('/api/print/settings'),{silent:true}); }catch{}
  const canPrintSet=can('print:settings');
  const c=PRINT_CFG;
  const supOpts='';
  $('#page').innerHTML='<div class="card print-controls"><h2>🖨 明细单（可打印）</h2>'
     +(NEWFLOW?'<div class="hint" style="margin-bottom:14px">打印明细：默认列出已送修到上家的单据；寄商家备注只显示给上家的备注，客户寄来单号与发往上家单号独立显示。</div>':'<div class="hint" style="margin-bottom:14px">打印明细：一个日期区间，匹配「登记日期」或「返回日期」任一即可；留空查全部。选「已返回」自动包含「已换新」。</div>')
     +'<div class="grid g4" style="margin-top:6px"><div class="field"><label>打印范围</label><select id="pr_scope"><option value="batch" selected>本次送修明细（默认）</option><option value="all">全部明细 / 历史补打</option></select></div><div class="field"><label>提示</label><div class="hint" style="padding-top:8px">默认只打印最新未打印批次；要查全部或补打旧单请选择「全部明细」。</div></div></div>'
     +'<div class="grid g4"><div class="field"><label>寄送上家（可手动输入）</label><input id="pr_sup" list="dl_pr_sup" placeholder="留空=全部；可手输任意上家"><datalist id="dl_pr_sup">'+A.dict.suppliers.map(x=>'<option value="'+esc(x.name)+'">').join('')+'</datalist></div>'
    +'<div class="field"><label>日期从（登记/返回，留空=全部）</label><div style="display:flex;gap:5px"><input type="text" id="pr_from" placeholder="留空查全部" style="flex:1"><input type="date" id="pr_from_pick" style="position:absolute;width:1px;opacity:0" onchange="setDateFromPick(\'pr_from\')"><button type="button" class="btn ghost sm" onclick="openDatePick(\'pr_from\')">📅</button><button type="button" class="btn ghost sm" onclick="clearDate(\'pr_from\')">✕</button></div></div>'
    +'<div class="field"><label>到（留空=全部）</label><div style="display:flex;gap:5px"><input type="text" id="pr_to" placeholder="留空查全部" style="flex:1"><input type="date" id="pr_to_pick" style="position:absolute;width:1px;opacity:0" onchange="setDateFromPick(\'pr_to\')"><button type="button" class="btn ghost sm" onclick="openDatePick(\'pr_to\')">📅</button><button type="button" class="btn ghost sm" onclick="clearDate(\'pr_to\')">✕</button></div></div>'
    +'<div class="field"><label>&nbsp;</label><div class="toolbar" style="margin:0"><button class="btn" onclick="loadPrint()">生成明细单</button><button class="btn ghost" onclick="clearPrintDates()">清空日期</button><button class="btn ghost" onclick="printPreview()">🖨 打印</button></div></div></div>'
     +(NEWFLOW?'<div class="grid g4" style="margin-top:6px"><div class="field"><label>维修进度</label><select id="pr_status"><option value="">全部</option><option>已收件</option><option selected>已送修</option><option>自维保</option><option>待返回</option><option>已返回</option></select></div>':('<div class="grid g4" style="margin-top:6px"><div class="field"><label>维修进度</label><select id="pr_status"><option value="">全部</option>'+A.statuses.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></div>'))
    +'<div class="field"><label>明细排序（按登记日期）</label><select id="pr_order" onchange="loadPrint()"><option value="desc">新 → 旧</option><option value="asc">旧 → 新</option></select></div></div>'
     +'<details class="print-settings"><summary>排版微调'+(canPrintSet?'（自动保存）':'（仅管理员可修改）')+' <span class="hint">点击展开</span></summary>'
    +'<div class="grid g4">'
    +[['rows_per_page','每页行数',4,30],['row_height','行高 px',20,60],['font_size','字号 px',8,16],['cell_pad','单元格内距 px',2,12],['fault_max','故障最多字数',10,200],['gap','行间距 px',0,24],['scale','缩放 %',60,140]].map(([k,l,mi,ma])=>'<div class="field"><label>'+l+'</label><input type="number" id="pc_'+k+'" min="'+mi+'" max="'+ma+'" value="'+c[k]+'" onchange="savePrintCfg()" '+(canPrintSet?'':'disabled')+'></div>').join('')
    +'<div class="field"><label>纸张</label><select id="pc_paper" onchange="savePrintCfg()" '+(canPrintSet?'':'disabled')+'>'+Object.keys(PAPER_MM).map(k=>'<option '+(c.paper===k?'selected':'')+'>'+k+'</option>').join('')+'</select></div>'
    +'<div class="field"><label>日期列</label><select id="pc_date_field" onchange="savePrintCfg()" '+(canPrintSet?'':'disabled')+'><option value="sale_date" '+(c.date_field==='sale_date'?'selected':'')+'>销售日期</option><option value="record_date" '+(c.date_field==='record_date'?'selected':'')+'>登记日期</option></select></div>'
    +'<div class="field"><label>标题显示上家名称</label><select id="pc_show_supplier" onchange="savePrintCfg()" '+(canPrintSet?'':'disabled')+'><option value="0" '+(!c.show_supplier?'selected':'')+'>不显示</option><option value="1" '+(c.show_supplier?'selected':'')+'>显示</option></select></div>'
    +'</div></details>'
    +'<div id="pr_body"><div class="empty">点「生成明细单」预览</div>';
  try{window.bindPrintScope()}catch{}
}
window.savePrintCfg=async()=>{
  const b={}; ['rows_per_page','row_height','font_size','cell_pad','fault_max','gap','scale'].forEach(k=>b[k]=Number($('#pc_'+k).value));
  b.paper=$('#pc_paper').value; b.date_field=$('#pc_date_field').value; b.show_supplier=$('#pc_show_supplier').value==='1';
  try{ const r=await api('/api/print/settings',{method:'POST',body:b}); PRINT_CFG=r.settings||r; invalidateCache(); PRINT_CFG=await api('/api/print/settings?_t='+Date.now(),{silent:true}); toast('排版已保存','ok'); loadPrint(); }catch{}
};
function clipText(v,max){
  const s=String(v||'—').replace(/\s+/g,' ').trim();
  return s.length>max?esc(s.slice(0,max))+'…':esc(s);
}
window.printPreview=function(){const pb=$('#pr_body');if(!pb||!pb.querySelector('.sheet')){toast('请先点「生成明细单」','err');return;}const bi=window.__PRINT_BATCH_INFO||{};const w=window.open('','_blank','width=1000,height=760');if(!w){toast('请允许弹出打印窗口','err');return;}if(bi.scope==='batch'&&bi.batch_no){api(nfUrl('/api/print/mark-printed'),{method:'POST',body:{batch_no:bi.batch_no,record_ids:bi.record_ids},silent:true}).catch(()=>{});}const sheetCss=Array.from(document.querySelectorAll('style')).map(x=>String(x.innerHTML||'')).filter(s=>s.includes('.sheet{')).join('\n');const fix='<style>@page{size:A4 portrait;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important;color:#111!important;overflow:visible!important}#pr_body{display:block!important;visibility:visible!important;width:210mm!important;margin:0!important;padding:0!important}#pr_body *{visibility:visible!important;opacity:1!important;color:#111!important}#pr_body .sheet{display:block!important;width:210mm!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:8mm 10mm!important;box-sizing:border-box!important;background:#fff!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;page-break-after:always!important;break-after:page!important;page-break-inside:avoid!important;break-inside:avoid!important;transform:none!important}#pr_body .sheet:last-child{page-break-after:auto!important;break-after:auto!important}#pr_body .sheet .inner{display:block!important;position:static!important;transform:scale(1)!important;transform-origin:top left!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important}#pr_body .sheet table{display:table!important;width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}#pr_body .sheet th,#pr_body .sheet td{display:table-cell!important;visibility:visible!important;border:1px solid #94a3b8!important;min-width:0!important;overflow:visible!important}#pr_body .sheet th{background:#f1f5f9!important;font-weight:700!important}button,input,select,textarea{display:none!important}</style>';w.document.write('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>明细单打印</title><style>'+sheetCss+'</style>'+fix+'</head><body>'+pb.innerHTML+'</body></html>');w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(e){}},350);};
window.qdtBeforePrint=function(){const pb=document.getElementById('pr_body');if(!pb||!pb.querySelector('.sheet'))return;const holder=document.createElement('div');holder.id='qdt_print_holder';holder.innerHTML=pb.innerHTML;const st=document.createElement('style');st.textContent='@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:#fff;color:#111}body>*{display:none!important}#qdt_print_holder,#qdt_print_holder *{visibility:visible!important;opacity:1!important;color:#111!important}#qdt_print_holder{display:block!important;width:210mm;margin:0;padding:0}#qdt_print_holder .sheet{display:block!important;width:210mm;height:auto;min-height:0;max-height:none;margin:0;padding:8mm 10mm;box-sizing:border-box;background:#fff;border:0;box-shadow:none;overflow:visible;page-break-after:always;break-after:page}#qdt_print_holder .sheet:last-child{page-break-after:auto;break-after:auto}#qdt_print_holder .sheet .inner{display:block!important;transform:none!important;width:100%!important;height:auto!important}#qdt_print_holder .sheet table{display:table!important;width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}#qdt_print_holder .sheet th,#qdt_print_holder .sheet td{display:table-cell!important;border:1px solid #94a3b8!important}#qdt_print_holder .sheet th{background:#f1f5f9!important;font-weight:700!important}button,input,select,textarea{display:none!important}';holder.prepend(st);document.body.appendChild(holder);};
window.qdtAfterPrint=function(){const h=document.getElementById('qdt_print_holder');if(h)h.remove();};
window.addEventListener('beforeprint',window.qdtBeforePrint);window.addEventListener('afterprint',window.qdtAfterPrint);

window.bindPrintScope=function(){const el=document.getElementById('pr_scope');if(!el||el.dataset.batchBound)return;el.dataset.batchBound='1';el.addEventListener('change',()=>{const st=document.getElementById('pr_status');if(st)st.value=el.value==='all'?'':'已送修';});};
window.loadPrint=async()=>{
  const scope=$('#pr_scope')?.value||'batch';const p=new URLSearchParams({scope,supplier_name:$('#pr_sup')?.value||'',date_from:$('#pr_from')?.value||'',date_to:$('#pr_to')?.value||'',status:$('#pr_status')?.value||'',order:$('#pr_order')?.value||'desc'});
  p.set('_t',String(Date.now()));const d=await api(nfUrl('/api/print/packing-slip?'+p.toString()));window.__PRINT_BATCH_INFO={scope,batch_no:d.batch_no||'',record_ids:(d.groups||[]).flatMap(g=>(g.rows||[]).map(r=>Number(r.id)).filter(Boolean))};
  const c=PRINT_CFG, per=c.rows_per_page||12;
  const [pw,ph]=PAPER_MM[c.paper]||PAPER_MM.A4;
  const dateLabel=c.date_field==='sale_date'?'销售日期':'登记日期';
  const showSup=!!c.show_supplier;
  const printCols='<colgroup><col style="width:11%"><col style="width:22%"><col style="width:7%"><col style="width:22%"><col style="width:19%"><col style="width:19%"></colgroup>';
  const printHead='<thead><tr><th>'+dateLabel+'</th><th>产品型号</th><th>数量</th><th>序列号（RAM）</th><th>故障描述</th><th>寄商家备注</th></tr></thead><tbody>';
  const printRows=(r)=>'<tr><td>'+(c.date_field==='sale_date'?fmtDate(r.sale_date):fmtDate(r.record_date))+'</td><td>'+esc(r.product_model)+'</td><td style="white-space:nowrap;text-align:center">'+r.quantity+'</td><td>'+serialList(r.serials).map(s=>esc(s)).join('<br>')+'</td><td class="fault">'+clipText(r.fault_desc,c.fault_max)+'</td><td class="fault">'+clipText(r.merchant_note||'',c.fault_max)+'</td></tr>';
  // 关键：覆盖全局 table{min-width:900px}，并整体缩放，杜绝 A4 溢出
  const css='<style>@page{size:'+c.paper+' portrait;margin:0}'
    +'.sheet{width:'+pw+'mm;height:'+ph+'mm;padding:10mm;box-sizing:border-box;margin:0 auto 12px;background:#fff;border:1px solid #cbd5e1;page-break-after:always;break-after:page;font-size:'+c.font_size+'px;line-height:1.35;overflow:hidden}'
    +'.sheet:last-child{page-break-after:auto;break-after:auto}'
    +'.sheet .inner{transform:scale('+(c.scale/100)+');transform-origin:top left;width:'+(10000/c.scale)+'%;height:'+(10000/c.scale)+'%}'
    +'.sheet h2{font-size:16px;margin:0}.sheet table{min-width:0!important;width:100%!important;table-layout:fixed!important;border-collapse:collapse}'
    +'.sheet th,.sheet td{border:1px solid #94a3b8;padding:'+c.cell_pad+'px;height:'+c.row_height+'px;overflow:hidden!important;word-break:break-all;vertical-align:middle;white-space:normal}'
    +'.sheet th{background:#f1f5f9;font-weight:700}.sheet .fault{overflow:hidden!important}'
    +'.sheet .colgap{margin-top:'+c.gap+'px}</style>';
  // 每个上家单独一页；列：日期 / 产品型号 / 数量 / 序列号 / 故障描述 / 寄商家备注
  const groups=d.groups||[];
  let out=css, pageNo=0;
  const grand=groups.reduce((n,g)=>n+(g.rows||[]).length,0);
  const totalPages=groups.reduce((n,g)=>n+Math.max(1,Math.ceil((g.rows||[]).length/per)),0);
  for(const g of groups){
    const rows=g.rows||[];
    const pages=Math.max(1,Math.ceil(rows.length/per));
    for(let pg=0;pg<pages;pg++){
      pageNo++;
      const slice=rows.slice(pg*per,(pg+1)*per);
      out+='<div class="sheet"><div class="inner">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:10px"><div><h2>明细单'+(showSup?' · '+esc(g.supplier||'未分类')+'（售后收）':'')+'</h2><div style="color:#64748b">'+esc(d.company||printBrandName()||'售后管理系统')+' · 打印 '+esc(d.printed_at)+(d.batch_no?' · 批次 '+esc(d.batch_no):'')+(NEWFLOW&&(g.up_tracking_no||g.express)?' · 快递单号：'+esc((g.up_tracking_no||'')+(g.express?' / '+g.express:'')):'')+'</div></div><div style="text-align:right;font-size:12px">第 '+pageNo+'/'+totalPages+' 页</div></div>'
        +'<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:10px;font-size:'+(c.font_size+3)+'px;line-height:1.5;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px"><div style="flex:1.4"><b style="font-size:'+(c.font_size+4)+'px">返回地址：</b>'+esc(d.return_address)+'</div><div style="flex:1"><b style="font-size:'+(c.font_size+4)+'px">返回联系人：</b>'+esc(d.return_contact||'—')+'</div></div>'
        +'<table>'+printCols+printHead
        +slice.map(printRows).join('')+'</tbody></table>'
        +'<div style="display:flex;justify-content:space-between;margin-top:12px"><span>本上家共 <b>'+rows.length+'</b> 单 · 全部共 '+grand+' 单</span><span>寄出签字：____________ &nbsp; 日期：____________</span></div></div></div>';
    }
  }
  const pb=$('#pr_body');if(!pb)return;pb.innerHTML=grand?out:'<div class="card"><div class="empty">没有符合筛选条件的单据（共 '+(d.total||0)+' 条）。<br>日期留空、进度选「全部」即可列出全部单据。</div></div>';
};


// ================= 安心保（业务） / 保修设置（配置） =================
let WP_OPEN={devices:true,settings:false,shipping:false,onsite:false,copy:false,list:true}; // 设备档案默认展开
let SHIP_PAGE=1,SHIP_ALL=false;const SHIP_SIZE=10;
let DEV_PAGE=1,DEV_ALL=false;const DEV_SIZE=10;
const EXPRESS_OPTS=['顺丰速运','中通快递','圆通速递','申通快递','韵达快递','京东物流','极兔速递','德邦快递','EMS','其他'];
const wpSec=(key,title,count,body)=>'<section class="card" style="margin-bottom:12px;padding:0;overflow:hidden">'
  +'<div onclick="wpToggle(\''+key+'\')" style="display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;background:var(--bg2,#f8fafc);user-select:none">'
  +'<span style="color:var(--muted)">'+(WP_OPEN[key]?'▾':'▸')+'</span><b>'+esc(title)+'</b>'
  +(count!==undefined?'<span class="badge '+(count?'err':'gray')+'">'+count+'</span>':'')+'<span style="flex:1"></span><span class="hint" style="margin:0">'+(WP_OPEN[key]?'点击收起':'点击展开')+'</span></div>'
  +(WP_OPEN[key]?'<div style="padding:14px 16px">'+body+'</div>':'')+'</section>';
window.wpToggle=k=>{WP_OPEN[k]=!WP_OPEN[k];navigate(A.route==='wsettings'?'wsettings':'warranty');};

function shipTable(shp,canSet){
  const all=shp.rows||[],pages=Math.max(1,Math.ceil(all.length/SHIP_SIZE));if(SHIP_PAGE>pages)SHIP_PAGE=pages;
  const view=SHIP_ALL?all:all.slice((SHIP_PAGE-1)*SHIP_SIZE,SHIP_PAGE*SHIP_SIZE);
  const rows=view.map(r=>{const pend=(r.status||'')==='待审核';const onsite=r.kind==='onsite';let md=[];try{md=JSON.parse(r.media||'[]');}catch{}
    return '<tr><td>'+(onsite?'<span class="badge ok">上门</span> ':'<span class="badge gray">寄送</span> ')+esc(r.model||'—')+'</td><td>'+esc(r.serial||'—')+'</td><td>'+esc(r.user_name||'—')+'<br>'+esc(r.user_phone||'')+'</td><td>'+esc(r.user_address||'—')+(onsite&&r.onsite_reason?'<br><span class="muted">故障：'+esc(String(r.onsite_reason).slice(0,40))+'</span>':'')+'</td><td>'+(onsite?(md.length?'附件 '+md.length+' 个':'—'):(esc(r.express_company||'')+'<br>'+esc(r.tracking_no||'—')))+'</td><td>'+esc(r.status||'')+'</td><td>'+(onsite?'—':esc(r.back_express_company||'')+' '+esc(r.back_tracking_no||'—'))+'</td><td style="white-space:nowrap">'
      +(pend?'<button class="btn sm" onclick="auditShip('+r.id+',\'approve\')">通过</button> <button class="btn ghost sm" onclick="auditShip('+r.id+',\'reject\')">拒绝</button>':'<button class="btn ghost sm" onclick="editShip('+r.id+')">处理 / 回寄</button>')
      +' <button class="btn ghost sm" onclick="printShip('+r.id+')">打印</button>'
      +(can('warranty:shipdelete')?' <button class="btn ghost sm" onclick="delShip('+r.id+')">删除</button>':'')
      +'</td></tr>';}).join('');
  return '<div class="tbl-wrap"><table><thead><tr><th>类型 / 型号</th><th>序列号</th><th>客户</th><th>地址 / 故障</th><th>寄出快递 / 附件</th><th>状态</th><th>回寄快递</th><th>操作</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="8"><div class="empty">暂无用户报修 / 寄送单</div></td></tr>')+'</tbody></table></div>'
    +'<div class="toolbar" style="margin-top:10px"><span class="hint">共 '+all.length+' 单 · 第 '+SHIP_PAGE+'/'+pages+' 页</span><div class="spacer"></div><button class="btn ghost sm" onclick="shipPage(-1)">上一页</button><button class="btn ghost sm" onclick="shipPage(1)">下一页</button><button class="btn ghost sm" onclick="shipToggleAll()">'+(SHIP_ALL?'分页显示':'显示全部')+'</button></div>';
}

// 业务页：只看用户提交的单，不夹任何设置
async function pageWarranty(){
  let shp={rows:[],pending:0};
  try{shp=await api('/api/warranty/shipping/list');}catch{}
  window.__WSHP=shp.rows||[];
  const body='<div class="hint" style="margin-bottom:12px">用户从 /cx 提交的「保修寄送 / 一键上门保修」都在这里处理。设备录入与各类开关 / 文案统一在 <a href="javascript:navigate(\'wsettings\')">「保修设置」</a> 管理。</div>'
    +'<div class="toolbar"><span class="badge '+(shp.pending?'err':'gray')+'">待处理 '+shp.pending+' 单</span><div class="spacer"></div><button class="btn ghost" onclick="navigate(\'wsettings\')">⚙ 保修设置</button><button class="btn ghost" onclick="pageWarranty()">刷新</button></div>'
    +shipTable(shp,true);
  $('#page').innerHTML='<div><h2 style="margin:0 0 4px">🛡 安心保 <span class="badge gray">用户报修 / 寄送单</span></h2>'
    +wpSec('list','用户报修 / 寄送单',shp.pending||0,body)+'</div>';
}

// 配置页：设备档案 + 四个设置板块，默认折叠
async function pageWarrantySettings(){
  const canEdit=can('warranty:edit'),canDel=can('warranty:delete');
  const [dev,mer,sc,oc]=await Promise.all([
    api('/api/warranty/devices'),
    api('/api/warranty/merchant'),
    api('/api/warranty/shipping/config').catch(()=>({enabled:false})),
    api('/api/warranty/onsite/config').catch(()=>({enabled:false}))
  ]);
  window.__WDEV=dev.rows||[];window.__WMER=mer||{};
  const copy=mer.copy||{};
  const allDev=dev.rows||[],devPages=Math.max(1,Math.ceil(allDev.length/DEV_SIZE));if(DEV_PAGE>devPages)DEV_PAGE=devPages;
  const devView=DEV_ALL?allDev:allDev.slice((DEV_PAGE-1)*DEV_SIZE,DEV_PAGE*DEV_SIZE);
  const rows=devView.map(r=>{const ps=String(r.params||'').trim(),one=ps.replace(/\s+/g,' '),short=one?one.slice(0,30)+(one.length>30?'…':''):'—';
    return '<tr><td>'+esc(r.model||'—')+'</td><td class="mono">'+esc(r.serial||'—')+'</td><td>'+esc(r.order_no||'—')+'</td><td>'+esc(r.phone||'—')+'</td><td>'+esc(r.customer_name||'—')+'</td><td>'+esc(r.purchase_date||'—')+'</td><td>'+esc(r.warranty_months||12)+' 个月</td><td>'+esc(r.warranty_end||'—')+'</td><td style="max-width:220px"><div class="devp" data-full="'+esc(ps)+'"><span class="devp-short" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:140px;vertical-align:middle">'+esc(short)+'</span>'+(one.length>30?' <button class="btn ghost sm" onclick="devpToggle(this)">展开</button>':'')+'</div></td><td style="white-space:nowrap">'
    +(canEdit?'<button class="btn ghost sm" onclick="editWarranty('+r.id+')">编辑</button> ':'')
    +(canDel?'<button class="btn ghost sm" onclick="delWarranty('+r.id+')">删除</button>':'')
    +(!canEdit&&!canDel?'<span class="muted">仅登记</span>':'')+'</td></tr>';}).join('');
  const devBody='<div class="hint" style="margin-bottom:12px">录入设备型号、序列号、订单号、手机号、购买日期与保修月数；到期日自动计算（也可手填覆盖）。公开查询页：<a href="/cx" target="_blank">/cx</a>（无需登录，信息打码显示）。</div>'
    +'<div class="toolbar"><button class="btn" onclick="editWarranty()">＋ 新增设备</button><input id="wd_q" placeholder="按型号/SN/订单号/手机号筛选" style="flex:1;min-width:200px"><button class="btn ghost" onclick="pageWarrantySettings()">刷新</button></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>型号</th><th>序列号</th><th>订单号</th><th>手机号</th><th>客户</th><th>购买日期</th><th>保修</th><th>到期日</th><th>设备参数</th><th>操作</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="10"><div class="empty">暂无设备，点「新增设备」录入</div></td></tr>')+'</tbody></table></div>'
    +'<div class="toolbar" style="margin-top:10px"><span class="hint">共 '+allDev.length+' 台 · 最新 '+DEV_SIZE+' 条 · 第 '+DEV_PAGE+'/'+devPages+' 页</span><div class="spacer"></div><button class="btn ghost sm" onclick="devPage(-1)">上一页</button><button class="btn ghost sm" onclick="devPage(1)">下一页</button><button class="btn ghost sm" onclick="devToggleAll()">'+(DEV_ALL?'分页显示':'显示全部')+'</button></div>';
  const shipSet='<div class="hint" style="margin-bottom:10px">开启后，用户在 /cx 查询结果里可点「保修寄送」提交寄送单。</div>'
    +'<div class="grid g2"><div class="field"><label>保修寄送开关</label><select id="ws_enabled"><option value="0" '+(sc.enabled?'':'selected')+'>关闭（默认）</option><option value="1" '+(sc.enabled?'selected':'')+'>开启</option></select></div>'
    +'<div class="field"><label>商家售后联系人</label><input id="ws_contact" value="'+esc(sc.shop_contact||'')+'"></div>'
    +'<div class="field"><label>商家售后电话</label><input id="ws_phone" value="'+esc(sc.shop_phone||'')+'"></div>'
    +'<div class="field"><label>到付 / 寄送提示</label><input id="ws_notice" value="'+esc(sc.notice||'请寄付，到付拒收；寄出后保留快递单号以便查询进度。')+'"></div></div>'
    +'<div class="field"><label>商家售后收货地址（用户弹窗自动带出）</label><textarea id="ws_address" rows="2">'+esc(sc.shop_address||'')+'</textarea></div>'
    +'<div class="toolbar"><button class="btn" onclick="saveShipConfig()">保存寄送设置</button></div>';
  const onSet='<div class="hint" style="margin-bottom:10px">开启后，用户可点「🛠 一键上门保修」，无需寄送，只填上门地址 / 电话 / 故障原因，可传照片视频。</div>'
    +'<div class="grid g2"><div class="field"><label>上门保修开关</label><select id="wo_enabled"><option value="0" '+(oc.enabled?'':'selected')+'>关闭（默认）</option><option value="1" '+(oc.enabled?'selected':'')+'>开启</option></select></div>'
    +'<div class="field"><label>用户提交提示</label><input id="wo_notice" value="'+esc(oc.notice||'请填写详细上门地址、联系电话与故障原因，可上传照片 / 视频；商家会尽快联系您。')+'"></div></div>'
    +'<div class="toolbar"><button class="btn" onclick="saveOnsiteConfig()">保存上门设置</button></div>';
  const copySet='<div class="hint" style="margin-bottom:12px">只改 /cx 查询页标题、提示文字与底部三包说明。</div><div class="grid g2">'
    +[['title','页面标题','设备保修查询'],['subtitle','副标题','输入设备序列号 / 订单号 / 手机号，查询保修到期时间'],
      ['placeholder','输入框提示','例如：SN 序列号 / 订单号 / 手机号'],['privacy','隐私说明','为保护隐私，仅显示部分打码信息；至少输入 3 位。查询结果以商家登记为准。']].map(([k,l,d])=>'<div class="field"><label>'+l+'</label><input id="wc_'+k+'" value="'+esc(copy[k]||d)+'"></div>').join('')+'</div>'
    +'<div class="field"><label>底部保修说明（三包政策 / 免责条款）</label><textarea id="wc_policy" rows="3">'+esc(copy.policy||'三包政策：进水、人为损坏、腐蚀及不可抗拒因素引起的损坏损伤不在保修范围内。')+'</textarea></div>'
    +'<div class="toolbar"><button class="btn" onclick="saveWarrantyCopy()">保存文字 / 说明</button></div>';
  const merSet='<div class="grid g2">'
    +[['shop','商家名称'],['wechat','微信号'],['qq','QQ 号'],['phone','联系电话'],['qr','二维码图片地址（可选）']].map(([k,l])=>'<div class="field"><label>'+l+'</label><input id="wm_'+k+'" value="'+esc(mer[k]||'')+'"></div>').join('')+'</div>'
    +'<div class="toolbar"><button class="btn" onclick="saveWarrantyMerchant()">保存商家信息</button></div>';
  $('#page').innerHTML='<div><h2 style="margin:0 0 4px">⚙ 保修设置 <span class="badge gray">设备档案与展示配置</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">每个板块点标题展开；用户报修 / 寄送单不在这里，去 <a href="javascript:navigate(\'warranty\')">「安心保」</a> 处理。</div>'
    +wpSec('devices','设备档案',dev.rows?.length||0,devBody)
    +wpSec('shipping','保修寄送设置',undefined,shipSet)
    +wpSec('onsite','一键上门设置',undefined,onSet)
    +wpSec('copy','📝 查询页文字 / 保修说明',undefined,copySet)
    +wpSec('settings','🛠 一键报修 / 商家信息',undefined,merSet)+'</div>';
  const qi=$('#wd_q');if(qi)qi.oninput=()=>{const k=qi.value.trim().toLowerCase();$$('#page tbody tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(k)?'':'none');};
}

window.saveShipConfig=async()=>{
  const b={enabled:$('#ws_enabled').value==='1',shop_address:$('#ws_address').value,shop_contact:$('#ws_contact').value,shop_phone:$('#ws_phone').value,notice:$('#ws_notice').value};
  try{ await api('/api/warranty/shipping/config',{method:'POST',body:b}); invalidateCache(); toast('寄送设置已保存','ok'); await pageWarrantySettings(); }
  catch(e){ toast(e.message||'保存失败','err'); }
};
window.editShip=id=>{
  const r=(window.__WSHP||[]).find(x=>x.id===id)||{};
  const onsite=r.kind==='onsite';let md=[];try{md=JSON.parse(r.media||'[]');}catch{}
  modal(modalHead((onsite?'上门保修单':'处理寄送单')+' #'+id)+'<div class="mb"><div class="hint" style="margin-bottom:10px">'+esc(r.model||'')+' · '+esc(r.serial||'')+(onsite?'<br>故障原因：'+esc(r.onsite_reason||'—')+mediaHtml(md):'<br>寄出：'+esc(r.express_company||'')+' '+esc(r.tracking_no||''))+'<br>客户：'+esc(r.user_name||'')+' '+esc(r.user_phone||'')+'<br>地址：'+esc(r.user_address||'')+'</div>'
    +'<div class="grid g2"><div class="field"><label>状态</label><select id="sh_status">'+['待审核','已通过','已拒绝','已收货','维修中','已发出','已完成'].map(s=>'<option '+(r.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></div>'
    +(onsite?'':'<div class="field"><label>回寄快递公司</label><select id="sh_bco" onchange="shipCoOther()">'+EXPRESS_OPTS.map(s=>'<option '+((r.back_express_company||'顺丰速运')===s?'selected':'')+'>'+s+'</option>').join('')+'</select><input id="sh_bco_other" placeholder="其他公司手输" style="display:none;margin-top:6px" value="'+esc(r.back_express_company||'')+'"></div>'
    +'<div class="field"><label>回寄快递单号</label><input id="sh_bno" value="'+esc(r.back_tracking_no||'')+'"></div>')
    +'<div class="field"><label>处理备注</label><input id="sh_remark" value="'+esc(r.remark||'')+'"></div></div></div>'
    +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn ghost" onclick="printShip('+id+')">🖨 打印</button><button class="btn" onclick="saveShip('+id+')">保存</button></div>');
};
window.saveShip=async id=>{
  const b={status:$('#sh_status').value,back_express_company:$('#sh_bco')?shipCoValue():'',back_tracking_no:$('#sh_bno')?.value||'',remark:$('#sh_remark').value};
  await api('/api/warranty/shipping/'+id,{method:'PUT',body:b});closeModal();toast('已保存','ok');pageWarranty();
};
window.printShip=id=>{
  const r=(window.__WSHP||[]).find(x=>x.id===id)||{};if(!r.id)return;
  const link=(co,no)=>no?((String(co||'').includes('顺丰')?'https://www.sf-express.com/chn/sc/waybill/list?billno=':'https://www.kuaidi100.com/chaxun?com='+encodeURIComponent(co||'')+'&nu=')+encodeURIComponent(no)):'';
  const hist=(()=>{try{return JSON.parse(r.history||'[]');}catch{return [];}})();
  const histTxt=hist.map(h=>'  '+new Date(Number(h.at)||Date.now()).toLocaleString('zh-CN')+' · '+(h.by||'')+' · '+(h.action||'')+(h.status?' → '+h.status:'')+(h.note?'：'+h.note:'')).join('\n');
  const txt='保修寄送单 #'+r.id+'\n型号：'+(r.model||'')+'\n序列号：'+(r.serial||'')+'\n订单号：'+(r.order_no||'')+'\n保修到期：'+(r.warranty_end||'')+'\n\n【商家售后收货】\n'+(r.shop_address||'')+'\n联系人：'+(r.shop_contact||'')+' '+(r.shop_phone||'')+'\n\n【用户收货】\n'+(r.user_name||'')+' '+(r.user_phone||'')+'\n'+(r.user_address||'')+'\n\n【寄出快递】'+(r.express_company||'')+' '+(r.tracking_no||'')+'\n'+(link(r.express_company,r.tracking_no)||'')+'\n【回寄快递】'+(r.back_express_company||'')+' '+(r.back_tracking_no||'')+'\n'+(link(r.back_express_company,r.back_tracking_no)||'')+'\n\n备注：'+(r.remark||'')+(histTxt?'\n\n【处理记录】\n'+histTxt:'');
  const w=window.open('','_blank');w.document.write('<meta charset="utf-8"><title>保修寄送单 #'+r.id+'</title><pre style="font:14px/1.9 sans-serif;white-space:pre-wrap">'+esc(txt)+'</pre>');w.document.close();w.print();
};
// 登录后弹窗：待处理寄送单提醒（不限账号权限，只弹提示）
window.checkShippingAlert=async()=>{};
window.editWarranty=id=>{
  const isEdit=!!id;if(isEdit&&!can('warranty:edit')){toast('无编辑权限','err');return;}
  const r=id?(window.__WDEV||[]).find(x=>x.id===id)||{}:{warranty_months:12};
  const f=(k,l,req)=>'<div class="field"><label>'+l+(req?' <span class="req">*</span>':'')+'</label><input id="w_'+k+'" value="'+esc(r[k]||'')+'"></div>';
  modal(modalHead(isEdit?'编辑设备':'新增设备')+'<div class="mb"><div class="grid g2">'
    +f('model','设备型号')+f('serial','序列号 / SN','1')+f('order_no','订单号')+f('phone','手机号')
    +f('customer_name','客户姓名')+f('purchase_date','购买日期 (YYYY-MM-DD)')
    +f('warranty_months','保修月数')+f('warranty_end','到期日 (留空自动算)')+f('remark','备注')+'</div>'
    +'<div class="field" style="margin-top:10px"><label>设备参数（手动填写，每行一条）</label><textarea id="w_params" rows="4" placeholder="例如：CPU：i5-12450H&#10;内存：16G&#10;硬盘：512G SSD&#10;颜色：白色">'+esc(r.params||'')+'</textarea><div class="hint">用户凭 SN / 订单号 / 手机号查询时会显示这些参数；不填则留空。</div></div>'
    +'<div class="hint">序列号 / 订单号 / 手机号至少填一项，供用户查询。</div></div>'
    +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveWarranty('+(id||'null')+')">保存</button></div>');
};
window.saveWarranty=async id=>{
  const v=k=>$('#w_'+k)?.value||'';
  const b={model:v('model'),serial:v('serial'),order_no:v('order_no'),phone:v('phone'),customer_name:v('customer_name'),
    purchase_date:v('purchase_date'),warranty_months:Number(v('warranty_months'))||12,warranty_end:v('warranty_end'),remark:v('remark'),params:v('params')};
  const r=await api(id?'/api/warranty/devices/'+id:'/api/warranty/devices',{method:id?'PUT':'POST',body:b});
  if(r.ok===false){toast(r.reason||'保存失败','err');return;}
  closeModal();toast('已保存','ok');pageWarrantySettings();
};
window.delWarranty=async id=>{if(!can('warranty:delete')){toast('无删除权限','err');return;}if(!confirm('确定删除这台设备？'))return;await api('/api/warranty/devices/'+id,{method:'DELETE'});toast('已删除','ok');pageWarrantySettings();};
window.saveWarrantyMerchant=async()=>{
  const b={};['shop','wechat','qq','phone','qr'].forEach(k=>b[k]=$('#wm_'+k)?.value||'');
  await api('/api/warranty/merchant',{method:'POST',body:b});toast('商家信息已保存','ok');
};
window.saveWarrantyCopy=async()=>{
  const b={_copy:true};['title','subtitle','placeholder','privacy','policy'].forEach(k=>b[k]=$('#wc_'+k)?.value||'');
  await api('/api/warranty/merchant',{method:'POST',body:b});toast('文字 / 说明已保存','ok');
};


// ================= 报价系统（后台，独立模块） =================
async function pageQuote(){
  const [g,a,cf]=await Promise.all([api('/api/quote/admin/goods'),api('/api/quote/admin/accounts'),api('/api/quote/admin/config')]);
  const c=cf.config||{};
  window.__QG=g.rows||[];window.__QA=a.rows||[];
  const f=window.__QF||{cat:'',kw:''};window.__QF=f;
  const all=(g.rows||[]).filter(x=>(!f.cat||String(x.category||'')===f.cat)&&(!f.kw||[x.name,x.model,x.category,x.params].some(v=>String(v||'').toLowerCase().includes(f.kw.toLowerCase()))));
  const pages=Math.max(1,Math.ceil(all.length/QG_SIZE));if(QG_PAGE>pages)QG_PAGE=pages;
  const view=QG_ALL?all:all.slice((QG_PAGE-1)*QG_SIZE,QG_PAGE*QG_SIZE);
  let cats=[...new Set((g.rows||[]).map(x=>String(x.category||'').trim()).filter(Boolean))];
  try{const cc=await api(nfUrl('/api/quote/cats'),{silent:true});if(cc&&Array.isArray(cc.rows))cats=[...new Set([...cc.rows.map(x=>String(x||'').trim()).filter(Boolean),...cats])];}catch{}
  window.__QCATS=cats;
  const rows=view.map(x=>'<tr><td><input type="checkbox" class="qg-sel" value="'+x.id+'" style="width:auto"></td><td>'+esc(x.category||'—')+'</td><td>'+esc(x.name||'—')+'</td><td class="mono">'+esc(x.model||'—')+'</td><td style="max-width:150px;white-space:pre-wrap">'+esc(String(x.params||'').slice(0,60))+'</td><td>¥'+esc(x.retail)+'</td><td>¥'+esc(x.normal)+'</td><td>¥'+esc(x.core)+'</td><td>'+esc(x.tag||'')+'</td><td>'+(x.active?'启用':'停用')+'</td><td style="white-space:nowrap"><button class="btn ghost sm" onclick="editQuoteGood('+x.id+')">编辑</button> <button class="btn ghost sm" onclick="delQuoteGood('+x.id+')">删除</button></td></tr>').join('');
  const acc=a.rows.map(x=>'<tr><td class="mono">'+esc(x.code)+'</td><td>'+esc(x.display_name||'—')+'</td><td>'+(x.level==='core'?'核心渠道价':'普通渠道价')+'</td><td>'+(x.active?'启用':'停用')+'</td><td style="white-space:nowrap"><button class="btn ghost sm" onclick="editQuoteAcc('+x.id+')">编辑</button> <button class="btn ghost sm" onclick="delQuoteAcc('+x.id+')">删除</button></td></tr>').join('');
  $('#page').innerHTML='<div><h2 style="margin:0 0 4px">💼 报价系统 <span class="badge gray">商品与渠道账号</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">前台入口：<a href="/bj" target="_blank">/bj</a>。匿名只看零售价；渠道账号由这里开通（不能自助注册），登录后按等级看普通 / 核心渠道价。与保修、安心保代码互相独立。</div>'
    +'<div class="card"><div class="toolbar"><b>商品管理</b><div class="spacer"></div><button class="btn" onclick="editQuoteGood()">＋ 新增商品</button><button class="btn ghost" onclick="pageQuote()">刷新</button></div>'
    +'<div class="toolbar" style="margin-top:8px"><select id="qg_cat" style="width:auto;min-width:150px"><option value="">全部分类</option>'+cats.map(x=>'<option '+(f.cat===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select>'
    +'<input id="qg_kw" placeholder="商品名称 / 型号筛选" style="flex:1;min-width:180px" value="'+esc(f.kw)+'"><button class="btn ghost sm" onclick="qgFilter()">筛选</button>'
    +'<button class="btn ghost sm" onclick="qgSelectAll()">全选</button><button class="btn danger sm" onclick="qgDelSelected()">删除选中</button></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th><input type="checkbox" id="qg_all" style="width:auto" onclick="qgToggleAll(this)"></th><th>分类</th><th>名称</th><th>型号</th><th>参数</th><th>零售价</th><th>普通渠道</th><th>核心渠道</th><th>标签</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="11"><div class="empty">暂无商品</div></td></tr>')+'</tbody></table></div>'
    +'<div class="toolbar" style="margin-top:10px"><span class="hint">共 '+all.length+' 件 · 最新 '+QG_SIZE+' 条 · 第 '+QG_PAGE+'/'+pages+' 页</span><div class="spacer"></div><button class="btn ghost sm" onclick="qgPage(-1)">上一页</button><button class="btn ghost sm" onclick="qgPage(1)">下一页</button><button class="btn ghost sm" onclick="qgToggleAllRows()">'+(QG_ALL?'分页显示':'全部显示')+'</button></div></div>'
    +'<div class="card"><div class="toolbar"><b>渠道账号</b><div class="spacer"></div><button class="btn" onclick="editQuoteAcc()">＋ 开通账号</button></div>'
    +'<div class="hint" style="color:var(--err)">没有注册接口；用户拿到账号密码后到 /bj 登录。</div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>账号</th><th>名称</th><th>等级</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    +(acc||'<tr><td colspan="5"><div class="empty">暂无渠道账号</div></td></tr>')+'</tbody></table></div></div>'
    +'<section class="card" style="margin-top:12px"><div style="font-weight:700;margin-bottom:10px">分类维护（每行一个，供新增商品下拉选择）</div><div class="toolbar" style="margin-bottom:10px"><button class="btn" onclick="saveQuoteCats()">保存分类</button></div><div class="field"><label>预建分类</label><textarea id="qc_cats" rows="4" placeholder="例如：木南智家系列&#10;木南WIFI/4G系列">'+esc(cats.join('\n'))+'</textarea><div class="hint">保存后，新增/编辑商品「分类」下拉会读取这里；已有商品分类也会自动合并显示。</div></div></section>'
    +'<section class="card" style="padding:0;overflow:hidden"><div onclick="qgCfgToggle()" style="display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;background:var(--bg2,#f8fafc)"><span id="qgCfgArrow">'+(window.__QGCFG?'▾':'▸')+'</span><b>前台文案 / 开通联系方式</b><span class="hint" style="margin:0;flex:1;text-align:right">'+(window.__QGCFG?'点击收起':'点击展开')+'</span></div>'
    +(window.__QGCFG?'<div style="padding:14px 16px"><div class="toolbar"><button class="btn" onclick="saveQuoteConfig()">保存设置</button></div><div class="hint" style="margin:10px 0">「未登录提示」和「公告」留空即在前台隐藏；「获取账号」弹窗会显示下面填写的联系方式。</div><div class="grid g2">'
      +qcf('shop_name','前台标题',c.shop_name)+qcf('login_hint','未登录提示（留空隐藏）',c.login_hint)
      +qcf('notice','公告（留空隐藏）',c.notice)+qcf('account_title','弹窗标题',c.account_title)
      +qcf('account_text','弹窗说明',c.account_text)+qcf('contact_name','联系人',c.contact_name)
      +qcf('contact_phone','电话',c.contact_phone)+qcf('contact_wechat','微信',c.contact_wechat)
      +qcf('contact_qq','QQ',c.contact_qq)+qcf('contact_other','其他联系方式',c.contact_other)
      +'</div></div>':'')+'</section></div>';
}


let QG_PAGE=1,QG_ALL=false;const QG_SIZE=10;window.__QGCFG=false;
window.qgCfgToggle=()=>{window.__QGCFG=!window.__QGCFG;pageQuote();};
window.saveQuoteCats=async()=>{const names=$('#qc_cats')?.value||'';const r=await api('/api/quote/cats',{method:'POST',body:{names}});if(r.ok===false){toast(r.reason||'保存失败','err');return;}invalidateCache();toast('分类已保存','ok');pageQuote();};
window.qgFilter=()=>{window.__QF={cat:$('#qg_cat')?.value||'',kw:($('#qg_kw')?.value||'').trim()};QG_PAGE=1;QG_ALL=false;pageQuote();};
window.qgPage=d=>{QG_PAGE=Math.max(1,QG_PAGE+d);QG_ALL=false;pageQuote();};
window.qgToggleAllRows=()=>{QG_ALL=!QG_ALL;QG_PAGE=1;pageQuote();};
window.qgToggleAll=box=>{$('.qg-sel').forEach(c=>c.checked=box.checked);};
window.qgSelectAll=()=>{$('.qg-sel').forEach(c=>c.checked=true);toast('已全选当前页','ok');};
window.qgDelSelected=async()=>{
  const ids=$('.qg-sel:checked').map(c=>Number(c.value));if(!ids.length){toast('请先勾选商品','warn');return;}
  if(!confirm('确定删除选中的 '+ids.length+' 件商品？不可恢复'))return;
  for(const id of ids)await api('/api/quote/admin/goods/'+id,{method:'DELETE'});
  toast('已删除 '+ids.length+' 件','ok');pageQuote();
};
function qcf(k,l,v){return '<div class="field"><label>'+l+'</label><input id="qc_'+k+'" value="'+esc(v||'')+'"></div>';}
window.saveQuoteConfig=async()=>{
  const keys=['shop_name','login_hint','notice','account_title','account_text','contact_name','contact_phone','contact_wechat','contact_qq','contact_other'];
  const b={};for(const k of keys)b[k]=$('#qc_'+k)?.value||'';
  const r=await api('/api/quote/admin/config',{method:'POST',body:b});
  if(r.ok===false){toast(r.reason||'保存失败','err');return;}
  toast('报价前台设置已保存','ok');pageQuote();
};
window.editQuoteGood=id=>{
  const x=id?(window.__QG||[]).find(r=>r.id===id)||{}:{};
  const f=(k,l,v)=>'<div class="field"><label>'+l+'</label><input id="qg_'+k+'" value="'+esc(x[k]??v??'')+'"></div>';
  const catVal=String(x.category||'').trim();
  const catOpts=[...new Set([...(window.__QCATS||[]).map(v=>String(v||'').trim()).filter(Boolean),...(window.__QG||[]).map(r=>String(r.category||'').trim()).filter(Boolean),...(catVal?[catVal]:[])])];
  const catField='<div class="field"><label>分类</label><select id="qg_category"><option value="">未分类</option>'+catOpts.map(v=>'<option '+(v===catVal?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></div>';
  modal(modalHead(id?'编辑商品':'新增商品')+'<div class="mb"><div class="grid g2">'
    +catField+f('name','商品名称')+f('model','型号')+f('tag','标签')+f('retail','零售价',0)+f('normal','普通渠道价',0)+f('core','核心渠道价',0)+f('active','启用(1/0)',1)
    +'</div><div class="field"><label>商品图片（本地上传 或 网络链接）</label><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input type="file" id="qg_file" accept="image/*" onchange="qgPickFile()" style="flex:1;min-width:160px"><input id="qg_image_url" placeholder="或粘贴网络图片地址 https://..." style="flex:2;min-width:220px" value="'+esc(x.image_url||'')+'"></div>'
    +'<img id="qg_preview" src="'+esc(x.image_data||x.image_url||'')+'" style="display:'+(x.image_data||x.image_url?'block':'none')+';width:110px;height:110px;object-fit:contain;border:1px solid #cbd5e1;border-radius:10px;margin-top:8px;background:#fff">'
    +'<input type="hidden" id="qg_image_data" value="'+esc(x.image_data||'')+'"><div class="hint">本地上传约 1.5MB 内；两种都有时优先用本地图片。</div></div>'
    +'<div class="field"><label>参数（每行一条）</label><textarea id="qg_params" rows="4">'+esc(x.params||'')+'</textarea></div>'
    +'<div class="field"><label>备注</label><input id="qg_remark" value="'+esc(x.remark||'')+'"></div></div>'
    +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveQuoteGood('+(id||'null')+')">保存</button></div>');
};
window.qgPickFile=()=>{const f=document.getElementById('qg_file');if(!f||!f.files[0])return;const r=new FileReader();r.onload=()=>{const d=String(r.result||'');document.getElementById('qg_image_data').value=d;const p=document.getElementById('qg_preview');if(p){p.src=d;p.style.display='block';}};r.readAsDataURL(f.files[0]);};
window.saveQuoteGood=async id=>{
  const v=k=>$('#qg_'+k)?.value||'';
  const b={category:v('category'),name:v('name'),model:v('model'),params:v('params'),image_url:v('image_url'),image_data:v('image_data'),tag:v('tag'),retail:Number(v('retail'))||0,normal:Number(v('normal'))||0,core:Number(v('core'))||0,remark:v('remark'),active:Number(v('active'))===0?false:true};
  if(id)b.id=id;
  const r=await api('/api/quote/admin/goods',{method:'POST',body:b});
  if(r.ok===false){toast(r.reason||'保存失败','err');return;}
  closeModal();toast('已保存','ok');pageQuote();
};
window.delQuoteGood=async id=>{if(!confirm('确定删除该商品？'))return;await api('/api/quote/admin/goods/'+id,{method:'DELETE'});toast('已删除','ok');pageQuote();};
window.editQuoteAcc=id=>{
  const x=id?(window.__QA||[]).find(r=>r.id===id)||{}:{};
  modal(modalHead(id?'编辑渠道账号':'开通渠道账号')+'<div class="mb"><div class="grid g2">'
    +'<div class="field"><label>账号 *</label><input id="qa_code" value="'+esc(x.code||'')+'"></div>'
    +'<div class="field"><label>名称</label><input id="qa_name" value="'+esc(x.display_name||'')+'"></div>'
    +'<div class="field"><label>等级</label><select id="qa_level"><option value="normal" '+(x.level!=='core'?'selected':'')+'>普通渠道价</option><option value="core" '+(x.level==='core'?'selected':'')+'>核心渠道价</option></select></div>'
    +'<div class="field"><label>状态</label><select id="qa_active"><option value="1" '+(x.active?'selected':'')+'>启用</option><option value="0" '+(!x.active?'selected':'')+'>停用</option></select></div>'
    +'<div class="field"><label>密码'+(id?'（留空不改）':' *')+'</label><input id="qa_pwd" type="password" placeholder="初始密码"></div></div>'
    +'<div class="hint">用户不能自助注册，只能在这里开通。账号密码交给渠道客户后到 /bj 登录。</div></div>'
    +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="saveQuoteAcc('+(id||'null')+')">保存</button></div>');
};
window.saveQuoteAcc=async id=>{
  const b={code:$('#qa_code').value.trim(),display_name:$('#qa_name').value.trim(),level:$('#qa_level').value,active:$('#qa_active').value==='1',password:$('#qa_pwd').value};
  if(id)b.id=id;
  const r=await api('/api/quote/admin/accounts',{method:'POST',body:b});
  if(r.ok===false){toast(r.reason||'保存失败','err');return;}
  closeModal();toast('已保存','ok');pageQuote();
};
window.delQuoteAcc=async id=>{if(!confirm('确定删除该渠道账号？'))return;await api('/api/quote/admin/accounts/'+id,{method:'DELETE'});toast('已删除','ok');pageQuote();};

// ================= 人员权限配置（owner 可勾选）=================
const PERM_LABELS={"maintenance:manage":"维保中心 · 收件处理","return:manage":"返回录入 · 提交返回","pickup:manage":"取件中心 · 客户取件","print:view":"打印明细 · 查看/生成","print:settings":"打印排版 · 修改设置","query:read":"任意检索 · 查询","audit:read":"操作日志 · 查看/清空","paid:read":"自费维修统计 · 查看","danger:manage":"危险操作 · 删除/清空","quote:manage":"报价系统 · 后台管理","warranty:view":"安心保 · 查看处理列表","warranty:manage":"安心保 · 新增设备","warranty:edit":"安心保 · 编辑设备","warranty:delete":"安心保 · 删除设备","warranty:settings":"保修设置 · 配置","warranty:shipdelete":"安心保 · 删除寄送单","user:manage":"人员账号 · 管理","system:settings":"系统设置 · 管理","backup:manage":"备份恢复 · 管理","record:create":"前台登记 · 新增","record:read":"售后单据 · 查看","record:update":"售后单据 · 修改","record:return":"售后单据 · 返回状态","record:delete":"售后单据 · 删除","record:export":"售后数据 · 导出","dict:read":"信息维护 · 查看","dict:create":"信息维护 · 编辑","import:create":"表格导入 · 导入","export:create":"数据导出 · 导出"};
async function pageRoles(){
  const d=await api('/api/roles'); const roles=d.roles, keys=d.perm_keys;
  const rows=keys.map(k=>'<tr><td><b>'+esc(PERM_LABELS[k]||k)+'</b></td>'
    +['admin','operator','viewer'].map(r=>'<td style="text-align:center"><input type="checkbox" data-role="'+r+'" data-perm="'+k+'" '+(roles[r].perms.includes(k)||roles[r].perms.includes('*')?'checked':'')+' style="width:auto"></td>').join('')+'</tr>').join('');
  $('#page').innerHTML='<div class="card"><h2>☰ 人员权限配置 <span class="badge">谁可以做什么</span></h2>'
    +'<div class="hint" style="margin-bottom:14px">超级管理员拥有全部权限且不可修改。其余三个角色可逐项勾选，保存后立即生效（服务端强制校验，不只是隐藏按钮）。</div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>权限点</th><th>'+esc(roles.admin.label)+'</th><th>'+esc(roles.operator.label)+'</th><th>'+esc(roles.viewer.label)+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div class="toolbar" style="margin-top:14px"><button class="btn" onclick="saveRoles()">保存权限配置</button><button class="btn ghost" onclick="navigate(\'users\')">去管理人员账号</button></div>'
    +'<div class="sep"></div><h3>角色说明</h3><div class="hint">管理员：业务 + 字典 + 导入导出，默认不含人员与系统设置。登记员：登记/查询/改自己单。只读：仅查看与查询。以上均可在上方按需重配。</div></div>';
}
window.saveRoles=async()=>{
  const roles={admin:[],operator:[],viewer:[]};
  $$('#page input[data-role]').forEach(i=>{if(i.checked)roles[i.dataset.role].push(i.dataset.perm);});
  await api('/api/roles',{method:'POST',body:{roles}});
  const me=await api('/api/auth/me',{silent:true}); A.roles=me.roles;
  toast('权限配置已保存','ok');
};

// ================= 维保中心（云端测试版 · 快捷收件处理） =================
const MC={rows:[],q:'',page:1,size:8,all:false,token:0};
function mcExtra(r){try{return typeof r.extra==='string'?JSON.parse(r.extra||'{}'):(r.extra||{});}catch{return {};}}
function mcMaintenance(r){const e=mcExtra(r);return e.maintenance||{};}
function mcRowsHtml(rows){return rows.map(r=>{const m=mcMaintenance(r);return '<tr><td><a href="javascript:showRecord('+r.id+')"><b>'+esc(r.record_no)+'</b></a><br><span class="muted">'+esc(r.record_date||'')+'</span></td>'
 +'<td>'+esc(r.product_model)+'<br><span class="muted">'+serialList(r.serials).map(s=>'<span class="sn">'+esc(s)+'</span>').join('')+'</span></td>'
 +'<td>'+esc(r.repair_unit||'—')+'<br><span class="muted">'+esc(r.contact_phone||'')+'</span></td>'
 +'<td>'+esc(m.inbound_no||r.tracking_out||'—')+'<br><span class="muted">'+esc(m.inbound_date||r.record_date||'')+'</span></td>'
 +'<td>'+statusPill(r.status)+'</td>'
 +'<td style="white-space:nowrap"><button class="btn ok sm" onclick="mcFast('+r.id+',1)">送修上家</button> <button class="btn sm" onclick="mcFast('+r.id+',2)">自维保</button> <button class="btn ghost sm" onclick="mcOpen('+r.id+')">编辑</button></td></tr>';}).join('');}
window.mcPage=(d)=>{MC.all=false;MC.page=Math.max(1,MC.page+d);mcRender();};
window.mcToggleAll=()=>{MC.all=!MC.all;MC.page=1;mcRender();};
window.mcSearch=async()=>{MC.q=$('#mc_q')?.value||'';MC.page=1;MC.all=false;const tok=++MC.token;const params=new URLSearchParams({q:MC.q,limit:'200',});params.set('_t',String(Date.now()));try{const d=await api('/api/maintenance/pending?'+params.toString(),{noCache:true});if(tok!==MC.token)return;MC.rows=(d.rows||[]).filter(r=>String(r.status||'')==='已收件'&&!String(r.return_date||'').trim());mcRender();}catch(e){if(tok!==MC.token)return;MC.rows=[];const box=$('#mc_result');if(box&&A.route==='maintenance')box.innerHTML='<div class="empty">加载失败：'+esc(e.message||'')+'</div>';}};
function mcRender(){if(A.route!=='maintenance'||!$('#mc_result'))return;const total=MC.rows.length,pages=Math.max(1,Math.ceil(total/MC.size));if(MC.page>pages)MC.page=pages;const view=MC.all?MC.rows:MC.rows.slice((MC.page-1)*MC.size,MC.page*MC.size);const pager=total>MC.size?'<div class="toolbar" style="margin-top:8px"><button class="btn ghost sm" '+(MC.page<=1||MC.all?'disabled':'')+' onclick="mcPage(-1)">上一页</button><span class="hint">共 '+total+' 条 · 每页 '+MC.size+' 条 · 第 '+MC.page+'/'+pages+' 页</span><button class="btn ghost sm" '+((MC.page>=pages)||MC.all?'disabled':'')+' onclick="mcPage(1)">下一页</button><button class="btn ghost sm" onclick="mcToggleAll()">'+(MC.all?'分页显示':'全部显示')+'</button></div>':'';$('#mc_result').innerHTML='<h2>待处理收件 <span class="badge">'+total+' 条</span></h2>'+pager+'<div class="tbl-wrap"><table><thead><tr><th>单号 / 登记时间</th><th>型号 / 序列号</th><th>客户</th><th>客户寄来单号 / 日期</th><th>状态</th><th>快捷处理</th></tr></thead><tbody>'+(mcRowsHtml(view)||'<tr><td colspan="6"><div class="empty">暂无待处理收件</div></td></tr>')+'</tbody></table></div>'+pager;}
async function pageMaintenance(){MC.q='';MC.page=1;MC.all=false;$('#page').innerHTML='<div class="card"><h2>🛠 维保中心 <span class="badge gray">只显示已收件 · 每页 8 条</span></h2>'
 +'<div class="hint" style="margin-bottom:14px">前台快捷登记后，这里只显示「已收件」。点「送修上家」填上家/发往上家单号/寄商家备注；点「自维保」直接转自维保。这里不登记返回信息，返回信息只在「返回录入」提交。</div>'
 +'<div class="toolbar"><input id="mc_q" style="flex:1;min-width:260px" placeholder="输入单号 / 型号 / 序列号 / 客户 / 客户寄来单号"><button class="btn" onclick="mcSearch()">查询</button><button class="btn ghost" onclick="navigate(\'register\')">＋ 新增登记</button></div>'
 +'<div id="mc_result"><div class="empty">加载中…</div></div></div>';try{await mcSearch();}catch(e){const box=$('#mc_result');if(box&&A.route==='maintenance')box.innerHTML='<div class="empty">加载失败：'+esc(e.message||'')+'</div>';}}
window.mcUpAuto=()=>{const t=$('#mc_up_tracking'),s=$('#mc_up_company');if(!t||!s||s.dataset.manual)return;const auto=(typeof detectExpress==='function')?detectExpress(String(t.value||'').trim()):'';if(!auto){if(!s.dataset.manual)s.value='';return;}if(![...s.options].some(o=>o.value===auto||o.textContent===auto)){const o=document.createElement('option');o.value=auto;o.textContent=auto;s.appendChild(o);}for(const o of s.options)if(o.value===auto||o.textContent===auto){s.value=o.value;break;}};
window.mcUpTrackingInput=()=>{const s=$('#mc_up_company');if(s)delete s.dataset.manual;mcUpAuto();};
window.mcUpCompanyManual=()=>{const s=$('#mc_up_company');if(s)s.dataset.manual='1';};
window.mcFast=async(id,code)=>{const r=await api('/api/records/'+id+'?_t='+Date.now(),{noCache:true});const old=mcMaintenance(r);if(code===2){const maintenance={...old,mode:'自维保',self_date:nowLocal(),inbound_no:old.inbound_no||r.tracking_out||'',inbound_date:old.inbound_date||r.record_date||nowLocal(),inbound_company:old.inbound_company||r.express_company||'',upstream:{},back:{},return_submitted:false,return_submitted_at:''};const body={status:'自维保',tracking_out:maintenance.inbound_no,tracking_back:'',return_date:'',supplier_name:'',merchant_note:'',express_company:maintenance.inbound_company,extra:{...mcExtra(r),maintenance}};await api('/api/records/'+id,{method:'PUT',body});invalidateCache();toast('已转自维保','ok');await mcSearch();}else{mcOpen(id,1);}};
window.mcOpen=async(id,code=0)=>{const r=await api('/api/records/'+id+'?_t='+Date.now(),{noCache:true});const m=mcMaintenance(r),up=m.upstream||{},mode=(code===1?'已送修':code===2?'自维保':m.mode||r.status||'已收件');const upCo=String(up.company||'');const coOpts=['<option value="">未指定 / 自动识别</option>'].concat(EXPRESS_LIST.map(v=>'<option value="'+esc(v)+'" '+(v===upCo?'selected':'')+'>'+esc(v)+'</option>'));if(upCo&&!EXPRESS_LIST.includes(upCo))coOpts.push('<option value="'+esc(upCo)+'" selected>'+esc(upCo)+'</option>');modal(modalHead('快捷维保 · '+esc(r.record_no))+'<div class="mb"><div class="grid g2">'
 +'<div class="field"><label>处理方式</label><select id="mc_mode">'+['已收件','已送修','自维保'].map(v=>'<option '+(v===mode?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'
 +'<div class="field"><label>客户寄来单号</label><input id="mc_inbound" value="'+esc(m.inbound_no||r.tracking_out||'')+'"></div>'
 +'<div class="field"><label>客户寄来日期时间</label><input id="mc_inbound_date" value="'+esc(m.inbound_date||r.record_date||nowLocal())+'"></div>'
 +'<div class="field"><label>客户寄来快递公司</label><input id="mc_inbound_company" value="'+esc(m.inbound_company||r.express_company||'')+'"></div>'
 +'<div class="field"><label>送修上家 / 售后站点</label><input id="mc_up_name" list="dl_mc_sup" value="'+esc(up.name||r.supplier_name||'')+'"><datalist id="dl_mc_sup">'+A.dict.suppliers.map(x=>'<option value="'+esc(x.name)+'">').join('')+'</datalist></div>'
 +'<div class="field"><label>送修日期时间</label><input id="mc_up_date" value="'+esc(up.date||nowLocal())+'"></div>'
 +'<div class="field"><label>快递单号 / 快递公司（自动识别）</label><div style="display:flex;gap:6px"><input id="mc_up_tracking" style="flex:2" oninput="mcUpTrackingInput()" value="'+esc(up.tracking_no||'')+'" placeholder="输入快递单号，自动识别快递公司"><select id="mc_up_company" style="flex:1" onchange="mcUpCompanyManual()">'+coOpts.join('')+'</select></div></div>'
 +'<div class="field"><label>寄商家备注（打印明细显示）</label><textarea id="mc_up_note" placeholder="写给上家/售后站点看的内容">'+esc(up.note||r.merchant_note||'')+'</textarea></div>'
 +'</div></div><div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" onclick="mcSave('+r.id+')">保存并流转</button></div>',true);setTimeout(()=>mcUpAuto(),0);};
window.mcSave=async id=>{let mode=$('#mc_mode')?.value||'已收件';if(!['已收件','已送修','自维保'].includes(mode))mode='已收件';let upName=$('#mc_up_name')?.value||'',upNo=$('#mc_up_tracking')?.value||'',note=$('#mc_up_note')?.value||'';if(mode==='自维保'){upName='';upNo='';note='';}
 const r=await api('/api/records/'+id+'?_t='+Date.now(),{noCache:true});const old=mcMaintenance(r);const co=$('#mc_up_company')?.value||detectExpress(upNo)||'';const maintenance={...old,mode,inbound_no:$('#mc_inbound')?.value||old.inbound_no||r.tracking_out||'',inbound_date:$('#mc_inbound_date')?.value||nowLocal(),inbound_company:$('#mc_inbound_company')?.value||old.inbound_company||r.express_company||'',upstream:{name:upName,date:$('#mc_up_date')?.value||nowLocal(),tracking_no:upNo,company:co,note,print_batch_no:(mode==='已送修'?(old.upstream&&old.upstream.print_batch_no?old.upstream.print_batch_no:printBatchId()):''),print_printed_at:(mode==='已送修'?((old.upstream&&old.upstream.print_printed_at)||''):'')},back:{},return_submitted:false,return_submitted_at:''};
 const body={status:mode,tracking_out:maintenance.inbound_no,tracking_back:'',return_date:'',supplier_name:upName,merchant_note:note,express_company:maintenance.inbound_company,extra:{...mcExtra(r),maintenance}};
 await api('/api/records/'+id,{method:'PUT',body});invalidateCache();try{await api('/api/records/'+id+'?_t='+Date.now(),{noCache:true});}catch{}closeModal();toast('已处理：'+mode,'ok');await mcSearch();};

// ================= 本次更新一次性教程弹窗（云端测试版） =================
window.closeGuide=(dontShow)=>{try{if(dontShow!==false)localStorage.setItem('wuyou_tutorial_seen_v5','1');}catch{}closeModal();};
window.showGuideOnce=()=>{let seen=false;try{seen=localStorage.getItem('wuyou_tutorial_seen_v5')==='1';}catch{}if(seen)return;modal(modalHead('无忧商服通 · 本次流程更新说明')+'<div class="mb guide-card">'
 +'<div class="hint" style="margin-bottom:10px">本次更新按以下流程使用：</div><div class="guide-steps">'
 +'<div class="guide-step"><b>① 前台快捷登记</b><span>登记客户寄来的件：型号、客户、序列号、客户寄来单号、销售日期；默认「已收件」。</span></div>'
 +'<div class="guide-step"><b>② 维保中心</b><span>选择「送修上家」或「自维保」；送修上家信息可留空，需要时再填写。</span></div>'
 +'<div class="guide-step"><b>③ 打印明细</b><span>打印只展示产品、故障、寄商家备注等；客户寄来单号和快递单号不在表格显示。</span></div>'
 +'<div class="guide-step"><b>④ 返回录入 → ⑤ 客户取件</b><span>返回录入提交后，单据才会出现在取件中心。</span></div>'
 +'</div><div class="hint" style="margin-top:10px">客户寄来单号、快递单号、快递公司、寄商家备注、维保方式等完整信息，统一到「任意检索」里查看。</div></div><div class="mf"><button class="btn ghost" onclick="closeGuide(true)">不再提示</button><button class="btn" onclick="closeGuide(true)">我知道了</button></div>',true);};

// ================= 路由分发与启动 ==================
const PAGES={dashboard:pageDashboard,register:()=>pageRegister(),maintenance:pageMaintenance,quick:pageQuick,pickup:pagePickup,query:pageQuery,import:pageImport,export:pageExport,dict:pageDict,users:pageUsers,audit:pageAudit,backups:pageBackups,roles:pageRoles,print:pagePrint,settings:pageSettings,danger:pageDanger,paid:pagePaid,warranty:pageWarranty,wsettings:pageWarrantySettings,quote:pageQuote};
async function renderPage(r){
  const p=$('#page');
  // 服务端已强制校验，这里再拦一次直接跳转/旧菜单，给出明确提示
  const need=PAGE_PERM[r]||'record:read';
  const blocked=(r==='roles')?A.user.role!=='owner':!can(need);
  if(blocked){ p.innerHTML='<div class="card"><h2>⛔ 无权限</h2><div class="empty">当前角色未开启「'+esc(need)+'」，无法访问此栏目。<br>如需使用请联系超级管理员在「人员权限配置」中勾选。</div></div>'; return; }
  // 不再清空成白屏：保留上一页内容 + 顶部细进度条，接口回来直接替换
  let bar=$('#pageLoadBar');
  if(!bar){ bar=document.createElement('div'); bar.id='pageLoadBar'; bar.style.cssText='height:3px;background:linear-gradient(90deg,#2563eb,#38bdf8);width:0;transition:width .3s;position:sticky;top:0;z-index:5'; p.parentNode.insertBefore(bar,p); }
  bar.style.width='35%';
  const t0=Date.now();
  try{ await (PAGES[r]||pageDashboard)(); bar.style.width='100%'; setTimeout(()=>{bar.style.width='0';},250); }
  catch(e){ bar.style.width='0'; p.innerHTML='<div class="card"><div class="empty">页面加载失败：'+esc(e.message)+'</div></div>'; }
}
window.addEventListener('error',e=>console.error('[app]',e.message));
(async()=>{
  try{ const me=await api(nfUrl('/api/auth/me'),{silent:true}); A.user=me.user; A.license=me.license; A.roles=me.roles; A.statuses=me.statuses; A.fields=me.fields; applyNewflowStatuses(); A.dict=await api('/api/dict'); renderShell(); navigate('dashboard');
    if(A.license.needs_activation && !A.license.test_device) setTimeout(()=>showPayModal(),600);
    setTimeout(()=>checkOverdueAlert(false),900);
    setTimeout(()=>wsLiveStart(),400);
  }catch{ renderLogin(); }
  setTimeout(checkOverdueAlert,900);setTimeout(()=>{if(A.user)checkAppUpdate(false);},2600);
})();


// ================= 收费 / 危险操作（v1.1） =================
window.onPaidToggle=function(){
  const c=$('#f_is_paid'), box=$('#paid_box'); if(!c||!box)return;
  if(c.checked){
    const old=$('#f_fee_amount')?.value||'';
    // 内嵌收费输入（不弹模态遮罩，避免挡住保存按钮）
    box.innerHTML='<div class="grid g3" style="margin-top:8px">'
      +'<div class="field" style="margin:0"><label>收费金额（元）<span class="req">*</span></label><input id="f_fee_amount" type="number" min="0" step="0.01" placeholder="例如 199.00" value="'+esc(old)+'"></div>'
      +'<div class="field" style="margin:0"><label>收费类型</label><select id="f_pay_type"><option>维修费</option><option>配件费</option><option>检测费</option><option>其他</option></select></div>'
      +'<div class="field" style="margin:0"><label>说明（可选）</label><input id="f_pay_note" placeholder="如：更换主板"></div></div>'
      +'<div class="hint">勾选后请填写金额；保存后计入「自费维修统计」，未勾收费金额自动归零。</div>';
    setTimeout(()=>$('#f_fee_amount')?.focus(),50);
  } else {
    box.innerHTML='<span class="hint">默认关闭；勾选后需手动输入收费金额</span>';
    closeModal();
  }
};
window.cancelPaid=function(){ const c=$('#f_is_paid'); if(c)c.checked=false; window.onPaidToggle(); };
window.confirmPaid=function(){
  const a=Number($('#pay_amount')?.value||0);
  if(!(a>0)){ toast('请输入大于 0 的收费金额','err'); return; }
  const f=$('#f_fee_amount'); if(f)f.value=a;
  const note=$('#pay_note')?.value||'', type=$('#pay_type')?.value||'维修费';
  const r=$('#f_remark'); if(r&&note)r.value=(r.value?r.value+'；':'')+type+' ¥'+a+(note?'（'+note+'）':'');
  closeModal(); toast('已记录收费金额 ¥'+a,'ok');
};
// 编辑已有单据时回填金额
window.__paidInit=function(){ const c=$('#f_is_paid'); if(c&&c.checked){ const box=$('#paid_box'); if(box&&!$('#f_fee_amount'))box.innerHTML='<div class="field" style="margin:0"><label>收费金额（元）</label><input id="f_fee_amount" type="number" min="0" step="0.01" value="'+esc(window.__paidAmount||0)+'"></div>'; } };

// ---- 危险操作页：按单删除 + 清空数据 ----
async function pageDanger(){
  const owner=A.user?.role==='owner';
  let cfg={delete_enabled:false}; try{cfg=await api(nfUrl('/api/danger/config'),{silent:true});}catch{}
  $('#page').innerHTML='<div class="card" style="border-color:#fca5a5"><h2>⚠ 危险操作 <span class="badge err">仅超级管理员</span></h2>'
    +'<div class="hint">删除指定售后单、清空全部数据都是<b>不可恢复</b>的操作。执行前系统会要求答对安全确认题，并提示先备份；审计日志会记录每一次操作。</div></div>'
    +(owner?'':'<div class="card"><div class="empty">当前账号不是超级管理员，无法使用此页。删除功能默认对所有角色关闭。</div></div>')
    +'<div class="card"><h2>🗑 查询并删除指定售后单</h2>'
    +'<div class="toolbar"><input id="dg_q" style="flex:1;min-width:260px" placeholder="输入登记单号或 ID，例如 AS-20261112-0001"><button class="btn ghost" onclick="dangerFind()">查询</button></div>'
    +'<div class="hint">开启状态：<b id="dg_state">'+(cfg.delete_enabled?'已开启':'已关闭')+'</b> '
    +'<button class="btn ghost sm" onclick="dangerToggle()">'+(cfg.delete_enabled?'关闭删除功能':'开启删除功能')+'</button></div>'
    +'<div id="dg_rows" style="margin-top:12px"></div></div>'
    +'<div class="card" style="border-color:#fca5a5"><h2>🧹 清空全部数据</h2>'
    +'<div class="hint">会删除<b>全部售后登记、序列号、时间线</b>，不影响账号、商品型号/上家字典、授权状态。建议先在「数据导出」下载一份备份。</div>'
    +'<div class="toolbar" style="margin-top:10px"><button class="btn ghost" onclick="goExportPage()">⇩ 先去导出备份</button><button class="btn danger" onclick="dangerClearDlg()">清空数据…</button></div></div>';
}
window.dangerToggle=async()=>{ try{ const c=await api(nfUrl('/api/danger/config'),{silent:true}); await api('/api/danger/config',{method:'POST',body:{delete_enabled:!c.delete_enabled}}); toast('已更新删除功能开关','ok'); pageDanger(); }catch(e){} };
window.dangerFind=async()=>{
  const q=$('#dg_q')?.value?.trim(); if(!q){toast('请输入单号或 ID','err');return;}
  const r=await api('/api/records/find-for-delete?q='+encodeURIComponent(q)); window.__dgRows=r.rows||[];
  $('#dg_rows').innerHTML=(r.rows||[]).length?r.rows.map(x=>'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)">'
    +'<span class="mono">'+esc(x.record_no)+'</span><span>'+esc(x.product_model)+'</span><span>'+esc(x.repair_unit)+'</span><span class="pill">'+esc(x.status)+'</span>'
    +(x.is_paid?'<span class="badge warn">自费 ¥'+esc(x.fee_amount)+'</span>':'')+'<span style="flex:1"></span>'
    +'<button class="btn danger sm" onclick="dangerDeleteDlg('+x.id+')">删除此单</button></div>').join(''):'<div class="empty">未找到该售后单</div>';
};
window.dangerDeleteDlg=id=>{ const no=(window.__dgRows||[]).find(x=>x.id===id)?.record_no||String(id);
  modalPay('<div class="mh"><b>⚠ 删除售后单</b><button class="x" onclick="closeModal()">×</button></div>'
   +'<div class="mb"><div class="hint" style="color:var(--err)">即将删除 <b>'+esc(no)+'</b> 及其序列号、时间线，<b>不可恢复</b>。请先确认已备份。</div>'
   +'<div class="field" style="margin-top:12px"><label>安全确认题：请输入 <b>DELETE</b></label><input id="dg_answer" placeholder="DELETE"></div>'
   +'<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dg_understand" style="width:auto"> 我已了解此操作不可恢复，并已做好备份</label></div>'
   +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn danger" onclick="dangerDeleteDo('+id+')">确认删除</button></div>');
};
window.dangerDeleteDo=async(id)=>{
  try{ await api('/api/records/delete-safe',{method:'POST',body:{id,confirm:$('#dg_answer').value.trim(),iUnderstand:$('#dg_understand').checked}});
    closeModal(); toast('已删除该售后单','ok'); dangerFind();
  }catch(e){ toast(e.message||'删除失败','err'); }
};
window.dangerClearDlg=()=>{
  modalPay('<div class="mh"><b>⚠ 清空全部数据</b><button class="x" onclick="closeModal()">×</button></div>'
   +'<div class="mb"><div class="hint" style="color:var(--err);font-size:14px">这会删除<b>全部售后登记</b>，且<b>无法撤销</b>。仅超级管理员可操作。</div>'
   +'<div class="field" style="margin-top:12px"><label>安全确认题：请输入 <b>清空全部数据</b></label><input id="dc_answer" placeholder="清空全部数据"></div>'
   +'<label style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><input type="checkbox" id="dc_backup" style="width:auto"> 我已下载/保存数据备份</label>'
   +'<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dc_understand" style="width:auto"> 我已了解清空后数据不可恢复</label></div>'
   +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn danger" onclick="dangerClearDo()">确认清空</button></div>');
};
window.dangerClearDo=async()=>{
  try{ const r=await api('/api/danger/clear',{method:'POST',body:{answer:$('#dc_answer').value.trim(),backupConfirmed:$('#dc_backup').checked,iUnderstand:$('#dc_understand').checked}});
    closeModal(); toast('已清空 '+(r.deleted||0)+' 条登记','ok'); navigate('dashboard');
  }catch(e){ toast(e.message||'清空失败','err'); }
};
// ---- 自费维修统计页 ----
async function pagePaid(){
  const s=await api('/api/stats/paid',{noCache:true});
  const bm=(s.by_month||[]), bmo=(s.by_model||[]), rc=(s.recent||[]);
  const canEdit=can('record:update')||can('paid:read');
  const mh=bm.length?bm.map(x=>'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span>'+esc(x.month)+'</span><span>'+x.cnt+' 单 · <b>¥'+esc(x.amount)+'</b></span></div>').join(''):'<div class="empty">暂无数据</div>';
  const ph=bmo.length?bmo.map(x=>'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span>'+esc(x.name)+'</span><span>'+x.cnt+' 单 · <b>¥'+esc(x.amount)+'</b></span></div>').join(''):'<div class="empty">暂无数据</div>';
  const rh=rc.length?rc.map(x=>'<tr><td class="mono">'+esc(x.record_no)+'</td><td>'+esc(x.record_date)+'</td><td>'+esc(x.product_model)+'</td><td>'+esc(x.repair_unit)+'</td><td><b>¥'+esc(x.fee_amount)+'</b></td><td>'+esc(x.status)+'</td><td>'+(canEdit?'<button class="btn ghost sm" data-paid-edit="'+Number(x.id||0)+'" data-no="'+esc(x.record_no)+'" data-fee="'+esc(x.fee_amount||0)+'">编辑</button>':'—')+'</td></tr>').join(''):'<tr><td colspan="7" class="empty">暂无数据</td></tr>';
  $('#page').innerHTML='<div class="grid g4" style="margin-bottom:18px">'
   +'<div class="stat"><div class="k">自费维修单数</div><div class="v">'+(s.count||0)+'</div></div>'
   +'<div class="stat"><div class="k">收费金额合计</div><div class="v">¥'+(s.total||0)+'</div></div>'
   +'<div class="stat"><div class="k">平均单价</div><div class="v">¥'+(s.avg||0)+'</div></div>'
   +'<div class="stat"><div class="k">在修未返回</div><div class="v">'+(s.pending||0)+'</div></div></div>'
   +'<div class="grid g2"><div class="card"><h2>按月份</h2>'+mh+'</div><div class="card"><h2>按型号</h2>'+ph+'</div></div>'
   +'<div class="card"><h2>最近收费单据</h2><table><thead><tr><th>单号</th><th>日期</th><th>型号</th><th>送修单位</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>'+rh+'</tbody></table></div>';
  $$('[data-paid-edit]').forEach(btn=>btn.onclick=()=>openPaidEdit(Number(btn.dataset.paidEdit||0),btn.dataset.no||'',Number(btn.dataset.fee||0)));
 }
 window.openPaidEdit=function(id,no,fee){
  if(!id)return toast('缺少记录 ID，无法编辑','err');
  modal(modalHead('编辑收费信息 · '+esc(no))
   +'<div class="mb"><div class="field"><label><input id="pe_paid" type="checkbox" checked style="width:auto"> 计入自费维修</label><div class="hint">取消勾选后，该单不再计入自费维修统计，收费金额自动归零。</div></div>'
   +'<div class="field"><label>维修费金额（元）</label><input id="pe_fee" type="number" step="0.01" min="0" value="'+Number(fee||0)+'"></div>'
   +'<div class="hint">保存后会同步更新主记录与查询快照，任意检索/订单信息中的自费状态和金额也会一致。</div>'
   +'<div class="mf"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn" id="pe_save">保存</button></div></div>');
  const paid=$('#pe_paid'),inp=$('#pe_fee');
  if(paid)paid.onchange=()=>{if(!paid.checked){inp.value=0;inp.disabled=true}else inp.disabled=false};
  const save=async()=>{const isPaid=paid&&paid.checked?1:0,amount=Number((inp&&inp.value)||0);if(isPaid&&(!Number.isFinite(amount)||amount<0))return toast('维修费金额无效','err');try{const res=await api('/api/stats/paid/edit',{method:'POST',body:{id,is_paid:isPaid,fee_amount:isPaid?amount:0}});if(!res||res.ok===false)throw new Error(res?.reason||'保存失败');closeModal();toast('收费信息已更新','ok');invalidateCache();await pagePaid()}catch(e){toast(e.message||'保存失败','err')}};
  const btn=$('#pe_save');if(btn)btn.onclick=save;
};

// 路由注册（追加到 PAGES / 导航）
try{
  PAGES.danger=pageDanger; PAGES.paid=pagePaid;
}catch(e){}

window.goExportPage=function(){navigate('export');};


window.setDateFromPick=function(id){ const p=document.getElementById(id+'_pick'), t=document.getElementById(id); if(p&&t)t.value=p.value||''; };
window.clearDate=function(id){ const t=document.getElementById(id), p=document.getElementById(id+'_pick'); if(t)t.value=''; if(p)p.value=''; };
window.openDatePick=function(id){ const p=document.getElementById(id+'_pick'); if(!p)return; if(p.showPicker)try{p.showPicker();}catch{p.click();} else p.click(); };


window.clearAudit=async()=>{
  if(A.user?.role!=='owner'){ toast('仅超级管理员可清空日志','err'); return; }
  if(!confirm('确定清空全部操作日志？此操作不可恢复。')) return;
  try{ await api('/api/audit',{method:'DELETE'}); toast('日志已清空','ok'); pageAudit(); }
  catch(e){ toast(e.message||'清空失败','err'); }
};


window.__CUSTOM_LOGO=undefined;
function bindLogoUpload(){
  const f=document.getElementById('s_logo_file');if(!f)return;
  f.onchange=()=>{
    const file=f.files&&f.files[0];if(!file)return;
    if(file.size>200*1024){toast('图片请控制在 200KB 以内','err');f.value='';return;}
    const r=new FileReader();r.onload=()=>{window.__CUSTOM_LOGO=String(r.result||'');const p=document.getElementById('s_logo_preview');if(p)p.src=window.__CUSTOM_LOGO;};
    r.readAsDataURL(file);
  };
}
window.clearCustomLogo=()=>{window.__CUSTOM_LOGO='';setBrandLogo('');if(A.loginBrand)A.loginBrand.logo='';const p=document.getElementById('s_logo_preview');if(p)p.src='/logo.png';toast('点「保存设置」后恢复默认','ok');};


window.shipCoOther=()=>{const s=$('#sh_bco'),o=$('#sh_bco_other');if(s&&o)o.style.display=s.value==='其他'?'block':'none';};
window.shipCoValue=()=>{const s=$('#sh_bco');if(!s)return '';return s.value==='其他'?($('#sh_bco_other')?.value||'其他'):s.value;};
window.shipPage=d=>{SHIP_PAGE=Math.max(1,SHIP_PAGE+d);SHIP_ALL=false;pageWarranty();};
window.shipToggleAll=()=>{SHIP_ALL=!SHIP_ALL;SHIP_PAGE=1;pageWarranty();};
window.auditShip=async(id,action)=>{
  const why=action==='reject'?prompt('拒绝原因（可留空）'):'';if(action==='reject'&&why===null)return;
  await api('/api/warranty/shipping/'+id+'/audit',{method:'POST',body:{action,remark:why||''}});
  toast(action==='reject'?'已拒绝':'已通过','ok');pageWarranty();
};


window.delShip=async id=>{if(!can('warranty:shipdelete')){toast('无删除权限','err');return;}if(!confirm('确定删除这条用户寄送单？不可恢复'))return;try{await api('/api/warranty/shipping/'+id,{method:'DELETE'});toast('已删除','ok');pageWarranty();}catch(e){toast(e.message||'删除失败','err');}};


window.saveOnsiteConfig=async()=>{
  const b={enabled:$('#wo_enabled').value==='1',notice:$('#wo_notice').value};
  try{await api('/api/warranty/onsite/config',{method:'POST',body:b});invalidateCache();toast('上门设置已保存','ok');await pageWarrantySettings();}catch(e){toast(e.message||'保存失败','err');}
};


function mediaHtml(md){
  if(!md.length)return '<br>附件：无';
  return '<div style="margin-top:10px"><b>附件（点击可预览 / 下载）</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">'
    +md.map(x=>{const u=esc(x.data||'#'),n=esc(x.name||'附件'),t=String(x.type||'');
      if(t.startsWith('image/'))return '<a href="'+u+'" download="'+n+'" target="_blank"><img src="'+u+'" alt="'+n+'" style="width:110px;height:90px;object-fit:cover;border:1px solid #cbd5e1;border-radius:8px"></a>';
      if(t.startsWith('video/'))return '<video src="'+u+'" controls style="width:220px;max-height:160px;border:1px solid #cbd5e1;border-radius:8px"></video>';
      return '<a class="btn ghost sm" href="'+u+'" download="'+n+'">⬇ '+n+'</a>';
    }).join('')+'</div></div>';
}

// ===== 右下角实时保修单提醒（无需刷新 / 无需进安心保） =====
let WS_LIVE_ID=Number(localStorage.getItem('wuyou_ws_last')||0);
window.wsLiveShow=async()=>{
  if(!A.user)return;
  let d;try{d=await api(nfUrl('/api/warranty/shipping/latest'),{silent:true});}catch{return;}
  const seen=Math.max(WS_LIVE_ID,Number(localStorage.getItem('wuyou_ws_last')||0));
  if(!d||!d.id||d.id<=seen)return;
  WS_LIVE_ID=d.id;localStorage.setItem('wuyou_ws_last',String(d.id));
  let box=$('#wsLive');
  if(!box){box=document.createElement('div');box.id='wsLive';document.body.appendChild(box);}
  const kind=d.kind==='onsite'?'上门保修':'保修寄送';
  box.innerHTML='<button class="ws-x" onclick="wsLiveHide()" title="关闭">×</button>'
    +'<div class="ws-head"><div class="ws-ic">📦</div><div><div class="ws-title">🔔 新的'+kind+'单 #'+d.id+'</div><div class="ws-sub">有新的售后单据待处理，请及时跟进</div></div></div>'
    +'<div class="ws-body"><b>'+esc(d.model||'设备')+'</b> · '+esc(d.user_name||'用户')+'<br>当前待处理 <b>'+d.pending+'</b> 单</div>'
    +'<div class="ws-foot"><button class="btn" onclick="wsLiveGo()">去处理</button><button class="btn ghost" onclick="wsLiveHide()">知道了</button></div>';
  box.style.display='block';
  setTimeout(()=>{if(box)box.style.display='none';},30000);
};
window.wsLiveHide=()=>{const b=$('#wsLive');if(b)b.style.display='none';};
window.wsLiveGo=()=>{wsLiveHide();navigate('warranty');};
window.wsLiveStart=()=>{clearInterval(window.__wsLiveTimer);window.wsLiveShow();window.__wsLiveTimer=setInterval(()=>{if(document.visibilityState==='visible'&&A.user)wsLiveShow();},6000);};
window.addEventListener('storage',e=>{if(e.key==='wuyou_ws_ping'&&A.user)wsLiveShow();});



window.devPage=d=>{DEV_PAGE=Math.max(1,DEV_PAGE+d);DEV_ALL=false;pageWarrantySettings();};
window.devToggleAll=()=>{DEV_ALL=!DEV_ALL;DEV_PAGE=1;pageWarrantySettings();};
window.devpToggle=btn=>{const box=btn.closest('.devp'),sp=box.querySelector('.devp-short');if(!box||!sp)return;
  const full=box.dataset.full||'',one=full.replace(/\s+/g,' '),open=box.dataset.open==='1';
  sp.textContent=open?(one.slice(0,30)+(one.length>30?'…':'')):full;
  sp.style.cssText=open?'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:140px;vertical-align:middle':'white-space:pre-wrap;word-break:break-all;display:inline;max-width:none';
  btn.textContent=open?'展开':'收起';box.dataset.open=open?'0':'1';};

// ================= 检查更新 / 一键更新（请求 ID 防误判）=================
window.APP_VERSION='';
window.checkAppUpdate=async(manual)=>{
  if(!A.user)return;
  if(!manual&&localStorage.getItem('wuyou_update_req'))return; // 已有后台更新任务，不弹新版本重复提示
  let cur={version:'1.0.0',channel:'docker'};try{cur=await api(nfUrl('/api/app/version'),{silent:true});}catch{}
  window.APP_VERSION=cur.version||'1.0.0';window.APP_CHANNEL=cur.channel||'';
  // 云端是 Worker+Supabase，不是 Docker 容器：不进入 NAS 的一键更新流程
  if(window.APP_CHANNEL==='cloud'||window.APP_CHANNEL==='bare'){
    const el0=$('#appVersion');if(el0)el0.textContent='v'+window.APP_VERSION;
    if(manual)toast(window.APP_CHANNEL==='bare'?'裸机版请用服务器上的 update-bare.sh 更新；不会拉 Docker 镜像':'云端版由服务端统一部署，无需更新；按 Ctrl+F5 刷新即可看到最新版','ok');
    return;
  }
  const el=$('#appVersion');if(el)el.textContent='v'+window.APP_VERSION;
  let latest;try{const rr=await fetch('https://xlry.cc.cd/api/app/latest-version?t='+Date.now());latest=await rr.json();}catch{}
  if(!latest||!latest.ok){if(manual)toast('暂时无法获取最新版本','warn');return;}
  const cmp=(a,b)=>{const pa=String(a||'').split(/[.\-]/).map(x=>parseInt(x)||0),pb=String(b||'').split(/[.\-]/).map(x=>parseInt(x)||0);for(let i=0;i<4;i++){if((pa[i]||0)!==(pb[i]||0))return (pa[i]||0)-(pb[i]||0);}return 0;};
  if(cmp(latest.version,window.APP_VERSION)<=0){if(manual)toast('已是最新版本 v'+window.APP_VERSION,'ok');return;}
  const key='wuyou_update_skip_'+latest.version;if(!manual&&sessionStorage.getItem(key))return;
  modal('<div class="mh" style="padding:12px 14px"><b style="font-size:14px">🔔 新版本 v'+esc(latest.version)+'</b><button class="x" onclick="closeModal()">×</button></div>'
    +'<div style="padding:10px 14px"><div class="hint" style="font-size:12px">当前 v'+esc(window.APP_VERSION)+' → v'+esc(latest.version)+' · 自动拉镜像并重建，数据不丢</div>'
    +'<div id="updMsg" class="hint" style="margin-top:6px;font-size:12px;color:var(--ok,#059669)">更新中可刷新或关闭，任务在后台继续。</div></div>'
    +'<div class="mf" style="padding:8px 14px"><button class="btn ghost sm" onclick="sessionStorage.setItem(\''+key+'\',\'1\');closeModal()">关闭</button><button class="btn ghost sm" onclick="closeModal();toast(\'已稍后提醒\',\'ok\')">稍后</button>'
    +'<button class="btn sm" id="updGo" onclick="doAppUpdate()">立即更新</button></div>');
};
window.doAppUpdate=async()=>{
  if(window.APP_CHANNEL==='cloud'){toast('云端版由服务端统一更新，无需操作','ok');closeModal();return;}
  const btn=$('#updGo'),msg=$('#updMsg');
  if(btn){btn.disabled=true;btn.textContent='更新中…';}
  if(msg){msg.style.color='';msg.textContent='已提交更新请求，等待宿主机自动下载并重建（约 1 分钟）…';}
  let r;try{r=await api('/api/app/update',{method:'POST'});}catch(e){r={ok:false,reason:e.message||'更新请求失败'};}
  if(!r||r.ok===false){if(msg){msg.style.color='var(--err,#dc2626)';msg.textContent=r?.reason||'无法提交更新请求';}if(btn){btn.disabled=false;btn.textContent='立即更新';}return;}
  const reqId=r.requestId||'';if(msg)msg.textContent=r.message||'更新进行中…';
  let n=0;const t=setInterval(async()=>{
    n++;let st=null;
    try{const rr=await fetch('/api/app/update/status?t='+Date.now(),{cache:'no-store'});st=await rr.json();}catch{}
    if(st&&st.ok===true&&!st.pending&&!st.requestId){clearInterval(t);location.reload();return;} // sock 自动重建兜底
    if(st&&st.requestId&&reqId&&st.requestId!==reqId){ // 旧结果，忽略，继续等本次
      if(msg)msg.textContent='等待本次更新结果…';
    } else if(st&&st.ok===true&&!st.pending){
      clearInterval(t);if(msg)msg.textContent='✅ 更新完成，正在刷新…';setTimeout(()=>location.reload(),800);return;
    } else if(st&&st.ok===false){
      clearInterval(t);if(msg){msg.style.color='var(--err,#dc2626)';msg.textContent='❌ '+(st.msg||'更新失败，旧版本保持运行');}if(btn){btn.disabled=false;btn.textContent='重试更新';}return;
    } else if(msg){msg.textContent=st?.msg||'宿主机正在下载并重建容器（页面短暂中断属正常）…';}
    if(n>80){clearInterval(t);if(msg)msg.textContent='更新仍在进行，请稍后手动 Ctrl+F5 刷新';if(btn){btn.disabled=false;btn.textContent='立即更新';}}
  },3000);
};
window.copyUpdateCmd=window.doAppUpdate;

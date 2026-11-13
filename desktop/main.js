const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path'), fs = require('fs');
const store = path.join(app.getPath('userData'), 'config.json');
let win;
// 单实例：低配机器多次点图标不反复拉起 Electron
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function load(){ try{ return JSON.parse(fs.readFileSync(store,'utf8')); }catch(e){ return {}; } }
function save(o){ fs.writeFileSync(store, JSON.stringify(o), {mode:0o600}); }
function create(){
  win = new BrowserWindow({ width:1360, height:860, minWidth:960, minHeight:620,
    title:'无忧商服通', icon:path.join(__dirname,'assets/icon.png'),
    show:false, backgroundColor:'#f8fafc',
    webPreferences:{ preload:path.join(__dirname,'renderer/preload.js'), contextIsolation:true, nodeIntegration:false,
      backgroundThrottling:false, spellcheck:false } });
  win.setMenuBarVisibility(false);
  // 先显示空白窗口再加载，避免「点图标半天没反应」
  win.once('ready-to-show',()=>{ win.show(); win.focus(); });
  win.loadFile(path.join(__dirname,'renderer/login.html'));
}
app.whenReady().then(create);
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
ipcMain.handle('cfg-get',()=>{
  const c=load();
  return {host:c.host||'',user:c.user||'',https:!!c.https,remember:!!c.remember,hasSaved:!!(c.pass&&c.remember)};
});
async function doConnect(o,saveIt){
  const h=String(o.host||'').trim().replace(/^https?:\/\//,'').replace(/\/+$/,'');
  if(!h)return {ok:false,reason:'请填写服务器地址'};
  const base=(o.https?'https://':'http://')+h;
  const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:o.user,password:o.pass})});
  const j=await r.json();
  if(!j.ok)return {ok:false,reason:j.reason||('HTTP '+r.status)};
  const cfg={host:h,user:o.user,https:!!o.https,base};
  if(saveIt&&o.remember){ cfg.remember=true; cfg.pass=o.pass; }
  else { cfg.remember=false; }
  save(cfg);
  win.loadURL(base+'/');
  return {ok:true};
}
ipcMain.handle('connect',async(e,o)=>{ try{ return await doConnect(o,true); }catch(err){ return {ok:false,reason:'连接失败：'+err.message}; } });
ipcMain.handle('auto-login',async()=>{
  const c=load();
  if(!c.remember||!c.pass||!c.host)return {ok:false,reason:'无已保存凭据'};
  try{ return await doConnect({host:c.host,user:c.user,pass:c.pass,https:c.https,remember:true},true); }
  catch(e){ return {ok:false,reason:String(e.message)}; }
});
ipcMain.handle('forget',()=>{ save({}); return {ok:true}; });
ipcMain.handle('back-to-login',()=>win.loadFile(path.join(__dirname,'renderer/login.html')));

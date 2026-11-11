const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path'), fs = require('fs');
const store = path.join(app.getPath('userData'), 'config.json');
let win;
function load(){ try{ return JSON.parse(fs.readFileSync(store,'utf8')); }catch(e){ return {}; } }
function save(o){ fs.writeFileSync(store, JSON.stringify(o), {mode:0o600}); }
function create(){
  win = new BrowserWindow({ width:1360, height:860, minWidth:960, minHeight:620,
    title:'无忧售后助手', icon:path.join(__dirname,'assets/icon.png'),
    webPreferences:{ preload:path.join(__dirname,'renderer/preload.js'), contextIsolation:true, nodeIntegration:false } });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname,'renderer/login.html'));
}
app.whenReady().then(create);
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
ipcMain.handle('cfg-get',()=>load());
ipcMain.handle('connect',async(e,o)=>{
  const h = String(o.host||'').trim().replace(/^https?:\/\//,'').replace(/\/+$/,'');
  if(!h) return {ok:false,reason:'请填写服务器地址'};
  const base = (o.https?'https://':'http://')+h;
  try{
    const r = await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:o.user,password:o.pass})});
    const j = await r.json();
    if(!j.ok) return {ok:false,reason:j.reason||('HTTP '+r.status)};
    save({host:h,user:o.user,base,https:!!o.https});
    win.loadURL(base+'/');
    return {ok:true};
  }catch(err){ return {ok:false,reason:'连接失败：'+err.message}; }
});
ipcMain.handle('back-to-login',()=>win.loadFile(path.join(__dirname,'renderer/login.html')));

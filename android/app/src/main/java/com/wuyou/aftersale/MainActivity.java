package com.wuyou.aftersale;
import android.content.*; import android.os.*; import android.view.View; import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import org.json.*; import java.net.*; import java.io.*; import java.util.concurrent.*;
public class MainActivity extends AppCompatActivity {
  private EditText etHost, etUser, etPass; private CheckBox cbHttps; private TextView tvMsg;
  private SharedPreferences sp; private final ExecutorService ex=Executors.newSingleThreadExecutor();
  @Override protected void onCreate(Bundle b){ super.onCreate(b); setContentView(R.layout.activity_main);
    etHost=findViewById(R.id.etHost); etUser=findViewById(R.id.etUser); etPass=findViewById(R.id.etPass);
    cbHttps=findViewById(R.id.cbHttps); tvMsg=findViewById(R.id.tvMsg);
    sp=getSharedPreferences("wuyou",MODE_PRIVATE);
    etHost.setText(sp.getString("host","")); etUser.setText(sp.getString("user",""));
    cbHttps.setChecked(sp.getBoolean("https",false));
    findViewById(R.id.btnConnect).setOnClickListener(v->connect());
  }
  private String baseUrl(){
    String h=etHost.getText().toString().trim().replaceAll("^https?://","").replaceAll("/+$","");
    if(h.isEmpty())return "";
    return (cbHttps.isChecked()?"https://":"http://")+h;
  }
  private void connect(){
    final String base=baseUrl(); if(base.isEmpty()){tvMsg.setText("请填写服务器地址");return;}
    final String u=etUser.getText().toString().trim(), p=etPass.getText().toString();
    tvMsg.setText("正在连接…");
    ex.execute(()->{
      String result=post(base+"/api/auth/login","{\"username\":\""+esc(u)+"\",\"password\":\""+esc(p)+"\"}");
      runOnUiThread(()->{
        try{
          JSONObject j=new JSONObject(result);
          if(!j.optBoolean("ok",false)){ tvMsg.setText(j.optString("reason","账号或密码错误")); return; }
          sp.edit().putString("host",etHost.getText().toString().trim()).putString("user",u)
            .putBoolean("https",cbHttps.isChecked()).putString("base",base).apply();
          Intent i=new Intent(this,WebActivity.class); i.putExtra("base",base); startActivity(i); finish();
        }catch(Exception e){ tvMsg.setText("连接失败："+e.getMessage()); }
      });
    });
  }
  private String esc(String s){return s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n");}
  private String post(String urlStr,String body){
    HttpURLConnection c=null;
    try{ URL u=new URL(urlStr); c=(HttpURLConnection)u.openConnection(); c.setRequestMethod("POST");
      c.setRequestProperty("Content-Type","application/json"); c.setConnectTimeout(8000); c.setReadTimeout(8000);
      c.setDoOutput(true); c.getOutputStream().write(body.getBytes("UTF-8"));
      int code=c.getResponseCode(); InputStream in=code>=200&&code<300?c.getInputStream():c.getErrorStream();
      ByteArrayOutputStream o=new ByteArrayOutputStream(); byte[] buf=new byte[4096]; int n;
      while((n=in.read(buf))>0)o.write(buf,0,n); return o.toString("UTF-8");
    }catch(Exception e){ return "{\"ok\":false,\"reason\":\""+e.getMessage()+"\"}"; }
    finally{ if(c!=null)c.disconnect(); }
  }
}

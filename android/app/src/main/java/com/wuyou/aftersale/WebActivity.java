package com.wuyou.aftersale;
import android.annotation.SuppressLint; import android.os.*; import android.webkit.*;
import android.app.Activity;
public class WebActivity extends Activity {
  @SuppressLint("SetJavaScriptEnabled")
  @Override protected void onCreate(Bundle b){ super.onCreate(b);
    String base=getIntent().getStringExtra("base");
    WebView w=new WebView(this); setContentView(w);
    WebSettings s=w.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW); s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(true); s.setSupportZoom(false); s.setCacheMode(WebSettings.LOAD_DEFAULT);
    w.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){ return false; }
      @Override public void onReceivedHttpAuthRequest(WebView v,HttpAuthHandler h,String host,String realm){ h.cancel(); }
    });
    w.setWebChromeClient(new WebChromeClient());
    // 登录 Cookie 由服务端 Set-Cookie 写入 WebView，直接打开即处于登录态
    w.loadUrl(base+"/");
  }
  @Override public void onBackPressed(){ WebView w=(WebView)getWindow().getDecorView().findViewById(android.R.id.content);
    // 简单处理：返回键交给网页或退出
    super.onBackPressed(); }
}

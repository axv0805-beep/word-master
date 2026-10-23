package com.cimiao.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

public class MainActivity extends Activity {

    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    /** 线上版本清单：应用内更新时读取（Java 侧直接请求，避开 WebView 的跨域限制） */
    private static final String VERSION_URL =
            "https://axv0805-beep.github.io/word-master/version.json";
    private static final int BG = Color.parseColor("#F1FAF3");

    private WebView webView;
    private TextToSpeech tts;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(BG);
        window.setNavigationBarColor(BG);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        webView = new WebView(this);
        webView.setBackgroundColor(BG);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        settings.setTextZoom(100);

        // 前端资源全部打进 APK 的 assets/www，通过虚拟 https 源加载，
        // 避免 file:// 下 ES module 与 fetch 被 CORS 拦截。
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });

        // Android WebView 没有 Web Speech API，用系统 TextToSpeech 兜底网页里的发音
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
            }
        });
        webView.addJavascriptInterface(new SpeechBridge(), "AndroidSpeech");
        // 应用内更新：网页读站点上的 version.json，比 versionCode 之后调 installUpdate
        webView.addJavascriptInterface(new AppBridge(), "AndroidApp");

        setContentView(webView);
        webView.loadUrl(START_URL);
    }

    /** 暴露给网页的发音桥：window.AndroidSpeech */
    private class SpeechBridge {
        @JavascriptInterface
        public void speak(String text, String lang, float rate) {
            runOnUiThread(() -> {
                if (tts == null || text == null || text.isEmpty()) return;
                tts.setLanguage("en-GB".equals(lang) ? Locale.UK : Locale.US);
                tts.setSpeechRate(rate > 0 ? rate : 0.9f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "word");
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                if (tts != null) tts.stop();
            });
        }
    }

    /** 暴露给网页的应用信息桥与更新器：window.AndroidApp */
    private class AppBridge {
        @JavascriptInterface
        public int versionCode() {
            try {
                PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                        ? (int) info.getLongVersionCode()
                        : info.versionCode;
            } catch (PackageManager.NameNotFoundException e) {
                return 0;
            }
        }

        @JavascriptInterface
        public String versionName() {
            try {
                PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
                return info.versionName == null ? "" : info.versionName;
            } catch (PackageManager.NameNotFoundException e) {
                return "";
            }
        }

        @JavascriptInterface
        public void checkUpdate() {
            new Thread(() -> {
                String body = null;
                try {
                    HttpURLConnection conn = (HttpURLConnection) new URL(VERSION_URL).openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(20000);
                    conn.connect();
                    if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        throw new IllegalStateException("HTTP " + conn.getResponseCode());
                    }
                    StringBuilder sb = new StringBuilder();
                    try (InputStream in = conn.getInputStream()) {
                        byte[] buffer = new byte[4096];
                        int read;
                        while ((read = in.read(buffer)) > 0) sb.append(new String(buffer, 0, read, "UTF-8"));
                    }
                    body = sb.toString();
                } catch (Exception ignored) {
                    // 落到下面的错误回调
                }

                if (body == null) {
                    evaluate("window.__updateError && window.__updateError()");
                    return;
                }
                try {
                    org.json.JSONObject info = new org.json.JSONObject(body);
                    if (info.optInt("versionCode", 0) > versionCode()) {
                        evaluate("window.__updateAvailable && window.__updateAvailable("
                                + org.json.JSONObject.quote(body) + ")");
                    } else {
                        evaluate("window.__updateNone && window.__updateNone()");
                    }
                } catch (Exception e) {
                    evaluate("window.__updateError && window.__updateError()");
                }
            }).start();
        }

        private void evaluate(String js) {
            runOnUiThread(() -> {
                if (webView != null) webView.evaluateJavascript(js, null);
            });
        }

        @JavascriptInterface
        public void installUpdate(final String url) {
            if (url == null || url.isEmpty()) return;
            runOnUiThread(() -> Toast.makeText(MainActivity.this, "开始下载更新…", Toast.LENGTH_SHORT).show());
            new Thread(() -> {
                try {
                    File apk = new File(getCacheDir(), "update.apk");
                    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.connect();
                    if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        throw new IllegalStateException("HTTP " + conn.getResponseCode());
                    }
                    try (InputStream in = conn.getInputStream();
                         FileOutputStream out = new FileOutputStream(apk)) {
                        byte[] buffer = new byte[8192];
                        int read;
                        while ((read = in.read(buffer)) > 0) out.write(buffer, 0, read);
                    }
                    runOnUiThread(() -> launchInstaller(apk));
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(
                            MainActivity.this, "更新下载失败：" + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }
    }

    private void launchInstaller(File apk) {
        // Android 8+ 需要用户允许「安装未知应用」，否则安装器不会弹出来
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            Toast.makeText(this, "请先允许词芽安装应用，然后点「检查更新」重试", Toast.LENGTH_LONG).show();
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())));
            } catch (Exception ignored) {
                // 部分机型没有这个设置页，忽略
            }
            return;
        }
        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}

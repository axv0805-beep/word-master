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
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {

    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    /** 线上版本清单：应用内更新时读取（Java 侧直接请求，避开 WebView 的跨域限制） */
    private static final String VERSION_URL =
            "https://axv0805-beep.github.io/word-master/version.json";
    private static final int BG = Color.parseColor("#F1FAF3");

    private WebView webView;
    private TextToSpeech tts;
    /** 防止连点「立即更新」开出两个下载线程抢同一个文件 */
    private final AtomicBoolean updateRunning = new AtomicBoolean(false);
    /** 系统栏实际占用的像素高度，读取后换算成 CSS px 推给网页 */
    private int statusInsetPx = 0;
    private int navInsetPx = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        // 状态栏透明、页面内容延伸到状态栏下方：顶部不再出现一条与主题不符的白带，
        // 页面自己的渐变背景会一直铺到屏幕最上沿。
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        applyBarIcons(true);

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
        // 状态栏区域交给页面自行铺满；键盘弹出时用 padding 压小 WebView 视口，
        // 等价于 adjustResize（edge-to-edge 下系统不再自动 resize）。
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            statusInsetPx = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            navInsetPx = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
            int ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
            webView.setPadding(0, 0, 0, Math.max(0, ime));
            pushSafeArea();
            return WindowInsetsCompat.CONSUMED;
        });
        webView.loadUrl(START_URL);
    }

    /** 状态栏/导航栏图标明暗：浅色主题要深色图标，深色主题要浅色图标 */
    private void applyBarIcons(boolean darkIcons) {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(darkIcons);
        controller.setAppearanceLightNavigationBars(darkIcons);
    }

    /** 把系统栏高度（CSS px）推给网页，网页据此设置 --safe-top / --safe-bottom */
    private void pushSafeArea() {
        float density = getResources().getDisplayMetrics().density;
        int top = Math.round(statusInsetPx / density);
        int bottom = Math.round(navInsetPx / density);
        webView.post(() -> {
            if (webView == null) return;
            webView.evaluateJavascript(
                    "window.__setSafeArea && window.__setSafeArea(" + top + "," + bottom + ")", null);
        });
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
        /** 换主题时同步状态栏/导航栏图标的明暗（true = 深色图标） */
        @JavascriptInterface
        public void setBarIcons(final boolean darkIcons) {
            runOnUiThread(() -> MainActivity.this.applyBarIcons(darkIcons));
        }

        @JavascriptInterface
        public int statusBarHeight() {
            return Math.round(statusInsetPx / getResources().getDisplayMetrics().density);
        }

        @JavascriptInterface
        public int navigationBarHeight() {
            return Math.round(navInsetPx / getResources().getDisplayMetrics().density);
        }

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
            if (!updateRunning.compareAndSet(false, true)) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "更新正在下载中…", Toast.LENGTH_SHORT).show());
                return;
            }
            new Thread(() -> {
                File apk = new File(getCacheDir(), "update.apk");
                String lastError = "网络连接失败";
                try {
                    // 手机网络访问 GitHub Pages 经常抖动，重试三次并校验大小，避免拿到半个文件
                    for (int attempt = 1; attempt <= 3; attempt++) {
                        final int current = attempt;
                        try {
                            emitUpdateProgress("downloading", 0, -1, current, null);
                            downloadApk(url, apk, (received, total) -> {
                                // 节流：真实网络里 16KB 一次回调太密，合并到 ~6 次/秒足够顺滑
                                long now = System.currentTimeMillis();
                                boolean finished = total > 0 && received >= total;
                                if (!finished && now - lastProgressAt < 160) return;
                                lastProgressAt = now;
                                emitUpdateProgress("downloading", received, total, current, null);
                            });
                            emitUpdateProgress("verifying", apk.length(), apk.length(), current, null);
                            final File ready = apk;
                            runOnUiThread(() -> {
                                String blocked = launchInstaller(ready);
                                if (blocked == null) {
                                    emitUpdateProgress("done", ready.length(), ready.length(), current, null);
                                    Toast.makeText(MainActivity.this, "下载完成，正在打开安装…", Toast.LENGTH_SHORT).show();
                                } else {
                                    emitUpdateProgress("failed", ready.length(), ready.length(), current, blocked);
                                }
                            });
                            return;
                        } catch (Exception e) {
                            lastError = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                        }
                    }
                    final String message = lastError;
                    emitUpdateProgress("failed", 0, -1, 3, message);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this,
                            "更新下载失败：" + message + "。可以点「用浏览器下载」再试一次",
                            Toast.LENGTH_LONG).show());
                } finally {
                    updateRunning.set(false);
                }
            }).start();
        }

        /** 最近一次推送下载进度的时间，用来给网页节流 */
        private long lastProgressAt = 0;

        /**
         * 把下载进度推给网页：window.__updateProgress(JSON 字符串)。
         * 所有字段都是数字或固定文案，用 JSONObject.quote 包一层，避免消息里的引号把脚本拼坏。
         */
        private void emitUpdateProgress(String phase, long received, long total, int attempt, String message) {
            org.json.JSONObject json = new org.json.JSONObject();
            try {
                json.put("phase", phase);
                json.put("received", received);
                json.put("total", total);
                json.put("attempt", attempt);
                if (message != null) json.put("message", message);
            } catch (Exception e) {
                return;
            }
            evaluate("window.__updateProgress && window.__updateProgress("
                    + org.json.JSONObject.quote(json.toString()) + ")");
        }

        /** 用系统浏览器打开下载地址：浏览器有断点续传，网络差的时候更稳 */
        @JavascriptInterface
        public void openInBrowser(final String url) {
            if (url == null || url.isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "没有可用的浏览器", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    /** 下载进度回调：已下载字节数与总字节数（-1 = 服务器没给 Content-Length） */
    private interface DownloadListener {
        void onProgress(long received, long total);
    }

    /** 下载并按 Content-Length 校验，半截文件直接判失败，交给上层重试 */
    private void downloadApk(String url, File apk, DownloadListener listener) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(20000);
        conn.setReadTimeout(60000);
        conn.setInstanceFollowRedirects(true);
        conn.setRequestProperty("Accept-Encoding", "identity");
        try {
            int code = conn.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) throw new IllegalStateException("HTTP " + code);
            long expected = conn.getContentLengthLong();
            long total = 0;
            long lastNotified = 0;
            try (InputStream in = conn.getInputStream();
                 FileOutputStream out = new FileOutputStream(apk)) {
                byte[] buffer = new byte[16384];
                int read;
                while ((read = in.read(buffer)) > 0) {
                    out.write(buffer, 0, read);
                    total += read;
                    // 每 256 KB 回调一次，再交给上层按时间节流，避免频繁跨线程打 JS
                    if (listener != null && total - lastNotified >= 262144) {
                        lastNotified = total;
                        listener.onProgress(total, expected);
                    }
                }
            }
            if (expected > 0 && total != expected) throw new IllegalStateException("下载不完整");
            if (total < 100_000 || !looksLikeApk(apk)) throw new IllegalStateException("文件不是安装包");
            // 校验通过才报 100%，避免进度条先满格再报错
            if (listener != null) listener.onProgress(total, expected > 0 ? expected : total);
        } finally {
            conn.disconnect();
        }
    }

    /** APK 本质是 zip，开头必须是 PK；防止把错误页当成安装包 */
    private boolean looksLikeApk(File file) {
        try (java.io.FileInputStream in = new java.io.FileInputStream(file)) {
            byte[] head = new byte[2];
            return in.read(head) == 2 && head[0] == 'P' && head[1] == 'K';
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 拉起系统安装器（覆盖安装，学习数据保留）。
     *
     * @return null 表示安装器已经拉起来；否则返回要展示给用户的原因（如缺少「安装未知应用」权限）
     */
    private String launchInstaller(File apk) {
        // Android 8+ 需要用户允许「安装未知应用」，否则安装器不会弹出来
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            Toast.makeText(this, "请先允许词芽安装应用，然后点「重新下载」重试", Toast.LENGTH_LONG).show();
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())));
            } catch (Exception ignored) {
                // 部分机型没有这个设置页，忽略
            }
            return "需要先允许「词芽」安装应用";
        }
        try {
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apk);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            return null;
        } catch (Exception e) {
            return "没有可用的安装器";
        }
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

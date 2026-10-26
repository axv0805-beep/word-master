package com.cimiao.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {

    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    /** 线上版本清单：应用内更新时读取（Java 侧直接请求，避开 WebView 的跨域限制） */
    private static final String VERSION_URL =
            "https://axv0805-beep.github.io/word-master/version.json";
    private static final int BG = Color.parseColor("#F1FAF3");

    /** 分段下载：单连接被限速时多开几条连接通常能快不少 */
    private static final int SEGMENT_COUNT = 4;
    /** 小于这个体积就没必要分段，分成 4 份反而更慢 */
    private static final long PARALLEL_MIN_BYTES = 1024L * 1024L;
    /** 单次读写缓冲：16KB 在移动网络上太碎，64KB 更稳 */
    private static final int DOWNLOAD_BUFFER = 64 * 1024;
    /** 每段最多重试几次（每次都从已下载的位置继续，不会从头再来） */
    private static final int SEGMENT_ATTEMPTS = 6;
    private static final String UPDATE_PREFS = "update-download";
    /** 听力材料：句子之间插静音，避免两句黏在一起 */
    private static final long SPEECH_GAP_MS = 520;
    /** 整段播完时插一个空句，用它来通知网页播放结束 */
    private static final String SPEECH_END_ID = "speech-end";

    private WebView webView;
    private TextToSpeech tts;
    /** 用户可能挑了别的 TTS 引擎（例如小米 MiMo）的音色，按包名各留一个实例 */
    private final Map<String, TextToSpeech> extraEngines = new HashMap<>();
    /** 防止连点「立即更新」开出两个下载线程抢同一个文件 */
    private final AtomicBoolean updateRunning = new AtomicBoolean(false);
    /** 当前已下载字节数 / 总字节数（网页重新打开时用它恢复进度条） */
    private volatile long updateReceived = 0;
    /** 服务器是否支持 Range（支持才有可能分段并行与断点续传） */
    private volatile boolean rangeSupported = false;
    private volatile long updateTotal = -1;
    private volatile int updateAttempt = 1;
    /** 最近一次推送下载进度的时间，用来给网页节流 */
    private volatile long lastProgressAt = 0;
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
        // 听力材料是一整段多句，需要知道「真的播完了」才能把界面切回可重播状态
        attachEndListener(tts);
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
                tts.setPitch(1f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "word");
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                if (tts != null) tts.stop();
                synchronized (extraEngines) {
                    for (TextToSpeech engine : extraEngines.values()) engine.stop();
                }
            });
        }

        /**
         * 整段朗读听力材料：json 是 [{"t": 文本, "l": "en-US", "p": 音高, "r": 语速}]。
         * voiceSpec 形如「引擎包名::音色名」；不带 :: 的是默认引擎的音色，空则交给系统挑。
         * 全部用 QUEUE_ADD 排队，句间插静音，最后再排一个空句当结束标记。
         */
        @JavascriptInterface
        public void speakLines(final String json, final float rate, final String voiceSpec) {
            if (json == null || json.isEmpty()) return;
            final String[] spec = splitVoiceSpec(voiceSpec);
            // 换引擎要新建 TextToSpeech 实例、等它初始化，别占着主线程
            new Thread(() -> {
                TextToSpeech speaker = engineInstance(spec[0], 2500);
                runOnUiThread(() -> speakLinesOn(speaker != null ? speaker : tts, json, rate, spec[1]));
            }).start();
        }

        /**
         * 设备上所有 TTS 引擎的音色，给设置页的「听力音色」用。
         * 每一项带 engine（包名）与 label（引擎名），网页侧拼成「引擎::音色」存起来。
         * 这个调用跑在 WebView 的 JS 线程上，允许它阻塞几秒去初始化别的引擎。
         */
        @JavascriptInterface
        public String getVoices() {
            JSONArray array = new JSONArray();
            if (tts == null) return array.toString();
            try {
                String defaultPkg = tts.getDefaultEngine() == null ? "" : tts.getDefaultEngine();
                String defaultLabel = engineLabel(defaultPkg, "系统语音");
                collectVoices(array, tts, defaultPkg, defaultLabel, true);
                List<TextToSpeech.EngineInfo> engines = tts.getEngines();
                if (engines != null) {
                    for (TextToSpeech.EngineInfo info : engines) {
                        if (info.name == null || info.name.equals(defaultPkg)) continue;
                        TextToSpeech engine = engineInstance(info.name, 2200);
                        if (engine != null) collectVoices(array, engine, info.name, info.label, false);
                    }
                }
            } catch (Exception e) {
                return array.toString();
            }
            return array.toString();
        }
    }

    /** 把「引擎包名::音色名」拆开；不带 :: 时视为默认引擎的音色 */
    private static String[] splitVoiceSpec(String spec) {
        if (spec == null) return new String[]{"", ""};
        String trimmed = spec.trim();
        int at = trimmed.indexOf("::");
        if (at < 0) return new String[]{"", trimmed};
        return new String[]{trimmed.substring(0, at), trimmed.substring(at + 2)};
    }

    /** 引擎在系统里显示的名字，拿不到就用兜底文案 */
    private String engineLabel(String pkg, String fallback) {
        if (tts == null) return fallback;
        try {
            List<TextToSpeech.EngineInfo> engines = tts.getEngines();
            if (engines != null) {
                for (TextToSpeech.EngineInfo info : engines) {
                    if (info.name != null && info.name.equals(pkg) && info.label != null) return info.label;
                }
            }
        } catch (Exception e) {
            // 引擎列表读不到时用兜底名
        }
        return fallback;
    }

    /** 某个 TTS 实例播完最后一句时通知网页 */
    private void attachEndListener(TextToSpeech speaker) {
        if (speaker == null) return;
        speaker.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                // 不需要处理
            }

            @Override
            public void onDone(String utteranceId) {
                notifySpeechLinesDone(utteranceId);
            }

            @Override
            public void onError(String utteranceId) {
                notifySpeechLinesDone(utteranceId);
            }
        });
    }

    /** 取（或新建）指定引擎的实例；pkg 为空表示系统默认引擎 */
    private TextToSpeech engineInstance(String pkg, long timeoutMs) {
        if (pkg == null || pkg.isEmpty()) return tts;
        synchronized (extraEngines) {
            TextToSpeech pooled = extraEngines.get(pkg);
            if (pooled != null) return pooled;
        }
        final CountDownLatch latch = new CountDownLatch(1);
        final int[] status = new int[]{TextToSpeech.ERROR};
        final TextToSpeech created = new TextToSpeech(this, code -> {
            status[0] = code;
            latch.countDown();
        }, pkg);
        try {
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        if (status[0] != TextToSpeech.SUCCESS) {
            created.shutdown();
            return null;
        }
        attachEndListener(created);
        synchronized (extraEngines) {
            extraEngines.put(pkg, created);
        }
        return created;
    }

    /** 在指定实例上把整段材料排进队列（主线程） */
    private void speakLinesOn(TextToSpeech speaker, String json, float rate, String voiceName) {
        if (speaker == null) {
            notifySpeechLinesDone(SPEECH_END_ID);
            return;
        }
        speaker.stop();
        applyVoice(speaker, voiceName);
        float fallbackRate = rate > 0 ? rate : 0.94f;
        speaker.setPitch(1f);
        speaker.setSpeechRate(fallbackRate);
        try {
            JSONArray lines = new JSONArray(json);
            int spoken = 0;
            for (int i = 0; i < lines.length(); i++) {
                JSONObject line = lines.getJSONObject(i);
                String text = line.optString("t", "");
                String lang = line.optString("l", "en-US");
                if (text.isEmpty()) continue;
                if (voiceName == null || voiceName.isEmpty()) {
                    speaker.setLanguage("en-GB".equals(lang) ? Locale.UK : Locale.US);
                }
                float pitch = (float) line.optDouble("p", 1);
                float lineRate = (float) line.optDouble("r", fallbackRate);
                speaker.setSpeechRate(lineRate > 0 ? lineRate : fallbackRate);
                // 音高按句设置：男声女声共用同一把嗓子，只靠音高区分角色
                speaker.setPitch(pitch > 0 ? pitch : 1f);
                speaker.speak(text, TextToSpeech.QUEUE_ADD, null, "line-" + i);
                speaker.playSilentUtterance(SPEECH_GAP_MS, TextToSpeech.QUEUE_ADD, "gap-" + i);
                spoken++;
            }
            speaker.playSilentUtterance(120, TextToSpeech.QUEUE_ADD, SPEECH_END_ID);
            if (spoken == 0) {
                notifySpeechLinesDone(SPEECH_END_ID);
            }
        } catch (JSONException e) {
            notifySpeechLinesDone(SPEECH_END_ID);
        }
    }

    /** 按名字挑音色；找不到就保持引擎当前音色 */
    private void applyVoice(TextToSpeech speaker, String voiceName) {
        if (speaker == null || voiceName == null || voiceName.isEmpty()) return;
        try {
            Set<Voice> voices = speaker.getVoices();
            if (voices == null) return;
            for (Voice voice : voices) {
                if (voiceName.equals(voice.getName())) {
                    speaker.setVoice(voice);
                    return;
                }
            }
        } catch (Exception e) {
            // 引擎不支持 Voice API 时忽略，继续用默认音色
        }
    }

    /** 把一个引擎的音色塞进 JSON 数组；网络音色也保留，网页侧标出来 */
    private void collectVoices(JSONArray out, TextToSpeech speaker, String pkg, String label, boolean isDefault) {
        if (speaker == null) return;
        try {
            Set<Voice> voices = speaker.getVoices();
            if (voices == null) return;
            for (Voice voice : voices) {
                Locale locale = voice.getLocale();
                if (locale == null) continue;
                JSONObject item = new JSONObject();
                item.put("name", voice.getName());
                item.put("lang", locale.toLanguageTag());
                item.put("local", !voice.isNetworkConnectionRequired());
                item.put("engine", pkg == null ? "" : pkg);
                item.put("label", label == null || label.isEmpty() ? pkg : label);
                item.put("default", isDefault);
                out.put(item);
            }
        } catch (Exception e) {
            // 某个引擎读不出 Voice 列表就跳过它
        }
    }

    /** 只有结束标记播完/出错时才通知网页，普通句子的回调直接忽略 */
    private void notifySpeechLinesDone(final String utteranceId) {
        if (!SPEECH_END_ID.equals(utteranceId)) return;
        runOnUiThread(() -> {
            if (webView == null) return;
            webView.evaluateJavascript("window.__speechLinesDone && window.__speechLinesDone()", null);
        });
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

        @JavascriptInterface
        public void installUpdate(final String url, final String sha256) {
            if (url == null || url.isEmpty()) return;
            if (!updateRunning.compareAndSet(false, true)) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "更新正在下载中…", Toast.LENGTH_SHORT).show());
                return;
            }
            new Thread(() -> {
                try {
                    File apk = downloadUpdate(url, sha256);
                    emitUpdateProgress("verifying", apk.length(), apk.length(), updateAttempt, null);
                    final long size = apk.length();
                    runOnUiThread(() -> {
                        String blocked = launchInstaller(apk);
                        if (blocked == null) {
                            updateReceived = size;
                            emitUpdateProgress("done", size, size, updateAttempt, null);
                            Toast.makeText(MainActivity.this, "下载完成，正在打开安装…", Toast.LENGTH_SHORT).show();
                        } else {
                            emitUpdateProgress("failed", size, size, updateAttempt, blocked);
                        }
                    });
                } catch (Exception e) {
                    final String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                    emitUpdateProgress("failed", partialBytes(), updateTotal, updateAttempt, message);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this,
                            "更新下载失败：" + message + "。已下载的部分会保留，点「继续下载」可以接着下",
                            Toast.LENGTH_LONG).show());
                } finally {
                    updateRunning.set(false);
                }
            }).start();
        }

        /**
         * 当前的下载状态，给网页在开机/切回前台时恢复界面用。
         * partial=true 表示上次没下完、缓存里还有可续传的片段。
         */
        @JavascriptInterface
        public String getUpdateState() {
            org.json.JSONObject json = new org.json.JSONObject();
            try {
                long received = partialBytes();
                json.put("received", received);
                json.put("total", updatePrefs().getLong("total", updateTotal));
                json.put("running", updateRunning.get());
                json.put("partial", received > 0);
            } catch (Exception e) {
                return "{}";
            }
            return json.toString();
        }

        /** 用系统浏览器打开下载地址：浏览器自带断点续传，网络差的时候更稳 */
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

    /** 在 UI 线程执行一段 JS（网页还没加载完时直接跳过） */
    private void evaluate(final String js) {
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(js, null);
        });
    }

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

    /** 下载目录：断点续传的片段都放这里，进程被杀也不会丢 */
    private File updateDir() {
        File dir = new File(getCacheDir(), "update");
        if (!dir.exists() && !dir.mkdirs()) {
            // 目录建不出来就退回单文件模式，别让整个更新流程卡死
            return getCacheDir();
        }
        return dir;
    }

    private SharedPreferences updatePrefs() {
        return getSharedPreferences(UPDATE_PREFS, MODE_PRIVATE);
    }

    /** 缓存里已经下好、还没合并的字节数 */
    private long partialBytes() {
        File[] files = updateDir().listFiles();
        if (files == null) return 0;
        long sum = 0;
        for (File file : files) {
            if (file.getName().endsWith(".part")) sum += file.length();
        }
        return sum;
    }

    private void wipeUpdateDir(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.getName().endsWith(".part")) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        }
    }

    /**
     * 把安装包下到 cacheDir/update.apk：能分段就 4 条连接并行，每条都支持断点续传；
     * 服务器不支持 Range 时退回单连接。中途失败或进程被杀，下次调用会接着下，不会从头再来。
     */
    private File downloadUpdate(String url, String sha256) throws Exception {
        File dir = updateDir();
        File apk = new File(getCacheDir(), "update.apk");
        String savedUrl = updatePrefs().getString("url", "");
        if (!url.equals(savedUrl)) {
            // 换了个版本就别复用旧片段，否则拼出来的是两个版本混合的文件
            wipeUpdateDir(dir);
            //noinspection ResultOfMethodCallIgnored
            apk.delete();
            updatePrefs().edit().clear().putString("url", url).apply();
        }
        updateAttempt = 1;
        lastProgressAt = 0;
        long total = probeTotal(url);
        updateTotal = total;
        if (total > 0) updatePrefs().edit().putLong("total", total).apply();

        if (rangeSupported && total >= PARALLEL_MIN_BYTES) {
            try {
                downloadSegments(url, dir, total);
                mergeSegments(dir, total, apk);
            } catch (Exception e) {
                // 有些代理/运营商对并发连接不友好：退回单连接续传，别让用户白等
                wipeUpdateDir(dir);
                //noinspection ResultOfMethodCallIgnored
                apk.delete();
                downloadSingle(url, dir, total, apk);
            }
        } else {
            downloadSingle(url, dir, total, apk);
        }

        long size = apk.length();
        if (total > 0 && size != total) {
            throw new IllegalStateException("下载不完整（" + size + "/" + total + "）");
        }
        if (size < 100_000 || !looksLikeApk(apk)) {
            throw new IllegalStateException("文件不是安装包");
        }
        if (sha256 != null && !sha256.isEmpty() && !sha256.equalsIgnoreCase(sha256Of(apk))) {
            // 并行下载拼错了或文件被中间人改过：删掉重下，别把坏包装上去
            //noinspection ResultOfMethodCallIgnored
            apk.delete();
            throw new IllegalStateException("安装包校验没通过，已清除，请重试");
        }
        wipeUpdateDir(dir);
        updatePrefs().edit().remove("total").apply();
        updateReceived = size;
        return apk;
    }

    /** 问一下文件多大、认不认 Range：认 Range 才能断点续传和分段并行 */
    private long probeTotal(String url) throws Exception {
        HttpURLConnection conn = openConnection(url);
        try {
            conn.setRequestProperty("Range", "bytes=0-0");
            int code = conn.getResponseCode();
            if (code == HttpURLConnection.HTTP_PARTIAL) {
                rangeSupported = true;
                long total = parseRangeTotal(conn.getHeaderField("Content-Range"));
                if (total > 0) return total;
                return -1;
            }
            if (code == HttpURLConnection.HTTP_OK) {
                // 忽略 Range：既不能分段也不能续传，别白试 24 次
                rangeSupported = false;
                return conn.getContentLengthLong();
            }
            throw new IllegalStateException("HTTP " + code);
        } finally {
            conn.disconnect();
        }
    }

    /** 从 "bytes 0-0/3024458" 里取出总大小 */
    private long parseRangeTotal(String contentRange) {
        if (contentRange == null) return -1;
        int slash = contentRange.lastIndexOf('/');
        if (slash < 0 || slash == contentRange.length() - 1) return -1;
        try {
            return Long.parseLong(contentRange.substring(slash + 1).trim());
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private HttpURLConnection openConnection(String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setInstanceFollowRedirects(true);
        conn.setUseCaches(false);
        conn.setRequestProperty("Accept-Encoding", "identity");
        conn.setRequestProperty("User-Agent", "CimiaoUpdater/1.0");
        return conn;
    }

    /** 4 段并行下载，各自用 segN.part 记录进度 */
    private void downloadSegments(final String url, final File dir, final long total) throws Exception {
        long chunk = total / SEGMENT_COUNT;
        final AtomicBoolean stopped = new AtomicBoolean(false);
        ExecutorService pool = Executors.newFixedThreadPool(SEGMENT_COUNT);
        Thread watcher = new Thread(() -> {
            while (!stopped.get()) {
                reportProgress(partialBytes(), total, updateAttempt);
                sleepQuietly(250);
            }
        });
        watcher.setDaemon(true);
        watcher.start();
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < SEGMENT_COUNT; i++) {
                final long start = i * chunk;
                final long end = (i == SEGMENT_COUNT - 1) ? total - 1 : (start + chunk - 1);
                final File part = new File(dir, "seg" + i + ".part");
                final int index = i + 1;
                futures.add(pool.submit(() -> {
                    downloadSegment(url, part, start, end, index);
                    return null;
                }));
            }
            for (Future<?> future : futures) future.get();
            reportProgress(partialBytes(), total, updateAttempt);
        } finally {
            stopped.set(true);
            watcher.interrupt();
            pool.shutdownNow();
        }
    }

    private void downloadSegment(String url, File part, long start, long end, int index) throws Exception {
        long expected = end - start + 1;
        Exception last = null;
        for (int attempt = 1; attempt <= SEGMENT_ATTEMPTS; attempt++) {
            updateAttempt = Math.max(updateAttempt, attempt);
            if (part.length() > expected) {
                // 上一次可能写串了（比如服务器临时忽略过 Range）：删掉这段重来
                //noinspection ResultOfMethodCallIgnored
                part.delete();
            }
            if (part.length() >= expected) return;
            HttpURLConnection conn = null;
            try {
                long have = part.length();
                conn = openConnection(url);
                conn.setRequestProperty("Range", "bytes=" + (start + have) + "-" + end);
                int code = conn.getResponseCode();
                if (code == HttpURLConnection.HTTP_PARTIAL) {
                    copyToFile(conn.getInputStream(), part, true);
                    if (part.length() >= expected) return;
                    throw new IOException("第 " + index + " 段没下完");
                }
                if (code == HttpURLConnection.HTTP_OK) {
                    // 服务器这次又忽略了 Range：整个分段方案作废，交给单连接兜底
                    //noinspection ResultOfMethodCallIgnored
                    part.delete();
                    throw new RangeUnsupportedException();
                }
                if (code == 416 && part.delete()) continue;
                throw new IOException("HTTP " + code);
            } catch (RangeUnsupportedException e) {
                throw e;
            } catch (Exception e) {
                last = e;
                sleepQuietly(400L * attempt + 200L * index);
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        throw new IllegalStateException("第 " + index + " 段下载失败：" + (last == null ? "未知错误" : last.getMessage()));
    }

    /** 单连接下载（服务器不支持 Range 或文件很小的兜底路径），同样尽量续传 */
    private void downloadSingle(String url, File dir, long total, File apk) throws Exception {
        File part = new File(dir, "single.part");
        Exception last = null;
        for (int attempt = 1; attempt <= SEGMENT_ATTEMPTS; attempt++) {
            updateAttempt = attempt;
            if (total > 0 && part.length() >= total) break;
            HttpURLConnection conn = null;
            try {
                long have = part.length();
                conn = openConnection(url);
                if (have > 0) conn.setRequestProperty("Range", "bytes=" + have + "-");
                int code = conn.getResponseCode();
                if (code == HttpURLConnection.HTTP_PARTIAL) {
                    copyToFile(conn.getInputStream(), part, true);
                } else if (code == HttpURLConnection.HTTP_OK) {
                    // 服务器忽略 Range：只能从 0 重来
                    copyToFile(conn.getInputStream(), part, false);
                } else {
                    throw new IOException("HTTP " + code);
                }
                reportProgress(part.length(), total, attempt);
                if (total <= 0 || part.length() == total) break;
                throw new IOException("下载不完整");
            } catch (Exception e) {
                last = e;
                sleepQuietly(500L * attempt);
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        if (total > 0 && part.length() != total) {
            throw new IllegalStateException(last == null ? "下载不完整" : last.getMessage());
        }
        //noinspection ResultOfMethodCallIgnored
        apk.delete();
        if (!part.renameTo(apk)) throw new IllegalStateException("保存安装包失败");
    }

    private void copyToFile(InputStream in, File target, boolean append) throws IOException {
        try (InputStream source = in; FileOutputStream out = new FileOutputStream(target, append)) {
            byte[] buffer = new byte[DOWNLOAD_BUFFER];
            int read;
            while ((read = source.read(buffer)) > 0) {
                out.write(buffer, 0, read);
            }
            out.flush();
        }
    }

    /** 把 segN.part 依次拼成最终 APK */
    private void mergeSegments(File dir, long total, File apk) throws Exception {
        //noinspection ResultOfMethodCallIgnored
        apk.delete();
        try (FileOutputStream out = new FileOutputStream(apk)) {
            for (int i = 0; i < SEGMENT_COUNT; i++) {
                File part = new File(dir, "seg" + i + ".part");
                try (InputStream in = new FileInputStream(part)) {
                    byte[] buffer = new byte[DOWNLOAD_BUFFER];
                    int read;
                    while ((read = in.read(buffer)) > 0) {
                        out.write(buffer, 0, read);
                    }
                }
            }
        }
        if (apk.length() != total) {
            throw new IllegalStateException("合并后大小不对（" + apk.length() + "/" + total + "）");
        }
    }

    private void reportProgress(long received, long total, int attempt) {
        updateReceived = received;
        updateTotal = total;
        long now = System.currentTimeMillis();
        boolean finished = total > 0 && received >= total;
        // 节流：真实网络里每次 64KB 都发一条太密，合并到 ~6 次/秒足够顺滑
        if (!finished && now - lastProgressAt < 160) return;
        lastProgressAt = now;
        emitUpdateProgress("downloading", received, total, attempt, null);
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String sha256Of(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buffer = new byte[DOWNLOAD_BUFFER];
            int read;
            while ((read = in.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
        }
        StringBuilder sb = new StringBuilder(64);
        for (byte b : digest.digest()) {
            sb.append(String.format(Locale.US, "%02x", b));
        }
        return sb.toString();
    }

    /** 服务器拒绝 Range 分段：内部信号，让 downloadUpdate 换单连接路径 */
    private static final class RangeUnsupportedException extends Exception {
        RangeUnsupportedException() {
            super("服务器不支持分段下载");
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

package com.hevyvault.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + APP_HOST + "/index.html";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int MAX_SHARE_BYTES = 25 * 1024 * 1024;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private volatile String pendingCsv;
    private String pendingFilename;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#09090B"));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.addJavascriptInterface(new NativeBridge(), "HevyNative");
        webView.setWebViewClient(new AppClient());
        webView.setWebChromeClient(new AppChromeClient());

        setContentView(webView);
        readShare(getIntent());
        webView.loadUrl(APP_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readShare(intent);
        notifyPage();
    }

    private void notifyPage() {
        if (pendingCsv == null || webView == null) return;
        webView.evaluateJavascript(
            "window.dispatchEvent(new Event('hevy-native-share'))", null);
    }

    private void readShare(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = null;

        if (Intent.ACTION_SEND.equals(action)) {
            uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (uri == null) {
                String text = intent.getStringExtra(Intent.EXTRA_TEXT);
                if (text != null && text.indexOf(',') >= 0 && text.indexOf('\n') >= 0) {
                    pendingCsv = text;
                    pendingFilename = "shared_workout.csv";
                }
            }
        } else if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        }

        if (uri == null) return;

        try (InputStream input = getContentResolver().openInputStream(uri)) {
            if (input == null) return;
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = input.read(buffer)) > 0) {
                total += read;
                if (total > MAX_SHARE_BYTES) return;
                output.write(buffer, 0, read);
            }
            pendingCsv = output.toString("UTF-8");
            pendingFilename = displayName(uri);
        } catch (Exception ignored) {
        }
    }

    private String displayName(Uri uri) {
        try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String name = cursor.getString(index);
                    if (name != null && !name.isEmpty()) return name;
                }
            }
        } catch (Exception ignored) {
        }
        return "workout_data.csv";
    }

    private final class NativeBridge {
        @JavascriptInterface
        public String consumeShare() {
            if (pendingCsv == null) return "";
            JSONObject payload = new JSONObject();
            try {
                payload.put("csv", pendingCsv);
                payload.put("filename", pendingFilename);
            } catch (Exception e) {
                return "";
            }
            pendingCsv = null;
            return payload.toString();
        }
    }

    private final class AppClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!APP_HOST.equals(uri.getHost())) return null;

            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";

            try {
                InputStream stream = getAssets().open("www" + path);
                return response(path, stream);
            } catch (IOException e) {
                if (path.indexOf('.') < 0) {
                    try {
                        return new WebResourceResponse("text/html", "utf-8",
                            getAssets().open("www/index.html"));
                    } catch (IOException ignored) {
                    }
                }
                return new WebResourceResponse("text/plain", "utf-8",
                    new ByteArrayInputStream("Not found".getBytes(StandardCharsets.UTF_8)));
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !APP_HOST.equals(request.getUrl().getHost());
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            notifyPage();
        }
    }

    private static WebResourceResponse response(String path, InputStream stream) {
        String mime = mimeFor(path);
        String encoding = mime.startsWith("text/") || mime.endsWith("json")
            ? "utf-8" : null;
        return new WebResourceResponse(mime, encoding, stream);
    }

    private static String mimeFor(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    private final class AppChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (filePathCallback != null) filePathCallback.onReceiveValue(null);
            filePathCallback = callback;
            try {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                startActivityForResult(Intent.createChooser(intent, "Select CSV"), FILE_CHOOSER_REQUEST);
                return true;
            } catch (Exception e) {
                filePathCallback = null;
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{ data.getData() };
            }
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}

# ShieldHire ProGuard / R8 Rules
# ───────────────────────────────────────────────────────────────────────────

# ── React Native Core ───────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**
-dontwarn com.facebook.soloader.**

# ── React Native New Architecture (TurboModules / Fabric) ───────────────────
-keep class com.shieldhire.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# ── Firebase ────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Messaging (FCM) — must not be obfuscated
-keep class com.google.firebase.messaging.** { *; }
-keep class io.invertase.firebase.** { *; }

# ── Google Maps ─────────────────────────────────────────────────────────────
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.maps.android.** { *; }
-dontwarn com.google.android.gms.maps.**

# ── react-native-maps ───────────────────────────────────────────────────────
-keep class com.airbnb.android.react.maps.** { *; }

# ── react-native-vision-camera ──────────────────────────────────────────────
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# ── react-native-nitro-modules / nitro-inspire-face ─────────────────────────
-keep class com.margelo.nitro.** { *; }
-dontwarn com.margelo.nitro.**

# ── react-native-geolocation-service ────────────────────────────────────────
-keep class com.agontuk.RNFusedLocation.** { *; }

# ── react-native-image-picker ───────────────────────────────────────────────
-keep class com.imagepicker.** { *; }

# ── react-native-vector-icons ───────────────────────────────────────────────
-keep class com.oblador.vectoricons.** { *; }

# ── react-native-fs ─────────────────────────────────────────────────────────
-keep class com.rnfs.** { *; }

# ── @notifee/react-native ───────────────────────────────────────────────────
-keep class io.invertase.notifee.** { *; }

# ── react-native-bootsplash ─────────────────────────────────────────────────
-keep class com.zoontek.rnbootsplash.** { *; }

# ── react-native-linear-gradient ────────────────────────────────────────────
-keep class com.BV.LinearGradient.** { *; }

# ── react-native-blur ───────────────────────────────────────────────────────
-keep class com.cmcewen.blurview.** { *; }

# ── react-native-screens ────────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ── react-native-gesture-handler ────────────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }

# ── react-native-safe-area-context ──────────────────────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ── react-native-svg ────────────────────────────────────────────────────────
-keep class com.horcrux.svg.** { *; }

# ── lottie-react-native ─────────────────────────────────────────────────────
-keep class com.airbnb.lottie.** { *; }

# ── Socket.io / OkHttp (WebSocket) ──────────────────────────────────────────
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ── Kotlin standard library ─────────────────────────────────────────────────
-dontwarn kotlin.**
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }

# ── General Java serialization safety ───────────────────────────────────────
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# ── Suppress common warnings from transitive deps ───────────────────────────
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Read the Google Maps key from local.properties (not committed to git).
val localProps = Properties()
val localPropsFile = rootProject.file("local.properties")
if (localPropsFile.exists()) {
    localPropsFile.inputStream().use { localProps.load(it) }
}
val mapsApiKey: String = localProps.getProperty("MAPS_API_KEY") ?: ""

// Optional release signing config — picks up android/key.properties if present
// (gitignored). When absent, release builds fall back to the debug keystore so
// `flutter run --release` still works for development. See RELEASE-CHECKLIST.md.
val keyProps = Properties()
val keyPropsFile = rootProject.file("key.properties")
val haveReleaseKey = keyPropsFile.exists()
if (haveReleaseKey) {
    keyPropsFile.inputStream().use { keyProps.load(it) }
}

android {
    namespace = "com.example.sales_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.sales_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // Injected into AndroidManifest.xml as ${MAPS_API_KEY}.
        manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
    }

    signingConfigs {
        if (haveReleaseKey) {
            create("release") {
                storeFile     = file(keyProps.getProperty("storeFile"))
                storePassword = keyProps.getProperty("storePassword")
                keyAlias      = keyProps.getProperty("keyAlias")
                keyPassword   = keyProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // Use the real keystore when key.properties is present, otherwise
            // fall back to the debug keystore so `flutter run --release` works.
            signingConfig = if (haveReleaseKey)
                signingConfigs.getByName("release")
            else
                signingConfigs.getByName("debug")
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

flutter {
    source = "../.."
}

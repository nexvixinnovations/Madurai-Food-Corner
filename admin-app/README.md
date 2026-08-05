# Admin Native Android Application

Native Android application built with **Kotlin**, **Jetpack Compose**, **Retrofit**, **Coil**, **Material 3**, and **MVVM Architecture**.

## Getting Started

1. Open **Android Studio** (Hedgehog 2023.1.1 or newer).
2. Select **Open** and choose this `admin-app/` folder.
3. Allow Gradle to sync dependencies.
4. Run on an Android Emulator (API 26+) or connected device.

## Architecture

- **`data/`**: Retrofit REST client interfaces & DTO models.
- **`repository/`**: Repository layer mapping network calls to ViewModels.
- **`ui/`**: Material 3 Composables, Jetpack Navigation Compose, ViewModels.
- **`utils/`**: Shared constants & helpers.

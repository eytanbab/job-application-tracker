# Native Mobile: Conventions & Signals

Use this alongside [categories.md](./categories.md) when `platform` includes `ios` or `android` and the app is built with React Native/Expo, Flutter, SwiftUI/UIKit, or Jetpack Compose/Android Views. The categories, severity model, and report format are the same; this file adds platform conventions and the code signals to look for.

---

## 1. Platform Conventions (Jakob's Law)

Users bring expectations from every other app on their phone. Breaking a platform convention is a finding when it makes the persona hesitate or fail, even if the custom design looks good.

| Topic | iOS (Human Interface Guidelines) | Android (Material 3) |
| :--- | :--- | :--- |
| Top-level navigation | Tab bar at the bottom, usually 3–5 tabs | Navigation bar (bottom), rail (tablets), or drawer |
| Going back | Back button top-left; swipe from the left edge | System back gesture/button must work on every screen, including closing sheets and dialogs |
| Touch targets | At least 44×44 pt | At least 48×48 dp |
| Text size | Dynamic Type text styles (body is 17 pt at the default size) | `sp` units with the type scale (body 14–16 sp); respect the user's font scale |
| Modals | Sheets, dismissed by swiping down | Bottom sheets and dialogs, dismissed with back |
| Destructive actions | Destructive-style buttons in alerts and action sheets | Clear confirmation or undo snackbars |
| Safe areas | Notch or Dynamic Island, home indicator | Status bar, gesture-navigation insets, edge-to-edge layouts |
| Feedback | Subtle haptics for confirmations and selections | Ripple on press; haptics used sparingly |

---

## 2. Signals by Concern

| Concern | React Native / Expo | Flutter | SwiftUI | Jetpack Compose |
| :--- | :--- | :--- | :--- | :--- |
| **Accessible names** (`A11Y`) | `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, `accessible` | `Semantics(label:)`, `semanticLabel` on `Icon`/`Image`, `tooltip` on `IconButton` | `.accessibilityLabel()`, `.accessibilityHint()`, `.accessibilityHidden()` | `contentDescription`, `Modifier.semantics { }` |
| **Touch targets** (`AFFORD`) | `hitSlop`, `minHeight`/`minWidth` on `Pressable` | `kMinInteractiveDimension` (48), `materialTapTargetSize`, `IconButton` default size | `.frame(minWidth: 44, minHeight: 44)`, `.contentShape(Rectangle())` | `Modifier.minimumInteractiveComponentSize()` (Material components default to 48 dp); small `Modifier.size()` on `clickable` |
| **Text scaling** (`TYPO`, `A11Y`) | 🚩 `allowFontScaling={false}`; fixed heights on text containers; check `maxFontSizeMultiplier` | 🚩 `TextScaler.noScaling` or a fixed `textScaleFactor`; fixed-height containers | 🚩 `.font(.system(size: N))` doesn't scale with Dynamic Type; prefer `.font(.body)` or `@ScaledMetric` | 🚩 `fontSize` in `.dp` instead of `.sp` |
| **Safe areas** (`PLAT`) | `SafeAreaView`, `useSafeAreaInsets` (react-native-safe-area-context) | `SafeArea`, `MediaQuery.paddingOf` | `.ignoresSafeArea()` on content, not just backgrounds | `WindowInsets`, `enableEdgeToEdge()`, `Modifier.windowInsetsPadding()` |
| **Keyboard & input** (`FORM`) | `KeyboardAvoidingView`, `keyboardType`, `textContentType` (iOS), `autoComplete`, `returnKeyType`, `keyboardShouldPersistTaps` | `keyboardType`, `textInputAction`, `autofillHints`, `resizeToAvoidBottomInset` | `.keyboardType()`, `.textContentType()`, `.submitLabel()`, `@FocusState` | `KeyboardOptions(keyboardType, imeAction)`, autofill content types |
| **Back navigation** (`NAV`) | `BackHandler`; 🚩 `gestureEnabled: false` on non-modal screens (React Navigation) | `PopScope` (`WillPopScope` is deprecated) | 🚩 `.navigationBarBackButtonHidden(true)` with no alternative | `BackHandler`; support predictive back |
| **Loading & refresh** (`STATE`, `PERF`) | `ActivityIndicator`, `RefreshControl` | `CircularProgressIndicator`, `RefreshIndicator` | `ProgressView`, `.refreshable` | `CircularProgressIndicator`, `PullToRefreshBox` |
| **Reduced motion** (`MOTION`) | `AccessibilityInfo.isReduceMotionEnabled()`, Reanimated `useReducedMotion` | `MediaQuery.disableAnimationsOf` | `@Environment(\.accessibilityReduceMotion)` | Respect the system animator duration scale |
| **Colors & dark mode** (`DSYS`, `COLOR`) | `useColorScheme`; hard-coded hex in `StyleSheet` | `Theme.of(context).colorScheme` vs. hard-coded `Color(0xFF…)` | Semantic colors (`.primary`, asset catalog) vs. `Color(red:green:blue:)` | `MaterialTheme.colorScheme` vs. hard-coded `Color(0xFF…)` |
| **Haptics** (`TRUST`) | `expo-haptics`, `react-native-haptic-feedback` | `HapticFeedback` | `.sensoryFeedback()` | `LocalHapticFeedback`, `performHapticFeedback` |

🚩 marks patterns that are almost always a finding once verified.

`token_inventory.js` also scans `.dart`, `.swift`, and `.kt` files. It counts hard-coded colors, font sizes, and radii, and flags disabled text scaling.

---

## 3. Evidence Without a Browser

The Interactive-mode scripts only work for web pages. For native apps:

- **Design Review mode**: ask the developer for screenshots of each step of the flow, ideally at the default and the largest text size, and in light and dark mode.
- **Simulator screenshots** (read-only; ask before running, since they need a booted simulator or connected device):
  ```bash
  xcrun simctl io booted screenshot step-1.png
  adb exec-out screencap -p > step-1.png
  ```
- **Platform audit tools**: suggest the developer run Xcode's Accessibility Inspector (iOS) or Accessibility Scanner (Android). Their results can be rated **Observed**.
- Without rendered evidence, findings that depend on layout (target size on screen, truncation at large text) are **Needs verification** unless the code proves them.

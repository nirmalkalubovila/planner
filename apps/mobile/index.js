// Custom entry (replacing the default "expo-router/entry" main) so the
// Android widget task handler is registered before the RN bridge sets up —
// react-native-android-widget spins up a headless JS instance for widget
// add/update/resize/click events, and it needs the handler registered at
// module scope, not inside a component that only mounts once the app opens.
//
// Deliberately just two import statements (each a module with its own
// side effect), rather than a bare function call between them — eslint's
// import/first autofix hoists interspersed statements above imports, which
// would silently reorder registration to run AFTER expo-router/entry and
// break this file's whole reason for existing.
import './src/widgets/android/register-task-handler';
import 'expo-router/entry';

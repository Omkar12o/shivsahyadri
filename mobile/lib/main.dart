import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/router.dart';
import 'core/config/env.dart';
import 'core/services/auth_service.dart';
import 'core/services/profile_service.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_scope.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  if (Env.hasSupabaseConfig) {
    await Supabase.initialize(
      url: Env.supabaseUrl,
      publishableKey: Env.supabasePublishableKey,
    );
  }

  runApp(const ShimlaApp());
}

class ShimlaApp extends StatefulWidget {
  const ShimlaApp({super.key});

  @override
  State<ShimlaApp> createState() => _ShimlaAppState();
}

class _ShimlaAppState extends State<ShimlaApp> {
  late final AuthController _auth;

  @override
  void initState() {
    super.initState();
    if (Env.hasSupabaseConfig) {
      final client = Supabase.instance.client;
      _auth = AuthController(
        authService: AuthService(client),
        profileService: ProfileService(client),
      )..start();
    } else {
      _auth = AuthController(
        authService: AuthService(_NullClient()),
        profileService: ProfileService(_NullClient()),
      );
    }
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      controller: _auth,
      child: MaterialApp.router(
        title: 'Shivsaydri Mandal',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        routerConfig: appRouter,
        builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
          value: const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
            systemNavigationBarColor: Colors.white,
            systemNavigationBarIconBrightness: Brightness.dark,
          ),
          child: child ?? const SizedBox.shrink(),
        ),
      ),
    );
  }
}

/// Placeholder used only when Supabase env vars are missing, so the app still
/// launches and explains the problem instead of crashing at startup.
class _NullClient extends SupabaseClient {
  _NullClient()
      : super('https://placeholder.supabase.co', 'placeholder-anon-key');
}

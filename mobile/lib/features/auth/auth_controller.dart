import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/env.dart';
import '../../core/models/profile.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/profile_service.dart';

class AuthController extends ChangeNotifier {
  AuthController({required this.authService, required this.profileService});

  final AuthService authService;
  final ProfileService profileService;

  StreamSubscription<AuthState>? _sub;

  User? _user;
  Profile? _profile;
  bool _loading = true;

  User? get user => _user;
  Profile? get profile => _profile;
  bool get loading => _loading;
  bool get isSignedIn => _user != null;
  UserRole? get role => _profile?.role;
  bool get isAdmin => _profile?.isAdmin ?? false;

  void start() {
    _init();
    _sub ??= Supabase.instance.client.auth.onAuthStateChange.listen(
      (data) async {
        final event = data.event;
        if (event == AuthChangeEvent.signedOut) {
          _user = null;
          _profile = null;
          notifyListeners();
          return;
        }
        final authUser = data.session?.user;
        if (authUser == null) return;

        if (event == AuthChangeEvent.passwordRecovery) {
          _user = authUser;
          return;
        }
        _user = authUser;
        await _loadProfile(authUser.id);
      },
    );
  }

  Future<void> _init() async {
    if (!Env.hasSupabaseConfig) {
      _loading = false;
      notifyListeners();
      return;
    }
    final session = Supabase.instance.client.auth.currentSession;
    if (session?.user != null) {
      _user = session!.user;
      await _loadProfile(_user!.id);
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _loadProfile(String authUserId) async {
    try {
      _profile = await profileService.getProfileByAuthId(authUserId);
    } catch (e) {
      debugPrint('Failed to load profile: $e');
      _profile = null;
    }
    notifyListeners();
  }

  Future<SignInResult> signIn(String identifier, String password) async {
    final res = await authService.signIn(identifier, password);
    if (res.error != null) return res;

    final authUser = Supabase.instance.client.auth.currentSession?.user;
    if (authUser == null) {
      return const SignInResult(error: 'Unable to connect. Please try again.');
    }

    try {
      _user = authUser;
      _profile = await profileService.getProfileByAuthId(authUser.id);
      notifyListeners();
      return SignInResult(error: null, email: authUser.email);
    } catch (_) {
      return const SignInResult(
        error: 'Unable to load your profile. Please try again.',
      );
    }
  }

  Future<SignUpResult> signUp(RegisterData data) async {
    final res = await authService.signUp(data);
    if (res.error == null && !res.needsEmailConfirmation) {
      final authUser = Supabase.instance.client.auth.currentSession?.user;
      if (authUser != null) {
        _user = authUser;
        await _loadProfile(authUser.id);
      }
    }
    return res;
  }

  Future<void> signOut() async {
    try {
      await authService.signOut();
    } catch (_) {
      // Logout must always proceed locally even if the remote call fails.
    }
    _user = null;
    _profile = null;
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    if (_user != null) await _loadProfile(_user!.id);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env.dart';
import '../models/profile.dart';

enum SignInCode { emailNotConfirmed, rateLimited, network, invalid }

enum SignUpCode { emailExists, usernameTaken, rateLimited, network }

class SignUpResult {
  const SignUpResult({
    required this.error,
    required this.needsEmailConfirmation,
    this.code,
    this.email,
  });

  final String? error;
  final bool needsEmailConfirmation;
  final SignUpCode? code;
  final String? email;
}

class SignInResult {
  const SignInResult({required this.error, this.email, this.code});

  final String? error;
  final String? email;
  final SignInCode? code;
}

class SimpleResult {
  const SimpleResult(this.error, [this.code]);

  final String? error;
  final String? code;
}

final _rateLimitRe = RegExp(
  r'rate limit|rate_limit|too many|slow down|reached the limit',
  caseSensitive: false,
);
final _networkRe = RegExp(
  r'\bnetwork\b|fetch|internet|failed to (fetch|connect)|temporary breakdown|'
  r'socketexception|host lookup|failed host lookup|connection refused',
  caseSensitive: false,
);
final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// Port of frontend/src/services/authService.ts. Supabase Dart v2 throws on
/// failure, so each call is wrapped and the original friendly messages are
/// preserved for the UI.
class AuthService {
  AuthService(this._client);

  final SupabaseClient _client;

  static bool validateEmail(String value) => _emailRe.hasMatch(value.trim());

  Future<bool> isUserIdTaken(String userId) async {
    final res = await _client.rpc(
      'is_user_id_taken',
      params: {'candidate': userId},
    );
    return res == true;
  }

  Future<SignUpResult> signUp(RegisterData data) async {
    final fullName = data.fullName.trim();
    final username = data.userId.trim();
    final email = data.email.trim();

    if (fullName.isEmpty) {
      return const SignUpResult(
        error: 'Please enter your full name.',
        needsEmailConfirmation: false,
      );
    }
    if (username.isEmpty) {
      return const SignUpResult(
        error: 'Please choose a username.',
        needsEmailConfirmation: false,
      );
    }
    if (email.isEmpty) {
      return const SignUpResult(
        error: 'Please enter your email address.',
        needsEmailConfirmation: false,
      );
    }
    if (!validateEmail(email)) {
      return const SignUpResult(
        error: 'Please enter a valid email address.',
        needsEmailConfirmation: false,
      );
    }

    try {
      if (await isUserIdTaken(username)) {
        return const SignUpResult(
          error: 'That username is already taken. Please choose another.',
          needsEmailConfirmation: false,
          code: SignUpCode.usernameTaken,
        );
      }
    } catch (_) {
      // Uniqueness is also enforced by the database; continue.
    }

    try {
      final res = await _client.auth.signUp(
        email: email,
        password: data.password,
        data: <String, dynamic>{
          'full_name': fullName,
          'user_id': username,
          'username': username,
          'contact_email': email,
          'mobile': data.mobile.trim(),
          'village': data.village.trim(),
          'address': data.address.trim(),
          'date_of_birth': data.dateOfBirth,
          'birthday_time': data.birthdayTime,
          'birthday_visibility': data.birthdayVisibility,
        },
      );

      return SignUpResult(
        error: null,
        needsEmailConfirmation: res.session == null,
        email: res.user?.email ?? email,
      );
    } on AuthException catch (e) {
      return _mapSignUpError(e.message, email);
    } catch (e) {
      return _mapSignUpError(e.toString(), email);
    }
  }

  SignUpResult _mapSignUpError(String message, String email) {
    if (RegExp(
      r'already registered|already exists|user already|email.*exist',
      caseSensitive: false,
    ).hasMatch(message)) {
      return SignUpResult(
        error: 'An account with this email already exists. Try logging in instead.',
        needsEmailConfirmation: false,
        code: SignUpCode.emailExists,
        email: email,
      );
    }
    if (RegExp(
      r'user id already exists|duplicate|unique',
      caseSensitive: false,
    ).hasMatch(message)) {
      return const SignUpResult(
        error: 'That username is already taken. Please choose another.',
        needsEmailConfirmation: false,
        code: SignUpCode.usernameTaken,
      );
    }
    if (_rateLimitRe.hasMatch(message)) {
      return SignUpResult(
        error: 'Email verification could not be sent right now. Please try again later.',
        needsEmailConfirmation: false,
        code: SignUpCode.rateLimited,
        email: email,
      );
    }
    if (message.toLowerCase().contains('password')) {
      return const SignUpResult(
        error: 'Password must be at least 8 characters.',
        needsEmailConfirmation: false,
      );
    }
    if (_networkRe.hasMatch(message)) {
      return SignUpResult(
        error: 'Unable to connect. Please check your internet connection and try again.',
        needsEmailConfirmation: false,
        code: SignUpCode.network,
      );
    }
    return const SignUpResult(
      error: 'Account creation failed. Please try again.',
      needsEmailConfirmation: false,
    );
  }

  /// Sign in with either a username or an email + password.
  /// Username -> case-insensitive lookup via `get_email_for_user_id` -> sign in.
  Future<SignInResult> signIn(String identifier, String password) async {
    if (!Env.hasSupabaseConfig) {
      return const SignInResult(
        error: 'Supabase is not configured. Login is disabled.',
        code: SignInCode.network,
      );
    }

    final input = identifier.trim();
    if (input.isEmpty || password.isEmpty) {
      return const SignInResult(
        error: 'Please enter your username and password.',
        code: SignInCode.invalid,
      );
    }

    var email = input;
    if (!input.contains('@')) {
      try {
        final resolved =
            await _client.rpc(
          'get_email_for_user_id',
          params: {'candidate': input},
        );
        final value = resolved?.toString();
        if (value == null || value.isEmpty) {
          return const SignInResult(
            error: 'Invalid username or password.',
            code: SignInCode.invalid,
          );
        }
        email = value;
      } catch (_) {
        return const SignInResult(
          error: 'Invalid username or password.',
          code: SignInCode.invalid,
        );
      }
    }

    try {
      final res = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      return SignInResult(error: null, email: res.user?.email ?? email);
    } on AuthException catch (e) {
      return _mapSignInError(e.message, email);
    } catch (e) {
      return _mapSignInError(e.toString(), email);
    }
  }

  SignInResult _mapSignInError(String message, String email) {
    if (_rateLimitRe.hasMatch(message)) {
      return const SignInResult(
        error: 'Too many sign-in attempts. Please wait a moment and try again.',
        code: SignInCode.rateLimited,
      );
    }
    if (RegExp(
      r'email not confirmed|confirm your email',
      caseSensitive: false,
    ).hasMatch(message)) {
      return SignInResult(
        error: 'Please verify your email before logging in.',
        email: email,
        code: SignInCode.emailNotConfirmed,
      );
    }
    if (_networkRe.hasMatch(message)) {
      return const SignInResult(
        error: 'Unable to connect. Please check your internet connection and try again.',
        code: SignInCode.network,
      );
    }
    return const SignInResult(
      error: 'Invalid username or email, or password.',
      code: SignInCode.invalid,
    );
  }

  Future<void> signOut() => _client.auth.signOut();

  Future<SimpleResult> resendConfirmationEmail(String email) async {
    try {
      await _client.auth.resend(
        type: OtpType.signup,
        email: email,
        emailRedirectTo: '${Env.webBaseUrl}/member/login',
      );
      return const SimpleResult(null);
    } on AuthException catch (e) {
      final message = e.message;
      if (_rateLimitRe.hasMatch(message)) {
        return const SimpleResult(
          'Email service is temporarily busy. Please wait a moment before trying again.',
          'rate_limited',
        );
      }
      if (_networkRe.hasMatch(message)) {
        return const SimpleResult(
          'Unable to connect. Please check your internet connection.',
        );
      }
      return const SimpleResult(
        'Unable to send the email right now. Please try again later.',
      );
    }
  }

  Future<SimpleResult> sendPasswordReset(String email) async {
    try {
      await _client.auth.resetPasswordForEmail(
        email,
        redirectTo: '${Env.webBaseUrl}/member/reset-password',
      );
      return const SimpleResult(null);
    } on AuthException catch (e) {
      final message = e.message;
      if (_rateLimitRe.hasMatch(message)) {
        return const SimpleResult(
          'Please wait a moment before requesting another email.',
        );
      }
      if (_networkRe.hasMatch(message)) {
        return const SimpleResult(
          'Unable to connect. Please check your internet connection.',
        );
      }
      return const SimpleResult(null);
    }
  }

  Future<SimpleResult> updatePassword(String newPassword) async {
    try {
      await _client.auth.updateUser(UserAttributes(password: newPassword));
      return const SimpleResult(null);
    } on AuthException catch (e) {
      final message = e.message;
      if (_rateLimitRe.hasMatch(message)) {
        return const SimpleResult(
          'Too many attempts. Please wait a moment and try again.',
        );
      }
      if (message.toLowerCase().contains('password')) {
        return const SimpleResult('Password must be at least 8 characters.');
      }
      if (_networkRe.hasMatch(message)) {
        return const SimpleResult('Unable to connect. Please try again.');
      }
      return const SimpleResult(
        'Could not update the password. Please try again.',
      );
    }
  }
}

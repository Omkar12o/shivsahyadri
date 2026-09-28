import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/env.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/mandal_logo.dart';
import 'auth_scope.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscure = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    setState(() {
      _busy = true;
      _error = null;
    });

    final auth = AuthScope.read(context);
    final res = await auth.signIn(
      _identifierController.text,
      _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _busy = false);

    if (res.error != null) {
      setState(() => _error = res.error);
      return;
    }
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final configured = Env.hasSupabaseConfig;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const MandalLogo(),
                    const SizedBox(height: 28),
                    Text(
                      'Member Login',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.maroon,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Umarkhanchan',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                          ),
                    ),
                    const SizedBox(height: 28),
                    if (!configured)
                      const _Banner(
                        message:
                            'Supabase is not configured. Set SUPABASE_URL and '
                            'SUPABASE_ANON_KEY at build time to enable login.',
                        isError: true,
                      ),
                    if (!configured) const SizedBox(height: 16),
                    TextFormField(
                      controller: _identifierController,
                      enabled: configured && !_busy,
                      textInputAction: TextInputAction.next,
                      autocorrect: false,
                      decoration: const InputDecoration(
                        labelText: 'Username or email',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Please enter your username or email'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passwordController,
                      enabled: configured && !_busy,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => (v == null || v.isEmpty)
                          ? 'Please enter your password'
                          : null,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      _Banner(message: _error!, isError: true),
                    ],
                    const SizedBox(height: 22),
                    FilledButton(
                      onPressed: (configured && !_busy) ? _submit : null,
                      child: _busy
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Login'),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => context.push('/forgot-password'),
                      child: const Text('Forgot password?'),
                    ),
                    const SizedBox(height: 6),
                    Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('New member?'),
                          TextButton(
                            onPressed: _busy
                                ? null
                                : () => context.push('/register'),
                            child: const Text('Register'),
                          ),
                        ]),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => context.go('/home'),
                      icon: const Icon(Icons.visibility_outlined, size: 18),
                      label: const Text('Continue as guest'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.message, this.isError = false});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final bg = isError ? const Color(0xFFFFEBEE) : const Color(0xFFFFF3E0);
    final fg = isError ? const Color(0xFFB3261E) : AppColors.primaryDark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.info_outline,
            size: 18,
            color: fg,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: fg, fontSize: 13, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/profile.dart';
import '../../core/services/auth_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/mandal_logo.dart';
import 'auth_scope.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _userId = TextEditingController();
  final _email = TextEditingController();
  final _mobile = TextEditingController();
  final _village = TextEditingController();
  final _address = TextEditingController();
  final _dob = TextEditingController();
  final _birthdayTime = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();

  bool _obscure = true;
  bool _birthdayVisibility = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _userId,
      _email,
      _mobile,
      _village,
      _address,
      _dob,
      _birthdayTime,
      _password,
      _confirmPassword,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 30, now.month, now.day),
      firstDate: DateTime(1920),
      lastDate: now,
    );
    if (picked != null) {
      _dob.text = picked.toIso8601String().substring(0, 10);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    setState(() {
      _busy = true;
      _error = null;
    });

    final data = RegisterData(
      fullName: _fullName.text,
      userId: _userId.text,
      email: _email.text,
      mobile: _mobile.text,
      password: _password.text,
      confirmPassword: _confirmPassword.text,
      dateOfBirth: _dob.text,
      birthdayTime: _birthdayTime.text,
      village: _village.text,
      address: _address.text,
      birthdayVisibility: _birthdayVisibility,
    );

    final res = await AuthScope.read(context).signUp(data);
    if (!mounted) return;
    setState(() => _busy = false);

    if (res.error != null) {
      setState(() => _error = res.error);
      return;
    }

    if (res.needsEmailConfirmation) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Verify your email'),
          content: Text(
            'We sent a verification link to ${res.email ?? _email.text}. '
            'Please confirm your email, then log in.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      if (mounted) context.go('/login');
      return;
    }

    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Member Registration')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const MandalLogo(size: 64),
                    const SizedBox(height: 20),
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFEBEE),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            color: Color(0xFFB3261E),
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _field(_fullName, 'Full name', Icons.badge_outlined, required: true),
                    _field(_userId, 'Username', Icons.alternate_email, required: true),
                    _field(_email, 'Email', Icons.email_outlined, keyboard: TextInputType.emailAddress, required: true),
                    _field(_mobile, 'Mobile number', Icons.phone_outlined, keyboard: TextInputType.phone),
                    _field(_village, 'Village', Icons.location_city_outlined),
                    _field(_address, 'Address', Icons.home_outlined, maxLines: 2),
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: _field(_dob, 'Date of birth', Icons.cake_outlined, readOnly: true, onTap: _pickDate),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: _field(_birthdayTime, 'Birth time', Icons.schedule, hint: '08:30'),
                        ),
                      ],
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _birthdayVisibility,
                      activeThumbColor: AppColors.saffron,
                      title: const Text(
                        'Show my birthday to members',
                        style: TextStyle(fontSize: 14),
                      ),
                      onChanged: (v) => setState(() => _birthdayVisibility = v),
                    ),
                    const SizedBox(height: 6),
                    _field(
                      _password,
                      'Password',
                      Icons.lock_outline,
                      required: true,
                      obscure: _obscure,
                      isPassword: true,
                    ),
                    _field(
                      _confirmPassword,
                      'Confirm password',
                      Icons.lock_outline,
                      required: true,
                      obscure: _obscure,
                      isPassword: true,
                    ),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : const Text('Create account'),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _busy ? null : () => context.pop(),
                      child: const Text('Already a member? Login'),
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

  Widget _field(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool required = false,
    bool obscure = false,
    bool readOnly = false,
    bool isPassword = false,
    int maxLines = 1,
    TextInputType? keyboard,
    String? hint,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        enabled: !_busy,
        obscureText: obscure,
        readOnly: readOnly,
        onTap: onTap,
        maxLines: maxLines,
        keyboardType: keyboard,
        autocorrect: false,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          prefixIcon: Icon(icon),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                )
              : null,
        ),
        validator: (v) {
          if (required && (v == null || v.trim().isEmpty)) {
            return '$label is required';
          }
          if (label == 'Email' && v != null && v.trim().isNotEmpty) {
            if (!AuthService.validateEmail(v)) return 'Enter a valid email address';
          }
          if (isPassword && v != null && v.isNotEmpty && v.length < 8) {
            return 'Password must be at least 8 characters';
          }
          if (label == 'Confirm password' &&
              v != null &&
              v.isNotEmpty &&
              v != _password.text) {
            return 'Passwords do not match';
          }
          return null;
        },
      ),
    );
  }
}

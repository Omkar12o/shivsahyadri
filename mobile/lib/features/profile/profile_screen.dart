import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../auth/auth_scope.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final profile = auth.profile;

    if (!auth.isSignedIn || profile == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.person_off_outlined, size: 56, color: AppColors.saffron),
                const SizedBox(height: 16),
                const Text(
                  'You are not signed in.',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 42,
                    backgroundColor: const Color(0xFFFFE0B2),
                    backgroundImage: profile.profilePhotoUrl != null
                        ? NetworkImage(profile.profilePhotoUrl!)
                        : null,
                    child: profile.profilePhotoUrl == null
                        ? Text(
                            profile.fullName.isNotEmpty
                                ? profile.fullName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryDark,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    profile.fullName,
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '@${profile.userId}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      profile.role.label,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                _Row(icon: Icons.email_outlined, label: 'Email', value: profile.email ?? '-'),
                _Row(icon: Icons.phone_outlined, label: 'Mobile', value: profile.mobile ?? '-'),
                _Row(icon: Icons.location_city_outlined, label: 'Village', value: profile.village ?? '-'),
                _Row(icon: Icons.home_outlined, label: 'Address', value: profile.address ?? '-'),
                _Row(icon: Icons.cake_outlined, label: 'Birthday', value: profile.dateOfBirth ?? '-'),
                _Row(icon: Icons.schedule, label: 'Birth time', value: profile.birthdayTime ?? '-'),
                _Row(icon: Icons.badge_outlined, label: 'Position', value: profile.position ?? '-'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 19, color: AppColors.saffron),
          const SizedBox(width: 14),
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: Colors.black54),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

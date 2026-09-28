import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/forgot_password_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/home/home_screen.dart';
import '../features/placeholder/placeholder_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/main_shell.dart';

final _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final appRouter = GoRouter(
  navigatorKey: _rootKey,
  initialLocation: '/home',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/chat',
          builder: (context, state) => const PlaceholderScreen(
            title: 'Member Chat',
            icon: Icons.forum_outlined,
          ),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const PlaceholderScreen(
            title: 'Notifications',
            icon: Icons.notifications_none,
          ),
        ),
        GoRoute(
          path: '/more',
          builder: (context, state) => const PlaceholderScreen(
            title: 'More',
            icon: Icons.grid_view_outlined,
          ),
        ),
      ],
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/feature/:slug',
      builder: (context, state) {
        final slug = state.pathParameters['slug'] ?? 'feature';
        return PlaceholderScreen(title: _featureTitle(slug));
      },
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    appBar: AppBar(title: const Text('Not found')),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.explore_off_outlined, size: 48, color: Colors.black38),
          const SizedBox(height: 12),
          Text(state.error?.toString() ?? 'Page not found'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => context.go('/home'),
            child: const Text('Go home'),
          ),
        ],
      ),
    ),
  ),
);

String _featureTitle(String slug) {
  const map = {
    'aarti': 'Aarti',
    'programs': 'Programs',
    'gallery': 'Gallery',
    'members': 'Members',
    'donate': 'Donation',
    'calendar': 'Calendar',
    'videos': 'Videos',
    'meetings': 'Meetings',
  };
  return map[slug] ?? slug;
}

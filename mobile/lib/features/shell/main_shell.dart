import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _tabs = <({String label, IconData icon, IconData active, String route})>[
    (label: 'Home', icon: Icons.home_outlined, active: Icons.home, route: '/home'),
    (label: 'Chat', icon: Icons.chat_bubble_outline, active: Icons.chat_bubble, route: '/chat'),
    (label: 'Alerts', icon: Icons.notifications_outlined, active: Icons.notifications, route: '/notifications'),
    (label: 'More', icon: Icons.more_horiz, active: Icons.more_horiz, route: '/more'),
  ];

  void _onTap(int i) {
    if (i == _index) return;
    setState(() => _index = i);
    context.go(_tabs[i].route);
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final index = _tabs.indexWhere((t) => location.startsWith(t.route));
    _index = index == -1 ? 0 : index;

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _onTap,
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFFFE0B2),
        height: 66,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          for (final t in _tabs)
            NavigationDestination(
              icon: Icon(t.icon, color: Colors.black54),
              selectedIcon: Icon(t.active, color: AppColors.saffron),
              label: t.label,
            ),
        ],
      ),
    );
  }
}

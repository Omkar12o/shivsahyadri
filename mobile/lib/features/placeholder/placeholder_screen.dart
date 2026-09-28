import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.title, this.icon});

  final String title;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon ?? Icons.construction_outlined, size: 56, color: AppColors.saffron),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              const Text(
                'This screen is next in the port. The web version is the '
                'reference implementation for now.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, height: 1.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class MandalLogo extends StatelessWidget {
  const MandalLogo({super.key, this.size = 84});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [AppColors.gold, AppColors.saffron],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.saffron.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Center(
            child: Text(
              '\u{1F977}',
              style: TextStyle(fontSize: size * 0.5),
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Shivsaydri Ganesh Mandal',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.maroon,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/models/content.dart';
import '../../core/services/content_service.dart';
import '../../core/theme/app_theme.dart';
import '../auth/auth_scope.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ContentService _content = ContentService(Supabase.instance.client);

  MandalInfo? _mandal;
  List<Announcement> _announcements = [];
  List<Program> _programs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      _content.getMandalInfo().catchError((_) => null),
      _content.listAnnouncements(limit: 3).catchError((_) => <Announcement>[]),
      _content.listUpcomingPrograms(limit: 5).catchError((_) => <Program>[]),
    ]);

    if (!mounted) return;
    setState(() {
      _mandal = results[0] as MandalInfo?;
      _announcements = results[1] as List<Announcement>;
      _programs = results[2] as List<Program>;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final name = auth.profile?.fullName ?? 'Member';

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.saffron,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 168,
            backgroundColor: AppColors.saffron,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.fromLTRB(56, 0, 16, 14),
              title: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _mandal?.name ?? 'Shivsaydri Ganesh Mandal',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Namaskar, $name',
                    style: const TextStyle(fontSize: 11.5, color: Colors.white70),
                  ),
                ],
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.saffron, AppColors.maroon],
                  ),
                ),
                child: SafeArea(
                  child: Center(
                    child: Text(
                      '\u{1F977}',
                      style: const TextStyle(fontSize: 54),
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                tooltip: 'Profile',
                icon: const Icon(Icons.account_circle_outlined),
                onPressed: () => context.push('/profile'),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 48),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                const _SectionTitle('Quick Actions'),
                const SizedBox(height: 12),
                const _QuickActionsGrid(),
                const SizedBox(height: 24),
                if (_announcements.isNotEmpty) ...[
                  const _SectionTitle('Announcements'),
                  const SizedBox(height: 12),
                  ..._announcements.map((a) => _AnnouncementCard(announcement: a)),
                  const SizedBox(height: 24),
                ],
                const _SectionTitle('Upcoming Programs'),
                const SizedBox(height: 12),
                if (_programs.isEmpty && !_loading)
                  const _EmptyHint(
                    message: 'No upcoming programs right now.',
                  )
                else
                  ..._programs.map((p) => _ProgramCard(program: p)),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w800,
        color: AppColors.maroon,
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.black45),
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid();

  static const _actions = <({String label, IconData icon, String route})>[
    (label: 'Aarti', icon: Icons.self_improvement, route: '/feature/aarti'),
    (label: 'Programs', icon: Icons.event, route: '/feature/programs'),
    (label: 'Gallery', icon: Icons.photo_library_outlined, route: '/feature/gallery'),
    (label: 'Members', icon: Icons.groups_outlined, route: '/feature/members'),
    (label: 'Donate', icon: Icons.volunteer_activism_outlined, route: '/feature/donate'),
    (label: 'Calendar', icon: Icons.calendar_month_outlined, route: '/feature/calendar'),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _actions.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, i) {
        final a = _actions[i];
        return InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.push(a.route),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF0E4D6)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(a.icon, color: AppColors.saffron, size: 26),
                const SizedBox(height: 8),
                Text(
                  a.label,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF5D4037),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement});

  final Announcement announcement;

  Color get _accent => switch (announcement.priority) {
        AnnouncementPriority.urgent => const Color(0xFFD32F2F),
        AnnouncementPriority.high => const Color(0xFFEF6C00),
        AnnouncementPriority.medium => const Color(0xFF1E88E5),
        AnnouncementPriority.low => const Color(0xFF6D4C41),
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border(left: BorderSide(color: _accent, width: 5)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  announcement.title,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  announcement.priority.label,
                  style: TextStyle(
                    color: _accent,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            announcement.message,
            style: const TextStyle(fontSize: 13.5, height: 1.4, color: Color(0xFF4E342E)),
          ),
        ],
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  const _ProgramCard({required this.program});

  final Program program;

  @override
  Widget build(BuildContext context) {
    DateTime? date;
    try {
      date = DateTime.parse(program.eventDate);
    } catch (_) {
      date = null;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF3E0),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  date == null ? '--' : DateFormat('MMM').format(date).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryDark,
                  ),
                ),
                Text(
                  date == null ? '--' : DateFormat('d').format(date),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.maroon,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  program.title,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                ),
                const SizedBox(height: 4),
                Text(
                  [
                    if (program.startTime.isNotEmpty) program.startTime,
                    if (program.location != null && program.location!.isNotEmpty)
                      program.location!,
                  ].join('  |  '),
                  style: const TextStyle(fontSize: 12.5, color: Colors.black54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

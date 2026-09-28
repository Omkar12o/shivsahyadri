import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/content.dart';

class ContentService {
  ContentService(this._client);

  final SupabaseClient _client;

  Future<List<Announcement>> listAnnouncements({int limit = 3}) async {
    final data = await _client
        .from('announcements')
        .select()
        .eq('is_published', true)
        .order('created_at', ascending: false)
        .limit(limit);
    return data
        .map((e) => Announcement.fromMap(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<List<Program>> listUpcomingPrograms({int limit = 5}) async {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final data = await _client
        .from('programs')
        .select()
        .eq('is_published', true)
        .gte('event_date', today)
        .order('event_date', ascending: true)
        .limit(limit);
    return data
        .map((e) => Program.fromMap(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<MandalInfo?> getMandalInfo() async {
    final data =
        await _client.from('mandal_info').select().limit(1).maybeSingle();
    if (data == null) return null;
    return MandalInfo.fromMap(Map<String, dynamic>.from(data));
  }

  Future<DonationInfo?> getDonationInfo() async {
    final data = await _client
        .from('donation_info')
        .select()
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
    if (data == null) return null;
    return DonationInfo.fromMap(Map<String, dynamic>.from(data));
  }

  Future<Map<String, dynamic>?> getSiteSettings() async {
    final data =
        await _client.from('site_settings').select().limit(1).maybeSingle();
    if (data == null) return null;
    return Map<String, dynamic>.from(data);
  }
}

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/profile.dart';

class ProfileService {
  ProfileService(this._client);

  final SupabaseClient _client;

  Future<Profile?> getProfileByAuthId(String authUserId) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('auth_user_id', authUserId)
        .maybeSingle();
    if (data == null) return null;
    return Profile.fromMap(Map<String, dynamic>.from(data));
  }

  Future<Profile> updateOwnProfile(
    String authUserId,
    Map<String, dynamic> data,
  ) async {
    final updated = await _client
        .from('profiles')
        .update(data)
        .eq('auth_user_id', authUserId)
        .select()
        .single();
    return Profile.fromMap(Map<String, dynamic>.from(updated));
  }

  Future<List<Map<String, dynamic>>> getMemberDirectory() async {
    final data = await _client
        .from('public_member_directory')
        .select()
        .order('display_order', ascending: true, nullsFirst: false)
        .order('created_at', ascending: true);
    return data.map((e) => Map<String, dynamic>.from(e)).toList();
  }
}

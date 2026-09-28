class Env {
  const Env._();

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://rgulxhbgkjxiarlveouw.supabase.co',
  );

  static const String supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: 'sb_publishable_hgBvf5FwCCSFQ9xdyUdl_w_V75-JKaX',
  );

  static const String cloudinaryCloudName = String.fromEnvironment(
    'CLOUDINARY_CLOUD_NAME',
    defaultValue: 'dmst612g',
  );

  static const String cloudinaryUploadPreset = String.fromEnvironment(
    'CLOUDINARY_UPLOAD_PRESET',
    defaultValue: 'shiv_upload',
  );

  static const String apiUrl = String.fromEnvironment('API_URL');

  static bool get hasSupabaseConfig {
    if (supabaseUrl.isEmpty || supabasePublishableKey.isEmpty) return false;
    if (supabaseUrl.contains('your-project-ref')) return false;
    if (supabasePublishableKey.contains('your-supabase-anon-key')) return false;
    return true;
  }

  /// Web build of the same project, used as the email-confirmation landing page.
  static const String webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://shivsaydri-mandal.vercel.app',
  );
}

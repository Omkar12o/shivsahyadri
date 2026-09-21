-- ============================================================================
-- DEV-ONLY SEED DATA
-- Run this only against a development database (supabase db reset / seed).
-- It intentionally does NOT insert fake members or fake auth users.
-- ============================================================================

insert into public.aartis (title, category, time, lyrics, description, is_published)
values
  (
    'Shree Ganesh Aarti',
    'morning',
    '06:00',
    'सुखकर्ता दुखहर्ता, वार्ता विघ्नाची।
नुरवी पुरवी प्रेम, क्रपा जयाची।
सर्वांगी सुंदर, उटि शेंदुराची।
कंठी झळकें माळ, मुक्ताफळांची।।
जय देव जय देव। जय मंगल मूर्ति।
दर्शनमात्रे, मनकामना पुरती।।

गजवदन षडानन, वदन दाटलं।
तेजोमय सृष्टि, दाही दिशांतलं।।
ब्रह्मांड निर्मिले, अवघे पोटीपाठी।
तो वोवाळूं जन्मा, तो रक्षूं सृष्टी।।
जय देव जय देव। जय मंगल मूर्ति।
दर्शनमात्रे, मनकामना पुरती।।',
    'Traditional morning aarti of Lord Ganesha sung by the mandal family.',
    true
  ),
  (
    'Shree Ganesh Aarti',
    'evening',
    '19:30',
    'सुखकर्ता दुखहर्ता, वार्ता विघ्नाची।
नुरवी पुरवी प्रेम, क्रपा जयाची।
सर्वांगी सुंदर, उटि शेंदुराची।
कंठी झळकें माळ, मुक्ताफळांची।।
जय देव जय देव। जय मंगल मूर्ति।
दर्शनमात्रे, मनकामना पुरती।।',
    'Evening aarti during Ganpati utsav.',
    true
  )
on conflict do nothing;

insert into public.programs (title, event_date, start_time, end_time, description, location, is_published)
values
  (
    'Ganesh Sthapana Mahapuja',
    current_date,
    '09:00',
    '12:00',
    'Lord Ganesha''s idol installation puja with full vedic rituals.',
    'Mandal Office, Village Center',
    true
  )
on conflict do nothing;

insert into public.announcements (title, message, priority, is_published)
values
  (
    'Welcome to Shivsaydri Ganesh Mandal',
    'Om Ganeshaya Namah. कृपया मंडळाच्या सर्व उपक्रमांमध्ये सहभागी व्हा. गणपती बाप्पा मोरया 🙏',
    'high',
    true
  )
on conflict do nothing;

insert into public.donation_info (mandal_name, upi_id, instructions, is_active)
values (
  'Shivsaydri Ganesh Mandal',
  'shivsaydrimandal@upi',
  'Scan the QR code or send via UPI ID. For bank transfer use the account details below. All donations are used for community welfare activities during Ganeshotsav.'
)
on conflict do nothing;

insert into public.mandal_info (name, village, established_year, history, objectives, contact_phone, contact_email, address)
values (
  'Shivsaydri Ganesh Mandal',
  'Umarkhanchan',
  1995,
  'Established to celebrate Ganeshotsav and serve the community of Umarkhanchan.',
  'Community service, cultural programs and spiritual activities during Ganeshotsav.',
  '+91 98765 43210',
  'mandal@shivsaydri.org',
  'Near Ganpati Mandap, Umarkhanchan, Maharashtra'
)
on conflict do nothing;

insert into public.site_settings (ganpati_image_url, countdown_target, hero_welcome, hero_message, announcements_title, programs_title, gallery_title, birthday_title, donation_title)
values (
  null,
  current_date + 90,
  'श्री गणेशाय नमः',
  'Shivsaydri Ganesh Mandal, Umarkhanchan',ad
  'Recent Announcements',
  'Upcoming Programs',
  'Moments of Ganeshotsav',
  'Today''s Birthdays',
  'Support the Mandal'
)
on conflict do nothing;

insert into public.admin_settings (notification_birthday_enabled, notification_announcement_enabled, member_listing_enabled, gallery_enabled, donations_enabled, birthday_cron_schedule)
values (true, true, true, true, true, '30 18 * * *')
on conflict do nothing;
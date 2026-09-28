enum AnnouncementPriority {
  low('low', 'Low'),
  medium('medium', 'Medium'),
  high('high', 'High'),
  urgent('urgent', 'Urgent');

  const AnnouncementPriority(this.wire, this.label);

  final String wire;
  final String label;

  static AnnouncementPriority fromWire(String? value) {
    for (final p in AnnouncementPriority.values) {
      if (p.wire == value) return p;
    }
    return AnnouncementPriority.medium;
  }
}

class Announcement {
  const Announcement({
    required this.id,
    required this.title,
    required this.message,
    this.imageUrl,
    this.priority = AnnouncementPriority.medium,
    this.startDate,
    this.endDate,
  });

  final String id;
  final String title;
  final String message;
  final String? imageUrl;
  final AnnouncementPriority priority;
  final String? startDate;
  final String? endDate;

  factory Announcement.fromMap(Map<String, dynamic> map) {
    return Announcement(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      message: map['message']?.toString() ?? '',
      imageUrl: map['image_url']?.toString(),
      priority: AnnouncementPriority.fromWire(map['priority']?.toString()),
      startDate: map['start_date']?.toString(),
      endDate: map['end_date']?.toString(),
    );
  }
}

class Program {
  const Program({
    required this.id,
    required this.title,
    required this.eventDate,
    required this.startTime,
    this.endTime,
    this.description,
    this.location,
    this.imageUrl,
  });

  final String id;
  final String title;
  final String eventDate;
  final String startTime;
  final String? endTime;
  final String? description;
  final String? location;
  final String? imageUrl;

  factory Program.fromMap(Map<String, dynamic> map) {
    return Program(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      eventDate: map['event_date']?.toString() ?? '',
      startTime: map['start_time']?.toString() ?? '',
      endTime: map['end_time']?.toString(),
      description: map['description']?.toString(),
      location: map['location']?.toString(),
      imageUrl: map['image_url']?.toString(),
    );
  }
}

class MandalInfo {
  const MandalInfo({
    required this.name,
    required this.village,
    this.history,
    this.contactPhone,
    this.address,
  });

  final String name;
  final String village;
  final String? history;
  final String? contactPhone;
  final String? address;

  factory MandalInfo.fromMap(Map<String, dynamic> map) {
    return MandalInfo(
      name: map['name']?.toString() ?? 'Shivsaydri Ganesh Mandal',
      village: map['village']?.toString() ?? '',
      history: map['history']?.toString(),
      contactPhone: map['contact_phone']?.toString(),
      address: map['address']?.toString(),
    );
  }
}

class DonationInfo {
  const DonationInfo({
    required this.mandalName,
    required this.upiId,
    this.bankName,
    this.accountNumber,
    this.ifscCode,
    this.instructions,
  });

  final String mandalName;
  final String upiId;
  final String? bankName;
  final String? accountNumber;
  final String? ifscCode;
  final String? instructions;

  factory DonationInfo.fromMap(Map<String, dynamic> map) {
    return DonationInfo(
      mandalName: map['mandal_name']?.toString() ?? '',
      upiId: map['upi_id']?.toString() ?? '',
      bankName: map['bank_name']?.toString(),
      accountNumber: map['account_number']?.toString(),
      ifscCode: map['ifsc_code']?.toString(),
      instructions: map['instructions']?.toString(),
    );
  }
}

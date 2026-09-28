enum UserRole {
  admin('admin', 'Admin'),
  member('member', 'Member'),
  superAdmin('super_admin', 'Super Admin');

  const UserRole(this.wire, this.label);

  final String wire;
  final String label;

  static UserRole? fromWire(String? value) {
    for (final role in UserRole.values) {
      if (role.wire == value) return role;
    }
    return null;
  }

  bool get isAdmin => this == UserRole.admin || this == UserRole.superAdmin;
}

class Profile {
  const Profile({
    required this.id,
    required this.fullName,
    required this.userId,
    this.authUserId,
    this.email,
    this.mobile,
    this.village,
    this.address,
    this.dateOfBirth,
    this.birthdayTime,
    this.birthdayVisibility = true,
    this.profilePhotoUrl,
    this.cloudinaryPublicId,
    this.position,
    this.bio,
    this.displayOrder,
    this.role = UserRole.member,
    this.isActive = true,
  });

  final String id;
  final String fullName;
  final String userId;
  final String? authUserId;
  final String? email;
  final String? mobile;
  final String? village;
  final String? address;
  final String? dateOfBirth;
  final String? birthdayTime;
  final bool birthdayVisibility;
  final String? profilePhotoUrl;
  final String? cloudinaryPublicId;
  final String? position;
  final String? bio;
  final int? displayOrder;
  final UserRole role;
  final bool isActive;

  bool get isAdmin => role.isAdmin;

  static String? _str(dynamic v) {
    if (v == null) return null;
    final s = v.toString();
    return s.isEmpty ? null : s;
  }

  factory Profile.fromMap(Map<String, dynamic> map) {
    return Profile(
      id: map['id']?.toString() ?? '',
      authUserId: _str(map['auth_user_id']),
      fullName: _str(map['full_name']) ?? 'Member',
      userId: _str(map['user_id']) ?? '',
      email: _str(map['email']),
      mobile: _str(map['mobile']),
      village: _str(map['village']),
      address: _str(map['address']),
      dateOfBirth: _str(map['date_of_birth']),
      birthdayTime: _str(map['birthday_time']),
      birthdayVisibility: map['birthday_visibility'] as bool? ?? true,
      profilePhotoUrl: _str(map['profile_photo_url']),
      cloudinaryPublicId: _str(map['cloudinary_public_id']),
      position: _str(map['position']),
      bio: _str(map['bio']),
      displayOrder: map['display_order'] as int?,
      role: UserRole.fromWire(_str(map['role'])) ?? UserRole.member,
      isActive: map['is_active'] as bool? ?? true,
    );
  }
}

class RegisterData {
  const RegisterData({
    required this.fullName,
    required this.userId,
    required this.email,
    required this.mobile,
    required this.password,
    required this.confirmPassword,
    required this.dateOfBirth,
    required this.birthdayTime,
    required this.village,
    required this.address,
    required this.birthdayVisibility,
  });

  final String fullName;
  final String userId;
  final String email;
  final String mobile;
  final String password;
  final String confirmPassword;
  final String dateOfBirth;
  final String birthdayTime;
  final String village;
  final String address;
  final bool birthdayVisibility;
}

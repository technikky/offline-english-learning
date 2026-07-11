import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class UserProfile {
  final int id;
  final String email;
  final String role;
  final String displayName;
  final bool mustChangePassword;

  UserProfile({
    required this.id,
    required this.email,
    required this.role,
    required this.displayName,
    required this.mustChangePassword,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as int,
      email: json['email'] as String,
      role: json['role'] as String,
      displayName: json['displayName'] as String,
      mustChangePassword: json['mustChangePassword'] as bool,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'displayName': displayName,
        'mustChangePassword': mustChangePassword,
      };
}

class AuthSession {
  final String accessToken;
  final String refreshToken;
  final UserProfile user;

  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  static const _key = 'auth_session';

  static Future<AuthSession?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return null;

    final json = jsonDecode(raw) as Map<String, dynamic>;
    return AuthSession(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: UserProfile.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  static Future<void> save(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode({
        'accessToken': session.accessToken,
        'refreshToken': session.refreshToken,
        'user': session.user.toJson(),
      }),
    );
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}

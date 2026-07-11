import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_session.dart';
import 'server_config.dart';

class HealthResponse {
  final String status;
  final bool dbConnected;
  final String timestamp;

  HealthResponse({
    required this.status,
    required this.dbConnected,
    required this.timestamp,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String,
      dbConnected: json['dbConnected'] as bool,
      timestamp: json['timestamp'] as String,
    );
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiClient {
  final ServerConfig config;

  ApiClient(this.config);

  Future<HealthResponse> checkHealth() async {
    final res = await http
        .get(config.healthUri())
        .timeout(const Duration(seconds: 5));

    if (res.statusCode != 200) {
      throw ApiException('Server returned ${res.statusCode}');
    }
    return HealthResponse.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<AuthSession> login(String email, String password) async {
    final res = await http
        .post(
          config.apiUri('/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(const Duration(seconds: 10));

    final body = jsonDecode(res.body) as Map<String, dynamic>;

    if (res.statusCode != 200) {
      throw ApiException(body['error'] as String? ?? 'Login failed');
    }

    return AuthSession(
      accessToken: body['accessToken'] as String,
      refreshToken: body['refreshToken'] as String,
      user: UserProfile.fromJson(body['user'] as Map<String, dynamic>),
    );
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;
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

class ApiClient {
  final ServerConfig config;

  ApiClient(this.config);

  Future<HealthResponse> checkHealth() async {
    final res = await http
        .get(config.healthUri())
        .timeout(const Duration(seconds: 5));

    if (res.statusCode != 200) {
      throw Exception('Server returned ${res.statusCode}');
    }
    return HealthResponse.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}

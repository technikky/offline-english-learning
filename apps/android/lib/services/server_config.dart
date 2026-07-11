import 'package:shared_preferences/shared_preferences.dart';

/// Persists the LAN address of the school's backend server so the app
/// only needs to be pointed at it once per device.
class ServerConfig {
  static const _hostKey = 'server_host';
  static const _portKey = 'server_port';
  static const defaultPort = 4310;

  final String host;
  final int port;

  const ServerConfig({required this.host, required this.port});

  Uri healthUri() => apiUri('/health');

  Uri apiUri(String path) => Uri.parse('http://$host:$port$path');

  static Future<ServerConfig?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final host = prefs.getString(_hostKey);
    if (host == null || host.isEmpty) return null;
    final port = prefs.getInt(_portKey) ?? defaultPort;
    return ServerConfig(host: host, port: port);
  }

  static Future<void> save(ServerConfig config) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_hostKey, config.host);
    await prefs.setInt(_portKey, config.port);
  }
}

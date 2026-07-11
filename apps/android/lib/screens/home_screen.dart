import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth_session.dart';
import '../services/server_config.dart';
import 'connect_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final ServerConfig config;
  final AuthSession session;

  const HomeScreen({super.key, required this.config, required this.session});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HealthResponse? _health;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final health = await ApiClient(widget.config).checkHealth();
      setState(() {
        _health = health;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = 'Lost connection to server');
    }
  }

  Future<void> _logout() async {
    await AuthSession.clear();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(config: widget.config)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.session.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline English Learning'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Change server',
            onPressed: () async {
              await AuthSession.clear();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const ConnectScreen()),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.displayName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text('${user.email} — ${user.role}'),
                    const SizedBox(height: 12),
                    OutlinedButton(onPressed: _logout, child: const Text('Log out')),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Server: ${widget.config.host}:${widget.config.port}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    if (_error != null)
                      Text(_error!, style: const TextStyle(color: Colors.red))
                    else if (_health != null)
                      Text(
                        'Connected — db: ${_health!.dbConnected}, '
                        'checked at ${_health!.timestamp}',
                        style: const TextStyle(color: Colors.green),
                      )
                    else
                      const Text('Checking connection...'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Class and lesson features arrive in later stages. This '
                  'screen proves the Android client can log in against '
                  'the school\'s offline backend over the LAN.',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

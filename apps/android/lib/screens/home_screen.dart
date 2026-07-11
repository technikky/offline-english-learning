import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/server_config.dart';
import 'connect_screen.dart';

class HomeScreen extends StatefulWidget {
  final ServerConfig config;

  const HomeScreen({super.key, required this.config});

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline English Learning'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Change server',
            onPressed: () {
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
                  'Login and class features arrive in Stage 3 '
                  '(Authentication and user management). This screen '
                  'proves the Android client can reach the school\'s '
                  'offline backend over the LAN.',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

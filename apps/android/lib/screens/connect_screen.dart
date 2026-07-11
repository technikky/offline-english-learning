import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/server_config.dart';
import 'login_screen.dart';

/// Manual LAN server entry. Automatic discovery (mDNS/UDP broadcast for the
/// school server) is a candidate follow-up once real deployments show
/// whether manual entry is too much friction for teachers/IT staff.
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  final _hostController = TextEditingController();
  final _portController = TextEditingController(
    text: ServerConfig.defaultPort.toString(),
  );
  bool _connecting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    ServerConfig.load().then((saved) {
      if (saved != null && mounted) {
        _hostController.text = saved.host;
        _portController.text = saved.port.toString();
      }
    });
  }

  Future<void> _connect() async {
    final host = _hostController.text.trim();
    final port = int.tryParse(_portController.text.trim()) ?? ServerConfig.defaultPort;

    if (host.isEmpty) {
      setState(() => _error = 'Enter the server\'s LAN IP address.');
      return;
    }

    setState(() {
      _connecting = true;
      _error = null;
    });

    final config = ServerConfig(host: host, port: port);
    try {
      await ApiClient(config).checkHealth();
      await ServerConfig.save(config);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => LoginScreen(config: config)),
      );
    } catch (e) {
      setState(() => _error = 'Could not reach server at $host:$port');
    } finally {
      if (mounted) setState(() => _connecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connect to school server')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Enter the LAN IP address of your school\'s AI English server.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _hostController,
              decoration: const InputDecoration(
                labelText: 'Server IP address',
                hintText: 'e.g. 192.168.1.50',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.text,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _portController,
              decoration: const InputDecoration(
                labelText: 'Port',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 20),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            FilledButton(
              onPressed: _connecting ? null : _connect,
              child: _connecting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Connect'),
            ),
          ],
        ),
      ),
    );
  }
}

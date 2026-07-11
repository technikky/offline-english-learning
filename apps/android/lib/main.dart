import 'package:flutter/material.dart';
import 'screens/connect_screen.dart';
import 'screens/home_screen.dart';
import 'services/server_config.dart';

void main() {
  runApp(const EnglishClassApp());
}

class EnglishClassApp extends StatelessWidget {
  const EnglishClassApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Offline English Learning',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const StartupGate(),
    );
  }
}

/// Decides whether to show the server-connect screen or go straight to the
/// home screen, based on whether a server was previously configured.
class StartupGate extends StatelessWidget {
  const StartupGate({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ServerConfig?>(
      future: ServerConfig.load(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final config = snapshot.data;
        if (config == null) {
          return const ConnectScreen();
        }
        return HomeScreen(config: config);
      },
    );
  }
}

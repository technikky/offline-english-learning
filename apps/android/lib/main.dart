import 'package:flutter/material.dart';
import 'screens/connect_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/auth_session.dart';
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

class _StartupState {
  final ServerConfig? config;
  final AuthSession? session;

  _StartupState(this.config, this.session);
}

/// Decides which screen to land on based on whether a server has been
/// configured and whether a login session already exists for it.
class StartupGate extends StatelessWidget {
  const StartupGate({super.key});

  Future<_StartupState> _load() async {
    final config = await ServerConfig.load();
    final session = config == null ? null : await AuthSession.load();
    return _StartupState(config, session);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_StartupState>(
      future: _load(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final state = snapshot.data!;
        if (state.config == null) {
          return const ConnectScreen();
        }
        if (state.session == null) {
          return LoginScreen(config: state.config!);
        }
        return HomeScreen(config: state.config!, session: state.session!);
      },
    );
  }
}

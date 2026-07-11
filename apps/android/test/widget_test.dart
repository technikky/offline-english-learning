import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:englishclass_android/main.dart';
import 'package:englishclass_android/screens/connect_screen.dart';

void main() {
  testWidgets('Shows the connect screen when no server is configured yet', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const EnglishClassApp());
    await tester.pumpAndSettle();

    expect(find.byType(ConnectScreen), findsOneWidget);
    expect(find.text('Connect to school server'), findsOneWidget);
  });
}

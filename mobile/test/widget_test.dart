import 'package:flutter_test/flutter_test.dart';

import 'package:shivsaydri_mobile/main.dart';

void main() {
  testWidgets('app boots into the home shell', (WidgetTester tester) async {
    await tester.pumpWidget(const ShimlaApp());
    await tester.pump();

    expect(find.text('Quick Actions'), findsOneWidget);
  });
}

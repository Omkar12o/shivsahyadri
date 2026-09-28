import 'package:flutter/widgets.dart';

import 'auth_controller.dart';

class AuthScope extends InheritedNotifier<AuthController> {
  const AuthScope({
    super.key,
    required AuthController controller,
    required super.child,
  }) : super(notifier: controller);

  static AuthController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AuthScope>();
    assert(scope?.notifier != null, 'AuthScope is missing above this widget');
    return scope!.notifier!;
  }

  /// Read without subscribing to rebuilds.
  static AuthController read(BuildContext context) {
    final scope = context.getInheritedWidgetOfExactType<AuthScope>();
    assert(scope?.notifier != null, 'AuthScope is missing above this widget');
    return scope!.notifier!;
  }
}

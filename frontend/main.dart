import 'package:flutter/material.dart';
import 'lib/ui/retro_theme.dart';
import 'lib/features/auth/login_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '2.1_lib/2.1.2_ui/2.1.2.1_pixel_button.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  // ...existing code...
  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: Firebase.initializeApp(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Text('Firebase init failed');
        }
        if (snapshot.connectionState == ConnectionState.done) {
          return MaterialApp(
            title: 'Digital Double Mobile',
            theme: retroTheme,
            home: AuthGate(),
          );
        }
        return CircularProgressIndicator();
      },
    );
  }
}

class HomeScreen extends StatelessWidget {
  // ...existing code...
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Pixel Button Demo')),
      body: Center(
        child: PixelButton(
          onPressed: () {
            // Handle button press
            print('Pixel Button pressed!');
          },
          label: 'Press Me',
        ),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Text('Auth error');
        }
        if (snapshot.connectionState == ConnectionState.active) {
          return snapshot.data?.uid != null 
            ? HomeScreen() 
            : LoginScreen();
        }
        return CircularProgressIndicator();
      },
    );
  }
}

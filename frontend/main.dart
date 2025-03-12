import 'package:flutter/material.dart';
import '2.1_lib/2.1.2_ui/2.1.2.1_pixel_button.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  // ...existing code...
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Digital Double Mobile',
      home: HomeScreen(),
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

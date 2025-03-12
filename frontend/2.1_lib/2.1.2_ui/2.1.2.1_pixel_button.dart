import 'package:flutter/material.dart';
import '2.1.1.1_app_config.dart';

class PixelButton extends StatelessWidget {
  final VoidCallback onPressed;
  final String label;

  const PixelButton({super.key, required this.onPressed, required this.label});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: EdgeInsets.all(AppConfig.pixelSize),
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.white, width: AppConfig.pixelSize),
            left: BorderSide(color: Colors.white, width: AppConfig.pixelSize),
            right: BorderSide(color: AppConfig.primaryColor, width: AppConfig.pixelSize),
            bottom: BorderSide(color: AppConfig.primaryColor, width: AppConfig.pixelSize),
          ),
          color: Colors.black,
        ),
        child: Text(label, style: TextStyle(
          fontFamily: 'RetroGaming',
          color: Colors.white,
          shadows: [Shadow(color: Colors.black38, offset: Offset(2,2))]
        )),
      ),
    );
  }
}
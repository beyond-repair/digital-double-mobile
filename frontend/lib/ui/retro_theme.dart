import 'package:flutter/material.dart';

class RetroTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: Colors.purple[800],
      scaffoldBackgroundColor: Colors.black,
      textTheme: const TextTheme(
        bodyLarge: TextStyle(fontFamily: 'PressStart2P'),
        bodyMedium: TextStyle(fontFamily: 'PressStart2P'),
      ),
      // CRT effect shader configuration
      extensions: [
        ShaderEffect(
          fragmentShader: 'assets/shaders/crt_effect.frag',
        ),
      ],
    );
  }
}

class ShaderEffect extends ThemeExtension<ShaderEffect> {
  final String fragmentShader;
  
  const ShaderEffect({required this.fragmentShader});
  
  @override
  ThemeExtension<ShaderEffect> copyWith({String? fragmentShader}) {
    return ShaderEffect(fragmentShader: fragmentShader ?? this.fragmentShader);
  }

  @override
  ThemeExtension<ShaderEffect> lerp(ThemeExtension<ShaderEffect>? other, double t) {
    return this;
  }
}

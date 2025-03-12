abstract class AppConfig {
  // Pixel Art Configuration
  static const double pixelSize = 4.0;
  static const Color primaryColor = Color(0xFF6BD26B);
  
  // API Endpoints
  static const String apiBaseUrl = 'https://api.digitaldouble.com/v1';
  static const String wsUrl = 'wss://api.digitaldouble.com/updates';
  
  // Offline AI Model
  static const String deepseatModel = 'assets/models/deepseat.tflite';
}
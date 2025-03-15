import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_neumorphic/flutter_neumorphic.dart';
import 'package:google_fonts/google_fonts.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _password = '';
  final auth = FirebaseAuth.instance;

  final _formValidator = const FormValidator();

  final _isLoading = ValueNotifier<bool>(false);

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  Timer? _debounceTimer;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _debounceTimer?.cancel();
    _isLoading.dispose();
    super.dispose();
  }

  void _debounceValidation() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (mounted) _formKey.currentState?.validate();
    });
  }

  Future<void> _handleSignIn() async {
    if (!_formKey.currentState!.validate()) return;

    _isLoading.value = true;
    try {
      await auth.signInWithEmailAndPassword(
        email _email:.trim(),
        password: _password,
      );
    } on FirebaseAuthException catch (e) {
      _showError(e.message ?? 'Authentication failed');
    } finally {
      _isLoading.value = false;
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
    ScaffoldMessenger.of(context).showMaterialBanner(
      MaterialBanner(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => ScaffoldMessenger.of(context)
                .hideCurrentMaterialBanner(),
            child: const Text('Dismiss'),
          ),
        ],
      ),
    );
  }

  final _crtBorderRadius = BorderRadius.circular(8);
  final _crtBorderColor = const Color(0xFF2B2B2B);
  final _pixelFont = GoogleFonts.pressStart2P();
  final _primaryColor = const Color(0xFF4A90E2);
  final _secondaryColor = const Color(0xFF87CEEB);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF0F0F0F),
                  const Color(0xFF1A1A1A),
                ],
              ),
              borderRadius: _crtBorderRadius,
            ),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  borderRadius: _crtBorderRadius,
                  border: Border.all(
                    color: _crtBorderColor,
                    width: 4,
                  ),
                ),
                child: ValueListenableBuilder<bool>(
                  valueListenable: _isLoading,
                  builder: (context, isLoading, child) {
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Digital Double Mobile',
                          style: _pixelFont.copyWith(
                            fontSize: 24,
                            color: _primaryColor,
                          ),
                        ),
                        const SizedBox(height: 48),
                        TextFormField(
                          key: const Key('email'),
                          decoration: InputDecoration(
                            labelText: 'Email',
                            labelStyle: _pixelFont.copyWith(color: _secondaryColor),
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: _secondaryColor),
                            ),
                            focusedBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: _primaryColor),
                            ),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          validator: _formValidator.validateEmail,
                          onSaved: (value) => _email = value?.trim() ?? '',
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.email],
                          controller: _emailController,
                          onChanged: (_) => _debounceValidation(),
                          style: _pixelFont.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          key: const Key('password'),
                          decoration: InputDecoration(
                            labelText: 'Password',
                            labelStyle: _pixelFont.copyWith(color: _secondaryColor),
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: _secondaryColor),
                            ),
                            focusedBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: _primaryColor),
                            ),
                          ),
                          obscureText: true,
                          validator: _formValidator.validatePassword,
                          onSaved: (value) => _password = value ?? '',
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.password],
                          controller: _passwordController,
                          onChanged: (_) => _debounceValidation(),
                          style: _pixelFont.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 24),
                        NeumorphicButton(
                          style: NeumorphicStyle(
                            color: _primaryColor,
                            depth: 8,
                            intensity: 1,
                          ),
                          onPressed: isLoading ? null : _handleSignIn,
                          child: Text(
                            isLoading ? 'Please wait...' : 'Sign In',
                            style: _pixelFont.copyWith(color: Colors.white, fontSize: 18),
                          ),
                        ),
                        if (isLoading)
                          const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

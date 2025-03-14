import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _password = '';
  final auth = FirebaseAuth.instance;

  // Memoize form validation
  final _formValidator = const FormValidator();
  
  // Use ValueNotifier for better state management
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
        email: _email.trim(),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: ValueListenableBuilder<bool>(
        valueListenable: _isLoading,
        builder: (context, isLoading, child) {
          return Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextFormField(
                        key: const Key('email'),
                        decoration: const InputDecoration(labelText: 'Email'),
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        validator: _formValidator.validateEmail,
                        onSaved: (value) => _email = value?.trim() ?? '',
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        controller: _emailController,
                        onChanged: (_) => _debounceValidation(),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        key: const Key('password'),
                        decoration: const InputDecoration(labelText: 'Password'),
                        obscureText: true,
                        validator: _formValidator.validatePassword,
                        onSaved: (value) => _password = value ?? '',
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        controller: _passwordController,
                        onChanged: (_) => _debounceValidation(),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: isLoading ? null : _handleSignIn,
                        child: Text(isLoading ? 'Please wait...' : 'Sign In'),
                      ),
                    ],
                  ),
                ),
              ),
              if (isLoading)
                const Center(child: CircularProgressIndicator()),
            ],
          );
        },
      ),
    );
  }
}

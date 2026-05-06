import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'home_screen.dart';
import '../widgets/logo.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLogin = true;
  bool _isLoading = false;
  bool _showPassword = false;
  String _errorMessage = '';

  final String baseUrl = 'http://localhost:5000';

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    final endpoint = _isLogin ? '/api/auth/login' : '/api/auth/register';
    final body = {
      'email': _emailController.text.trim(),
      'password': _passwordController.text,
      if (!_isLogin) 'name': _nameController.text.trim(),
    };

    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('user', json.encode(data['user']));

        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      } else {
        setState(() {
          _errorMessage = data['msg'] ?? 'Authentication failed';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Cannot connect to server. Check your backend!';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              // Logo
              const Center(
                child: Logo(
                  size: 180,
                  showTagline: true,
                ),
              ),
              const SizedBox(height: 48),
              
              // Auth Card
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                  side: const BorderSide(color: Color(0xFF1E293B), width: 1),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          _isLogin ? 'SIGN IN' : 'CREATE ACCOUNT',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isLogin ? 'Welcome back' : 'Join the Aggregator',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                            color: Color(0xFF64748B), // slate-500
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isLogin ? 'Welcome back' : 'Join the Aggregator',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),
                        
                        if (_errorMessage.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              border: Border.all(color: Colors.red.withOpacity(0.4)),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              _errorMessage,
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        
                        if (!_isLogin)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                hintText: 'FULL NAME',
                                hintStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
                            ),
                          ),
                        
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            hintText: 'EMAIL ADDRESS',
                            hintStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          keyboardType: TextInputType.emailAddress,
                          validator: (val) => val?.contains('@') ?? false ? null : 'Invalid email',
                        ),
                        const SizedBox(height: 16),
                        
                        TextFormField(
                          controller: _passwordController,
                          obscureText: !_showPassword,
                          decoration: InputDecoration(
                            hintText: 'PASSWORD',
                            hintStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _showPassword ? Icons.visibility : Icons.visibility_off,
                                color: Colors.grey,
                              ),
                              onPressed: () => setState(() => _showPassword = !_showPassword),
                            ),
                          ),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          validator: (val) => (val?.length ?? 0) >= 6 ? null : 'Min 6 characters',
                        ),
                        const SizedBox(height: 24),
                        
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleSubmit,
                          child: Text(
                            _isLoading
                                ? 'VERIFYING...'
                                : (_isLogin ? 'SIGN IN' : 'GET STARTED'),
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _isLogin = !_isLogin;
                              _errorMessage = '';
                            });
                          },
                          child: Text(
                            _isLogin
                                ? 'NEW TO RIDEWISE? REGISTER HERE'
                                : 'ALREADY HAVE AN ACCOUNT? LOG IN',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

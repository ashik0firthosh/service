import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences.dart';

class AuthProvider with ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  String? _userId;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  String? get userId => _userId;

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String userType,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:5000/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
          'userType': userType,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        _token = data['token'];
        _userId = data['userId'];
        _isAuthenticated = true;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('userId', _userId!);

        notifyListeners();
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to register');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

// ... rest of your existing methods (login, logout, etc.)
}
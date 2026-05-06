import 'package:flutter/material.dart';

class Logo extends StatelessWidget {
  final double size;
  final bool showTagline;

  const Logo({
    super.key,
    this.size = 160,
    this.showTagline = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo SVG representation in Flutter
        CustomPaint(
          size: Size(size, size),
          painter: LogoPainter(isDark: isDark),
        ),
        if (showTagline) ...[
          const SizedBox(height: 8),
          Text(
            'COMPARE. SAVE. RIDE.',
            style: TextStyle(
              fontSize: size * 0.0625, // Proportional to size
              fontWeight: FontWeight.bold,
              letterSpacing: size * 0.03,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), // slate-400/500
            ),
          ),
        ],
      ],
    );
  }
}

class LogoPainter extends CustomPainter {
  final bool isDark;

  LogoPainter({this.isDark = true});

  @override
  void paint(Canvas canvas, Size size) {
    final double scale = size.width / 500;

    // Gradient for pin
    final gradient = LinearGradient(
      colors: [
        Color(0xFF10B981), // green-500
        Color(0xFF0D9488), // teal-600
      ],
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
    );

    final pinGradientPaint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    // Location Pin Path
    final pinPath = Path();
    pinPath.moveTo(250 * scale, 80 * scale);
    pinPath.cubicTo(
      180 * scale, 80 * scale,
      125 * scale, 135 * scale,
      125 * scale, 205 * scale,
    );
    pinPath.cubicTo(
      125 * scale, 240 * scale,
      140 * scale, 270 * scale,
      160 * scale, 295 * scale,
    );
    pinPath.lineTo(250 * scale, 420 * scale);
    pinPath.lineTo(340 * scale, 295 * scale);
    pinPath.cubicTo(
      360 * scale, 270 * scale,
      375 * scale, 240 * scale,
      375 * scale, 205 * scale,
    );
    pinPath.cubicTo(
      375 * scale, 135 * scale,
      320 * scale, 80 * scale,
      250 * scale, 80 * scale,
    );
    pinPath.close();

    canvas.drawPath(pinPath, pinGradientPaint);

    // Inner white circle
    final whitePaint = Paint()..color = Colors.white;
    canvas.drawCircle(
      Offset(250 * scale, 205 * scale),
      50 * scale,
      whitePaint,
    );

    // Inner gradient dot
    final dotGradientPaint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawCircle(
      Offset(250 * scale, 205 * scale),
      25 * scale,
      dotGradientPaint,
    );

    // RIDEWISE text
    final textPainter = TextPainter(
      text: TextSpan(
        text: 'RIDEWISE',
        style: TextStyle(
          fontSize: 48 * scale,
          fontWeight: FontWeight.w900,
          letterSpacing: 12 * scale,
          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), // slate-300/600
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size.width - textPainter.width) / 2,
        470 * scale - textPainter.height,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

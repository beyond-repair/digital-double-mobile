import 'package:flutter/material.dart';
import '../2.1.2_ui/2.1.2.2_crt_overlay.dart';
import '../2.1.2_ui/2.1.2.3_ar_dashboard.dart';
import '../2.1.1_core/2.1.1.1_app_config.dart';

class AgentChat extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CRTEffect(
      child: Container(
        decoration: BoxDecoration(
          border: PixelTheme.pixelBorder(),
          color: Colors.black.withOpacity(0.7),
        ),
        child: Column(
          children: [
            Expanded(child: _buildMessageList()),
            PixelTextInput(onSubmit: _handleMessage),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    return ListView.builder(
      itemCount: messages.length,
      itemBuilder: (ctx, i) => ListTile(
        leading: AnimatedPixelSprite(asset: messages[i].agent.portrait),
        title: TypewriterText(
          text: messages[i].text,
          style: PixelTheme.pixelText(),
        ),
      ),
    );
  }

  void _handleMessage(String text) {
    // Message handling logic
  }
}
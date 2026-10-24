import { Chat } from '../types';

export function exportChatAsText(chat: Chat) {
  const lines: string[] = [];
  lines.push(`=== HISTORIAL DE CHAT: ${chat.name} (PidgeX) ===`);
  lines.push(`Fecha de exportación: ${new Date().toLocaleString()}`);
  lines.push('========================================\n');

  chat.messages.forEach((m) => {
    lines.push(`[${m.timestamp}] ${m.senderName}: ${m.text || `[${m.type}]`}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat_${chat.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

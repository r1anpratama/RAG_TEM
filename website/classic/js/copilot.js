/**
 * Geotechnical Copilot Chat Interface & Citations.
 */

async function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const query = input.value.trim();
  if (!query) return;

  appendChatMessage('User', query, false);
  input.value = '';

  try {
    const resp = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await resp.json();
    appendChatMessage('SeismoAgent-TW', data.answer, true, data.citations);
  } catch (err) {
    appendChatMessage('System', 'Error communicating with copilot server.', false);
  }
}

function askCopilot(query) {
  document.getElementById('chat-input').value = query;
  handleChatSubmit(new Event('submit'));
}

function appendChatMessage(sender, text, isAi, citations = []) {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = "flex gap-3 items-start";

  let citationHtml = '';
  if (citations && citations.length > 0) {
    citationHtml = `<div class="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
      <strong class="text-cyan-400">TEM PSHA 2025 Citations:</strong>
      <ul class="list-disc pl-4 space-y-0.5 mt-1">
        ${citations.map(c => `<li><strong>${c.section}</strong>: ${c.preview}</li>`).join('')}
      </ul>
    </div>`;
  }

  div.innerHTML = `
    <div class="w-7 h-7 rounded-full ${isAi ? 'bg-cyan-600' : 'bg-slate-700'} flex items-center justify-center font-bold text-xs flex-shrink-0">
      ${isAi ? 'AI' : 'YOU'}
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs leading-relaxed max-w-2xl">
      <div class="font-bold text-slate-400 mb-1">${sender}</div>
      <div class="whitespace-pre-line">${text}</div>
      ${citationHtml}
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

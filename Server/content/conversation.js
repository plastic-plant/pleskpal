document.getElementById('send-button').addEventListener('click', () => {
    const message = document.getElementById('message-input').value;
    if (message) {
        document.getElementById('messages').innerHTML += `<div class="user">You: ${message}</div>`;
        window.external.sendMessage(JSON.stringify({command: 'ask', payload: message}));
        document.getElementById('message-input').value = '';
    }
});

window.external.receiveMessage(response => {
    document.getElementById('messages').innerHTML += `<div class="assistant">Assistant: ${response}</div>`;
});

window.external.sendMessage(JSON.stringify({ command: 'resize', payload: '1200x850' }));
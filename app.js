
const chat=document.getElementById('chat');
function add(t,c=''){chat.innerHTML+=`<div class="msg ${c}">${t}</div>`;chat.scrollTop=chat.scrollHeight}
add('Salut 👋 Je suis Xeben, ton assistant IA.')
function send(){
 let i=document.getElementById('msg');
 if(!i.value)return;
 let t=i.value;i.value='';
 add(t,'user');
 setTimeout(()=>add('Je suis en mode test. Connecte-moi à un serveur IA pour des réponses avancées.'),600);
}

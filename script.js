// script.js

// Carrega usuários e usuário atual do localStorage
let users = JSON.parse(localStorage.getItem("users") || "[]");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

// --- FUNÇÕES DE AUTENTICAÇÃO ---

function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  const user = users.find(u => u.email === email && u.senha === senha);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    location.href = "home.html";
  } else {
    alert("Email ou senha inválidos.");
  }
}

function cadastrar() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const fotoFile = document.getElementById("foto").files[0];

  if (!nome || !email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }
  if (users.some(u => u.email === email)) {
    alert("Email já cadastrado.");
    return;
  }

  if (fotoFile) {
    const reader = new FileReader();
    reader.onload = () => {
      salvarUsuarioNovo(nome, email, senha, reader.result);
    };
    reader.readAsDataURL(fotoFile);
  } else {
    salvarUsuarioNovo(nome, email, senha, null);
  }
}

function salvarUsuarioNovo(nome, email, senha, foto) {
  const novoUser = {
    nome,
    email,
    senha,
    foto: foto || "default-profile.png",
    posts: [],
    stories: [],
    seguidores: [],
    seguindo: []
  };
  users.push(novoUser);
  localStorage.setItem("users", JSON.stringify(users));
  alert("Conta criada com sucesso!");
  location.href = "index.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  location.href = "index.html";
}

// --- ATUALIZA USUÁRIO LOGADO NO LOCALSTORAGE ---

function salvarUsuarioAtualizado(user) {
  const idx = users.findIndex(u => u.email === user.email);
  if (idx !== -1) {
    users[idx] = user;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(user));
    currentUser = user;
  }
}

// --- FUNÇÕES PARA POSTS ---

function criarPostagem() {
  const texto = document.getElementById("postText").value.trim();
  const midiaFile = document.getElementById("postMedia").files[0];

  if (!texto && !midiaFile) {
    alert("Escreva algo ou selecione uma mídia para postar.");
    return;
  }

  if (midiaFile) {
    const reader = new FileReader();
    reader.onload = () => {
      adicionarPost(texto, reader.result);
    };
    reader.readAsDataURL(midiaFile);
  } else {
    adicionarPost(texto, null);
  }
}

function adicionarPost(texto, midia) {
  const post = {
    texto,
    midia,
    data: new Date().toISOString()
  };
  currentUser.posts.unshift(post);
  salvarUsuarioAtualizado(currentUser);
  mostrarFeed();
  limparFormPost();
}

function limparFormPost() {
  document.getElementById("postText").value = "";
  document.getElementById("postMedia").value = "";
}

// --- FUNÇÕES PARA STORIES ---

function criarStory() {
  const texto = document.getElementById("storyText").value.trim();
  const midiaFile = document.getElementById("storyMedia").files[0];

  if (!texto && !midiaFile) {
    alert("Escreva algo ou selecione uma mídia para postar.");
    return;
  }

  if (midiaFile) {
    const reader = new FileReader();
    reader.onload = () => {
      adicionarStory(texto, reader.result);
    };
    reader.readAsDataURL(midiaFile);
  } else {
    adicionarStory(texto, null);
  }
}

function adicionarStory(texto, midia) {
  const story = {
    texto,
    midia,
    data: new Date().toISOString()
  };
  currentUser.stories.unshift(story);
  salvarUsuarioAtualizado(currentUser);
  mostrarStories();
  limparFormStory();
}

function limparFormStory() {
  document.getElementById("storyText").value = "";
  document.getElementById("storyMedia").value = "";
}

// --- MOSTRAR FEED ---

function mostrarFeed() {
  const feed = document.getElementById("feedList");
  if (!feed) return;
  feed.innerHTML = "";

  // Mostrar posts de usuários que o currentUser segue + dele mesmo
  const feedUsers = users.filter(u =>
    currentUser.seguindo.includes(u.email) || u.email === currentUser.email
  );

  // Ordenar posts por data decrescente
  let allPosts = [];
  feedUsers.forEach(u => {
    u.posts.forEach(p => {
      allPosts.push({ user: u, post: p });
    });
  });
  allPosts.sort((a, b) => new Date(b.post.data) - new Date(a.post.data));

  allPosts.forEach(({ user, post }) => {
    const div = document.createElement("div");
    div.classList.add("post-item");
    div.innerHTML = `
      <strong>${user.nome}</strong> <small> - ${formatarData(post.data)}</small>
      <p>${escapeHTML(post.texto)}</p>
      ${post.midia ? criarMidiaHTML(post.midia) : ""}
    `;
    feed.appendChild(div);
  });
}

// --- MOSTRAR STORIES ---

let storyAtualIndex = 0;
let storiesParaMostrar = [];

function mostrarStories() {
  const storyList = document.getElementById("storyList");
  if (!storyList) return;
  storyList.innerHTML = "";

  // Mostrar stories do currentUser e dos que ele segue
  const storyUsers = users.filter(u =>
    currentUser.seguindo.includes(u.email) || u.email === currentUser.email
  );

  storiesParaMostrar = [];

  storyUsers.forEach(user => {
    user.stories.forEach(story => {
      storiesParaMostrar.push({ user, story });
    });
  });

  // Ordenar por data decrescente
  storiesParaMostrar.sort((a, b) => new Date(b.story.data) - new Date(a.story.data));

  storiesParaMostrar.forEach(({ user, story }, i) => {
    const div = document.createElement("div");
    div.classList.add("story-item");
    div.title = `Story de ${user.nome}`;
    div.onclick = () => abrirModalStory(i);
    div.innerHTML = `
      ${story.midia ? criarMidiaMiniHTML(story.midia) : `<div class="story-text">${escapeHTML(story.texto)}</div>`}
      <small>${user.nome}</small>
    `;
    storyList.appendChild(div);
  });

  if(storiesParaMostrar.length === 0) {
    storyList.innerHTML = "<p>Nenhum story disponível.</p>";
  }
}

// --- MODAL DE STORY FULLSCREEN ---

function abrirModalStory(index) {
  storyAtualIndex = index;
  atualizarModalStory();
  document.getElementById("modalStory").style.display = "flex";
}

function fecharModalStory() {
  document.getElementById("modalStory").style.display = "none";
}

function atualizarModalStory() {
  const modalContent = document.getElementById("storyFullscreenContent");
  const { user, story } = storiesParaMostrar[storyAtualIndex];
  modalContent.innerHTML = `
    ${story.midia ? criarMidiaFullHTML(story.midia) : ""}
    <p>${escapeHTML(story.texto)}</p>
    <small>Story de <strong>${user.nome}</strong></small>
  `;
}

function proximoStory() {
  storyAtualIndex = (storyAtualIndex + 1) % storiesParaMostrar.length;
  atualizarModalStory();
}

function anteriorStory() {
  storyAtualIndex = (storyAtualIndex - 1 + storiesParaMostrar.length) % storiesParaMostrar.length;
  atualizarModalStory();
}

// --- BUSCAR USUÁRIOS ---

const inputSearch = document.getElementById("searchUser");
const divSearchResults = document.getElementById("searchResults");

if (inputSearch) {
  inputSearch.addEventListener("input", () => {
    const val = inputSearch.value.trim().toLowerCase();
    if (val.length === 0) {
      divSearchResults.style.display = "none";
      divSearchResults.innerHTML = "";
      return;
    }

    const achados = users.filter(u =>
      u.nome.toLowerCase().includes(val) && u.email !== currentUser.email
    );

    if (achados.length === 0) {
      divSearchResults.innerHTML = `<p style="padding:10px;">Nenhum usuário encontrado.</p>`;
      divSearchResults.style.display = "block";
      return;
    }

    divSearchResults.innerHTML = "";
    achados.forEach(u => {
      const userDiv = document.createElement("div");
      userDiv.className = "user-item";
      userDiv.innerHTML = `
        <img src="${u.foto || 'default-profile.png'}" alt="Foto ${u.nome}" />
        <div class="user-name">${u.nome}</div>
      `;
      const btnSeguir = document.createElement("button");
      btnSeguir.innerText = currentUser.seguindo.includes(u.email) ? "Deixar de seguir" : "Seguir";
      btnSeguir.onclick = () => {
        toggleSeguir(u.email);
        btnSeguir.innerText = currentUser.seguindo.includes(u.email) ? "Deixar de seguir" : "Seguir";
        atualizarPerfil();
      };
      userDiv.appendChild(btnSeguir);
      divSearchResults.appendChild(userDiv);
    });
    divSearchResults.style.display = "block";
  });

  // Fecha resultados se clicar fora
  document.addEventListener("click", (e) => {
    if (!divSearchResults.contains(e.target) && e.target !== inputSearch) {
      divSearchResults.style.display = "none";
    }
  });
}

function toggleSeguir(emailSeguido) {
  if (currentUser.seguindo.includes(emailSeguido)) {
    // Deixar de seguir
    currentUser.seguindo = currentUser.seguindo.filter(e => e !== emailSeguido);
    const segUser = users.find(u => u.email === emailSeguido);
    if (segUser) {
      segUser.seguidores = segUser.seguidores.filter(e => e !== currentUser.email);
    }
  } else {
    // Seguir
    currentUser.seguindo.push(emailSeguido);
    const segUser = users.find(u => u.email === emailSeguido);
    if (segUser) {
      segUser.seguidores.push(currentUser.email);
    }
  }
  salvarUsuarioAtualizado(currentUser);
  // Atualiza o usuário seguido na lista geral
  const idx = users.findIndex(u => u.email === emailSeguido);
  if (idx !== -1) {
    users[idx] = users.find(u => u.email === emailSeguido);
  }
  localStorage.setItem("users", JSON.stringify(users));
  mostrarFeed();
  mostrarStories();
}

// --- MOSTRAR PERFIL E CONTAGEM DE SEGUIDORES ---

function atualizarPerfil() {
  if (!currentUser) return;
  document.getElementById("userName").innerText = currentUser.nome;
  document.getElementById("userPhoto").src = currentUser.foto || "default-profile.png";
  document.getElementById("followersCount").innerText = currentUser.seguidores.length;
  document.getElementById("followingCount").innerText = currentUser.seguindo.length;
}

// --- ALTERAR FOTO DE PERFIL ---

function abrirModalFoto() {
  document.getElementById("inputChangePhoto").click();
}

function alterarFotoPerfil(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentUser.foto = reader.result;
    salvarUsuarioAtualizado(currentUser);
    atualizarPerfil();
    alert("Foto de perfil atualizada!");
  };
  reader.readAsDataURL(file);
}

// --- FUNÇÕES AUXILIARES ---

function formatarData(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function criarMidiaHTML(src) {
  if (!src) return "";
  if (src.startsWith("data:video")) {
    return `<video controls width="100%"><source src="${src}" type="video/mp4">Seu navegador não suporta vídeo.</video>`;
  } else {
    return `<img src="${src}" alt="Mídia" />`;
  }
}

function criarMidiaMiniHTML(src) {
  if (!src) return "";
  if (src.startsWith("data:video")) {
    return `<video muted loop playsinline style="width:100%;height:80px;object-fit:cover;border-radius:12px;"><source src="${src}" type="video/mp4"></video>`;
  } else {
    return `<img src="${src}" alt="Story" />`;
  }
}

function criarMidiaFullHTML(src) {
  if (!src) return "";
  if (src.startsWith("data:video")) {
    return `<video controls autoplay style="max-width:100%; max-height:70vh; border-radius:12px;"><source src="${src}" type="video/mp4"></video>`;
  } else {
    return `<img src="${src}" alt="Story" />`;
  }
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- INICIALIZAÇÃO ---

window.onload = () => {
  if (window.location.pathname.endsWith("home.html")) {
    if (!currentUser) {
      location.href = "index.html";
      return;
    }
    atualizarPerfil();
    mostrarFeed();
    mostrarStories();
  }
};

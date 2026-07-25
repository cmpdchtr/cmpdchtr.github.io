// --- Clock Logic ---
function updateTime() {
  var currentTime = new Date().toLocaleTimeString();
  var timeElement = document.querySelector("#timeElement");
  timeElement.innerHTML = currentTime;
}
updateTime();
setInterval(updateTime, 1000);

// --- Window Manager System ---
var highestZIndex = 100;
var windowsConfig = {};
var taskbarApps = document.getElementById("taskbarApps");

function bringToFront(winEl) {
  highestZIndex++;
  winEl.style.zIndex = highestZIndex;
}

function initWindow(appId) {
  var winEl = document.getElementById(appId);
  var btnClose = document.getElementById(appId + "close");
  var btnMin = document.getElementById(appId + "min");
  var btnMax = document.getElementById(appId + "max");

  windowsConfig[appId] = { isMaximized: false, taskbarBtn: null };
  dragElement(winEl);

  winEl.addEventListener("mousedown", function() {
    bringToFront(winEl);
  });

  if(btnClose) btnClose.addEventListener("click", function() { closeWindow(appId); });
  if(btnMin) btnMin.addEventListener("click", function() { minimizeWindow(appId); });
  if(btnMax) btnMax.addEventListener("click", function() { toggleMaximize(appId); });
}

function openWindow(appId, appName, iconSrc) {
  var winEl = document.getElementById(appId);
  if (!windowsConfig[appId]) initWindow(appId);
  
  var config = windowsConfig[appId];

  // Restore logic
  if (!winEl.classList.contains("hidden") && config.taskbarBtn) {
    bringToFront(winEl);
    return;
  }
  if (winEl.classList.contains("hidden") && config.taskbarBtn) {
    restoreWindow(appId);
    return;
  }

  // Create Taskbar Button
  if (!config.taskbarBtn) {
    var btn = document.createElement("div");
    btn.className = "taskbar-app active";
    btn.innerHTML = `<img src="${iconSrc}" alt="Icon"><span>${appName}</span>`;
    btn.addEventListener("click", function() {
      if (winEl.classList.contains("hidden")) {
        restoreWindow(appId);
      } else {
        if (winEl.style.zIndex == highestZIndex) {
          minimizeWindow(appId);
        } else {
          bringToFront(winEl);
        }
      }
    });
    taskbarApps.appendChild(btn);
    config.taskbarBtn = btn;
  }

  winEl.classList.remove("hidden");
  config.taskbarBtn.style.display = "flex";
  setTimeout(() => {
    if(config.taskbarBtn) {
      config.taskbarBtn.style.transform = "scale(1)";
      config.taskbarBtn.style.opacity = "1";
    }
  }, 10);
  config.taskbarBtn.classList.add("active");
  bringToFront(winEl);
}

function closeWindow(appId) {
  var winEl = document.getElementById(appId);
  var config = windowsConfig[appId];
  winEl.classList.add("hidden");
  if (config.taskbarBtn) {
    config.taskbarBtn.style.transform = "scale(0.5)";
    config.taskbarBtn.style.opacity = "0";
    setTimeout(() => {
      if(config.taskbarBtn) config.taskbarBtn.remove();
      config.taskbarBtn = null;
    }, 300);
  }
}

function minimizeWindow(appId) {
  var winEl = document.getElementById(appId);
  var config = windowsConfig[appId];
  winEl.classList.add("hidden");
  if(config.taskbarBtn) config.taskbarBtn.classList.remove("active");
}

function restoreWindow(appId) {
  var winEl = document.getElementById(appId);
  var config = windowsConfig[appId];
  winEl.classList.remove("hidden");
  if(config.taskbarBtn) config.taskbarBtn.classList.add("active");
  bringToFront(winEl);
}

function toggleMaximize(appId) {
  var winEl = document.getElementById(appId);
  var config = windowsConfig[appId];
  if (config.isMaximized) {
    winEl.classList.remove("maximized");
    config.isMaximized = false;
  } else {
    winEl.classList.add("maximized");
    config.isMaximized = true;
  }
  bringToFront(winEl);
}

// --- Dragging Logic ---
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    var config = windowsConfig[elmnt.id];
    if (config && config.isMaximized) return; 
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    elmnt.style.transition = "none";
    bringToFront(elmnt);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    elmnt.style.transition = "";
  }
}

// --- Start Menu Logic ---
var startMenu = document.getElementById("startMenu");
var startOrb = document.getElementById("welcomeopen");

startOrb.addEventListener("click", function(e) {
  e.stopPropagation();
  startMenu.classList.toggle("hidden");
});

document.body.addEventListener("click", function(e) {
  if (!startMenu.contains(e.target) && e.target !== startOrb) {
    startMenu.classList.add("hidden");
  }
});

// Start Search
var startSearchInput = document.getElementById("startSearchInput");
startSearchInput.addEventListener("input", function(e) {
  var val = e.target.value.toLowerCase();
  var items = document.querySelectorAll(".start-left .start-item");
  items.forEach(item => {
    var text = item.innerText.toLowerCase();
    if (text.includes(val)) item.style.display = "flex";
    else item.style.display = "none";
  });
});

document.getElementById("startWelcome").addEventListener("click", function() {
  openWindow("welcome", "Welcome", "./avatar.jpg");
  startMenu.classList.add("hidden");
});

document.getElementById("startNotes").addEventListener("click", function() {
  openWindow("notesApp", "Notes", "./notes_icon.jpg");
  startMenu.classList.add("hidden");
});

document.getElementById("startExplorer").addEventListener("click", function() {
  openWindow("explorerApp", "My Projects", "./explorer_icon.jpg");
  navigateTo("Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects");
  startMenu.classList.add("hidden");
});

document.getElementById("startMinesweeper").addEventListener("click", function() {
  openWindow("minesweeperApp", "Minesweeper", "./mine_icon.jpg");
  startMenu.classList.add("hidden");
});

// Start Right Links
document.getElementById("startDocs").addEventListener("click", () => {
  openWindow("explorerApp", "My Projects", "./explorer_icon.jpg");
  navigateTo("Documents");
  startMenu.classList.add("hidden");
});
document.getElementById("startPics").addEventListener("click", () => {
  openWindow("explorerApp", "My Projects", "./explorer_icon.jpg");
  navigateTo("Pictures");
  startMenu.classList.add("hidden");
});
document.getElementById("startMusic").addEventListener("click", () => {
  openWindow("explorerApp", "My Projects", "./explorer_icon.jpg");
  navigateTo("Music");
  startMenu.classList.add("hidden");
});
document.getElementById("startCP").addEventListener("click", () => {
  alert("Control Panel is locked by Administrator.");
});
document.getElementById("startDP").addEventListener("click", () => {
  alert("No devices connected.");
});
document.getElementById("startDef").addEventListener("click", () => {
  alert("Default programs are already set.");
});

// Shut Down Logic
document.getElementById("startShutdown").addEventListener("click", function() {
  document.body.innerHTML = "";
  document.body.style.background = "#000";
  document.body.style.display = "flex";
  document.body.style.justifyContent = "center";
  document.body.style.alignItems = "center";
  document.body.style.flexDirection = "column";
  document.body.style.color = "#fff";
  
  document.body.innerHTML = `
    <img src="./avatar.jpg" style="width:80px; height:80px; border-radius:50%; margin-bottom:20px; border:2px solid #fff; box-shadow:0 0 20px rgba(255,255,255,0.5);">
    <h2 style="font-weight:300;">Shutting down...</h2>
  `;
});

// Initialize Welcome window on start
initWindow("welcome");
windowsConfig["welcome"].taskbarBtn = document.createElement("div");
windowsConfig["welcome"].taskbarBtn.className = "taskbar-app active";
windowsConfig["welcome"].taskbarBtn.innerHTML = '<img src="./avatar.jpg" alt="Icon"><span>Welcome</span>';
windowsConfig["welcome"].taskbarBtn.addEventListener("click", function() {
    var winEl = document.getElementById("welcome");
    if (winEl.classList.contains("hidden")) restoreWindow("welcome");
    else {
      if (winEl.style.zIndex == highestZIndex) minimizeWindow("welcome");
      else bringToFront(winEl);
    }
});
taskbarApps.appendChild(windowsConfig["welcome"].taskbarBtn);
bringToFront(document.getElementById("welcome"));


// --- Notes App Content Logic (EDITABLE) ---
var notesData = [
  { title: "Project Ideas", date: "07/25/2026", text: "1. Build WebOS\n2. Add smooth animations\n3. Win Star Dance prize!" },
  { title: "Shopping List", date: "07/24/2026", text: "- Coffee\n- Mechanical keyboard\n- More coffee\n- Energy drinks" },
  { title: "To-Do", date: "07/20/2026", text: "Fix bugs in dragging logic. (Done!)\nUpdate aesthetic to Windows 7. (Done!)\nImplement dynamic windows. (Done!)" }
];

var sidebarEl = document.getElementById("notesSidebar");
var contentTitle = document.getElementById("noteTitle");
var contentDate = document.getElementById("noteDate");
var contentText = document.getElementById("noteText");
var activeNoteIndex = 0;

function renderNotesSidebar() {
  sidebarEl.innerHTML = "";
  notesData.forEach(function(note, index) {
    var item = document.createElement("div");
    item.className = "sidebar-item";
    if (index === activeNoteIndex) item.classList.add("selected");
    item.innerHTML = `<strong>${note.title || "Untitled"}</strong><span>${note.date}</span>`;
    
    item.addEventListener("click", function() {
      activeNoteIndex = index;
      renderNotesSidebar();
      loadNoteIntoView(index);
    });
    sidebarEl.appendChild(item);
  });
}

function loadNoteIntoView(index) {
  if(!notesData[index]) return;
  var note = notesData[index];
  contentTitle.value = note.title;
  contentDate.innerHTML = note.date;
  contentText.value = note.text;
}

contentTitle.addEventListener("input", function(e) {
  if(notesData[activeNoteIndex]) {
    notesData[activeNoteIndex].title = e.target.value;
    renderNotesSidebar();
  }
});

contentText.addEventListener("input", function(e) {
  if(notesData[activeNoteIndex]) {
    notesData[activeNoteIndex].text = e.target.value;
  }
});

document.getElementById("newNoteBtn").addEventListener("click", function() {
  notesData.unshift({
    title: "New Note",
    date: new Date().toLocaleDateString(),
    text: ""
  });
  activeNoteIndex = 0;
  renderNotesSidebar();
  loadNoteIntoView(0);
});

renderNotesSidebar();
loadNoteIntoView(0);


// --- Explorer App Content Logic (FULL FILESYSTEM) ---
var fileSystem = {
  "Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects": [
    { name: "WebOS", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects ▸ WebOS" },
    { name: "StarDance.exe", type: "app", icon: "./avatar.jpg", app: "welcome" },
    { name: "Minesweeper.exe", type: "app", icon: "./mine_icon.jpg", app: "minesweeperApp" },
    { name: "Ideas.txt", type: "file", icon: "./notes_icon.jpg" }
  ],
  "Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects ▸ WebOS": [
    { name: "index.html", type: "file", icon: "./notes_icon.jpg" },
    { name: "style.css", type: "file", icon: "./notes_icon.jpg" },
    { name: "script.js", type: "file", icon: "./notes_icon.jpg" }
  ],
  "Desktop": [],
  "Downloads": [
    { name: "StarDance.exe", type: "app", icon: "./avatar.jpg", app: "welcome" }
  ],
  "Documents": [
    { name: "Ideas.txt", type: "file", icon: "./notes_icon.jpg" }
  ],
  "Music": [],
  "Pictures": [],
  "Computer": [
    { name: "OS (C:)", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:)" }
  ],
  "Computer ▸ OS (C:)": [
    { name: "Users", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Users" },
    { name: "Windows", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Windows" }
  ],
  "Computer ▸ OS (C:) ▸ Users": [
    { name: "Hacker", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Users ▸ Hacker" }
  ],
  "Computer ▸ OS (C:) ▸ Users ▸ Hacker": [
    { name: "Desktop", type: "folder", icon: "./explorer_icon.jpg", target: "Desktop" },
    { name: "Downloads", type: "folder", icon: "./explorer_icon.jpg", target: "Downloads" },
    { name: "Documents", type: "folder", icon: "./explorer_icon.jpg", target: "Documents" },
    { name: "Projects", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects" }
  ],
  "Computer ▸ OS (C:) ▸ Windows": [
    { name: "System32", type: "folder", icon: "./explorer_icon.jpg", target: "Computer ▸ OS (C:) ▸ Windows ▸ System32" }
  ],
  "Computer ▸ OS (C:) ▸ Windows ▸ System32": [
    { name: "cmd.exe", type: "app", icon: "./explorer_icon.jpg", app: "welcome" }
  ]
};

var currentPath = "Computer ▸ OS (C:) ▸ Users ▸ Hacker ▸ Projects";
var pathHistory = [currentPath];
var historyIndex = 0;

var projectsGrid = document.getElementById("projectsGrid");
var pathText = document.querySelector(".path-text");
var explBackBtn = document.getElementById("explBackBtn");
var explFwdBtn = document.getElementById("explFwdBtn");
var sidebarListItems = document.querySelectorAll("#explorerSidebarList li:not(.tree-header)");

function navigateTo(path, recordHistory = true) {
  if (!fileSystem[path]) fileSystem[path] = []; // fallback if path is empty
  
  if (recordHistory && path !== currentPath) {
    pathHistory = pathHistory.slice(0, historyIndex + 1);
    pathHistory.push(path);
    historyIndex++;
  }
  
  currentPath = path;
  pathText.innerText = path;
  
  // Highlight sidebar
  sidebarListItems.forEach(item => {
    item.classList.remove("tree-active");
    var txt = item.innerText.trim();
    if (txt === path || (path.endsWith(txt) && txt !== "Computer")) {
      item.classList.add("tree-active");
    }
  });

  renderExplorer();
}

explBackBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    historyIndex--;
    navigateTo(pathHistory[historyIndex], false);
  }
});

explFwdBtn.addEventListener("click", () => {
  if (historyIndex < pathHistory.length - 1) {
    historyIndex++;
    navigateTo(pathHistory[historyIndex], false);
  }
});

sidebarListItems.forEach(item => {
  item.addEventListener("click", () => {
    var name = item.innerText.trim();
    if (["Desktop", "Downloads", "Documents", "Pictures", "Music"].includes(name)) {
      navigateTo(name);
    } else if (name === "OS (C:)") {
      navigateTo("Computer ▸ OS (C:)");
    } else if (name === "Recent Places") {
      if (pathHistory.length > 1) {
        navigateTo(pathHistory[pathHistory.length - 2]);
      }
    }
  });
});

function renderExplorer() {
  projectsGrid.innerHTML = "";
  var data = fileSystem[currentPath] || [];
  
  if (data.length === 0) {
    projectsGrid.innerHTML = "<div style='width:100%; padding:20px; color:#888; font-size:14px;'>This folder is empty.</div>";
    return;
  }
  
  data.forEach(function(proj) {
    var item = document.createElement("div");
    item.className = "file-icon";
    item.innerHTML = `<img src="${proj.icon}" alt="icon"><span>${proj.name}</span>`;
    
    item.addEventListener("click", function(e) {
      e.stopPropagation();
      var items = projectsGrid.getElementsByClassName("file-icon");
      for(var i=0; i<items.length; i++) items[i].classList.remove("selected");
      item.classList.add("selected");
    });
    
    item.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      item.classList.remove("selected");
      if (proj.type === "file") {
        openWindow("notesApp", "Notes", "./notes_icon.jpg");
      } else if (proj.type === "app") {
        openWindow(proj.app, proj.name, proj.icon);
      } else if (proj.type === "folder") {
        navigateTo(proj.target);
      }
    });
    
    projectsGrid.appendChild(item);
  });
}

projectsGrid.addEventListener("click", function(e) {
  if (e.target === projectsGrid) {
    var items = projectsGrid.getElementsByClassName("file-icon");
    for(var i=0; i<items.length; i++) items[i].classList.remove("selected");
  }
});

// Initial Render
navigateTo(currentPath, false);

// --- Minesweeper Logic ---
var mineConfig = { rows: 9, cols: 9, mines: 10 };
var mineGridData = [];
var mineGameOver = false;
var mineFlags = 0;
var mineTimer = 0;
var mineInterval = null;
var mineFirstClick = true;

var mineGridEl = document.getElementById("mineGrid");
var mineFaceEl = document.getElementById("mineFace");
var mineCountEl = document.getElementById("mineCountDisplay");
var mineTimerEl = document.getElementById("mineTimerDisplay");

var mineFaces = {
  normal: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="1.5"/><rect x="8" y="8" width="2" height="3" fill="#000"/><rect x="14" y="8" width="2" height="3" fill="#000"/><path d="M 8 15 Q 12 18 16 15" stroke="#000" stroke-width="1.5" fill="none"/></svg>',
  ooh: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="1.5"/><rect x="8" y="8" width="2" height="3" fill="#000"/><rect x="14" y="8" width="2" height="3" fill="#000"/><circle cx="12" cy="16" r="2.5" stroke="#000" stroke-width="1.5" fill="none"/></svg>',
  dead: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="1.5"/><path d="M 7 8 L 10 11 M 10 8 L 7 11" stroke="#000" stroke-width="1.5"/><path d="M 14 8 L 17 11 M 17 8 L 14 11" stroke="#000" stroke-width="1.5"/><path d="M 8 16 Q 12 13 16 16" stroke="#000" stroke-width="1.5" fill="none"/></svg>',
  win: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="1.5"/><path d="M 4 9 L 20 9" stroke="#000" stroke-width="2"/><path d="M 5 9 L 5 12 A 3 3 0 0 0 11 12 L 11 9 Z" fill="#000"/><path d="M 13 9 L 13 12 A 3 3 0 0 0 19 12 L 19 9 Z" fill="#000"/><path d="M 8 16 Q 12 19 16 16" stroke="#000" stroke-width="1.5" fill="none"/></svg>'
};

function pad(num) { return num.toString().padStart(3, '0'); }

function initMinesweeper() {
  mineGameOver = false;
  mineFirstClick = true;
  mineFlags = 0;
  mineTimer = 0;
  mineCountEl.innerText = pad(mineConfig.mines);
  mineTimerEl.innerText = pad(0);
  mineFaceEl.innerHTML = mineFaces.normal;
  clearInterval(mineInterval);
  
  mineGridData = [];
  mineGridEl.innerHTML = "";
  
  for (let r = 0; r < mineConfig.rows; r++) {
    let row = [];
    for (let c = 0; c < mineConfig.cols; c++) {
      let cell = { r, c, isMine: false, revealed: false, flagged: false, count: 0 };
      row.push(cell);
      
      let div = document.createElement("div");
      div.className = "mine-cell";
      div.id = `mine_${r}_${c}`;
      
      div.addEventListener("mousedown", (e) => {
        if (mineGameOver) return;
        if (e.button === 0 && !cell.revealed && !cell.flagged) {
          mineFaceEl.innerHTML = mineFaces.ooh;
        }
      });
      div.addEventListener("mouseup", (e) => {
        if (mineGameOver) return;
        mineFaceEl.innerHTML = mineFaces.normal;
        if (e.button === 0) revealMine(r, c);
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });
      
      mineGridEl.appendChild(div);
    }
    mineGridData.push(row);
  }
}

function placeMines(firstR, firstC) {
  let placed = 0;
  while(placed < mineConfig.mines) {
    let r = Math.floor(Math.random() * mineConfig.rows);
    let c = Math.floor(Math.random() * mineConfig.cols);
    if (!mineGridData[r][c].isMine && !(r === firstR && c === firstC)) {
      mineGridData[r][c].isMine = true;
      placed++;
    }
  }
  for (let r = 0; r < mineConfig.rows; r++) {
    for (let c = 0; c < mineConfig.cols; c++) {
      if (!mineGridData[r][c].isMine) {
        let count = 0;
        for(let i=-1; i<=1; i++) {
          for(let j=-1; j<=1; j++) {
            if(r+i>=0 && r+i<mineConfig.rows && c+j>=0 && c+j<mineConfig.cols) {
              if (mineGridData[r+i][c+j].isMine) count++;
            }
          }
        }
        mineGridData[r][c].count = count;
      }
    }
  }
}

function toggleFlag(r, c) {
  if (mineGameOver) return;
  let cell = mineGridData[r][c];
  if (cell.revealed) return;
  
  let el = document.getElementById(`mine_${r}_${c}`);
  if (cell.flagged) {
    cell.flagged = false;
    el.classList.remove("flagged");
    mineFlags--;
  } else {
    cell.flagged = true;
    el.classList.add("flagged");
    mineFlags++;
  }
  mineCountEl.innerText = pad(mineConfig.mines - mineFlags);
}

function revealMine(r, c) {
  if (mineGameOver) return;
  let cell = mineGridData[r][c];
  if (cell.revealed || cell.flagged) return;
  
  if (mineFirstClick) {
    mineFirstClick = false;
    placeMines(r, c);
    mineInterval = setInterval(() => {
      mineTimer++;
      if (mineTimer > 999) mineTimer = 999;
      mineTimerEl.innerText = pad(mineTimer);
    }, 1000);
  }
  
  let el = document.getElementById(`mine_${r}_${c}`);
  cell.revealed = true;
  el.classList.add("revealed");
  
  if (cell.isMine) {
    mineGameOver = true;
    clearInterval(mineInterval);
    mineFaceEl.innerHTML = mineFaces.dead;
    el.classList.add("bomb-exploded");
    for(let i=0; i<mineConfig.rows; i++){
      for(let j=0; j<mineConfig.cols; j++){
        if(mineGridData[i][j].isMine && !(i===r && j===c)){
          document.getElementById(`mine_${i}_${j}`).classList.add("revealed", "bomb-revealed");
        }
      }
    }
    return;
  }
  
  if (cell.count > 0) {
    el.innerText = cell.count;
    el.classList.add(`mine-${cell.count}`);
  } else {
    for(let i=-1; i<=1; i++) {
      for(let j=-1; j<=1; j++) {
        if(r+i>=0 && r+i<mineConfig.rows && c+j>=0 && c+j<mineConfig.cols) {
          revealMine(r+i, c+j);
        }
      }
    }
  }
  checkWin();
}

function checkWin() {
  let revealedCount = 0;
  for(let i=0; i<mineConfig.rows; i++){
    for(let j=0; j<mineConfig.cols; j++){
      if(mineGridData[i][j].revealed) revealedCount++;
    }
  }
  if (revealedCount === (mineConfig.rows * mineConfig.cols) - mineConfig.mines) {
    mineGameOver = true;
    clearInterval(mineInterval);
    mineFaceEl.innerHTML = mineFaces.win;
    mineCountEl.innerText = pad(0);
    for(let i=0; i<mineConfig.rows; i++){
      for(let j=0; j<mineConfig.cols; j++){
        if(mineGridData[i][j].isMine && !mineGridData[i][j].flagged) {
          document.getElementById(`mine_${i}_${j}`).classList.add("flagged");
        }
      }
    }
  }
}

mineFaceEl.addEventListener("click", initMinesweeper);
initMinesweeper();

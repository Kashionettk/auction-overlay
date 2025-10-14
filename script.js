let totalSeconds = 180;
let timerEl = document.getElementById("timer");
let donatorEl = document.getElementById("donator");
let topListEl = document.getElementById("topList");
let topDonors = [];

function updateTimer() {
  let m = Math.floor(totalSeconds / 60);
  let s = totalSeconds % 60;
  timerEl.textContent = `${m}:${s.toString().padStart(2,"0")}`;
  if (totalSeconds > 0) {
    totalSeconds--;
    setTimeout(updateTimer, 1000);
  } else {
    const winner = topDonors[0]?.name || "— niemand —";
    donatorEl.textContent = `🏆 ${winner} hat gewonnen!`;
  }
}
updateTimer();

function flash() {
  timerEl.classList.add("flash");
  setTimeout(() => timerEl.classList.remove("flash"), 600);
}

window.updateDonator = function(name, amount) {
  flash();
  totalSeconds = 180;
  donatorEl.textContent = `${name} — ${amount} Coins`;

  // Update top list
  let existing = topDonors.find(d => d.name === name);
  if (existing) existing.amount += amount;
  else topDonors.push({ name, amount });

  topDonors.sort((a, b) => b.amount - a.amount);
  topDonors = topDonors.slice(0, 3);
  renderTopList();
};

function renderTopList() {
  topListEl.innerHTML = topDonors
    .map((d, i) => `<li>${i+1}) ${d.name} — ${d.amount} Coins</li>`)
    .join("");
}
